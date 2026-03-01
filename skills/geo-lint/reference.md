# geo-lint Rule Reference

Load this file on demand when you need rule details, fix patterns, or slug resolution logic.

---

## Slug Resolution

The `file` field in each violation uses the format `<contentType>/<slug>` (e.g., `blog/my-post`).

**Default directory mappings:**

| Content Type | Directory | URL Prefix |
|-------------|-----------|------------|
| `blog` | `content/blog/` | `/blog/` |
| `page` | `content/pages/` | `/` |
| `project` | `content/projects/` | `/projects/` |

**Resolution steps:**
1. Split `file` on first `/` to get contentType and slug
2. Map contentType to directory using defaults above
3. If project has `geo-lint.config.ts`, read `contentPaths` for custom mappings
4. Search: `grep -rl "^slug: <slug>" <content-dir>/`
5. Fallback: `<dir>/<slug>.mdx` or `<dir>/<slug>.md`

---

## Human-Escalation Rules

These 4 rules cannot be fixed autonomously. Skip them and report to the user:

| Rule | Why | User Action |
|------|-----|-------------|
| `geo-low-citation-density` | Requires real statistics — fabricating violates E-E-A-T | Add real statistics from credible sources with year, source name, and specific numbers |
| `image-not-found` | The referenced image must physically exist on disk | Create or download the image to the configured image directory |
| `broken-internal-link` | The target page may not exist or may have been moved | Create the missing page, update the link, or remove it |
| `category-invalid` | Valid categories are defined in `geo-lint.config.ts` | Use an existing category or add the new one to `categories` in config |

---

## All Rules by Category

### SEO (32 rules)

