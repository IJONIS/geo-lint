import { defineConfig } from './src/config/loader.js';

export default defineConfig({
  siteUrl: 'https://example.com',
  contentPaths: [
    {
      dir: 'content/blog',
      type: 'blog',
      urlPrefix: '/blog/',
    },
    {
      dir: 'content/pages',
      type: 'page',
      urlPrefix: '/',
    },
    {
      dir: 'content/projects',
      type: 'project',
      urlPrefix: '/projects/',
    },
  ],
  staticRoutes: ['/about', '/contact', '/blog'],
  imageDirectories: ['public/images'],
  categories: ['ki-strategie'],
  geo: {
    brandName: 'TestBrand',
    brandCity: 'Berlin',
  },
});
