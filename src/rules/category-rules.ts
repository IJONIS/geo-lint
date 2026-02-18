/**
 * Category Validation Rules
 * Validates blog categories against a user-provided canonical list
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Find the closest canonical category for a misspelled value
 */
function findSuggestion(value: string, canonicalCategories: Set<string>): string | undefined {
  const lower = value.toLowerCase();
  for (const canonical of canonicalCategories) {
    if (canonical.toLowerCase() === lower) {
      return canonical;
    }
  }
  return undefined;
}

/**
 * Factory: Create category validation rules from a list of valid categories
 * Returns an empty array when categories is empty (skip both rules).
 */
export function createCategoryRules(categories: string[]): Rule[] {
  if (categories.length === 0) {
    return [];
  }

  const canonicalCategories = new Set(categories);

  const categoryInvalid: Rule = {
    name: 'category-invalid',
    severity: 'error',
    category: 'content',
    fixStrategy: 'Use a valid category from the configured list',
    run: (item: ContentItem): LintResult[] => {
      if (!item.categories || item.categories.length === 0) return [];

      const results: LintResult[] = [];

      for (const cat of item.categories) {
        if (!canonicalCategories.has(cat)) {
          const suggested = findSuggestion(cat, canonicalCategories);
          results.push({
            file: getDisplayPath(item),
            field: 'categories',
            rule: 'category-invalid',
            severity: 'error',
            message: `Invalid category "${cat}"`,
            suggestion: suggested
              ? `Did you mean "${suggested}"? Valid categories: ${[...canonicalCategories].join(', ')}`
              : `Valid categories: ${[...canonicalCategories].join(', ')}`,
          });
        }
      }

      return results;
    },
  };

  const missingCategories: Rule = {
    name: 'missing-categories',
    severity: 'warning',
    category: 'content',
    fixStrategy: 'Add at least one category from the configured list',
    run: (item: ContentItem): LintResult[] => {
      if (item.contentType !== 'blog') return [];

      if (!item.categories || item.categories.length === 0) {
        return [{
          file: getDisplayPath(item),
          field: 'categories',
          rule: 'missing-categories',
          severity: 'warning',
          message: 'Blog post has no categories',
          suggestion: `Add at least one category: ${[...canonicalCategories].join(', ')}`,
        }];
      }
      return [];
    },
  };

  return [categoryInvalid, missingCategories];
}
