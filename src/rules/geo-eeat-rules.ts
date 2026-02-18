/**
 * GEO E-E-A-T Rules
 * Validates Experience, Expertise, Authoritativeness, and Trustworthiness signals
 * plus answer formatting patterns for AI citation optimization
 */

import type { Rule, ContentItem, LintResult, RuleContext } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { countWords } from '../utils/word-counter.js';
import { extractHeadings } from '../utils/heading-extractor.js';
import {
  countSourceCitations,
  hasExpertQuote,
  extractH2Sections,
  hasFAQSection,
} from '../utils/geo-analyzer.js';
import { analyzeFaqQuality } from '../utils/geo-advanced-analyzer.js';
import type { GeoConfig } from '../config/types.js';

const EEAT_MIN_WORDS = 500;       // Minimum words before most E-E-A-T rules apply
const EEAT_LONG_MIN_WORDS = 800;  // Minimum words for long-form content rules
const WORDS_PER_CITATION = 500;   // Expected 1 source citation per N words
const FAQ_MIN_PAIRS = 3;          // Minimum Q&A pairs in FAQ section
const FAQ_QUESTION_MARK_RATIO = 0.5;
const FAQ_ANSWER_RANGE_RATIO = 0.5;
const HEADING_MIN_WORDS = 3;      // Minimum words for a descriptive heading
const TLDR_SCAN_WORDS = 150;      // Words to scan for TL;DR at start of content

