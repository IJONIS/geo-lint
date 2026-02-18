/**
 * Per-content-type threshold resolution
 * Merges base thresholds with optional per-type overrides
 */

import type { ThresholdConfig } from '../config/types.js';
import type { ContentType } from '../types.js';

/** Resolved thresholds for a specific content type (no byContentType nesting) */
export interface ResolvedThresholds {
  title: { minLength: number; maxLength: number; warnLength: number };
  description: { minLength: number; maxLength: number; warnLength: number };
  slug: { maxLength: number };
  content: { minWordCount: number; minReadabilityScore: number };
}

/**
 * Resolve thresholds for a specific content type.
 * Merges per-type overrides on top of base values.
 *
 * @example
 * resolveThresholds(config.thresholds, 'page')
 * // Returns base thresholds with any page-specific overrides applied
 */
export function resolveThresholds(
  thresholds: ThresholdConfig,
  contentType: ContentType,
): ResolvedThresholds {
  const override = thresholds.byContentType?.[contentType];
  if (!override) {
    return {
      title: thresholds.title,
      description: thresholds.description,
      slug: thresholds.slug,
      content: thresholds.content,
    };
  }

  return {
    title: { ...thresholds.title, ...override.title },
    description: { ...thresholds.description, ...override.description },
    slug: { ...thresholds.slug, ...override.slug },
    content: { ...thresholds.content, ...override.content },
  };
}
