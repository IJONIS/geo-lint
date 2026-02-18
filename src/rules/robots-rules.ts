/**
 * Robots / Indexing Validation Rules
 * Validates noindex and robots-related settings
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Rule: Published (non-draft) content with noindex may be unintentional
 * Warns when content is publicly available but hidden from search engines
 */
export const publishedNoindex: Rule = {
  name: 'published-noindex',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Remove noindex if content should be discoverable, or set draft: true to hide it',
  run: (item: ContentItem): LintResult[] => {
    if (!item.draft && item.noindex === true) {
      return [{
        file: getDisplayPath(item),
        field: 'noindex',
        rule: 'published-noindex',
        severity: 'warning',
        message: 'Published content has noindex set — it will not appear in search results',
        suggestion: 'Remove noindex if this content should be discoverable, or set draft: true if it should be hidden entirely',
      }];
    }
    return [];
  },
};

/**
 * All robots/indexing rules
 */
export const robotsRules: Rule[] = [
  publishedNoindex,
];
