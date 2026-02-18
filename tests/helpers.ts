import type { ContentItem, RuleContext, ContentType } from '../src/types.js';

/** Create a minimal ContentItem for testing. Override any field via options. */
export function createItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    title: 'Test Blog Post Title That Is Long Enough',
    slug: 'test-post',
    description: 'A test description that is long enough for validation rules to pass without warnings.',
    permalink: '/blog/test-post',
    contentType: 'blog' as ContentType,
    filePath: '/content/blog/test-post.mdx',
    rawContent: '---\ntitle: Test\n---\nBody',
    body: 'This is the body content of the test blog post.',
    ...overrides,
  };
}

/** Create a minimal RuleContext for testing */
export function createContext(overrides: Partial<RuleContext> = {}): RuleContext {
  return {
    allContent: [],
    validSlugs: new Set<string>(['/blog/test-post', '/about', '/contact']),
    validImages: new Set<string>(['/images/test.jpg']),
    ...overrides,
  };
}

/** Generate a body with a specified word count (approx) */
export function generateBody(wordCount: number): string {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    words.push('word');
  }
  return words.join(' ');
}

/** Generate a blog body with headings, good for GEO rule testing */
export function generateGeoBody(options: {
  wordCount?: number;
  questionHeadings?: number;
  statementHeadings?: number;
  includeStats?: boolean;
  includeFaq?: boolean;
  includeTable?: boolean;
  brandMention?: string;
  cityMention?: string;
} = {}): string {
  const {
    wordCount = 600,
    questionHeadings = 2,
    statementHeadings = 2,
    includeStats = true,
    includeFaq = false,
    includeTable = false,
    brandMention,
    cityMention,
  } = options;

  const sections: string[] = [];

  // Question headings
  for (let i = 0; i < questionHeadings; i++) {
    sections.push(`## What is topic ${i + 1}?`);
    sections.push(`Topic ${i + 1} is a comprehensive subject that covers many aspects of modern technology and business practices. This paragraph provides a direct answer to the heading question with at least forty words to satisfy citation block requirements for GEO optimization testing purposes.`);
  }

  // Statement headings
  for (let i = 0; i < statementHeadings; i++) {
    sections.push(`## Topic ${i + 1} Overview`);
    sections.push(`This section covers the overview of topic ${i + 1} with detailed analysis and comprehensive information about the subject matter that is relevant to our discussion and analysis of the content.`);
  }

  if (includeStats) {
    sections.push('According to recent studies, 73% of businesses have adopted AI tools. The market grew by $4.2 billion in 2024, representing a 45% increase year-over-year.');
  }

  if (brandMention) {
    sections.push(`${brandMention} provides leading solutions in this space.`);
  }
  if (cityMention) {
    sections.push(`Based in ${cityMention}, the company serves clients worldwide.`);
  }

  if (includeFaq) {
    sections.push('## FAQ\n\n### What is this about?\nThis is about testing.\n\n### How does it work?\nIt works by validating content.');
  }

  if (includeTable) {
    sections.push('| Feature | Status |\n|---------|--------|\n| SEO | Active |\n| GEO | Active |');
  }

  let body = sections.join('\n\n');

  // Pad to target word count
  const currentWords = body.split(/\s+/).length;
  if (currentWords < wordCount) {
    const padding = Array(wordCount - currentWords).fill('additional').join(' ');
    body += '\n\n' + padding;
  }

  return body;
}
