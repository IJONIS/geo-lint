/**
 * @ijonis/geo-lint Default Configuration
 */

import type { GeoLintConfig } from './types.js';

/** Default configuration values (no project-specific data) */
export const DEFAULT_CONFIG: Omit<GeoLintConfig, 'siteUrl'> = {
  contentPaths: [
    { dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' },
    { dir: 'content/pages', type: 'page', urlPrefix: '/' },
    { dir: 'content/projects', type: 'project', urlPrefix: '/projects/' },
  ],
  staticRoutes: [],
  imageDirectories: ['public/images'],
  categories: [],
  excludeSlugs: [],
  excludeCategories: ['legal'],
  geo: {
    brandName: '',
    brandCity: '',
    keywordsPath: '',
  },
  rules: {},
  thresholds: {
    title: { minLength: 30, maxLength: 60, warnLength: 55 },
    description: { minLength: 70, maxLength: 160, warnLength: 150 },
    slug: { maxLength: 75 },
    content: { minWordCount: 300, minReadabilityScore: 30 },
  },
};
