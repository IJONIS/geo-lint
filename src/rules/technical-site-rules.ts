/**
 * Technical Site-Level Rules
 * Validates site-wide technical requirements for AI citation optimization
 */

import type { Rule, ContentItem, LintResult, RuleContext } from '../types.js';
import type { TechnicalConfig } from '../config/types.js';

/**
 * Rule: Site should have at least one RSS/Atom/JSON feed
 * Config-level check — runs once per lint (fires on first item only)
 */
export function createNoFeedRule(
  feedUrls: string[] | undefined
): Rule {
  let hasFired = false;

  return {
    name: 'technical-no-feed',
    severity: 'warning',
    category: 'technical',
    fixStrategy:
      'Add an RSS or JSON feed endpoint exposing blog posts with full content.',
    run: (_item: ContentItem, _context: RuleContext): LintResult[] => {
      if (hasFired) return [];
      hasFired = true;

      // undefined = not configured, skip silently
      if (feedUrls === undefined) return [];

      // Empty array = user declared they have no feeds — flag it
      if (feedUrls.length === 0) {
        return [
          {
            file: '_site',
            field: 'feed',
            rule: 'technical-no-feed',
            severity: 'warning',
            message:
              'No RSS/Atom/JSON feed detected — AI systems lose a structured ingestion path',
            suggestion:
              'Feeds provide a structured ingestion path for AI systems beyond crawler discovery. Add an RSS or JSON feed endpoint.',
          },
        ];
      }

      return [];
    },
  };
}

/**
 * Rule: Site should have a /llms.txt endpoint
 * Config-level check — runs once per lint (fires on first item only)
 */
export function createNoLlmsTxtRule(
  llmsTxtUrl: string | undefined
): Rule {
  let hasFired = false;

  return {
    name: 'technical-no-llms-txt',
    severity: 'warning',
    category: 'technical',
    fixStrategy:
      'Create a /llms.txt endpoint that maps your most important content for LLM consumption in Markdown format.',
    run: (_item: ContentItem, _context: RuleContext): LintResult[] => {
      if (hasFired) return [];
      hasFired = true;

      // undefined = not configured, skip silently
      if (llmsTxtUrl === undefined) return [];

      // Empty string = user declared they don't have llms.txt — flag it
      if (llmsTxtUrl.trim() === '') {
        return [
          {
            file: '_site',
            field: 'llms-txt',
            rule: 'technical-no-llms-txt',
            severity: 'warning',
            message:
              'No /llms.txt endpoint detected — missing the emerging standard for LLM content declaration',
            suggestion:
              'llms.txt is the robots.txt equivalent for AI — trivial to add, future-proofs your site for LLM crawlers.',
          },
        ];
      }

      return [];
    },
  };
}

/** Build the complete technical site-level rule set from config */
export function createTechnicalSiteRules(technical: TechnicalConfig): Rule[] {
  return [
    createNoFeedRule(technical.feedUrls),
    createNoLlmsTxtRule(technical.llmsTxtUrl),
  ];
}
