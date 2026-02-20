/**
 * Readability Utility
 * Calculates locale-aware Flesch Reading Ease scores for content.
 *
 * Supports English and German with their respective formulas:
 * - English: 206.835 - 1.015*ASL - 84.6*ASW
 * - German:  180 - ASL - 58.5*ASW
 */

import { stripMarkdown, countWords, countSentences } from './word-counter.js';

/**
 * Estimate syllable count for a word using locale-specific heuristics.
 * English: applies silent-e discount. German: applies compound word adjustment.
 * @param locale - BCP-47 locale code (e.g. 'en', 'de'). Defaults to 'de'.
 */
export function estimateSyllables(word: string, locale: string = 'de'): number {
  const lower = word.toLowerCase();

  // Count vowel groups (including umlauts)
  const vowelPattern = /[aeiouyäöü]+/gi;
  const matches = lower.match(vowelPattern);

  if (!matches) {
    return 1; // Assume at least 1 syllable
  }

  let count = matches.length;
  const lang = locale.toLowerCase().slice(0, 2);

  if (lang === 'en') {
    // English: silent-e discount
    if (lower.endsWith('e') && count > 1) {
      count -= 0.5;
    }
  } else {
    // German (and fallback): compound word adjustment for long words
    if (word.length > 12) {
      count = Math.max(count, Math.ceil(word.length / 4));
    }
  }

  return Math.max(1, Math.round(count));
}

/**
 * Count total syllables in text
 */
function countSyllables(text: string, locale: string): number {
  const words = text
    .split(/\s+/)
    .filter(word => word.length > 0)
    .filter(word => /\w/.test(word));

  return words.reduce((total, word) => total + estimateSyllables(word, locale), 0);
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
 * Calculate locale-aware Flesch Reading Ease score.
 * Score range: 0-100 (higher = easier to read).
 * @param locale - BCP-47 locale code (e.g. 'en', 'de'). Defaults to 'de'.
 */
/** Flesch Reading Ease coefficients per locale */
const FLESCH_COEFFICIENTS = {
  en: { intercept: 206.835, aslWeight: 1.015, aswWeight: 84.6 },
  de: { intercept: 180, aslWeight: 1.0, aswWeight: 58.5 },
} as const;

type FleschLocale = keyof typeof FLESCH_COEFFICIENTS;

/** Interpretation bands per locale (score thresholds differ between formulas) */
const INTERPRETATION_BANDS: Record<FleschLocale, ReadonlyArray<{ min: number; label: string }>> = {
  en: [
    { min: 90, label: 'Very easy to read' },
    { min: 80, label: 'Easy to read' },
    { min: 70, label: 'Fairly easy to read' },
    { min: 60, label: 'Standard' },
    { min: 50, label: 'Fairly difficult' },
    { min: 30, label: 'Difficult' },
    { min: 0, label: 'Very difficult' },
  ],
  de: [
    { min: 70, label: 'Very easy to read' },
    { min: 60, label: 'Easy to read' },
    { min: 50, label: 'Fairly easy to read' },
    { min: 40, label: 'Standard' },
    { min: 30, label: 'Fairly difficult' },
    { min: 20, label: 'Difficult' },
    { min: 0, label: 'Very difficult' },
  ],
};

export function calculateReadability(mdxBody: string, locale: string = 'de'): {
  score: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  avgWordLength: number;
  interpretation: string;
} {
  const plainText = stripMarkdown(mdxBody);

  const wordCount = countWords(mdxBody);
  const sentenceCount = countSentences(mdxBody);
  const syllableCount = countSyllables(plainText, locale);

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

  const lang = locale.toLowerCase().slice(0, 2) as FleschLocale;
  const coefficients = FLESCH_COEFFICIENTS[lang] ?? FLESCH_COEFFICIENTS.de;
  const score = Math.round(
    coefficients.intercept
    - coefficients.aslWeight * avgSentenceLength
    - coefficients.aswWeight * avgSyllablesPerWord,
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    avgWordLength: Math.round(avgWordLen * 10) / 10,
    interpretation: getInterpretation(clampedScore, locale),
  };
}

/**
 * Get human-readable interpretation of readability score
 */
function getInterpretation(score: number, locale: string = 'de'): string {
  const lang = locale.toLowerCase().slice(0, 2) as FleschLocale;
  const bands = INTERPRETATION_BANDS[lang] ?? INTERPRETATION_BANDS.de;

  for (const band of bands) {
    if (score >= band.min) return band.label;
  }
  return 'Very difficult';
}

/**
 * Check if readability score meets minimum threshold
 */
export function isReadable(score: number, threshold: number): boolean {
  return score >= threshold;
}
