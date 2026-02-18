/**
 * @ijonis/geo-lint Core Types
 * Shared interfaces for the SEO/GEO validation system
 */

export type Severity = 'error' | 'warning';

export type ContentType = 'blog' | 'page' | 'project';

/**
 * Result of a single lint check
 */
export interface LintResult {
  /** Relative path: blog/my-post-slug */
  file: string;
  /** Field or area checked (e.g., 'title', 'body', 'links') */
  field: string;
  /** Rule identifier (e.g., 'title-too-long', 'geo-no-question-headings') */
  rule: string;
  /** Whether this blocks the build */
  severity: Severity;
  /** Human-readable error message */
  message: string;
  /** Optional actionable fix suggestion */
  suggestion?: string;
  /** Line number in MDX file if applicable */
  line?: number;
}

/**
 * Parsed content item combining frontmatter metadata and raw MDX body
 */
export interface ContentItem {
  title: string;
  slug: string;
  description: string;
  permalink: string;
  image?: string;
  imageAlt?: string;
  categories?: string[];
  date?: string;
  category?: string;
  locale?: string;
  translationKey?: string;
  updatedAt?: string;
  noindex?: boolean;
  draft?: boolean;
  /** Content author name (from frontmatter) */
  author?: string;

  /** Content type: blog, page, or project */
  contentType: ContentType;
  /** Full path to source file */
  filePath: string;
  /** Raw file content (frontmatter + body) */
  rawContent: string;
  /** Body content without frontmatter */
  body: string;
}

/**
 * Context passed to rules for cross-content validation
 */
export interface RuleContext {
  /** All content items (including excluded) for link/duplicate detection */
  allContent: ContentItem[];
  /** Set of all valid internal URL paths */
  validSlugs: Set<string>;
  /** Set of all valid image paths */
  validImages: Set<string>;
}

/**
 * A lint rule definition
 */
export interface Rule {
  /** Unique rule identifier */
  name: string;
  /** Whether violations block the build */
  severity: Severity;
  /** Rule implementation */
  run: (item: ContentItem, context: RuleContext) => LintResult[];
  /** Machine-readable fix strategy for AI coding agents */
  fixStrategy?: string;
  /** Rule category for grouping (seo, geo, content, technical, i18n) */
  category?: string;
}

/**
 * A global rule that validates project-wide concerns (not per-item)
 */
export interface GlobalRule {
  /** Unique rule identifier */
  name: string;
  /** Whether violations block the build */
  severity: Severity;
  /** Rule implementation (no item — validates global state) */
  run: () => LintResult[];
}

/**
 * Extracted heading from MDX content
 */
export interface Heading {
  level: number;
  text: string;
  line: number;
}

/**
 * Extracted link from MDX content
 */
export interface ExtractedLink {
  url: string;
  text: string;
  line: number;
  isInternal: boolean;
  originalUrl: string;
}

/**
 * Extracted image from MDX content
 */
export interface ExtractedImage {
  src: string;
  alt: string;
  line: number;
  hasAlt: boolean;
  source: 'frontmatter' | 'inline';
}
