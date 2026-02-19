# Programmatic API

`@ijonis/geo-lint` exposes a programmatic API for use in scripts, CI pipelines, and custom tooling. Import from `@ijonis/geo-lint` directly.

---

## `lint()`

Runs the full linter with formatted console output (pretty or JSON). Returns a numeric exit code: `0` for clean, `1` when errors are found.

```typescript
import { lint } from '@ijonis/geo-lint';

const exitCode = await lint({
  projectRoot: './my-project',
  format: 'json',
});

process.exit(exitCode);
```

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `projectRoot` | `string` | No | Path to the project root. Defaults to `process.cwd()`. |
| `format` | `'pretty' \| 'json'` | No | Output format. Defaults to `'pretty'`. |
| `adapter` | `ContentAdapter` | No | Custom content adapter. When provided, `contentPaths` from config is bypassed. |

---

## `lintQuiet()`

Runs the linter and returns the raw `LintResult[]` array without printing anything to the console. Use this when you need to filter, transform, or aggregate results programmatically.

```typescript
import { lintQuiet } from '@ijonis/geo-lint';

const results = await lintQuiet({
  projectRoot: './my-project',
});

// Filter and process results programmatically
const geoViolations = results.filter(r => r.rule.startsWith('geo-'));
const errors = results.filter(r => r.severity === 'error');

console.log(`${geoViolations.length} GEO issues found`);
console.log(`${errors.length} errors (will block build)`);
```

`lintQuiet()` accepts the same options as `lint()` except `format` (there is no console output to format).

---

## `LintResult`

Every violation returned by `lint()` (in JSON mode) and `lintQuiet()` conforms to this interface:

```typescript
interface LintResult {
  file: string;          // Relative path (e.g., "blog/my-post")
  field: string;         // Field checked (e.g., "title", "body", "image")
  rule: string;          // Rule identifier (e.g., "geo-no-question-headings")
  severity: 'error' | 'warning';
  message: string;       // Human-readable violation description
  suggestion?: string;   // Actionable fix suggestion
  line?: number;         // Line number in source file (when applicable)
}
```

| Field | Description |
|-------|-------------|
| `file` | Content slug, not the full filesystem path. Resolve to the source file using your content directory structure. |
| `field` | Which part of the content triggered the rule -- `"title"`, `"description"`, `"body"`, `"image"`, etc. |
| `rule` | The kebab-case rule name. Use this to filter results by category (e.g., `r.rule.startsWith('geo-')`). |
| `severity` | `'error'` violations produce a non-zero exit code. `'warning'` violations do not. |
| `message` | Describes what the rule found. Written for both human and agent consumption. |
| `suggestion` | Plain-language fix instruction. Agents should follow this directly when editing the file. Not present on every result. |
| `line` | Source file line number, when the rule can pinpoint a specific location. Not present on every result. |

---

## `createAdapter()`

Factory function for building custom content adapters. Takes a function that receives the project root path and returns a `ContentItem[]` (or `Promise<ContentItem[]>`).

```typescript
import { createAdapter } from '@ijonis/geo-lint';

const adapter = createAdapter(async (projectRoot) => {
  // Load and map your content to ContentItem[]
  return [ /* ... */ ];
});
```

Pass the adapter to `lint()` or `lintQuiet()` via the `adapter` option. When an adapter is provided, the `contentPaths` configuration is bypassed -- the adapter is the sole content source.

For the full `ContentItem` interface and working examples (CMS, Astro, HTML, and more), see the [Custom Adapters guide](./custom-adapters.md).

---

[Back to main README](../README.md)
