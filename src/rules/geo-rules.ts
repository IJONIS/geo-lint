/**
 * GEO (Generative Engine Optimization) Rules
 * Validates content readiness for LLM-based search and AI visibility
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { countWords } from '../utils/word-counter.js';
import { extractHeadings } from '../utils/heading-extractor.js';
import {
  countQuestionHeadings,
  analyzeLeadSentences,
  countStatistics,
  hasFAQSection,
  hasMarkdownTable,
  countEntityMentions,
  analyzeCitationBlocks,
} from '../utils/geo-analyzer.js';

/** Minimum word count before GEO rules apply */
const GEO_MIN_WORDS = 500;

/** Minimum word count before FAQ section rule applies */
const FAQ_MIN_WORDS = 800;

/** Minimum percentage of headings that should be question-formatted */
const QUESTION_HEADING_THRESHOLD = 0.2;

/** Minimum percentage of sections with direct answer leads */
const DIRECT_ANSWER_THRESHOLD = 0.5;

/** Expected data points per N words */
const CITATION_WORDS_PER_STAT = 500;

/** Minimum word count before table rule applies */
const TABLE_MIN_WORDS = 1000;

/** Minimum word count before entity density rule applies */
const ENTITY_MIN_WORDS = 800;

/** Minimum word count before citation block rule applies */
const CITATION_BLOCK_MIN_WORDS = 800;

/** Minimum words for a first paragraph to qualify as a citation block */
const CITATION_BLOCK_WORD_THRESHOLD = 40;

/** Minimum ratio of sections that should have adequate citation blocks */
const CITATION_BLOCK_SECTION_THRESHOLD = 0.5;

/**
 * Rule: Blog posts should use question-formatted headings for LLM discoverability
 * At least 20% of H2/H3 headings should be questions
 */
export const geoNoQuestionHeadings: Rule = {
  name: 'geo-no-question-headings',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Rephrase some headings as questions (e.g., "How does X work?")',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < GEO_MIN_WORDS) return [];

    const headings = extractHeadings(item.body);
    const subHeadings = headings.filter(h => h.level === 2 || h.level === 3);

    if (subHeadings.length === 0) return [];

    const questionCount = countQuestionHeadings(item.body);
    const ratio = questionCount / subHeadings.length;

    if (ratio < QUESTION_HEADING_THRESHOLD) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-no-question-headings',
        severity: 'warning',
        message: `Only ${questionCount}/${subHeadings.length} (${Math.round(ratio * 100)}%) H2/H3 headings are question-formatted — aim for at least ${Math.round(QUESTION_HEADING_THRESHOLD * 100)}%`,
        suggestion: 'Rephrase some headings as questions (e.g., "How does X work?" / "Was ist X?") to improve LLM snippet extraction.',
      }];
    }

    return [];
  },
};

/**
 * Rule: Sections should start with direct answers, not filler introductions
 * At least 50% of sections should lead with substantive first sentences
 */
export const geoWeakLeadSentences: Rule = {
  name: 'geo-weak-lead-sentences',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Start each section with a concise factual sentence that directly answers the heading',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < GEO_MIN_WORDS) return [];

    const { totalSections, sectionsWithDirectAnswers } = analyzeLeadSentences(item.body);

    if (totalSections === 0) return [];

    const ratio = sectionsWithDirectAnswers / totalSections;

    if (ratio < DIRECT_ANSWER_THRESHOLD) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-weak-lead-sentences',
        severity: 'warning',
        message: `Only ${sectionsWithDirectAnswers}/${totalSections} (${Math.round(ratio * 100)}%) sections start with direct answers — aim for at least ${Math.round(DIRECT_ANSWER_THRESHOLD * 100)}%`,
        suggestion: 'Start each section with a concise factual sentence that directly answers the heading. Avoid filler like "In this section..." or "Let\'s look at...".',
      }];
    }

    return [];
  },
};

/**
 * Rule: Content should include statistical data points for citation potential
 * Expect at least 1 data point per 500 words
 */
export const geoLowCitationDensity: Rule = {
  name: 'geo-low-citation-density',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add statistics, percentages, or concrete numbers to increase citation potential',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < GEO_MIN_WORDS) return [];

    const statCount = countStatistics(item.body);
    const expectedMin = Math.floor(wordCount / CITATION_WORDS_PER_STAT);

    if (statCount < expectedMin) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-low-citation-density',
        severity: 'warning',
        message: `Found ${statCount} data points but expected at least ${expectedMin} (1 per ${CITATION_WORDS_PER_STAT} words in ${wordCount}-word post)`,
        suggestion: 'Add statistics, percentages, or concrete numbers to increase citation potential in AI-generated answers.',
      }];
    }

    return [];
  },
};

/**
 * Rule: Longer blog posts should include a FAQ section for LLM extraction
 * Applies to posts with 800+ words
 */
