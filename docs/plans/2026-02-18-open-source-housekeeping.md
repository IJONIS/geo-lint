# Open Source Housekeeping + CLAUDE.md Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring geo-lint up to open source best practices and add a CLAUDE.md with iterative lint-fix loop instructions for AI agents.

**Architecture:** Purely additive file changes — new community files, CI fixes, package.json cleanup, and a CLAUDE.md. No source code changes.

**Tech Stack:** Markdown, YAML (GitHub Actions), JSON (package.json)

---

## Task 1: Fix CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Replace `[Unreleased]` with the released version**

The content under `[Unreleased]` was shipped as 0.1.0. Move it to a proper version entry.

New content:
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-18

### Added
- Initial release with 53 SEO/GEO rules
- 7 GEO (Generative Engine Optimization) rules for AI search visibility
- Configurable via `geo-lint.config.ts`
- JSON output mode for AI agent integration
- Fix strategies for every rule (agent-readable)
- MDX/Markdown content adapter with `gray-matter`
- CLI with `--format=json`, `--rules`, `--root`, `--config` flags

[0.1.0]: https://github.com/IJONIS/geo-lint/releases/tag/v0.1.0
```

**Step 2: Verify**

Open `CHANGELOG.md` and confirm `[0.1.0] - 2026-02-18` is the first version entry with a comparison link at the bottom.

---

## Task 2: Fix package.json

**Files:**
- Modify: `package.json`

**Step 1: Remove broken lint script**

ESLint is not in devDependencies. The `"lint": "eslint src"` script will always fail. Remove it.

**Step 2: Remove non-existent `docs` from files array**

The `docs/` directory does not exist as a shippable artifact. Remove `"docs"` from the `"files"` array so the published package doesn't reference a missing directory.

Result for `"files"`:
```json
"files": [
  "dist",
  "LICENSE",
  "README.md",
  "CHANGELOG.md"
]
```

Result for `"scripts"` (lint line removed):
```json
"scripts": {
  "build": "tsup",
  "dev": "tsup --watch",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "typecheck": "tsc --noEmit",
  "prepublishOnly": "npm run build && npm run test"
}
```

**Step 3: Verify**

Run: `node -e "const p = require('./package.json'); console.log(p.scripts, p.files)"`
Expected: no `lint` key in scripts, no `docs` in files array.

---

## Task 3: Fix CI workflows

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/publish.yml`

**Step 1: Fix ci.yml**

Replace the install step in both the matrix and any subsequent steps. The current `rm -f package-lock.json && npm install` is fragile — it destroys the lockfile on every run.

Use `npm ci` instead, which is designed for CI: it respects the lockfile, is faster, and fails if lockfile is out of date.

New `ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

**Step 2: Fix publish.yml**

Same fix — replace the install step with `npm ci`.

New `publish.yml`:
```yaml
name: Publish

on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
      - run: npm publish --access public --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Step 3: Verify**

Open both files and confirm the `rm -f package-lock.json &&` prefix is gone and `npm ci` is used.

---

## Task 4: Create CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

**Step 1: Create the file**

```markdown
# Contributing to geo-lint

Thank you for your interest in contributing. This document explains how to set up the project locally, run tests, and submit changes.

## Local setup

Requirements: Node.js >= 18

```bash
git clone https://github.com/IJONIS/geo-lint.git
cd geo-lint
npm ci
```

## Development commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run dev` | Watch mode build |
| `npm test` | Run all tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage report |
| `npm run typecheck` | Type-check without emitting |

## Project structure

- `src/rules/` — One file per rule category. Each rule exports a `name`, `severity`, `run()` function, and `fixStrategy`.
- `src/adapters/` — Content source adapters. The default MDX adapter lives in `mdx.ts`.
- `src/utils/` — Pure utility functions (word counting, heading extraction, etc.).
- `src/config/` — Config loading and type definitions.
- `tests/unit/rules/` — Unit tests per rule module.
- `tests/integration/` — End-to-end lint tests using fixture content.

## Adding a new rule

1. Add the rule to the appropriate file in `src/rules/` (or create a new file if it belongs to a new category).
2. Register it in `src/rules/index.ts` via `buildRules()`.
3. Write a unit test in `tests/unit/rules/`.
4. Document the rule in `README.md` under the relevant category table.

Every rule must include:
- `name` — kebab-case identifier (e.g. `geo-missing-table`)
- `severity` — `'error'` or `'warning'`
- `fixStrategy` — one-sentence machine-readable fix description for AI agents
- `run()` — function returning `LintResult[]`

## Commit message format

```
type(scope): short description

Examples:
feat(rules): add geo-missing-video rule
fix(cli): handle missing config file gracefully
docs: update configuration reference
test(heading-rules): add edge case for empty body
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

## Pull requests

- Keep PRs focused — one rule, one fix, one feature per PR.
- All tests must pass: `npm test && npm run typecheck`
- Update `CHANGELOG.md` under `[Unreleased]` with a summary of your change.
- PRs that add rules must include a test and a README entry.

## Reporting issues

Use the GitHub issue templates for bug reports and feature requests.
For security vulnerabilities, see [SECURITY.md](SECURITY.md).
```

