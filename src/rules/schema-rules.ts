/**
 * Schema Rules
 * Validates structured data (schema.org) readiness for content frontmatter
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
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

/**
 * All schema rules
 */
export const schemaRules: Rule[] = [
  blogMissingSchemaFields,
  faqpageSchemaReadiness,
  breadcrumblistSchemaReadiness,
  datasetSchemaReadiness,
];
