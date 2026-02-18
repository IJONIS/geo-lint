/**
 * Heading Structure Rules
 * Validates H1 presence, count, and heading hierarchy
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import {
  extractHeadings,
  countH1s,
  findH1s,
  findHierarchyViolations,
} from '../utils/heading-extractor.js';

/**
 * Rule: Content must have exactly one H1 heading
 * Exceptions:
 *   - Pages with category 'legal' or 'service' use ServicePageHeader (H1 via title prop)
 *   - Blog posts use BlogHeader component which renders the H1 from frontmatter title
 */
export const missingH1: Rule = {
  name: 'missing-h1',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Add an H1 heading (# Heading) at the start of the content',
  run: (item: ContentItem): LintResult[] => {
    // Skip H1 check for blog posts — BlogHeader renders the H1 from frontmatter title
    if (item.contentType === 'blog') {
      return [];
    }

    // Skip H1 check for pages that use ServicePageHeader component
    // These pages get their H1 from the title prop in the header
    if (item.category === 'legal' || item.category === 'service') {
      return [];
    }

    const headings = extractHeadings(item.body);
    const h1Count = countH1s(headings);

    if (h1Count === 0) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'missing-h1',
        severity: 'warning',
        message: 'No H1 heading found in content',
        suggestion: 'Add an H1 heading (# Heading) at the start of your content',
      }];
    }
    return [];
  },
};

/**
 * Rule: Content must not have multiple H1 headings
 * Blog posts are exempt — BlogHeader provides the page H1,
 * and MDX # headings are rendered as <h2> via mdx-components.tsx.
 */
export const multipleH1: Rule = {
  name: 'multiple-h1',
  severity: 'error',
  category: 'seo',
  fixStrategy: 'Convert extra H1s to H2s',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType === 'blog') {
      return [];
    }

    const headings = extractHeadings(item.body);
    const h1s = findH1s(headings);

    if (h1s.length > 1) {
      const locations = h1s.map(h => `line ${h.line}`).join(', ');
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'multiple-h1',
        severity: 'error',
        message: `Found ${h1s.length} H1 headings (expected 1)`,
        suggestion: `H1 headings at: ${locations}. Convert extra H1s to H2s.`,
      }];
    }
    return [];
  },
};

/**
 * Rule: Heading hierarchy should not skip levels
 * e.g., H1 -> H3 without H2 is a violation
 */
export const headingHierarchySkip: Rule = {
  name: 'heading-hierarchy-skip',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Adjust heading levels to avoid skipping (e.g., H2 before H3)',
  run: (item: ContentItem): LintResult[] => {
    const headings = extractHeadings(item.body);
    const violations = findHierarchyViolations(headings);

    return violations.map(v => ({
      file: getDisplayPath(item),
      field: 'body',
      rule: 'heading-hierarchy-skip',
      severity: 'warning' as const,
      message: `Heading level skipped: H${v.previousLevel} → H${v.heading.level}`,
      suggestion: `At line ${v.heading.line}: "${v.heading.text}". Expected H${v.expectedMaxLevel} or lower.`,
      line: v.heading.line,
    }));
  },
};

/**
 * Rule: Heading text should not be duplicated within the same page
 * Duplicate headings confuse readers and dilute SEO signal
 */
export const duplicateHeadingText: Rule = {
  name: 'duplicate-heading-text',
  severity: 'warning',
  category: 'seo',
  fixStrategy: 'Use unique heading text for each section',
  run: (item: ContentItem): LintResult[] => {
    const results: LintResult[] = [];
    const headings = extractHeadings(item.body);

    const seen = new Map<string, number>();

    for (const heading of headings) {
      const normalized = heading.text.toLowerCase();
      const previousLine = seen.get(normalized);

      if (previousLine !== undefined) {
        results.push({
          file: getDisplayPath(item),
          field: 'body',
          rule: 'duplicate-heading-text',
          severity: 'warning',
          message: `Duplicate heading text: "${heading.text}"`,
          suggestion: `Same heading appears at line ${previousLine} and line ${heading.line}. Use unique headings for better structure.`,
          line: heading.line,
        });
      } else {
        seen.set(normalized, heading.line);
      }
    }

    return results;
  },
};

/**
 * All heading rules
 */
export const headingRules: Rule[] = [
  missingH1,
  multipleH1,
  headingHierarchySkip,
  duplicateHeadingText,
];
