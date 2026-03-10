import { describe, it, expect } from 'vitest';
import {
  blogMissingSchemaFields,
  faqpageSchemaReadiness,
  breadcrumblistSchemaReadiness,
  datasetSchemaReadiness,
  createSchemaSameAsRule,
  createServicePageSchemaRule,
} from '../../../src/rules/schema-rules.js';
import { createItem, createContext } from '../../helpers.js';

const ctx = createContext();

// ---------------------------------------------------------------------------
// blog-missing-schema-fields
// ---------------------------------------------------------------------------

describe('blog-missing-schema-fields', () => {
  it('skips non-blog content', () => {
    const item = createItem({ contentType: 'page' });
    expect(blogMissingSchemaFields.run(item, ctx)).toHaveLength(0);
  });

  it('warns for missing date', () => {
    const item = createItem({ date: undefined, author: 'Alice', updatedAt: '2024-01-01', image: '/img.jpg' });
    const results = blogMissingSchemaFields.run(item, ctx);
    expect(results.some(r => r.field === 'date')).toBe(true);
  });

  it('warns for missing author', () => {
    const item = createItem({ date: '2024-01-01', author: undefined, updatedAt: '2024-01-01', image: '/img.jpg' });
    const results = blogMissingSchemaFields.run(item, ctx);
    expect(results.some(r => r.field === 'author')).toBe(true);
  });

  it('warns for missing updatedAt', () => {
    const item = createItem({ date: '2024-01-01', author: 'Alice', updatedAt: undefined, image: '/img.jpg' });
    const results = blogMissingSchemaFields.run(item, ctx);
    expect(results.some(r => r.field === 'updatedAt')).toBe(true);
  });

  it('warns for missing image', () => {
    const item = createItem({ date: '2024-01-01', author: 'Alice', updatedAt: '2024-01-01', image: undefined });
    const results = blogMissingSchemaFields.run(item, ctx);
    expect(results.some(r => r.field === 'image')).toBe(true);
  });

  it('passes when all fields present', () => {
    const item = createItem({ date: '2024-01-01', author: 'Alice', updatedAt: '2024-06-01', image: '/img.jpg' });
    expect(blogMissingSchemaFields.run(item, ctx)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// faqpage-schema-readiness
// ---------------------------------------------------------------------------

describe('faqpage-schema-readiness', () => {
  it('skips content with no FAQ section', () => {
    const item = createItem({ body: 'Just some content without an FAQ.' });
    expect(faqpageSchemaReadiness.run(item, ctx)).toHaveLength(0);
  });

  it('warns when FAQ has fewer than 3 Q&A pairs', () => {
    const body = '## FAQ\n\n### What is SEO?\nSEO is search engine optimization.\n\n### What is GEO?\nGEO is generative engine optimization.';
    const item = createItem({ body });
    const results = faqpageSchemaReadiness.run(item, ctx);
    expect(results.some(r => r.message.includes('Q&A pairs'))).toBe(true);
  });

  it('warns when FAQ questions lack question marks', () => {
    const body = [
      '## FAQ',
      '### About SEO',
      'SEO stands for search engine optimization and helps websites rank better in search results.',
      '### About GEO',
      'GEO is generative engine optimization for AI search systems and citation engines.',
      '### About Content',
      'Content quality matters for both traditional and AI search engines in modern publishing.',
    ].join('\n\n');
    const item = createItem({ body });
    const results = faqpageSchemaReadiness.run(item, ctx);
    expect(results.some(r => r.message.includes('question marks'))).toBe(true);
  });

  it('passes with 3+ well-formed Q&A pairs', () => {
    const body = [
      '## FAQ',
      '### What is SEO?',
      'SEO is search engine optimization that improves web visibility and organic traffic rankings.',
      '### What is GEO?',
      'GEO is generative engine optimization designed for AI citation and snippet extraction systems.',
      '### How do they differ?',
      'SEO targets traditional search engines while GEO targets AI systems and language models specifically.',
    ].join('\n\n');
    const item = createItem({ body });
    expect(faqpageSchemaReadiness.run(item, ctx)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// breadcrumblist-schema-readiness
// ---------------------------------------------------------------------------

describe('breadcrumblist-schema-readiness', () => {
  it('warns when both categories and category are absent', () => {
    const item = createItem({ categories: undefined, category: undefined });
    const results = breadcrumblistSchemaReadiness.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('breadcrumblist-schema-readiness');
  });

  it('warns when categories is empty array', () => {
    const item = createItem({ categories: [], category: undefined });
    const results = breadcrumblistSchemaReadiness.run(item, ctx);
    expect(results).toHaveLength(1);
  });

  it('passes when categories array is populated', () => {
    const item = createItem({ categories: ['tech'] });
    expect(breadcrumblistSchemaReadiness.run(item, ctx)).toHaveLength(0);
  });

  it('passes when category string is set', () => {
    const item = createItem({ category: 'tech', categories: undefined });
    expect(breadcrumblistSchemaReadiness.run(item, ctx)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// dataset-schema-readiness
// ---------------------------------------------------------------------------

describe('dataset-schema-readiness', () => {
  const tableBody = 'Some content.\n\n| Col A | Col B |\n|-------|-------|\n| 1 | 2 |';

  it('skips blog content', () => {
    const item = createItem({ contentType: 'blog', body: tableBody });
    expect(datasetSchemaReadiness.run(item, ctx)).toHaveLength(0);
  });

  it('skips content without a markdown table', () => {
    const item = createItem({ contentType: 'project', body: 'No table here.' });
    expect(datasetSchemaReadiness.run(item, ctx)).toHaveLength(0);
  });

  it('warns when description is too short', () => {
    const item = createItem({
      contentType: 'project',
      body: tableBody,
      description: 'Short.',
      date: '2024-01-01',
    });
    const results = datasetSchemaReadiness.run(item, ctx);
    expect(results.some(r => r.field === 'description')).toBe(true);
  });

  it('warns when date is missing', () => {
    const item = createItem({
      contentType: 'page',
      body: tableBody,
      description: 'A sufficiently long description that meets the minimum character requirement for dataset schema validation purposes.',
      date: undefined,
    });
    const results = datasetSchemaReadiness.run(item, ctx);
    expect(results.some(r => r.field === 'date')).toBe(true);
  });

  it('passes when description is long enough and date present', () => {
    const item = createItem({
      contentType: 'project',
      body: tableBody,
      description: 'A sufficiently long description that meets the minimum character requirement for dataset schema validation purposes.',
      date: '2024-01-01',
    });
    expect(datasetSchemaReadiness.run(item, ctx)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// seo-schema-sameas-incomplete
// ---------------------------------------------------------------------------

describe('seo-schema-sameas-incomplete', () => {
  it('skips when organizationSameAs is undefined', () => {
    const rule = createSchemaSameAsRule(undefined);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('skips when organizationSameAs is empty array', () => {
    const rule = createSchemaSameAsRule([]);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('warns when organizationSameAs has only 1 entry', () => {
    const rule = createSchemaSameAsRule(['https://linkedin.com/company/acme']);
    const item = createItem();
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('seo-schema-sameas-incomplete');
    expect(results[0].severity).toBe('warning');
  });

  it('passes when organizationSameAs has 2+ entries', () => {
    const rule = createSchemaSameAsRule([
      'https://linkedin.com/company/acme',
      'https://github.com/acme',
    ]);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('fires only once across multiple items', () => {
    const rule = createSchemaSameAsRule(['https://linkedin.com/company/acme']);
    const item1 = createItem({ slug: 'post-1' });
    const item2 = createItem({ slug: 'post-2' });
    const r1 = rule.run(item1, ctx);
    const r2 = rule.run(item2, ctx);
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// seo-service-page-no-schema
// ---------------------------------------------------------------------------

describe('seo-service-page-no-schema', () => {
  it('skips when no service page patterns configured', () => {
    const rule = createServicePageSchemaRule(undefined);
    const item = createItem({ permalink: '/services/web-design' });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('skips when service page patterns is empty', () => {
    const rule = createServicePageSchemaRule([]);
    const item = createItem({ permalink: '/services/web-design' });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('warns when permalink matches a service pattern', () => {
    const rule = createServicePageSchemaRule(['/services/', '/leistungen/']);
    const item = createItem({
      permalink: '/services/web-design',
      contentType: 'page',
    });
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('seo-service-page-no-schema');
    expect(results[0].severity).toBe('warning');
  });

  it('warns when permalink matches German service pattern', () => {
    const rule = createServicePageSchemaRule(['/services/', '/leistungen/']);
    const item = createItem({
      permalink: '/leistungen/webentwicklung',
      contentType: 'page',
    });
    expect(rule.run(item, ctx)).toHaveLength(1);
  });

  it('does not warn for non-matching pages', () => {
    const rule = createServicePageSchemaRule(['/services/']);
    const item = createItem({
      permalink: '/about',
      contentType: 'page',
    });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('does not warn for blog posts even if URL matches', () => {
    const rule = createServicePageSchemaRule(['/services/']);
    const item = createItem({
      permalink: '/blog/my-post',
      contentType: 'blog',
    });
    expect(rule.run(item, ctx)).toHaveLength(0);
  });
});