| Rule | Severity | Fix Strategy |
|------|----------|-------------|
| `title-missing` | error | Add a title field to the frontmatter |
| `title-too-short` | warning | Expand the title to meet minimum length |
| `title-too-long` | error | Shorten the title to avoid truncation in search results |
| `title-approaching-limit` | warning | Consider shortening to leave room for site name suffix |
| `description-missing` | error | Add a description field to the frontmatter (max 160 chars) |
| `description-too-long` | error | Shorten the description to avoid truncation in search results |
| `description-approaching-limit` | warning | Consider shortening to ensure full display in search results |
| `description-too-short` | warning | Expand the description for better search result snippets |
| `duplicate-title` | error | Use a unique title that differentiates this content from others |
| `duplicate-description` | error | Write a unique description that differentiates this content |
| `missing-h1` | warning | Add an H1 heading (# Heading) at the start of the content |
| `multiple-h1` | error | Convert extra H1s to H2s |
| `heading-hierarchy-skip` | warning | Adjust heading levels to avoid skipping (e.g., H2 before H3) |
| `duplicate-heading-text` | warning | Use unique heading text for each section |
| `slug-invalid-characters` | error | Use lowercase alphanumeric characters with hyphens only |
| `slug-too-long` | warning | Shorten the slug for better URL readability |
| `blog-missing-og-image` | warning | Add an image field to the frontmatter for social sharing previews |
| `project-missing-og-image` | warning | Add a thumbnail image for social media sharing previews |
| `canonical-missing` | warning | Add a canonical URL for pages accessible at multiple URLs |
| `canonical-malformed` | warning | Use a relative path or absolute URL on the site domain |
| `published-noindex` | warning | Remove noindex if content should be discoverable, or set draft: true |
| `orphan-content` | warning | Add an internal link to this page from a related page |
| `blog-missing-schema-fields` | warning | Add date, author, updatedAt, and image fields for schema.org data |
| `faqpage-schema-readiness` | warning | Add at least 3 Q&A pairs with question marks to the FAQ section |
| `breadcrumblist-schema-readiness` | warning | Add categories array or category field for breadcrumb navigation |
| `dataset-schema-readiness` | warning | Add a detailed description (100+ chars) and date field |
| `inline-image-missing-alt` | error | Add descriptive alt text for accessibility and SEO |
| `frontmatter-image-missing-alt` | warning | Add an imageAlt field to the frontmatter for the featured image |
| `external-link-low-density` | warning | Add outbound links to cite sources, reference tools, or link to studies |
| `keyword-not-in-description` | warning | Include at least one title keyword in the meta description |
| `keyword-not-in-headings` | warning | Include at least one title keyword in subheadings |
| `title-description-no-overlap` | warning | Ensure title and description share at least one keyword |

### GEO (35 rules)

**Core (7):**

| Rule | Severity | Fix Strategy |
|------|----------|-------------|
| `geo-no-question-headings` | warning | Rephrase some headings as questions (e.g., "How does X work?") |
| `geo-weak-lead-sentences` | warning | Start each section with a concise factual sentence that directly answers the heading |
| `geo-low-citation-density` | warning | Add statistics with source attribution (HUMAN ESCALATION) |
| `geo-missing-faq-section` | warning | Add an "## FAQ" section with 3+ Q&A pairs (min 20 words each) |
| `geo-missing-table` | warning | Add a comparison table, feature matrix, or data summary table |
| `geo-short-citation-blocks` | warning | Start each section with a 40-60 word paragraph that directly answers the heading |
| `geo-low-entity-density` | warning | Mention brand name and location naturally in the content body |

**E-E-A-T (8):**

| Rule | Severity | Fix Strategy |
|------|----------|-------------|
| `geo-missing-source-citations` | warning | Add source references using "according to [Source]" or linked citations |
| `geo-missing-expert-quotes` | warning | Add at least one blockquote with attribution (> "Quote" -- Expert Name) |
| `geo-faq-quality` | warning | Improve FAQ: 3+ Q&A pairs, use question marks, 20-150 word answers |
| `geo-definition-pattern` | warning | Start definition sections with "[Subject] is/are..." for AI extraction |
| `geo-howto-steps` | warning | Add a numbered list with 3+ steps to how-to sections |
| `geo-missing-tldr` | warning | Add a TL;DR, "Key Takeaway", or bold blockquote summary near the top |
| `geo-missing-author` | warning | Set a real author name in frontmatter (not a generic placeholder) |
| `geo-heading-too-vague` | warning | Replace vague headings with specific, descriptive headings of 3+ words |

**Structure (7):**

| Rule | Severity | Fix Strategy |
|------|----------|-------------|
| `geo-section-too-long` | warning | Break long sections into sub-sections with H3 headings every 200-300 words |
| `geo-paragraph-too-long` | warning | Split paragraphs longer than 100 words into shorter focused paragraphs |
| `geo-missing-lists` | warning | Add at least one bulleted or numbered list |
| `geo-citation-block-upper-bound` | warning | Keep the first paragraph after each heading under 80 words |
| `geo-orphaned-intro` | warning | Shorten the introduction to under 150 words or add a heading |
| `geo-heading-density` | warning | Add headings so no text gap exceeds 300 words without a heading |
| `geo-structural-element-ratio` | warning | Add structural elements (lists, tables, blockquotes, code blocks) |

**Freshness (7):**

| Rule | Severity | Fix Strategy |
|------|----------|-------------|
| `geo-stale-date-references` | warning | Update or remove year references older than 18 months |
| `geo-outdated-content` | warning | Review and update content, then set updatedAt to today |
| `geo-passive-voice-excess` | warning | Rewrite passive sentences in active voice |
| `geo-sentence-too-long` | warning | Break long sentences into two or more shorter sentences |
| `geo-low-internal-links` | warning | Add 2-3 internal links to related content on the same site |
| `geo-comparison-table` | warning | Add a comparison table under headings that discuss comparisons |
| `geo-inline-html` | warning | Replace inline HTML with markdown equivalents or add to allowedHtmlTags |

**RAG Optimization (6):**

| Rule | Severity | Fix Strategy |
|------|----------|-------------|
| `geo-extraction-triggers` | warning | Add summary phrases like "In summary", "Key takeaway" to help AI extraction |
| `geo-section-self-containment` | warning | Start each section with a specific subject instead of "This" or "It" |
| `geo-vague-opening` | warning | Replace the generic opening with a specific, substantive first sentence |
| `geo-acronym-expansion` | warning | Expand each acronym on first use, e.g. "Search Engine Optimization (SEO)" |
| `geo-statistic-without-context` | warning | Add source attribution or timeframe context to each statistic |
| `geo-missing-summary-section` | warning | Add a "## TL;DR", "## Key Takeaways", or "## Conclusion" section |

### Content Quality (14 rules)

| Rule | Severity | Fix Strategy |
|------|----------|-------------|
| `content-too-short` | warning | Expand the content for better SEO performance |
| `low-readability` | warning | Use shorter sentences for easier reading |
| `missing-date` | error | Add a date field (e.g., "2025-01-15") to the frontmatter |
| `future-date` | warning | Verify the publish date is correct or set it to today |
| `missing-updated-at` | warning | Add an updatedAt field for fresh content signals |
| `category-invalid` | error | Use a valid category from the configured list (HUMAN ESCALATION) |
| `missing-categories` | warning | Add at least one category from the configured list |
| `content-jargon-density` | warning | Replace complex or uncommon words with simpler alternatives |
| `content-repetition` | warning | Remove or rewrite paragraphs that repeat the same ideas |
| `content-sentence-length-extreme` | warning | Break long sentences into shorter ones (15-25 words per sentence) |
| `content-substance-ratio` | warning | Add specific, concrete information instead of abstract concepts |
| `content-low-transition-words` | warning | Add transition words (however, therefore, for example) between sentences |
| `content-consecutive-starts` | warning | Vary sentence openings with transition words, prepositional phrases |
| `content-sentence-variety` | warning | Mix short punchy sentences with longer explanatory ones |

### Technical (8 rules)

| Rule | Severity | Fix Strategy |
|------|----------|-------------|
| `broken-internal-link` | error | Fix the link target to point to an existing page (HUMAN ESCALATION) |
| `absolute-internal-link` | warning | Use a relative path instead of an absolute URL |
| `draft-link-leak` | error | Remove or update link — the target page is not publicly visible |
| `trailing-slash-inconsistency` | warning | Remove the trailing slash from the internal link |
| `external-link-malformed` | warning | Check the URL for typos or missing protocol (https://) |
| `external-link-http` | warning | Replace http:// with https:// |
| `image-not-found` | warning | Check that the image path is correct and the file exists (HUMAN ESCALATION) |
| `image-file-too-large` | warning | Compress the image or convert to WebP/AVIF format |

### i18n (3 rules)

| Rule | Severity | Fix Strategy |
|------|----------|-------------|
| `translation-pair-missing` | warning | Create the missing translation version with the same translationKey |
| `missing-locale` | warning | Add a locale field (de / en) to the frontmatter |
| `x-default-missing` | warning | Create a de version so hreflang x-default resolves correctly |

---

## Config Template

Minimal `geo-lint.config.ts` for getting started:

```typescript
import { defineConfig } from '@ijonis/geo-lint';

export default defineConfig({
  siteUrl: 'https://your-site.com',
  contentPaths: [
    { dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' },
  ],
  // Optional:
  // categories: ['technology', 'marketing'],
  // geo: { brandName: 'YourBrand', brandCity: 'Berlin' },
  // rules: { 'geo-missing-table': 'off' },
});
```

Full configuration reference: https://github.com/IJONIS/geo-lint/blob/main/docs/configuration.md
