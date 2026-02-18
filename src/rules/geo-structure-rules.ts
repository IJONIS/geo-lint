/**
 * GEO Structure Rules
 * Validates content structure and formatting patterns for AI extraction
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { countWords } from '../utils/word-counter.js';
import {
  extractH2Sections,
  getParagraphs,
  hasMarkdownList,
} from '../utils/geo-analyzer.js';
import {
  analyzeHeadingDensity,
  countStructuralElements,
} from '../utils/geo-advanced-analyzer.js';

/** Minimum word count before structure rules apply */
const STRUCTURE_MIN_WORDS = 500;

/** Minimum word count for long-form structure rules */
const STRUCTURE_LONG_MIN_WORDS = 800;

/** Maximum words per H2 section before it needs sub-headings */
const SECTION_MAX_WORDS = 300;

/** Maximum words per paragraph */
const PARAGRAPH_MAX_WORDS = 100;

/** Maximum paragraph violations reported (to reduce noise) */
const PARAGRAPH_MAX_VIOLATIONS = 5;

/** Maximum words in the first paragraph of a citation block */
const CITATION_BLOCK_MAX_WORDS = 80;

/** Ratio of sections with overly long citation blocks before flagging */
const CITATION_BLOCK_RATIO_THRESHOLD = 0.5;

/** Maximum words in the introduction before first H2 */
const INTRO_MAX_WORDS = 150;

/** Maximum word gap between headings for density rule */
const HEADING_GAP_MAX_WORDS = 300;

/** Maximum heading density violations reported */
const HEADING_DENSITY_MAX_VIOLATIONS = 3;

/** Expected structural elements per N words */
const WORDS_PER_STRUCTURAL_ELEMENT = 500;

// ---------------------------------------------------------------------------
// Rule 3: geo-section-too-long (static)
// ---------------------------------------------------------------------------

export const geoSectionTooLong: Rule = {
  name: 'geo-section-too-long',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Break long sections into sub-sections with H3 headings every 200-300 words',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < STRUCTURE_MIN_WORDS) return [];

    const sections = extractH2Sections(item.body);
    const results: LintResult[] = [];
    const displayPath = getDisplayPath(item);

    for (const section of sections) {
      const sectionWordCount = countWords(section.body);
      const hasSubHeadings = /^###\s+/m.test(section.body);

      if (sectionWordCount > SECTION_MAX_WORDS && !hasSubHeadings) {
        results.push({
          file: displayPath,
          field: 'body',
          rule: 'geo-section-too-long',
          severity: 'warning',
          message: `Section "${section.heading}" is ${sectionWordCount} words with no sub-headings (H3) \u2014 max recommended is ${SECTION_MAX_WORDS}`,
          suggestion: 'Break this section into sub-sections using H3 headings. AI systems parse shorter, well-structured sections more effectively.',
          line: section.line,
        });
      }
    }

    return results;
  },
};

// ---------------------------------------------------------------------------
// Rule 4: geo-paragraph-too-long (static)
// ---------------------------------------------------------------------------

export const geoParagraphTooLong: Rule = {
  name: 'geo-paragraph-too-long',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Split paragraphs longer than 100 words into shorter focused paragraphs',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < STRUCTURE_MIN_WORDS) return [];

    const paragraphs = getParagraphs(item.body);
    const results: LintResult[] = [];
    const displayPath = getDisplayPath(item);

    for (const paragraph of paragraphs) {
      if (results.length >= PARAGRAPH_MAX_VIOLATIONS) break;

      if (paragraph.wordCount > PARAGRAPH_MAX_WORDS) {
        results.push({
          file: displayPath,
          field: 'body',
          rule: 'geo-paragraph-too-long',
          severity: 'warning',
          message: `Paragraph at line ${paragraph.line} is ${paragraph.wordCount} words \u2014 max recommended is ${PARAGRAPH_MAX_WORDS}`,
          suggestion: 'Split this paragraph into two or more shorter paragraphs. Shorter paragraphs are easier for AI systems to extract as citation blocks.',
          line: paragraph.line,
        });
      }
    }

    return results;
  },
};

// ---------------------------------------------------------------------------
// Rule 5: geo-missing-lists (static)
// ---------------------------------------------------------------------------

export const geoMissingLists: Rule = {
  name: 'geo-missing-lists',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add at least one bulleted or numbered list to improve scannability and AI extraction',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < STRUCTURE_MIN_WORDS) return [];

    if (!hasMarkdownList(item.body)) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-missing-lists',
        severity: 'warning',
        message: 'No bulleted or numbered list found in content',
        suggestion: 'Add at least one bulleted or numbered list. Lists are highly extractable by AI systems and improve content scannability.',
      }];
    }

    return [];
  },
};

