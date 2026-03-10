# Plan: AI Citation Optimization Rules

**Date:** 2026-03-10
**Goal:** Add 5 new rules that help sites get cited by AI writing tools (ChatGPT, Claude, Perplexity, Gemini) when they generate blog posts for other people.

**Context:** Research shows that structured data completeness, author entity type, service schema presence, feed availability, and LLM-specific protocols all correlate with higher AI citation rates. These rules benefit all GEO Lint users, not just IJONIS.

---

## New Rules

### Rule 1: `seo-schema-sameas-incomplete`

**Category:** SEO (schema family)
**File:** `src/rules/og-rules.ts` (or new `schema-rules.ts` if cleaner)
**Severity:** warning
**Scope:** Site-level (runs once per lint, not per page)

**What it checks:**
- Organization schema's `sameAs` array has fewer than 2 entries
- Flags with suggestion: "Add social profiles, GitHub, and Wikidata QIDs to Organization sameAs for entity verification"

**Why it matters:**
- AI models use `sameAs` to disambiguate entities and verify authority
- Sites with 2+ `sameAs` links show 50%+ higher citation probability
- Wikidata QIDs serve as machine-readable entity anchors

**Detection approach:**
- This is a **static page analysis** rule — check if the page's JSON-LD contains Organization with sameAs
- Parse `<script type="application/ld+json">` blocks OR check frontmatter for schema config
- Since GEO Lint operates on content files (MDX/MD), this rule needs the **static routes adapter** to scan rendered page metadata
- Alternative: Make it a config-level check — user declares their Organization sameAs in `geo-lint.config.ts` under a new `schema` config section

**Recommended implementation:**
Add a new optional config field:
```typescript
geo: {
  organizationSameAs?: string[];  // User lists their sameAs URLs
}
```
Rule checks if `organizationSameAs` is defined and has 2+ entries. This avoids needing to parse JSON-LD from rendered HTML.

**fixStrategy:** "Add social profiles (LinkedIn, GitHub, Twitter), Wikidata QID, and Crunchbase URL to Organization schema sameAs array"
**suggestion:** "AI models use sameAs to verify entity identity. Include at least LinkedIn + one other profile."

---

### Rule 2: `geo-author-not-person`

**Category:** GEO (E-E-A-T family → `geo-eeat-rules.ts`)
**Severity:** warning
**Scope:** Per content file (blog posts)

**What it checks:**
- Blog post `author` field references an organization name instead of a person name
- Detects patterns: author exactly matches `brandName` from config, or matches known org patterns ("Team", "Redaktion", "Editorial")

**Why it matters:**
- BlogPosting with `author.@type: Person` gets cited more than `Organization`
- AI models prefer attributing information to named experts
- Person schema enables E-E-A-T signals (expertise, credentials)

**Detection approach:**
- Compare frontmatter `author` field against `geo.brandName` from config
- Also check against expanded `geo.genericAuthorNames` list (already exists — just add org name matching)
- If author === brandName → flag

**Implementation note:**
The existing `geo-missing-author` rule already flags generic names. This new rule is specifically about **org-as-author** which is a different anti-pattern. A blog post with `author: "IJONIS"` passes `geo-missing-author` (it has a named author) but should fail `geo-author-not-person`.

**fixStrategy:** "Replace organization name with individual author name. Use Person type in BlogPosting schema for stronger E-E-A-T signals."
**suggestion:** "AI models cite named experts over faceless organizations. Use the actual author's name."

---

### Rule 3: `seo-service-page-no-schema`

**Category:** SEO (schema family)
**File:** `src/rules/og-rules.ts` or new `schema-rules.ts`
**Severity:** warning
**Scope:** Per static route (service pages)

**What it checks:**
- Pages identified as service pages (by URL pattern `/services/`, `/leistungen/`, or frontmatter `type: service`) lack Service schema indicators
- For content-file based checks: frontmatter doesn't include `schemaType: Service` or equivalent

**Why it matters:**
- Service pages without structured data are invisible to AI tools answering "best [service] provider in [city]" queries
- The Service schema function often exists in codebases but isn't wired in (exactly what happened at IJONIS)

