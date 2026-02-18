/**
 * Slug Validation Rules
 * Validates slug format and length for SEO-friendly URLs
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { resolveThresholds } from '../utils/resolve-thresholds.js';

/** Default slug threshold (used when context has no thresholds) */
const SLUG_DEFAULTS = { maxLength: 75 };
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Rule: Slug must contain only valid characters (lowercase alphanumeric + hyphens)
 */
export const slugInvalidCharacters: Rule = {
  name: 'slug-invalid-characters',
  severity: 'error',
  category: 'seo',
  fixStrategy: 'Use lowercase alphanumeric characters with hyphens only (e.g., "my-blog-post")',
  run: (item: ContentItem): LintResult[] => {
    if (!item.slug) return [];

    const hasUppercase = /[A-Z]/.test(item.slug);
    const matchesPattern = SLUG_PATTERN.test(item.slug);

    if (hasUppercase || !matchesPattern) {
      return [{
        file: getDisplayPath(item),
        field: 'slug',
        rule: 'slug-invalid-characters',
        severity: 'error',
        message: `Slug "${item.slug}" contains invalid characters`,
        suggestion: 'Slugs must be lowercase alphanumeric with hyphens only (e.g., "my-blog-post")',
      }];
    }
    return [];
  },
};

/**
 * Rule: Slug should not exceed maximum length
 */
export const slugTooLong: Rule = {
  name: 'slug-too-long',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Shorten the slug for better URL readability',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    if (!item.slug) return [];

    const s = context.thresholds
      ? resolveThresholds(context.thresholds, item.contentType).slug
      : SLUG_DEFAULTS;
    const length = item.slug.length;
    if (length > s.maxLength) {
      return [{
        file: getDisplayPath(item),
        field: 'slug',
        rule: 'slug-too-long',
        severity: 'warning',
        message: `Slug is too long (${length}/${s.maxLength} chars)`,
        suggestion: `Shorten the slug to ${s.maxLength} characters or less for better URL readability`,
      }];
    }
    return [];
  },
};

/**
 * All slug rules
 */
export const slugRules: Rule[] = [
  slugInvalidCharacters,
  slugTooLong,
];
