# Agent Integration

This linter is built for AI agents. The agent runs it, reads structured violations, fixes the content, and re-runs until clean. Every rule includes machine-readable `suggestion` and `fixStrategy` fields -- no human interpretation needed.

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

## Claude Code Skill Template

Add this to your project's `.claude/skills/` and the agent will optimize your content autonomously:

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
6. If violations remain, repeat from step 4 (max 3 passes)
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
