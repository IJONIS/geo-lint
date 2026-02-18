/**
 * Performance Validation Rules
 * Checks image file sizes and other performance-related concerns
 */

import { statSync } from 'fs';
import { join } from 'path';
import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { extractImages } from '../utils/image-extractor.js';

/** Default max image size in KB */
const MAX_IMAGE_SIZE_KB = 500;

/**
 * Rule: Image files should not exceed the configured size limit
 * Large images degrade page load performance and Core Web Vitals
 */
export const imageFileTooLarge: Rule = {
  name: 'image-file-too-large',
  severity: 'warning',
  category: 'technical',
  fixStrategy: 'Compress the image or convert to WebP/AVIF format',
  run: (item: ContentItem): LintResult[] => {
    const results: LintResult[] = [];
    const maxBytes = MAX_IMAGE_SIZE_KB * 1024;
    const imagesToCheck: Array<{ src: string; line?: number; source: string }> = [];

    // Check featured image from frontmatter
    if (item.image && !item.image.startsWith('http')) {
      imagesToCheck.push({ src: item.image, source: 'frontmatter' });
    }

    // Check inline images from body
    const inlineImages = extractImages(item.body);
    for (const img of inlineImages) {
      if (!img.src.startsWith('http')) {
        imagesToCheck.push({ src: img.src, line: img.line, source: 'inline' });
      }
    }

    for (const image of imagesToCheck) {
      try {
        const imagePath = join(process.cwd(), 'public', image.src);
        const stats = statSync(imagePath);
        const sizeKB = Math.round(stats.size / 1024);

        if (stats.size > maxBytes) {
          results.push({
            file: getDisplayPath(item),
            field: image.source === 'frontmatter' ? 'image' : 'body',
            rule: 'image-file-too-large',
            severity: 'warning',
            message: `Image file too large: ${image.src} (${sizeKB}KB > ${MAX_IMAGE_SIZE_KB}KB)`,
            suggestion: 'Compress the image or convert to WebP/AVIF format to improve page load speed',
            line: image.line,
          });
        }
      } catch {
        // File not found is handled by image-not-found rule
      }
    }

    return results;
  },
};

/**
 * All performance rules
 */
export const performanceRules: Rule[] = [
  imageFileTooLarge,
];