// -- Rule 1: geo-missing-source-citations (static) --
export const geoMissingSourceCitations: Rule = {
  name: 'geo-missing-source-citations',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add source references using "according to [Source]" or linked citations',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    const geoTypes = context.geoEnabledContentTypes ?? ['blog'];
    if (!geoTypes.includes(item.contentType)) return [];

    const wordCount = countWords(item.body);
    if (wordCount < EEAT_MIN_WORDS) return [];

    const found = countSourceCitations(item.body);
    const expected = Math.floor(wordCount / WORDS_PER_CITATION);

    if (found < expected) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-missing-source-citations',
        severity: 'warning',
        message: `Found ${found} source citation(s) but expected at least ${expected} (1 per ${WORDS_PER_CITATION} words in ${wordCount}-word post)`,
        suggestion: 'Add source references using "according to [Source]" or linked citations to strengthen authoritativeness.',
      }];
    }

    return [];
  },
};
// -- Rule 2: geo-missing-expert-quotes (static) --
export const geoMissingExpertQuotes: Rule = {
  name: 'geo-missing-expert-quotes',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add at least one blockquote with attribution (> "Quote" -- Expert Name)',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    const geoTypes = context.geoEnabledContentTypes ?? ['blog'];
    if (!geoTypes.includes(item.contentType)) return [];

    const wordCount = countWords(item.body);
    if (wordCount < EEAT_LONG_MIN_WORDS) return [];

    if (!hasExpertQuote(item.body)) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-missing-expert-quotes',
        severity: 'warning',
        message: 'No attributed expert quotation found in long-form content',
        suggestion: 'Add at least one blockquote with attribution (> "Quote" \u2014 Expert Name) to boost E-E-A-T signals.',
      }];
    }

    return [];
  },
};
// -- Rule 6: geo-missing-author (factory) --
export function createGeoMissingAuthorRule(genericNames: string[]): Rule {
  return {
    name: 'geo-missing-author',
    severity: 'warning',
    category: 'geo',
    fixStrategy: 'Set a real author name in frontmatter (not a generic placeholder)',
    run: (item: ContentItem, context: RuleContext): LintResult[] => {
      const geoTypes = context.geoEnabledContentTypes ?? ['blog'];
      if (!geoTypes.includes(item.contentType)) return [];

      const displayPath = getDisplayPath(item);

      // Check 1: missing or empty author (takes priority)
      if (!item.author || item.author.trim() === '') {
        return [{
          file: displayPath,
          field: 'author',
          rule: 'geo-missing-author',
          severity: 'warning',
          message: 'No author specified in frontmatter \u2014 weakens E-E-A-T signals',
          suggestion: 'Add an "author" field with a real person or brand name to the frontmatter.',
        }];
      }

      // Check 2: generic author name
      const normalizedAuthor = item.author.toLowerCase().trim();
      const isGeneric = genericNames.some(
        g => normalizedAuthor === g.toLowerCase()
      );

      if (isGeneric) {
        return [{
          file: displayPath,
          field: 'author',
          rule: 'geo-missing-author',
          severity: 'warning',
          message: `Author "${item.author}" appears to be a generic placeholder`,
          suggestion: 'Replace the generic author name with a real person or brand name to strengthen authoritativeness.',
        }];
      }

      return [];
    },
  };
}
// -- Rule 7: geo-heading-too-vague (factory) --
export function createGeoHeadingTooVagueRule(vagueHeadings: string[]): Rule {
  const lowerVague = vagueHeadings.map(v => v.toLowerCase());

  return {
    name: 'geo-heading-too-vague',
    severity: 'warning',
    category: 'geo',
    fixStrategy: 'Replace vague headings with specific, descriptive headings of 3+ words',
    run: (item: ContentItem, context: RuleContext): LintResult[] => {
      const geoTypes = context.geoEnabledContentTypes ?? ['blog'];
      if (!geoTypes.includes(item.contentType)) return [];

      const wordCount = countWords(item.body);
      if (wordCount < EEAT_MIN_WORDS) return [];

      const headings = extractHeadings(item.body);
      const subHeadings = headings.filter(h => h.level === 2 || h.level === 3);
      const results: LintResult[] = [];
      const displayPath = getDisplayPath(item);

      for (const heading of subHeadings) {
        const words = heading.text.trim().split(/\s+/);
        const isShort = words.length < HEADING_MIN_WORDS;
        const isSingleVague = words.length === 1
          && lowerVague.includes(words[0].toLowerCase());

        if (isShort || isSingleVague) {
          results.push({
            file: displayPath,
            field: 'body',
            rule: 'geo-heading-too-vague',
            severity: 'warning',
            message: `H${heading.level} "${heading.text}" is too vague (${words.length} word${words.length === 1 ? '' : 's'})`,
            suggestion: 'Use a specific, descriptive heading with 3+ words that tells the reader and AI systems what this section covers.',
            line: heading.line,
          });
        }
      }

      return results;
    },
  };
}
// -- Rule 10: geo-faq-quality (static) --
export const geoFaqQuality: Rule = {
  name: 'geo-faq-quality',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Improve FAQ section: add 3+ Q&A pairs, use question marks, keep answers 20-150 words',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    const geoTypes = context.geoEnabledContentTypes ?? ['blog'];
    if (!geoTypes.includes(item.contentType)) return [];

    const wordCount = countWords(item.body);
    if (wordCount < EEAT_LONG_MIN_WORDS) return [];

    if (!hasFAQSection(item.body)) return [];

    const { pairCount, questionsWithMark, answersInRange } = analyzeFaqQuality(item.body);
    const results: LintResult[] = [];
    const displayPath = getDisplayPath(item);

    if (pairCount < FAQ_MIN_PAIRS) {
      results.push({
        file: displayPath,
        field: 'body',
        rule: 'geo-faq-quality',
        severity: 'warning',
        message: `FAQ section has only ${pairCount} Q&A pair(s) \u2014 aim for at least ${FAQ_MIN_PAIRS}`,
        suggestion: 'Add more question-answer pairs to the FAQ section. AI systems favour comprehensive FAQ blocks with 3+ entries.',
      });
    }

    if (pairCount > 0 && questionsWithMark / pairCount < FAQ_QUESTION_MARK_RATIO) {
      results.push({
        file: displayPath,
        field: 'body',
        rule: 'geo-faq-quality',
        severity: 'warning',
        message: `Only ${questionsWithMark}/${pairCount} FAQ questions end with a question mark`,
        suggestion: 'End all FAQ questions with "?" so AI systems recognise them as interrogative queries.',
      });
    }

    if (pairCount > 0 && answersInRange / pairCount < FAQ_ANSWER_RANGE_RATIO) {
      results.push({
        file: displayPath,
        field: 'body',
        rule: 'geo-faq-quality',
        severity: 'warning',
        message: `Only ${answersInRange}/${pairCount} FAQ answers are in the optimal 20\u2013150 word range`,
        suggestion: 'Keep FAQ answers between 20 and 150 words \u2014 concise enough for extraction but detailed enough to be useful.',
      });
    }

    return results;
  },
};
// -- Rule 11: geo-definition-pattern (static) --
const DEFINITION_HEADING_EN = /^what\s+is\s+/i;
const DEFINITION_HEADING_DE = /^was\s+ist\s+/i;
const DEFINITION_VERBS_EN = ['is', 'are', 'refers to', 'means'];
const DEFINITION_VERBS_DE = ['ist', 'sind', 'bezeichnet', 'bedeutet'];

/** Extract subject from definition heading: "What is GEO?" -> "GEO" */
function extractDefinitionSubject(heading: string): string {
  return heading
    .replace(DEFINITION_HEADING_EN, '')
    .replace(DEFINITION_HEADING_DE, '')
    .replace(/[?!.]$/, '')
    .trim();
}

