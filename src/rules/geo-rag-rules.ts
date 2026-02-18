/**
 * GEO RAG Optimization Rules
 * Validates content patterns that improve retrieval and citation in RAG systems
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import type { GeoConfig } from '../config/types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { countWords } from '../utils/word-counter.js';
import { extractH2Sections } from '../utils/geo-analyzer.js';
import { extractHeadings } from '../utils/heading-extractor.js';
import {
  detectUnresolvedOpenings,
  findUnexpandedAcronyms,
  findContextlessStatistics,
} from '../utils/geo-advanced-analyzer.js';

/** Minimum word count before standard RAG rules apply */
const RAG_MIN_WORDS = 500;

/** Minimum word count before extraction trigger rule applies */
const EXTRACTION_TRIGGER_MIN_WORDS = 1000;

/** Minimum word count before summary section rule applies */
const SUMMARY_MIN_WORDS = 2000;

/** Minimum extraction triggers expected */
const MIN_EXTRACTION_TRIGGERS = 2;

/** Maximum section self-containment violations to report */
const MAX_SELF_CONTAINMENT_VIOLATIONS = 3;

/** Maximum acronym violations to report */
const MAX_ACRONYM_VIOLATIONS = 5;

/** Maximum contextless statistic violations to report */
const MAX_STATISTIC_VIOLATIONS = 5;

/** Number of leading words to inspect for vague openings */
const VAGUE_OPENING_WORD_LIMIT = 150;

/** Summary/takeaway heading patterns (English and German) */
const SUMMARY_HEADING_PATTERNS: RegExp[] = [
  /tl;?dr/i,
  /summary/i,
  /key\s*takeaway/i,
  /conclusion/i,
  /zusammenfassung/i,
  /fazit/i,
  /kernpunkte/i,
];

// ---------------------------------------------------------------------------
// Rule 19: geo-extraction-triggers (factory)
// ---------------------------------------------------------------------------

/**
 * Factory: Create the extraction triggers rule with project-specific trigger phrases.
 * Checks that long-form content contains phrases that help AI systems identify
 * key takeaways and extractable statements.
 */
export function createGeoExtractionTriggersRule(triggers: string[]): Rule {
  return {
    name: 'geo-extraction-triggers',
    severity: 'warning',
    category: 'geo',
    fixStrategy: 'Add summary phrases like "In summary", "Key takeaway", or "The main benefit is" to help AI extraction',
    run: (item: ContentItem): LintResult[] => {
      if (item.contentType !== 'blog') return [];

      const wordCount = countWords(item.body);
      if (wordCount < EXTRACTION_TRIGGER_MIN_WORDS) return [];

      if (triggers.length === 0) return [];

      const bodyLower = item.body.toLowerCase();
      let foundCount = 0;

      for (const trigger of triggers) {
        if (bodyLower.includes(trigger.toLowerCase())) {
          foundCount++;
        }
      }

      if (foundCount < MIN_EXTRACTION_TRIGGERS) {
        return [{
          file: getDisplayPath(item),
          field: 'body',
          rule: 'geo-extraction-triggers',
          severity: 'warning',
          message: `Found ${foundCount} extraction trigger${foundCount === 1 ? '' : 's'} — recommend at least ${MIN_EXTRACTION_TRIGGERS} for AI discoverability`,
          suggestion: `Add summary phrases such as "${triggers.slice(0, 3).join('", "')}" to help AI systems identify and extract key statements.`,
        }];
      }

      return [];
    },
  };
}

// ---------------------------------------------------------------------------
// Rule 23: geo-section-self-containment
// ---------------------------------------------------------------------------

/**
 * Rule: H2 sections should not open with unresolved pronouns.
 * RAG systems chunk content at section boundaries; each chunk must stand alone.
 */
export const geoSectionSelfContainment: Rule = {
  name: 'geo-section-self-containment',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Start each section with a specific subject instead of a pronoun like "This" or "It"',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < RAG_MIN_WORDS) return [];

    const sections = extractH2Sections(item.body);
    const unresolved = detectUnresolvedOpenings(sections);

    if (unresolved.length === 0) return [];

    const displayPath = getDisplayPath(item);

    return unresolved.slice(0, MAX_SELF_CONTAINMENT_VIOLATIONS).map(opening => ({
      file: displayPath,
      field: 'body',
      rule: 'geo-section-self-containment',
      severity: 'warning' as const,
      message: `Section "${opening.heading}" opens with an unresolved reference: "${opening.firstWord}"`,
      suggestion: 'Start the section with a specific subject instead of a pronoun. RAG systems chunk at headings, so each section must be self-contained.',
    }));
  },
};

// ---------------------------------------------------------------------------
// Rule 24: geo-vague-opening (factory)
// ---------------------------------------------------------------------------

/**
 * Factory: Create the vague opening detection rule with project-specific filler phrases.
 * Flags articles that start with generic filler rather than substantive content.
 */
