/**
 * Link Validation Rules
 * Validates internal links resolve to existing pages
 *
 * These rules require a LinkExtractor instance (created per-project
 * with the site's internal URL patterns). Use the createLinkRules()
 * factory to build the rule set.
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import type { LinkExtractor } from '../utils/link-extractor.js';
import { getDisplayPath } from '../utils/display-path.js';
import { isValidInternalLink } from '../utils/slug-resolver.js';

/**
 * Factory: Create link validation rules that use the provided LinkExtractor
 */
export function createLinkRules(linkExtractor: LinkExtractor): Rule[] {
  const { extractLinks, getInternalLinks, isAbsoluteInternalLink } = linkExtractor;

  /**
   * Rule: Internal links must resolve to existing pages
   */
  const brokenInternalLink: Rule = {
    name: 'broken-internal-link',
    severity: 'error',
    category: 'technical',
    fixStrategy: 'Fix the link target to point to an existing page',
    run: (item: ContentItem, context: RuleContext): LintResult[] => {
      const results: LintResult[] = [];
      const links = extractLinks(item.body);
      const internalLinks = getInternalLinks(links);

      for (const link of internalLinks) {
        if (!isValidInternalLink(link.url, context.validSlugs)) {
          results.push({
            file: getDisplayPath(item),
            field: 'body',
            rule: 'broken-internal-link',
            severity: 'error',
            message: `Broken internal link: ${link.url}`,
            suggestion: `Link "${link.originalUrl}" does not resolve to any known page`,
            line: link.line,
          });
        }
      }

      return results;
    },
  };

  /**
   * Rule: Internal links should use relative paths instead of absolute URLs
   */
  const absoluteInternalLink: Rule = {
    name: 'absolute-internal-link',
    severity: 'warning',
    category: 'technical',
    fixStrategy: 'Use a relative path instead of an absolute URL',
    run: (item: ContentItem): LintResult[] => {
      const results: LintResult[] = [];
      const links = extractLinks(item.body);

      for (const link of links) {
        if (link.isInternal && isAbsoluteInternalLink(link.originalUrl)) {
          results.push({
            file: getDisplayPath(item),
            field: 'body',
            rule: 'absolute-internal-link',
            severity: 'warning',
            message: `Absolute internal URL: ${link.originalUrl}`,
            suggestion: `Use relative path "${link.url}" instead for better portability`,
            line: link.line,
          });
        }
      }

      return results;
    },
  };

  /**
   * Rule: Internal links must not point to draft or noindex pages
   * Prevents publishing content that links to hidden pages
   */
  const draftLinkLeak: Rule = {
    name: 'draft-link-leak',
    severity: 'error',
    category: 'technical',
    fixStrategy: 'Remove or update link — the target page is not publicly visible',
    run: (item: ContentItem, context: RuleContext): LintResult[] => {
      // Skip draft/noindex items — they aren't publicly visible
      if (item.draft || item.noindex) {
        return [];
      }

      const results: LintResult[] = [];
      const links = extractLinks(item.body);
      const internalLinks = getInternalLinks(links);

      // Build set of permalinks for draft/noindex content
      const draftPermalinks = new Set<string>(
        context.allContent
          .filter(c => c.draft === true || c.noindex === true)
          .map(c => c.permalink)
      );

      for (const link of internalLinks) {
        if (draftPermalinks.has(link.url)) {
          results.push({
            file: getDisplayPath(item),
            field: 'body',
            rule: 'draft-link-leak',
            severity: 'error',
            message: `Internal link points to draft/noindex page: ${link.url}`,
            suggestion: `Remove or update link "${link.originalUrl}" — the target page is not publicly visible`,
            line: link.line,
          });
        }
      }

      return results;
    },
  };

  /**
   * Rule: Internal links should not have trailing slashes
   * Ensures consistent URL formatting across the site
   */
  const trailingSlashInconsistency: Rule = {
    name: 'trailing-slash-inconsistency',
    severity: 'warning',
    category: 'technical',
    fixStrategy: 'Remove the trailing slash from the internal link',
    run: (item: ContentItem): LintResult[] => {
      const results: LintResult[] = [];
      const links = extractLinks(item.body);
      const internalLinks = getInternalLinks(links);

      for (const link of internalLinks) {
        // Check original URL (before normalization) for trailing slash
        // Skip root "/" which is fine
        const originalPath = link.originalUrl.split('?')[0].split('#')[0];
        if (originalPath !== '/' && originalPath.endsWith('/')) {
          results.push({
            file: getDisplayPath(item),
            field: 'body',
            rule: 'trailing-slash-inconsistency',
            severity: 'warning',
            message: `Internal link has trailing slash: ${link.originalUrl}`,
            suggestion: `Remove trailing slash: "${originalPath.slice(0, -1)}"`,
            line: link.line,
          });
        }
      }

      return results;
    },
  };

  return [
    brokenInternalLink,
    absoluteInternalLink,
    draftLinkLeak,
    trailingSlashInconsistency,
  ];
}
