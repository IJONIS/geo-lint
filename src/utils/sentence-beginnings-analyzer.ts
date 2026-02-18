/**
 * Sentence Beginnings Analyzer
 *
 * Detects consecutive sentences starting with the same word.
 * Inspired by Yoast SEO's sentence beginnings assessment.
 * Function words (articles, demonstratives) are skipped — the second
 * word is used instead, so "The dog" and "The cat" don't count as same-start.
 */

import { extractSentences } from './geo-advanced-analyzer.js';
import { getFirstWordExceptions } from '../data/index.js';

export interface ConsecutiveStartGroup {
  /** The repeated starting word (lowercased) */
  word: string;
  /** Number of consecutive sentences with this start */
  count: number;
  /** 1-indexed line estimate of the first sentence in the group */
  startIndex: number;
}

export interface SentenceBeginningsAnalysis {
  /** Groups of 3+ consecutive sentences starting with the same word */
  groups: ConsecutiveStartGroup[];
}

/**
 * Get the effective first word of a sentence, skipping function words.
 * If the first word is in the exceptions set, the second word is used.
 */
function getEffectiveFirstWord(
  sentenceText: string,
  exceptions: ReadonlySet<string>,
): string {
  const words = sentenceText
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => w.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').toLowerCase());

  if (words.length === 0) return '';

  const first = words[0];
  if (exceptions.has(first) && words.length > 1) {
    return words[1];
  }
  return first;
}

/**
 * Analyze sentence beginnings for monotonous repetition.
 *
 * @example
 * analyzeSentenceBeginnings("We went home. We ate dinner. We watched TV.")
 * // { groups: [{ word: "we", count: 3, startIndex: 0 }] }
 */
export function analyzeSentenceBeginnings(
  body: string,
  locale?: string,
): SentenceBeginningsAnalysis {
  const sentences = extractSentences(body);
  const exceptions = getFirstWordExceptions(locale ?? 'en');
  const groups: ConsecutiveStartGroup[] = [];

  if (sentences.length < 3) return { groups };

  const firstWords = sentences.map(s => getEffectiveFirstWord(s.text, exceptions));

  let currentWord = firstWords[0];
  let runStart = 0;
  let runLength = 1;

  for (let i = 1; i < firstWords.length; i++) {
    const word = firstWords[i];
    if (word && word === currentWord) {
      runLength++;
    } else {
      if (runLength >= 3 && currentWord) {
        groups.push({ word: currentWord, count: runLength, startIndex: runStart });
      }
      currentWord = word;
      runStart = i;
      runLength = 1;
    }
  }

  // Flush final run
  if (runLength >= 3 && currentWord) {
    groups.push({ word: currentWord, count: runLength, startIndex: runStart });
  }

  return { groups };
}
