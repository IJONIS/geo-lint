/**
 * Description Validation Rules
 * Validates meta description presence and length
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/** Default description length thresholds */
const DESC_MIN_LENGTH = 70;
const DESC_MAX_LENGTH = 160;
const DESC_WARN_LENGTH = 150;

/**
 * Rule: Description must be present
 */
export const descriptionMissing: Rule = {
  name: 'description-missing',
  severity: 'error',
  category: 'seo',
  fixStrategy: 'Add a description field to the frontmatter (max 160 chars)',
  run: (item: ContentItem): LintResult[] => {
    if (!item.description || item.description.trim().length === 0) {
      return [{
        file: getDisplayPath(item),
        field: 'description',
        rule: 'description-missing',
        severity: 'error',
        message: 'Missing description',
        suggestion: 'Add a description field to the frontmatter (max 160 chars)',
      }];
    }
    return [];
  },
};

/**
 * Rule: Description must not exceed maximum length
 */
export const descriptionTooLong: Rule = {
  name: 'description-too-long',
  severity: 'error',
  category: 'seo',
  fixStrategy: 'Shorten the description to avoid truncation in search results',
  run: (item: ContentItem): LintResult[] => {
    if (!item.description) return [];

    const length = item.description.length;
    if (length > DESC_MAX_LENGTH) {
      return [{
        file: getDisplayPath(item),
        field: 'description',
        rule: 'description-too-long',
        severity: 'error',
        message: `Description is too long (${length}/${DESC_MAX_LENGTH} chars)`,
        suggestion: `Shorten to ${DESC_MAX_LENGTH} characters to avoid truncation in search results`,
      }];
    }
    return [];
  },
};

/**
 * Rule: Warn when description is approaching maximum length
 */
export const descriptionApproachingLimit: Rule = {
  name: 'description-approaching-limit',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Consider shortening to ensure full display in search results',
  run: (item: ContentItem): LintResult[] => {
    if (!item.description) return [];

    const length = item.description.length;
    // Only warn if it's close to but not over the limit
    if (length > DESC_WARN_LENGTH && length <= DESC_MAX_LENGTH) {
      return [{
        file: getDisplayPath(item),
        field: 'description',
        rule: 'description-approaching-limit',
        severity: 'warning',
        message: `Description is approaching maximum length (${length}/${DESC_MAX_LENGTH} chars)`,
        suggestion: 'Consider shortening to ensure full display in search results',
      }];
    }
    return [];
  },
};

/**
 * Rule: Description should meet minimum length for effective SEO
 */
export const descriptionTooShort: Rule = {
  name: 'description-too-short',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Expand the description for better search result snippets',
  run: (item: ContentItem): LintResult[] => {
    // Skip if description is missing entirely (caught by description-missing)
    if (!item.description || item.description.trim().length === 0) return [];

    const length = item.description.length;
    if (length < DESC_MIN_LENGTH) {
      return [{
        file: getDisplayPath(item),
        field: 'description',
        rule: 'description-too-short',
        severity: 'warning',
        message: `Description is too short (${length}/${DESC_MIN_LENGTH} chars minimum)`,
        suggestion: `Expand the description to at least ${DESC_MIN_LENGTH} characters for better search result snippets`,
      }];
    }
    return [];
  },
};

/**
 * All description rules
 */
export const descriptionRules: Rule[] = [
  descriptionMissing,
  descriptionTooLong,
  descriptionApproachingLimit,
  descriptionTooShort,
];
