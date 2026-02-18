/**
 * Date Validation Rules
 * Validates date presence and correctness for blog and project content
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Rule: Blog and project content must have a date field
 */
export const missingDate: Rule = {
  name: 'missing-date',
  severity: 'error',
  category: 'content',
  fixStrategy: 'Add a date field (e.g., "2025-01-15") to the frontmatter',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType === 'page') return [];

    if (!item.date) {
      return [{
        file: getDisplayPath(item),
        field: 'date',
        rule: 'missing-date',
        severity: 'error',
        message: 'Missing date field',
        suggestion: 'Add a date field (e.g., "2025-01-15") to the frontmatter',
      }];
    }
    return [];
  },
};

/**
 * Rule: Date should not be in the future
 */
export const futureDate: Rule = {
  name: 'future-date',
  severity: 'warning',
  category: 'content',
  fixStrategy: 'Verify the publish date is correct or set it to today',
  run: (item: ContentItem): LintResult[] => {
    if (!item.date) return [];

    const dateValue = new Date(item.date);
    const now = new Date();

    if (dateValue > now) {
      return [{
        file: getDisplayPath(item),
        field: 'date',
        rule: 'future-date',
        severity: 'warning',
        message: `Date "${item.date}" is in the future`,
        suggestion: 'Verify the publish date is correct or set it to today',
      }];
    }
    return [];
  },
};

/**
 * Rule: Blog and project content should have an updatedAt field
 */
export const missingUpdatedAt: Rule = {
  name: 'missing-updated-at',
  severity: 'warning',
  category: 'content',
  fixStrategy: 'Add an updatedAt field to help search engines identify fresh content',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType === 'page') return [];

    if (!item.updatedAt) {
      return [{
        file: getDisplayPath(item),
        field: 'updatedAt',
        rule: 'missing-updated-at',
        severity: 'warning',
        message: 'Missing updatedAt field',
        suggestion: 'Add an updatedAt field to help search engines identify fresh content',
      }];
    }
    return [];
  },
};

/**
 * All date rules
 */
export const dateRules: Rule[] = [
  missingDate,
  futureDate,
  missingUpdatedAt,
];
