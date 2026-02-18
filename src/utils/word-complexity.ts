/**
 * Word Complexity Analyzer
 * Dynamic word complexity detection using a Yoast + Gunning Fog hybrid heuristic.
 *
 * A word is classified as complex when ALL conditions are met:
 * 1. Character length exceeds the locale threshold (EN: >7, DE: >10)
 * 2. Syllable count >= 3 (Gunning Fog signal)
 * 3. NOT in the locale's top-5K frequency list (Yoast signal)
 * 4. NOT a capitalized proper noun (skipped for German — all nouns are capitalized)
 */

import { stripMarkdown } from './word-counter.js';
import { estimateSyllables } from './readability.js';
import { getFrequencyList } from '../data/index.js';

// ─── Locale Configuration ────────────────────────────────────────────────────

export interface LocaleComplexityConfig {
  /** Minimum character length to consider a word potentially complex */
  minLength: number;
  /** Minimum syllable count to flag as complex */
  minSyllables: number;
  /** Whether to skip capitalized words (proper nouns). False for German. */
  skipCapitalized: boolean;
}

const LOCALE_CONFIGS: Record<string, LocaleComplexityConfig> = {
  en: { minLength: 7, minSyllables: 3, skipCapitalized: true },
  de: { minLength: 10, minSyllables: 3, skipCapitalized: false },
};

const DEFAULT_CONFIG: LocaleComplexityConfig = {
  minLength: 7,
  minSyllables: 3,
  skipCapitalized: true,
};

/** Get the complexity config for a locale. Falls back to English-like defaults. */
export function getLocaleConfig(locale: string): LocaleComplexityConfig {
  return LOCALE_CONFIGS[locale.toLowerCase()] ?? DEFAULT_CONFIG;
}

// ─── Word Classification ─────────────────────────────────────────────────────

/**
 * Determine whether a single word is complex.
 *
 * @param normalizedWord - Lowercased word for frequency/length checks
 * @param originalWord - Original-case word for capitalization checks
 * @param config - Locale-specific complexity thresholds
 * @param frequencyList - Top-frequency words that are never flagged
 */
export function isComplexWord(
  normalizedWord: string,
  originalWord: string,
  config: LocaleComplexityConfig,
  frequencyList: ReadonlySet<string> | undefined,
): boolean {
  // Short words are never complex
  if (normalizedWord.length <= config.minLength) return false;

  // Words with fewer than minSyllables are not complex
  if (estimateSyllables(normalizedWord) < config.minSyllables) return false;

  // Common words (in frequency list) are not complex
  if (frequencyList?.has(normalizedWord)) return false;

  // In English, skip capitalized words (likely proper nouns)
  if (config.skipCapitalized && /^[A-Z]/.test(originalWord)) return false;

  return true;
}

// ─── Full-Text Analysis ──────────────────────────────────────────────────────

export interface ComplexityAnalysis {
  /** Number of words classified as complex */
  complexCount: number;
  /** Total words analyzed */
  totalWords: number;
  /** Ratio of complex words to total (0-1) */
  density: number;
  /** Top complex words sorted by frequency descending */
  topComplexWords: Array<{ word: string; count: number }>;
}

/**
 * Analyze word complexity across an entire body of text.
 *
 * @param body - Markdown/MDX content body
 * @param locale - BCP-47 locale code (e.g. 'en', 'de'). Defaults to 'en'.
 */
export function analyzeWordComplexity(body: string, locale: string = 'en'): ComplexityAnalysis {
  const config = getLocaleConfig(locale);
  const frequencyList = getFrequencyList(locale);

  const plain = stripMarkdown(body);
  // Split into words, preserving original casing for proper-noun detection
  const rawWords = plain
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  const totalWords = rawWords.length;
  const complexCounts = new Map<string, number>();
  let complexCount = 0;

  for (const original of rawWords) {
    const normalized = original.toLowerCase();
    if (isComplexWord(normalized, original, config, frequencyList)) {
      complexCount++;
      complexCounts.set(normalized, (complexCounts.get(normalized) ?? 0) + 1);
    }
  }

  const topComplexWords = [...complexCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  return {
    complexCount,
    totalWords,
    density: totalWords > 0 ? complexCount / totalWords : 0,
    topComplexWords,
  };
}
