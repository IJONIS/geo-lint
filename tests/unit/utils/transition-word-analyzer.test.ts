/**
 * Transition Word Analyzer Unit Tests
 * Tests for sentence-level transition word detection across locales.
 */

import { describe, it, expect } from 'vitest';
import { analyzeTransitionWords } from '../../../src/utils/transition-word-analyzer.js';

describe('analyzeTransitionWords', () => {
  it('returns zeros for empty content', () => {
    const result = analyzeTransitionWords('');
    expect(result).toEqual({ totalSentences: 0, sentencesWithTransition: 0, ratio: 0 });
  });

  it('returns zero ratio for short content without transitions', () => {
    const result = analyzeTransitionWords('Hello world.');
    expect(result.sentencesWithTransition).toBe(0);
    expect(result.ratio).toBe(0);
  });

  it('detects English single-word transitions', () => {
    const body = 'Dogs are great. However, cats are also nice. Therefore, adopt both.';
    const result = analyzeTransitionWords(body);
    expect(result.totalSentences).toBe(3);
    expect(result.sentencesWithTransition).toBe(2);
    expect(result.ratio).toBeCloseTo(2 / 3);
  });

  it('returns ratio 0 when no transitions are present', () => {
    const body = 'The sky is blue. Grass is green. Water is wet.';
    const result = analyzeTransitionWords(body);
    expect(result.totalSentences).toBe(3);
    expect(result.sentencesWithTransition).toBe(0);
    expect(result.ratio).toBe(0);
  });

  it('detects English multi-word phrases', () => {
    const body = 'We ran the test. As a result, performance improved. In addition, costs dropped. On the other hand, complexity grew.';
    const result = analyzeTransitionWords(body);
    expect(result.sentencesWithTransition).toBe(3);
    expect(result.ratio).toBeCloseTo(3 / 4);
  });

  it('detects German transition words with locale de', () => {
    const body = 'Hunde sind toll. Jedoch sind Katzen auch nett. Allerdings brauchen sie Pflege. Zum Beispiel tägliches Füttern.';
    const result = analyzeTransitionWords(body, 'de');
    expect(result.totalSentences).toBe(4);
    expect(result.sentencesWithTransition).toBe(3);
    expect(result.ratio).toBeCloseTo(3 / 4);
  });

  it('handles mixed content with partial transitions', () => {
    const body = 'Step one is easy. Furthermore, step two builds on it. Step three is hard. Meanwhile, step four runs in parallel. Step five wraps up.';
    const result = analyzeTransitionWords(body);
    expect(result.totalSentences).toBe(5);
    expect(result.sentencesWithTransition).toBe(2);
    expect(result.ratio).toBeCloseTo(0.4);
  });

  it('returns zero ratio gracefully for unsupported locale', () => {
    const body = 'Dogs are great. However, cats are also nice.';
    const result = analyzeTransitionWords(body, 'ja');
    expect(result.sentencesWithTransition).toBe(0);
    expect(result.ratio).toBe(0);
    expect(result.totalSentences).toBeGreaterThan(0);
  });
});
