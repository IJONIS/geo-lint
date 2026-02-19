# Rule Reference

`@ijonis/geo-lint` ships with 92 rules across 5 categories. Every rule includes a `fixStrategy` and `suggestion` field that AI agents consume directly.

| Category | Rules | Severity Mix | Focus |
|----------|-------|-------------|-------|
| SEO | 32 | 6 errors, 26 warnings | Titles, descriptions, headings, slugs, OG images, canonical URLs, keywords, links, schema |
| Content | 14 | 2 errors, 12 warnings | Word count, readability, dates, categories, jargon density, repetition, vocabulary diversity, transition words, sentence variety |
| Technical | 8 | 3 errors, 5 warnings | Broken links, image files, trailing slashes, external URLs, performance |
| i18n | 3 | 0 errors, 3 warnings | Translation pairs, locale metadata |
| GEO | 35 | 0 errors, 35 warnings | AI citation readiness: E-E-A-T signals, content structure, freshness, RAG optimization |

---

## Title (4 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `title-missing` | error | Title must be present in frontmatter |
| `title-too-short` | warning | Title should meet minimum length (30 chars) |
| `title-too-long` | error | Title must not exceed maximum length (60 chars) |
| `title-approaching-limit` | warning | Title is close to the maximum length |

## Description (4 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `description-missing` | error | Meta description must be present |
| `description-too-long` | error | Description must not exceed 160 characters |
| `description-approaching-limit` | warning | Description is close to the maximum length |
| `description-too-short` | warning | Description should meet minimum length (70 chars) |

## Heading (4 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `missing-h1` | warning | Content should have an H1 heading |
| `multiple-h1` | error | Content must not have more than one H1 |
| `heading-hierarchy-skip` | warning | Heading levels should not skip (e.g., H2 to H4) |
| `duplicate-heading-text` | warning | Heading text should be unique within a page |

## Slug (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `slug-invalid-characters` | error | Slugs must be lowercase alphanumeric with hyphens |
| `slug-too-long` | warning | Slugs should not exceed 75 characters |

## Open Graph (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `blog-missing-og-image` | warning | Blog posts should have a featured image |
| `project-missing-og-image` | warning | Projects should have a featured image |

## Canonical (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `canonical-missing` | warning | Indexed pages should have a canonical URL |
| `canonical-malformed` | warning | Canonical URL must be a valid path or site URL |

## Robots (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `published-noindex` | warning | Published content with noindex may be unintentional |

## Schema (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `blog-missing-schema-fields` | warning | Blog posts should have fields for BlogPosting schema |

## Keyword Coherence (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `keyword-not-in-description` | warning | Title keywords should appear in the description |
| `keyword-not-in-headings` | warning | Title keywords should appear in subheadings |
| `title-description-no-overlap` | warning | Title and description should share keywords |

## Duplicate Detection (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `duplicate-title` | error | Titles must be unique across all content |
| `duplicate-description` | error | Descriptions must be unique across all content |

## Link Validation (4 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `broken-internal-link` | error | Internal links must resolve to existing pages |
| `absolute-internal-link` | warning | Internal links should use relative paths |
| `draft-link-leak` | error | Links must not point to draft or noindex pages |
| `trailing-slash-inconsistency` | warning | Internal links should not have trailing slashes |

## External Links (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `external-link-malformed` | warning | External URLs must be well-formed |
| `external-link-http` | warning | External links should use HTTPS |
| `external-link-low-density` | warning | Blog posts should cite external sources |

## Image Validation (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `inline-image-missing-alt` | error | Inline images must have alt text |
| `frontmatter-image-missing-alt` | warning | Featured images should have alt text |
| `image-not-found` | warning | Referenced images should exist on disk |

## Performance (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `image-file-too-large` | warning | Image files should not exceed 500 KB |

## Orphan Detection (1 rule)

| Rule | Severity | Description |
|------|----------|-------------|
| `orphan-content` | warning | Content should be linked from at least one other page |

