/**
 * Plain-Text Structure Detection
 * Heuristic detection of headings, tables, lists, and FAQ sections
 * in content extracted from URLs (no markdown formatting).
 */

import type { Heading } from '../types.js';

/** Max line length for a heading candidate */
const MAX_HEADING_LENGTH = 80;

/** Min consecutive structured rows to detect a table */
const MIN_TABLE_ROWS = 2;

/**
 * Detect headings in plain text using heuristics:
 * - Short line (<80 chars) followed by blank line
 * - Not ending with sentence punctuation (. , ;) unless it's ?
 * - Title Case, ALL CAPS, or starts with question word
 *
 * @example
 * ```ts
 * const headings = detectPlaintextHeadings('Introduction\n\nSome text.');
 * // [{ level: 2, text: 'Introduction', line: 1 }]
 * ```
 */
export function detectPlaintextHeadings(text: string): Heading[] {
  const lines = text.split('\n');
  const headings: Heading[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length > MAX_HEADING_LENGTH) continue;

    // Must be followed by blank line or be at end of text
    const nextLine = lines[i + 1]?.trim() ?? '';
    const isFollowedByBlank = i + 1 >= lines.length || nextLine === '';
    if (!isFollowedByBlank) continue;

    // Reject lines ending with sentence-ending punctuation (except ?)
    if (/[.,;:]$/.test(line)) continue;

    // Must look like a heading: Title Case, ALL CAPS, or question
    const isTitleCase =
      /^[A-ZÄÖÜ]/.test(line) && line.split(/\s+/).length <= 12;
    const isAllCaps =
      line === line.toUpperCase() &&
      /[A-ZÄÖÜ]/.test(line) &&
      line.length > 2;
    const isQuestion = line.endsWith('?');

    if (isTitleCase || isAllCaps || isQuestion) {
      // Estimate heading level: ALL CAPS or very short = level 2, others = level 3
      const level =
        isAllCaps || line.split(/\s+/).length <= 4 ? 2 : 3;
      headings.push({ level, text: line, line: i + 1 });
    }
  }

  return headings;
}

/**
 * Detect tabular data in plain text:
 * - Tab-separated rows with consistent column count
 * - Space-aligned columns (3+ spaces between values)
 *
 * @example
 * ```ts
 * detectPlaintextTable('Name\tPrice\nA\t$10'); // true
 * ```
 */
export function detectPlaintextTable(text: string): boolean {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  // Check for tab-separated data
  const tabLines = lines.filter((l) => l.includes('\t'));
  if (tabLines.length >= MIN_TABLE_ROWS) {
    const colCounts = tabLines.map((l) => l.split('\t').length);
    const consistent = colCounts.every(
      (c) => c === colCounts[0] && c >= 2,
    );
    if (consistent) return true;
  }

  // Check for space-aligned columns (3+ spaces between values)
  const spaceSeparated = lines.filter((l) => /\S {3,}\S/.test(l));
  if (spaceSeparated.length >= MIN_TABLE_ROWS + 1) {
    return true;
  }

  return false;
}

/**
 * Detect list items in plain text:
 * - Unicode bullets: bullet, middle dot, en-dash, em-dash
 * - Parenthetical numbers: 1), 2), a), b)
 *
 * @example
 * ```ts
 * detectPlaintextList('• First\n• Second'); // true
 * ```
 */
export function detectPlaintextList(text: string): boolean {
  const listPattern =
    /^[\s]*[•·–—]\s+|^[\s]*\w\)\s+|^[\s]*\d+\)\s+/m;
  const lines = text.split('\n').filter((l) => listPattern.test(l));
  return lines.length >= 2;
}

/**
 * Detect FAQ-like question-answer patterns:
 * - Lines ending with ? followed by paragraph text
 * - At least 2 Q&A pairs to qualify
 *
 * @example
 * ```ts
 * detectPlaintextFaq('What is X?\nX is...\n\nWhy Y?\nBecause...');
 * // { hasFaq: true, questionCount: 2 }
 * ```
 */
export function detectPlaintextFaq(text: string): {
  hasFaq: boolean;
  questionCount: number;
} {
  const lines = text.split('\n');
  let questionCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.endsWith('?')) continue;
    if (line.length > MAX_HEADING_LENGTH) continue;

    // Next non-empty line should be an answer (longer text)
    const nextContent = lines
      .slice(i + 1)
      .find((l) => l.trim().length > 0);
    if (nextContent && nextContent.trim().length > line.length) {
      questionCount++;
    }
  }

  return {
    hasFaq: questionCount >= 2,
    questionCount,
  };
}
