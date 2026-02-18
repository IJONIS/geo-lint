/**
 * @ijonis/geo-lint Configuration Types
 */

/** Content directory configuration */
export interface ContentPathConfig {
  /** Relative path from project root, e.g. 'content/blog' */
  dir: string;
  /** Content type identifier */
  type: 'blog' | 'page' | 'project';
  /** URL prefix for permalink derivation, e.g. '/blog/' */
  urlPrefix?: string;
  /** Default locale when frontmatter has no locale field */
  defaultLocale?: string;
}

/** GEO-specific configuration */
export interface GeoConfig {
  /** Brand name for entity density rule, e.g. 'ACME Corp'. Empty = skip check */
  brandName: string;
  /** Primary city/location for entity density rule, e.g. 'Berlin'. Empty = skip check */
  brandCity: string;
  /** Path to geo-keywords markdown file, relative to project root. Empty = skip */
  keywordsPath: string;
}

/** User-facing configuration (partial, with defaults applied) */
export interface GeoLintUserConfig {
  /** Canonical site URL, e.g. 'https://example.com' (required) */
  siteUrl: string;
  /** Content directory configurations */
  contentPaths?: ContentPathConfig[];
  /** Static routes valid for link validation (e.g. ['/about', '/contact']) */
  staticRoutes?: string[];
  /** Image directories to scan, relative to project root */
  imageDirectories?: string[];
  /** Valid blog categories (empty = skip category-invalid rule) */
  categories?: string[];
  /** Slugs to fully exclude from linting */
  excludeSlugs?: string[];
  /** Content categories to fully exclude (e.g. 'legal') */
  excludeCategories?: string[];
  /** GEO-specific configuration */
  geo?: Partial<GeoConfig>;
  /** Rule severity overrides: 'off' disables a rule */
  rules?: Record<string, 'error' | 'warning' | 'off'>;
  /** Threshold overrides */
  thresholds?: Partial<ThresholdConfig>;
}

/** Threshold configuration for validation rules */
export interface ThresholdConfig {
  title: { minLength: number; maxLength: number; warnLength: number };
  description: { minLength: number; maxLength: number; warnLength: number };
  slug: { maxLength: number };
  content: { minWordCount: number; minReadabilityScore: number };
}

/** Fully resolved configuration with all defaults applied */
export interface GeoLintConfig {
  siteUrl: string;
  contentPaths: ContentPathConfig[];
  staticRoutes: string[];
  imageDirectories: string[];
  categories: string[];
  excludeSlugs: string[];
  excludeCategories: string[];
  geo: GeoConfig;
  rules: Record<string, 'error' | 'warning' | 'off'>;
  thresholds: ThresholdConfig;
}
