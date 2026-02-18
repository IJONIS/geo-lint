/**
 * Content Quality Rules
 * Validates word count and readability
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { countWords } from '../utils/word-counter.js';
import { calculateReadability, isReadable } from '../utils/readability.js';

/** Default content thresholds */
const MIN_WORD_COUNT = 300;
const MIN_READABILITY_SCORE = 30;

/**
 * Rule: Content should have minimum word count
 */
export const contentTooShort: Rule = {
  name: 'content-too-short',
  severity: 'warning',
  category: 'content',
  fixStrategy: 'Expand the content for better SEO performance',
  run: (item: ContentItem): LintResult[] => {
    const wordCount = countWords(item.body);

    if (wordCount < MIN_WORD_COUNT) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-too-short',
        severity: 'warning',
        message: `Content is too short (${wordCount} words, minimum ${MIN_WORD_COUNT})`,
        suggestion: 'Consider expanding the content for better SEO performance',
      }];
    }
    return [];
  },
};

/**
 * Rule: Content should meet minimum readability threshold
 */
export const lowReadability: Rule = {
  name: 'low-readability',
  severity: 'warning',
  category: 'content',
  fixStrategy: 'Use shorter sentences for easier reading',
  run: (item: ContentItem): LintResult[] => {
    const wordCount = countWords(item.body);

    // Skip readability check for very short content
    if (wordCount < 100) {
      return [];
    }

    const readability = calculateReadability(item.body);

    if (!isReadable(readability.score, MIN_READABILITY_SCORE)) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'low-readability',
        severity: 'warning',
        message: `Low readability score (${readability.score}/100 - ${readability.interpretation})`,
        suggestion: `Avg sentence length: ${readability.avgSentenceLength} words. Consider shorter sentences for easier reading.`,
      }];
    }
    return [];
  },
};

/**
 * All content rules
 */
export const contentRules: Rule[] = [
  contentTooShort,
  lowReadability,
];
