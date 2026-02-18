import { describe, it, expect } from 'vitest';
import { resolveThresholds } from '../../../src/utils/resolve-thresholds.js';
import type { ThresholdConfig } from '../../../src/config/types.js';

const BASE: ThresholdConfig = {
  title: { minLength: 30, maxLength: 60, warnLength: 55 },
  description: { minLength: 70, maxLength: 160, warnLength: 150 },
  slug: { maxLength: 75 },
  content: { minWordCount: 300, minReadabilityScore: 30 },
};

describe('resolveThresholds', () => {
  it('returns base thresholds when no byContentType key', () => {
    const result = resolveThresholds(BASE, 'blog');
    expect(result.title.minLength).toBe(30);
    expect(result.content.minWordCount).toBe(300);
  });

  it('returns base thresholds when byContentType has no entry for the type', () => {
    const config: ThresholdConfig = {
      ...BASE,
      byContentType: { page: { content: { minWordCount: 100, minReadabilityScore: 20 } } },
    };
    const result = resolveThresholds(config, 'blog');
    expect(result.content.minWordCount).toBe(300);
  });

  it('applies per-type overrides for matching content type', () => {
    const config: ThresholdConfig = {
      ...BASE,
      byContentType: {
        page: { content: { minWordCount: 100, minReadabilityScore: 20 } },
      },
    };
    const result = resolveThresholds(config, 'page');
    expect(result.content.minWordCount).toBe(100);
    expect(result.content.minReadabilityScore).toBe(20);
  });

  it('partial override merges without clobbering unset fields', () => {
    const config: ThresholdConfig = {
      ...BASE,
      byContentType: {
        project: { title: { minLength: 10, maxLength: 80, warnLength: 70 } },
      },
    };
    const result = resolveThresholds(config, 'project');
    // Title overridden
    expect(result.title.minLength).toBe(10);
    expect(result.title.maxLength).toBe(80);
    // Other groups unchanged
    expect(result.description.minLength).toBe(70);
    expect(result.slug.maxLength).toBe(75);
    expect(result.content.minWordCount).toBe(300);
  });

  it('handles multiple content types independently', () => {
    const config: ThresholdConfig = {
      ...BASE,
      byContentType: {
        blog: { content: { minWordCount: 800, minReadabilityScore: 40 } },
        page: { content: { minWordCount: 100, minReadabilityScore: 20 } },
      },
    };
    expect(resolveThresholds(config, 'blog').content.minWordCount).toBe(800);
    expect(resolveThresholds(config, 'page').content.minWordCount).toBe(100);
    expect(resolveThresholds(config, 'project').content.minWordCount).toBe(300);
  });
});
