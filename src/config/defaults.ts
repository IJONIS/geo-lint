/**
 * @ijonis/geo-lint Default Configuration
 */

import type { GeoLintConfig } from './types.js';

/** Default configuration values (no project-specific data) */
export const DEFAULT_CONFIG: Omit<GeoLintConfig, 'siteUrl'> = {
  contentPaths: [
    { dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' },
    { dir: 'content/pages', type: 'page', urlPrefix: '/' },
    { dir: 'content/projects', type: 'project', urlPrefix: '/projects/' },
  ],
  staticRoutes: [],
  imageDirectories: ['public/images'],
  categories: [],
  excludeSlugs: [],
  excludeCategories: ['legal'],
  geo: {
    brandName: '',
    brandCity: '',
    keywordsPath: '',
    fillerPhrases: [
      'in this article', 'in this post', 'in this guide',
      'in diesem artikel', 'in diesem beitrag',
      'welcome to', 'willkommen zu',
      'today we will', 'heute werden wir',
      "let me tell you", 'lass mich dir erzählen',
      "in today's world", 'in der heutigen welt',
      "it's no secret", 'es ist kein geheimnis',
      'in the ever-changing', 'in der sich ständig verändernden',
    ],
    extractionTriggers: [
      'key takeaway', 'in summary', 'the bottom line',
      'tl;dr', 'to summarize', 'in short', 'put simply',
      'the short answer', "here's what you need to know",
      'zusammenfassend', 'fazit', 'das wichtigste',
      'kurz gesagt', 'anders gesagt',
    ],
    acronymAllowlist: [
      'HTML', 'CSS', 'API', 'URL', 'SDK', 'CLI', 'UI', 'UX',
      'JSON', 'XML', 'HTTP', 'HTTPS', 'SQL', 'SEO', 'GEO', 'AEO',
      'AI', 'ML', 'LLM', 'FAQ', 'CMS', 'CRM', 'SaaS', 'B2B', 'B2C',
      'ROI', 'KPI', 'PDF', 'CEO', 'CTO', 'VP', 'HR', 'PR', 'IT',
      'US', 'EU', 'UK', 'DE', 'MDX', 'JSX', 'TSX', 'RSS', 'DNS',
    ],
    vagueHeadings: [
      'introduction', 'overview', 'background', 'details',
      'summary', 'conclusion', 'more', 'other', 'misc',
      'einleitung', 'überblick', 'hintergrund', 'details',
      'zusammenfassung', 'fazit', 'weiteres', 'sonstiges',
    ],
    genericAuthorNames: [
      'admin', 'administrator', 'team', 'editor', 'author',
      'webmaster', 'staff', 'contributor',
      'redaktion', 'redakteur', 'herausgeber',
    ],
    allowedHtmlTags: [
      'Callout', 'CalloutBox', 'Note', 'Warning', 'Tip',
      'CodeBlock', 'Image', 'Video', 'Embed', 'Tabs', 'Tab',
    ],
    enabledContentTypes: ['blog'],
  },
  i18n: {
    locales: ['de', 'en'],
    defaultLocale: 'de',
  },
  rules: {},
  thresholds: {
    title: { minLength: 30, maxLength: 60, warnLength: 55 },
    description: { minLength: 70, maxLength: 160, warnLength: 150 },
    slug: { maxLength: 75 },
    content: { minWordCount: 300, minReadabilityScore: 30 },
  },
};
