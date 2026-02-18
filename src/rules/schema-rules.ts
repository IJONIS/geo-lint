/**
 * Schema Rules
 * Validates structured data (schema.org) readiness for content
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Rule: Blog posts should have fields required for rich BlogPosting schema
 * Checks for updatedAt (dateModified) and image (schema image)
 */
export const blogMissingSchemaFields: Rule = {
  name: 'blog-missing-schema-fields',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Add updatedAt and image fields to frontmatter for complete schema.org data',
  run: (item: ContentItem): LintResult[] => {
    // Only apply to blog posts
    if (item.contentType !== 'blog') {
      return [];
    }

    const results: LintResult[] = [];

    if (!item.updatedAt) {
      results.push({
        file: getDisplayPath(item),
        field: 'updatedAt',
        rule: 'blog-missing-schema-fields',
        severity: 'warning',
        message: 'Missing updatedAt — BlogPosting schema dateModified will fall back to datePublished',
        suggestion: 'Add updatedAt field to frontmatter for accurate schema.org dateModified.',
      });
    }

    if (!item.image || item.image.trim().length === 0) {
      results.push({
        file: getDisplayPath(item),
        field: 'image',
        rule: 'blog-missing-schema-fields',
        severity: 'warning',
        message: 'Missing featured image — BlogPosting schema image will be empty',
        suggestion: 'Add an image field for complete BlogPosting structured data.',
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
];
