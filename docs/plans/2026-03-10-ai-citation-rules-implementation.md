# AI Citation Optimization Rules — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 5 new rules that help sites get cited by AI writing tools (ChatGPT, Claude, Perplexity, Gemini), bringing the total from 92 to 97.

**Architecture:** Three of the five rules (sameAs, feed, llms.txt) are config-level checks — they validate user-declared values in `geo-lint.config.ts` rather than scanning content files. This avoids needing a static routes adapter and keeps the rules deterministic. The other two rules (author-not-person, service-page-no-schema) run per-content-item using existing patterns. All five rules integrate via the standard `Rule` interface and `buildRules()` registry.

**Tech Stack:** TypeScript, Vitest, tsup, existing geo-lint rule infrastructure

---

## Key Findings from Codebase Analysis

Before implementation, note these adaptations from the original high-level plan:

1. **`schema-rules.ts` already exists** — Rules 1 and 3 belong there (not in a new file or `og-rules.ts`).
2. **No separate `technical-rules.ts` exists** — Rules 4 and 5 need a new `src/rules/technical-site-rules.ts` file. The existing link/external-link rules handle per-item technical checks; site-level technical rules are a new category.
3. **`GlobalRule` interface exists but is user-provided only** — It's passed via `LintOptions.globalRules` and has no config access. The site-level rules (1, 4, 5) should instead use the standard `Rule` interface with `RuleContext` to access `allContent` (running once on the first item, or using a dedup guard). This matches the pattern used by `duplicate-title`/`duplicate-description` which also do cross-item checks.
4. **Config changes need 3 files touched** — `src/config/types.ts` (types), `src/config/defaults.ts` (defaults), `src/config/loader.ts` (merge logic).
5. **Rule count references in 4 places** — `README.md` (×3), `docs/README.md` (×1). All say "92".
6. **Version is `0.1.6`** — Plan says bump to `0.2.0`, which makes sense (new feature, no breaking changes).

### Site-Level Rule Strategy

Rules 1, 4, and 5 are config-level checks. Two clean approaches:

**Option A (chosen): Config-aware factory rules that run once**
- Create factory functions that receive config values and return `Rule` objects
- The `run()` function checks against a `Set` to ensure it only fires once (first item seen)
- This matches how factory rules already work (`createGeoMissingAuthorRule`, etc.)
- Pro: No changes to the runner or `Rule` interface
- Con: Slight hack with the "run once" guard

**Option B (rejected): Extend GlobalRule to receive config**
- Would require changing `GlobalRule` interface and `lint()` function
- More invasive change for 3 rules

---

## Task 1: Extend Config Types

**Files:**
- Modify: `src/config/types.ts`
- Modify: `src/config/defaults.ts`
- Modify: `src/config/loader.ts`
- Test: `tests/unit/config/loader.test.ts` (if exists, otherwise manual verification)

### Step 1: Add new fields to `GeoConfig` and `GeoLintUserConfig`

In `src/config/types.ts`, add to `GeoConfig`:

```typescript
/** Organization sameAs URLs for entity verification (LinkedIn, GitHub, Wikidata QID, etc.) */
organizationSameAs?: string[];
/** URL patterns identifying service pages (e.g. ['/services/', '/leistungen/']) */
servicePagePatterns?: string[];
```

Add a new `TechnicalConfig` interface:

```typescript
/** Technical site-level configuration */
export interface TechnicalConfig {
  /** Declared feed URLs (e.g. ['/feed.xml', '/rss.xml']) */
  feedUrls?: string[];
  /** Path to llms.txt file (e.g. '/llms.txt') */
  llmsTxtUrl?: string;
}
```

Add `technical` to both `GeoLintUserConfig` and `GeoLintConfig`:

```typescript
// In GeoLintUserConfig:
/** Technical site-level configuration */
technical?: Partial<TechnicalConfig>;

// In GeoLintConfig:
/** Technical site-level configuration */
technical: TechnicalConfig;
```

### Step 2: Add defaults to `defaults.ts`

```typescript
technical: {
  feedUrls: [],
  llmsTxtUrl: '',
},
```

### Step 3: Update merge logic in `loader.ts`

In `mergeWithDefaults()`, add:

