/**
 * Word Complexity Analyzer Unit Tests
 * Tests for dynamic word complexity detection using syllable count,
 * word length, and frequency list heuristics.
 */

import { describe, it, expect } from 'vitest';
import {
  getLocaleConfig,
  isComplexWord,
  analyzeWordComplexity,
} from '../../../src/utils/word-complexity.js';
import { getFrequencyList } from '../../../src/data/index.js';

// ─── getLocaleConfig ────────────────────────────────────────────────────────

describe('getLocaleConfig', () => {
  it('returns English config for "en"', () => {
    const config = getLocaleConfig('en');
    expect(config.minLength).toBe(7);
    expect(config.skipCapitalized).toBe(true);
  });

  it('returns German config for "de"', () => {
    const config = getLocaleConfig('de');
    expect(config.minLength).toBe(10);
    expect(config.skipCapitalized).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(getLocaleConfig('EN').minLength).toBe(7);
    expect(getLocaleConfig('De').minLength).toBe(10);
  });

  it('falls back to defaults for unknown locale', () => {
    const config = getLocaleConfig('xx');
    expect(config.minLength).toBe(7);
    expect(config.minSyllables).toBe(3);
    expect(config.skipCapitalized).toBe(true);
  });
});

// ─── isComplexWord ──────────────────────────────────────────────────────────

describe('isComplexWord', () => {
  const enConfig = getLocaleConfig('en');
  const deConfig = getLocaleConfig('de');
  const enFreq = getFrequencyList('en');
  const deFreq = getFrequencyList('de');

  it('passes short words (below length threshold)', () => {
    expect(isComplexWord('simple', 'simple', enConfig, enFreq)).toBe(false);
    expect(isComplexWord('clear', 'clear', enConfig, enFreq)).toBe(false);
    expect(isComplexWord('the', 'the', enConfig, enFreq)).toBe(false);
  });

  it('passes frequent words even when long', () => {
    // "different" is 9 chars, 3 syllables, but in top-5K frequency list
    expect(isComplexWord('different', 'different', enConfig, enFreq)).toBe(false);
    // "important" is 9 chars, 3 syllables, but in top-5K
    expect(isComplexWord('important', 'important', enConfig, enFreq)).toBe(false);
  });

  it('flags long, uncommon, multi-syllable words', () => {
    // "operationalization" — 18 chars, 7+ syllables, NOT in top-5K
    expect(isComplexWord('operationalization', 'operationalization', enConfig, enFreq)).toBe(true);
    // "systematization" — 15 chars, 5+ syllables, NOT in top-5K
    expect(isComplexWord('systematization', 'systematization', enConfig, enFreq)).toBe(true);
  });

  it('skips capitalized words in English (proper nouns)', () => {
    expect(isComplexWord('washington', 'Washington', enConfig, enFreq)).toBe(false);
  });

  it('does NOT skip capitalized words in German', () => {
    // German capitalizes all nouns — a complex word should still be flagged
    expect(
      isComplexWord('operationalisierung', 'Operationalisierung', deConfig, deFreq),
    ).toBe(true);
  });

  it('uses higher length threshold for German', () => {
    // "methodology" is 11 chars — above EN threshold (7) but at DE threshold (10)
    // Should be flagged in English but not in German (if <= 10 chars or in freq list)
    const enResult = isComplexWord('methodology', 'methodology', enConfig, enFreq);
    expect(enResult).toBe(true); // 11 > 7, 5 syllables, not in top-5K

    // A 10-char German word should pass the length check (<=10)
    expect(isComplexWord('arbeitende', 'Arbeitende', deConfig, deFreq)).toBe(false);
  });
});

// ─── analyzeWordComplexity ──────────────────────────────────────────────────

describe('analyzeWordComplexity', () => {
  it('returns zero density for clean everyday content', () => {
    const body = 'This guide shows you how to set up a blog with clear steps and good results for your team.';
    const result = analyzeWordComplexity(body, 'en');
    expect(result.density).toBe(0);
    expect(result.complexCount).toBe(0);
  });

  it('detects high complexity in jargon-heavy content', () => {
    const body = Array(20).fill(
      'The comprehensive methodology paradigm systematization operationalization interdisciplinary multifaceted transformational reconceptualize heterogeneous normal words here today.',
    ).join(' ');
    const result = analyzeWordComplexity(body, 'en');
    expect(result.density).toBeGreaterThan(0.1);
    expect(result.complexCount).toBeGreaterThan(0);
    expect(result.topComplexWords.length).toBeGreaterThan(0);
  });

  it('returns top complex words sorted by count', () => {
    const body = Array(10).fill(
      'operationalization operationalization operationalization systematization systematization methodology normal words here.',
    ).join(' ');
    const result = analyzeWordComplexity(body, 'en');
    expect(result.topComplexWords[0].word).toBe('operationalization');
    expect(result.topComplexWords[0].count).toBe(30);
  });

  it('defaults to English when no locale specified', () => {
    const body = Array(10).fill('operationalization methodology here.').join(' ');
    const result = analyzeWordComplexity(body);
    expect(result.complexCount).toBeGreaterThan(0);
  });

  it('handles German content with appropriate thresholds', () => {
    // Common German words (in frequency list) should not be flagged
    const body = 'Das ist eine gute Frage und wir haben die Antwort für alle Menschen hier.';
    const result = analyzeWordComplexity(body, 'de');
    expect(result.density).toBe(0);
  });

  it('handles empty content', () => {
    const result = analyzeWordComplexity('', 'en');
    expect(result.totalWords).toBe(0);
    expect(result.density).toBe(0);
  });
});
