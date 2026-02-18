/**
 * Sentence Beginnings Analyzer Unit Tests
 * Tests for consecutive sentence-start repetition detection
 * with function-word skipping (articles, demonstratives).
 */

import { describe, it, expect } from 'vitest';
import { analyzeSentenceBeginnings } from '../../../src/utils/sentence-beginnings-analyzer.js';

describe('analyzeSentenceBeginnings', () => {
  it('returns empty groups for short content (< 3 sentences)', () => {
    expect(analyzeSentenceBeginnings('One sentence.')).toEqual({ groups: [] });
    expect(analyzeSentenceBeginnings('First. Second.')).toEqual({ groups: [] });
  });

  it('returns empty groups when no consecutive starts match', () => {
    const body = 'Dogs are great. Cats are independent. Birds can fly. Fish live in water.';
    expect(analyzeSentenceBeginnings(body)).toEqual({ groups: [] });
  });

  it('detects 3 consecutive sentences with the same effective first word', () => {
    const body = 'React powers the frontend. React handles state well. React supports hooks natively.';
    const { groups } = analyzeSentenceBeginnings(body);
    expect(groups).toHaveLength(1);
    expect(groups[0].word).toBe('react');
    expect(groups[0].count).toBe(3);
  });

  it('detects a run of 5 consecutive sentences', () => {
    const body = [
      'Next we configure the server.',
      'Next we install dependencies.',
      'Next we write the tests.',
      'Next we deploy the app.',
      'Next we monitor the logs.',
    ].join(' ');
    const { groups } = analyzeSentenceBeginnings(body);
    expect(groups).toHaveLength(1);
    expect(groups[0].word).toBe('next');
    expect(groups[0].count).toBe(5);
  });

  it('skips articles so different second words produce no group', () => {
    const body = 'The dog ran fast. The cat sat quietly. The bird flew high.';
    const { groups } = analyzeSentenceBeginnings(body);
    expect(groups).toEqual([]);
  });

  it('flags when article-skipped second words repeat', () => {
    const body = [
      'The comprehensive report covers metrics.',
      'The comprehensive analysis shows trends.',
      'The comprehensive study reveals insights.',
    ].join(' ');
    const { groups } = analyzeSentenceBeginnings(body);
    expect(groups).toHaveLength(1);
    expect(groups[0].word).toBe('comprehensive');
    expect(groups[0].count).toBe(3);
  });

  it('flags German function-word bypass with locale "de"', () => {
    const body = [
      'Die umfassende Analyse zeigt Ergebnisse.',
      'Die umfassende Studie beschreibt Methoden.',
      'Die umfassende Bewertung liefert Daten.',
    ].join(' ');
    const { groups } = analyzeSentenceBeginnings(body, 'de');
    expect(groups).toHaveLength(1);
    expect(groups[0].word).toBe('umfassende');
    expect(groups[0].count).toBe(3);
  });
});