```typescript
technical: {
  feedUrls: user.technical?.feedUrls ?? DEFAULT_CONFIG.technical.feedUrls,
  llmsTxtUrl: user.technical?.llmsTxtUrl ?? DEFAULT_CONFIG.technical.llmsTxtUrl,
},
```

### Step 4: Run typecheck to verify

Run: `npm run typecheck`
Expected: PASS (no type errors from config changes)

### Step 5: Commit

```
feat(config): add organizationSameAs, servicePagePatterns, and technical config fields
```

---

## Task 2: Rule 1 — `seo-schema-sameas-incomplete`

**Files:**
- Modify: `src/rules/schema-rules.ts`
- Test: `tests/unit/rules/schema-rules.test.ts`
- Modify: `src/rules/index.ts` (registration)

### Step 1: Write failing tests

Add to `tests/unit/rules/schema-rules.test.ts`:

```typescript
import { createSchemaSameAsRule } from '../../../src/rules/schema-rules.js';

// ---------------------------------------------------------------------------
// seo-schema-sameas-incomplete
// ---------------------------------------------------------------------------

describe('seo-schema-sameas-incomplete', () => {
  it('skips when organizationSameAs is undefined (not configured)', () => {
    const rule = createSchemaSameAsRule(undefined);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('skips when organizationSameAs is empty array', () => {
    const rule = createSchemaSameAsRule([]);
    const item = createItem();
    // Empty = not configured, not a violation
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('warns when organizationSameAs has only 1 entry', () => {
    const rule = createSchemaSameAsRule(['https://linkedin.com/company/acme']);
    const item = createItem();
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('seo-schema-sameas-incomplete');
    expect(results[0].severity).toBe('warning');
  });

  it('passes when organizationSameAs has 2+ entries', () => {
    const rule = createSchemaSameAsRule([
      'https://linkedin.com/company/acme',
      'https://github.com/acme',
    ]);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('fires only once across multiple items', () => {
    const rule = createSchemaSameAsRule(['https://linkedin.com/company/acme']);
    const item1 = createItem({ slug: 'post-1' });
    const item2 = createItem({ slug: 'post-2' });
    const r1 = rule.run(item1, ctx);
    const r2 = rule.run(item2, ctx);
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(0);
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- tests/unit/rules/schema-rules.test.ts`
Expected: FAIL — `createSchemaSameAsRule` is not exported

### Step 3: Implement the rule

Add to `src/rules/schema-rules.ts`:

```typescript
const MIN_SAMEAS_ENTRIES = 2;

/**
 * Rule: Organization schema sameAs array should have 2+ entries
 * Config-level check — runs once per lint (fires on first item only)
 */
export function createSchemaSameAsRule(
  organizationSameAs: string[] | undefined
): Rule {
  let hasFired = false;

  return {
    name: 'seo-schema-sameas-incomplete',
    severity: 'warning',
    category: 'seo',
    fixStrategy:
      'Add social profiles (LinkedIn, GitHub, Twitter), Wikidata QID, and Crunchbase URL to Organization schema sameAs array',
    run: (_item: ContentItem): LintResult[] => {
      if (hasFired) return [];
      hasFired = true;

      // Not configured = skip (user hasn't declared sameAs)
      if (!organizationSameAs || organizationSameAs.length === 0) return [];

      if (organizationSameAs.length < MIN_SAMEAS_ENTRIES) {
        return [
          {
            file: '_site',
            field: 'schema',
            rule: 'seo-schema-sameas-incomplete',
            severity: 'warning',
            message: `Organization sameAs has ${organizationSameAs.length} entry — include at least ${MIN_SAMEAS_ENTRIES} for entity verification`,
            suggestion:
              'AI models use sameAs to verify entity identity. Include at least LinkedIn + one other profile (GitHub, Wikidata QID, Crunchbase).',
          },
        ];
      }

      return [];
    },
  };
}
```

### Step 4: Export from schema-rules.ts

Convert the static `schemaRules` export to a factory pattern. Change the bottom of the file:

```typescript
/** Static schema rules (no config dependency) */
export const schemaStaticRules: Rule[] = [
  blogMissingSchemaFields,
  faqpageSchemaReadiness,
  breadcrumblistSchemaReadiness,
  datasetSchemaReadiness,
];

/** Build the complete schema rule set from config */
export function createSchemaRules(geo: GeoConfig): Rule[] {
  return [
    ...schemaStaticRules,
    createSchemaSameAsRule(geo.organizationSameAs),
  ];
}

// Keep backward-compatible export for existing re-exports
export const schemaRules = schemaStaticRules;
```

