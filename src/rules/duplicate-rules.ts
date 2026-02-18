/**
 * Duplicate Detection Rules
 * Validates that titles and descriptions are unique across all content
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Build a map of value -> list of files using that value
 */
function buildDuplicateMap(
  items: ContentItem[],
  getValue: (item: ContentItem) => string | undefined
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const item of items) {
    const value = getValue(item);
    if (!value || value.trim().length === 0) continue;

    // Normalize for comparison (lowercase, trim)
    const normalized = value.toLowerCase().trim();
    const files = map.get(normalized) || [];
    files.push(getDisplayPath(item));
    map.set(normalized, files);
  }

  return map;
}

/**
 * Rule: Titles must be unique across all content
 */
export const duplicateTitle: Rule = {
  name: 'duplicate-title',
  severity: 'error',
  category: 'seo',
  fixStrategy: 'Use a unique title that differentiates this content from others',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    const titleMap = buildDuplicateMap(context.allContent, c => c.title);
    const normalizedTitle = item.title?.toLowerCase().trim();

    if (!normalizedTitle) return [];

    const filesWithSameTitle = titleMap.get(normalizedTitle);
    if (!filesWithSameTitle || filesWithSameTitle.length <= 1) return [];

    // Filter out the current file
    const otherFiles = filesWithSameTitle.filter(f => f !== getDisplayPath(item));
    if (otherFiles.length === 0) return [];

    return [{
      file: getDisplayPath(item),
      field: 'title',
      rule: 'duplicate-title',
      severity: 'error',
      message: `Duplicate title found`,
      suggestion: `Also used by: ${otherFiles.join(', ')}`,
    }];
  },
};

/**
 * Rule: Descriptions must be unique across all content
 */
export const duplicateDescription: Rule = {
  name: 'duplicate-description',
  severity: 'error',
  category: 'seo',
  fixStrategy: 'Write a unique description that differentiates this content',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    const descMap = buildDuplicateMap(context.allContent, c => c.description);
    const normalizedDesc = item.description?.toLowerCase().trim();

    if (!normalizedDesc) return [];

    const filesWithSameDesc = descMap.get(normalizedDesc);
    if (!filesWithSameDesc || filesWithSameDesc.length <= 1) return [];

    // Filter out the current file
    const otherFiles = filesWithSameDesc.filter(f => f !== getDisplayPath(item));
    if (otherFiles.length === 0) return [];

    return [{
      file: getDisplayPath(item),
      field: 'description',
      rule: 'duplicate-description',
      severity: 'error',
      message: `Duplicate description found`,
      suggestion: `Also used by: ${otherFiles.join(', ')}`,
    }];
  },
};

/**
 * All duplicate rules
 */
export const duplicateRules: Rule[] = [
  duplicateTitle,
  duplicateDescription,
];
