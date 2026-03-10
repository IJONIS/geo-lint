/**
 * Schema Rules
 * Validates structured data (schema.org) readiness for content frontmatter
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import type { GeoConfig } from '../config/types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { hasFAQSection, hasMarkdownTable } from '../utils/geo-analyzer.js';
import { analyzeFaqQuality } from '../utils/geo-advanced-analyzer.js';

const MIN_FAQ_PAIRS_FOR_SCHEMA = 3;
const MIN_DATASET_DESCRIPTION_LENGTH = 100;

/**
 * Rule: Blog posts should have fields required for rich BlogPosting schema
 * Checks for date, author, updatedAt, and image
 */
export const blogMissingSchemaFields: Rule = {
  name: 'blog-missing-schema-fields',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Add date, author, updatedAt, and image fields to frontmatter for complete schema.org data',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const results: LintResult[] = [];
    const file = getDisplayPath(item);
    const rule = 'blog-missing-schema-fields';

    if (!item.date) {
      results.push({
        file, field: 'date', rule, severity: 'warning',
        message: 'Missing date — BlogPosting schema datePublished will be empty',
        suggestion: 'Add a date field (ISO format) for schema.org datePublished.',
      });
    }

    if (!item.author) {
      results.push({
        file, field: 'author', rule, severity: 'warning',
        message: 'Missing author — BlogPosting schema author will be empty',
        suggestion: 'Add an author field for complete Article/BlogPosting structured data.',
      });
    }

    if (!item.updatedAt) {
      results.push({
        file, field: 'updatedAt', rule, severity: 'warning',
        message: 'Missing updatedAt — BlogPosting schema dateModified will fall back to datePublished',
        suggestion: 'Add updatedAt field to frontmatter for accurate schema.org dateModified.',
      });
    }

    if (!item.image || item.image.trim().length === 0) {
      results.push({
        file, field: 'image', rule, severity: 'warning',
        message: 'Missing featured image — BlogPosting schema image will be empty',
        suggestion: 'Add an image field for complete BlogPosting structured data.',
      });
    }

    return results;
  },
};

/**
 * Rule: Content with FAQ sections should meet FAQPage schema requirements
 * Validates structure is sufficient for schema.org FAQPage emission
 */
export const faqpageSchemaReadiness: Rule = {
  name: 'faqpage-schema-readiness',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Add at least 3 Q&A pairs with question marks to the FAQ section',
  run: (item: ContentItem): LintResult[] => {
    if (!hasFAQSection(item.body)) return [];

    const faq = analyzeFaqQuality(item.body);
    const results: LintResult[] = [];
    const file = getDisplayPath(item);
    const rule = 'faqpage-schema-readiness';

    if (faq.pairCount < MIN_FAQ_PAIRS_FOR_SCHEMA) {
      results.push({
        file, field: 'body', rule, severity: 'warning',
        message: `FAQ section has ${faq.pairCount} Q&A pairs — FAQPage schema needs at least ${MIN_FAQ_PAIRS_FOR_SCHEMA}`,
        suggestion: `Add more Q&A pairs (H3 headings with answers) to enable FAQPage structured data.`,
      });
    }

    if (faq.pairCount > 0 && faq.questionsWithMark < faq.pairCount) {
      results.push({
        file, field: 'body', rule, severity: 'warning',
        message: `${faq.pairCount - faq.questionsWithMark}/${faq.pairCount} FAQ headings lack question marks — FAQPage schema expects questions`,
        suggestion: 'End all FAQ headings with a question mark for valid FAQPage structured data.',
      });
    }

    return results;
  },
};

/**
 * Rule: Content should have category data for BreadcrumbList schema
 * Checks that categories or category is populated for breadcrumb generation
 */
export const breadcrumblistSchemaReadiness: Rule = {
  name: 'breadcrumblist-schema-readiness',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Add a categories array or category field to frontmatter for breadcrumb navigation',
  run: (item: ContentItem): LintResult[] => {
    const hasCategories = item.categories && item.categories.length > 0;
    const hasCategory = !!item.category;

    if (!hasCategories && !hasCategory) {
      return [{
        file: getDisplayPath(item),
        field: 'categories',
        rule: 'breadcrumblist-schema-readiness',
        severity: 'warning',
        message: 'No category data — BreadcrumbList schema will lack breadcrumb path',
        suggestion: 'Add a categories array or category field for BreadcrumbList structured data.',
      }];
    }
    return [];
  },
};

/**
 * Rule: Data-heavy content with tables should have fields for Dataset schema
 * Only fires on project/page content that contains markdown tables
 */
export const datasetSchemaReadiness: Rule = {
  name: 'dataset-schema-readiness',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Add a detailed description (100+ chars) and date field for Dataset schema readiness',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType === 'blog') return [];
    if (!hasMarkdownTable(item.body)) return [];

    const results: LintResult[] = [];
    const file = getDisplayPath(item);
    const rule = 'dataset-schema-readiness';

    if (item.description.length < MIN_DATASET_DESCRIPTION_LENGTH) {
      results.push({
        file, field: 'description', rule, severity: 'warning',
        message: `Description is too short for Dataset schema (${item.description.length}/${MIN_DATASET_DESCRIPTION_LENGTH} chars)`,
        suggestion: `Expand description to at least ${MIN_DATASET_DESCRIPTION_LENGTH} characters for rich Dataset structured data.`,
      });
    }

    if (!item.date) {
      results.push({
        file, field: 'date', rule, severity: 'warning',
        message: 'Missing date — Dataset schema dateModified will be empty',
        suggestion: 'Add a date field for Dataset schema temporal metadata.',
      });
    }

    return results;
  },
};

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
    createServicePageSchemaRule(geo.servicePagePatterns),
  ];
}

// Keep backward-compatible export
export const schemaRules = schemaStaticRules;
