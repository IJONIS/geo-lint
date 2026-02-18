/**
 * Heading Extractor Utility
 * Extracts and analyzes heading structure from MDX content
 */

import type { Heading } from '../types.js';

/**
 * Check if a line is inside a code block
 * Tracks ``` and ~~~ fenced code blocks
 */
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

/**
 * Extract all headings from MDX body content
 * Handles markdown-style headings (# H1, ## H2, etc.)
 */
export function extractHeadings(mdxBody: string): Heading[] {
  const headings: Heading[] = [];
  const lines = mdxBody.split('\n');

  // Regex for markdown headings: # to ######
  const headingRegex = /^(#{1,6})\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headingRegex);

    if (match && !isInCodeBlock(lines, i)) {
      const [, hashes, text] = match;
      headings.push({
        level: hashes.length,
        text: text.trim(),
        line: i + 1, // 1-indexed for display
      });
    }
  }

  return headings;
}

/**
 * Count H1 headings in the content
 */
export function countH1s(headings: Heading[]): number {
  return headings.filter(h => h.level === 1).length;
}

/**
 * Find H1 headings (for error reporting)
 */
export function findH1s(headings: Heading[]): Heading[] {
  return headings.filter(h => h.level === 1);
}

/**
 * Check for heading hierarchy violations
 * A violation occurs when a heading level is skipped (e.g., H1 -> H3 without H2)
 */
export function findHierarchyViolations(headings: Heading[]): Array<{
  heading: Heading;
  previousLevel: number;
  expectedMaxLevel: number;
}> {
  const violations: Array<{
    heading: Heading;
    previousLevel: number;
    expectedMaxLevel: number;
  }> = [];

  let previousLevel = 0;

  for (const heading of headings) {
    // A heading should be at most 1 level deeper than previous
    // e.g., H1 can be followed by H1 or H2, not H3+
    if (heading.level > previousLevel + 1 && previousLevel > 0) {
      violations.push({
        heading,
        previousLevel,
        expectedMaxLevel: previousLevel + 1,
      });
    }

    previousLevel = heading.level;
  }

  return violations;
}

/**
 * Get a summary of heading structure for debugging
 */
export function getHeadingSummary(headings: Heading[]): string {
  if (headings.length === 0) {
    return 'No headings found';
  }

  const counts: Record<number, number> = {};
  for (const h of headings) {
    counts[h.level] = (counts[h.level] || 0) + 1;
  }

  return Object.entries(counts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([level, count]) => `H${level}: ${count}`)
    .join(', ');
}
