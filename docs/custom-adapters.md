# Custom Adapters

By default, `@ijonis/geo-lint` scans `.md` and `.mdx` files with `gray-matter` frontmatter. **But you can lint any content source** -- Astro content collections, plain HTML, a headless CMS, a database -- by writing a small adapter that maps your content into `ContentItem` objects.

The adapter runs through the **programmatic API** (`lint()` / `lintQuiet()`), so you create a tiny wrapper script instead of calling the CLI directly. This takes ~20 lines for most setups.

---

## How it works

```
Your content (Astro, HTML, CMS, DB, ...)
  -> Adapter maps each page to a ContentItem
    -> geo-lint runs all 92 rules against those items
      -> JSON violations come back, agent fixes content
```

---

## The `ContentItem` contract

Every adapter must return an array of objects matching this interface. The required fields are what rules inspect:

```typescript
interface ContentItem {
  // Required -- rules depend on these
  title: string;           // Page/post title (SEO title rules)
  slug: string;            // URL slug (slug validation rules)
  description: string;     // Meta description (description rules)
  permalink: string;       // Full URL path, e.g. '/blog/my-post' (link validation)
  contentType: 'blog' | 'page' | 'project'; // Controls which rules apply
  filePath: string;        // Path to source file on disk (image path resolution)
  rawContent: string;      // Full file content including frontmatter/metadata
  body: string;            // Body content only (heading, readability, GEO rules)

  // Optional -- unlocks additional rules when provided
  image?: string;          // Featured/OG image path
  imageAlt?: string;       // Image alt text
  categories?: string[];   // Content categories
  date?: string;           // Publish date (freshness rules)
  updatedAt?: string;      // Last updated date
  author?: string;         // Author name (E-E-A-T rules)
  locale?: string;         // Locale code (i18n rules)
  translationKey?: string; // Links translated versions
  noindex?: boolean;       // noindex flag
  draft?: boolean;         // Draft flag (skipped by default adapter)
}
```

> **Tip:** Provide as many optional fields as you can. Each one unlocks rules that would otherwise be silently skipped.

---

## Example: CMS / API adapter

```typescript
import { lint, createAdapter } from '@ijonis/geo-lint';

const adapter = createAdapter(async (projectRoot) => {
  const posts = await fetchFromCMS();

  return posts.map(post => ({
    title: post.title,
    slug: post.slug,
    description: post.metaDescription,
    permalink: `/blog/${post.slug}`,
    body: post.markdownContent,
    contentType: 'blog' as const,
    filePath: `virtual/${post.slug}.mdx`,
    rawContent: post.markdownContent,
    image: post.featuredImage,
    imageAlt: post.featuredImageAlt,
    date: post.publishedAt,
    locale: post.language,
    categories: post.tags,
  }));
});

const exitCode = await lint({ adapter });
process.exit(exitCode);
```

---

## Example: Astro content collections

Astro stores content in `src/content/` with its own frontmatter schema. Write an adapter that reads the `.md`/`.mdx` files and maps Astro's frontmatter fields to `ContentItem`:

```typescript
// scripts/lint.ts
import { lint, createAdapter } from '@ijonis/geo-lint';
import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import matter from 'gray-matter';

const adapter = createAdapter((projectRoot) => {
  const contentDir = join(projectRoot, 'src/content/blog');
  const files = readdirSync(contentDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  return files.map(file => {
    const filePath = join(contentDir, file);
    const raw = readFileSync(filePath, 'utf-8');
    const { data: fm, content: body } = matter(raw);
    const slug = fm.slug ?? basename(file, '.mdx').replace(/\.md$/, '');

    return {
      title: fm.title ?? '',
      slug,
      description: fm.description ?? '',
      permalink: `/blog/${slug}`,
      contentType: 'blog' as const,
      filePath,
      rawContent: raw,
      body,
      image: fm.heroImage ?? fm.image,
      imageAlt: fm.heroImageAlt ?? fm.imageAlt,
      date: fm.pubDate ?? fm.date,
      updatedAt: fm.updatedDate,
      author: fm.author,
      categories: fm.tags ?? fm.categories,
      draft: fm.draft,
    };
  });
});

const exitCode = await lint({
  adapter,
  projectRoot: process.cwd(),
  format: 'json',
});
process.exit(exitCode);
```

Run it with:

```bash
npx tsx scripts/lint.ts
```

---

## Example: Static HTML site

For a static site with plain `.html` files (no frontmatter), extract metadata from `<title>`, `<meta>` tags, and the document body. A lightweight parser like `cheerio` does the job:

