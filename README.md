# @ijonis/geo-lint

**An agentic SEO and GEO linter. AI coding agents run it, read the violations, fix your content, and re-lint -- hands off.**

[![npm version](https://img.shields.io/npm/v/@ijonis/geo-lint)](https://www.npmjs.com/package/@ijonis/geo-lint)
[![CI](https://img.shields.io/github/actions/workflow/status/ijonis/geo-lint/ci.yml?branch=main&label=CI)](https://github.com/IJONIS/geo-lint/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/IJONIS/geo-lint/blob/main/LICENSE)

---

## Why this exists

Traditional SEO tools give you a report. You read it, figure out what to change, edit the file, re-run, repeat. That loop is manual, slow, and breaks down at scale.

`@ijonis/geo-lint` is built for a different loop:

```
Agent runs geo-lint → reads JSON violations → fixes the content → re-runs geo-lint → done
```

**You don't fix the violations. Your AI agent does.** The linter is the rule engine that tells the agent exactly what's wrong and how to fix it. Every rule ships with a machine-readable `fixStrategy` and a `suggestion` field that agents consume directly. The JSON output has zero ANSI formatting -- pure structured data.

This works today with Claude Code, Cursor, Windsurf, Copilot, or any agent that can run shell commands and edit files.

### What about GEO?

**GEO (Generative Engine Optimization)** is the practice of optimizing content so it gets cited by AI search engines -- ChatGPT, Perplexity, Google AI Overviews, Gemini. When someone asks an AI a question, the model pulls from web content to build its answer. GEO makes your content the source it pulls from.

Traditional SEO gets you into search result lists. GEO gets you **cited in AI-generated answers**. They're complementary, but GEO requires structural changes that no existing SEO tool checks for. `@ijonis/geo-lint` validates both -- 46 SEO rules and **7 dedicated GEO rules** that have zero open-source alternatives.

---

## Quick Start

```bash
npm install -D @ijonis/geo-lint
```

Create `geo-lint.config.ts`:

```typescript
import { defineConfig } from '@ijonis/geo-lint';

export default defineConfig({
  siteUrl: 'https://your-site.com',
  contentPaths: [{
    dir: 'content/blog',
    type: 'blog',
    urlPrefix: '/blog/',
  }],
});
```

Run it manually:

```bash
npx geo-lint
```

Or let your agent handle it -- see [Agent Integration](#agent-integration) below.

---

## The 7 GEO Rules

No other open-source linter checks for these. Each rule targets a specific content pattern that AI search engines use when deciding what to cite. When your agent fixes a GEO violation, it's directly increasing the probability that the content gets pulled into AI-generated answers.

### 1. `geo-no-question-headings`

**At least 20% of H2/H3 headings should be phrased as questions.**

LLMs match user queries against headings to find relevant sections. Question-formatted headings create a direct mapping between what users ask and what your content answers.

**Before:**
```markdown
## Benefits of Remote Work
```

**After:**
```markdown
## What are the benefits of remote work?
```

### 2. `geo-weak-lead-sentences`

**At least 50% of sections should start with a direct answer, not filler.**

AI systems use the first sentence after a heading as the citation snippet. Filler openings like "In this section, we will explore..." get skipped in favor of content that leads with the answer.

**Before:**
```markdown
## What is serverless computing?

In this section, we will take a closer look at serverless computing and
what it means for modern development teams.
```

**After:**
```markdown
## What is serverless computing?

Serverless computing is a cloud execution model where the provider
dynamically allocates compute resources per request, eliminating the
need to provision or manage servers.
```

### 3. `geo-low-citation-density`

**Content needs at least 1 statistical data point per 500 words.**

AI answers prefer citable claims backed by numbers. A post that says "performance improved significantly" is less likely to be cited than one that says "performance improved by 47% in load testing."

**Before:**
```markdown
Adopting TypeScript significantly reduces bugs in large codebases.
```

**After:**
```markdown
Adopting TypeScript reduces production bugs by 38% in codebases
exceeding 50,000 lines of code, according to a 2023 study by
Microsoft Research.
```

### 4. `geo-missing-faq-section`

**Long posts (800+ words) should include an FAQ section.**

FAQ sections are extracted verbatim by AI systems more than any other content structure. A well-written FAQ at the bottom of a post can generate more AI citations than the rest of the article combined.

**Before:**
```markdown
## Conclusion

TypeScript is a valuable tool for large teams.
```

**After:**
```markdown
## FAQ

### Is TypeScript worth learning in 2026?

Yes. TypeScript is used by 78% of professional JavaScript developers
and is required in most enterprise job listings.

### Does TypeScript slow down development?

Initial setup adds overhead, but teams report 15-25% faster
iteration after the first month due to fewer runtime errors.
```

### 5. `geo-missing-table`

**Long posts (1000+ words) should include at least one data table.**

Tables are highly structured and unambiguous, which makes them ideal for AI extraction. Research shows that content with comparison tables is cited 2.5x more frequently in AI-generated answers than equivalent content without tables.

**Before:**
```markdown
React is component-based and uses a virtual DOM. Vue is also
component-based but uses a reactivity system. Svelte compiles
components at build time.
```

**After:**
```markdown
| Framework | Architecture     | Bundle Size | Learning Curve |
|-----------|------------------|-------------|----------------|
| React     | Virtual DOM      | 42 KB       | Moderate       |
| Vue       | Reactivity proxy | 33 KB       | Low            |
| Svelte    | Compile-time     | 1.6 KB      | Low            |
```

### 6. `geo-short-citation-blocks`

**At least 50% of sections should start with a paragraph of 40+ words.**

The first paragraph after a heading is the "citation block" -- the unit of text that AI systems extract and present to users. If your opening paragraph is too short (a single sentence fragment), the AI may skip it or pull from a competitor's more complete answer.

**Before:**
```markdown
## How does DNS work?

It translates domain names.

DNS uses a hierarchical system of nameservers...
```

**After:**
```markdown
## How does DNS work?

DNS (Domain Name System) translates human-readable domain names like
example.com into IP addresses that computers use to route traffic.
The resolution process queries a hierarchy of nameservers, starting
from root servers and drilling down through TLD and authoritative
nameservers to find the correct IP address.
```

### 7. `geo-low-entity-density`

**Brand name and location should appear in the content body.**

AI systems build entity graphs that connect brands, locations, products, and topics. If your content never mentions your brand name or geographic context, the AI cannot associate the content with your entity -- even if the domain is correct.

This rule checks for the presence of the `brandName` and `brandCity` values from your config. When either value is empty, that check is skipped.

**Before:**
```markdown
Our team builds high-performance web applications using modern
frameworks and cloud infrastructure.
```

**After:**
```markdown
ACME builds high-performance web applications from our Berlin
headquarters, using modern frameworks and cloud infrastructure.
```

---

## All Rules

`@ijonis/geo-lint` ships with 53 rules across 5 categories. Here is a summary:

| Category | Rules | Severity Mix | Focus |
|----------|-------|-------------|-------|
| SEO | 27 | 6 errors, 21 warnings | Titles, descriptions, headings, slugs, OG images, canonical URLs, keywords, links, schema |
| Content | 7 | 2 errors, 5 warnings | Word count, readability, dates, categories |
| Technical | 9 | 3 errors, 6 warnings | Broken links, image files, trailing slashes, external URLs, performance |
| i18n | 2 | 0 errors, 2 warnings | Translation pairs, locale metadata |
| GEO | 7 | 0 errors, 7 warnings | AI citation readiness (see above) |

<details>
<summary>Full rule list</summary>

**Title (4 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `title-missing` | error | Title must be present in frontmatter |
| `title-too-short` | warning | Title should meet minimum length (30 chars) |
| `title-too-long` | error | Title must not exceed maximum length (60 chars) |
| `title-approaching-limit` | warning | Title is close to the maximum length |

**Description (4 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `description-missing` | error | Meta description must be present |
| `description-too-long` | error | Description must not exceed 160 characters |
| `description-approaching-limit` | warning | Description is close to the maximum length |
| `description-too-short` | warning | Description should meet minimum length (70 chars) |

**Heading (4 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `missing-h1` | warning | Content should have an H1 heading |
| `multiple-h1` | error | Content must not have more than one H1 |
| `heading-hierarchy-skip` | warning | Heading levels should not skip (e.g., H2 to H4) |
| `duplicate-heading-text` | warning | Heading text should be unique within a page |

**Slug (2 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `slug-invalid-characters` | error | Slugs must be lowercase alphanumeric with hyphens |
| `slug-too-long` | warning | Slugs should not exceed 75 characters |

**Open Graph (2 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `blog-missing-og-image` | warning | Blog posts should have a featured image |
| `project-missing-og-image` | warning | Projects should have a featured image |

**Canonical (2 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `canonical-missing` | warning | Indexed pages should have a canonical URL |
| `canonical-malformed` | warning | Canonical URL must be a valid path or site URL |

**Robots (1 rule)**

| Rule | Severity | Description |
|------|----------|-------------|
| `published-noindex` | warning | Published content with noindex may be unintentional |

**Schema (1 rule)**

| Rule | Severity | Description |
|------|----------|-------------|
| `blog-missing-schema-fields` | warning | Blog posts should have fields for BlogPosting schema |

**Keyword Coherence (3 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `keyword-not-in-description` | warning | Title keywords should appear in the description |
| `keyword-not-in-headings` | warning | Title keywords should appear in subheadings |
| `title-description-no-overlap` | warning | Title and description should share keywords |

**Duplicate Detection (2 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `duplicate-title` | error | Titles must be unique across all content |
| `duplicate-description` | error | Descriptions must be unique across all content |

**Link Validation (4 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `broken-internal-link` | error | Internal links must resolve to existing pages |
| `absolute-internal-link` | warning | Internal links should use relative paths |
| `draft-link-leak` | error | Links must not point to draft or noindex pages |
| `trailing-slash-inconsistency` | warning | Internal links should not have trailing slashes |

**External Links (3 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `external-link-malformed` | warning | External URLs must be well-formed |
| `external-link-http` | warning | External links should use HTTPS |
| `external-link-low-density` | warning | Blog posts should cite external sources |

**Image Validation (3 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `inline-image-missing-alt` | error | Inline images must have alt text |
| `frontmatter-image-missing-alt` | warning | Featured images should have alt text |
| `image-not-found` | warning | Referenced images should exist on disk |

**Performance (1 rule)**

| Rule | Severity | Description |
|------|----------|-------------|
| `image-file-too-large` | warning | Image files should not exceed 500 KB |

**Orphan Detection (1 rule)**

| Rule | Severity | Description |
|------|----------|-------------|
| `orphan-content` | warning | Content should be linked from at least one other page |

**Content Quality (2 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `content-too-short` | warning | Content should meet minimum word count (300) |
| `low-readability` | warning | Content should meet minimum readability score |

**Date Validation (3 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `missing-date` | error | Blog and project content must have a date |
| `future-date` | warning | Date should not be in the future |
| `missing-updated-at` | warning | Content should have an updatedAt field |

**Category Validation (2 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `category-invalid` | error | Categories must match the configured list |
| `missing-categories` | warning | Blog posts should have at least one category |

**i18n (2 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `translation-pair-missing` | warning | Translated content should have both language versions |
| `missing-locale` | warning | Content should have a locale field |

**GEO (7 rules)**

| Rule | Severity | Description |
|------|----------|-------------|
| `geo-no-question-headings` | warning | At least 20% of headings should be questions |
| `geo-weak-lead-sentences` | warning | Sections should start with direct answers |
| `geo-low-citation-density` | warning | Content needs data points (1 per 500 words) |
| `geo-missing-faq-section` | warning | Long posts should include an FAQ section |
| `geo-missing-table` | warning | Long posts should include a data table |
| `geo-short-citation-blocks` | warning | Section lead paragraphs should be 40+ words |
| `geo-low-entity-density` | warning | Brand and location should appear in content |

</details>

---

## Agent Integration

This is what `@ijonis/geo-lint` is built for. The linter isn't a reporting tool you read -- it's a **rule engine that governs your AI agent**. The agent runs the linter, reads the structured output, fixes every violation, and re-runs until the content is clean. You don't touch the content.

### How it works

```
┌─────────────────────────────────────────────────┐
│  You: "Optimize my blog posts for AI search"    │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│  Agent runs: npx geo-lint --format=json         │
│  ← Gets structured violations with fix guidance │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│  Agent reads each violation's `suggestion`      │
│  Opens the file, applies the fix, saves it      │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│  Agent re-runs: npx geo-lint --format=json      │
│  Loops until violations = 0                     │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│  Done. Content is GEO-optimized.                │
└─────────────────────────────────────────────────┘
```

The entire loop is hands-off. Every rule includes:
- **`suggestion`** -- a plain-language instruction the agent follows to fix the violation
- **`fixStrategy`** -- a machine-readable fix description for the rule itself
- **`file`, `field`, `line`** -- exact location so the agent edits the right place

### JSON output (what the agent reads)

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

### Rule discovery (agent bootstrapping)

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

### Drop-in Claude Code skill

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

## Configuration Reference

Configuration is loaded from `geo-lint.config.ts` (also supports `.mjs` and `.js`), or from a `geoLint` key in `package.json`.

Use `defineConfig` for TypeScript autocomplete:

```typescript
import { defineConfig } from '@ijonis/geo-lint';

export default defineConfig({
  // Required: your canonical site URL
  siteUrl: 'https://example.com',

  // Content directories to scan (defaults shown)
  contentPaths: [
    { dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' },
    { dir: 'content/pages', type: 'page', urlPrefix: '/' },
    { dir: 'content/projects', type: 'project', urlPrefix: '/projects/' },
  ],

  // Additional valid internal URLs for link validation
  staticRoutes: ['/about', '/contact', '/pricing'],

  // Directories to scan for image existence checks (default: ['public/images'])
  imageDirectories: ['public/images'],

  // Valid content categories (empty = skip category validation)
  categories: ['engineering', 'design', 'business'],

  // Slugs to exclude from linting
  excludeSlugs: ['draft-post', 'test-page'],

  // Content categories to exclude entirely (default: ['legal'])
  excludeCategories: ['legal'],

  // GEO-specific configuration
  geo: {
    brandName: 'ACME Corp',   // Entity density check (empty = skip)
    brandCity: 'Berlin',       // Location entity check (empty = skip)
    keywordsPath: '',          // Reserved for future use
  },

  // Per-rule severity overrides ('error' | 'warning' | 'off')
  rules: {
    'geo-missing-table': 'off',           // Disable a rule
    'orphan-content': 'error',            // Upgrade to error
    'title-approaching-limit': 'off',     // Disable a rule
  },

  // Threshold overrides
  thresholds: {
    title: { minLength: 30, maxLength: 60, warnLength: 55 },
    description: { minLength: 70, maxLength: 160, warnLength: 150 },
    slug: { maxLength: 75 },
    content: { minWordCount: 300, minReadabilityScore: 30 },
  },
});
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `siteUrl` | `string` | Yes | -- | Canonical site URL for link and canonical validation |
| `contentPaths` | `ContentPathConfig[]` | No | blog + pages + projects | Content directories to scan |
| `staticRoutes` | `string[]` | No | `[]` | Additional valid internal URLs |
| `imageDirectories` | `string[]` | No | `['public/images']` | Directories to scan for images |
| `categories` | `string[]` | No | `[]` | Valid content categories |
| `excludeSlugs` | `string[]` | No | `[]` | Slugs to skip during linting |
| `excludeCategories` | `string[]` | No | `['legal']` | Categories to skip entirely |
| `geo` | `GeoConfig` | No | `{}` | GEO entity density configuration |
| `rules` | `Record<string, Severity>` | No | `{}` | Per-rule severity overrides |
| `thresholds` | `ThresholdConfig` | No | See above | Length and quality thresholds |

### ContentPathConfig

```typescript
interface ContentPathConfig {
  dir: string;            // Relative path from project root
  type: 'blog' | 'page' | 'project';
  urlPrefix?: string;     // URL prefix for permalink derivation
  defaultLocale?: string; // Default locale when frontmatter has none
}
```

---

## Custom Adapters

By default, `@ijonis/geo-lint` scans Markdown and MDX files using `gray-matter` for frontmatter parsing. If your content lives in a CMS, database, or custom format, you can provide a custom adapter:

```typescript
import { lint, createAdapter } from '@ijonis/geo-lint';

const adapter = createAdapter(async (projectRoot) => {
  // Fetch from your CMS, database, or API
  const posts = await fetchFromCMS();

  return posts.map(post => ({
    title: post.title,
    slug: post.slug,
    description: post.metaDescription,
    permalink: `/blog/${post.slug}`,
    body: post.markdownContent,
    contentType: 'blog' as const,
    filePath: `virtual/${post.slug}.mdx`,
    rawContent: post.markdownContent,
    // Optional fields
    image: post.featuredImage,
    imageAlt: post.featuredImageAlt,
    date: post.publishedAt,
    locale: post.language,
    categories: post.tags,
  }));
});

const exitCode = await lint({ adapter });
process.exit(exitCode);
```

The adapter receives the project root path and must return an array of `ContentItem` objects. All standard rules run against the returned items.

---

## Programmatic API

Use `lint()` for full output or `lintQuiet()` for raw results without console output:

```typescript
import { lint, lintQuiet } from '@ijonis/geo-lint';

// Full lint with formatted console output
const exitCode = await lint({
  projectRoot: './my-project',
  format: 'json',
});

// Quiet mode: returns raw LintResult[] with no console output
const results = await lintQuiet({
  projectRoot: './my-project',
});

// Filter and process results programmatically
const geoViolations = results.filter(r => r.rule.startsWith('geo-'));
const errors = results.filter(r => r.severity === 'error');

console.log(`${geoViolations.length} GEO issues found`);
console.log(`${errors.length} errors (will block build)`);
```

### LintResult Type

```typescript
interface LintResult {
  file: string;          // Relative path (e.g., "blog/my-post")
  field: string;         // Field checked (e.g., "title", "body", "image")
  rule: string;          // Rule identifier (e.g., "geo-no-question-headings")
  severity: 'error' | 'warning';
  message: string;       // Human-readable violation description
  suggestion?: string;   // Actionable fix suggestion
  line?: number;         // Line number in source file (when applicable)
}
```

---

## CLI Reference

```
Usage:
  geo-lint [options]

Options:
  --root=<path>     Project root directory (default: cwd)
  --config=<path>   Explicit config file path
  --format=pretty   Human-readable colored output (default)
  --format=json     Machine-readable JSON output (for AI agents)
  --rules           List all registered rules with fix strategies
  -h, --help        Show this help message
  -v, --version     Show version
```

---

## License

[MIT](LICENSE)

---

Built by [IJONIS](https://ijonis.com) -- we help companies become visible to AI search engines. This linter is extracted from the same toolchain we use on production client content.