**Important:** Import `GeoConfig` at the top of `schema-rules.ts`:

```typescript
import type { GeoConfig } from '../config/types.js';
```

### Step 5: Register in `src/rules/index.ts`

Replace:
```typescript
import { schemaRules } from './schema-rules.js';
```
with:
```typescript
import { createSchemaRules } from './schema-rules.js';
```

In `buildRules()`, replace:
```typescript
...schemaRules,
```
with:
```typescript
...createSchemaRules(config.geo),
```

Update re-exports at bottom:
```typescript
export { schemaStaticRules, schemaRules, createSchemaRules } from './schema-rules.js';
```

### Step 6: Run tests

Run: `npm test -- tests/unit/rules/schema-rules.test.ts`
Expected: PASS

### Step 7: Run full test suite

Run: `npm test`
Expected: PASS (no regressions)

### Step 8: Commit

```
feat(rules): add seo-schema-sameas-incomplete rule for Organization entity verification
```

---

## Task 3: Rule 2 — `geo-author-not-person`

**Files:**
- Modify: `src/rules/geo-eeat-rules.ts`
- Test: `tests/unit/rules/geo-eeat-rules.test.ts`

### Step 1: Write failing tests

Add to `tests/unit/rules/geo-eeat-rules.test.ts`:

```typescript
import { createGeoAuthorNotPersonRule } from '../../../src/rules/geo-eeat-rules.js';

// ---------------------------------------------------------------------------
// geo-author-not-person
// ---------------------------------------------------------------------------

describe('geo-author-not-person', () => {
  it('skips non-blog content', () => {
    const rule = createGeoAuthorNotPersonRule('ACME Corp');
    const item = createItem({ contentType: 'page', author: 'ACME Corp' });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('skips when brandName is empty (not configured)', () => {
    const rule = createGeoAuthorNotPersonRule('');
    const item = createItem({ author: 'ACME Corp' });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('skips when author is missing (handled by geo-missing-author)', () => {
    const rule = createGeoAuthorNotPersonRule('ACME Corp');
    const item = createItem({ author: undefined });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('warns when author exactly matches brandName', () => {
    const rule = createGeoAuthorNotPersonRule('ACME Corp');
    const item = createItem({ author: 'ACME Corp' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-author-not-person');
    expect(results[0].severity).toBe('warning');
  });

  it('warns when author matches brandName case-insensitively', () => {
    const rule = createGeoAuthorNotPersonRule('ACME Corp');
    const item = createItem({ author: 'acme corp' });
    expect(rule.run(item, ctx)).toHaveLength(1);
  });

  it('warns when author contains org patterns (Team)', () => {
    const rule = createGeoAuthorNotPersonRule('ACME Corp');
    const item = createItem({ author: 'ACME Team' });
    expect(rule.run(item, ctx)).toHaveLength(1);
  });

  it('warns when author contains org patterns (Redaktion)', () => {
    const rule = createGeoAuthorNotPersonRule('MyBrand');
    const item = createItem({ author: 'Redaktion' });
    expect(rule.run(item, ctx)).toHaveLength(1);
  });

  it('warns when author contains org patterns (Editorial)', () => {
    const rule = createGeoAuthorNotPersonRule('MyBrand');
    const item = createItem({ author: 'Editorial Team' });
    expect(rule.run(item, ctx)).toHaveLength(1);
  });

  it('passes when author is a person name', () => {
    const rule = createGeoAuthorNotPersonRule('ACME Corp');
    const item = createItem({ author: 'Jane Smith' });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('passes when author is a person name that partially contains brand', () => {
    const rule = createGeoAuthorNotPersonRule('Smith');
    const item = createItem({ author: 'Jane Smith' });
    // "Jane Smith" is not exactly "Smith", should pass
    expect(rule.run(item, ctx)).toHaveLength(0);
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- tests/unit/rules/geo-eeat-rules.test.ts`
Expected: FAIL — `createGeoAuthorNotPersonRule` is not exported

### Step 3: Implement the rule

Add to `src/rules/geo-eeat-rules.ts`:

