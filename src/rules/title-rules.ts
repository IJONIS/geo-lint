/**
 * Title Validation Rules
 * Validates title presence and length
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { resolveThresholds } from '../utils/resolve-thresholds.js';

/** Default title length thresholds (used when context has no thresholds) */
const TITLE_DEFAULTS = { minLength: 30, maxLength: 60, warnLength: 55 };

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
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    if (!item.title) return [];

    const t = context.thresholds
      ? resolveThresholds(context.thresholds, item.contentType).title
      : TITLE_DEFAULTS;
    const length = item.title.length;
    if (length > 0 && length < t.minLength) {
      return [{
        file: getDisplayPath(item),
        field: 'title',
        rule: 'title-too-short',
        severity: 'warning',
        message: `Title is too short (${length}/${t.minLength} chars minimum)`,
        suggestion: `Expand the title to at least ${t.minLength} characters for better SEO`,
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
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    if (!item.title) return [];

    const t = context.thresholds
      ? resolveThresholds(context.thresholds, item.contentType).title
      : TITLE_DEFAULTS;
    const length = item.title.length;
    if (length > t.maxLength) {
      return [{
        file: getDisplayPath(item),
        field: 'title',
        rule: 'title-too-long',
        severity: 'error',
        message: `Title is too long (${length}/${t.maxLength} chars)`,
        suggestion: `Shorten the title to ${t.maxLength} characters or less to avoid truncation in search results`,
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
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    if (!item.title) return [];

    const t = context.thresholds
      ? resolveThresholds(context.thresholds, item.contentType).title
      : TITLE_DEFAULTS;
    const length = item.title.length;
    if (length > t.warnLength && length <= t.maxLength) {
      return [{
        file: getDisplayPath(item),
        field: 'title',
        rule: 'title-approaching-limit',
        severity: 'warning',
        message: `Title is approaching maximum length (${length}/${t.maxLength} chars)`,
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
