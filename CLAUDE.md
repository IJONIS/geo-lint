# CLAUDE.md — geo-lint

This file gives AI agents the context needed to work in this repository and to run the iterative lint-fix loop on content.

## What this project is

`@ijonis/geo-lint` is a CLI and programmatic linter for Markdown/MDX content. It validates SEO and GEO (Generative Engine Optimization) rules and outputs structured violations that agents consume, fix, and re-lint.

The primary use case is agentic: run the linter, read violations, fix the content, re-lint until clean.

## Local dev commands

```bash
npm ci                   # Install dependencies (always use ci, not install)
npm run build            # Compile TypeScript to dist/
npm run dev              # Watch mode build
npm test                 # Run all tests
npm run typecheck        # Type-check without emitting
npm run test:coverage    # Tests with coverage report
```

## Running the linter

```bash
# Human-readable output with ANSI colors
npx geo-lint --root=.

# Machine-readable JSON — use this in all agentic workflows
npx geo-lint --format=json --root=.

# List every rule with its fix strategy
npx geo-lint --rules
```

## JSON output shape

Each violation is an object in a flat array:

```json
{
  "file": "blog/my-post",
  "field": "body",
  "rule": "geo-no-question-headings",
  "severity": "warning",
  "message": "Only 1/5 headings are question-formatted",
  "suggestion": "Rephrase some headings as questions to improve LLM snippet extraction.",
  "line": 12
}
```

Key fields:
- `file` — content slug, not the full path. Resolve to `content/<type>/<file>.mdx` on disk.
- `suggestion` — plain-language fix instruction. Follow it directly when editing the file.
- `severity` — fix `error` violations first; they produce a non-zero exit code.
- `fixStrategy` — rule-level fix pattern, available via `npx geo-lint --rules`.

An empty array `[]` means zero violations — the content is clean.

## Rule categories

| Category  | Count | What it checks |
|-----------|-------|----------------|
| SEO       | 27    | titles, descriptions, headings, slugs, links, images, schema |
| GEO       | 35    | AI citation readiness: E-E-A-T signals, content structure, freshness, RAG optimization, question headings, FAQ sections, tables, entity density |
| Content   | 7     | word count, readability, dates, categories |
| Technical | 9     | broken links, image files, external URLs |
| i18n      | 2     | translation pairs, locale metadata |

## Codebase conventions

- `src/rules/<category>-rules.ts` — one file per rule category; exports a rule array or factory function
- Every rule requires: `name` (kebab-case), `severity`, `run()` returning `LintResult[]`, `fixStrategy`
- To add a rule: add to category file → register in `src/rules/index.ts` → write unit test → add README row
- Config is loaded from `geo-lint.config.ts` via `jiti` (TypeScript-native, no compilation step needed)
- `src/adapters/mdx.ts` is the default content adapter; implement `ContentAdapter` for custom sources
- `src/reporter.ts` handles both pretty (ANSI) and JSON output formatting

---

## Workflow A: Fix a single content file

Use this to bring one specific file to zero violations.

### Steps

1. Run the linter and capture JSON output:
   ```bash
   npx geo-lint --format=json --root=<project-root>
   ```

2. Filter the array to violations where `file` matches your target slug.

3. Fix all violations in one edit pass:
   - Read the MDX file from disk
   - For each violation, apply the fix described in its `suggestion` field
   - Fix `error` severity items first, then `warning`
   - Preserve the author's voice — restructure where needed, do not rewrite content wholesale

4. Re-run the linter and filter to your target file again.

5. If violations remain, repeat from step 3.

6. Stop after 5 iterations maximum. If violations persist after 5 passes, stop and report:
   - Which rules still have violations
   - The `fixStrategy` for each
   - Why they could not be resolved (escalate to the user)

### Violations that need human input

Some violations cannot be fixed autonomously — flag these immediately rather than guessing:

| Rule | Why it needs human input |
|------|--------------------------|
| `geo-low-citation-density` | Requires real statistics; never fabricate numbers |
| `image-not-found` | A real image file must exist on disk |
| `broken-internal-link` | The target page may not exist yet |
| `category-invalid` | Valid categories come from `geo-lint.config.ts`; do not invent new ones |

---

## Workflow B: Full directory sweep with parallel sub-agents

Use this to bring the entire content directory to zero violations.

### Steps

1. Run the linter across the full project:
   ```bash
   npx geo-lint --format=json --root=<project-root>
   ```

2. Parse the JSON array. Group violations by the `file` field — each unique value is one content piece.

3. Dispatch one sub-agent per file in parallel (agent type: `general-purpose`).
   Each sub-agent receives: the resolved file path, its filtered violations list, and instructions to follow Workflow A.

4. For large directories (more than 20 files with violations), batch into waves of 5–10 files to avoid overloading the task queue.

5. Collect completion reports from all sub-agents.

6. Run a final full lint to confirm the clean state:
   ```bash
   npx geo-lint --format=json --root=<project-root>
   ```
   Expected result: empty array `[]`

7. Report a summary: files fixed, total violations resolved, files still with violations and the reason for each.

### Sub-agent prompt template

Use this structure when dispatching a sub-agent for one file:

```
Fix all lint violations in this content file.

File path: content/blog/<slug>.mdx
Violations (JSON):
<paste the filtered array for this file>

Instructions:
1. Read the file
2. Fix every violation using its suggestion field
3. Re-run: npx geo-lint --format=json --root=<root>
4. Filter results to this file; repeat if violations remain
5. Stop after 5 iterations
6. Report what was fixed and what could not be resolved, with reasons
```
