/**
 * Frequency Data Registry
 * Provides locale-aware access to word frequency lists.
 */

import { FREQUENCY_EN } from './frequency-en.js';
import { FREQUENCY_DE } from './frequency-de.js';

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