## Content Quality (14 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `content-too-short` | warning | Content should meet minimum word count (300) |
| `low-readability` | warning | Content should meet minimum readability score |
| `content-jargon-density` | warning | Complex/uncommon word density exceeds 8% (error at 15%) |
| `content-repetition` | warning | High paragraph similarity or repeated phrases |
| `content-sentence-length-extreme` | warning | Average sentence length exceeds 35 words (error at 50) |
| `content-substance-ratio` | warning | Low vocabulary diversity (type-token ratio below 25%) |
| `content-low-transition-words` | warning | Fewer than 20% of sentences contain transition words (error at 10%) |
| `content-consecutive-starts` | warning | 3+ consecutive sentences start with the same word (error at 5+) |
| `content-sentence-variety` | warning | Monotonous sentence lengths (coefficient of variation below 0.30) |

## Date Validation (3 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `missing-date` | error | Blog and project content must have a date |
| `future-date` | warning | Date should not be in the future |
| `missing-updated-at` | warning | Content should have an updatedAt field |

## Category Validation (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `category-invalid` | error | Categories must match the configured list |
| `missing-categories` | warning | Blog posts should have at least one category |

## i18n (2 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `translation-pair-missing` | warning | Translated content should have both language versions |
| `missing-locale` | warning | Content should have a locale field |

## GEO -- Core (7 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `geo-no-question-headings` | warning | At least 20% of headings should be questions |
| `geo-weak-lead-sentences` | warning | Sections should start with direct answers |
| `geo-low-citation-density` | warning | Content needs data points (1 per 500 words) |
| `geo-missing-faq-section` | warning | Long posts should include an FAQ section |
| `geo-missing-table` | warning | Long posts should include a data table |
| `geo-short-citation-blocks` | warning | Section lead paragraphs should be 40+ words |
| `geo-low-entity-density` | warning | Brand and location should appear in content |

## GEO -- E-E-A-T (8 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `geo-missing-source-citations` | warning | Min 1 source citation per 500 words |
| `geo-missing-expert-quotes` | warning | Long posts need at least 1 attributed blockquote |
| `geo-missing-author` | warning | Blog posts need a non-generic author name |
| `geo-heading-too-vague` | warning | Headings must be 3+ words and not generic |
| `geo-faq-quality` | warning | FAQ sections need 3+ Q&A pairs with proper formatting |
| `geo-definition-pattern` | warning | "What is X?" headings should start with "X is..." |
| `geo-howto-steps` | warning | "How to" headings need 3+ numbered steps |
| `geo-missing-tldr` | warning | Long posts need a TL;DR or key takeaway near the top |

## GEO -- Structure (7 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `geo-section-too-long` | warning | H2 sections over 300 words need H3 sub-headings |
| `geo-paragraph-too-long` | warning | Paragraphs should not exceed 100 words |
| `geo-missing-lists` | warning | Content should include at least one list |
| `geo-citation-block-upper-bound` | warning | First paragraph after H2 should be under 80 words |
| `geo-orphaned-intro` | warning | Introduction before first H2 should be under 150 words |
| `geo-heading-density` | warning | No text gap should exceed 300 words without a heading |
| `geo-structural-element-ratio` | warning | At least 1 structural element per 500 words |

## GEO -- Freshness & Quality (7 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `geo-stale-date-references` | warning | Year references older than 18 months |
| `geo-outdated-content` | warning | Content not updated in over 6 months |
| `geo-passive-voice-excess` | warning | Over 15% passive voice sentences |
| `geo-sentence-too-long` | warning | Sentences exceeding 40 words |
| `geo-low-internal-links` | warning | Fewer than 2 internal links |
| `geo-comparison-table` | warning | Comparison headings without a data table |
| `geo-inline-html` | warning | Raw HTML tags in markdown content |

## GEO -- RAG Optimization (6 rules)

| Rule | Severity | Description |
|------|----------|-------------|
| `geo-extraction-triggers` | warning | Long posts need summary/takeaway phrases |
| `geo-section-self-containment` | warning | Sections should not open with unresolved pronouns |
| `geo-vague-opening` | warning | Articles should not start with filler phrases |
| `geo-acronym-expansion` | warning | Acronyms must be expanded on first use |
| `geo-statistic-without-context` | warning | Statistics need source attribution or timeframe |
| `geo-missing-summary-section` | warning | Long posts (2000+ words) need a summary section |

---

To override rule severity or disable individual rules, see the [configuration reference](configuration.md). For the 7 core GEO rules with before/after examples, see [geo-rules.md](geo-rules.md).

[Back to main README](../README.md)