export const geoDefinitionPattern: Rule = {
  name: 'geo-definition-pattern',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Start definition sections with "[Subject] is/are..." for AI extraction',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    const geoTypes = context.geoEnabledContentTypes ?? ['blog'];
    if (!geoTypes.includes(item.contentType)) return [];

    const wordCount = countWords(item.body);
    if (wordCount < EEAT_MIN_WORDS) return [];

    const sections = extractH2Sections(item.body);
    const results: LintResult[] = [];
    const displayPath = getDisplayPath(item);

    for (const section of sections) {
      const isDefinition = DEFINITION_HEADING_EN.test(section.heading)
        || DEFINITION_HEADING_DE.test(section.heading);

      if (!isDefinition) continue;

      const subject = extractDefinitionSubject(section.heading);
      if (!subject) continue;

      // Get the first sentence of the section body
      const firstSentenceMatch = section.body.trim().match(/^([^.!?\n]+[.!?]?)/);
      if (!firstSentenceMatch) continue;

      const firstSentence = firstSentenceMatch[1].trim().toLowerCase();
      const subjectLower = subject.toLowerCase();
      const allVerbs = [...DEFINITION_VERBS_EN, ...DEFINITION_VERBS_DE];

      const followsPattern = allVerbs.some(verb =>
        firstSentence.startsWith(`${subjectLower} ${verb}`)
      );

      if (!followsPattern) {
        results.push({
          file: displayPath,
          field: 'body',
          rule: 'geo-definition-pattern',
          severity: 'warning',
          message: `Section "${section.heading}" does not start with a "${subject} is/are..." definition pattern`,
          suggestion: `Start the first sentence with "${subject} is ..." or "${subject} refers to ..." so AI systems can extract a clean definition.`,
          line: section.line,
        });
      }
    }

    return results;
  },
};
// -- Rule 12: geo-howto-steps (static) --
const HOWTO_HEADING = /^how\s+to\s+/i;
const HOWTO_HEADING_DE = /^wie\s+(man\s+)?/i;
const HOWTO_HEADING_DE_ALT = /^anleitung/i;
const MIN_HOWTO_STEPS = 3;

export const geoHowtoSteps: Rule = {
  name: 'geo-howto-steps',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add a numbered list with 3+ steps to how-to sections',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    const geoTypes = context.geoEnabledContentTypes ?? ['blog'];
    if (!geoTypes.includes(item.contentType)) return [];

    const wordCount = countWords(item.body);
    if (wordCount < EEAT_MIN_WORDS) return [];

    const sections = extractH2Sections(item.body);
    const results: LintResult[] = [];
    const displayPath = getDisplayPath(item);

    for (const section of sections) {
      const isHowTo = HOWTO_HEADING.test(section.heading)
        || HOWTO_HEADING_DE.test(section.heading)
        || HOWTO_HEADING_DE_ALT.test(section.heading);

      if (!isHowTo) continue;

      const numberedItems = section.body.match(/^\s*\d+\.\s+/gm);
      const stepCount = numberedItems ? numberedItems.length : 0;

      if (stepCount < MIN_HOWTO_STEPS) {
        results.push({
          file: displayPath,
          field: 'body',
          rule: 'geo-howto-steps',
          severity: 'warning',
          message: `How-to section "${section.heading}" has ${stepCount} numbered step(s) \u2014 need at least ${MIN_HOWTO_STEPS}`,
          suggestion: 'Add a numbered list (1. 2. 3. ...) with at least 3 steps. AI systems parse numbered lists as HowTo structured data.',
          line: section.line,
        });
      }
    }

    return results;
  },
};
// -- Rule 14: geo-missing-tldr (static) --
const TLDR_PATTERNS = [
  /tl;?dr/i,
  /key\s+takeaway/i,
  /zusammenfassung/i,
  /das\s+wichtigste/i,
  /in\s+short/i,
  /quick\s+answer/i,
  /^\s*>\s+\*\*/m,
];

export const geoMissingTldr: Rule = {
  name: 'geo-missing-tldr',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add a TL;DR, "Key Takeaway", or bold blockquote summary near the top of the article',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    const geoTypes = context.geoEnabledContentTypes ?? ['blog'];
    if (!geoTypes.includes(item.contentType)) return [];

    const wordCount = countWords(item.body);
    if (wordCount < EEAT_LONG_MIN_WORDS) return [];

    // Scan the first ~150 words of the body
    const words = item.body.split(/\s+/);
    const leadText = words.slice(0, TLDR_SCAN_WORDS).join(' ');

    const hasTldr = TLDR_PATTERNS.some(pattern => pattern.test(leadText));

    if (!hasTldr) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-missing-tldr',
        severity: 'warning',
        message: 'No TL;DR or key-takeaway summary found near the top of the article',
        suggestion: 'Add a "TL;DR", "Key Takeaway", or bold blockquote summary in the first 150 words. AI systems often extract the opening summary for featured answers.',
      }];
    }

    return [];
  },
};

/** Static E-E-A-T rules (no config dependency) */
export const geoEeatStaticRules: Rule[] = [
  geoMissingSourceCitations,
  geoMissingExpertQuotes,
  geoFaqQuality,
  geoDefinitionPattern,
  geoHowtoSteps,
  geoMissingTldr,
];

/** Build the complete E-E-A-T rule set from GEO config (6 static + 2 factory). */
export function createGeoEeatRules(geo: GeoConfig): Rule[] {
  return [
    ...geoEeatStaticRules,
    createGeoMissingAuthorRule(geo.genericAuthorNames ?? []),
    createGeoHeadingTooVagueRule(geo.vagueHeadings ?? []),
  ];
}