// ---------------------------------------------------------------------------
// Rule 13: geo-citation-block-upper-bound (static)
// ---------------------------------------------------------------------------

export const geoCitationBlockUpperBound: Rule = {
  name: 'geo-citation-block-upper-bound',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Keep the first paragraph after each heading under 80 words for optimal AI extraction',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < STRUCTURE_LONG_MIN_WORDS) return [];

    const sections = extractH2Sections(item.body);
    if (sections.length === 0) return [];

    let overLongCount = 0;

    for (const section of sections) {
      // First paragraph: text before first blank line after heading
      const firstParagraph = section.body.split(/\n\s*\n/)[0] ?? '';
      const firstParaWords = countWords(firstParagraph.trim());

      if (firstParaWords > CITATION_BLOCK_MAX_WORDS) {
        overLongCount++;
      }
    }

    const ratio = overLongCount / sections.length;

    if (ratio > CITATION_BLOCK_RATIO_THRESHOLD) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-citation-block-upper-bound',
        severity: 'warning',
        message: `${overLongCount}/${sections.length} sections (${Math.round(ratio * 100)}%) have first paragraphs over ${CITATION_BLOCK_MAX_WORDS} words \u2014 too long for AI citation extraction`,
        suggestion: `Keep the first paragraph after each H2 heading under ${CITATION_BLOCK_MAX_WORDS} words. Overly long opening paragraphs reduce AI extraction accuracy.`,
      }];
    }

    return [];
  },
};

// ---------------------------------------------------------------------------
// Rule 18: geo-orphaned-intro (static)
// ---------------------------------------------------------------------------

export const geoOrphanedIntro: Rule = {
  name: 'geo-orphaned-intro',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Shorten the introduction to under 150 words or add a heading to break it up',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < STRUCTURE_MIN_WORDS) return [];

    // Content before the first H2 heading
    const introContent = item.body.split(/^##\s+/m)[0] ?? '';
    const introWords = countWords(introContent);

    if (introWords > INTRO_MAX_WORDS) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-orphaned-intro',
        severity: 'warning',
        message: `Introduction before first H2 heading is ${introWords} words \u2014 max recommended is ${INTRO_MAX_WORDS}`,
        suggestion: 'Shorten the introduction or add an H2 heading to break up the opening. Long introductions delay AI systems from reaching structured content.',
      }];
    }

    return [];
  },
};

// ---------------------------------------------------------------------------
// Rule 22: geo-heading-density (static)
// ---------------------------------------------------------------------------

export const geoHeadingDensity: Rule = {
  name: 'geo-heading-density',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add headings so that no text gap exceeds 300 words without a heading',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < STRUCTURE_LONG_MIN_WORDS) return [];

    const { gaps } = analyzeHeadingDensity(item.body);
    const results: LintResult[] = [];
    const displayPath = getDisplayPath(item);

    for (const gap of gaps) {
      if (results.length >= HEADING_DENSITY_MAX_VIOLATIONS) break;
      if (gap.wordCount <= HEADING_GAP_MAX_WORDS) continue;

      results.push({
        file: displayPath,
        field: 'body',
        rule: 'geo-heading-density',
        severity: 'warning',
        message: `${gap.wordCount}-word gap without a heading after "${gap.afterHeading}" at line ${gap.line} \u2014 max recommended is ${HEADING_GAP_MAX_WORDS}`,
        suggestion: 'Add a heading to break up this long text block. AI systems rely on headings to segment and extract content.',
        line: gap.line,
      });
    }

    return results;
  },
};

// ---------------------------------------------------------------------------
// Rule 28: geo-structural-element-ratio (static)
// ---------------------------------------------------------------------------

export const geoStructuralElementRatio: Rule = {
  name: 'geo-structural-element-ratio',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add structural elements (lists, tables, blockquotes, code blocks) for better AI extraction',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < STRUCTURE_MIN_WORDS) return [];

    const structuralCount = countStructuralElements(item.body);
    const expected = Math.floor(wordCount / WORDS_PER_STRUCTURAL_ELEMENT);

    if (structuralCount < expected) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-structural-element-ratio',
        severity: 'warning',
        message: `Found ${structuralCount} structural element(s) but expected at least ${expected} (1 per ${WORDS_PER_STRUCTURAL_ELEMENT} words in ${wordCount}-word post)`,
        suggestion: 'Add structural elements such as lists, tables, blockquotes, or code blocks. These are highly extractable by AI systems and improve content scannability.',
      }];
    }

    return [];
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** All GEO structure rules (static, no config dependency) */
export const geoStructureRules: Rule[] = [
  geoSectionTooLong,
  geoParagraphTooLong,
  geoMissingLists,
  geoCitationBlockUpperBound,
  geoOrphanedIntro,
  geoHeadingDensity,
  geoStructuralElementRatio,
];
