/**
 * Integration test: end-to-end lint against fixtures
 */
import { describe, it, expect } from 'vitest';
import { lintQuiet } from '../../src/index.js';

describe('lint integration', () => {
  const projectRoot = new URL('../fixtures', import.meta.url).pathname;

  it('returns results for bad-post fixture', async () => {
    const results = await lintQuiet({
      projectRoot,
      config: {
        siteUrl: 'https://example.com',
        contentPaths: [
          { dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' },
        ],
        staticRoutes: ['/about', '/contact'],
        categories: ['ki-strategie'],
        geo: { brandName: 'TestBrand', brandCity: 'Berlin' },
      },
    });

    // bad-post has a short title ("Short") and short description ("Too short")
    const badPostResults = results.filter(r => r.file.includes('bad-post'));
    expect(badPostResults.length).toBeGreaterThan(0);

    // Should flag title-too-short
    const titleRule = badPostResults.find(r => r.rule === 'title-too-short');
    expect(titleRule).toBeDefined();
    expect(titleRule?.severity).toBe('warning');
  });

  it('returns fewer results for good-post fixture', async () => {
    const results = await lintQuiet({
      projectRoot,
      config: {
        siteUrl: 'https://example.com',
        contentPaths: [
          { dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' },
        ],
        staticRoutes: ['/about', '/contact'],
        categories: ['ki-strategie'],
        geo: { brandName: 'TestBrand', brandCity: 'Berlin' },
      },
    });

    const goodResults = results.filter(r => r.file.includes('good-post'));
    const badResults = results.filter(r => r.file.includes('bad-post'));

    // Good post should have fewer violations than bad post
    expect(goodResults.length).toBeLessThan(badResults.length);
  });

  it('excludes slugs listed in excludeSlugs', async () => {
    const results = await lintQuiet({
      projectRoot,
      config: {
        siteUrl: 'https://example.com',
        contentPaths: [
          { dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' },
        ],
        excludeSlugs: ['bad-post'],
        geo: { brandName: '', brandCity: '' },
      },
    });

    const badPostResults = results.filter(r => r.file.includes('bad-post'));
    expect(badPostResults.length).toBe(0);
  });

  it('respects rule overrides to disable rules', async () => {
    const results = await lintQuiet({
      projectRoot,
      config: {
        siteUrl: 'https://example.com',
        contentPaths: [
          { dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' },
        ],
        rules: { 'title-too-short': 'off', 'description-too-short': 'off' },
        geo: { brandName: '', brandCity: '' },
      },
    });

    const titleShort = results.find(r => r.rule === 'title-too-short');
    expect(titleShort).toBeUndefined();
  });

  it('all results have required fields', async () => {
    const results = await lintQuiet({
      projectRoot,
      config: {
        siteUrl: 'https://example.com',
        contentPaths: [
          { dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' },
        ],
        geo: { brandName: '', brandCity: '' },
      },
    });

    for (const result of results) {
      expect(result.file).toBeDefined();
      expect(result.field).toBeDefined();
      expect(result.rule).toBeDefined();
      expect(result.severity).toMatch(/^(error|warning)$/);
      expect(result.message).toBeDefined();
    }
  });
});
