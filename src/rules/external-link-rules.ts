/**
 * External Link Validation Rules
 * Validates external URLs for correctness, security, and density
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import type { LinkExtractor } from '../utils/link-extractor.js';
import { getDisplayPath } from '../utils/display-path.js';
import { countWords } from '../utils/word-counter.js';

/**
 * Outbound link density thresholds.
 * Minimum external links required scales with word count.
 */
const OUTBOUND_MIN_BASE = 3;
const OUTBOUND_WORDS_PER_EXTRA_LINK = 500;
const OUTBOUND_MIN_WORDS_TO_APPLY = 300;

/**
 * Factory: Create external link validation rules that use the provided LinkExtractor
 */
export function createExternalLinkRules(linkExtractor: LinkExtractor): Rule[] {
  const { extractLinks } = linkExtractor;

  /**
   * Rule: External links must be well-formed URLs
   * Catches typos and malformed URLs before they reach production
   */
  const externalLinkMalformed: Rule = {
    name: 'external-link-malformed',
    severity: 'warning',
    category: 'technical',
    fixStrategy: 'Check the URL for typos or missing protocol (https://)',
    run: (item: ContentItem): LintResult[] => {
      const results: LintResult[] = [];
      const links = extractLinks(item.body);

      for (const link of links) {
        if (link.isInternal) {
          continue;
        }

        try {
          new URL(link.url);
        } catch {
          results.push({
            file: getDisplayPath(item),
            field: 'body',
            rule: 'external-link-malformed',
            severity: 'warning',
            message: `Malformed external URL: ${link.url}`,
            suggestion: 'Check the URL for typos or missing protocol (https://)',
            line: link.line,
          });
        }
      }

      return results;
    },
  };

  /**
   * Rule: External links should use HTTPS instead of HTTP
   * HTTP links are insecure and may trigger browser warnings
   */
  const externalLinkHttp: Rule = {
    name: 'external-link-http',
    severity: 'warning',
    category: 'technical',
    fixStrategy: 'Replace http:// with https://',
    run: (item: ContentItem): LintResult[] => {
      const results: LintResult[] = [];
      const links = extractLinks(item.body);

      for (const link of links) {
        if (link.isInternal) {
          continue;
        }

        // Check for http:// but exclude localhost for development links
        if (link.url.startsWith('http://') && !link.url.startsWith('http://localhost')) {
          results.push({
            file: getDisplayPath(item),
            field: 'body',
            rule: 'external-link-http',
            severity: 'warning',
            message: `Insecure HTTP link: ${link.url}`,
            suggestion: `Use HTTPS instead: "${link.url.replace('http://', 'https://')}"`,
            line: link.line,
          });
        }
      }

      return results;
    },
  };

  /**
   * Rule: Content should include enough outbound links to cite sources.
   * Minimum scales with article length: 3 for short articles,
   * +1 for every additional 500 words.
   */
  const externalLinkMinDensity: Rule = {
    name: 'external-link-low-density',
    severity: 'warning',
    category: 'seo',
    fixStrategy: 'Add outbound links to cite sources, reference tools, or link to studies',
    run: (item: ContentItem): LintResult[] => {
      if (item.contentType !== 'blog') {
        return [];
      }

      const wordCount = countWords(item.body);
      if (wordCount < OUTBOUND_MIN_WORDS_TO_APPLY) {
        return [];
      }

      const links = extractLinks(item.body);
      const externalLinks = links.filter(link => !link.isInternal);
      const externalCount = externalLinks.length;

      const extraLinks = Math.max(
        0,
        Math.floor((wordCount - OUTBOUND_MIN_WORDS_TO_APPLY) / OUTBOUND_WORDS_PER_EXTRA_LINK)
      );
      const requiredMin = OUTBOUND_MIN_BASE + extraLinks;

      if (externalCount < requiredMin) {
        return [{
          file: getDisplayPath(item),
          field: 'body',
          rule: 'external-link-low-density',
          severity: 'warning',
          message: `Only ${externalCount} outbound link(s) for ${wordCount} words (minimum: ${requiredMin})`,
          suggestion: `Add ${requiredMin - externalCount} more outbound link(s) to cite sources, reference tools, or link to studies that support your claims.`,
        }];
      }

      return [];
    },
  };

  return [
    externalLinkMalformed,
    externalLinkHttp,
    externalLinkMinDensity,
  ];
}
