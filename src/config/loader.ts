/**
 * @ijonis/geo-lint Configuration Loader
 */

import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { GeoLintUserConfig, GeoLintConfig } from './types.js';
import { DEFAULT_CONFIG } from './defaults.js';

const CONFIG_FILENAMES = [
  'geo-lint.config.ts',
  'geo-lint.config.mts',
  'geo-lint.config.mjs',
  'geo-lint.config.js',
];

/**
 * Helper for TypeScript-aware config files. Provides autocomplete in user configs.
 */
export function defineConfig(config: GeoLintUserConfig): GeoLintUserConfig {
  return config;
}

/**
 * Try to load a config file from the project root using jiti for TS support
 */
async function tryLoadConfigFile(projectRoot: string): Promise<GeoLintUserConfig | null> {
  for (const filename of CONFIG_FILENAMES) {
    const configPath = join(projectRoot, filename);
    if (!existsSync(configPath)) continue;

    try {
      // Use jiti for TypeScript config loading (works without tsx/ts-node)
      const { createJiti } = await import('jiti');
      const jiti = createJiti(import.meta.url);
      const mod = await jiti.import(configPath) as Record<string, unknown>;
      const config = (mod.default ?? mod) as GeoLintUserConfig;

      if (config && typeof config === 'object' && 'siteUrl' in config) {
        return config;
      }
    } catch {
      // Try next file
    }
  }
  return null;
}

/**
 * Try to load config from package.json geoLint key
 */
function tryLoadPackageJsonConfig(projectRoot: string): GeoLintUserConfig | null {
  try {
    const pkgPath = join(projectRoot, 'package.json');
    if (!existsSync(pkgPath)) return null;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const config = pkg.geoLint;
    if (config && typeof config === 'object' && 'siteUrl' in config) {
      return config as GeoLintUserConfig;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Merge user config with defaults
 */
export function mergeWithDefaults(user: GeoLintUserConfig): GeoLintConfig {
  return {
    siteUrl: user.siteUrl,
    contentPaths: user.contentPaths ?? DEFAULT_CONFIG.contentPaths,
    staticRoutes: user.staticRoutes ?? DEFAULT_CONFIG.staticRoutes,
    imageDirectories: user.imageDirectories ?? DEFAULT_CONFIG.imageDirectories,
    categories: user.categories ?? DEFAULT_CONFIG.categories,
    excludeSlugs: user.excludeSlugs ?? DEFAULT_CONFIG.excludeSlugs,
    excludeCategories: user.excludeCategories ?? DEFAULT_CONFIG.excludeCategories,
    geo: {
      brandName: user.geo?.brandName ?? DEFAULT_CONFIG.geo.brandName,
      brandCity: user.geo?.brandCity ?? DEFAULT_CONFIG.geo.brandCity,
      keywordsPath: user.geo?.keywordsPath ?? DEFAULT_CONFIG.geo.keywordsPath,
      fillerPhrases: user.geo?.fillerPhrases ?? DEFAULT_CONFIG.geo.fillerPhrases,
      extractionTriggers: user.geo?.extractionTriggers ?? DEFAULT_CONFIG.geo.extractionTriggers,
      acronymAllowlist: user.geo?.acronymAllowlist ?? DEFAULT_CONFIG.geo.acronymAllowlist,
      vagueHeadings: user.geo?.vagueHeadings ?? DEFAULT_CONFIG.geo.vagueHeadings,
      genericAuthorNames: user.geo?.genericAuthorNames ?? DEFAULT_CONFIG.geo.genericAuthorNames,
      allowedHtmlTags: user.geo?.allowedHtmlTags ?? DEFAULT_CONFIG.geo.allowedHtmlTags,
    },
    rules: { ...DEFAULT_CONFIG.rules, ...(user.rules ?? {}) },
    thresholds: {
      title: { ...DEFAULT_CONFIG.thresholds.title, ...(user.thresholds?.title ?? {}) },
      description: { ...DEFAULT_CONFIG.thresholds.description, ...(user.thresholds?.description ?? {}) },
      slug: { ...DEFAULT_CONFIG.thresholds.slug, ...(user.thresholds?.slug ?? {}) },
      content: { ...DEFAULT_CONFIG.thresholds.content, ...(user.thresholds?.content ?? {}) },
    },
  };
}

/**
 * Load configuration from the project root.
 * Searches for geo-lint.config.{ts,mjs,js} or package.json#geoLint
 */
export async function loadConfig(projectRoot?: string): Promise<GeoLintConfig> {
  const root = resolve(projectRoot ?? process.cwd());

  const userConfig = await tryLoadConfigFile(root) ?? tryLoadPackageJsonConfig(root);

  if (!userConfig) {
    throw new Error(
      'geo-lint: No configuration found.\n' +
      'Create a geo-lint.config.ts in your project root with at least:\n\n' +
      '  import { defineConfig } from "@ijonis/geo-lint";\n' +
      '  export default defineConfig({ siteUrl: "https://example.com" });\n\n' +
      'See https://github.com/ijonis/geo-lint#configuration'
    );
  }

  return mergeWithDefaults(userConfig);
}
