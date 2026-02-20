/**
 * Slug Resolver Utility
 * Builds a registry of valid internal URLs for link validation
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentItem } from '../types.js';
import type { ContentPathConfig } from '../config/types.js';

/**
 * Extract frontmatter slug and locale from a raw MDX file
 * Returns null if the file has no valid frontmatter
 */
function extractSlugFromFile(
  filePath: string,
  defaultLocale: string = 'de',
): { slug: string; locale: string } | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    if (!content.startsWith('---')) return null;

    const endIndex = content.indexOf('---', 3);
    if (endIndex === -1) return null;

    const frontmatter = content.slice(3, endIndex);

    const slugMatch = frontmatter.match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m);
    if (!slugMatch) return null;

    const localeMatch = frontmatter.match(/^locale:\s*["']?([^"'\n]+)["']?\s*$/m);
    const draftMatch = frontmatter.match(/^draft:\s*true\s*$/m);

    if (draftMatch) return null;

    return {
      slug: slugMatch[1].trim(),
      locale: localeMatch ? localeMatch[1].trim() : defaultLocale,
    };
  } catch {
    return null;
  }
}

/**
 * Find all files with a given extension in a directory (recursive)
 */
function findFilesInDir(dir: string, ext: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...findFilesInDir(fullPath, ext));
      } else if (entry.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return results;
}

/**
 * Scan raw MDX files to find permalinks not covered by content adapter output.
 * Handles cases where the content adapter fails to process certain files.
 *
 * @param knownSlugs - Set of already-known permalink slugs
 * @param contentPaths - Content directory configurations to scan
 */
export function scanRawContentPermalinks(
  knownSlugs: Set<string>,
  contentPaths: ContentPathConfig[],
): string[] {
  const projectRoot = process.cwd();
  const additionalPermalinks: string[] = [];

  for (const pathConfig of contentPaths) {
    const contentDir = join(projectRoot, pathConfig.dir);
    if (!existsSync(contentDir)) continue;

    const urlPrefix = pathConfig.urlPrefix ?? '/';

    const defaultLocale = pathConfig.defaultLocale ?? 'de';

    for (const file of findFilesInDir(contentDir, '.mdx')) {
      const meta = extractSlugFromFile(file, defaultLocale);
      if (!meta) continue;

      // Build permalink based on locale and URL prefix
      let permalink: string;

      if (meta.locale !== defaultLocale) {
        // Non-default locale: prefix with locale
        permalink = `/${meta.locale}${urlPrefix}${meta.slug}`.replace(/\/+/g, '/');
      } else {
        permalink = `${urlPrefix}${meta.slug}`.replace(/\/+/g, '/');
      }

      // Ensure leading slash
      if (!permalink.startsWith('/')) {
        permalink = '/' + permalink;
      }

      // Remove trailing slash (except root)
      if (permalink.length > 1 && permalink.endsWith('/')) {
        permalink = permalink.slice(0, -1);
      }

      if (!knownSlugs.has(permalink)) {
        additionalPermalinks.push(permalink);
      }
    }
  }

  return additionalPermalinks;
}

/**
 * Build a set of all valid internal URL paths.
 * Combines content permalinks, static routes, and raw MDX file scan.
 *
 * @param allContent - Content items from the content adapter
 * @param staticRoutes - Array of static route paths (e.g. ['/about', '/contact'])
 * @param contentPaths - Content directory configurations for raw MDX fallback scan
 */
export function buildSlugRegistry(
  allContent: ContentItem[],
  staticRoutes: string[],
  contentPaths: ContentPathConfig[],
): Set<string> {
  const slugs = new Set<string>();

  // Add static routes
  for (const route of staticRoutes) {
    slugs.add(route);
  }

  // Add content permalinks from adapter output
  for (const item of allContent) {
    slugs.add(item.permalink);

    // Also add without trailing slash if present
    if (item.permalink.endsWith('/') && item.permalink.length > 1) {
      slugs.add(item.permalink.slice(0, -1));
    }
  }

  // Scan raw MDX files for any permalinks the adapter missed
  const additional = scanRawContentPermalinks(slugs, contentPaths);
  for (const permalink of additional) {
    slugs.add(permalink);
  }

  return slugs;
}

/**
 * Check if a normalized internal URL is valid
 */
export function isValidInternalLink(url: string, validSlugs: Set<string>): boolean {
  // Direct match
  if (validSlugs.has(url)) {
    return true;
  }

  // Try with trailing slash
  if (validSlugs.has(url + '/')) {
    return true;
  }

  // Try without trailing slash
  if (url.endsWith('/') && validSlugs.has(url.slice(0, -1))) {
    return true;
  }

  return false;
}

/**
 * Recursively scan directory for files
 */
function scanDirectory(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...scanDirectory(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return files;
}

/**
 * Build a set of all valid image paths.
 * Scans the provided image directories.
 *
 * @param imageDirectories - Array of image directory paths relative to project root
 *                           (e.g. ['public/images'])
 */
export function buildImageRegistry(imageDirectories: string[]): Set<string> {
  const images = new Set<string>();
  const projectRoot = process.cwd();

  for (const imageDir of imageDirectories) {
    const fullDir = join(projectRoot, imageDir);

    if (!existsSync(fullDir)) {
      continue;
    }

    const files = scanDirectory(fullDir);

    for (const file of files) {
      // Get path relative to public directory
      const relativePath = file.replace(join(projectRoot, 'public'), '');
      // Normalize to forward slashes and ensure leading slash
      const normalizedPath = relativePath.replace(/\\/g, '/');
      images.add(normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath);
    }
  }

  return images;
}

/**
 * Check if an image path exists
 */
export function isValidImagePath(imagePath: string, validImages: Set<string>): boolean {
  // Normalize the path
  let normalized = imagePath;

  // Handle paths without leading slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  // Direct match
  if (validImages.has(normalized)) {
    return true;
  }

  // Try URL-decoded version
  try {
    const decoded = decodeURIComponent(normalized);
    if (validImages.has(decoded)) {
      return true;
    }
  } catch {
    // Invalid URL encoding, ignore
  }

  return false;
}
