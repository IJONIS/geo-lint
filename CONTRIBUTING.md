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

```
src/
  rules/       One file per rule category. Each rule exports name, severity, run(), and fixStrategy.
  adapters/    Content source adapters. The default MDX adapter is in mdx.ts.
  utils/       Pure utility functions (word counting, heading extraction, etc.).
  config/      Config loading and type definitions.
  cli.ts       CLI entry point.
  index.ts     Programmatic API (lint, lintQuiet).
  reporter.ts  Formats output as pretty (ANSI) or JSON.

tests/
  unit/rules/  Unit tests per rule module.
  integration/ End-to-end lint tests using fixture content.
  fixtures/    Sample MDX files and config for tests.
```

## Adding a new rule

1. Add the rule to the appropriate file in `src/rules/` (or create a new file for a new category).
2. Register it in `src/rules/index.ts` via `buildRules()`.
3. Write a unit test in `tests/unit/rules/`.
4. Document the rule in `README.md` under the relevant category table.

Every rule must include:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Kebab-case identifier, e.g. `geo-missing-table` |
| `severity` | `'error' \| 'warning'` | Yes | Errors block build; warnings are advisory |
| `run()` | `function` | Yes | Returns `LintResult[]` for a content item |
| `fixStrategy` | `string` | Yes | One-sentence machine-readable fix description for AI agents |
| `category` | `string` | No | Rule category (seo, geo, content, technical, i18n) |

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

- Keep PRs focused — one rule, one fix, or one feature per PR.
- All checks must pass: `npm test && npm run typecheck`
- Update `CHANGELOG.md` under `[Unreleased]` with a summary of your change.
- PRs that add a rule must include a unit test and a README entry.

## Reporting issues

Use the GitHub issue templates for bug reports and feature requests.
For security vulnerabilities, see [SECURITY.md](SECURITY.md) — do not open a public issue.
