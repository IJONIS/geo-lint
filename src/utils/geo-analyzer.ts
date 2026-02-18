/**
 * GEO (Generative Engine Optimization) Analyzer
 * Utilities for analyzing content readiness for LLM visibility
 */

import { extractHeadings } from './heading-extractor.js';
import { countWords } from './word-counter.js';

/**
 * Question words in English and German (case-insensitive matching)
 */
const QUESTION_WORDS = [
  'was', 'wie', 'warum', 'wann', 'wo', 'wer', 'welche',
  'how', 'what', 'why', 'when', 'where', 'who', 'which',
  'can', 'do', 'does', 'is', 'are', 'should',
];

/**
 * Weak lead sentence patterns (case-insensitive)
 * These indicate introductory filler rather than direct answers
 */
const WEAK_LEAD_STARTS = [
  'in this', 'the following', 'diesem',
  "let's", 'lass uns',
  'this section', 'dieser abschnitt',
];

/**
 * Markdown table separator pattern
 * Matches `|---`, `| ---`, `|:---`, `| :---:` and similar variants
 */
const TABLE_SEPARATOR_PATTERN = /\|\s*:?-{2,}/;

/**
 * Count headings that are formatted as questions
 * A question heading either ends with '?' or starts with a question word
 */
export function countQuestionHeadings(body: string): number {
  const headings = extractHeadings(body);
  let count = 0;

  for (const heading of headings) {
    const text = heading.text.trim();

    // Check if heading ends with question mark
    if (text.endsWith('?')) {
      count++;
      continue;
    }

    // Check if heading starts with a question word
    const firstWord = text.split(/\s+/)[0]?.toLowerCase() ?? '';
    if (QUESTION_WORDS.includes(firstWord)) {
      count++;
    }
  }

  return count;
}

/**
 * Analyze lead sentences across content sections
 * Splits on H2/H3 headings and checks if the first sentence in each
 * section is a direct answer (not a weak intro)
 */
export function analyzeLeadSentences(body: string): {
  totalSections: number;
  sectionsWithDirectAnswers: number;
} {
  // Split body on H2/H3 heading patterns
  const sectionPattern = /^#{2,3}\s+.+$/m;
  const sections = body.split(sectionPattern);

  // First element is content before the first heading (skip it)
  const contentSections = sections.slice(1);

  let totalSections = 0;
  let sectionsWithDirectAnswers = 0;

  for (const section of contentSections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    totalSections++;

    // Extract first sentence (ends with . ! or ?)
    const sentenceMatch = trimmed.match(/^([^.!?]+[.!?])/);
    if (!sentenceMatch) continue;

    const firstSentence = sentenceMatch[1].trim();

    // Skip if too short to be meaningful
    if (firstSentence.length <= 20) continue;

    // Skip if ends with question mark (not a direct answer)
    if (firstSentence.endsWith('?')) continue;

    // Check for weak lead patterns
    const lowerSentence = firstSentence.toLowerCase();
    const isWeakLead = WEAK_LEAD_STARTS.some(
      pattern => lowerSentence.startsWith(pattern)
    );

    if (!isWeakLead) {
      sectionsWithDirectAnswers++;
    }
  }

  return { totalSections, sectionsWithDirectAnswers };
}

/**
 * Count statistical data points in the content body
 * Looks for percentages, multipliers, currency values, large numbers, and scales
 */
export function countStatistics(body: string): number {
  const patterns: RegExp[] = [
    /\d+\s*%/g,                                    // Percentages: 50%, 23 %
    /\d+(?:\.\d+)?\s*(?:x|mal|times)/gi,          // Multipliers: 3x, 2.5 mal, 10 times
    /(?:€|\$|USD|EUR)\s*\d+/g,                     // Currency: €500, $1000, USD 50
    /\d{4,}/g,                                      // Large numbers: 10000, 2024 (4+ digits)
    /\d+(?:\.\d+)?\s*(?:million|billion|mrd|mio)/gi, // Scales: 5 million, 2.3 Mrd
  ];

  const matches = new Set<string>();

  for (const pattern of patterns) {
    const found = body.matchAll(pattern);
    for (const match of found) {
      // Use position as key to avoid double-counting overlapping matches
      matches.add(`${match.index}:${match[0]}`);
    }
  }

  return matches.size;
}

