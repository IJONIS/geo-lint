import { defineConfig } from '../../src/config/loader.js';

export default defineConfig({
  siteUrl: 'https://example.com',
  contentPaths: [
    {
      dir: 'tests/fixtures/content/blog',
      type: 'blog',
      urlPrefix: '/blog/',
    },
    {
      dir: 'tests/fixtures/content/pages',
      type: 'page',
      urlPrefix: '/',
    },
  ],
  staticRoutes: ['/about', '/contact', '/blog'],
  imageDirectories: [],
  categories: ['ki-strategie'],
  geo: {
    brandName: 'TestBrand',
    brandCity: 'Berlin',
  },
});
