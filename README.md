# @ijonis/geo-lint

**The first open-source linter for GEO (Generative Engine Optimization). Validates your content for AI search visibility -- then lets your AI agent fix it automatically.**

[![npm version](https://img.shields.io/npm/v/@ijonis/geo-lint)](https://www.npmjs.com/package/@ijonis/geo-lint)
[![CI](https://img.shields.io/github/actions/workflow/status/ijonis/geo-lint/ci.yml?branch=main&label=CI)](https://github.com/IJONIS/geo-lint/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/IJONIS/geo-lint/blob/main/LICENSE)

---

## Why this exists

**GEO (Generative Engine Optimization)** is the practice of structuring content so AI search engines cite it -- ChatGPT, Perplexity, Google AI Overviews, Gemini. Traditional SEO gets you into search result lists. GEO gets you **cited in AI-generated answers**. They require different content patterns, and no existing open-source tool checks for GEO.

`@ijonis/geo-lint` is built for an agentic workflow: your AI agent runs the linter, reads the JSON violations, fixes the content, and re-lints until clean. Every rule ships with a machine-readable `suggestion` and `fixStrategy` that agents consume directly.

**92 rules: 35 GEO, 32 SEO, 14 content quality, 8 technical, 3 i18n.** Readability analysis inspired by Yoast SEO. Zero open-source alternatives for the GEO checks.

---

## Quick Start

```bash
npm install -D @ijonis/geo-lint
```

Create `geo-lint.config.ts`:

```typescript
import { defineConfig } from '@ijonis/geo-lint';

export default defineConfig({
  siteUrl: 'https://your-site.com',
  contentPaths: [{
    dir: 'content/blog',
    type: 'blog',
    urlPrefix: '/blog/',
  }],
});
```

Run it:

```bash
npx geo-lint                  # Human-readable output
npx geo-lint --format=json    # Machine-readable for AI agents
```

Works out of the box with `.md`/`.mdx` files. For Astro, HTML, or other formats, see [Custom Adapters](docs/custom-adapters.md).

---

## GEO in Action

Three examples of what GEO rules catch and how to fix them. See [all 7 core GEO rules with examples](docs/geo-rules.md).

### `geo-weak-lead-sentences`

AI systems use the first sentence after a heading as the citation snippet. Filler openings get skipped.

**Before:**
```markdown
## What is serverless computing?

In this section, we will take a closer look at serverless computing and
what it means for modern development teams.
```

**After:**
```markdown
## What is serverless computing?

Serverless computing is a cloud execution model where the provider
dynamically allocates compute resources per request, eliminating the
need to provision or manage servers.
```

### `geo-low-citation-density`

AI answers prefer citable claims backed by numbers. Vague statements get passed over.

**Before:**
```markdown
Adopting TypeScript significantly reduces bugs in large codebases.
```

**After:**
```markdown
Adopting TypeScript reduces production bugs by 38% in codebases
exceeding 50,000 lines of code, according to a 2023 study by
Microsoft Research.
```

### `geo-missing-table`

Tables are highly structured and unambiguous -- ideal for AI extraction. Content with comparison tables is cited significantly more often than equivalent prose.

**Before:**
```markdown
React is component-based and uses a virtual DOM. Vue is also
component-based but uses a reactivity system. Svelte compiles
components at build time.
```

**After:**
```markdown
| Framework | Architecture     | Bundle Size | Learning Curve |
|-----------|------------------|-------------|----------------|
| React     | Virtual DOM      | 42 KB       | Moderate       |
| Vue       | Reactivity proxy | 33 KB       | Low            |
| Svelte    | Compile-time     | 1.6 KB      | Low            |
```

---

## All 92 Rules

| Category | Rules | Severity Mix | Focus |
|----------|-------|-------------|-------|
| SEO | 32 | 6 errors, 26 warnings | Titles, descriptions, headings, slugs, OG images, canonical URLs, keywords, links, schema |
| Content | 14 | 2 errors, 12 warnings | Word count, readability, dates, categories, jargon density, repetition, vocabulary diversity, transition words, sentence variety |
| Technical | 8 | 3 errors, 5 warnings | Broken links, image files, trailing slashes, external URLs, performance |
| i18n | 3 | 0 errors, 3 warnings | Translation pairs, locale metadata |
| GEO | 35 | 0 errors, 35 warnings | AI citation readiness: E-E-A-T signals, content structure, freshness, RAG optimization |

See the [complete rule reference](docs/rules.md) with descriptions and severity for every rule.

---

## Works With

**AI agents**: Claude Code, Cursor, Windsurf, GitHub Copilot -- any agent that can run shell commands and edit files

**Content formats**: Markdown and MDX out of the box. Astro, HTML, Nuxt, any CMS via [custom adapters](docs/custom-adapters.md)

**Build tools**: Runs in any CI pipeline. JSON output for programmatic consumption

**Runtime**: Node.js >= 18. Zero peer dependencies

---

## Agent-First Design

This linter is a **rule engine for AI agents**, not a reporting tool for humans. The agent runs it, reads the structured output, fixes every violation, and re-lints until the content is clean.

```bash
npx geo-lint --format=json
```

```json
[
  {
    "file": "blog/my-post",
    "field": "body",
    "rule": "geo-no-question-headings",
    "severity": "warning",
    "message": "Only 1/5 (20%) H2/H3 headings are question-formatted",
    "suggestion": "Rephrase some headings as questions (e.g., 'How does X work?') to improve LLM snippet extraction."
  }
]
```

Every violation includes:
- **`suggestion`** -- plain-language fix instruction the agent follows directly
- **`fixStrategy`** -- machine-readable fix pattern for the rule
- **`file`, `field`, `line`** -- exact location so the agent edits the right place

Discover all rules and their fix strategies:

```bash
npx geo-lint --rules
```

See the full [Agent Integration Guide](docs/agent-integration.md) for workflows, a Claude Code skill template, and handling edge cases.

---

## Configuration

Override any rule's severity or disable it entirely:

```typescript
import { defineConfig } from '@ijonis/geo-lint';

export default defineConfig({
  siteUrl: 'https://your-site.com',
  contentPaths: [{ dir: 'content/blog', type: 'blog', urlPrefix: '/blog/' }],
  rules: {
    'geo-missing-table': 'off',     // disable a rule
    'orphan-content': 'error',      // upgrade to error
  },
});
```

See the full [Configuration Reference](docs/configuration.md) for all options, thresholds, and GEO-specific settings.

---

## Extend It

### Custom Adapters

Lint any content source -- Astro, HTML, a headless CMS -- by writing a small adapter:

```typescript
import { lint, createAdapter } from '@ijonis/geo-lint';

const adapter = createAdapter(async (projectRoot) => {
  // Map your content into ContentItem objects
  return [{ title, slug, description, body, permalink, contentType, filePath, rawContent }];
});

await lint({ adapter });
```

See the [Custom Adapters Guide](docs/custom-adapters.md) for the full `ContentItem` interface and ready-to-use examples for Astro, HTML, and CMS sources.

### Programmatic API

```typescript
import { lint, lintQuiet } from '@ijonis/geo-lint';

const exitCode = await lint({ format: 'json' });          // with console output
const results = await lintQuiet({ projectRoot: '.' });     // raw LintResult[]
```

See the [API Reference](docs/api.md) for all options and types.

---

## CLI Reference

```
Usage:
  geo-lint [options]

Options:
  --root=<path>     Project root directory (default: cwd)
  --config=<path>   Explicit config file path
  --format=pretty   Human-readable colored output (default)
  --format=json     Machine-readable JSON output (for AI agents)
  --rules           List all registered rules with fix strategies
  -h, --help        Show this help message
  -v, --version     Show version
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing, and how to add new rules. Changes are tracked in the [CHANGELOG](CHANGELOG.md).

## License

[MIT](LICENSE)

---

Built by [IJONIS](https://ijonis.com) -- we help companies become visible to AI search engines. This linter is extracted from the same toolchain we use on production client content.
