/**
 * GEO Structure Rules Unit Tests
 * Tests for GEO structure rules that validate content formatting
 * patterns for optimal AI extraction and citation readiness
 */

import { createItem, createContext } from '../../helpers.js';
import {
  geoSectionTooLong,
  geoParagraphTooLong,
  geoMissingLists,
  geoCitationBlockUpperBound,
  geoOrphanedIntro,
  geoHeadingDensity,
  geoStructuralElementRatio,
} from '../../../src/rules/geo-structure-rules.js';

const ctx = createContext();

// ---------------------------------------------------------------------------
// geoSectionTooLong
// ---------------------------------------------------------------------------
describe('geoSectionTooLong', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Very Long Section',
      '',
      Array(350).fill('word').join(' '),
      '',
      Array(200).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoSectionTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## Section',
      '',
      Array(100).fill('word').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoSectionTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when H2 section exceeds 300 words with no H3 subheadings', () => {
    const body = [
      '## Very Long Section',
      '',
      Array(350).fill('word').join(' '),
      '',
      '## Short Section',
      '',
      'Brief content here.',
      '',
      Array(200).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoSectionTooLong.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-section-too-long');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when long section has H3 subheadings', () => {
    const body = [
      '## Long Section With Subheadings',
      '',
      Array(200).fill('word').join(' '),
      '',
      '### Sub Section',
      '',
      Array(200).fill('word').join(' '),
      '',
      Array(200).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoSectionTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoParagraphTooLong
// ---------------------------------------------------------------------------
describe('geoParagraphTooLong', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Section',
      '',
      Array(120).fill('word').join(' '),
      '',
      Array(400).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoParagraphTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## Section',
      '',
      Array(120).fill('word').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoParagraphTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when paragraph exceeds 100 words', () => {
    const body = [
      '## Section One',
      '',
      Array(120).fill('word').join(' '),
      '',
      '## Section Two',
      '',
      'Short paragraph here.',
      '',
      Array(400).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoParagraphTooLong.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-paragraph-too-long');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when paragraphs are under 100 words', () => {
    // Build body with many short paragraphs to reach 500+ words without any single paragraph exceeding 100 words
    const shortParagraphs = Array(10)
      .fill(null)
      .map((_, i) => `## Section ${i + 1}\n\n${Array(50).fill('word').join(' ')}`)
      .join('\n\n');
    const item = createItem({ body: shortParagraphs, contentType: 'blog' });
    const results = geoParagraphTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoMissingLists
// ---------------------------------------------------------------------------
describe('geoMissingLists', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Section One',
      '',
      'Just a paragraph with no list.',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoMissingLists.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## Section',
      '',
      'Just a paragraph with no list.',
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingLists.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when no list in content', () => {
    const body = [
      '## Section One',
      '',
      'Just a paragraph with no list.',
      '',
      '## Section Two',
      '',
      'Another paragraph with only text and headings.',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingLists.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-missing-lists');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when bulleted list present', () => {
    const body = [
      '## Section One',
      '',
      'Here are some items:',
      '',
      '- Item one',
      '- Item two',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingLists.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes when numbered list present', () => {
    const body = [
      '## Section One',
      '',
      'Follow these steps:',
      '',
      '1. Step one',
      '2. Step two',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingLists.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoCitationBlockUpperBound
// ---------------------------------------------------------------------------
describe('geoCitationBlockUpperBound', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Section One',
      '',
      Array(100).fill('word').join(' '),
      '',
      '## Section Two',
      '',
      Array(100).fill('word').join(' '),
      '',
      Array(700).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoCitationBlockUpperBound.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<800 words)', () => {
    const body = [
      '## Section One',
      '',
      Array(100).fill('word').join(' '),
      '',
      Array(200).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoCitationBlockUpperBound.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when >50% of H2 sections have first paragraphs over 80 words', () => {
    const body = [
      '## Section One',
      '',
      Array(90).fill('word').join(' '),
      '',
      'More content after the first paragraph.',
      '',
      '## Section Two',
      '',
      Array(95).fill('word').join(' '),
      '',
      'Additional content here.',
      '',
      Array(650).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoCitationBlockUpperBound.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-citation-block-upper-bound');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when first paragraphs are under 80 words', () => {
    const body = [
      '## Section One',
      '',
      Array(40).fill('word').join(' '),
      '',
      'More content after the first paragraph.',
      '',
      '## Section Two',
      '',
      Array(40).fill('word').join(' '),
      '',
      'Additional content here.',
      '',
      Array(750).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoCitationBlockUpperBound.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoOrphanedIntro
// ---------------------------------------------------------------------------
describe('geoOrphanedIntro', () => {
  it('skips non-blog content', () => {
    const body = [
      Array(200).fill('introduction').join(' '),
      '',
      '## First Section',
      '',
      'Content here.',
      '',
      Array(400).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoOrphanedIntro.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      Array(200).fill('introduction').join(' '),
      '',
      '## First Section',
      '',
      'Content here.',
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoOrphanedIntro.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when content before first H2 exceeds 150 words', () => {
    const body = [
      Array(200).fill('introduction').join(' '),
      '',
      '## First Section',
      '',
      'Content here.',
      '',
      Array(400).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoOrphanedIntro.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-orphaned-intro');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when intro is under 150 words', () => {
    const body = [
      Array(50).fill('introduction').join(' '),
      '',
      '## First Section',
      '',
      'Content here.',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoOrphanedIntro.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoHeadingDensity
// ---------------------------------------------------------------------------
describe('geoHeadingDensity', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Section One',
      '',
      Array(350).fill('word').join(' '),
      '',
      '## Section Two',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'page' });
    const results = geoHeadingDensity.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<800 words)', () => {
    const body = [
      '## Section One',
      '',
      Array(350).fill('word').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoHeadingDensity.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when 300+ words gap without heading', () => {
    const body = [
      '## Section One',
      '',
      Array(350).fill('word').join(' '),
      '',
      '## Section Two',
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoHeadingDensity.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('geo-heading-density');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when headings are well-distributed', () => {
    const body = [
      '## Section One',
      '',
      Array(200).fill('word').join(' '),
      '',
      '## Section Two',
      '',
      Array(200).fill('word').join(' '),
      '',
      '## Section Three',
      '',
      Array(200).fill('word').join(' '),
      '',
      '## Section Four',
      '',
      Array(200).fill('word').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoHeadingDensity.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoStructuralElementRatio
// ---------------------------------------------------------------------------
describe('geoStructuralElementRatio', () => {
  it('skips non-blog content', () => {
    const body = [
      '## Section One',
      '',
      Array(500).fill('word').join(' '),
      '',
      Array(500).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'project' });
    const results = geoStructuralElementRatio.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = [
      '## Section One',
      '',
      Array(100).fill('word').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoStructuralElementRatio.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when too few structural elements for word count', () => {
    const body = [
      '## Section One',
      '',
      Array(500).fill('word').join(' '),
      '',
      '## Section Two',
      '',
      Array(500).fill('word').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoStructuralElementRatio.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-structural-element-ratio');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when enough structural elements exist', () => {
    const body = [
      '## Section One',
      '',
      Array(300).fill('word').join(' '),
      '',
      '- Item one',
      '- Item two',
      '- Item three',
      '',
      '## Section Two',
      '',
      Array(300).fill('word').join(' '),
      '',
      '| Column A | Column B |',
      '|----------|----------|',
      '| Value 1  | Value 2  |',
      '',
      '> This is a blockquote with important information.',
      '',
      Array(400).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoStructuralElementRatio.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});
