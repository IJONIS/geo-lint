/**
 * Transition Word Analyzer
 *
 * Measures the ratio of sentences containing logical connectors.
 * Content with low transition word usage reads as a series of
 * disconnected statements — bad for both readers and LLM extraction.
 *
 * Inspired by Yoast SEO's transition words assessment.
 */

import { extractSentences } from './geo-advanced-analyzer.js';
import { getTransitionWords } from '../data/index.js';

export interface TransitionWordAnalysis {
  /** Total sentences analyzed */
  totalSentences: number;
  /** Sentences containing at least one transition word/phrase */
  sentencesWithTransition: number;
  /** Ratio of sentences with transitions (0–1) */
  ratio: number;
}

/**
 * Check if a sentence contains at least one transition word or phrase.
 * Multi-word phrases are checked via substring match on the lowercased sentence.
 * Single words are checked via set membership after splitting.
 */
function sentenceHasTransition(
  sentenceText: string,
  singleWords: ReadonlySet<string>,
  phrases: readonly string[],
): boolean {
  const lower = sentenceText.toLowerCase();

  // Check multi-word phrases first (substring match)
  for (const phrase of phrases) {
    if (lower.includes(phrase)) return true;
  }

  // Check single words via set membership
  const words = lower
    .replace(/[^a-zA-ZäöüÄÖÜßà-ÿ\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  for (const word of words) {
    if (singleWords.has(word)) return true;
  }

  return false;
}

/**
 * Analyze transition word usage across all sentences in the body.
 *
 * @example
 * analyzeTransitionWords("Dogs are great. However, cats are also nice.")
 * // { totalSentences: 2, sentencesWithTransition: 1, ratio: 0.5 }
 */
export function analyzeTransitionWords(
  body: string,
  locale?: string,
): TransitionWordAnalysis {
  const sentences = extractSentences(body);
  const lang = (locale ?? 'en').toLowerCase();
  const wordData = getTransitionWords(lang);

  if (!wordData || sentences.length === 0) {
    return { totalSentences: sentences.length, sentencesWithTransition: 0, ratio: 0 };
  }

  let sentencesWithTransition = 0;

  for (const { text } of sentences) {
    if (sentenceHasTransition(text, wordData.singleWords, wordData.phrases)) {
      sentencesWithTransition++;
    }
  }

  return {
    totalSentences: sentences.length,
    sentencesWithTransition,
    ratio: sentences.length > 0 ? sentencesWithTransition / sentences.length : 0,
  };
}