```typescript
/** Patterns indicating organization-as-author (case-insensitive match) */
const ORG_AUTHOR_PATTERNS = [
  /\bteam\b/i,
  /\bredaktion\b/i,
  /\beditorial\b/i,
  /\beditors?\b/i,
  /\bherausgeber\b/i,
  /\bverlag\b/i,
  /\bredaktionsteam\b/i,
];

// -- Rule: geo-author-not-person (factory) --
export function createGeoAuthorNotPersonRule(brandName: string): Rule {
  return {
    name: 'geo-author-not-person',
    severity: 'warning',
    category: 'geo',
    fixStrategy:
      'Replace organization name with individual author name. Use Person type in BlogPosting schema for stronger E-E-A-T signals.',
    run: (item: ContentItem, context: RuleContext): LintResult[] => {
      const geoTypes = context.geoEnabledContentTypes ?? ['blog'];
      if (!geoTypes.includes(item.contentType)) return [];

      // Skip if no author (handled by geo-missing-author)
      if (!item.author || item.author.trim() === '') return [];

      // Skip if brand not configured
      if (!brandName || brandName.trim() === '') return [];

      const normalizedAuthor = item.author.trim().toLowerCase();

      // Check 1: author exactly matches brand name
      if (normalizedAuthor === brandName.trim().toLowerCase()) {
        return [
          {
            file: getDisplayPath(item),
            field: 'author',
            rule: 'geo-author-not-person',
            severity: 'warning',
            message: `Author "${item.author}" is the organization name — use a person's name instead`,
            suggestion:
              'AI models cite named experts over faceless organizations. Use the actual author\'s name for stronger E-E-A-T signals.',
          },
        ];
      }

      // Check 2: author matches org patterns
      const matchesOrgPattern = ORG_AUTHOR_PATTERNS.some((pattern) =>
        pattern.test(item.author!)
      );

      if (matchesOrgPattern) {
        return [
          {
            file: getDisplayPath(item),
            field: 'author',
            rule: 'geo-author-not-person',
            severity: 'warning',
            message: `Author "${item.author}" appears to be an organization or team name`,
            suggestion:
              'BlogPosting with author.@type: Person gets cited more than Organization. Use an individual person\'s name.',
          },
        ];
      }

      return [];
    },
  };
}
```

### Step 4: Register in `createGeoEeatRules`

Update the factory function at the bottom of `geo-eeat-rules.ts`:

```typescript
/** Build the complete E-E-A-T rule set from GEO config (6 static + 3 factory). */
export function createGeoEeatRules(geo: GeoConfig): Rule[] {
  return [
    ...geoEeatStaticRules,
    createGeoMissingAuthorRule(geo.genericAuthorNames ?? []),
    createGeoHeadingTooVagueRule(geo.vagueHeadings ?? []),
    createGeoAuthorNotPersonRule(geo.brandName),
  ];
}
```

### Step 5: Run tests

Run: `npm test -- tests/unit/rules/geo-eeat-rules.test.ts`
Expected: PASS

### Step 6: Run full test suite

Run: `npm test`
Expected: PASS

### Step 7: Commit

```
feat(rules): add geo-author-not-person rule to flag organization-as-author anti-pattern
```

---

## Task 4: Rule 3 — `seo-service-page-no-schema`

**Files:**
- Modify: `src/rules/schema-rules.ts`
- Test: `tests/unit/rules/schema-rules.test.ts`

### Step 1: Write failing tests

Add to `tests/unit/rules/schema-rules.test.ts`:

```typescript
import { createServicePageSchemaRule } from '../../../src/rules/schema-rules.js';

// ---------------------------------------------------------------------------
// seo-service-page-no-schema
// ---------------------------------------------------------------------------