/**
 * Check if the content body contains a FAQ section
 * Matches common FAQ heading patterns in English and German
 */
export function hasFAQSection(body: string): boolean {
  const faqPattern = /#{2,3}\s*(FAQ|Häufige Fragen|Frequently Asked|Fragen und Antworten)/i;
  return faqPattern.test(body);
}

/**
 * Check if the content body contains at least one Markdown table
 * Detects the table separator row pattern (e.g., `|---|---`)
 */
export function hasMarkdownTable(body: string): boolean {
  return TABLE_SEPARATOR_PATTERN.test(body);
}

/**
 * Count case-insensitive occurrences of an entity string in the body
 *
 * @example
 * countEntityMentions("ACME builds software in Berlin", "acme") // 1
 * countEntityMentions("Visit Berlin, the best city. Berlin rocks.", "berlin") // 2
 */
export function countEntityMentions(body: string, entity: string): number {
  const escapedEntity = entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escapedEntity, 'gi');
  const matches = body.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Analyze citation blocks after H2 headings
 * For each H2 section, checks whether the first paragraph is substantial
 * (40+ words), which improves AI system extraction and citation likelihood
 *
 * @example
 * analyzeCitationBlocks("## Heading\n\nA long first paragraph...") // { totalSections: 1, sectionsWithAdequateBlocks: 1 }
 */
export function analyzeCitationBlocks(body: string): {
  totalSections: number;
  sectionsWithAdequateBlocks: number;
} {
  // Split on H2 headings specifically (not H3+)
  const h2Pattern = /^##\s+.+$/gm;
  const h2Matches = [...body.matchAll(h2Pattern)];

  if (h2Matches.length === 0) {
    return { totalSections: 0, sectionsWithAdequateBlocks: 0 };
  }

  let totalSections = 0;
  let sectionsWithAdequateBlocks = 0;

  for (let i = 0; i < h2Matches.length; i++) {
    const matchStart = h2Matches[i].index! + h2Matches[i][0].length;
    const nextHeadingStart = i + 1 < h2Matches.length
      ? h2Matches[i + 1].index!
      : body.length;

    const sectionContent = body.slice(matchStart, nextHeadingStart).trim();
    if (!sectionContent) continue;

    totalSections++;

    // Extract the first paragraph: text before the first blank line
    // followed by a heading, or before a sub-heading (### ...)
    const firstParagraph = extractFirstParagraph(sectionContent);
    if (!firstParagraph) continue;

    const wordCount = countWords(firstParagraph);
    if (wordCount >= 40) {
      sectionsWithAdequateBlocks++;
    }
  }

  return { totalSections, sectionsWithAdequateBlocks };
}

/**
 * Extract the first paragraph from a section content block
 * A paragraph ends at a blank line or at the next heading
 */
function extractFirstParagraph(sectionContent: string): string {
  const lines = sectionContent.split('\n');
  const paragraphLines: string[] = [];
  let foundContent = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip leading empty lines
    if (!foundContent && !trimmedLine) continue;

    // Stop at a heading line
    if (trimmedLine.startsWith('#')) break;

    // Stop at a blank line after content has started
    if (foundContent && !trimmedLine) break;

    // Skip import/export statements and JSX component lines
    if (trimmedLine.startsWith('import ') || trimmedLine.startsWith('export ')) continue;
    if (trimmedLine.startsWith('<') && !trimmedLine.startsWith('<a')) continue;

    foundContent = true;
    paragraphLines.push(trimmedLine);
  }

  return paragraphLines.join(' ');
}
