/**
 * @ijonis/geo-lint
 * SEO and GEO (Generative Engine Optimization) linter for Markdown/MDX content
 *
 * The first open-source linter that checks your content for AI search visibility.
 */

import { resolve } from 'node:path';
import { loadConfig, mergeWithDefaults, defineConfig } from './config/loader.js';
import type { GeoLintConfig, GeoLintUserConfig } from './config/types.js';
import { loadContentItems } from './adapters/mdx.js';
import type { ContentAdapter } from './adapters/types.js';
import { createLinkExtractor } from './utils/link-extractor.js';
import { buildSlugRegistry, buildImageRegistry } from './utils/slug-resolver.js';
import { buildRules, runAllRules } from './rules/index.js';
import { formatResults, formatResultsJson, printProgress } from './reporter.js';
import type { LintResult, Rule, ContentItem, RuleContext, GlobalRule } from './types.js';

/** Options for the lint() function */
export interface LintOptions {
  /** Project root directory (defaults to cwd) */
  projectRoot?: string;
  /** Explicit config (skips file loading) */
  config?: GeoLintUserConfig;
  /** Custom content adapter (skips default MDX scanning) */
  adapter?: ContentAdapter;
  /** Global rules to run after per-item rules */
  globalRules?: GlobalRule[];
  /** Output format: 'pretty' for terminal, 'json' for machine consumption */
  format?: 'pretty' | 'json';
}

/**
 * Run the complete GEO lint process.
 * Returns exit code: 0 for success (no errors), 1 for errors found.
 */
export async function lint(options: LintOptions = {}): Promise<number> {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());

  // Load config
  const config: GeoLintConfig = options.config
    ? mergeWithDefaults(options.config)
    : await loadConfig(projectRoot);

  const isPretty = (options.format ?? 'pretty') === 'pretty';

  if (isPretty) printProgress('Loading content...');

  // Load content items
  const contentItems = options.adapter
    ? await options.adapter.loadItems(projectRoot)
    : loadContentItems(config.contentPaths, projectRoot);

  // Separate excluded items (still included in context for link validation)
  const excludeSlugs = new Set(config.excludeSlugs);
  const excludeCategories = new Set(config.excludeCategories);

  const isExcluded = (item: ContentItem): boolean => {
    if (item.category && excludeCategories.has(item.category)) return true;
    return excludeSlugs.has(item.slug);
  };

  const excludedItems = contentItems.filter(isExcluded);
  const lintableItems = contentItems.filter(item => !isExcluded(item));

  if (isPretty) {
    printProgress(`Loaded ${contentItems.length} content files (${excludedItems.length} excluded)`);
    printProgress('Building validation context...');
  }

  // Build validation context with ALL items (excluded are still valid link targets)
  const linkExtractor = createLinkExtractor(config.siteUrl);
  const context: RuleContext = {
    allContent: contentItems,
    validSlugs: buildSlugRegistry(contentItems, config.staticRoutes, config.contentPaths),
    validImages: buildImageRegistry(config.imageDirectories),
    thresholds: config.thresholds,
    geoEnabledContentTypes: config.geo.enabledContentTypes ?? ['blog'],
    defaultLocale: config.i18n.defaultLocale,
  };

  if (isPretty) {
    printProgress(`Found ${context.validSlugs.size} valid URLs, ${context.validImages.size} images`);
    printProgress('Running validation rules...');
  }

  // Build and run rules
  const rules = buildRules(config, linkExtractor);
  const results: LintResult[] = runAllRules(lintableItems, context, rules);

  // Run global rules (user-provided, e.g., service registry checks)
  if (options.globalRules) {
    for (const globalRule of options.globalRules) {
      try {
        results.push(...globalRule.run());
      } catch (error) {
        if (isPretty) console.error(`Global rule ${globalRule.name} failed:`, error);
      }
    }
  }

  // Output results
  if (options.format === 'json') {
    console.log(formatResultsJson(results));
  } else {
    formatResults(results, lintableItems.length, excludedItems.length);
  }

  return 0;
}

/**
 * Run the linter and return raw results (no console output).
 * Useful for programmatic integration.
 */
export async function lintQuiet(options: LintOptions = {}): Promise<LintResult[]> {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());

  const config: GeoLintConfig = options.config
    ? mergeWithDefaults(options.config)
    : await loadConfig(projectRoot);

  const contentItems = options.adapter
    ? await options.adapter.loadItems(projectRoot)
    : loadContentItems(config.contentPaths, projectRoot);

  const excludeSlugs = new Set(config.excludeSlugs);
  const excludeCategories = new Set(config.excludeCategories);

  const isExcluded = (item: ContentItem): boolean => {
    if (item.category && excludeCategories.has(item.category)) return true;
    return excludeSlugs.has(item.slug);
  };

  const lintableItems = contentItems.filter(item => !isExcluded(item));
  const linkExtractor = createLinkExtractor(config.siteUrl);

  const context: RuleContext = {
    allContent: contentItems,
    validSlugs: buildSlugRegistry(contentItems, config.staticRoutes, config.contentPaths),
    validImages: buildImageRegistry(config.imageDirectories),
    thresholds: config.thresholds,
    geoEnabledContentTypes: config.geo.enabledContentTypes ?? ['blog'],
    defaultLocale: config.i18n.defaultLocale,
  };

  const rules = buildRules(config, linkExtractor);
  return runAllRules(lintableItems, context, rules);
}

// Re-export public API
export { defineConfig } from './config/loader.js';
export type {
  GeoLintUserConfig,
  GeoLintConfig,
  GeoConfig,
  ContentPathConfig,
  ThresholdConfig,
  I18nConfig,
} from './config/types.js';
export type {
  LintResult,
  Rule,
  GlobalRule,
  ContentItem,
  RuleContext,
  ContentType,
  Severity,
  Heading,
  ExtractedLink,
  ExtractedImage,
} from './types.js';
export type { ContentAdapter } from './adapters/types.js';
export { createAdapter } from './adapters/types.js';
export { loadContentItems } from './adapters/mdx.js';
