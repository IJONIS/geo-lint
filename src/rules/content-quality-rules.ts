/**
 * Content Quality Rules
 * Detects jargon stuffing, content repetition, extreme sentence lengths,
 * and low substance (type-token ratio).
 */

import type { Rule, ContentItem, LintResult, RuleContext } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';
import { countWords } from '../utils/word-counter.js';
import {
  analyzeJargonDensity,
  analyzeRepetition,
  analyzeSentenceLength,
  analyzeSubstance,
} from '../utils/content-quality-analyzer.js';

/** Minimum word count before quality rules apply */
const QUALITY_MIN_WORDS = 300;

/** Jargon density thresholds */
const JARGON_WARNING_THRESHOLD = 0.08;
const JARGON_ERROR_THRESHOLD = 0.15;

/** Repetition thresholds */
const REPETITION_SIMILARITY_WARNING = 0.15;
const REPETITION_SIMILARITY_ERROR = 0.25;
const REPEATED_PHRASE_MIN_COUNT = 5;

/** Sentence length thresholds */
const SENTENCE_AVG_WARNING = 35;
const SENTENCE_AVG_ERROR = 50;

/** Substance (type-token ratio) thresholds — lower = less diverse vocabulary */
const SUBSTANCE_WARNING_THRESHOLD = 0.25;
const SUBSTANCE_ERROR_THRESHOLD = 0.15;

// ─── Jargon Density Rule ───────────────────────────────────────────────────

export const jargonDensity: Rule = {
  name: 'content-jargon-density',
  severity: 'warning',
  category: 'content',
  fixStrategy: 'Replace complex or uncommon words with simpler alternatives',
  run: (item: ContentItem): LintResult[] => {
    const wordCount = countWords(item.body);
    if (wordCount < QUALITY_MIN_WORDS) return [];

    const locale = item.locale ?? 'en';
    const analysis = analyzeJargonDensity(item.body, locale);

    if (analysis.density >= JARGON_ERROR_THRESHOLD) {
      const topWords = analysis.topJargonWords
        .slice(0, 3)
        .map(w => `"${w.word}" (${w.count}x)`)
        .join(', ');

      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-jargon-density',
        severity: 'error',
        message: `Extreme complex word density: ${Math.round(analysis.density * 100)}% of words are complex/uncommon (${analysis.jargonCount}/${analysis.totalWords})`,
        suggestion: `Replace complex words with simpler alternatives. Worst offenders: ${topWords}.`,
      }];
    }

    if (analysis.density >= JARGON_WARNING_THRESHOLD) {
      const topWords = analysis.topJargonWords
        .slice(0, 3)
        .map(w => `"${w.word}" (${w.count}x)`)
        .join(', ');

      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-jargon-density',
        severity: 'warning',
        message: `High complex word density: ${Math.round(analysis.density * 100)}% of words are complex/uncommon (${analysis.jargonCount}/${analysis.totalWords})`,
        suggestion: `Reduce complex vocabulary for clearer communication. Top complex words: ${topWords}.`,
      }];
    }

    return [];
  },
};

// ─── Content Repetition Rule ───────────────────────────────────────────────

export const contentRepetition: Rule = {
  name: 'content-repetition',
  severity: 'warning',
  category: 'content',
  fixStrategy: 'Remove or rewrite paragraphs that repeat the same ideas',
  run: (item: ContentItem): LintResult[] => {
    const wordCount = countWords(item.body);
    if (wordCount < QUALITY_MIN_WORDS) return [];

    const analysis = analyzeRepetition(item.body);
    const results: LintResult[] = [];

    // Check paragraph similarity
    if (analysis.avgParagraphSimilarity >= REPETITION_SIMILARITY_ERROR) {
      results.push({
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-repetition',
        severity: 'error',
        message: `Extreme content repetition: ${Math.round(analysis.avgParagraphSimilarity * 100)}% average paragraph similarity`,
        suggestion: 'Paragraphs are rehashing the same ideas. Remove duplicate content and add unique information to each section.',
      });
    } else if (analysis.avgParagraphSimilarity >= REPETITION_SIMILARITY_WARNING) {
      results.push({
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-repetition',
        severity: 'warning',
        message: `High content repetition: ${Math.round(analysis.avgParagraphSimilarity * 100)}% average paragraph similarity`,
        suggestion: 'Several paragraphs cover the same ground. Consolidate repeated ideas and add distinct value to each section.',
      });
    }

    // Check repeated phrases
    if (analysis.repeatedPhraseCount >= REPEATED_PHRASE_MIN_COUNT) {
      const topPhrase = analysis.topRepeatedPhrases[0];
      results.push({
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-repetition',
        severity: 'warning',
        message: `${analysis.repeatedPhraseCount} phrases repeated 3+ times. Most repeated: "${topPhrase.phrase}" (${topPhrase.count}x)`,
        suggestion: 'Vary your language to avoid repetitive phrasing. Use synonyms or restructure sentences.',
      });
    }

    return results;
  },
};

