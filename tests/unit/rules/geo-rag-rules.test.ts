/**
 * GEO RAG Rules Unit Tests
 * Tests for GEO RAG optimization rules that validate content patterns
 * improving retrieval and citation in RAG systems
 */

import { createItem, createContext, generateGeoBody } from '../../helpers.js';
import {
  createGeoExtractionTriggersRule,
  geoSectionSelfContainment,
  createGeoVagueOpeningRule,
  createGeoAcronymExpansionRule,
  geoStatisticWithoutContext,
  geoMissingSummarySection,
} from '../../../src/rules/geo-rag-rules.js';

const ctx = createContext();

// ---------------------------------------------------------------------------
// createGeoExtractionTriggersRule
// ---------------------------------------------------------------------------
describe('createGeoExtractionTriggersRule', () => {
  const rule = createGeoExtractionTriggersRule(['key takeaway', 'in summary', 'the bottom line']);

  it('skips non-blog content', () => {
    const body = [
      '## Analysis Section',
      '',
      'The data shows interesting patterns in the market.',
      '',
      Array(1050).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<1000 words)', () => {
    const body = [
      '## Analysis Section',
      '',
      'The data shows interesting patterns in the market.',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when <2 trigger phrases found', () => {
    const body = [
      '## Analysis Section',
      '',
      'The data shows interesting patterns in the market.',
      '',
      Array(1050).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-extraction-triggers');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when 2+ triggers present', () => {
    const body = [
      '## Analysis Section',
      '',
      'The key takeaway from this research is that optimization matters.',
      '',
      '## Summary',
      '',
      'In summary, the data supports our hypothesis clearly.',
      '',
      Array(1050).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoSectionSelfContainment
// ---------------------------------------------------------------------------
describe('geoSectionSelfContainment', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Benefits of SEO',
      '',
      'This is important for all businesses looking to grow.',
      '',
      '## Implementation Steps',
      '',
      'It requires careful planning and execution.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoSectionSelfContainment.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## Benefits of SEO',
      '',
      'This is important for all businesses looking to grow.',
      '',
      Array(100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoSectionSelfContainment.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when H2 section opens with unresolved pronoun', () => {
    const body = [
      '## Benefits of SEO',
      '',
      'This is important for all businesses looking to grow.',
      '',
      '## Implementation Steps',
      '',
      'It requires careful planning and execution.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoSectionSelfContainment.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-section-self-containment');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when sections open with specific subjects', () => {
    const body = [
      '## Benefits of SEO',
      '',
      'Search engine optimization provides crucial advantages for businesses.',
      '',
      '## Implementation Steps',
      '',
      'The implementation process requires careful planning.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoSectionSelfContainment.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// createGeoVagueOpeningRule
// ---------------------------------------------------------------------------
describe('createGeoVagueOpeningRule', () => {
  const rule = createGeoVagueOpeningRule(['in this article', 'in this post', 'welcome to']);

  it('skips non-blog content', () => {
    const body = [
      'In this article we will explore the fascinating world of search engine optimization.',
      '',
      '## First Section',
      '',
      'Content here.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      'In this article we will explore the fascinating world of search engine optimization.',
      '',
      '## First Section',
      '',
      'Content here.',
      '',
      Array(100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when article starts with filler phrase', () => {
    const body = [
      'In this article we will explore the fascinating world of search engine optimization.',
      '',
      '## First Section',
      '',
      'Content here.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-vague-opening');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when article starts with substantive content', () => {
    const body = [
      'Search engine optimization has fundamentally transformed digital marketing strategies worldwide.',
      '',
      '## First Section',
      '',
      'Content here.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// createGeoAcronymExpansionRule
// ---------------------------------------------------------------------------
describe('createGeoAcronymExpansionRule', () => {
  const rule = createGeoAcronymExpansionRule(['HTML', 'CSS', 'API']);

  it('skips non-blog content', () => {
    const body = [
      '## Using GEO Strategies',
      '',
      'GEO is essential for modern content optimization.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## Using GEO Strategies',
      '',
      'GEO is essential for modern content optimization.',
      '',
      Array(100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when acronym not expanded', () => {
    const body = [
      '## Using GEO Strategies',
      '',
      'GEO is essential for modern content optimization.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-acronym-expansion');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when acronym is in allowlist', () => {
    const body = [
      '## Web Development Basics',
      '',
      'HTML and API are fundamental tools for building modern web applications.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes when acronym is expanded', () => {
    const body = [
      '## Using GEO Strategies',
      '',
      'Generative Engine Optimization (GEO) is essential for modern content optimization.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoStatisticWithoutContext
// ---------------------------------------------------------------------------
describe('geoStatisticWithoutContext', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Market Data',
      '',
      'Revenue grew 45% last year and productivity increased by 30% as well.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoStatisticWithoutContext.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## Market Data',
      '',
      'Revenue grew 45% last year and productivity increased by 30% as well.',
      '',
      Array(100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoStatisticWithoutContext.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when statistics lack context', () => {
    const body = [
      '## Market Data',
      '',
      'Revenue grew 45% last year and productivity increased by 30% as well.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoStatisticWithoutContext.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-statistic-without-context');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when statistics have attribution', () => {
    const body = [
      '## Market Data',
      '',
      'According to a 2025 study, revenue grew 45% last year.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoStatisticWithoutContext.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoMissingSummarySection
// ---------------------------------------------------------------------------
describe('geoMissingSummarySection', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Introduction to the Topic',
      '',
      'Content here about the topic.',
      '',
      '## Deep Analysis',
      '',
      'More detailed content here.',
      '',
      Array(2100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoMissingSummarySection.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<2000 words)', () => {
    const body = [
      '## Introduction to the Topic',
      '',
      'Content here about the topic.',
      '',
      '## Deep Analysis',
      '',
      'More detailed content here.',
      '',
      Array(1000).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingSummarySection.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when no summary/conclusion heading', () => {
    const body = [
      '## Introduction to the Topic',
      '',
      'Content here about the topic.',
      '',
      '## Deep Analysis',
      '',
      'More detailed content here.',
      '',
      Array(2100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingSummarySection.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-missing-summary-section');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when summary heading exists', () => {
    const body = [
      '## Introduction',
      '',
      'Content here.',
      '',
      '## Key Takeaways',
      '',
      'The main points are summarized here.',
      '',
      Array(2100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingSummarySection.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});