**Step 2: Verify**

Run: `cat CONTRIBUTING.md | head -5`
Expected: first line is `# Contributing to geo-lint`

---

## Task 5: Create SECURITY.md

**Files:**
- Create: `SECURITY.md`

**Step 1: Create the file**

```markdown
# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report security issues by emailing **hello@ijonis.com** with the subject line `[geo-lint] Security Vulnerability`.

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

We will acknowledge receipt within 48 hours and aim to release a patch within 14 days for confirmed issues.
```

**Step 2: Verify**

Run: `cat SECURITY.md | head -3`
Expected: first line is `# Security Policy`

---

## Task 6: Create CODE_OF_CONDUCT.md

**Files:**
- Create: `CODE_OF_CONDUCT.md`

Use the Contributor Covenant 2.1 — the standard for open source projects. Replace the contact placeholder with the project email.

Full content: https://www.contributor-covenant.org/version/2/1/code_of_conduct/

Key fields to fill in:
- Enforcement contact: `hello@ijonis.com`
- Project name: `geo-lint`

**Step 1: Create the file with Contributor Covenant 2.1 content**

Write `CODE_OF_CONDUCT.md` with the full Contributor Covenant 2.1 text, with `hello@ijonis.com` as the enforcement contact email.

**Step 2: Verify**

Run: `head -3 CODE_OF_CONDUCT.md`
Expected: `# Contributor Covenant Code of Conduct`


---

## Task 7: Create GitHub issue templates and PR template

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

**Step 1: Create bug report template**

`.github/ISSUE_TEMPLATE/bug_report.md`:
```markdown
---
name: Bug report
about: Something isn't working as expected
labels: bug
---

## Describe the bug

A clear description of what the bug is.

## Steps to reproduce

1. Config used (`geo-lint.config.ts` snippet):
```ts
// paste relevant config here
```

2. Command run:
```bash
npx geo-lint --format=json
```

3. What happened:

## Expected behavior

What you expected to happen.

## Environment

- geo-lint version:
- Node.js version:
- OS:
```

**Step 2: Create feature request template**

`.github/ISSUE_TEMPLATE/feature_request.md`:
```markdown
---
name: Feature request
about: Suggest a new rule or improvement
labels: enhancement
---

## Use case

What problem does this solve? Who benefits?

## Proposed behavior

If suggesting a new rule:
- Rule name (kebab-case):
- Severity (`error` or `warning`):
- What it checks:
- Example violation:
- Example fix:

If suggesting a general improvement, describe what you'd like to change and why.

## Alternatives considered

Any other approaches you thought about?
```

**Step 3: Create PR template**

`.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## What changed

Brief description of the change.

## Type of change

- [ ] Bug fix
- [ ] New rule
- [ ] Rule improvement
- [ ] Documentation
- [ ] Refactor
- [ ] Other

## How tested

- [ ] Added unit test in `tests/unit/rules/`
- [ ] Added/updated integration test in `tests/integration/`
- [ ] Manually tested with fixture content

## Checklist

- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] README updated if a new rule was added
```

**Step 4: Verify**

Run: `ls .github/ISSUE_TEMPLATE/`
Expected: `bug_report.md  feature_request.md`

Run: `ls .github/PULL_REQUEST_TEMPLATE.md`
Expected: file exists


---

## Task 8: Create CLAUDE.md (Part A — project overview and commands)

**Files:**
- Create: `CLAUDE.md`

**Step 1: Create CLAUDE.md with the header and dev commands sections**

```markdown
# CLAUDE.md — geo-lint

This file gives AI agents the context needed to work in this repository and to run the iterative lint-fix loop on content.

## What this project is

`@ijonis/geo-lint` is a CLI and programmatic linter for Markdown/MDX content. It checks SEO and GEO (Generative Engine Optimization) rules and outputs structured violations that agents consume, fix, and re-lint.

The primary use case is agentic: run the linter, read violations, fix the content, re-lint until clean.

## Local dev commands

```bash
npm ci                    # Install dependencies (use this, not npm install)
npm run build             # Compile TypeScript → dist/
npm run dev               # Watch mode build
npm test                  # Run all tests
npm run typecheck         # Type-check without emitting
npm run test:coverage     # Tests with coverage report
```

## Running the linter

```bash
# Pretty output (human-readable, ANSI colors)
npx geo-lint --root=.

# JSON output (machine-readable, zero ANSI — use this in agentic workflows)
npx geo-lint --format=json --root=.

