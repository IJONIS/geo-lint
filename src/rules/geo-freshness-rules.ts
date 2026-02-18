/**
 * GEO Freshness & Quality Rules
 * Validates content freshness signals, readability, and technical quality
 */

import type { Rule, ContentItem, LintResult } from '../types.js';
import type { GeoConfig } from '../config/types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { countWords } from '../utils/word-counter.js';
import { extractH2Sections, countInternalLinks, hasMarkdownTable } from '../utils/geo-analyzer.js';
import {
  findStaleYearReferences,
  analyzePassiveVoice,
  extractSentences,
  findInlineHtml,
} from '../utils/geo-advanced-analyzer.js';

/** Minimum word count before most freshness rules apply */
const FRESHNESS_MIN_WORDS = 500;

/** Maximum stale-year violations to report (avoids noise) */
const MAX_STALE_YEAR_VIOLATIONS = 5;

/** Content older than this many months triggers outdated warning */
const OUTDATED_MONTHS_THRESHOLD = 6;

/** Passive voice ratio above this triggers a warning */
const PASSIVE_VOICE_THRESHOLD = 0.15;

/** Sentences longer than this word count are flagged */
const MAX_SENTENCE_WORDS = 40;

/** Maximum long-sentence violations to report */
const MAX_LONG_SENTENCE_VIOLATIONS = 3;

/** Minimum internal links expected in a blog post */
const MIN_INTERNAL_LINKS = 2;

/** Maximum inline-HTML violations to report */
const MAX_INLINE_HTML_VIOLATIONS = 5;

/** Comparison heading patterns (English and German) */
const COMPARISON_PATTERNS: RegExp[] = [
  /\bvs\.?\b/i,
  /\bversus\b/i,
  /\bcomparison\b/i,
  /\bcompared?\s+to\b/i,
  /\bdifference\s+between\b/i,
  /\bvergleich\b/i,
  /\bunterschied\b/i,
];

// ---------------------------------------------------------------------------
// Rule 8: geo-stale-date-references
// ---------------------------------------------------------------------------

/**
 * Rule: Flag year references that are more than 18 months old.
 * Stale dates cause AI systems to deprioritize content in answers.
 */
export const geoStaleDateReferences: Rule = {
  name: 'geo-stale-date-references',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Update or remove year references older than 18 months; replace with current data',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < FRESHNESS_MIN_WORDS) return [];

    const allRefs = findStaleYearReferences(item.body, new Date());
    const staleRefs = allRefs.filter(ref => ref.isStale);
    if (staleRefs.length === 0) return [];

    const displayPath = getDisplayPath(item);

    return staleRefs.slice(0, MAX_STALE_YEAR_VIOLATIONS).map(ref => ({
      file: displayPath,
      field: 'body',
      rule: 'geo-stale-date-references',
      severity: 'warning' as const,
      message: `Year reference "${ref.year}" is more than 18 months old — AI systems deprioritize stale content`,
      suggestion: `Update or remove the "${ref.year}" reference. Replace with current data or add a note that the information has been verified.`,
      line: ref.line,
    }));
  },
};

// ---------------------------------------------------------------------------
// Rule 9: geo-outdated-content
// ---------------------------------------------------------------------------

/**
 * Rule: Warn when content has not been updated in over 6 months.
 * Uses updatedAt or date frontmatter fields.
 */
export const geoOutdatedContent: Rule = {
  name: 'geo-outdated-content',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Review and update content, then set updatedAt to today',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const rawDate = item.updatedAt ?? item.date;
    if (!rawDate) return [];

    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) return [];

    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - OUTDATED_MONTHS_THRESHOLD);

    if (parsedDate < cutoff) {
      const field = item.updatedAt ? 'updatedAt' : 'date';
      const monthsAgo = Math.floor(
        (now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      return [{
        file: getDisplayPath(item),
        field,
        rule: 'geo-outdated-content',
        severity: 'warning',
        message: `Content was last updated ${monthsAgo} months ago — AI systems favor recently updated content`,
        suggestion: 'Review the content for accuracy, update any stale information, and set the updatedAt field to today.',
      }];
    }

    return [];
  },
};

// ---------------------------------------------------------------------------
// Rule 15: geo-passive-voice-excess
// ---------------------------------------------------------------------------

/**
 * Rule: Flag content with excessive passive voice usage.
 * Passive voice reduces clarity and makes content harder for AI to extract.
 */
export const geoPassiveVoiceExcess: Rule = {
  name: 'geo-passive-voice-excess',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Rewrite passive sentences in active voice for clearer AI extraction',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < FRESHNESS_MIN_WORDS) return [];

    const { passiveSentences, totalSentences, passiveRatio } = analyzePassiveVoice(item.body);

    if (passiveRatio > PASSIVE_VOICE_THRESHOLD) {
      const percentage = Math.round(passiveRatio * 100);

      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-passive-voice-excess',
        severity: 'warning',
        message: `${percentage}% of sentences (${passiveSentences}/${totalSentences}) use passive voice — aim for under ${Math.round(PASSIVE_VOICE_THRESHOLD * 100)}%`,
        suggestion: 'Rewrite passive constructions in active voice. For example, "The report was written by the team" becomes "The team wrote the report."',
      }];
    }

    return [];
  },
};

// ---------------------------------------------------------------------------
// Rule 16: geo-sentence-too-long
// ---------------------------------------------------------------------------

/**
 * Rule: Flag sentences exceeding 40 words.
 * Long sentences reduce readability and hinder AI snippet extraction.
 */
