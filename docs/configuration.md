# Configuration Reference

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
    fillerPhrases: ['in this article', 'welcome to'],  // Flagged in openings
    extractionTriggers: ['key takeaway', 'in summary'], // Summary phrases
    acronymAllowlist: ['HTML', 'CSS', 'API', 'SEO'],   // Skip expansion check
    vagueHeadings: ['introduction', 'overview'],        // Generic headings
    genericAuthorNames: ['admin', 'team'],              // Flagged author names
    allowedHtmlTags: ['Callout', 'Note'],               // MDX components
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

---

## Configuration Options

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

---

## ContentPathConfig

```typescript
interface ContentPathConfig {
  dir: string;            // Relative path from project root
  type: 'blog' | 'page' | 'project';
  urlPrefix?: string;     // URL prefix for permalink derivation
  defaultLocale?: string; // Default locale when frontmatter has none
}
```

---

## GEO-Specific Configuration

The `geo` object controls GEO rule behavior. All fields are optional -- when a value is empty or omitted, the corresponding check is skipped.

| Field | Purpose |
|-------|---------|
| `brandName` | Used by `geo-low-entity-density` to verify your brand appears in the content body. Set to an empty string to skip. |
| `brandCity` | Used by `geo-low-entity-density` to verify a location entity appears. Set to an empty string to skip. |
| `fillerPhrases` | Phrases flagged by `geo-weak-lead-sentences` and `geo-vague-opening`. Sections that open with these are considered filler. |
| `extractionTriggers` | Summary phrases checked by `geo-extraction-triggers`. Long posts should contain at least one of these to signal key takeaways to AI systems. |
| `acronymAllowlist` | Acronyms listed here are exempt from `geo-acronym-expansion`. Common acronyms like HTML, CSS, and API typically do not need expansion. |
| `vagueHeadings` | Generic heading text checked by `geo-heading-too-vague`. Headings matching these terms are flagged as too generic for AI extraction. |
| `genericAuthorNames` | Author names flagged by `geo-missing-author`. Names like "admin" or "team" do not satisfy E-E-A-T requirements. |
| `allowedHtmlTags` | HTML/JSX tags exempted from `geo-inline-html`. Use this for MDX components like `<Callout>` or `<Note>` that are not raw HTML. |

---

## Rule Severity Overrides

The `rules` object lets you change the severity of any rule or disable it entirely. Valid values are `'error'`, `'warning'`, and `'off'`.

```typescript
rules: {
  'geo-missing-table': 'off',       // Disable this rule completely
  'orphan-content': 'error',        // Upgrade from warning to error
  'content-too-short': 'off',       // Disable word count check
}
```

Rules set to `'error'` cause a non-zero exit code. Rules set to `'off'` are skipped entirely and produce no output.

---

## Threshold Overrides

The `thresholds` object lets you adjust the numeric limits used by SEO and content quality rules.

```typescript
thresholds: {
  title: { minLength: 30, maxLength: 60, warnLength: 55 },
  description: { minLength: 70, maxLength: 160, warnLength: 150 },
  slug: { maxLength: 75 },
  content: { minWordCount: 300, minReadabilityScore: 30 },
}
```

Each threshold group is optional. Omitted values fall back to built-in defaults.

---

[Back to main README](../README.md)
