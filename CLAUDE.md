# CLAUDE.md — geo-lint

This file gives AI agents the context needed to work in this repository and to run the iterative lint-fix loop on content.

## What this project is

`@ijonis/geo-lint` is a CLI and programmatic linter for content. It validates SEO and GEO (Generative Engine Optimization) rules and outputs structured violations that agents consume, fix, and re-lint.

Out of the box it scans Markdown/MDX files. For other formats (Astro, HTML, Nuxt, etc.), a small custom adapter script maps the content into the same shape -- see Workflow C below.

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
| SEO       | 32    | titles, descriptions, headings, slugs, links, images, schema, keywords, canonical URLs, duplicates |
| GEO       | 35    | AI citation readiness: E-E-A-T signals, content structure, freshness, RAG optimization, question headings, FAQ sections, tables, entity density |
| Content   | 14    | word count, readability, dates, categories, jargon density, repetition, sentence length, vocabulary diversity, transition words, sentence variety, consecutive starts |
| Technical | 8     | broken links, image files, external URLs, trailing slashes |
| i18n      | 3     | translation pairs, locale metadata |

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

---

## Workflow C: Non-MDX projects (Astro, HTML, Nuxt, etc.)

The CLI and default adapter assume `.md`/`.mdx` files with `gray-matter` frontmatter. If the project uses a different format, **create a custom adapter script** that maps the content into `ContentItem` objects, then run the programmatic API.

### When to use this workflow

- The project has `.astro`, `.html`, `.vue`, `.njk`, or other non-MDX content files
- Content metadata lives in `<meta>` tags, component props, or framework-specific frontmatter rather than YAML frontmatter
- Content is stored in a CMS or database, not in files

### Steps

1. **Inspect the project** to understand where content lives and how metadata is stored:
   - For Astro: check `src/content/` (content collections) or `src/pages/` (`.astro` pages)
   - For HTML: find the root directory with `.html` files
   - For other frameworks: identify the content directory and file format

2. **Create `scripts/lint.ts`** with a custom adapter. The adapter must return `ContentItem[]`:

   ```typescript
   import { lint, createAdapter } from '@ijonis/geo-lint';
   // + whatever parsing the format needs (cheerio for HTML, gray-matter for MD, etc.)

   const adapter = createAdapter((projectRoot) => {
     // 1. Find content files
     // 2. Parse each file to extract: title, slug, description, body, etc.
     // 3. Return ContentItem[] — see README "Custom Adapters" for the full interface
   });

   const exitCode = await lint({ adapter, projectRoot: process.cwd(), format: 'json' });
   process.exit(exitCode);
   ```

3. **Required `ContentItem` fields** (the adapter must provide all of these):
   - `title` — page title
   - `slug` — URL slug
   - `description` — meta description
   - `permalink` — full URL path (e.g., `/blog/my-post`)
   - `contentType` — one of `'blog'`, `'page'`, `'project'`
   - `filePath` — absolute path to the source file on disk (needed for image resolution)
   - `rawContent` — full file content as-is
   - `body` — renderable body content (strip frontmatter, scripts, layout wrappers)

4. **Run the adapter script** instead of the CLI:
   ```bash
   npx tsx scripts/lint.ts
   ```

5. **Parse the JSON output and fix violations** using the same Workflow A loop (read violations → fix → re-run → repeat).

### Key differences from the CLI workflow

- **Run the script, not `npx geo-lint`** — the adapter bypasses the CLI's built-in MDX loader
- **`filePath` must point to real files** — rules like `image-not-found` resolve paths relative to `filePath`
- **`body` should contain only renderable content** — strip `<script>`, `<style>`, layout boilerplate, and framework directives; rules analyze headings, paragraphs, and links
- **`contentType` controls which rules fire** — `'blog'` enables date/author/category rules; use `'page'` for generic pages
- **Config still applies** — `geo-lint.config.ts` settings (`siteUrl`, `categories`, `rules`, etc.) are still loaded; only `contentPaths` is bypassed

### Format-specific tips

| Format | How to extract metadata | `body` extraction |
|--------|------------------------|-------------------|
| **Astro content collections** (`.md`/`.mdx` in `src/content/`) | Parse with `gray-matter` — works the same as MDX | `gray-matter`'s `content` field |
| **Astro pages** (`.astro`) | Parse the `---` frontmatter block for variable assignments | Everything after the closing `---` |
| **HTML** | Use `cheerio` to read `<title>`, `<meta name="description">`, `<meta property="og:image">` | `$('main').html()` or `$('body').html()` |
| **Nuxt/Vue** | Parse `<script setup>` for `useHead()` or `useSeoMeta()` calls | `<template>` content |
| **Headless CMS** | Fetch via API, map response fields directly | API response body field |

### Concrete examples

The README has full, copy-paste-ready adapter examples for:
- Astro content collections
- Static HTML sites (with cheerio)
- `.astro` component pages
- CMS/API sources

See the **Custom Adapters** section in `README.md`.