export const geoSentenceTooLong: Rule = {
  name: 'geo-sentence-too-long',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Break long sentences into two or more shorter, focused sentences',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < FRESHNESS_MIN_WORDS) return [];

    const sentences = extractSentences(item.body);
    const longSentences = sentences
      .filter(entry => entry.wordCount > MAX_SENTENCE_WORDS)
      .sort((a, b) => b.wordCount - a.wordCount);

    if (longSentences.length === 0) return [];

    const displayPath = getDisplayPath(item);

    return longSentences.slice(0, MAX_LONG_SENTENCE_VIOLATIONS).map(entry => {
      const preview = entry.text.split(/\s+/).slice(0, 10).join(' ');

      return {
        file: displayPath,
        field: 'body',
        rule: 'geo-sentence-too-long',
        severity: 'warning' as const,
        message: `Sentence is ${entry.wordCount} words (max ${MAX_SENTENCE_WORDS}): "${preview}..."`,
        suggestion: 'Break this sentence into two or more shorter sentences for better readability and AI extraction.',
      };
    });
  },
};

// ---------------------------------------------------------------------------
// Rule 17: geo-low-internal-links
// ---------------------------------------------------------------------------

/**
 * Rule: Blog posts should contain at least 2 internal links.
 * Internal links strengthen topical authority signals for AI systems.
 */
export const geoLowInternalLinks: Rule = {
  name: 'geo-low-internal-links',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add 2-3 internal links to related content on the same site',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < FRESHNESS_MIN_WORDS) return [];

    const linkCount = countInternalLinks(item.body);

    if (linkCount < MIN_INTERNAL_LINKS) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'geo-low-internal-links',
        severity: 'warning',
        message: `Found ${linkCount} internal link${linkCount === 1 ? '' : 's'} — aim for at least ${MIN_INTERNAL_LINKS}`,
        suggestion: 'Add 2-3 internal links to related blog posts or pages. Internal links strengthen topical authority signals for AI search systems.',
      }];
    }

    return [];
  },
};

// ---------------------------------------------------------------------------
// Rule 20: geo-comparison-table
// ---------------------------------------------------------------------------

/**
 * Rule: Comparison headings (containing "vs", "versus", "comparison", etc.)
 * should include a markdown table in their section body.
 * Tables in comparison sections are highly extractable by AI systems.
 */
export const geoComparisonTable: Rule = {
  name: 'geo-comparison-table',
  severity: 'warning',
  category: 'geo',
  fixStrategy: 'Add a comparison table under each heading that discusses comparisons',
  run: (item: ContentItem): LintResult[] => {
    if (item.contentType !== 'blog') return [];

    const wordCount = countWords(item.body);
    if (wordCount < FRESHNESS_MIN_WORDS) return [];

    const sections = extractH2Sections(item.body);
    const results: LintResult[] = [];
    const displayPath = getDisplayPath(item);

    for (const section of sections) {
      const isComparison = COMPARISON_PATTERNS.some(pattern =>
        pattern.test(section.heading)
      );

      if (isComparison && !hasMarkdownTable(section.body)) {
        results.push({
          file: displayPath,
          field: 'body',
          rule: 'geo-comparison-table',
          severity: 'warning',
          message: `Comparison heading "${section.heading}" has no data table — tables increase AI citation rates for comparisons`,
          suggestion: 'Add a markdown comparison table (e.g., feature matrix or pros/cons) under this heading.',
          line: section.line,
        });
      }
    }

    return results;
  },
};

// ---------------------------------------------------------------------------
// Rule 21: geo-inline-html (factory)
// ---------------------------------------------------------------------------

/**
 * Factory: Create the inline HTML detection rule with project-specific allowed tags.
 * Applies to ALL content types (not just blog).
 */
export function createGeoInlineHtmlRule(allowedTags: string[]): Rule {
  return {
    name: 'geo-inline-html',
    severity: 'warning',
    category: 'geo',
    fixStrategy: 'Replace inline HTML with markdown equivalents or add the tag to allowedHtmlTags config',
    run: (item: ContentItem): LintResult[] => {
      const tags = findInlineHtml(item.body, allowedTags);
      if (tags.length === 0) return [];

      const displayPath = getDisplayPath(item);

      return tags.slice(0, MAX_INLINE_HTML_VIOLATIONS).map(tag => ({
        file: displayPath,
        field: 'body',
        rule: 'geo-inline-html',
        severity: 'warning' as const,
        message: `Inline HTML tag <${tag.tag}> found — raw HTML reduces content portability across AI systems`,
        suggestion: `Replace <${tag.tag}> with a markdown equivalent, or add "${tag.tag}" to the allowedHtmlTags config if this is a custom MDX component.`,
        line: tag.line,
      }));
    },
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Static GEO freshness rules (no config dependency) */
export const geoFreshnessStaticRules: Rule[] = [
  geoStaleDateReferences,
  geoOutdatedContent,
  geoPassiveVoiceExcess,
  geoSentenceTooLong,
  geoLowInternalLinks,
  geoComparisonTable,
];

/**
 * Factory: Build the complete GEO freshness rule set from config.
 * Returns all 7 rules: 6 static + 1 inline-html from factory.
 */
export function createGeoFreshnessRules(geo: GeoConfig): Rule[] {
  return [
    ...geoFreshnessStaticRules,
    createGeoInlineHtmlRule(geo.allowedHtmlTags ?? []),
  ];
}
