/**
 * GEO Advanced Analyzer
 * Complex analysis utilities for LLM citation optimization rules
 */

import { countWords, stripMarkdown } from './word-counter.js';
import { extractHeadings } from './heading-extractor.js';

/** FAQ quality analysis result */
export interface FaqQualityResult {
  pairCount: number;
  questionsWithMark: number;
  answersInRange: number;
  answerWordCounts: number[];
}

/** Passive voice analysis result */
export interface PassiveVoiceResult {
  totalSentences: number;
  passiveSentences: number;
  passiveRatio: number;
}

/**
 * Common irregular past participles for passive voice detection
 */
const IRREGULAR_PAST_PARTICIPLES = new Set([
  'written', 'known', 'made', 'done', 'seen', 'taken', 'given',
  'found', 'built', 'shown', 'broken', 'chosen', 'driven', 'spoken',
  'stolen', 'worn', 'torn', 'frozen', 'hidden', 'forgotten', 'risen',
  'fallen', 'begun', 'run', 'come', 'become', 'grown', 'drawn',
  'thrown', 'blown', 'flown', 'sworn', 'shaken', 'mistaken', 'proven', 'woven',
]);

/**
 * Forms of "to be" used in passive voice constructions
 */
const BE_FORMS = new Set(['is', 'are', 'was', 'were', 'been', 'being', 'be']);

/**
 * Attribution markers that provide context for statistics
 */
const ATTRIBUTION_MARKERS = [
  'according to', 'study', 'survey', 'report', 'research',
  'source', 'data from', 'published',
];

/**
 * Pronouns/references that indicate unresolved section openings
 */
const UNRESOLVED_WORDS = new Set([
  'this', 'it', 'that', 'these', 'those', 'they', 'such', 'here', 'there',
]);

const UNRESOLVED_PHRASES = [
  'as mentioned', 'as noted', 'as discussed', 'previously',
];

/**
 * Standard HTML tags that should be flagged when found in markdown.
 */
const STANDARD_HTML_TAGS = new Set([
  'div', 'span', 'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
  'table', 'tr', 'td', 'th', 'thead', 'tbody', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'hr', 'blockquote', 'pre', 'code', 'section', 'article', 'nav', 'header',
  'footer', 'main', 'aside', 'figure', 'figcaption', 'details', 'summary',
]);

/**
 * Analyze FAQ section quality: count Q&A pairs, answer lengths, question formatting.
 *
 * @example
 * analyzeFaqQuality("## FAQ\n\n### What is SEO?\n\nSEO stands for...") // { pairCount: 1, ... }
 */