// ─── Sentence Length Extreme Rule ──────────────────────────────────────────

export const sentenceLengthExtreme: Rule = {
  name: 'content-sentence-length-extreme',
  severity: 'warning',
  category: 'content',
  fixStrategy: 'Break long sentences into shorter ones (aim for 15-25 words per sentence)',
  run: (item: ContentItem): LintResult[] => {
    const wordCount = countWords(item.body);
    if (wordCount < QUALITY_MIN_WORDS) return [];

    const analysis = analyzeSentenceLength(item.body);

    if (analysis.totalSentences === 0) return [];

    if (analysis.avgWordsPerSentence >= SENTENCE_AVG_ERROR) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-sentence-length-extreme',
        severity: 'error',
        message: `Extreme average sentence length: ${Math.round(analysis.avgWordsPerSentence)} words/sentence (longest: ${analysis.maxWordsPerSentence} words, ${analysis.sentencesOver60Words} sentences over 60 words)`,
        suggestion: 'Break sentences into digestible chunks. Aim for 15-25 words per sentence. Readers and AI models struggle with extremely long sentences.',
      }];
    }

    if (analysis.avgWordsPerSentence >= SENTENCE_AVG_WARNING) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-sentence-length-extreme',
        severity: 'warning',
        message: `High average sentence length: ${Math.round(analysis.avgWordsPerSentence)} words/sentence (longest: ${analysis.maxWordsPerSentence} words)`,
        suggestion: 'Consider splitting longer sentences. Good readability requires sentences of 15-25 words on average.',
      }];
    }

    return [];
  },
};

// ─── Substance Ratio Rule ──────────────────────────────────────────────────

export const substanceRatio: Rule = {
  name: 'content-substance-ratio',
  severity: 'warning',
  category: 'content',
  fixStrategy: 'Add specific, concrete information instead of repeating abstract concepts',
  run: (item: ContentItem): LintResult[] => {
    const wordCount = countWords(item.body);
    if (wordCount < QUALITY_MIN_WORDS) return [];

    const analysis = analyzeSubstance(item.body);

    if (analysis.totalContentWords < 50) return [];

    if (analysis.typeTokenRatio <= SUBSTANCE_ERROR_THRESHOLD) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-substance-ratio',
        severity: 'error',
        message: `Extremely low vocabulary diversity: ${Math.round(analysis.typeTokenRatio * 100)}% unique words (${analysis.uniqueContentWords} unique out of ${analysis.totalContentWords} content words)`,
        suggestion: 'The same words are recycled extensively. Add concrete examples, specific data, and varied terminology.',
      }];
    }

    if (analysis.typeTokenRatio <= SUBSTANCE_WARNING_THRESHOLD) {
      return [{
        file: getDisplayPath(item),
        field: 'body',
        rule: 'content-substance-ratio',
        severity: 'warning',
        message: `Low vocabulary diversity: ${Math.round(analysis.typeTokenRatio * 100)}% unique words (${analysis.uniqueContentWords} unique out of ${analysis.totalContentWords} content words)`,
        suggestion: 'Increase vocabulary variety. Use specific terms, examples, and data points instead of repeating the same abstract concepts.',
      }];
    }

    return [];
  },
};

/** All content quality rules */
export const contentQualityRules: Rule[] = [
  jargonDensity,
  contentRepetition,
  sentenceLengthExtreme,
  substanceRatio,
];
