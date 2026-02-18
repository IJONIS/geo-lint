/**
 * GEO E-E-A-T Rules Unit Tests
 * Tests for Experience, Expertise, Authoritativeness, and Trustworthiness rules
 * plus answer formatting patterns for AI citation optimization
 */

import { createItem, createContext } from '../../helpers.js';
import {
  geoMissingSourceCitations,
  geoMissingExpertQuotes,
  createGeoMissingAuthorRule,
  createGeoHeadingTooVagueRule,
  geoFaqQuality,
  geoDefinitionPattern,
  geoHowtoSteps,
  geoMissingTldr,
} from '../../../src/rules/geo-eeat-rules.js';

const ctx = createContext();

// ---------------------------------------------------------------------------
// geoMissingSourceCitations
// ---------------------------------------------------------------------------
describe('geoMissingSourceCitations', () => {
  it('skips non-blog content', () => {
    const body = Array(600).fill('word').join(' ');
    const item = createItem({ body, contentType: 'page' });
    const results = geoMissingSourceCitations.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = Array(300).fill('word').join(' ');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingSourceCitations.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when insufficient citations', () => {
    const body = Array(600).fill('word').join(' ');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingSourceCitations.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-missing-source-citations');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when enough citations exist', () => {
    const body = [
      'According to [Source](https://example.com), the data shows 50%.',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingSourceCitations.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoMissingExpertQuotes
// ---------------------------------------------------------------------------
describe('geoMissingExpertQuotes', () => {
  it('skips non-blog content', () => {
    const body = Array(900).fill('word').join(' ');
    const item = createItem({ body, contentType: 'page' });
    const results = geoMissingExpertQuotes.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<800 words)', () => {
    const body = Array(500).fill('word').join(' ');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingExpertQuotes.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when no expert quote present', () => {
    const body = Array(900).fill('word').join(' ');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingExpertQuotes.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-missing-expert-quotes');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when expert quote exists', () => {
    const body = [
      '> AI will transform everything.',
      '> — Dr. Smith',
      '',
      Array(900).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingExpertQuotes.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// createGeoMissingAuthorRule
// ---------------------------------------------------------------------------
describe('createGeoMissingAuthorRule', () => {
  const rule = createGeoMissingAuthorRule(['admin', 'team', 'editor']);

  it('skips non-blog content', () => {
    const item = createItem({ contentType: 'page', author: undefined });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when author is missing', () => {
    const item = createItem({ contentType: 'blog', author: undefined });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-missing-author');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('author');
  });

  it('warns when author is generic', () => {
    const item = createItem({ contentType: 'blog', author: 'admin' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-missing-author');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('author');
  });

  it('passes when author is a real name', () => {
    const item = createItem({ contentType: 'blog', author: 'Jane Smith' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// createGeoHeadingTooVagueRule
// ---------------------------------------------------------------------------
describe('createGeoHeadingTooVagueRule', () => {
  const rule = createGeoHeadingTooVagueRule(['introduction', 'overview', 'summary']);

  it('skips non-blog content', () => {
    const body = [
      '## Introduction',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## Introduction',
      '',
      Array(300).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when heading is a single vague word', () => {
    const body = [
      '## Introduction',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-heading-too-vague');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('warns when heading has fewer than 3 words', () => {
    const body = [
      '## The Topic',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-heading-too-vague');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when headings are descriptive with 3+ words', () => {
    const body = [
      '## How Content Optimization Works',
      '',
      '## Best Practices for SEO Strategy',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoFaqQuality
// ---------------------------------------------------------------------------
describe('geoFaqQuality', () => {
  it('skips non-blog content', () => {
    const body = [
      '## FAQ',
      '',
      '### What is this?',
      'Short answer.',
      '',
      Array(900).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoFaqQuality.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<800 words)', () => {
    const body = [
      '## FAQ',
      '',
      '### What is this?',
      'Short answer.',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoFaqQuality.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips when no FAQ section exists', () => {
    const body = [
      '## Regular Section',
      '',
      'Just some content here without any FAQ.',
      '',
      Array(900).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoFaqQuality.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when FAQ has fewer than 3 pairs', () => {
    const body = [
      '## FAQ',
      '',
      '### What is geo-lint?',
      'Geo-lint is a linting tool for content optimization that helps writers improve their SEO and GEO quality scores across multiple dimensions.',
      '',
      '### How does it work?',
      'It works by analyzing markdown content against a set of configurable rules and returning structured violation reports with actionable suggestions.',
      '',
      Array(900).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoFaqQuality.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const pairCountResult = results.find(r => r.message.includes('Q&A pair'));
    expect(pairCountResult).toBeDefined();
    expect(pairCountResult!.rule).toBe('geo-faq-quality');
    expect(pairCountResult!.severity).toBe('warning');
    expect(pairCountResult!.field).toBe('body');
  });

  it('passes when FAQ has 3+ proper pairs with question marks and good answer lengths', () => {
    const answerA = Array(40).fill('optimizing').join(' ');
    const answerB = Array(40).fill('analyzing').join(' ');
    const answerC = Array(40).fill('improving').join(' ');
    const body = [
      '## FAQ',
      '',
      `### What is geo-lint?`,
      `Geo-lint is a comprehensive linting tool for content ${answerA}`,
      '',
      `### How does geo-lint work?`,
      `It works by ${answerB} markdown content against configurable rules`,
      '',
      `### Why should I use geo-lint?`,
      `Using geo-lint ensures ${answerC} your content quality scores`,
      '',
      Array(900).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoFaqQuality.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoDefinitionPattern
// ---------------------------------------------------------------------------
describe('geoDefinitionPattern', () => {
  it('skips non-blog content', () => {
    const body = [
      '## What is SEO?',
      '',
      'The practice of optimizing content for search engines.',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoDefinitionPattern.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## What is SEO?',
      '',
      'The practice of optimizing content for search engines.',
      '',
      Array(300).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoDefinitionPattern.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when "What is X?" heading is not followed by "X is..." pattern', () => {
    const body = [
      '## What is SEO?',
      '',
      'The practice of optimizing content for search engines and improving visibility in organic results.',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoDefinitionPattern.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-definition-pattern');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when definition pattern is followed', () => {
    const body = [
      '## What is SEO?',
      '',
      'SEO is the practice of optimizing content for search engines and improving visibility in organic results.',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoDefinitionPattern.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoHowtoSteps
// ---------------------------------------------------------------------------
describe('geoHowtoSteps', () => {
  it('skips non-blog content', () => {
    const body = [
      '## How to Optimize Content',
      '',
      '1. First step',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoHowtoSteps.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## How to Optimize Content',
      '',
      '1. First step',
      '',
      Array(300).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoHowtoSteps.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when how-to heading has fewer than 3 numbered steps', () => {
    const body = [
      '## How to Optimize Content',
      '',
      '1. First step',
      '2. Second step',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoHowtoSteps.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-howto-steps');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when 3+ numbered steps follow how-to heading', () => {
    const body = [
      '## How to Optimize Content',
      '',
      '1. First step in the optimization process',
      '2. Second step in the optimization process',
      '3. Third step in the optimization process',
      '',
      Array(600).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoHowtoSteps.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoMissingTldr
// ---------------------------------------------------------------------------
describe('geoMissingTldr', () => {
  it('skips non-blog content', () => {
    const body = Array(900).fill('word').join(' ');
    const item = createItem({ body, contentType: 'page' });
    const results = geoMissingTldr.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<800 words)', () => {
    const body = Array(500).fill('word').join(' ');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingTldr.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when no TL;DR near the top', () => {
    const body = Array(900).fill('word').join(' ');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingTldr.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-missing-tldr');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when "TL;DR" appears in the first 150 words', () => {
    const body = [
      'TL;DR This article covers everything you need to know about content optimization.',
      '',
      Array(900).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingTldr.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes when "Key takeaway" appears in the first 150 words', () => {
    const body = [
      'Key takeaway: Content optimization is essential for modern SEO and GEO strategies.',
      '',
      Array(900).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingTldr.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});