export function createGeoVagueOpeningRule(fillerPhrases: string[]): Rule {
  return {
    name: 'geo-vague-opening',
    severity: 'warning',
    category: 'geo',
    fixStrategy: 'Replace the generic opening with a specific, substantive first sentence',
    run: (item: ContentItem): LintResult[] => {
      if (item.contentType !== 'blog') return [];

      const wordCount = countWords(item.body);
      if (wordCount < RAG_MIN_WORDS) return [];

      if (fillerPhrases.length === 0) return [];

      // Extract the first paragraph or first 150 words
      const lines = item.body.split('\n');
      const contentLines: string[] = [];
      let totalWords = 0;

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines at the start
        if (contentLines.length === 0 && !trimmed) continue;

        // Skip headings, imports, and JSX
        if (/^#{1,6}\s+/.test(trimmed)) continue;
        if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) continue;
        if (trimmed.startsWith('<') && !trimmed.startsWith('<a')) continue;

        // Stop at first blank line after content started, or word limit
        if (contentLines.length > 0 && !trimmed) break;

        contentLines.push(trimmed);
        totalWords += trimmed.split(/\s+/).length;
        if (totalWords >= VAGUE_OPENING_WORD_LIMIT) break;
      }

      const openingText = contentLines.join(' ').toLowerCase();
      if (!openingText) return [];

      for (const phrase of fillerPhrases) {
        if (openingText.startsWith(phrase.toLowerCase())) {
          return [{
            file: getDisplayPath(item),
            field: 'body',
            rule: 'geo-vague-opening',
            severity: 'warning',
            message: `Article opens with filler phrase "${phrase}" — AI systems deprioritize generic introductions`,
            suggestion: 'Replace the opening with a specific, substantive first sentence that directly addresses the topic.',
          }];
        }
      }

      return [];
    },
  };
}

// ---------------------------------------------------------------------------
// Rule 25: geo-acronym-expansion (factory)
// ---------------------------------------------------------------------------

/**
 * Factory: Create the acronym expansion rule with project-specific allowlist.
 * Flags acronyms that are never expanded on first use, reducing AI comprehension.
 */
export function createGeoAcronymExpansionRule(allowlist: string[]): Rule {
  return {
    name: 'geo-acronym-expansion',
    severity: 'warning',
    category: 'geo',
    fixStrategy: 'Expand each acronym on first use, e.g. "Search Engine Optimization (SEO)"',
    run: (item: ContentItem): LintResult[] => {
      if (item.contentType !== 'blog') return [];

      const wordCount = countWords(item.body);
      if (wordCount < RAG_MIN_WORDS) return [];

      const unexpanded = findUnexpandedAcronyms(item.body, allowlist);
      if (unexpanded.length === 0) return [];

      const displayPath = getDisplayPath(item);

      return unexpanded.slice(0, MAX_ACRONYM_VIOLATIONS).map(entry => ({
        file: displayPath,
        field: 'body',
        rule: 'geo-acronym-expansion',
        severity: 'warning' as const,
        message: `Acronym "${entry.acronym}" is used but never expanded — AI systems may misinterpret unexpanded acronyms`,
        suggestion: `Expand "${entry.acronym}" on first use, e.g. "Full Name (${entry.acronym})".`,
        line: entry.line,
      }));
    },
  };
}

// ---------------------------------------------------------------------------
// Rule 26: geo-statistic-without-context
// ---------------------------------------------------------------------------

/**
 * Rule: Statistics (percentages) should include source attribution or timeframe.
 * Contextless numbers reduce trust signals for AI citation.
 */
export const geoStatisticWithoutContext: Rule = {
  name: 'geo-statistic-without-context',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add source attribution or timeframe context to each statistic',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < RAG_MIN_WORDS) return [];

    const contextless = findContextlessStatistics(item.body);
    if (contextless.length === 0) return [];

    const displayPath = getDisplayPath(item);

    return contextless.slice(0, MAX_STATISTIC_VIOLATIONS).map(stat => ({
      file: displayPath,
      field: 'body',
      rule: 'geo-statistic-without-context',
      severity: 'warning' as const,
      message: `Statistic "${stat.statistic}" lacks source attribution — unattributed data reduces AI citation confidence`,
      suggestion: 'Add source or timeframe context to the statistic, e.g. "according to [Source]" or "as of 2024".',
      line: stat.line,
    }));
  },
};

// ---------------------------------------------------------------------------
// Rule 27: geo-missing-summary-section
// ---------------------------------------------------------------------------

/**
 * Rule: Long-form content (2000+ words) should include a summary or takeaway section.
 * Summary sections are frequently extracted by AI as answer snippets.
 */
export const geoMissingSummarySection: Rule = {
  name: 'geo-missing-summary-section',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add a "## TL;DR", "## Key Takeaways", or "## Conclusion" section',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < SUMMARY_MIN_WORDS) return [];

    const headings = extractHeadings(item.body);

    const hasSummaryHeading = headings.some(heading =>
      SUMMARY_HEADING_PATTERNS.some(pattern => pattern.test(heading.text))
    );

    if (!hasSummaryHeading) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-missing-summary-section',
        severity: 'warning',
        message: `Long-form content (${wordCount} words) has no summary or takeaway section — AI systems frequently extract these for answers`,
        suggestion: 'Add a "## TL;DR", "## Key Takeaways", "## Fazit", or "## Conclusion" section summarizing the main points.',
      }];
    }

    return [];
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Static GEO RAG rules (no config dependency) */
export const geoRagStaticRules: Rule[] = [
  geoSectionSelfContainment,
  geoStatisticWithoutContext,
  geoMissingSummarySection,
];

/**
 * Factory: Build the complete GEO RAG rule set from config.
 * Returns all 6 rules: 3 static + 3 from factories.
 */
export function createGeoRagRules(geo: GeoConfig): Rule[] {
  return [
    ...geoRagStaticRules,
    createGeoExtractionTriggersRule(geo.extractionTriggers ?? []),
    createGeoVagueOpeningRule(geo.fillerPhrases ?? []),
    createGeoAcronymExpansionRule(geo.acronymAllowlist ?? []),
  ];
}