describe('seo-service-page-no-schema', () => {
  it('skips when no service page patterns configured', () => {
    const rule = createServicePageSchemaRule(undefined);
    const item = createItem({ permalink: '/services/web-design' });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('skips when service page patterns is empty', () => {
    const rule = createServicePageSchemaRule([]);
    const item = createItem({ permalink: '/services/web-design' });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('warns when permalink matches a service pattern', () => {
    const rule = createServicePageSchemaRule(['/services/', '/leistungen/']);
    const item = createItem({
      permalink: '/services/web-design',
      contentType: 'page',
    });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('seo-service-page-no-schema');
    expect(results[0].severity).toBe('warning');
  });

  it('warns when permalink matches German service pattern', () => {
    const rule = createServicePageSchemaRule(['/services/', '/leistungen/']);
    const item = createItem({
      permalink: '/leistungen/webentwicklung',
      contentType: 'page',
    });
    expect(rule.run(item, ctx)).toHaveLength(1);
  });

  it('does not warn for non-service pages', () => {
    const rule = createServicePageSchemaRule(['/services/', '/leistungen/']);
    const item = createItem({
      permalink: '/blog/my-post',
      contentType: 'blog',
    });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('does not warn for pages that do not match any pattern', () => {
    const rule = createServicePageSchemaRule(['/services/']);
    const item = createItem({
      permalink: '/about',
      contentType: 'page',
    });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- tests/unit/rules/schema-rules.test.ts`
Expected: FAIL

### Step 3: Implement the rule

Add to `src/rules/schema-rules.ts`:

```typescript
/**
 * Rule: Service pages should have Service structured data
 * Checks if page URL matches a service page pattern and flags it for schema markup
 */
export function createServicePageSchemaRule(
  servicePagePatterns: string[] | undefined
): Rule {
  return {
    name: 'seo-service-page-no-schema',
    severity: 'warning',
    category: 'seo',
    fixStrategy:
      'Add Service structured data (JSON-LD) to service pages with name, description, provider, and areaServed.',
    run: (item: ContentItem): LintResult[] => {
      if (!servicePagePatterns || servicePagePatterns.length === 0) return [];

      const matchesPattern = servicePagePatterns.some((pattern) =>
        item.permalink.includes(pattern)
      );

      if (!matchesPattern) return [];

      return [
        {
          file: getDisplayPath(item),
          field: 'schema',
          rule: 'seo-service-page-no-schema',
          severity: 'warning',
          message: `Service page "${item.permalink}" should have Service structured data`,
          suggestion:
            'Service pages need schema markup to appear in AI answers for "[service] provider in [city]" queries. Add Service JSON-LD with name, description, provider, and areaServed.',
        },
      ];
    },
  };
}
```

### Step 4: Register in `createSchemaRules`

Update `createSchemaRules` in `schema-rules.ts`:

```typescript
export function createSchemaRules(geo: GeoConfig): Rule[] {
  return [
    ...schemaStaticRules,
    createSchemaSameAsRule(geo.organizationSameAs),
    createServicePageSchemaRule(geo.servicePagePatterns),
  ];
}
```

### Step 5: Run tests

Run: `npm test -- tests/unit/rules/schema-rules.test.ts`
Expected: PASS

### Step 6: Run full test suite

Run: `npm test`
Expected: PASS

### Step 7: Commit

```
feat(rules): add seo-service-page-no-schema rule for Service structured data detection
```

---

## Task 5: Rule 4 — `technical-no-feed`

**Files:**
- Create: `src/rules/technical-site-rules.ts`
- Create: `tests/unit/rules/technical-site-rules.test.ts`
- Modify: `src/rules/index.ts` (registration)

### Step 1: Write failing tests

Create `tests/unit/rules/technical-site-rules.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createNoFeedRule } from '../../../src/rules/technical-site-rules.js';
import { createItem, createContext } from '../../helpers.js';

const ctx = createContext();

// ---------------------------------------------------------------------------
// technical-no-feed
// ---------------------------------------------------------------------------

describe('technical-no-feed', () => {
  it('skips when feedUrls is undefined (not configured)', () => {
    const rule = createNoFeedRule(undefined);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('warns when feedUrls is empty array (configured but no feeds)', () => {
    const rule = createNoFeedRule([]);
    const item = createItem();
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('technical-no-feed');
    expect(results[0].severity).toBe('warning');
  });

  it('passes when feedUrls has at least one entry', () => {
    const rule = createNoFeedRule(['/feed.xml']);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('fires only once across multiple items', () => {
    const rule = createNoFeedRule([]);
    const item1 = createItem({ slug: 'post-1' });
    const item2 = createItem({ slug: 'post-2' });
    const r1 = rule.run(item1, ctx);
    const r2 = rule.run(item2, ctx);
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(0);
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- tests/unit/rules/technical-site-rules.test.ts`
Expected: FAIL — module not found

### Step 3: Implement the rule

Create `src/rules/technical-site-rules.ts`:

```typescript
/**
 * Technical Site-Level Rules
 * Validates site-wide technical requirements for AI citation optimization
 */

import type { Rule, ContentItem, LintResult, RuleContext } from '../types.js';
import type { TechnicalConfig } from '../config/types.js';

/**
 * Rule: Site should have at least one RSS/Atom/JSON feed
 * Config-level check — runs once per lint (fires on first item only)
 */
export function createNoFeedRule(
  feedUrls: string[] | undefined
): Rule {
  let hasFired = false;

  return {
    name: 'technical-no-feed',
    severity: 'warning',
    category: 'technical',
    fixStrategy:
      'Add an RSS or JSON feed endpoint exposing blog posts with full content.',
    run: (_item: ContentItem, _context: RuleContext): LintResult[] => {
      if (hasFired) return [];
      hasFired = true;

      // undefined = not configured, skip silently
      if (feedUrls === undefined) return [];

      // Empty array = user declared they have no feeds — flag it
      if (feedUrls.length === 0) {
        return [
          {
            file: '_site',
            field: 'feed',
            rule: 'technical-no-feed',
            severity: 'warning',
            message:
              'No RSS/Atom/JSON feed detected — AI systems lose a structured ingestion path',
            suggestion:
              'Feeds provide a structured ingestion path for AI systems beyond crawler discovery. Add an RSS or JSON feed endpoint.',
          },
        ];
      }

      return [];
    },
  };
}
```

### Step 4: Run tests

Run: `npm test -- tests/unit/rules/technical-site-rules.test.ts`
Expected: PASS

### Step 5: Register in `src/rules/index.ts`

Add import:
```typescript
import { createTechnicalSiteRules } from './technical-site-rules.js';
```

Add to `buildRules()`:
```typescript
...createTechnicalSiteRules(config.technical),
```

Add re-export:
```typescript
export { createNoFeedRule, createNoLlmsTxtRule, createTechnicalSiteRules } from './technical-site-rules.js';
```

**Note:** The `createTechnicalSiteRules` builder function doesn't exist yet — it will be created in Task 6 after implementing Rule 5. For now, register `createNoFeedRule` directly:

```typescript
...([createNoFeedRule(config.technical.feedUrls)]),
```

### Step 6: Run full test suite

Run: `npm test`
Expected: PASS

### Step 7: Commit

```
feat(rules): add technical-no-feed rule to check for RSS/Atom/JSON feed presence
```

---

## Task 6: Rule 5 — `technical-no-llms-txt` + Builder Function

**Files:**
- Modify: `src/rules/technical-site-rules.ts`
- Modify: `tests/unit/rules/technical-site-rules.test.ts`
- Modify: `src/rules/index.ts` (update registration)

### Step 1: Write failing tests

Add to `tests/unit/rules/technical-site-rules.test.ts`:

```typescript
import { createNoLlmsTxtRule, createTechnicalSiteRules } from '../../../src/rules/technical-site-rules.js';

// ---------------------------------------------------------------------------
// technical-no-llms-txt
// ---------------------------------------------------------------------------

describe('technical-no-llms-txt', () => {
  it('skips when llmsTxtUrl is undefined (not configured)', () => {
    const rule = createNoLlmsTxtRule(undefined);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('warns when llmsTxtUrl is empty string (configured but missing)', () => {
    const rule = createNoLlmsTxtRule('');
    const item = createItem();
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('technical-no-llms-txt');
    expect(results[0].severity).toBe('warning');
  });

  it('passes when llmsTxtUrl is set', () => {
    const rule = createNoLlmsTxtRule('/llms.txt');
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('fires only once across multiple items', () => {
    const rule = createNoLlmsTxtRule('');
    const item1 = createItem({ slug: 'post-1' });
    const item2 = createItem({ slug: 'post-2' });
    const r1 = rule.run(item1, ctx);
    const r2 = rule.run(item2, ctx);
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// createTechnicalSiteRules (builder)
// ---------------------------------------------------------------------------

describe('createTechnicalSiteRules', () => {
  it('returns 2 rules', () => {
    const rules = createTechnicalSiteRules({
      feedUrls: [],
      llmsTxtUrl: '',
    });
    expect(rules).toHaveLength(2);
    expect(rules.map(r => r.name)).toContain('technical-no-feed');
    expect(rules.map(r => r.name)).toContain('technical-no-llms-txt');
  });
});
```

### Step 2: Run tests to verify they fail

Run: `npm test -- tests/unit/rules/technical-site-rules.test.ts`
Expected: FAIL — `createNoLlmsTxtRule` not exported

### Step 3: Implement the rule and builder

Add to `src/rules/technical-site-rules.ts`:

```typescript
/**
 * Rule: Site should have a /llms.txt endpoint
 * Config-level check — runs once per lint (fires on first item only)
 */
export function createNoLlmsTxtRule(
  llmsTxtUrl: string | undefined
): Rule {
  let hasFired = false;

  return {
    name: 'technical-no-llms-txt',
    severity: 'warning',
    category: 'technical',
    fixStrategy:
      'Create a /llms.txt endpoint that maps your most important content for LLM consumption in Markdown format.',
    run: (_item: ContentItem, _context: RuleContext): LintResult[] => {
      if (hasFired) return [];
      hasFired = true;

      // undefined = not configured, skip silently
      if (llmsTxtUrl === undefined) return [];

      // Empty string = user declared they don't have llms.txt — flag it
      if (llmsTxtUrl.trim() === '') {
        return [
          {
            file: '_site',
            field: 'llms-txt',
            rule: 'technical-no-llms-txt',
            severity: 'warning',
            message:
              'No /llms.txt endpoint detected — missing the emerging standard for LLM content declaration',
            suggestion:
              'llms.txt is the robots.txt equivalent for AI — trivial to add, future-proofs your site for LLM crawlers.',
          },
        ];
      }

      return [];
    },
  };
}

/** Build the complete technical site-level rule set from config */
export function createTechnicalSiteRules(technical: TechnicalConfig): Rule[] {
  return [
    createNoFeedRule(technical.feedUrls),
    createNoLlmsTxtRule(technical.llmsTxtUrl),
  ];
}
```

### Step 4: Update registration in `src/rules/index.ts`

Replace the temporary single-rule registration from Task 5 with the builder:

```typescript
import { createTechnicalSiteRules } from './technical-site-rules.js';
```

In `buildRules()`:
```typescript
...createTechnicalSiteRules(config.technical),
```

Re-exports:
```typescript
export { createNoFeedRule, createNoLlmsTxtRule, createTechnicalSiteRules } from './technical-site-rules.js';
```

### Step 5: Run tests

Run: `npm test -- tests/unit/rules/technical-site-rules.test.ts`
Expected: PASS

### Step 6: Run full test suite

Run: `npm test`
Expected: PASS

### Step 7: Commit

```
feat(rules): add technical-no-llms-txt rule and createTechnicalSiteRules builder
```

---

## Task 7: Update Rule Counts and Documentation

**Files:**
- Modify: `README.md` — update all "92" references to "97"
- Modify: `docs/README.md` — update rule count
- Modify: `docs/plans/2026-03-10-ai-citation-rules.md` — mark as implemented

### Step 1: Update README.md

Search and replace all instances of "92 rules" or "92" in rule count context with "97":

- Line with `# Show all 92 rules` → `# Show all 97 rules`
- Line with `geo-lint's 92 rules` → `geo-lint's 97 rules`
- Line with `**92 rules:` → `**97 rules:`
- Line with `## All 92 Rules` → `## All 97 Rules`

Update the category counts table:
- GEO: 35 → 36 (added `geo-author-not-person`)
- SEO: 32 → 34 (added `seo-schema-sameas-incomplete`, `seo-service-page-no-schema`)
- Technical: 8 → 10 (added `technical-no-feed`, `technical-no-llms-txt`)
- Content: 14 (unchanged)
- i18n: 3 (unchanged)

Add new rule entries to the rules table in README.md under the appropriate categories.

### Step 2: Update docs/README.md

Update `all 92 rules` → `all 97 rules`

### Step 3: Add new rules to rule documentation

Add entries for each new rule in the appropriate sections of README.md and docs/rules.md (if it exists as a separate file).

New rule entries:

**SEO section:**
| `seo-schema-sameas-incomplete` | warning | Organization sameAs has fewer than 2 entries for entity verification |
| `seo-service-page-no-schema` | warning | Service page URL matches pattern but lacks Service structured data |

**GEO section:**
| `geo-author-not-person` | warning | Blog author is an organization name instead of a person |

**Technical section:**
| `technical-no-feed` | warning | No RSS/Atom/JSON feed declared in config |
| `technical-no-llms-txt` | warning | No /llms.txt endpoint declared in config |

### Step 4: Commit

```
docs: update rule counts from 92 to 97, document 5 new AI citation rules
```

---

## Task 8: Version Bump and Final Verification

**Files:**
- Modify: `package.json` — version `0.1.6` → `0.2.0`
- Modify: `CHANGELOG.md` (if exists)

### Step 1: Run full test suite

Run: `npm test`
Expected: PASS, all tests green

### Step 2: Run typecheck

Run: `npm run typecheck`
Expected: PASS, no type errors

### Step 3: Run build

Run: `npm run build`
Expected: PASS, dist/ output generated

### Step 4: Verify rule count

Run: `node -e "const { buildRules } = require('./dist/index.cjs'); console.log('skipping — needs config');"` or count rules manually.

Alternatively, after build, run:
```bash
npx geo-lint --rules 2>/dev/null | wc -l
```

### Step 5: Update version in package.json

Change `"version": "0.1.6"` → `"version": "0.2.0"`

### Step 6: Update CHANGELOG.md (if exists)

Add entry:

```markdown
## [0.2.0] — 2026-03-10

### Added
- `seo-schema-sameas-incomplete` — flags Organization schema with fewer than 2 sameAs entries
- `geo-author-not-person` — flags blog posts with organization names as author
- `seo-service-page-no-schema` — flags service pages without Service structured data
- `technical-no-feed` — flags sites without RSS/Atom/JSON feeds
- `technical-no-llms-txt` — flags sites without /llms.txt endpoint
- New config fields: `geo.organizationSameAs`, `geo.servicePagePatterns`, `technical.feedUrls`, `technical.llmsTxtUrl`

### Changed
- Rule count increased from 92 to 97
- `schema-rules.ts` now uses factory pattern (`createSchemaRules`) for config-aware rules
```

### Step 7: Commit

```
chore(release): bump version to 0.2.0 — 5 new AI citation optimization rules
```

---

## Summary

| Task | Rule(s) | Files Modified | Files Created |
|------|---------|---------------|---------------|
| 1 | Config extension | 3 (`config/types.ts`, `defaults.ts`, `loader.ts`) | 0 |
| 2 | `seo-schema-sameas-incomplete` | 3 (`schema-rules.ts`, test, `index.ts`) | 0 |
| 3 | `geo-author-not-person` | 2 (`geo-eeat-rules.ts`, test) | 0 |
| 4 | `seo-service-page-no-schema` | 2 (`schema-rules.ts`, test) | 0 |
| 5 | `technical-no-feed` | 2 (`index.ts`, test) | 1 (`technical-site-rules.ts`) |
| 6 | `technical-no-llms-txt` + builder | 2 (`technical-site-rules.ts`, test, `index.ts`) | 0 |
| 7 | Documentation | 2+ (`README.md`, `docs/README.md`) | 0 |
| 8 | Version bump + verify | 2 (`package.json`, `CHANGELOG.md`) | 0 |

**Total: 8 tasks, 5 new rules, 1 new file, ~10 modified files, ~8 commits**

### Design Decisions

1. **Config-level rules over HTML parsing** — Rules 1, 4, 5 use config declarations instead of scanning rendered pages. This keeps them deterministic and avoids needing a browser or static routes adapter.
2. **"Fire once" guard pattern** — Site-level rules use a `hasFired` closure variable to ensure they only report once despite being called per-item. This is slightly hacky but avoids changing the `Rule` interface.
3. **`undefined` vs empty** — For config-level rules, `undefined` means "not configured" (skip silently), while an explicitly empty value means "user acknowledges they don't have this" (flag it). This lets existing users upgrade without seeing new warnings until they add the config.
4. **Factory pattern for schema-rules.ts** — Converting from static to factory export matches the existing pattern used by GEO, link, and canonical rules. Backward-compatible re-export preserves `schemaRules` for external consumers.
5. **Separate `technical-site-rules.ts`** — Site-level technical checks are conceptually different from per-item technical checks (link validation, image checks). A new file keeps responsibilities clear.