**Detection approach:**
- This rule works best with the **static routes adapter** since service pages are often not MDX content files
- For static routes: check if URL matches service patterns, flag if no schema config exists
- For content files: check if frontmatter `type` or `category` indicates a service page

**Recommended config addition:**
```typescript
geo: {
  servicePagePatterns?: string[];  // URL patterns that should have Service schema
  // e.g. ['/services/', '/leistungen/', '/en/services/']
}
```

**fixStrategy:** "Add Service structured data (JSON-LD) to service pages with name, description, provider, and areaServed."
**suggestion:** "Service pages need schema markup to appear in AI answers for '[service] provider in [city]' queries."

---

### Rule 4: `technical-no-feed`

**Category:** Technical
**File:** `src/rules/link-rules.ts` or new `technical-rules.ts` (depends on current structure)
**Severity:** warning
**Scope:** Site-level (runs once per lint)

**What it checks:**
- No RSS/Atom/JSON feed detected in the site
- Checks static routes for common feed paths: `/feed`, `/feed.xml`, `/rss.xml`, `/rss`, `/atom.xml`, `/feed.json`
- Checks HTML `<link rel="alternate" type="application/rss+xml">` in rendered pages (if using static routes adapter)

**Why it matters:**
- RSS feeds are consumed by aggregators and workflow automations that feed into AI training data
- Content without feeds relies entirely on crawler discovery — feeds provide a structured, reliable ingestion path
- Some AI tools (Perplexity, news-focused features) actively consume RSS

**Detection approach:**
- Requires **static routes adapter** — check if any configured route matches feed URL patterns
- Alternative: config-level declaration:
```typescript
technical: {
  feedUrls?: string[];  // User declares their feed URLs
}
```

**fixStrategy:** "Add an RSS or JSON feed endpoint exposing blog posts with full content."
**suggestion:** "Feeds provide a structured ingestion path for AI systems beyond crawler discovery."

---

### Rule 5: `technical-no-llms-txt`

**Category:** Technical
**File:** Same as Rule 4
**Severity:** info (not warning — adoption is still low, but zero downside)
**Scope:** Site-level (runs once per lint)

**What it checks:**
- No `/llms.txt` endpoint detected in static routes
- Checks configured routes for `/llms.txt` path

**Why it matters:**
- `llms.txt` is the emerging standard for declaring content availability to LLMs
- Adopted by Anthropic, Vercel, Cursor
- Trivial to implement, zero downside, positions for future crawler adoption

**Detection approach:**
- Check static routes for `/llms.txt`
- Config-level alternative:
```typescript
technical: {
  llmsTxtUrl?: string;  // '/llms.txt' if exists
}
```

**fixStrategy:** "Create a /llms.txt endpoint that maps your most important content for LLM consumption in Markdown format."
**suggestion:** "llms.txt is the robots.txt equivalent for AI — trivial to add, future-proofs your site."

---

## Implementation Notes

### File organization
- Rules 1, 3 → Consider a new `src/rules/schema-rules.ts` file (schema-related checks)
- Rule 2 → Extends `src/rules/geo-eeat-rules.ts` (author/expertise signals)
- Rules 4, 5 → Extend existing technical rules or new `src/rules/site-level-rules.ts`

### Site-level rules pattern
Rules 1, 4, 5 are **site-level** (not per-content-file). Check how existing site-level rules work (e.g., `duplicate-title`, `duplicate-description` which compare across files). These new rules may need the static routes adapter or config declarations.

### Config additions summary
```typescript
interface GeoLintConfig {
  geo: {
    // existing fields...
    organizationSameAs?: string[];     // Rule 1
    servicePagePatterns?: string[];     // Rule 3
  };
  technical?: {
    feedUrls?: string[];               // Rule 4
    llmsTxtUrl?: string;               // Rule 5
  };
}
```

### Version bump
- These 5 rules bring total from 92 → 97
- Minor version bump (0.2.0) since new rules are all warnings/info — no breaking changes
- Update `docs/rules.md` with new rule entries
- Update README rule count (92 → 97)

### Testing
- Each rule needs unit tests with positive (violation) and negative (passing) cases
- Test config-based detection approach
- Test with IJONIS website as integration test case