export function analyzeFaqQuality(body: string): FaqQualityResult {
  const result: FaqQualityResult = {
    pairCount: 0,
    questionsWithMark: 0,
    answersInRange: 0,
    answerWordCounts: [],
  };

  // Find FAQ section start
  const faqPattern = /^#{2,3}\s*(FAQ|H\u00e4ufige Fragen|Frequently Asked|Fragen und Antworten)/im;
  const faqMatch = body.match(faqPattern);
  if (!faqMatch || faqMatch.index === undefined) return result;

  // Get content after FAQ heading until next H2 or end
  const afterFaq = body.slice(faqMatch.index + faqMatch[0].length);
  const nextH2Match = afterFaq.match(/^##\s+(?!#)/m);
  const faqContent = nextH2Match && nextH2Match.index !== undefined
    ? afterFaq.slice(0, nextH2Match.index)
    : afterFaq;

  // Extract H3 headings as questions within the FAQ section
  const h3Pattern = /^###\s+(.+)$/gm;
  const h3Matches = [...faqContent.matchAll(h3Pattern)];

  for (let i = 0; i < h3Matches.length; i++) {
    const questionText = h3Matches[i][1].trim();
    result.pairCount++;

    if (questionText.endsWith('?')) {
      result.questionsWithMark++;
    }

    // Extract answer: content between this H3 and the next H3 (or end of FAQ)
    const answerStart = h3Matches[i].index! + h3Matches[i][0].length;
    const answerEnd = i + 1 < h3Matches.length ? h3Matches[i + 1].index! : faqContent.length;
    const answerText = faqContent.slice(answerStart, answerEnd).trim();
    const answerWords = countWords(answerText);
    result.answerWordCounts.push(answerWords);

    if (answerWords >= 30 && answerWords <= 75) {
      result.answersInRange++;
    }
  }

  return result;
}

/**
 * German passive voice auxiliary verbs (all conjugations of "werden")
 */
const GERMAN_PASSIVE_AUXILIARIES = new Set([
  'werde', 'wirst', 'wird', 'werden', 'werdet',
  'wurde', 'wurdest', 'wurden', 'wurdet',
  'worden', 'würde', 'würdest', 'würden', 'würdet',
]);

/**
 * German past participle regex patterns.
 * German participles typically follow: ge-...-t, ge-...-en, or -iert.
 * Separable prefixes (ab-, an-, auf-, etc.) insert "ge" after the prefix.
 * Inseparable prefixes (be-, ent-, er-, ver-, zer-, über-) have no "ge-".
 */
const GERMAN_PARTICIPLE_PATTERNS: RegExp[] = [
  /^ge\S+t$/i,                                           // gemacht, gesagt
  /^ge\S+en$/i,                                          // geschrieben, gefunden
  /^\S+iert$/i,                                           // organisiert, implementiert
  /^(ab|an|auf|aus|vor|wieder|zurück)ge\S+(t|en)$/i,    // aufgemacht, angenommen
  /^(be|ent|er|her|ver|zer|über)\S+([^s]t|en)$/i,       // bearbeitet, verstanden
];

/**
 * Detect passive voice sentences with locale support.
 * English: "be" form + past participle within 3 words.
 * German: "werden" conjugation + past participle within 5 words.
 *
 * @example
 * analyzePassiveVoice("The report was written by the team.") // passiveRatio: 1.0
 * analyzePassiveVoice("Der Bericht wurde geschrieben.", "de") // passiveRatio: 1.0
 */
export function analyzePassiveVoice(body: string, locale?: string): PassiveVoiceResult {
  const sentences = extractSentences(body);
  const lang = (locale ?? 'en').toLowerCase();
  let passiveCount = 0;

  for (const { text } of sentences) {
    if (lang === 'de' ? isGermanPassiveSentence(text) : isEnglishPassiveSentence(text)) {
      passiveCount++;
    }
  }

  const total = sentences.length;
  return {
    totalSentences: total,
    passiveSentences: passiveCount,
    passiveRatio: total > 0 ? passiveCount / total : 0,
  };
}

/**
 * Check if a single English sentence contains passive voice construction.
 * Heuristic: a form of "be" followed within 3 words by a past participle.
 */
function isEnglishPassiveSentence(sentence: string): boolean {
  const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  for (let i = 0; i < words.length; i++) {
    const cleaned = words[i].replace(/[^a-z]/g, '');
    if (!BE_FORMS.has(cleaned)) continue;

    // Check next 3 words for a past participle
    const searchEnd = Math.min(i + 4, words.length);
    for (let j = i + 1; j < searchEnd; j++) {
      const candidate = words[j].replace(/[^a-z]/g, '');
      if (candidate.endsWith('ed') || IRREGULAR_PAST_PARTICIPLES.has(candidate)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a single German sentence contains passive voice construction.
 * Heuristic: a "werden" conjugation followed within 5 words by a past participle.
 * German word order is more flexible than English, so the window is wider.
 */
function isGermanPassiveSentence(sentence: string): boolean {
  const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  for (let i = 0; i < words.length; i++) {
    const cleaned = words[i].replace(/[^a-zäöüß]/g, '');
    if (!GERMAN_PASSIVE_AUXILIARIES.has(cleaned)) continue;

    // Check next 5 words for a German past participle
    const searchEnd = Math.min(i + 6, words.length);
    for (let j = i + 1; j < searchEnd; j++) {
      const candidate = words[j].replace(/[^a-zäöüß]/g, '');
      if (candidate.length < 3) continue;
      if (GERMAN_PARTICIPLE_PATTERNS.some(p => p.test(candidate))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extract sentences with word counts from stripped markdown.
 *
 * @example
 * extractSentences("Hello world. How are you?")
 * // [{ text: "Hello world", wordCount: 2 }, { text: "How are you", wordCount: 3 }]
 */
export function extractSentences(body: string): Array<{ text: string; wordCount: number }> {
  const stripped = stripMarkdown(body);
  const rawSentences = stripped.split(/(?<=[.!?])\s+/);
  const sentences: Array<{ text: string; wordCount: number }> = [];

  for (const raw of rawSentences) {
    const text = raw.trim().replace(/[.!?]+$/, '').trim();
    if (!text) continue;
    const wordCount = text.split(/\s+/).filter(w => w.length > 0 && /\w/.test(w)).length;
    if (wordCount > 0) {
      sentences.push({ text, wordCount });
    }
  }

  return sentences;
}

/**
 * Find year references in body that are stale (>18 months from currentDate).
 *
 * @example
 * findStaleYearReferences("In 2020, things changed.", new Date('2025-06-01'))
 * // [{ year: 2020, line: 1, isStale: true }]
 */
export function findStaleYearReferences(
  body: string,
  currentDate: Date,
): Array<{ year: number; line: number; isStale: boolean }> {
  const lines = body.split('\n');
  const yearPattern = /\b((?:19|20)\d{2})\b/g;
  const results: Array<{ year: number; line: number; isStale: boolean }> = [];

  const cutoffDate = new Date(currentDate);
  cutoffDate.setMonth(cutoffDate.getMonth() - 18);

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    let match: RegExpExecArray | null;
    yearPattern.lastIndex = 0;

    while ((match = yearPattern.exec(line)) !== null) {
      const year = parseInt(match[1], 10);
      const yearEnd = new Date(year, 11, 31);
      const isStale = yearEnd < cutoffDate;
      results.push({ year, line: i + 1, isStale });
    }
  }

  return results;
}

/**
 * Detect sections opening with unresolved pronouns or back-references.
 * Flags sections whose first word is a pronoun like "this", "it", "that", etc.
 *
 * @example
 * detectUnresolvedOpenings([{ heading: "Benefits", body: "This is important..." }])
 * // [{ heading: "Benefits", firstWord: "this" }]
 */
export function detectUnresolvedOpenings(
  sections: Array<{ heading: string; body: string }>,
): Array<{ heading: string; firstWord: string }> {
  const flagged: Array<{ heading: string; firstWord: string }> = [];

  for (const section of sections) {
    const bodyTrimmed = section.body.trim();
    if (!bodyTrimmed) continue;

    const firstLine = bodyTrimmed.split('\n').find(l => l.trim().length > 0);
    if (!firstLine) continue;

    const lineText = firstLine.trim().toLowerCase();

    // Check phrase matches first
    const matchedPhrase = UNRESOLVED_PHRASES.find(p => lineText.startsWith(p));
    if (matchedPhrase) {
      flagged.push({ heading: section.heading, firstWord: matchedPhrase });
      continue;
    }

    // Check single-word pronouns
    const firstWord = lineText.split(/\s+/)[0]?.replace(/[^a-z]/g, '') ?? '';
    if (UNRESOLVED_WORDS.has(firstWord)) {
      flagged.push({ heading: section.heading, firstWord });
    }
  }

  return flagged;
}

/**
 * Find acronyms not expanded on first use (not in allowlist).
 * Searches for uppercase sequences (2+ chars) and checks if the body
 * contains a parenthetical expansion pattern like "Full Name (ACRONYM)".
 *
 * @example
 * findUnexpandedAcronyms("Use GEO to improve visibility.", ["URL", "HTML"])
 * // [{ acronym: "GEO", line: 1 }]
 */
export function findUnexpandedAcronyms(
  body: string,
  allowlist: string[],
): Array<{ acronym: string; line: number }> {
  const allowSet = new Set(allowlist);
  const lines = body.split('\n');
  const acronymPattern = /\b([A-Z]{2,})\b/g;
  const found = new Map<string, number>();
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    let match: RegExpExecArray | null;
    acronymPattern.lastIndex = 0;

    while ((match = acronymPattern.exec(line)) !== null) {
      const acronym = match[1];
      if (allowSet.has(acronym)) continue;
      if (!found.has(acronym)) {
        found.set(acronym, i + 1);
      }
    }
  }

  const results: Array<{ acronym: string; line: number }> = [];

  for (const [acronym, line] of found) {
    const expansionPattern = new RegExp(`\\(${acronym}\\)`, 'i');
    if (!expansionPattern.test(body)) {
      results.push({ acronym, line });
    }
  }

  return results;
}

/**
 * Find statistics/numbers without source context.
 * Checks for percentages and multipliers that lack nearby attribution.
 *
 * @example
 * findContextlessStatistics("Revenue grew 45% last year.")
 * // [{ statistic: "45%", line: 1 }]
 */
export function findContextlessStatistics(
  body: string,
): Array<{ statistic: string; line: number }> {
  const lines = body.split('\n');
  const results: Array<{ statistic: string; line: number }> = [];
  const statPatterns = [/\d+%/g, /\d+x\b/gi];
  const yearPattern = /\b(?:19|20)\d{2}\b/;
  const linkPattern = /\[[^\]]+\]\([^)]+\)/;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    for (const pattern of statPatterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(line)) !== null) {
        const position = match.index;
        const contextStart = Math.max(0, position - 100);
        const contextEnd = Math.min(line.length, position + match[0].length + 100);
        const surrounding = line.slice(contextStart, contextEnd).toLowerCase();

        const hasAttribution = ATTRIBUTION_MARKERS.some(m => surrounding.includes(m));
        const hasYear = yearPattern.test(surrounding);
        const hasLink = linkPattern.test(line.slice(contextStart, contextEnd));

        if (!hasAttribution && !hasYear && !hasLink) {
          results.push({ statistic: match[0], line: i + 1 });
        }
      }
    }
  }

  return results;
}

/**
 * Count structural elements in markdown: tables, lists, blockquotes, code blocks.
 * Returns total count of distinct structural element types found.
 *
 * @example
 * countStructuralElements("- item\n\n| col |\n|---|\n\n> quote") // 3
 */
export function countStructuralElements(body: string): number {
  const lines = body.split('\n');
  let hasTable = false;
  let hasUnorderedList = false;
  let hasOrderedList = false;
  let hasBlockquote = false;
  let hasCodeBlock = false;
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      hasCodeBlock = true;
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (/\|\s*:?-{2,}/.test(trimmed)) hasTable = true;
    if (/^[-*]\s+/.test(trimmed)) hasUnorderedList = true;
    if (/^\d+\.\s+/.test(trimmed)) hasOrderedList = true;
    if (trimmed.startsWith('>')) hasBlockquote = true;
  }

  let count = 0;
  if (hasTable) count++;
  if (hasUnorderedList) count++;
  if (hasOrderedList) count++;
  if (hasBlockquote) count++;
  if (hasCodeBlock) count++;

  return count;
}

/**
 * Find raw HTML tags in markdown (excluding allowed MDX component tags).
 * MDX components are PascalCase; standard HTML tags (div, span, etc.) are flagged.
 *
 * @example
 * findInlineHtml("<div>text</div>", ["CustomComponent"])
 * // [{ tag: "div", line: 1 }]
 */
export function findInlineHtml(
  body: string,
  allowedTags: string[],
): Array<{ tag: string; line: number }> {
  const allowedSet = new Set(allowedTags);
  const lines = body.split('\n');
  const results: Array<{ tag: string; line: number }> = [];
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    let match: RegExpExecArray | null;
    tagPattern.lastIndex = 0;

    while ((match = tagPattern.exec(line)) !== null) {
      const tagName = match[1];

      // Skip allowed tags (case-sensitive for MDX components)
      if (allowedSet.has(tagName)) continue;

      // Flag standard HTML tags (lowercase)
      if (STANDARD_HTML_TAGS.has(tagName.toLowerCase()) && tagName === tagName.toLowerCase()) {
        results.push({ tag: tagName, line: i + 1 });
      }
    }
  }

  return results;
}

