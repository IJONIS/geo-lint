/**
 * @ijonis/geo-lint MDX Content Adapter
 * Scans directories for MDX/Markdown files and parses them with gray-matter
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { ContentItem, ContentType } from '../types.js';
import type { ContentPathConfig } from '../config/types.js';

/**
 * Derive permalink from slug, locale, and URL prefix config
 */
function derivePermalink(
  slug: string,
  locale: string | undefined,
  pathConfig: ContentPathConfig,
): string {
  const prefix = pathConfig.urlPrefix ?? '/';

  // Pages use root-level URLs
  if (pathConfig.type === 'page') {
    return `/${slug}`.replace(/\/\/+/g, '/');
  }

  // Non-default locale gets locale prefix
  const defaultLocale = pathConfig.defaultLocale ?? 'de';
  if (locale && locale !== defaultLocale) {
    return `/${locale}${prefix}${slug}`.replace(/\/\/+/g, '/');
  }

  return `${prefix}${slug}`.replace(/\/\/+/g, '/');
}

/**
 * Recursively find all MDX/Markdown files in a directory
 */
function findContentFiles(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...findContentFiles(fullPath));
      } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
        files.push(fullPath);
      }
    } catch {
      // Skip files that can't be read
    }
  }
  return files;
}

/**
 * Parse a single content file into a ContentItem
 */
function parseContentFile(
  filePath: string,
  pathConfig: ContentPathConfig,
): ContentItem | null {
  try {
    const { data: fm, content: body, orig } = matter.read(filePath);

    const slug = fm.slug as string | undefined;
    if (!slug) return null;

    // Skip drafts
    if (fm.draft === true) return null;

    const locale = fm.locale as string | undefined;
    const permalink =
      (fm.permalink as string | undefined) ??
      derivePermalink(slug, locale, pathConfig);

    return {
      title: (fm.title as string) ?? '',
      slug,
      description: (fm.description as string) ?? '',
      permalink,
      image: (fm.image as string | undefined) ?? (fm.thumbnail as string | undefined),
      imageAlt: fm.imageAlt as string | undefined,
      categories: fm.categories as string[] | undefined,
      date: fm.date ? String(fm.date) : undefined,
      category: fm.category as string | undefined,
      locale,
      translationKey: fm.translationKey as string | undefined,
      updatedAt: fm.updatedAt ? String(fm.updatedAt) : undefined,
      noindex: fm.noindex as boolean | undefined,
      draft: fm.draft as boolean | undefined,
      contentType: pathConfig.type as ContentType,
      filePath,
      rawContent: orig?.toString() ?? '',
      body,
    };
  } catch {
    return null;
  }
}

/**
 * Load all content items from configured content paths.
 * Uses gray-matter for robust YAML frontmatter parsing.
 */
export function loadContentItems(
  contentPaths: ContentPathConfig[],
  projectRoot: string,
): ContentItem[] {
  const items: ContentItem[] = [];

  for (const pathConfig of contentPaths) {
    const fullDir = join(projectRoot, pathConfig.dir);
    const files = findContentFiles(fullDir);

    for (const filePath of files) {
      const item = parseContentFile(filePath, pathConfig);
      if (item) items.push(item);
    }
  }

  return items;
}
