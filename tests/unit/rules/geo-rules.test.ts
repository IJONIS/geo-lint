/**
 * GEO Rules Unit Tests
 * Tests for GEO (Generative Engine Optimization) rules that validate
 * content readiness for LLM-based search and AI visibility
 */

import { createItem, createContext, generateGeoBody } from '../../helpers.js';
import {
  geoNoQuestionHeadings,
  geoWeakLeadSentences,
  geoLowCitationDensity,
  geoMissingFaqSection,
  geoMissingTable,
  geoShortCitationBlocks,
  createGeoEntityRule,
} from '../../../src/rules/geo-rules.js';

const ctx = createContext();

// ---------------------------------------------------------------------------
// geoNoQuestionHeadings
// ---------------------------------------------------------------------------
describe('geoNoQuestionHeadings', () => {
  it('skips non-blog content', () => {
    const body = generateGeoBody({ wordCount: 600, questionHeadings: 0, statementHeadings: 4 });
    const item = createItem({ body, contentType: 'page' });
    const results = geoNoQuestionHeadings.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = generateGeoBody({ wordCount: 100, questionHeadings: 0, statementHeadings: 2 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoNoQuestionHeadings.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes when >=20% headings are questions', () => {
    // 3 question + 1 statement = 4 total, 75% questions -- well above 20%
    const body = generateGeoBody({ wordCount: 600, questionHeadings: 3, statementHeadings: 1 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoNoQuestionHeadings.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when <20% headings are questions', () => {
    // 0 question + 4 statement = 0% questions
    const body = generateGeoBody({ wordCount: 600, questionHeadings: 0, statementHeadings: 4 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoNoQuestionHeadings.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-no-question-headings');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('passes when exactly at 20% threshold', () => {
    // 1 question + 4 statement = 5 total, 20% -- at threshold, should pass (ratio < 0.2 triggers)
    const body = generateGeoBody({ wordCount: 600, questionHeadings: 1, statementHeadings: 4 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoNoQuestionHeadings.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoWeakLeadSentences
// ---------------------------------------------------------------------------
describe('geoWeakLeadSentences', () => {
  it('skips non-blog content', () => {
    const body = generateGeoBody({ wordCount: 600 });
    const item = createItem({ body, contentType: 'project' });
    const results = geoWeakLeadSentences.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = generateGeoBody({ wordCount: 100 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoWeakLeadSentences.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when most sections have weak lead sentences', () => {
    // Construct body where all sections start with weak leads.
    // Use 520 padding words to ensure countWords() exceeds 500 after markdown stripping.
    const body = [
      '## Section One',
      'In this section we explore the topic at hand with great detail and thoughtfulness.',
      '',
      '## Section Two',
      'The following paragraphs describe the methodology used in our research process.',
      '',
      '## Section Three',
      "Let's look at the data and see what it tells us about the current situation today.",
      '',
      Array(520).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoWeakLeadSentences.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-weak-lead-sentences');
    expect(results[0].severity).toBe('warning');
  });

  it('passes when sections have strong lead sentences', () => {
    // The default generateGeoBody produces direct-answer lead sentences
    const body = generateGeoBody({ wordCount: 600, questionHeadings: 2, statementHeadings: 2 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoWeakLeadSentences.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoLowCitationDensity
// ---------------------------------------------------------------------------
describe('geoLowCitationDensity', () => {
  it('skips non-blog content', () => {
    const body = generateGeoBody({ wordCount: 600, includeStats: false });
    const item = createItem({ body, contentType: 'page' });
    const results = geoLowCitationDensity.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<500 words)', () => {
    const body = generateGeoBody({ wordCount: 100, includeStats: false });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoLowCitationDensity.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when insufficient statistics in content', () => {
    // No stats, 600 words -> expected at least 1 data point (600/500 = 1)
    const body = generateGeoBody({ wordCount: 600, includeStats: false });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoLowCitationDensity.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-low-citation-density');
    expect(results[0].severity).toBe('warning');
  });

  it('passes when enough statistics are present', () => {
    const body = generateGeoBody({ wordCount: 600, includeStats: true });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoLowCitationDensity.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoMissingFaqSection
// ---------------------------------------------------------------------------
describe('geoMissingFaqSection', () => {
  it('warns when no FAQ section in 800+ word blog', () => {
    const body = generateGeoBody({ wordCount: 900, includeFaq: false });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingFaqSection.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-missing-faq-section');
    expect(results[0].severity).toBe('warning');
    expect(results[0].message).toContain('FAQ');
  });

  it('passes when FAQ section exists', () => {
    const body = generateGeoBody({ wordCount: 900, includeFaq: true });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingFaqSection.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short posts (<800 words)', () => {
    const body = generateGeoBody({ wordCount: 500, includeFaq: false });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingFaqSection.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips non-blog content', () => {
    const body = generateGeoBody({ wordCount: 900, includeFaq: false });
    const item = createItem({ body, contentType: 'page' });
    const results = geoMissingFaqSection.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoMissingTable
// ---------------------------------------------------------------------------
describe('geoMissingTable', () => {
  it('warns when no table in 1000+ word blog', () => {
    const body = generateGeoBody({ wordCount: 1100, includeTable: false });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingTable.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-missing-table');
    expect(results[0].severity).toBe('warning');
    expect(results[0].message).toContain('table');
  });

  it('passes when table exists', () => {
    const body = generateGeoBody({ wordCount: 1100, includeTable: true });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingTable.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short posts (<1000 words)', () => {
    const body = generateGeoBody({ wordCount: 800, includeTable: false });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoMissingTable.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips non-blog content', () => {
    const body = generateGeoBody({ wordCount: 1100, includeTable: false });
    const item = createItem({ body, contentType: 'project' });
    const results = geoMissingTable.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// geoShortCitationBlocks
// ---------------------------------------------------------------------------
describe('geoShortCitationBlocks', () => {
  it('skips non-blog content', () => {
    const body = generateGeoBody({ wordCount: 900 });
    const item = createItem({ body, contentType: 'page' });
    const results = geoShortCitationBlocks.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<800 words)', () => {
    const body = generateGeoBody({ wordCount: 500 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoShortCitationBlocks.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns when first paragraphs after H2s are too short', () => {
    // Create body with H2 sections that have very short first paragraphs
    const body = [
      '## First Section',
      'Short paragraph.',
      '',
      '## Second Section',
      'Also short.',
      '',
      '## Third Section',
      'Tiny.',
      '',
      // Pad to 800+ words
      Array(850).fill('padding').join(' '),
    ].join('\n');
    const item = createItem({ body, contentType: 'blog' });
    const results = geoShortCitationBlocks.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('geo-short-citation-blocks');
    expect(results[0].severity).toBe('warning');
  });

  it('passes when first paragraphs are substantial (40+ words)', () => {
    // generateGeoBody produces sections with substantial first paragraphs
    const body = generateGeoBody({ wordCount: 900, questionHeadings: 2, statementHeadings: 2 });
    const item = createItem({ body, contentType: 'blog' });
    const results = geoShortCitationBlocks.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// createGeoEntityRule
// ---------------------------------------------------------------------------
describe('createGeoEntityRule', () => {
  it('warns when brand not mentioned in 800+ word blog', () => {
    const rule = createGeoEntityRule('IJONIS', 'Hamburg');
    const body = generateGeoBody({ wordCount: 900 });
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    // Should warn for at least the brand name (and possibly city)
    expect(results.length).toBeGreaterThanOrEqual(1);
    const brandResult = results.find(r => r.message.includes('IJONIS'));
    expect(brandResult).toBeDefined();
    expect(brandResult!.rule).toBe('geo-low-entity-density');
    expect(brandResult!.severity).toBe('warning');
  });

  it('warns when city not mentioned in 800+ word blog', () => {
    const rule = createGeoEntityRule('IJONIS', 'Hamburg');
    const body = generateGeoBody({ wordCount: 900, brandMention: 'IJONIS' });
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    const cityResult = results.find(r => r.message.includes('Hamburg'));
    expect(cityResult).toBeDefined();
    expect(cityResult!.rule).toBe('geo-low-entity-density');
  });

  it('passes when brand is mentioned', () => {
    const rule = createGeoEntityRule('IJONIS', '');
    const body = generateGeoBody({ wordCount: 900, brandMention: 'IJONIS' });
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes when both brand and city are mentioned', () => {
    const rule = createGeoEntityRule('IJONIS', 'Hamburg');
    const body = generateGeoBody({ wordCount: 900, brandMention: 'IJONIS', cityMention: 'Hamburg' });
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips when brandName is empty string', () => {
    const rule = createGeoEntityRule('', '');
    const body = generateGeoBody({ wordCount: 900 });
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips non-blog content', () => {
    const rule = createGeoEntityRule('IJONIS', 'Hamburg');
    const body = generateGeoBody({ wordCount: 900 });
    const item = createItem({ body, contentType: 'page' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips short content (<800 words)', () => {
    const rule = createGeoEntityRule('IJONIS', 'Hamburg');
    const body = generateGeoBody({ wordCount: 500 });
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('checks brand independently of city', () => {
    const rule = createGeoEntityRule('IJONIS', 'Hamburg');
    const body = generateGeoBody({ wordCount: 900 });
    const item = createItem({ body, contentType: 'blog' });
    const results = rule.run(item, ctx);
    // Both brand and city missing -- should produce 2 results
    expect(results).toHaveLength(2);
    expect(results[0].message).toContain('IJONIS');
    expect(results[1].message).toContain('Hamburg');
  });
});