# List all rules and their fix strategies
npx geo-lint --rules
```

## JSON output shape

Each violation is an object:

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

Key fields for agents:
- `file` — the content slug (not the full path). Map it to `content/<type>/<file>.mdx`
- `suggestion` — the plain-language fix instruction. Follow it directly.
- `fixStrategy` — available via `--rules`, describes the fix pattern at the rule level
- `severity` — fix `error` violations first; they will cause a non-zero exit code

## Rule categories

| Category | Count | Notes |
|----------|-------|-------|
| SEO | 27 | titles, descriptions, headings, slugs, links, images, schema |
| GEO | 7 | AI citation readiness — question headings, FAQ, tables, entity density |
| Content | 7 | word count, readability, dates, categories |
| Technical | 9 | broken links, image files, external URLs |
| i18n | 2 | translation pairs, locale metadata |

## Codebase conventions

- **Rule files**: `src/rules/<category>-rules.ts` — each exports a rule array or factory function
- **Rule shape**: every rule needs `name`, `severity`, `run()`, `fixStrategy`, optionally `category`
- **Adding a rule**: add to the category file → register in `src/rules/index.ts` → add unit test → add README entry
- **Config**: loaded from `geo-lint.config.ts` at project root via `jiti` (supports TypeScript)
- **Adapters**: `src/adapters/mdx.ts` is the default; implement `ContentAdapter` for custom sources
- **Output**: `src/reporter.ts` handles both pretty and JSON formatting
```

---

## Task 9: Create CLAUDE.md (Part B — iterative fix workflows)

**Files:**
- Modify: `CLAUDE.md` (append the workflow sections)

**Step 1: Append Workflow A — single file iterative fix loop**

Add this section to CLAUDE.md:

```markdown
## Workflow A: Fix a single content file (iterative loop)

Use this when you want to bring one specific content piece to zero violations.

### Steps

1. Run the linter in JSON mode and capture output:
   ```bash
   npx geo-lint --format=json --root=<project-root> > /tmp/lint-results.json
   ```

2. Parse the JSON array. Filter to violations for your target file using the `file` field.

3. Fix ALL violations for that file in a single edit pass:
   - Read the MDX file
   - Address every violation using its `suggestion` field
   - Fix `error` severity violations first
   - Preserve the author's voice — restructure, don't rewrite

4. Re-run the linter and filter again to your target file.

5. If violations remain, repeat from step 3.

6. **Stop after 5 iterations.** If violations still remain after 5 passes, stop and report:
   - Which violations could not be resolved
   - Their `fixStrategy` values
   - Ask the user for guidance (some violations require human judgment, e.g. adding real statistics, finding missing images)

### Violations that may require human input

- `geo-low-citation-density` — requires adding real statistics or data points; do not fabricate numbers
- `image-not-found` — requires a real image file to exist on disk
- `broken-internal-link` — target page may not exist yet
- `category-invalid` — valid categories are defined in `geo-lint.config.ts`; do not invent new ones

---

## Workflow B: Full directory sweep with parallel sub-agents

Use this to bring the entire content directory to zero violations.

### Steps

1. Run the linter across the full project:
   ```bash
   npx geo-lint --format=json --root=<project-root> > /tmp/lint-all.json
   ```

2. Parse the JSON and group violations by `file` field. Each unique `file` value is one content piece.

3. Dispatch one sub-agent per file in parallel:
   - Agent type: `general-purpose`
   - Each sub-agent receives: the file path, its violations list, and a copy of Workflow A
   - Each sub-agent runs Workflow A independently on its assigned file

4. For large directories (more than 20 files with violations), batch into groups of 5–10 files per dispatch wave to avoid overloading the task queue.

5. Wait for all sub-agents to complete. Collect their reports.

6. Run one final full lint to confirm the clean state:
   ```bash
   npx geo-lint --format=json --root=<project-root>
   ```
   Expected: empty array `[]`

7. Report a summary:
   - Files fixed
   - Violations resolved
   - Files still with violations (if any) and reasons

### Sub-agent prompt template

When dispatching a sub-agent for a file, use this prompt structure:

```
You are fixing lint violations in a single content file.

File: content/blog/<slug>.mdx
Violations:
<paste the filtered JSON array for this file>

Follow Workflow A from CLAUDE.md:
1. Read the file
2. Fix all violations using each violation's `suggestion` field
3. Re-run: npx geo-lint --format=json --root=<root>
4. Filter results to this file and repeat if violations remain
5. Stop after 5 iterations
6. Report what was fixed and what (if anything) could not be resolved
```
```

**Step 2: Verify CLAUDE.md**

Run: `wc -l CLAUDE.md`
Expected: > 100 lines

Run: `grep -c "Workflow" CLAUDE.md`
Expected: at least 4 matches (headers + references)

---

## Task 10: Final verification

**Step 1: Confirm all files exist**

```bash
ls CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md CLAUDE.md CHANGELOG.md
ls .github/ISSUE_TEMPLATE/bug_report.md
ls .github/ISSUE_TEMPLATE/feature_request.md
ls .github/PULL_REQUEST_TEMPLATE.md
```

Expected: all files present, no errors.

**Step 2: Verify package.json is valid JSON**

```bash
node -e "require('./package.json')" && echo "valid"
```

Expected: `valid`

**Step 3: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: all tests pass.

**Step 4: Check no `docs` in files field**

```bash
node -e "const p=require('./package.json'); console.log(p.files.includes('docs'))"
```

Expected: `false`

**Step 5: Check no `lint` script**

```bash
node -e "const p=require('./package.json'); console.log('lint' in p.scripts)"
```

Expected: `false`

