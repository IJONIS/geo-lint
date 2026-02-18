/**
 * GEO Keywords Parser
 * Parses a geo-keywords markdown file and provides structured access
 * to keyword categories for SEO/GEO lint rules.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeoKeywordCategory {
  /** Slug-style identifier, e.g. "ai-automation" */
  id: string;
  /** Original section name, e.g. "AI Automation / KI-Automatisierung" */
  name: string;
  /** German keywords */
  german: string[];
  /** English keywords */
  english: string[];
}

// ---------------------------------------------------------------------------
// Module-level cache (parsed once per lint run, keyed by resolved path)
// ---------------------------------------------------------------------------

const cache = new Map<string, GeoKeywordCategory[]>();

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Derive a URL-friendly id from the section heading.
 * Input example: "1. AI Automation / KI-Automatisierung"
 * Output:        "ai-automation"
 *
 * Strategy: strip the leading number + dot, take the first phrase
 * (before the slash if bilingual), then slugify.
 */
function deriveId(sectionName: string): string {
  // Remove leading "N. " prefix
  const withoutNumber = sectionName.replace(/^\d+\.\s*/, '');

  // Take the part before " / " (English-first name) when present
  const primaryName = withoutNumber.split(' / ')[0].trim();

  return primaryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract bullet items from a block of text.
 * Matches lines starting with "- " and returns the trimmed content.
 */
function extractBullets(block: string): string[] {
  const keywords: string[] = [];

  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      keywords.push(trimmed.slice(2).trim());
    }
  }

  return keywords;
}

/**
 * Parse the raw markdown content into structured categories.
 */
function parseMarkdown(content: string): GeoKeywordCategory[] {
  const categories: GeoKeywordCategory[] = [];

  // Split on H2 boundaries ("## ")
  const h2Sections = content.split(/^## /m).slice(1); // drop preamble

  for (const section of h2Sections) {
    // First line of each section is the heading text
    const newlineIndex = section.indexOf('\n');
    if (newlineIndex === -1) continue;

    const sectionName = section.slice(0, newlineIndex).trim();
    const sectionBody = section.slice(newlineIndex + 1);

    const id = deriveId(sectionName);
    // Strip leading "N. " for the display name
    const name = sectionName.replace(/^\d+\.\s*/, '');

    // Split on H3 boundaries ("### ") to find locale subsections
    const h3Sections = sectionBody.split(/^### /m).slice(1);

    let german: string[] = [];
    let english: string[] = [];

    for (const localeSection of h3Sections) {
      const localeNewline = localeSection.indexOf('\n');
      if (localeNewline === -1) continue;

      const localeLabel = localeSection.slice(0, localeNewline).trim().toLowerCase();
      const localeBody = localeSection.slice(localeNewline + 1);

      if (localeLabel === 'german') {
        german = extractBullets(localeBody);
      } else if (localeLabel === 'english') {
        english = extractBullets(localeBody);
      }
    }

    // Only include categories that have at least some keywords
    if (german.length > 0 || english.length > 0) {
      categories.push({ id, name, german, english });
    }
  }

  return categories;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a geo-keywords markdown file and return structured categories.
 * Results are cached after the first call per resolved path.
 *
 * @param keywordsPath - Path to the geo-keywords markdown file (relative to cwd or absolute).
 *                       If empty/undefined, returns an empty array.
 */
export function loadGeoKeywords(keywordsPath?: string): GeoKeywordCategory[] {
  if (!keywordsPath) {
    return [];
  }

  const filePath = resolve(process.cwd(), keywordsPath);

  const cached = cache.get(filePath);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const categories = parseMarkdown(content);
    cache.set(filePath, categories);
    return categories;
  } catch {
    // File doesn't exist or can't be read — return empty
    return [];
  }
}

/**
 * Get all keywords (both locales) as a flat list.
 */
export function getAllKeywords(keywordsPath?: string): string[] {
  const categories = loadGeoKeywords(keywordsPath);
  const keywords: string[] = [];

  for (const category of categories) {
    keywords.push(...category.german, ...category.english);
  }

  return keywords;
}

/**
 * Get keywords for a specific locale.
 */
export function getKeywordsByLocale(locale: 'de' | 'en', keywordsPath?: string): string[] {
  const categories = loadGeoKeywords(keywordsPath);
  const field = locale === 'de' ? 'german' : 'english';
  const keywords: string[] = [];

  for (const category of categories) {
    keywords.push(...category[field]);
  }

  return keywords;
}

/**
 * Check if a content body contains any keywords from the keyword list.
 * Uses case-insensitive substring matching.
 *
 * Returns an array of matches with the keyword and its parent category name.
 */
export function findMatchingKeywords(
  body: string,
  locale: 'de' | 'en',
  keywordsPath?: string,
): { keyword: string; category: string }[] {
  const categories = loadGeoKeywords(keywordsPath);
  const field = locale === 'de' ? 'german' : 'english';
  const lowerBody = body.toLowerCase();
  const matches: { keyword: string; category: string }[] = [];

  for (const category of categories) {
    for (const keyword of category[field]) {
      if (lowerBody.includes(keyword.toLowerCase())) {
        matches.push({ keyword, category: category.name });
      }
    }
  }

  return matches;
}
