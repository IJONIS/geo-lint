/**
 * Link Extractor Utility
 * Extracts and classifies links from MDX content
 */

import type { ExtractedLink } from '../types.js';

/** Link extraction utilities bound to a specific site URL */
export interface LinkExtractor {
  isInternalUrl: (url: string) => boolean;
  normalizeInternalUrl: (url: string) => string;
  isAbsoluteInternalLink: (url: string) => boolean;
  extractLinks: (mdxBody: string) => ExtractedLink[];
  getInternalLinks: (links: ExtractedLink[]) => ExtractedLink[];
}

/**
 * Create a link extractor bound to a specific site URL.
 * All internal URL detection derives from the provided siteUrl.
 */
export function createLinkExtractor(siteUrl: string): LinkExtractor {
  const { hostname } = new URL(siteUrl);
  const escapedDomain = hostname.replace(/\./g, '\\.');

  const internalPatterns = [
    new RegExp(`^https?:\\/\\/(www\\.)?${escapedDomain}(\\/|$)`, 'i'),
    new RegExp(`^\\/\\/${escapedDomain}(\\/|$)`, 'i'),
    /^\/(?!\/)/,  // Relative paths starting with single /
  ];

  function isInternalUrl(url: string): boolean {
    return internalPatterns.some(pattern => pattern.test(url));
  }

  function normalizeInternalUrl(url: string): string {
    let normalized = url;
    normalized = normalized.replace(new RegExp(`^https?:\\/\\/(www\\.)?${escapedDomain}`, 'i'), '');
    normalized = normalized.replace(new RegExp(`^\\/\\/${escapedDomain}`, 'i'), '');
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    normalized = normalized.split('?')[0].split('#')[0];
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }

  function isAbsoluteInternalLink(url: string): boolean {
    return new RegExp(`^https?:\\/\\/(www\\.)?${escapedDomain}`, 'i').test(url);
  }

  function isInCodeBlock(lines: string[], lineIndex: number): boolean {
    let inCodeBlock = false;
    for (let i = 0; i < lineIndex; i++) {
      const line = lines[i].trim();
      if (line.startsWith('```') || line.startsWith('~~~')) {
        inCodeBlock = !inCodeBlock;
      }
    }
    return inCodeBlock;
  }

  function extractLinks(mdxBody: string): ExtractedLink[] {
    const links: ExtractedLink[] = [];
    const lines = mdxBody.split('\n');
    const markdownLinkRegex = /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g;
    const hrefRegex = /href=["']([^"']+)["']/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isInCodeBlock(lines, i)) continue;

      let match;
      while ((match = markdownLinkRegex.exec(line)) !== null) {
        const [, text, url] = match;
        if (url.startsWith('mailto:') || url.startsWith('tel:') || url === '#') continue;
        const internal = isInternalUrl(url);
        links.push({
          text: text.trim(),
          url: internal ? normalizeInternalUrl(url) : url,
          originalUrl: url,
          line: i + 1,
          isInternal: internal,
        });
      }
      markdownLinkRegex.lastIndex = 0;

      while ((match = hrefRegex.exec(line)) !== null) {
        const [, url] = match;
        if (url.startsWith('mailto:') || url.startsWith('tel:') || url === '#') continue;
        const normalized = isInternalUrl(url) ? normalizeInternalUrl(url) : url;
        const alreadyCaptured = links.some(
          l => l.line === i + 1 && (l.url === normalized || l.originalUrl === url)
        );
        if (!alreadyCaptured) {
          const internal = isInternalUrl(url);
          links.push({
            text: '',
            url: internal ? normalizeInternalUrl(url) : url,
            originalUrl: url,
            line: i + 1,
            isInternal: internal,
          });
        }
      }
      hrefRegex.lastIndex = 0;
    }
    return links;
  }

  function getInternalLinks(links: ExtractedLink[]): ExtractedLink[] {
    return links.filter(l => l.isInternal);
  }

  return { isInternalUrl, normalizeInternalUrl, isAbsoluteInternalLink, extractLinks, getInternalLinks };
}
