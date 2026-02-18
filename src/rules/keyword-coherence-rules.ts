/**
 * Keyword Coherence Rules
 * Validates that title keywords appear in description and headings
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { extractHeadings } from '../utils/heading-extractor.js';
import { countWords } from '../utils/word-counter.js';

/** Keyword coherence thresholds */
const MIN_SIGNIFICANT_WORDS = 2;
const MIN_WORD_LENGTH = 3;
const MIN_CONTENT_WORDS = 300;

/**
 * Combined DE + EN stopwords (articles, prepositions, conjunctions, pronouns)
 * These are filtered out when extracting significant keywords from titles
 */
const STOPWORDS = new Set([
  // German
  'der', 'die', 'das', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
  'und', 'oder', 'aber', 'als', 'auch', 'auf', 'aus', 'bei', 'bis',
  'für', 'mit', 'nach', 'über', 'von', 'vor', 'wie', 'zum', 'zur',
  'den', 'dem', 'des', 'ist', 'sind', 'war', 'hat', 'ihr', 'wir',
  'sie', 'ich', 'nicht', 'sich', 'man', 'nur', 'noch', 'mehr',
  // English
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can',
  'her', 'was', 'one', 'our', 'out', 'has', 'had', 'its', 'his',
  'how', 'who', 'what', 'why', 'when', 'where', 'which', 'with',
  'this', 'that', 'from', 'they', 'been', 'have', 'will', 'your',
  'into', 'than', 'them', 'then', 'some', 'each', 'make',
]);

/**
 * Extract significant words from text
 * Filters out stopwords and short words, normalizes to lowercase
 */
function extractSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(word =>
      word.length >= MIN_WORD_LENGTH && !STOPWORDS.has(word)
    );
}

/**
 * Check if any keyword appears in a target text (case-insensitive)
 */
function findMatchingKeywords(keywords: string[], targetText: string): string[] {
  const normalizedTarget = targetText.toLowerCase();
  return keywords.filter(keyword => normalizedTarget.includes(keyword));
}

/**
 * Rule: At least one title keyword should appear in the meta description
 * Improves click-through rate by ensuring title/description alignment
 */
export const keywordNotInDescription: Rule = {
  name: 'keyword-not-in-description',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Include at least one title keyword in the meta description',
  run: (item: ContentItem): LintResult[] => {
    if (!item.title || !item.description) return [];

    const keywords = extractSignificantWords(item.title);
    if (keywords.length < MIN_SIGNIFICANT_WORDS) return [];

    const matches = findMatchingKeywords(keywords, item.description);
    if (matches.length === 0) {
      return [{
        file: getDisplayPath(item),
        field: 'description',
        rule: 'keyword-not-in-description',
        severity: 'warning',
        message: `Description contains none of the title keywords: ${keywords.join(', ')}`,
        suggestion: 'Include at least one keyword from the title in the meta description for better SEO coherence',
      }];
    }
    return [];
  },
};

/**
 * Rule: At least one title keyword should appear in H2/H3 headings
 * Only applies to blog/project content with sufficient length
 */
export const keywordNotInHeadings: Rule = {
  name: 'keyword-not-in-headings',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Include at least one title keyword in subheadings',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog' && item.contentType !== 'project') return [];
    if (!item.title || !item.body) return [];

    const wordCount = countWords(item.body);
    if (wordCount < MIN_CONTENT_WORDS) return [];

    const keywords = extractSignificantWords(item.title);
    if (keywords.length < MIN_SIGNIFICANT_WORDS) return [];

    const headings = extractHeadings(item.body);
    const subHeadings = headings.filter(h => h.level === 2 || h.level === 3);
    if (subHeadings.length === 0) return [];

    const allHeadingText = subHeadings.map(h => h.text).join(' ');
    const matches = findMatchingKeywords(keywords, allHeadingText);

    if (matches.length === 0) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'keyword-not-in-headings',
        severity: 'warning',
        message: `No title keywords found in H2/H3 headings: ${keywords.join(', ')}`,
        suggestion: 'Include at least one title keyword in your subheadings to reinforce topical relevance',
      }];
    }
    return [];
  },
};

/**
 * Rule: Title and description must share at least one significant word
 * Catches completely disconnected metadata that confuses search engines
 */
export const titleDescriptionNoOverlap: Rule = {
  name: 'title-description-no-overlap',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Ensure title and description share at least one keyword',
  run: (item: ContentItem): LintResult[] => {
    if (!item.title || !item.description) return [];

    const titleWords = extractSignificantWords(item.title);
    const descWords = new Set(extractSignificantWords(item.description));

    if (titleWords.length < MIN_SIGNIFICANT_WORDS) return [];
    if (descWords.size < MIN_SIGNIFICANT_WORDS) return [];

    const overlap = titleWords.filter(word => descWords.has(word));
    if (overlap.length === 0) {
      return [{
        file: getDisplayPath(item),
        field: 'description',
        rule: 'title-description-no-overlap',
        severity: 'warning',
        message: 'Title and description share no significant words',
        suggestion: 'Title and description should be thematically connected. Ensure they share at least one keyword.',
      }];
    }
    return [];
  },
};

/**
 * All keyword coherence rules
 */
export const keywordCoherenceRules: Rule[] = [
  keywordNotInDescription,
  keywordNotInHeadings,
  titleDescriptionNoOverlap,
];
