/**
 * Orphan Content Detection Rules
 * Identifies content that is not linked from any other page
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import type { LinkExtractor } from '../utils/link-extractor.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Normalize a permalink for comparison by removing trailing slashes
 */
function normalizePermalink(permalink: string): string {
  if (permalink.length > 1 && permalink.endsWith('/')) {
    return permalink.slice(0, -1);
  }
  return permalink;
}

/**
 * Factory: Create orphan content detection rules that use the provided LinkExtractor
 */
export function createOrphanRules(linkExtractor: LinkExtractor): Rule[] {
  const { extractLinks, getInternalLinks } = linkExtractor;

  /**
   * Rule: Blog and project content should be linked from at least one other page
   * Orphan pages are hard to discover and receive less search engine traffic
   */
  const orphanContent: Rule = {
    name: 'orphan-content',
    severity: 'warning',
    category: 'seo',
    fixStrategy: 'Add an internal link to this page from a related page',
    run: (item: ContentItem, context: RuleContext): LintResult[] => {
      // Only check blog posts and projects
      if (item.contentType !== 'blog' && item.contentType !== 'project') {
        return [];
      }

      // Skip drafts and noindex content
      if (item.draft || item.noindex) {
        return [];
      }

      const itemPermalink = normalizePermalink(item.permalink);

      // Check if any other content item links to this item
      for (const other of context.allContent) {
        // Skip self
        if (other.slug === item.slug && other.contentType === item.contentType) {
          continue;
        }

        const links = extractLinks(other.body);
        const internalLinks = getInternalLinks(links);

        for (const link of internalLinks) {
          const normalizedLink = normalizePermalink(link.url);
          if (normalizedLink === itemPermalink) {
            // Found a link to this item — not orphaned
            return [];
          }
        }
      }

      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'orphan-content',
        severity: 'warning',
        message: `No other content links to this ${item.contentType} post`,
        suggestion: `Add an internal link to "${item.permalink}" from a related page to improve discoverability`,
      }];
    },
  };

  return [orphanContent];
}