export const geoMissingFaqSection: Rule = {
  name: 'geo-missing-faq-section',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add an "## FAQ" or "## Frequently Asked Questions" section with Q&A pairs',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < FAQ_MIN_WORDS) return [];

    if (!hasFAQSection(item.body)) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-missing-faq-section',
        severity: 'warning',
        message: 'No FAQ section detected in long-form content',
        suggestion: 'Add an "## FAQ" or "## Häufige Fragen" section with Q&A pairs. FAQ sections are frequently extracted by LLMs and featured in AI answers.',
      }];
    }

    return [];
  },
};

/**
 * Rule: Long-form blog posts should contain at least one data table
 * Tables are highly extractable by AI systems and increase citation rates
 * Applies to posts with 1000+ words
 */
export const geoMissingTable: Rule = {
  name: 'geo-missing-table',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add a comparison table, feature matrix, or data summary table',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < TABLE_MIN_WORDS) return [];

    if (!hasMarkdownTable(item.body)) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-missing-table',
        severity: 'warning',
        message: 'No data table found in long-form content (tables increase AI citation rates by 2.5x)',
        suggestion: 'Add a comparison table, feature matrix, or data summary table. Tables are highly extractable by AI systems and increase citation likelihood.',
      }];
    }

    return [];
  },
};

/**
 * Rule: H2 sections should start with substantial "citation blocks"
 * AI systems extract the first paragraph after headings as citation snippets.
 * At least 50% of sections should have first paragraphs of 40+ words.
 * Applies to posts with 800+ words
 */
export const geoShortCitationBlocks: Rule = {
  name: 'geo-short-citation-blocks',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Start each section with a 40-60 word paragraph that directly answers the heading',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < CITATION_BLOCK_MIN_WORDS) return [];

    const { totalSections, sectionsWithAdequateBlocks } = analyzeCitationBlocks(item.body);

    if (totalSections === 0) return [];

    const ratio = sectionsWithAdequateBlocks / totalSections;

    if (ratio < CITATION_BLOCK_SECTION_THRESHOLD) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-short-citation-blocks',
        severity: 'warning',
        message: `Only ${sectionsWithAdequateBlocks}/${totalSections} sections have substantial lead paragraphs (${CITATION_BLOCK_WORD_THRESHOLD}+ words) — AI systems extract these as citation blocks`,
        suggestion: `Start each section with a ${CITATION_BLOCK_WORD_THRESHOLD}-60 word paragraph that directly answers the heading question. These 'citation blocks' are what AI systems extract and cite.`,
      }];
    }

    return [];
  },
};

/**
 * Factory: Create the entity density rule with project-specific brand/city
 * When brandName is empty, the brand check is skipped.
 * When brandCity is empty, the city check is skipped.
 */
export function createGeoEntityRule(brandName: string, brandCity: string): Rule {
  return {
    name: 'geo-low-entity-density',
    severity: 'warning',
    category: 'geo',
    fixStrategy: 'Mention brand name and location naturally in the content body',
    run: (item: ContentItem): LintResult[] => {
      if (item.contentType !== 'blog') return [];

      const wordCount = countWords(item.body);
      if (wordCount < ENTITY_MIN_WORDS) return [];

      const results: LintResult[] = [];
      const displayPath = getDisplayPath(item);

      if (brandName && countEntityMentions(item.body, brandName) === 0) {
        results.push({
          file: displayPath,
          field: 'body',
          rule: 'geo-low-entity-density',
          severity: 'warning',
          message: `Brand name '${brandName}' not mentioned in content body — reduces entity recognition by AI systems`,
          suggestion: 'Mention the brand name naturally in the content to strengthen entity signals for AI systems.',
        });
      }

      if (brandCity && countEntityMentions(item.body, brandCity) === 0) {
        results.push({
          file: displayPath,
          field: 'body',
          rule: 'geo-low-entity-density',
          severity: 'warning',
          message: `Location '${brandCity}' not mentioned in content body — reduces local entity recognition`,
          suggestion: 'Include a location reference to strengthen local entity recognition for AI search.',
        });
      }

      return results;
    },
  };
}

/** Static GEO rules (no config dependency) */
export const geoStaticRules: Rule[] = [
  geoNoQuestionHeadings,
  geoWeakLeadSentences,
  geoLowCitationDensity,
  geoMissingFaqSection,
  geoMissingTable,
  geoShortCitationBlocks,
];

/**
 * Factory: Build the complete GEO rule set from config
 * Returns all 7 rules: 6 static + 1 entity density from factory
 */
export function createGeoRules(geo: { brandName: string; brandCity: string }): Rule[] {
  return [
    ...geoStaticRules,
    createGeoEntityRule(geo.brandName, geo.brandCity),
  ];
}

/**
 * Alias for backwards compatibility: static rules without entity density
 * Use when no GEO config is available
 */
export const geoRules: Rule[] = geoStaticRules;
