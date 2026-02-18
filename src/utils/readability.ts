/**
 * Readability Utility
 * Calculates a simplified readability score for content
 *
 * Note: This is a German-adjusted readability indicator, not strict Flesch-Kincaid.
 * German has longer words on average, so we use modified thresholds.
 */

import { stripMarkdown, countWords, countSentences } from './word-counter.js';

/**
 * Estimate syllable count for a word
 * This is a simplified heuristic based on vowel patterns
 * Works reasonably well for German text
 */
export function estimateSyllables(word: string): number {
  // Lowercase for comparison
  const lower = word.toLowerCase();

  // Count vowel groups (including umlauts)
  const vowelPattern = /[aeiouyäöü]+/gi;
  const matches = lower.match(vowelPattern);

  if (!matches) {
    return 1; // Assume at least 1 syllable
  }

  let count = matches.length;

  // Adjust for common patterns
  // Silent e at end of word (English pattern, less common in German)
  if (lower.endsWith('e') && count > 1) {
    count -= 0.5;
  }

  // German compound word adjustment - longer words tend to have more syllables
  if (word.length > 12) {
    count = Math.max(count, Math.ceil(word.length / 4));
  }

  return Math.max(1, Math.round(count));
}

/**
 * Count total syllables in text
 */
function countSyllables(text: string): number {
  const words = text
    .split(/\s+/)
    .filter(word => word.length > 0)
    .filter(word => /\w/.test(word));

  return words.reduce((total, word) => total + estimateSyllables(word), 0);
}

/**
 * Calculate average word length in characters
 */
function averageWordLength(text: string): number {
  const words = text
    .split(/\s+/)
    .filter(word => word.length > 0)
    .filter(word => /\w/.test(word));

  if (words.length === 0) return 0;

  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  return totalLength / words.length;
}

/**
 * Calculate readability score
 *
 * Uses a modified Flesch formula adjusted for German:
 * - German text naturally has longer words
 * - Score range: 0-100 (higher = easier to read)
 *
 * Formula (German adaptation):
 * 180 - ASL - (58.5 * ASW)
 *
 * Where:
 * - ASL = Average Sentence Length (words per sentence)
 * - ASW = Average Syllables per Word
 */
export function calculateReadability(mdxBody: string): {
  score: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  avgWordLength: number;
  interpretation: string;
} {
  const plainText = stripMarkdown(mdxBody);

  const wordCount = countWords(mdxBody);
  const sentenceCount = countSentences(mdxBody);
  const syllableCount = countSyllables(plainText);

  // Avoid division by zero
  if (wordCount === 0 || sentenceCount === 0) {
    return {
      score: 0,
      avgSentenceLength: 0,
      avgSyllablesPerWord: 0,
      avgWordLength: 0,
      interpretation: 'No content to analyze',
    };
  }

  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  const avgWordLen = averageWordLength(plainText);

  // German Flesch formula
  const score = Math.round(180 - avgSentenceLength - (58.5 * avgSyllablesPerWord));

  // Clamp to 0-100 range
  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    avgWordLength: Math.round(avgWordLen * 10) / 10,
    interpretation: getInterpretation(clampedScore),
  };
}

/**
 * Get human-readable interpretation of readability score
 */
function getInterpretation(score: number): string {
  if (score >= 70) return 'Very easy to read';
  if (score >= 60) return 'Easy to read';
  if (score >= 50) return 'Fairly easy to read';
  if (score >= 40) return 'Standard';
  if (score >= 30) return 'Fairly difficult';
  if (score >= 20) return 'Difficult';
  return 'Very difficult';
}

/**
 * Check if readability score meets minimum threshold
 */
export function isReadable(score: number, threshold: number): boolean {
  return score >= threshold;
}
