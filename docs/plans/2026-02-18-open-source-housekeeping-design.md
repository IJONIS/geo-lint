# Design: Open Source Housekeeping + CLAUDE.md

**Date:** 2026-02-18
**Status:** Approved

---

## Context

`@ijonis/geo-lint` was open-sourced from the internal IJONIS linter. A gap audit identified 10 issues against open source best practices, plus a need for a `CLAUDE.md` to enable AI agents to iteratively fix content violations.

---

## Part 1 — Open Source Housekeeping

### Files to change

| File | Action | Reason |
|---|---|---|
| `CHANGELOG.md` | Move `[Unreleased]` → `[0.1.0] - 2026-02-18` | Version was released; `[Unreleased]` implies it hasn't shipped |
| `package.json` | Remove `eslint src` lint script; remove `docs/` from `files` array | ESLint not in devDeps (script fails); `docs/` dir doesn't exist |
| `.github/workflows/ci.yml` | Remove `rm -f package-lock.json &&`; use `npm ci` | Non-standard, fragile CI approach |
| `.github/workflows/publish.yml` | Same CI fix | Same reason |
| `CONTRIBUTING.md` | Create new | Contributors have no setup/process guidance |
| `SECURITY.md` | Create new | Standard for published npm packages; GitHub surfaces this |
| `CODE_OF_CONDUCT.md` | Create new | Signals welcoming community; Contributor Covenant 2.1 |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Create new | Structured bug reports: repro steps, config, expected/actual |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Create new | Feature requests: use case, proposed rule behavior |
| `.github/PULL_REQUEST_TEMPLATE.md` | Create new | PR context: what changed, how tested |
| `README.md` | Add badges at top | CI status, npm version, license — standard health signals |

---

## Part 2 — CLAUDE.md

### Purpose

A project-level `CLAUDE.md` at the repo root gives any AI agent (Claude Code, Cursor, Copilot, etc.) the context needed to:
- Set up and run the project locally
- Understand the rule system and JSON output shape
- Execute an iterative lint-fix loop on a single file
- Coordinate a parallel multi-agent sweep across the full content directory

### Workflow A — Single File Iterative Fix Loop

1. Run `npx geo-lint --format=json --root=<project-root>` (or programmatic `lintQuiet()`)
2. Parse JSON — filter violations to the target file
3. Fix ALL violations for that file in one edit pass (errors first, then warnings)
4. Re-run linter
5. Repeat up to **5 iterations**
6. After 5 passes: stop, report remaining violations with their `fixStrategy` fields, escalate to user

**Rationale for fix-all-then-re-lint:** Fewer API round-trips; some fixes resolve multiple violations simultaneously (e.g. adding a FAQ section resolves both `geo-missing-faq-section` and word count rules).

### Workflow B — Full Directory Parallel Sweep

1. Run `geo-lint --format=json` on full content directory
2. Parse violation list → group by `file` field
3. Dispatch one sub-agent per file (parallel)
4. Each sub-agent runs Workflow A independently
5. Coordinator collects completion reports
6. Run one final `geo-lint --format=json` to confirm clean state
7. Report any files still with violations

**Sub-agent delegation:** Use `general-purpose` agents for each file. For large directories (>20 files), batch into groups of 5-10 to avoid overwhelming the task queue.

### CLAUDE.md Sections

1. Project overview
2. Local dev commands (install, build, test, typecheck)
3. Rule system overview (categories, severity, JSON shape, `fixStrategy`)
4. Workflow A: single-file iterative fix loop
5. Workflow B: full-directory parallel sweep
6. Escalation: what to do when violations can't be auto-fixed
7. Codebase conventions (adapter pattern, rule factory pattern, TypeScript-first)
