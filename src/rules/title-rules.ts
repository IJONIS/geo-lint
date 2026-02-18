/**
 * Title Validation Rules
 * Validates title presence and length
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/** Default title length thresholds */
const TITLE_MIN_LENGTH = 30;
const TITLE_MAX_LENGTH = 60;
const TITLE_WARN_LENGTH = 55;

/**
 * Rule: Title must be present
 */
export const titleMissing: Rule = {
  name: 'title-missing',
  severity: 'error',
  category: 'seo',
  fixStrategy: 'Add a title field to the frontmatter',
  run: (item: ContentItem): LintResult[] => {
    if (!item.title || item.title.trim().length === 0) {
      return [{
        file: getDisplayPath(item),
        field: 'title',
        rule: 'title-missing',
        severity: 'error',
        message: 'Missing title',
        suggestion: 'Add a title field to the frontmatter',
      }];
    }
    return [];
  },
};

/**
 * Rule: Title should not be too short
 */
export const titleTooShort: Rule = {
  name: 'title-too-short',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Expand the title to meet minimum length',
  run: (item: ContentItem): LintResult[] => {
    if (!item.title) return [];

    const length = item.title.length;
    if (length > 0 && length < TITLE_MIN_LENGTH) {
      return [{
        file: getDisplayPath(item),
        field: 'title',
        rule: 'title-too-short',
        severity: 'warning',
        message: `Title is too short (${length}/${TITLE_MIN_LENGTH} chars minimum)`,
        suggestion: `Expand the title to at least ${TITLE_MIN_LENGTH} characters for better SEO`,
      }];
    }
    return [];
  },
};

/**
 * Rule: Title must not exceed maximum length
 */
export const titleTooLong: Rule = {
  name: 'title-too-long',
  severity: 'error',
  category: 'seo',
  fixStrategy: 'Shorten the title to avoid truncation in search results',
  run: (item: ContentItem): LintResult[] => {
    if (!item.title) return [];

    const length = item.title.length;
    if (length > TITLE_MAX_LENGTH) {
      return [{
        file: getDisplayPath(item),
        field: 'title',
        rule: 'title-too-long',
        severity: 'error',
        message: `Title is too long (${length}/${TITLE_MAX_LENGTH} chars)`,
        suggestion: `Shorten the title to ${TITLE_MAX_LENGTH} characters or less to avoid truncation in search results`,
      }];
    }
    return [];
  },
};

/**
 * Rule: Warn when title is approaching maximum length
 */
export const titleApproachingLimit: Rule = {
  name: 'title-approaching-limit',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Consider shortening to leave room for site name suffix',
  run: (item: ContentItem): LintResult[] => {
    if (!item.title) return [];

    const length = item.title.length;
    // Only warn if it's close to but not over the limit
    if (length > TITLE_WARN_LENGTH && length <= TITLE_MAX_LENGTH) {
      return [{
        file: getDisplayPath(item),
        field: 'title',
        rule: 'title-approaching-limit',
        severity: 'warning',
        message: `Title is approaching maximum length (${length}/${TITLE_MAX_LENGTH} chars)`,
        suggestion: 'Consider shortening to leave room for site name suffix in search results',
      }];
    }
    return [];
  },
};

/**
 * All title rules
 */
export const titleRules: Rule[] = [
  titleMissing,
  titleTooShort,
  titleTooLong,
  titleApproachingLimit,
];
