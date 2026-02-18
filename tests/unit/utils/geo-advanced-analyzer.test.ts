/**
 * GEO Advanced Analyzer Unit Tests
 * Tests for complex analysis utilities used by LLM citation optimization rules
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeFaqQuality,
  analyzePassiveVoice,
  extractSentences,
  findStaleYearReferences,
  detectUnresolvedOpenings,
  findUnexpandedAcronyms,
  findContextlessStatistics,
  countStructuralElements,
  findInlineHtml,
  analyzeHeadingDensity,
} from '../../../src/utils/geo-advanced-analyzer.js';

// ---------------------------------------------------------------------------
// analyzeFaqQuality
// ---------------------------------------------------------------------------
describe('analyzeFaqQuality', () => {
  it('returns zero counts when no FAQ section', () => {
    const result = analyzeFaqQuality('## Regular Section\n\nSome content here.');
    expect(result.pairCount).toBe(0);
    expect(result.questionsWithMark).toBe(0);
    expect(result.answersInRange).toBe(0);
    expect(result.answerWordCounts).toHaveLength(0);
  });

  it('counts Q&A pairs under FAQ heading', () => {
    const body = [
      '## FAQ',
      '',
      '### What is SEO?',
      '',
      'SEO stands for search engine optimization. It is the practice of improving website visibility in search results through various techniques and strategies.',
      '',
      '### How does it work?',
      '',
      'It works by optimizing content structure, keywords, and technical elements to match what search engines look for when ranking pages.',
      '',
      '### Why is it important?',
      '',
      'SEO is important because most online experiences begin with a search engine and organic search drives significant traffic to websites.',
    ].join('\n');

    const result = analyzeFaqQuality(body);
    expect(result.pairCount).toBe(3);
    expect(result.questionsWithMark).toBe(3);
  });

  it('detects questions without question marks', () => {
    const body = '## FAQ\n\n### What is SEO\n\nSEO is optimization. It helps websites rank better in search results and attract more organic traffic from search engines.';
    const result = analyzeFaqQuality(body);
    expect(result.pairCount).toBe(1);
    expect(result.questionsWithMark).toBe(0);
  });

  it('tracks answer word counts and in-range answers', () => {
    // Answer between 30-75 words should be in range
    const longAnswer = Array(50).fill('word').join(' ');
    const body = `## FAQ\n\n### What is SEO?\n\n${longAnswer}`;
    const result = analyzeFaqQuality(body);
    expect(result.answerWordCounts.length).toBe(1);
    expect(result.answersInRange).toBe(1);
  });

  it('marks answers outside 30-75 word range as not in range', () => {
    const shortAnswer = 'Very short answer.';
    const body = `## FAQ\n\n### What is SEO?\n\n${shortAnswer}`;
    const result = analyzeFaqQuality(body);
    expect(result.answerWordCounts.length).toBe(1);
    expect(result.answersInRange).toBe(0);
  });

  it('recognizes alternative FAQ heading formats', () => {
    const body = [
      '## Frequently Asked Questions',
      '',
      '### Is this recognized?',
      '',
      Array(40).fill('word').join(' '),
    ].join('\n');
    const result = analyzeFaqQuality(body);
    expect(result.pairCount).toBe(1);
  });

  it('stops FAQ section at next H2', () => {
    const body = [
      '## FAQ',
      '',
      '### What is SEO?',
      '',
      Array(40).fill('word').join(' '),
      '',
      '## Conclusion',
      '',
      '### This is not a FAQ question?',
      '',
      'This should not be counted as an FAQ pair.',
    ].join('\n');
    const result = analyzeFaqQuality(body);
    expect(result.pairCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// analyzePassiveVoice
// ---------------------------------------------------------------------------
describe('analyzePassiveVoice', () => {
  it('detects passive voice with irregular past participle', () => {
    const result = analyzePassiveVoice('The report was written by the team.');
    expect(result.passiveSentences).toBeGreaterThanOrEqual(1);
    expect(result.passiveRatio).toBeGreaterThan(0);
  });

  it('does not flag active voice sentences', () => {
    const result = analyzePassiveVoice('The team wrote the report.');
    expect(result.passiveSentences).toBe(0);
    expect(result.passiveRatio).toBe(0);
  });

  it('handles empty content', () => {
    const result = analyzePassiveVoice('');
    expect(result.totalSentences).toBe(0);
    expect(result.passiveSentences).toBe(0);
    expect(result.passiveRatio).toBe(0);
  });

  it('handles content with no sentences', () => {
    const result = analyzePassiveVoice('# Just a heading');
    expect(result.passiveRatio).toBe(0);
  });

  it('detects passive voice with regular -ed participle', () => {
    const result = analyzePassiveVoice('The car was repaired by the mechanic.');
    expect(result.passiveSentences).toBeGreaterThanOrEqual(1);
  });

  it('calculates correct ratio with mixed sentences', () => {
    const body = 'The report was written by the team. The team then reviewed the results.';
    const result = analyzePassiveVoice(body);
    expect(result.totalSentences).toBe(2);
    expect(result.passiveSentences).toBe(1);
    expect(result.passiveRatio).toBeCloseTo(0.5, 1);
  });
});

// ---------------------------------------------------------------------------
// extractSentences
// ---------------------------------------------------------------------------
describe('extractSentences', () => {
  it('splits text into sentences', () => {
    const sentences = extractSentences('Hello world. How are you?');
    expect(sentences.length).toBe(2);
  });

  it('counts words per sentence', () => {
    const sentences = extractSentences('Hello world. How are you today?');
    expect(sentences[0].wordCount).toBe(2);
    expect(sentences[1].wordCount).toBe(4);
  });

  it('handles markdown stripping', () => {
    const sentences = extractSentences('**Bold text** is here. And [a link](http://example.com) too.');
    expect(sentences.length).toBe(2);
    // Markdown syntax should be stripped from the text
    expect(sentences[0].text).not.toContain('**');
  });

  it('returns empty array for empty input', () => {
    const sentences = extractSentences('');
    expect(sentences).toHaveLength(0);
  });

  it('handles single sentence without trailing punctuation', () => {
    const sentences = extractSentences('Just a single sentence.');
    expect(sentences.length).toBe(1);
    expect(sentences[0].wordCount).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// findStaleYearReferences
// ---------------------------------------------------------------------------
describe('findStaleYearReferences', () => {
  const currentDate = new Date('2026-02-18');

  it('flags years more than 18 months old', () => {
    const results = findStaleYearReferences('In 2020, things changed.', currentDate);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const entry = results.find(r => r.year === 2020);
    expect(entry).toBeDefined();
    expect(entry!.isStale).toBe(true);
  });

  it('does not flag recent years', () => {
    const results = findStaleYearReferences('In 2025, we launched. In 2026, we grew.', currentDate);
    const stale = results.filter(r => r.isStale);
    expect(stale).toHaveLength(0);
  });

  it('skips years inside code blocks', () => {
    const body = [
      'Some text.',
      '```',
      'const year = 2019;',
      '```',
      'More text.',
    ].join('\n');
    const results = findStaleYearReferences(body, currentDate);
    expect(results.find(r => r.year === 2019)).toBeUndefined();
  });

  it('reports correct line numbers', () => {
    const body = 'Line one.\nIn 2020, things happened.\nLine three.';
    const results = findStaleYearReferences(body, currentDate);
    const entry = results.find(r => r.year === 2020);
    expect(entry).toBeDefined();
    expect(entry!.line).toBe(2);
  });

  it('handles multiple years on the same line', () => {
    const body = 'Between 2019 and 2020, much changed.';
    const results = findStaleYearReferences(body, currentDate);
    expect(results.length).toBe(2);
    expect(results.every(r => r.isStale)).toBe(true);
  });

  it('returns empty for content with no year references', () => {
    const results = findStaleYearReferences('No years mentioned here.', currentDate);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// detectUnresolvedOpenings
// ---------------------------------------------------------------------------
describe('detectUnresolvedOpenings', () => {
  it('flags sections starting with "This"', () => {
    const sections = [
      { heading: 'Benefits', body: 'This is an important consideration for all teams.' },
    ];
    const results = detectUnresolvedOpenings(sections);
    expect(results).toHaveLength(1);
    expect(results[0].heading).toBe('Benefits');
    expect(results[0].firstWord).toBe('this');
  });

  it('flags sections starting with "It"', () => {
    const sections = [
      { heading: 'Overview', body: 'It provides a comprehensive solution for the problem.' },
    ];
    const results = detectUnresolvedOpenings(sections);
    expect(results).toHaveLength(1);
    expect(results[0].firstWord).toBe('it');
  });

  it('flags sections starting with "These"', () => {
    const sections = [
      { heading: 'Tools', body: 'These are the best tools available on the market today.' },
    ];
    const results = detectUnresolvedOpenings(sections);
    expect(results).toHaveLength(1);
    expect(results[0].firstWord).toBe('these');
  });

  it('flags sections starting with "As mentioned"', () => {
    const sections = [
      { heading: 'Details', body: 'As mentioned earlier, this approach works well in practice.' },
    ];
    const results = detectUnresolvedOpenings(sections);
    expect(results).toHaveLength(1);
    expect(results[0].firstWord).toBe('as mentioned');
  });

  it('does not flag sections starting with proper nouns or subjects', () => {
    const sections = [
      { heading: 'Architecture', body: 'React provides a component-based architecture for building UIs.' },
      { heading: 'Performance', body: 'Caching reduces database load and speeds up response times.' },
    ];
    const results = detectUnresolvedOpenings(sections);
    expect(results).toHaveLength(0);
  });

  it('skips sections with empty body', () => {
    const sections = [
      { heading: 'Empty', body: '' },
      { heading: 'Whitespace', body: '   ' },
    ];
    const results = detectUnresolvedOpenings(sections);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// findUnexpandedAcronyms
// ---------------------------------------------------------------------------
describe('findUnexpandedAcronyms', () => {
  it('flags acronyms not expanded on first use', () => {
    const results = findUnexpandedAcronyms('Use GEO to improve visibility.', []);
    expect(results.length).toBe(1);
    expect(results[0].acronym).toBe('GEO');
    expect(results[0].line).toBe(1);
  });

  it('skips allowlisted acronyms', () => {
    const results = findUnexpandedAcronyms('Use HTML and CSS for styling.', ['HTML', 'CSS']);
    expect(results).toHaveLength(0);
  });

  it('skips acronyms in code blocks', () => {
    const body = [
      'Some text.',
      '```',
      'const API_KEY = "abc";',
      '```',
      'More text.',
    ].join('\n');
    const results = findUnexpandedAcronyms(body, []);
    // API should not be flagged because it appears inside a code block
    // KEY is also inside the code block
    expect(results.find(r => r.acronym === 'API')).toBeUndefined();
  });

  it('does not flag when expansion pattern exists', () => {
    const body = 'Generative Engine Optimization (GEO) is a new approach. Use GEO in your content.';
    const results = findUnexpandedAcronyms(body, []);
    expect(results.find(r => r.acronym === 'GEO')).toBeUndefined();
  });

  it('reports first occurrence line number', () => {
    const body = 'Line one.\nSEO is important.\nSEO again here.';
    const results = findUnexpandedAcronyms(body, []);
    const seo = results.find(r => r.acronym === 'SEO');
    expect(seo).toBeDefined();
    expect(seo!.line).toBe(2);
  });

  it('handles multiple unexpanded acronyms', () => {
    const body = 'Use GEO and SEO together for best results with your CMS platform.';
    const results = findUnexpandedAcronyms(body, []);
    const acronyms = results.map(r => r.acronym);
    expect(acronyms).toContain('GEO');
    expect(acronyms).toContain('SEO');
    expect(acronyms).toContain('CMS');
  });
});

// ---------------------------------------------------------------------------
// findContextlessStatistics
// ---------------------------------------------------------------------------
describe('findContextlessStatistics', () => {
  it('flags percentages without attribution', () => {
    const results = findContextlessStatistics('Revenue grew 45% last year.');
    expect(results.length).toBe(1);
    expect(results[0].statistic).toBe('45%');
    expect(results[0].line).toBe(1);
  });

  it('does not flag when attribution marker is present', () => {
    const results = findContextlessStatistics('According to a study, 45% of users prefer this approach.');
    expect(results).toHaveLength(0);
  });

  it('does not flag when a link is nearby', () => {
    const results = findContextlessStatistics('Traffic increased 30% [source](http://example.com).');
    expect(results).toHaveLength(0);
  });

  it('flags multiplier patterns without context', () => {
    const results = findContextlessStatistics('Performance improved 3x over the baseline.');
    expect(results.length).toBe(1);
    expect(results[0].statistic).toBe('3x');
  });

  it('does not flag statistics near a year reference', () => {
    const results = findContextlessStatistics('In 2025, revenue grew 45% across the board.');
    expect(results).toHaveLength(0);
  });

  it('skips statistics inside code blocks', () => {
    const body = [
      '```',
      'const growth = 50%;',
      '```',
    ].join('\n');
    const results = findContextlessStatistics(body);
    expect(results).toHaveLength(0);
  });

  it('returns empty for content with no statistics', () => {
    const results = findContextlessStatistics('This is plain text without any numbers.');
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// countStructuralElements
// ---------------------------------------------------------------------------
describe('countStructuralElements', () => {
  it('counts distinct structural element types', () => {
    const body = [
      '- item one',
      '- item two',
      '',
      '| col |',
      '|---|',
      '| val |',
      '',
      '> a blockquote',
    ].join('\n');
    const count = countStructuralElements(body);
    // Unordered list + table + blockquote = 3
    expect(count).toBe(3);
  });

  it('counts code blocks as a structural element', () => {
    const body = [
      '```js',
      'const x = 1;',
      '```',
    ].join('\n');
    const count = countStructuralElements(body);
    expect(count).toBe(1);
  });

  it('counts ordered lists separately from unordered', () => {
    const body = [
      '- unordered item',
      '',
      '1. ordered item',
    ].join('\n');
    const count = countStructuralElements(body);
    expect(count).toBe(2);
  });

  it('returns zero for plain text without structural elements', () => {
    const count = countStructuralElements('Just plain text with no structure.');
    expect(count).toBe(0);
  });

  it('counts each type only once regardless of occurrences', () => {
    const body = [
      '- item a',
      '- item b',
      '- item c',
      '',
      '> quote one',
      '> quote two',
    ].join('\n');
    const count = countStructuralElements(body);
    // Unordered list (1) + blockquote (1) = 2, not 5
    expect(count).toBe(2);
  });

  it('does not count list markers inside code blocks', () => {
    const body = [
      '```',
      '- this is code, not a list',
      '```',
    ].join('\n');
    const count = countStructuralElements(body);
    // Only code block is counted, not the list marker inside it
    expect(count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// findInlineHtml
// ---------------------------------------------------------------------------
describe('findInlineHtml', () => {
  it('flags standard HTML tags like div and span', () => {
    const results = findInlineHtml('<div>content</div>\n<span>text</span>', []);
    const tags = results.map(r => r.tag);
    expect(tags).toContain('div');
    expect(tags).toContain('span');
  });

  it('skips allowed tags', () => {
    const results = findInlineHtml('<Callout>info</Callout>', ['Callout']);
    expect(results).toHaveLength(0);
  });

  it('skips tags inside code blocks', () => {
    const body = [
      '```html',
      '<div>this is code</div>',
      '```',
    ].join('\n');
    const results = findInlineHtml(body, []);
    expect(results.find(r => r.tag === 'div')).toBeUndefined();
  });

  it('reports correct line numbers', () => {
    const body = 'Line one.\n<div>content</div>\nLine three.';
    const results = findInlineHtml(body, []);
    const div = results.find(r => r.tag === 'div');
    expect(div).toBeDefined();
    expect(div!.line).toBe(2);
  });

  it('does not flag PascalCase MDX component tags', () => {
    const results = findInlineHtml('<MyComponent>child</MyComponent>', []);
    expect(results).toHaveLength(0);
  });

  it('returns empty for content with no HTML tags', () => {
    const results = findInlineHtml('Plain markdown content with no tags.', []);
    expect(results).toHaveLength(0);
  });

  it('flags closing tags as well', () => {
    const results = findInlineHtml('</div>', []);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].tag).toBe('div');
  });
});

// ---------------------------------------------------------------------------
// analyzeHeadingDensity
// ---------------------------------------------------------------------------
describe('analyzeHeadingDensity', () => {
  it('finds gaps greater than 300 words between headings', () => {
    const body = '## Intro\n\n' + 'word '.repeat(350) + '\n\n## Next\n\nShort section.';
    const result = analyzeHeadingDensity(body);
    expect(result.gaps.length).toBeGreaterThanOrEqual(1);
    const introGap = result.gaps.find(g => g.afterHeading === 'Intro');
    expect(introGap).toBeDefined();
    expect(introGap!.wordCount).toBeGreaterThan(300);
  });

  it('handles content before first heading', () => {
    const body = 'word '.repeat(350) + '\n\n## First Heading\n\nShort section.';
    const result = analyzeHeadingDensity(body);
    const startGap = result.gaps.find(g => g.afterHeading === '(start)');
    expect(startGap).toBeDefined();
    expect(startGap!.line).toBe(1);
  });

  it('returns empty gaps when headings are well-distributed', () => {
    const body = [
      '## Section One',
      '',
      'Short paragraph with a few words.',
      '',
      '## Section Two',
      '',
      'Another short paragraph here.',
      '',
      '## Section Three',
      '',
      'Final short paragraph.',
    ].join('\n');
    const result = analyzeHeadingDensity(body);
    expect(result.gaps).toHaveLength(0);
  });

  it('handles content with no headings at all', () => {
    const body = 'word '.repeat(350);
    const result = analyzeHeadingDensity(body);
    expect(result.gaps.length).toBe(1);
    expect(result.gaps[0].afterHeading).toBe('(start)');
  });

  it('does not flag when content has no headings but is under 300 words', () => {
    const body = 'A short paragraph with just a few words.';
    const result = analyzeHeadingDensity(body);
    expect(result.gaps).toHaveLength(0);
  });

  it('reports the correct heading text for each gap', () => {
    const body = [
      '## Introduction',
      '',
      'word '.repeat(50),
      '',
      '## Main Content',
      '',
      'word '.repeat(350),
      '',
      '## Conclusion',
      '',
      'Short ending.',
    ].join('\n');
    const result = analyzeHeadingDensity(body);
    const mainGap = result.gaps.find(g => g.afterHeading === 'Main Content');
    expect(mainGap).toBeDefined();
    expect(mainGap!.wordCount).toBeGreaterThan(300);
    // Introduction should not have a gap
    expect(result.gaps.find(g => g.afterHeading === 'Introduction')).toBeUndefined();
  });
});
