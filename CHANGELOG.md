# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-03-19

### Added
- `contentSource` field on `ContentItem` — allows rules to distinguish between file-based MDX and URL-extracted content
- Plain-text structure detection (`src/utils/plaintext-structure.ts`) — heuristic heading, table, list, and FAQ detection for content without markdown formatting
- GEO rules now fall back to plain-text structure detection when `contentSource` is `'url'`, fixing false 100/100 GEO scores on Readability-extracted content
- Integration tests for URL scanner compatibility

### Fixed
- **GEO rules never firing on URL-scanned content** — headings, tables, lists, and FAQ sections are now detected in plain text (no markdown required)
- **Readability score 0 for German content** — `countSentences` now handles newline-separated sentences and periods without trailing spaces
- **`slug-invalid-characters` false positive on URL paths** — slashes are now allowed when `contentSource` is `'url'`
- **`content-repetition` flagging footnotes** — reference boilerplate (Wikipedia citations, DOI, ISBN, etc.) is stripped before n-gram analysis
- **`missing-h1` false positive on URL content** — rule is skipped when `contentSource` is `'url'` (Readability strips `<h1>`, title is in metadata)

## [0.2.0] - 2026-03-10

### Added
- `seo-schema-sameas-incomplete` — flags Organization schema with fewer than 2 sameAs entries for entity verification
- `geo-author-not-person` — flags blog posts with organization names as author instead of a person
- `seo-service-page-no-schema` — flags service pages without Service structured data
- `technical-no-feed` — flags sites without RSS/Atom/JSON feeds declared in config
- `technical-no-llms-txt` — flags sites without /llms.txt endpoint declared in config
- New config fields: `geo.organizationSameAs`, `geo.servicePagePatterns`
- New `technical` config section with `feedUrls` and `llmsTxtUrl`

### Changed
- Rule count increased from 92 to 97
- `schema-rules.ts` now uses factory pattern (`createSchemaRules`) for config-aware rules

## [0.1.6] - 2026-03-03

### Added
- Claude Code skill plugin for ecosystem distribution — geo-lint is now installable as a Claude Code skill via `/install-skill`
- `/content-creator` skill for self-configuring content pipelines — auto-detects project framework, generates adapter scripts, and runs iterative lint-fix loops

## [0.1.5] - 2026-02-20

### Fixed
- CLI now always exits with code `0` regardless of violation severity — the linter is advisory-only and never blocks CI/CD pipelines. Error/warning labels are preserved for prioritization.

## [0.1.4] - 2026-02-20

### Added
- Full English/German language parity across all analyzers
  - Locale-aware Flesch Reading Ease: EN formula (`206.835 - 1.015*ASL - 84.6*ASW`) and DE formula (`180 - ASL - 58.5*ASW`) with per-locale interpretation bands
  - `estimateSyllables()` applies silent-e discount for English and compound-word adjustment for German
  - `defaultLocale` added to `RuleContext`, populated from `config.i18n`
  - Unified locale fallback chain: `item.locale` → `context.defaultLocale` → hardcoded default
  - Removed hardcoded German assumption in slug-resolver permalink generation
- 15 new readability tests covering both language formulas

## [0.1.3] - 2026-02-20

### Changed
- README "Why this exists" section rewritten with the real motivation: running multiple content-heavy sites with no deterministic SEO/GEO validation tool
- Stronger value framing in `docs/geo-rules.md` and `docs/rules.md`

## [0.1.2] - 2026-02-20

### Fixed
- `--version` flag was hardcoded to `0.1.0` -- now reads dynamically from package.json
- `--rules` flag crashed without a config file -- now falls back to defaults so users can discover all 92 rules without project setup

### Changed
- Polished README: 1008 lines → 259 lines with stronger GEO and agentic workflow framing
- Split reference documentation into 7 dedicated docs/ files (rules, GEO examples, configuration, custom adapters, API, agent integration)
- Added copy-paste agent prompts for Claude Code, Cursor, Windsurf, and Copilot
- Updated GitHub repo description, homepage, and topic tags

## [0.1.1] - 2026-02-19

### Added
- 28 new GEO rules across 4 categories (total: 35 GEO rules, 92 rules overall)
  - **E-E-A-T (8 rules):** source citations, expert quotes, author validation, heading quality, FAQ quality, definition patterns, how-to steps, TL;DR detection
  - **Structure (7 rules):** section length, paragraph length, list presence, citation block bounds, orphaned intros, heading density, structural element ratio
  - **Freshness (7 rules):** stale year references, outdated content, passive voice, sentence length, internal links, comparison tables, inline HTML
  - **RAG Optimization (6 rules):** extraction triggers, section self-containment, vague openings, acronym expansion, statistic context, summary sections
- 14 content quality rules including readability analysis inspired by Yoast SEO: transition words, consecutive sentence starts, sentence length variety, vocabulary diversity, jargon density
- `author` field support in ContentItem and MDX adapter
- 6 new GeoConfig options: `fillerPhrases`, `extractionTriggers`, `acronymAllowlist`, `vagueHeadings`, `genericAuthorNames`, `allowedHtmlTags`
- Comprehensive tests for all new rules (~120 tests)

## [0.1.0] - 2026-02-18

### Added
- Initial release with 53 SEO/GEO rules
- 7 GEO (Generative Engine Optimization) rules for AI search visibility
- Configurable via `geo-lint.config.ts`
- JSON output mode for AI agent integration
- Fix strategies for every rule (agent-readable)
- MDX/Markdown content adapter with `gray-matter`
- CLI with `--format=json`, `--rules`, `--root`, `--config` flags

[0.1.6]: https://github.com/IJONIS/geo-lint/releases/tag/v0.1.6
[0.1.5]: https://github.com/IJONIS/geo-lint/releases/tag/v0.1.5
[0.1.4]: https://github.com/IJONIS/geo-lint/releases/tag/v0.1.4
[0.1.3]: https://github.com/IJONIS/geo-lint/releases/tag/v0.1.3
[0.1.2]: https://github.com/IJONIS/geo-lint/releases/tag/v0.1.2
[0.1.1]: https://github.com/IJONIS/geo-lint/releases/tag/v0.1.1
[0.1.0]: https://github.com/IJONIS/geo-lint/releases/tag/v0.1.0
