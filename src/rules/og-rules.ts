/**
 * Open Graph Rules
 * Validates Open Graph / social sharing metadata
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Rule: Blog posts should have a featured image for social sharing
 */
export const blogMissingOgImage: Rule = {
  name: 'blog-missing-og-image',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Add an image field to the frontmatter for social sharing previews',
  run: (item: ContentItem): LintResult[] => {
    // Only apply to blog posts
    if (item.contentType !== 'blog') {
      return [];
    }

    if (!item.image || item.image.trim().length === 0) {
      return [{
        file: getDisplayPath(item),
        field: 'image',
        rule: 'blog-missing-og-image',
        severity: 'warning',
        message: 'Blog post missing featured image',
        suggestion: 'Add an image field for better social media sharing previews.',
      }];
    }
    return [];
  },
};

/**
 * Rule: Project pages should have a thumbnail/featured image for social sharing
 */
export const projectMissingOgImage: Rule = {
  name: 'project-missing-og-image',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Add a thumbnail image for social media sharing previews',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'project') {
      return [];
    }

    if (!item.image || item.image.trim().length === 0) {
      return [{
        file: getDisplayPath(item),
        field: 'image',
        rule: 'project-missing-og-image',
        severity: 'warning',
        message: 'Project missing thumbnail/featured image',
        suggestion: 'Add a thumbnail image for better social media sharing previews.',
      }];
    }
    return [];
  },
};

/**
 * All Open Graph rules
 */
export const ogRules: Rule[] = [
  blogMissingOgImage,
  projectMissingOgImage,
];
