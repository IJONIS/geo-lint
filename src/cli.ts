#!/usr/bin/env node

/**
 * @ijonis/geo-lint CLI
 * Command-line interface for the SEO/GEO content linter
 */

import { createRequire } from 'node:module';
import { lint } from './index.js';
import { loadConfig } from './config/loader.js';
import { DEFAULT_CONFIG } from './config/defaults.js';
import { buildRules } from './rules/index.js';
import type { GeoLintConfig } from './config/types.js';
import { createLinkExtractor } from './utils/link-extractor.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const args = process.argv.slice(2);

function getFlag(name: string): string | undefined {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg?.split('=').slice(1).join('=');
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`) || args.includes(`-${name.charAt(0)}`);
}

function printHelp(): void {
  console.log(`
@ijonis/geo-lint — SEO & GEO linter for Markdown/MDX content

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

Examples:
  geo-lint                          # Lint with default config
  geo-lint --format=json            # JSON output for agent consumption
  geo-lint --rules                  # List all available rules
  geo-lint --root=./my-project      # Lint a different project
`);
}

function printVersion(): void {
  console.log(version);
}

async function printRules(): Promise<void> {
  const projectRoot = getFlag('root') ?? process.cwd();

  let config: GeoLintConfig;
  try {
    config = await loadConfig(projectRoot);
  } catch {
    config = { siteUrl: 'https://example.com', ...DEFAULT_CONFIG } as GeoLintConfig;
  }

  const linkExtractor = createLinkExtractor(config.siteUrl);
  const rules = buildRules(config, linkExtractor);

  const ruleList = rules.map(r => ({
    name: r.name,
    severity: r.severity,
    category: r.category ?? 'uncategorized',
    fixStrategy: r.fixStrategy ?? null,
  }));

  console.log(JSON.stringify(ruleList, null, 2));
}

async function main(): Promise<void> {
  if (hasFlag('help') || hasFlag('h')) {
    printHelp();
    process.exit(0);
  }

  if (hasFlag('version') || hasFlag('v')) {
    printVersion();
    process.exit(0);
  }

  if (hasFlag('rules')) {
    await printRules();
    process.exit(0);
  }

  const format = (getFlag('format') ?? 'pretty') as 'pretty' | 'json';
  const projectRoot = getFlag('root');

  const exitCode = await lint({ projectRoot, format });
  process.exit(exitCode);
}

main().catch(error => {
  console.error('geo-lint failed:', error.message);
  process.exit(1);
});