```typescript
// scripts/lint.ts
import { lint, createAdapter } from '@ijonis/geo-lint';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, basename } from 'path';
import * as cheerio from 'cheerio';

function findHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...findHtmlFiles(full));
    else if (entry.endsWith('.html')) results.push(full);
  }
  return results;
}

const adapter = createAdapter((projectRoot) => {
  const htmlFiles = findHtmlFiles(projectRoot);

  return htmlFiles.map(filePath => {
    const raw = readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(raw);

    const title = $('title').text() || '';
    const description = $('meta[name="description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogImageAlt = $('meta[property="og:image:alt"]').attr('content');
    const author = $('meta[name="author"]').attr('content');
    const body = $('main').html() ?? $('body').html() ?? '';
    const rel = relative(projectRoot, filePath);
    const slug = rel.replace(/\.html$/, '').replace(/\/index$/, '');

    return {
      title,
      slug,
      description,
      permalink: `/${slug}`,
      contentType: 'page' as const,
      filePath,
      rawContent: raw,
      body,
      image: ogImage,
      imageAlt: ogImageAlt,
      author,
    };
  });
});

const exitCode = await lint({
  adapter,
  projectRoot: process.cwd(),
  format: 'json',
});
process.exit(exitCode);
```

---

## Example: Astro `.astro` component pages

For `.astro` files that use embedded frontmatter (the `---` block at the top), extract the variables and template body:

```typescript
// scripts/lint.ts
import { lint, createAdapter } from '@ijonis/geo-lint';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

function findAstroFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...findAstroFiles(full));
    else if (entry.endsWith('.astro')) results.push(full);
  }
  return results;
}

function parseAstroFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const vars: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const assign = line.match(/(?:const|let)\s+(\w+)\s*=\s*['"](.+?)['"]/);
    if (assign) vars[assign[1]] = assign[2];
  }
  return vars;
}

const adapter = createAdapter((projectRoot) => {
  const pagesDir = join(projectRoot, 'src/pages');
  const files = findAstroFiles(pagesDir);

  return files.map(filePath => {
    const raw = readFileSync(filePath, 'utf-8');
    const vars = parseAstroFrontmatter(raw);
    const templateBody = raw.replace(/^---[\s\S]*?---/, '').trim();
    const rel = relative(pagesDir, filePath);
    const slug = rel.replace(/\.astro$/, '').replace(/\/index$/, '');

    return {
      title: vars.title ?? '',
      slug,
      description: vars.description ?? '',
      permalink: `/${slug}`,
      contentType: 'page' as const,
      filePath,
      rawContent: raw,
      body: templateBody,
      image: vars.ogImage,
      author: vars.author,
    };
  });
});

const exitCode = await lint({
  adapter,
  projectRoot: process.cwd(),
  format: 'json',
});
process.exit(exitCode);
```

---

## Tips for custom adapters

| Topic | Guidance |
|-------|----------|
| **`filePath` must be a real path** | Rules like `image-not-found` resolve image paths relative to `filePath`. Use the actual file path on disk, not a virtual one, whenever possible. |
| **`body` should be the renderable content** | Strip frontmatter, script blocks, and layout wrappers. Rules analyze headings, paragraphs, and links in the body. |
| **`rawContent` includes everything** | Some rules inspect the full file (frontmatter + body). Always pass the unmodified file content. |
| **`contentType` controls rule selection** | `'blog'` triggers date/author/category rules. `'page'` and `'project'` are lighter. Map your content to the closest match. |
| **Config still applies** | Your `geo-lint.config.ts` settings (`siteUrl`, `categories`, `imageDirectories`, `rules`, etc.) still apply. Only `contentPaths` is bypassed by the adapter. |
| **Combine with the default adapter** | You can lint MDX files via `contentPaths` in config AND additional content via a custom adapter in separate runs. |

---

## Let an AI agent write the adapter for you

If you are integrating geo-lint into a project that uses a non-standard content format, you can ask your AI agent to generate the adapter. Give it this prompt:

```
I want to lint my content with @ijonis/geo-lint but my site uses [Astro/HTML/Nuxt/etc.].
Create a scripts/lint.ts file with a custom adapter that:
1. Finds all content files in [describe your content directory]
2. Extracts title, description, slug, body from [describe your format]
3. Maps them to ContentItem objects
4. Runs lint() with JSON output

See the Custom Adapters section in the @ijonis/geo-lint README for the ContentItem interface
and examples. Use createAdapter() from '@ijonis/geo-lint'.
```

The agent will read your project structure, create the adapter, run it, and fix any violations it finds -- the standard agentic lint-fix loop works the same regardless of the content format.

---

[Back to main README](../README.md)
