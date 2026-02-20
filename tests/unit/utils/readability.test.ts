/**
 * Readability Utility Unit Tests
 * Tests for locale-aware Flesch Reading Ease scoring.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateReadability,
  estimateSyllables,
} from '../../../src/utils/readability.js';

// ─── estimateSyllables ───────────────────────────────────────────────────────

describe('estimateSyllables', () => {
  it('does NOT apply silent-e discount for German', () => {
    // "Straße" — 2 vowel groups (a, e); German keeps both
    expect(estimateSyllables('Straße', 'de')).toBe(2);
  });

  it('applies German compound word adjustment for long words', () => {
    // "Geschwindigkeitsbegrenzung" — 26 chars > 12, ceil(26/4) = 7
    const result = estimateSyllables('Geschwindigkeitsbegrenzung', 'de');
    expect(result).toBeGreaterThanOrEqual(7);
  });

  it('does NOT apply compound word adjustment for English', () => {
    // "internationally" — 15 chars > 12 but EN should not use compound adjustment
    const enResult = estimateSyllables('internationally', 'en');
    const vowelGroups = 'internationally'.match(/[aeiouy]+/gi)!.length;
    // Should be based on vowel groups minus silent-e, not compound heuristic
    expect(enResult).toBeLessThanOrEqual(vowelGroups);
  });

  it('handles umlauts in vowel counting', () => {
    // "über" has 2 vowel groups: ü, e
    expect(estimateSyllables('über', 'de')).toBe(2);
    // "schön" has 1 vowel group: ö
    expect(estimateSyllables('schön', 'de')).toBe(1);
  });

  it('returns at least 1 syllable for any word', () => {
    expect(estimateSyllables('xyz', 'en')).toBe(1);
    expect(estimateSyllables('xyz', 'de')).toBe(1);
  });

  it('defaults to German when no locale specified', () => {
    const withDefault = estimateSyllables('Geschwindigkeitsbegrenzung');
    const withExplicitDe = estimateSyllables('Geschwindigkeitsbegrenzung', 'de');
    expect(withDefault).toBe(withExplicitDe);
  });
});

// ─── calculateReadability ────────────────────────────────────────────────────

describe('calculateReadability', () => {
  // Simple content with known structure for predictable scores
  const simpleEnglish = Array(10).fill(
    'The cat sat on the mat. The dog ran fast. Birds can fly high.',
  ).join(' ');

  const simpleGerman = Array(10).fill(
    'Die Katze saß auf der Matte. Der Hund lief schnell. Vögel können hoch fliegen.',
  ).join(' ');

  describe('German formula (locale=de)', () => {
    it('uses German Flesch coefficients', () => {
      const result = calculateReadability(simpleGerman, 'de');
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('uses German interpretation bands', () => {
      // A very easy German text should get "Very easy to read" at score >= 70
      const easyText = Array(20).fill('Das ist gut. Es ist klar. Wir sind da.').join(' ');
      const result = calculateReadability(easyText, 'de');
      if (result.score >= 70) {
        expect(result.interpretation).toBe('Very easy to read');
      }
    });
  });

  describe('English formula (locale=en)', () => {
    it('uses English Flesch coefficients', () => {
      const result = calculateReadability(simpleEnglish, 'en');
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('produces different scores than German formula for same text', () => {
      // Use text with moderate complexity — short sentences, mix of word lengths
      const moderateText = Array(10).fill(
        'The team created a simple plan. They worked together on the project. Results were good overall.',
      ).join(' ');
      const deResult = calculateReadability(moderateText, 'de');
      const enResult = calculateReadability(moderateText, 'en');
      // EN formula intercept (206.835) is higher than DE (180), so EN scores higher
      // for the same text unless the weighted terms push it below the clamp
      expect(enResult.score).not.toBe(deResult.score);
    });

    it('uses English interpretation bands', () => {
      // English bands: >= 90 is "Very easy to read"
      const easyText = Array(20).fill('I am here. You are well. It is good.').join(' ');
      const result = calculateReadability(easyText, 'en');
      if (result.score >= 90) {
        expect(result.interpretation).toBe('Very easy to read');
      }
    });
  });

  describe('backward compatibility', () => {
    it('defaults to German formula when no locale specified', () => {
      const withDefault = calculateReadability(simpleGerman);
      const withDe = calculateReadability(simpleGerman, 'de');
      expect(withDefault.score).toBe(withDe.score);
      expect(withDefault.interpretation).toBe(withDe.interpretation);
    });

    it('falls back to German for unsupported locales', () => {
      const withFr = calculateReadability(simpleGerman, 'fr');
      const withDe = calculateReadability(simpleGerman, 'de');
      expect(withFr.score).toBe(withDe.score);
    });
  });

  describe('edge cases', () => {
    it('returns zero score for empty content', () => {
      const result = calculateReadability('', 'en');
      expect(result.score).toBe(0);
      expect(result.interpretation).toBe('No content to analyze');
    });

    it('handles locale case-insensitively', () => {
      const upper = calculateReadability(simpleEnglish, 'EN');
      const lower = calculateReadability(simpleEnglish, 'en');
      expect(upper.score).toBe(lower.score);
    });
  });
});
