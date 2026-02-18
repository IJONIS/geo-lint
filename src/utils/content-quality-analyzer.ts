/**
 * Content Quality Analyzer
 * Detects jargon stuffing, content repetition, extreme sentence length,
 * and low substance (type-token ratio) in content.
 */

import { stripMarkdown, countWords } from './word-counter.js';
import { analyzeWordComplexity } from './word-complexity.js';

// ─── Jargon / Word Complexity Detection ─────────────────────────────────────

export interface JargonAnalysis {
  jargonCount: number;
  totalWords: number;
  density: number;
  topJargonWords: Array<{ word: string; count: number }>;
}

/**
 * Analyze jargon density in content body using dynamic word complexity heuristics.
 * Delegates to analyzeWordComplexity which uses syllable count, word length,
 * and frequency lists instead of a hardcoded word list.
 *
 * @param body - Content body (Markdown/MDX)
 * @param locale - BCP-47 locale code (e.g. 'en', 'de'). Defaults to 'en'.
 */
export function analyzeJargonDensity(body: string, locale: string = 'en'): JargonAnalysis {
  const result = analyzeWordComplexity(body, locale);

  return {
    jargonCount: result.complexCount,
    totalWords: result.totalWords,
    density: result.density,
    topJargonWords: result.topComplexWords,
  };
}

// ─── Content Repetition Detection ──────────────────────────────────────────

export interface RepetitionAnalysis {
  repeatedPhraseCount: number;
  maxPhraseOccurrences: number;
  topRepeatedPhrases: Array<{ phrase: string; count: number }>;
  avgParagraphSimilarity: number;
}

/** Extract n-grams from a word array. */
function extractNgrams(words: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/** Calculate Jaccard similarity between two sets. */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/** Analyze content for repetitive phrases and paragraph similarity. */
export function analyzeRepetition(body: string): RepetitionAnalysis {
  const plain = stripMarkdown(body).toLowerCase();
  const words = plain
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Find repeated 5-grams across the entire text
  const fiveGrams = extractNgrams(words, 5);
  const phraseCounts = new Map<string, number>();

  for (const gram of fiveGrams) {
    phraseCounts.set(gram, (phraseCounts.get(gram) ?? 0) + 1);
  }

  // Filter to phrases that appear 3+ times
  const repeatedPhrases = [...phraseCounts.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);

  const topRepeatedPhrases = repeatedPhrases
    .slice(0, 5)
    .map(([phrase, count]) => ({ phrase, count }));

  // Calculate pairwise paragraph similarity using 3-gram overlap
  const paragraphs = body
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('#') && !p.startsWith('|'));

  let totalSimilarity = 0;
  let pairCount = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const wordsI = stripMarkdown(paragraphs[i]).toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
    const ngramsI = new Set(extractNgrams(wordsI, 3));

    for (let j = i + 1; j < paragraphs.length; j++) {
      const wordsJ = stripMarkdown(paragraphs[j]).toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);
      const ngramsJ = new Set(extractNgrams(wordsJ, 3));

      totalSimilarity += jaccardSimilarity(ngramsI, ngramsJ);
      pairCount++;
    }
  }

  return {
    repeatedPhraseCount: repeatedPhrases.length,
    maxPhraseOccurrences: repeatedPhrases.length > 0 ? repeatedPhrases[0][1] : 0,
    topRepeatedPhrases,
    avgParagraphSimilarity: pairCount > 0 ? totalSimilarity / pairCount : 0,
  };
}

// ─── Sentence Length Analysis ──────────────────────────────────────────────

export interface SentenceLengthAnalysis {
  avgWordsPerSentence: number;
  maxWordsPerSentence: number;
  sentencesOver60Words: number;
  totalSentences: number;
}

/** Analyze sentence lengths in content. */
export function analyzeSentenceLength(body: string): SentenceLengthAnalysis {
  const plain = stripMarkdown(body);

  // Split into sentences on .!? followed by whitespace or end of string
  const sentences = plain
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length === 0) {
    return { avgWordsPerSentence: 0, maxWordsPerSentence: 0, sentencesOver60Words: 0, totalSentences: 0 };
  }

  let totalWordCount = 0;
  let maxWords = 0;
  let over60 = 0;

  for (const sentence of sentences) {
    const wordCount = sentence.split(/\s+/).filter(w => w.length > 0).length;
    totalWordCount += wordCount;
    if (wordCount > maxWords) maxWords = wordCount;
    if (wordCount > 60) over60++;
  }

  return {
    avgWordsPerSentence: totalWordCount / sentences.length,
    maxWordsPerSentence: maxWords,
    sentencesOver60Words: over60,
    totalSentences: sentences.length,
  };
}

// ─── Substance Ratio (Type-Token Ratio) ────────────────────────────────────

