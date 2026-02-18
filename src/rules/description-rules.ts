/**
 * Description Validation Rules
 * Validates meta description presence and length
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { resolveThresholds } from '../utils/resolve-thresholds.js';

/** Default description length thresholds (used when context has no thresholds) */
const DESC_DEFAULTS = { minLength: 70, maxLength: 160, warnLength: 150 };

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
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    if (!item.description) return [];

    const d = context.thresholds
      ? resolveThresholds(context.thresholds, item.contentType).description
      : DESC_DEFAULTS;
    const length = item.description.length;
    if (length > d.maxLength) {
      return [{
        file: getDisplayPath(item),
        field: 'description',
        rule: 'description-too-long',
        severity: 'error',
        message: `Description is too long (${length}/${d.maxLength} chars)`,
        suggestion: `Shorten to ${d.maxLength} characters to avoid truncation in search results`,
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
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    if (!item.description) return [];

    const d = context.thresholds
      ? resolveThresholds(context.thresholds, item.contentType).description
      : DESC_DEFAULTS;
    const length = item.description.length;
    if (length > d.warnLength && length <= d.maxLength) {
      return [{
        file: getDisplayPath(item),
        field: 'description',
        rule: 'description-approaching-limit',
        severity: 'warning',
        message: `Description is approaching maximum length (${length}/${d.maxLength} chars)`,
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
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    if (!item.description || item.description.trim().length === 0) return [];

    const d = context.thresholds
      ? resolveThresholds(context.thresholds, item.contentType).description
      : DESC_DEFAULTS;
    const length = item.description.length;
    if (length < d.minLength) {
      return [{
        file: getDisplayPath(item),
        field: 'description',
        rule: 'description-too-short',
        severity: 'warning',
        message: `Description is too short (${length}/${d.minLength} chars minimum)`,
        suggestion: `Expand the description to at least ${d.minLength} characters for better search result snippets`,
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
