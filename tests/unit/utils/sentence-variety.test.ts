import { describe, it, expect } from 'vitest';
import { analyzeSentenceVariety } from '../../../src/utils/content-quality-analyzer.js';

describe('analyzeSentenceVariety', () => {
  it('returns zeros for a single sentence (not enough data)', () => {
    const result = analyzeSentenceVariety('This is a single sentence.');
    expect(result.avgLength).toBe(0);
    expect(result.stdDev).toBe(0);
    expect(result.coefficientOfVariation).toBe(0);
    expect(result.totalSentences).toBe(1);
  });

  it('returns very low CV for sentences of equal length', () => {
    const body = 'The cat sat down. The dog ran fast. The boy ate food.';
    const result = analyzeSentenceVariety(body);
    expect(result.totalSentences).toBe(3);
    expect(result.coefficientOfVariation).toBeLessThanOrEqual(0.1);
  });

  it('returns higher CV for a mix of short and long sentences', () => {
    const body =
      'Short one. ' +
      'This is a significantly longer sentence with many more words in it to create variety. ' +
      'Tiny. ' +
      'Yet another moderately sized sentence appears here for good measure.';
    const result = analyzeSentenceVariety(body);
    expect(result.totalSentences).toBeGreaterThanOrEqual(3);
    expect(result.coefficientOfVariation).toBeGreaterThan(0.3);
  });

  it('returns zeros for empty content', () => {
    const result = analyzeSentenceVariety('');
    expect(result.avgLength).toBe(0);
    expect(result.stdDev).toBe(0);
    expect(result.coefficientOfVariation).toBe(0);
    expect(result.totalSentences).toBe(0);
  });
});
