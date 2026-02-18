/**
 * @ijonis/geo-lint Reporter
 * Formats and outputs lint results with color-coding
 */

import type { LintResult, Severity } from './types.js';

/** ANSI color codes for terminal output */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
} as const;

export interface ReportSummary {
  errors: number;
  warnings: number;
  passed: number;
  total: number;
  excluded: number;
}

/** Group results by file path */
function groupByFile(results: LintResult[]): Map<string, LintResult[]> {
  const grouped = new Map<string, LintResult[]>();
  for (const result of results) {
    const existing = grouped.get(result.file) || [];
    existing.push(result);
    grouped.set(result.file, existing);
  }
  return grouped;
}

/** Format a single lint result line */
function formatResult(result: LintResult): string {
  const { red, yellow, dim, reset } = COLORS;
  const icon = result.severity === 'error' ? `${red}\u2717${reset}` : `${yellow}\u26A0${reset}`;
  const ruleTag = `${dim}[${result.rule}]${reset}`;

  let line = `    ${icon} ${ruleTag} ${result.message}`;

  if (result.line) {
    line += ` ${dim}(line ${result.line})${reset}`;
  }

  if (result.suggestion) {
    line += `\n      ${dim}\u2192 ${result.suggestion}${reset}`;
  }

  return line;
}

/** Print results grouped by severity */
function printResultsBySection(
  results: LintResult[],
  severity: Severity,
  label: string,
): void {
  const filtered = results.filter(r => r.severity === severity);
  if (filtered.length === 0) return;

  const { red, yellow, bold, reset } = COLORS;
  const color = severity === 'error' ? red : yellow;
  const grouped = groupByFile(filtered);

  console.log(`\n${color}${bold}${label} (${filtered.length}):${reset}\n`);

  for (const [file, fileResults] of grouped) {
    console.log(`  ${bold}${file}${reset}`);
    for (const result of fileResults) {
      console.log(formatResult(result));
    }
    console.log('');
  }
}

/** Print summary statistics */
function printSummary(summary: ReportSummary): void {
  const { red, yellow, green, bold, reset, dim } = COLORS;

  console.log(`${dim}${'─'.repeat(50)}${reset}`);
  console.log(`${bold}Summary:${reset}`);

  if (summary.errors > 0) {
    console.log(`  ${red}\u2717 ${summary.errors} error(s)${reset} ${dim}(build blocked)${reset}`);
  }
  if (summary.warnings > 0) {
    console.log(`  ${yellow}\u26A0 ${summary.warnings} warning(s)${reset}`);
  }
  if (summary.passed > 0) {
    console.log(`  ${green}\u2713 ${summary.passed} file(s) passed${reset}`);
  }
  if (summary.excluded > 0) {
    console.log(`  ${dim}\u2298 ${summary.excluded} file(s) excluded${reset}`);
  }

  console.log(`\n  ${dim}Total: ${summary.total} files checked${reset}\n`);
}

/** Format and output all lint results. Returns summary for exit code. */
export function formatResults(
  results: LintResult[],
  totalFiles: number,
  excludedFiles: number = 0,
): ReportSummary {
  const { bold, reset, cyan, green, dim } = COLORS;

  const errors = results.filter(r => r.severity === 'error').length;
  const warnings = results.filter(r => r.severity === 'warning').length;
  const filesWithIssues = new Set(results.map(r => r.file)).size;
  const passed = totalFiles - filesWithIssues;

  const summary: ReportSummary = { errors, warnings, passed, total: totalFiles, excluded: excludedFiles };

  console.log(`\n${cyan}${bold}GEO Lint Results${reset}`);
  console.log(`${cyan}${'═'.repeat(50)}${reset}`);

  if (results.length === 0) {
    console.log(`\n${green}${bold}\u2713 GEO Lint: All checks passed!${reset}\n`);
    console.log(`  ${dim}${totalFiles} files checked${reset}\n`);
    return summary;
  }

  printResultsBySection(results, 'error', 'ERRORS');
  printResultsBySection(results, 'warning', 'WARNINGS');
  printSummary(summary);

  return summary;
}

/** Format results as JSON for agent consumption */
export function formatResultsJson(results: LintResult[]): string {
  return JSON.stringify(results, null, 2);
}

/** Print a simple progress message */
export function printProgress(message: string): void {
  const { dim, reset } = COLORS;
  console.log(`${dim}${message}${reset}`);
}
