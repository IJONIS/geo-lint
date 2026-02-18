/**
 * Language Data Registry
 * Provides locale-aware access to frequency lists, transition words,
 * and first-word exception lists.
 */

import { FREQUENCY_EN } from './frequency-en.js';
import { FREQUENCY_DE } from './frequency-de.js';
import { TRANSITION_SINGLE_WORDS_EN, TRANSITION_PHRASES_EN } from './transition-words-en.js';
import { TRANSITION_SINGLE_WORDS_DE, TRANSITION_PHRASES_DE } from './transition-words-de.js';
import { FIRST_WORD_EXCEPTIONS_EN } from './first-word-exceptions-en.js';
import { FIRST_WORD_EXCEPTIONS_DE } from './first-word-exceptions-de.js';

// ---------------------------------------------------------------------------
// Frequency Lists
// ---------------------------------------------------------------------------

const FREQUENCY_LISTS: Record<string, ReadonlySet<string>> = {
  en: FREQUENCY_EN,
  de: FREQUENCY_DE,
};

/** Get the frequency word list for a locale. Returns undefined for unsupported locales. */
export function getFrequencyList(locale: string): ReadonlySet<string> | undefined {
  return FREQUENCY_LISTS[locale.toLowerCase()];
}

/** Check whether a frequency list exists for the given locale. */
export function hasFrequencyList(locale: string): boolean {
  return locale.toLowerCase() in FREQUENCY_LISTS;
}

/** All supported frequency list locales. */
export const SUPPORTED_FREQUENCY_LOCALES = Object.keys(FREQUENCY_LISTS);

// ---------------------------------------------------------------------------
// Transition Words
// ---------------------------------------------------------------------------

interface TransitionWordData {
  singleWords: ReadonlySet<string>;
  phrases: readonly string[];
}

const TRANSITION_WORD_DATA: Record<string, TransitionWordData> = {
  en: { singleWords: TRANSITION_SINGLE_WORDS_EN, phrases: TRANSITION_PHRASES_EN },
  de: { singleWords: TRANSITION_SINGLE_WORDS_DE, phrases: TRANSITION_PHRASES_DE },
};

/** Get transition word data for a locale. Returns undefined for unsupported locales. */
export function getTransitionWords(locale: string): TransitionWordData | undefined {
  return TRANSITION_WORD_DATA[locale.toLowerCase()];
}

// ---------------------------------------------------------------------------
// First Word Exceptions (for consecutive sentence beginnings check)
// ---------------------------------------------------------------------------

const FIRST_WORD_EXCEPTION_LISTS: Record<string, ReadonlySet<string>> = {
  en: FIRST_WORD_EXCEPTIONS_EN,
  de: FIRST_WORD_EXCEPTIONS_DE,
};

/** Get first-word exceptions for a locale. Returns empty set for unsupported locales. */
export function getFirstWordExceptions(locale: string): ReadonlySet<string> {
  return FIRST_WORD_EXCEPTION_LISTS[locale.toLowerCase()] ?? new Set();
}
