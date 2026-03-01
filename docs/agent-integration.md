# Agent Integration

`geo-lint` is a **deterministic rule engine**. Same content in, same violations out, every time. Your AI agent provides the creativity to fix the content; the linter provides the guardrails to verify it's correct. The loop runs until violations hit zero -- no human in the middle.

This is the key design principle: **the linter never guesses, the agent never validates**. Each does what it's best at.

---

## Quick Start -- Just Paste This Into Your Agent

### Claude Code (Recommended)

Install the geo-lint skill as a Claude Code plugin:

```bash
curl -fsSL https://raw.githubusercontent.com/IJONIS/geo-lint/main/install.sh | bash
```

Then use `/geo-lint audit` to validate and fix your entire content directory automatically. The skill runs the full lint-fix loop with parallel subagents -- one per file.

Available commands:

```
/geo-lint audit        # Full sweep with parallel fixing
/geo-lint fix <slug>   # Fix a single content file
/geo-lint rules        # Show all 92 rules with fix strategies
/geo-lint init         # Set up geo-lint.config.ts
/geo-lint report       # Generate a GEO/SEO health summary
```

**Manual alternative:** If you prefer not to install the plugin, paste this into any Claude Code session:

```
Run npx geo-lint --format=json, then fix every violation in the reported
files using each violation's suggestion field. After fixing, re-run the
linter and repeat until the output is an empty array []. Preserve the
author's voice -- restructure, don't rewrite.
```

### Cursor / Windsurf / Copilot

Open the agent chat and paste:

```
Install @ijonis/geo-lint as a dev dependency. Run npx geo-lint --format=json
to get a JSON array of content violations. For each violation, open the
file listed in the "file" field, apply the fix described in "suggestion",
and save. Then re-run npx geo-lint --format=json. Repeat until the output
is an empty array. Fix errors first, then warnings. Don't fabricate
statistics or data -- skip violations that require real sources and report
them to me.
```

### Any agent that can run shell commands

The pattern is always the same:

1. Run `npx geo-lint --format=json`
2. Parse the JSON array
3. For each violation, apply the `suggestion` to the `file`
4. Re-run, repeat until `[]`

The JSON output has no ANSI formatting, no terminal colors -- pure structured data. Any agent that can execute shell commands and edit files can consume it.

---

## How It Works

```
┌─────────────────────────────────────────────────┐
│  You: "Optimize my blog posts for AI search"    │
└──────────────────┬──────────────────────────────┘
                   v
┌─────────────────────────────────────────────────┐
│  Agent runs: npx geo-lint --format=json         │
│  <- Gets structured violations with fix guidance│
└──────────────────┬──────────────────────────────┘
                   v
┌─────────────────────────────────────────────────┐
│  Agent reads each violation's `suggestion`      │
│  Opens the file, applies the fix, saves it      │
└──────────────────┬──────────────────────────────┘
                   v
┌─────────────────────────────────────────────────┐
│  Agent re-runs: npx geo-lint --format=json      │
│  Loops until violations = 0                     │
└──────────────────┬──────────────────────────────┘
                   v
┌─────────────────────────────────────────────────┐
│  Done. Content is GEO-optimized.                │
└─────────────────────────────────────────────────┘
```

The entire loop is hands-off. Three fields make this possible:

- **`suggestion`** -- a plain-language instruction the agent follows to fix the violation.
- **`fixStrategy`** -- a machine-readable fix description for the rule itself.
- **`file`, `field`, `line`** -- exact location so the agent edits the right place.

---

## JSON Output

Run with `--format=json` to get machine-readable output:

```bash
npx geo-lint --format=json
```

```json
[
  {
    "file": "blog/my-post",
    "field": "body",
    "rule": "geo-no-question-headings",
    "severity": "warning",
    "message": "Only 1/5 (20%) H2/H3 headings are question-formatted",
    "suggestion": "Rephrase some headings as questions (e.g., 'How does X work?') to improve LLM snippet extraction."
  },
  {
    "file": "blog/my-post",
    "field": "body",
    "rule": "geo-missing-table",
    "severity": "warning",
    "message": "No data table found in long-form content",
    "suggestion": "Add a comparison table, feature matrix, or data summary table."
  }
]
```

No ANSI colors. No human-friendly formatting. Pure structured data that any agent can parse and act on.

---

## Rule Discovery

Before fixing anything, an agent can learn every rule and its fix strategy in one call:

```bash
npx geo-lint --rules
```

```json
[
  {
    "name": "geo-no-question-headings",
    "severity": "warning",
    "category": "geo",
    "fixStrategy": "Rephrase some headings as questions (e.g., 'How does X work?')"
  }
]
```

This returns the full rule catalog. The agent can use `fixStrategy` to understand the general approach for each rule before encountering specific violations.

---

## Claude Code Plugin

The recommended way to use geo-lint with Claude Code is the installable plugin:

```bash
curl -fsSL https://raw.githubusercontent.com/IJONIS/geo-lint/main/install.sh | bash
```

This installs:
- **`/geo-lint` skill** -- orchestrator with 5 sub-commands (audit, fix, rules, init, report)
- **`geo-lint-fixer` agent** -- autonomous subagent for parallel file fixing
- **Rule reference** -- all 92 rules with fix strategies, loaded on demand

To uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/IJONIS/geo-lint/main/uninstall.sh | bash
```

### Manual Setup (Alternative)

If you prefer not to install the plugin, add this to `.claude/skills/geo-lint.md` in your project:

```markdown
## GEO Lint & Fix

1. Run `npx geo-lint --format=json` and capture output
2. Parse the JSON array of violations
3. Group violations by file
4. For each file:
   - Read the MDX file
   - For each violation, apply the fix described in `suggestion`
   - Preserve the author's voice -- don't rewrite, restructure
5. Re-run `npx geo-lint --format=json`
6. If violations remain, repeat from step 4 (max 5 passes)
7. Report: files changed, violations fixed, any remaining issues
```

Works with **Claude Code**, **Cursor**, **Windsurf**, **Copilot**, or any agent that can run shell commands and edit files.

---

## Single File Fix Workflow

Use this workflow when an agent needs to bring one specific file to zero violations.

1. **Run the linter** and capture JSON output:
   ```bash
   npx geo-lint --format=json --root=<project-root>
   ```

2. **Filter** the array to violations where `file` matches the target slug.

3. **Fix all violations** in one edit pass:
   - Read the file from disk.
   - For each violation, apply the fix described in its `suggestion` field.
   - Fix `error` severity items first, then `warning`.
   - Preserve the author's voice -- restructure where needed, do not rewrite content wholesale.

4. **Re-run the linter** and filter to the target file again.

5. **Repeat** from step 3 if violations remain.

6. **Stop after 5 iterations**. If violations persist after 5 passes, report:
   - Which rules still have violations.
   - The `fixStrategy` for each.
   - Why they could not be resolved (escalate to the user).

---

## Violations Requiring Human Input

Some violations cannot be fixed autonomously. Flag these immediately rather than guessing:

| Rule | Why it needs human input |
|------|--------------------------|
| `geo-low-citation-density` | Requires real statistics; never fabricate numbers |
| `image-not-found` | A real image file must exist on disk |
| `broken-internal-link` | The target page may not exist yet |
| `category-invalid` | Valid categories come from `geo-lint.config.ts`; do not invent new ones |

When an agent encounters these, it should skip the violation, note the rule name and file, and surface the issue to the user for manual resolution.

---

For installation, quick start, and the full rule reference, see the [main README](../README.md).
