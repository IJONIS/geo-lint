/**
 * GEO Freshness & Quality Rules Unit Tests
 * Tests for GEO freshness rules that validate content freshness signals,
 * readability, and technical quality for AI search optimization
 */

import { createItem, createContext, generateGeoBody } from '../../helpers.js';
import {
  geoStaleDateReferences,
  geoOutdatedContent,
  geoPassiveVoiceExcess,
  geoSentenceTooLong,
  geoLowInternalLinks,
  geoComparisonTable,
  createGeoInlineHtmlRule,
} from '../../../src/rules/geo-freshness-rules.js';

const ctx = createContext();

// ---------------------------------------------------------------------------
// geoStaleDateReferences
// ---------------------------------------------------------------------------
describe('geoStaleDateReferences', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Old Data Section',
      '',
      'In 2020, the market shifted dramatically and new players emerged.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoStaleDateReferences.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## Old Data Section',
      '',
      'In 2020, the market shifted dramatically.',
      '',
      Array(100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoStaleDateReferences.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when body contains stale year references', () => {
    const body = [
      '## Old Data Section',
      '',
      'In 2020, the market shifted dramatically and new players emerged.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoStaleDateReferences.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-stale-date-references');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when only recent years are referenced', () => {
    const body = [
      '## Current Data Section',
      '',
      'In 2025, the market continued to grow. In 2026, new trends emerged.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoStaleDateReferences.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoOutdatedContent
// ---------------------------------------------------------------------------
describe('geoOutdatedContent', () => {
  it('skips non-blog content', () => {
    const item = createItem({
      contentType: 'page',
      updatedAt: '2025-01-01',
    });
    const results = geoOutdatedContent.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips when no date fields', () => {
    const item = createItem({
      contentType: 'blog',
      updatedAt: undefined,
      date: undefined,
    });
    const results = geoOutdatedContent.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when updatedAt is older than 6 months', () => {
    const item = createItem({
      contentType: 'blog',
      updatedAt: '2025-01-01',
    });
    const results = geoOutdatedContent.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-outdated-content');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('updatedAt');
  });

  it('passes when date is recent', () => {
    const item = createItem({
      contentType: 'blog',
      updatedAt: '2026-01-15',
    });
    const results = geoOutdatedContent.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoPassiveVoiceExcess
// ---------------------------------------------------------------------------
describe('geoPassiveVoiceExcess', () => {
  it('skips non-blog content', () => {
    const body = generateGeoBody({ wordCount: 600 });
    const item = createItem({ body, contentType: 'page' });
    const results = geoPassiveVoiceExcess.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = generateGeoBody({ wordCount: 100 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoPassiveVoiceExcess.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when >15% passive voice', () => {
    const body = [
      '## Passive Voice Section',
      '',
      'The report was written by the team. The results were analyzed by experts. The data was collected over months. The findings were presented at the conference. The conclusion was drawn by researchers.',
      '',
      // Add some active voice to keep ratio above 15% but below 100%
      'The team analyzed the data carefully. Experts review these findings regularly.',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoPassiveVoiceExcess.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-passive-voice-excess');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when mostly active voice', () => {
    const body = [
      '## Active Voice Section',
      '',
      'The team wrote the report. Experts analyzed the results. Researchers collected the data over months. The team presented findings at the conference. Scientists drew their conclusions.',
      '',
      'Engineers built the system from scratch. Designers created the interface. Managers coordinated the project timeline.',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoPassiveVoiceExcess.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoSentenceTooLong
// ---------------------------------------------------------------------------
describe('geoSentenceTooLong', () => {
  it('skips non-blog content', () => {
    const longSentence = 'The incredibly complex and detailed analysis of the comprehensive data set that was gathered over an extended period of time from multiple different sources across various geographical regions reveals a surprising and unexpected pattern in consumer behavior that challenges conventional wisdom.';
    const body = [
      '## Analysis Section',
      '',
      longSentence,
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoSentenceTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const longSentence = 'The incredibly complex and detailed analysis of the comprehensive data set that was gathered over an extended period of time from multiple different sources across various geographical regions reveals a surprising and unexpected pattern in consumer behavior that challenges conventional wisdom.';
    const body = [
      '## Analysis Section',
      '',
      longSentence,
      '',
      Array(100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoSentenceTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when sentence exceeds 40 words', () => {
    const longSentence = 'The incredibly complex and detailed analysis of the comprehensive data set that was gathered over an extended period of time from multiple different sources across various geographical regions reveals a surprising and unexpected pattern in consumer behavior that challenges conventional wisdom.';
    const body = [
      '## Analysis Section',
      '',
      longSentence,
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoSentenceTooLong.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-sentence-too-long');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when all sentences are under 40 words', () => {
    // Build many short sentences across separate lines/paragraphs
    const shortLines: string[] = [];
    for (let i = 0; i < 60; i++) {
      shortLines.push(`Item number ${i + 1} is short and clear.`);
    }
    const body = [
      '## Analysis Section',
      '',
      'The team analyzed the data carefully. They found interesting patterns.',
      '',
      ...shortLines,
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoSentenceTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoLowInternalLinks
// ---------------------------------------------------------------------------
describe('geoLowInternalLinks', () => {
  it('skips non-blog content', () => {
    const body = generateGeoBody({ wordCount: 600 });
    const item = createItem({ body, contentType: 'page' });
    const results = geoLowInternalLinks.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = generateGeoBody({ wordCount: 100 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoLowInternalLinks.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when <2 internal links', () => {
    const body = [
      '## Section Without Links',
      '',
      'This content has no internal links at all. It discusses topics without linking to other pages on the site.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoLowInternalLinks.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-low-internal-links');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when 2+ internal links', () => {
    const body = [
      '## Section With Links',
      '',
      'Check out [our blog](/blog) for more information. Also visit the [about page](/about) to learn more.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoLowInternalLinks.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoComparisonTable
// ---------------------------------------------------------------------------
describe('geoComparisonTable', () => {
  it('skips non-blog content', () => {
    const body = [
      '## React vs Vue Comparison',
      '',
      'React and Vue are both popular frameworks for building user interfaces.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoComparisonTable.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## React vs Vue Comparison',
      '',
      'React and Vue are both popular frameworks.',
      '',
      Array(100).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoComparisonTable.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when comparison heading has no table', () => {
    const body = [
      '## React vs Vue Comparison',
      '',
      'React and Vue are both popular frameworks for building user interfaces.',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoComparisonTable.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-comparison-table');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when comparison heading has a table in its section', () => {
    const body = [
      '## React vs Vue Comparison',
      '',
      'React and Vue are both popular frameworks for building user interfaces.',
      '',
      '| Feature | React | Vue |',
      '|---------|-------|-----|',
      '| Learning Curve | Moderate | Easy |',
      '| Performance | Fast | Fast |',
      '',
      Array(550).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoComparisonTable.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// createGeoInlineHtmlRule
// ---------------------------------------------------------------------------
describe('createGeoInlineHtmlRule', () => {
  const rule = createGeoInlineHtmlRule(['Callout', 'Note']);

  it('warns when raw HTML tags found in markdown', () => {
    const body = [
      '## Section',
      '',
      '<div>This is raw HTML content</div>',
      '',
      'Some more content here.',
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-inline-html');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when only allowed MDX tags used', () => {
    const body = [
      '## Section',
      '',
      '<Callout>This is an allowed MDX component</Callout>',
      '',
      '<Note>This is also allowed</Note>',
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes when no HTML tags present', () => {
    const body = [
      '## Section',
      '',
      'This is plain markdown content with no HTML tags at all.',
      '',
      'Just regular text and **bold** formatting.',
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('applies to all content types, not just blog', () => {
    const body = [
      '## Section',
      '',
      '<div>This is raw HTML content</div>',
      '',
      'Some more content here.',
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = rule.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-inline-html');
  });
});
