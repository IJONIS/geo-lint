/**
 * Content Quality Analyzer Unit Tests
 * Tests for jargon detection, repetition analysis, sentence length,
 * substance ratio, FAQ quality, and citation quality.
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeJargonDensity,
  analyzeRepetition,
  analyzeSentenceLength,
  analyzeSubstance,
  analyzeFaqQuality,
  analyzeCitationQuality,
} from '../../../src/utils/content-quality-analyzer.js';

// ─── analyzeJargonDensity ──────────────────────────────────────────────────

describe('analyzeJargonDensity', () => {
  it('returns 0 density for clean content', () => {
    const body = 'This guide shows you how to set up a blog with clear steps and good results for your team.';
    const result = analyzeJargonDensity(body);
    expect(result.density).toBe(0);
    expect(result.jargonCount).toBe(0);
  });

  it('detects high jargon density', () => {
    const body = Array(20).fill(
      'The comprehensive methodology paradigm systematization operationalization interdisciplinary multifaceted transformational reconceptualize heterogeneous normal words here today.',
    ).join(' ');
    const result = analyzeJargonDensity(body);
    expect(result.density).toBeGreaterThan(0.1);
    expect(result.jargonCount).toBeGreaterThan(0);
    expect(result.topJargonWords.length).toBeGreaterThan(0);
  });

  it('returns top jargon words sorted by count', () => {
    const body = 'methodology methodology methodology paradigm paradigm comprehensive normal words here.';
    const result = analyzeJargonDensity(body);
    expect(result.topJargonWords[0].word).toBe('methodology');
    expect(result.topJargonWords[0].count).toBe(3);
  });
});

// ─── analyzeRepetition ─────────────────────────────────────────────────────

describe('analyzeRepetition', () => {
  it('returns low similarity for diverse content', () => {
    const body = [
      'First paragraph about cooking techniques and kitchen equipment for home chefs.',
      '',
      'Second paragraph covering travel destinations in Southeast Asia during monsoon season.',
      '',
      'Third paragraph discussing software architecture patterns for microservices deployment.',
    ].join('\n');
    const result = analyzeRepetition(body);
    expect(result.avgParagraphSimilarity).toBeLessThan(0.1);
  });

  it('detects high paragraph similarity', () => {
    const body = [
      'The organizational infrastructure methodology paradigm represents comprehensive systematization of enterprise environments.',
      '',
      'The organizational infrastructure methodology paradigm encompasses comprehensive systematization of enterprise architectures.',
      '',
      'The organizational infrastructure methodology paradigm facilitates comprehensive systematization of enterprise frameworks.',
    ].join('\n');
    const result = analyzeRepetition(body);
    expect(result.avgParagraphSimilarity).toBeGreaterThan(0.1);
  });

  it('detects repeated phrases', () => {
    const phrase = 'comprehensive methodological systematization of organizational infrastructure';
    const body = Array(5).fill(`The ${phrase} is important. We discuss ${phrase} here.`).join('\n\n');
    const result = analyzeRepetition(body);
    expect(result.repeatedPhraseCount).toBeGreaterThan(0);
  });
});

// ─── analyzeSentenceLength ─────────────────────────────────────────────────

describe('analyzeSentenceLength', () => {
  it('reports normal sentence lengths', () => {
    const body = 'This is a short sentence. Here is another one. And a third for good measure.';
    const result = analyzeSentenceLength(body);
    expect(result.avgWordsPerSentence).toBeLessThan(15);
    expect(result.sentencesOver60Words).toBe(0);
  });

  it('detects extremely long sentences', () => {
    const longSentence = Array(80).fill('word').join(' ') + '.';
    const body = `${longSentence} ${longSentence}`;
    const result = analyzeSentenceLength(body);
    expect(result.avgWordsPerSentence).toBeGreaterThan(50);
    expect(result.sentencesOver60Words).toBe(2);
  });

  it('handles empty content', () => {
    const result = analyzeSentenceLength('');
    expect(result.totalSentences).toBe(0);
    expect(result.avgWordsPerSentence).toBe(0);
  });
});

// ─── analyzeSubstance ──────────────────────────────────────────────────────

describe('analyzeSubstance', () => {
  it('reports high diversity for varied content', () => {
    const body = 'Cooking requires fresh ingredients like tomatoes, basil, and garlic. Photography demands patience, proper lighting, and understanding of composition. Programming involves algorithms, data structures, and debugging techniques.';
    const result = analyzeSubstance(body);
    expect(result.typeTokenRatio).toBeGreaterThan(0.4);
  });

  it('reports low diversity for repetitive content', () => {
    const body = Array(50).fill(
      'organizational infrastructure methodology paradigm systematization comprehensive transformational operationalization',
    ).join(' ');
    const result = analyzeSubstance(body);
    expect(result.typeTokenRatio).toBeLessThan(0.1);
  });
});

// ─── analyzeFaqQuality ─────────────────────────────────────────────────────

describe('analyzeFaqQuality', () => {
  it('returns hasSection=false when no FAQ heading', () => {
    const body = '## Introduction\n\nSome content here.';
    const result = analyzeFaqQuality(body);
    expect(result.hasSection).toBe(false);
  });

  it('detects FAQ section with sufficient Q&As', () => {
    const body = [
      '## FAQ',
      '',
      '### What is this?',
      'This is a comprehensive explanation of the product and its features for new users who want to understand every detail of what this tool provides and how it helps them.',
      '',
      '### How does it work?',
      'It works by processing your content through a series of validation rules and checks that cover SEO best practices, GEO optimization techniques, and overall content quality standards.',
      '',
      '### Why should I use it?',
      'You should use it because it helps improve your content quality and search visibility across traditional search engines and AI-powered generative search platforms like ChatGPT and Perplexity.',
    ].join('\n');
    const result = analyzeFaqQuality(body);
    expect(result.hasSection).toBe(true);
    expect(result.questionCount).toBe(3);
    expect(result.shortAnswers).toBe(0);
  });

  it('flags short FAQ answers', () => {
    const body = [
      '## FAQ',
      '',
      '### What is this?',
      'A tool.',
      '',
      '### How does it work?',
      'It validates content.',
    ].join('\n');
    const result = analyzeFaqQuality(body);
    expect(result.hasSection).toBe(true);
    expect(result.shortAnswers).toBe(2);
  });
});

// ─── analyzeCitationQuality ────────────────────────────────────────────────

describe('analyzeCitationQuality', () => {
  it('finds attributed statistics', () => {
    const body = 'According to a study by Harvard, 73% of companies use AI. Data from Gartner shows $4.2 billion in spending.';
    const result = analyzeCitationQuality(body);
    expect(result.totalStats).toBeGreaterThan(0);
    expect(result.attributedStats).toBeGreaterThan(0);
  });

  it('flags unattributed statistics', () => {
    const body = 'Companies saw 45% improvement. The market grew 3x faster. Revenue reached $500 million.';
    const result = analyzeCitationQuality(body);
    expect(result.totalStats).toBeGreaterThan(0);
    expect(result.unattributedStats).toBe(result.totalStats);
  });

  it('returns zeros for content without statistics', () => {
    const body = 'This is a simple paragraph with no numbers or statistics at all.';
    const result = analyzeCitationQuality(body);
    expect(result.totalStats).toBe(0);
  });
});
