# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 28 new GEO rules across 4 categories (total: 35 GEO rules, 81 rules overall)
  - **E-E-A-T (8 rules):** source citations, expert quotes, author validation, heading quality, FAQ quality, definition patterns, how-to steps, TL;DR detection
  - **Structure (7 rules):** section length, paragraph length, list presence, citation block bounds, orphaned intros, heading density, structural element ratio
  - **Freshness (7 rules):** stale year references, outdated content, passive voice, sentence length, internal links, comparison tables, inline HTML
  - **RAG Optimization (6 rules):** extraction triggers, section self-containment, vague openings, acronym expansion, statistic context, summary sections
- `author` field support in ContentItem and MDX adapter
- 6 new GeoConfig options: `fillerPhrases`, `extractionTriggers`, `acronymAllowlist`, `vagueHeadings`, `genericAuthorNames`, `allowedHtmlTags`
- New utility module `geo-advanced-analyzer.ts` with 10 analysis functions
- Extended `geo-analyzer.ts` with 6 new utility functions
- Comprehensive tests for all 28 new rules (~120 tests)

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
