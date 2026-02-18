/**
 * Canonical URL Validation Rules
 * Validates canonical URL presence and format
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Factory: Create canonical URL validation rules for the given site URL
 */
export function createCanonicalRules(siteUrl: string): Rule[] {
  /**
   * Rule: Every indexed page should have a canonical URL (permalink)
   * Skips noindexed pages since they don't need canonical tags
   */
  const canonicalMissing: Rule = {
    name: 'canonical-missing',
    severity: 'warning',
    category: 'seo',
    fixStrategy: 'Ensure the content has a valid slug so a permalink can be generated',
    run: (item: ContentItem): LintResult[] => {
      if (item.noindex) return [];

      if (!item.permalink || item.permalink.trim().length === 0) {
        return [{
          file: getDisplayPath(item),
          field: 'permalink',
          rule: 'canonical-missing',
          severity: 'warning',
          message: 'Missing canonical URL (permalink)',
          suggestion: 'Ensure the content has a valid slug so a permalink can be generated',
        }];
      }
      return [];
    },
  };

  /**
   * Rule: Canonical URL must be a valid relative path or absolute URL on the site domain
   * Catches misconfigured permalinks (wrong domain, http://, fragments, etc.)
   */
  const canonicalMalformed: Rule = {
    name: 'canonical-malformed',
    severity: 'warning',
    category: 'seo',
    fixStrategy: 'Use a relative path (e.g., /blog/my-post) or absolute URL on the site domain',
    run: (item: ContentItem): LintResult[] => {
      if (!item.permalink || item.permalink.trim().length === 0) return [];

      const permalink = item.permalink.trim();

      // Valid: relative path starting with /
      if (permalink.startsWith('/')) return [];

      // Valid: absolute URL on site domain
      if (permalink.startsWith(siteUrl)) return [];

      return [{
        file: getDisplayPath(item),
        field: 'permalink',
        rule: 'canonical-malformed',
        severity: 'warning',
        message: `Canonical URL has unexpected format: "${permalink}"`,
        suggestion: `Canonical should be a relative path (e.g., /blog/my-post) or absolute URL starting with ${siteUrl}`,
      }];
    },
  };

  return [canonicalMissing, canonicalMalformed];
}