/**
 * Analyze heading density -- find gaps > 300 words without a heading.
 * Returns gaps where the word count between consecutive headings exceeds 300.
 *
 * @example
 * analyzeHeadingDensity("## Intro\n\n" + "word ".repeat(350) + "\n\n## Next")
 * // { gaps: [{ afterHeading: "Intro", wordCount: 350, line: 1 }] }
 */
export function analyzeHeadingDensity(
  body: string,
): { gaps: Array<{ afterHeading: string; wordCount: number; line: number }> } {
  const headings = extractHeadings(body);
  const lines = body.split('\n');
  const gaps: Array<{ afterHeading: string; wordCount: number; line: number }> = [];

  if (headings.length === 0) {
    const totalWords = countWords(body);
    if (totalWords > 300) {
      gaps.push({ afterHeading: '(start)', wordCount: totalWords, line: 1 });
    }
    return { gaps };
  }

  // Check content before first heading
  const beforeFirst = lines.slice(0, headings[0].line - 1).join('\n');
  const beforeWords = countWords(beforeFirst);
  if (beforeWords > 300) {
    gaps.push({ afterHeading: '(start)', wordCount: beforeWords, line: 1 });
  }

  // Check content between each heading pair
  for (let i = 0; i < headings.length; i++) {
    const currentLine = headings[i].line; // 1-indexed
    const nextLine = i + 1 < headings.length ? headings[i + 1].line : lines.length + 1;

    const sectionLines = lines.slice(currentLine, nextLine - 1);
    const sectionText = sectionLines.join('\n');
    const wordCount = countWords(sectionText);

    if (wordCount > 300) {
      gaps.push({
        afterHeading: headings[i].text,
        wordCount,
        line: headings[i].line,
      });
    }
  }

  return { gaps };
}