/** Common English stop words to exclude from substance analysis. */
const SUBSTANCE_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'not', 'no', 'as', 'if', 'so', 'than',
  'also', 'very', 'just', 'about', 'up', 'out', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own',
  'same', 'into', 'over', 'after', 'before', 'between', 'through',
  'during', 'above', 'below', 'which', 'who', 'whom', 'what', 'when',
  'where', 'why', 'how', 'they', 'them', 'their', 'we', 'us', 'our',
  'you', 'your', 'he', 'him', 'his', 'she', 'her',
  // German
  'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'in',
  'auf', 'an', 'mit', 'von', 'zu', 'für', 'ist', 'sind', 'den', 'dem',
  'des', 'nicht', 'sich', 'auch', 'als', 'noch', 'wie', 'bei', 'aus',
  'nach', 'über', 'vor', 'nur', 'noch', 'man', 'bis', 'zum', 'zur',
]);

export interface SubstanceAnalysis {
  uniqueContentWords: number;
  totalContentWords: number;
  typeTokenRatio: number;
}

/** Analyze substance ratio: how many unique meaningful words vs total. */
export function analyzeSubstance(body: string): SubstanceAnalysis {
  const plain = stripMarkdown(body).toLowerCase();
  const words = plain
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !SUBSTANCE_STOPWORDS.has(w));

  const uniqueWords = new Set(words);

  return {
    uniqueContentWords: uniqueWords.size,
    totalContentWords: words.length,
    typeTokenRatio: words.length > 0 ? uniqueWords.size / words.length : 0,
  };
}

// ─── FAQ Quality Analysis ──────────────────────────────────────────────────

export interface FaqQualityAnalysis {
  hasSection: boolean;
  questionCount: number;
  avgAnswerWordCount: number;
  shortAnswers: number;
}

/** Analyze FAQ section quality: number of Q&As and answer lengths. */
export function analyzeFaqQuality(body: string): FaqQualityAnalysis {
  const faqPattern = /#{2,3}\s*(FAQ|Häufige Fragen|Frequently Asked|Fragen und Antworten)/i;
  const faqMatch = body.match(faqPattern);

  if (!faqMatch) {
    return { hasSection: false, questionCount: 0, avgAnswerWordCount: 0, shortAnswers: 0 };
  }

  // Extract everything after the FAQ heading
  const faqStart = body.indexOf(faqMatch[0]);
  const faqContent = body.slice(faqStart + faqMatch[0].length);

  // Find Q&A pairs: sub-headings (###) followed by answer text
  const qaPairs = faqContent.split(/#{3}\s+/).filter(s => s.trim().length > 0);

  let totalAnswerWords = 0;
  let shortAnswers = 0;

  for (const pair of qaPairs) {
    // First line is the question, rest is the answer
    const lines = pair.split('\n').filter(l => l.trim().length > 0);
    const answerText = lines.slice(1).join(' ');
    const wordCount = countWords(answerText);
    totalAnswerWords += wordCount;

    if (wordCount < 20) {
      shortAnswers++;
    }
  }

  return {
    hasSection: true,
    questionCount: qaPairs.length,
    avgAnswerWordCount: qaPairs.length > 0 ? totalAnswerWords / qaPairs.length : 0,
    shortAnswers,
  };
}

// ─── Citation Quality Analysis ─────────────────────────────────────────────

export interface CitationQualityAnalysis {
  totalStats: number;
  attributedStats: number;
  unattributedStats: number;
}

/** Check whether statistics have source attribution. */
export function analyzeCitationQuality(body: string): CitationQualityAnalysis {
  const lines = body.split('\n');

  // Stat patterns: percentages, multipliers, currency, large numbers
  const statPatterns = [
    /\d+\s*%/g,
    /\d+(?:\.\d+)?\s*(?:x|mal|times)/gi,
    /(?:€|\$|USD|EUR)\s*\d+/g,
    /\d+(?:\.\d+)?\s*(?:million|billion|mrd|mio)/gi,
  ];

  // Attribution patterns that should appear near statistics
  const attributionPatterns = [
    /according to\b/i,
    /(?:a |the )?study (?:by|from)\b/i,
    /research (?:by|from)\b/i,
    /data from\b/i,
    /report(?:ed)? by\b/i,
    /source:\s/i,
    /\[[^\]]+\]\(https?:\/\/[^)]+\)/,  // markdown link
    /\[\^[^\]]+\]/,  // footnote
  ];

  let totalStats = 0;
  let attributedStats = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let hasStatOnLine = false;

    for (const pattern of statPatterns) {
      const matches = line.matchAll(pattern);
      for (const _ of matches) {
        if (!hasStatOnLine) {
          hasStatOnLine = true;
          totalStats++;

          // Check the surrounding context (3 lines before and after) for attribution
          const contextStart = Math.max(0, i - 3);
          const contextEnd = Math.min(lines.length - 1, i + 3);
          const context = lines.slice(contextStart, contextEnd + 1).join(' ');

          const hasAttribution = attributionPatterns.some(p => p.test(context));
          if (hasAttribution) {
            attributedStats++;
          }
        }
      }
    }
  }

  return {
    totalStats,
    attributedStats,
    unattributedStats: totalStats - attributedStats,
  };
}
