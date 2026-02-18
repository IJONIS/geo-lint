/**
 * Image Validation Rules
 * Validates image alt text presence and image file existence
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import {
  extractImages,
  createFrontmatterImage,
  normalizeImagePath,
} from '../utils/image-extractor.js';
import { isValidImagePath } from '../utils/slug-resolver.js';

/**
 * Rule: Inline images must have alt text
 */
export const inlineImageMissingAlt: Rule = {
  name: 'inline-image-missing-alt',
  severity: 'error',
  category: 'seo',
  fixStrategy: 'Add descriptive alt text for accessibility and SEO',
  run: (item: ContentItem): LintResult[] => {
    const results: LintResult[] = [];
    const images = extractImages(item.body);

    for (const img of images) {
      if (!img.hasAlt) {
        results.push({
          file: getDisplayPath(item),
          field: 'body',
          rule: 'inline-image-missing-alt',
          severity: 'error',
          message: `Image missing alt text: ${img.src}`,
          suggestion: 'Add descriptive alt text for accessibility and SEO',
          line: img.line,
        });
      }
    }

    return results;
  },
};

/**
 * Rule: Featured image in frontmatter should have alt text
 */
export const frontmatterImageMissingAlt: Rule = {
  name: 'frontmatter-image-missing-alt',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Add an imageAlt field to the frontmatter for the featured image',
  run: (item: ContentItem): LintResult[] => {
    // Only check if there's an image but no imageAlt
    if (item.image && (!item.imageAlt || item.imageAlt.trim().length === 0)) {
      return [{
        file: getDisplayPath(item),
        field: 'imageAlt',
        rule: 'frontmatter-image-missing-alt',
        severity: 'warning',
        message: 'Featured image missing alt text',
        suggestion: 'Add an imageAlt field to the frontmatter for the featured image',
      }];
    }
    return [];
  },
};

/**
 * Rule: Referenced images should exist in public directory
 */
export const imageNotFound: Rule = {
  name: 'image-not-found',
  severity: 'warning',
  category: 'technical',
  fixStrategy: 'Check that the image path is correct and the file exists in public/',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    const results: LintResult[] = [];

    // Check frontmatter image
    if (item.image) {
      const normalizedPath = normalizeImagePath(item.image);
      // Only check local images, not external URLs
      if (!item.image.startsWith('http') && !isValidImagePath(normalizedPath, context.validImages)) {
        results.push({
          file: getDisplayPath(item),
          field: 'image',
          rule: 'image-not-found',
          severity: 'warning',
          message: `Featured image not found: ${item.image}`,
          suggestion: 'Check that the image path is correct and the file exists in public/',
        });
      }
    }

    // Check inline images
    const images = extractImages(item.body);
    for (const img of images) {
      // Only check local images
      if (!img.src.startsWith('http')) {
        const normalizedPath = normalizeImagePath(img.src);
        if (!isValidImagePath(normalizedPath, context.validImages)) {
          results.push({
            file: getDisplayPath(item),
            field: 'body',
            rule: 'image-not-found',
            severity: 'warning',
            message: `Inline image not found: ${img.src}`,
            suggestion: 'Check that the image path is correct and the file exists in public/',
            line: img.line,
          });
        }
      }
    }

    return results;
  },
};

/**
 * All image rules
 */
export const imageRules: Rule[] = [
  inlineImageMissingAlt,
  frontmatterImageMissingAlt,
  imageNotFound,
];
