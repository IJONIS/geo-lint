/**
 * Rule Registry
 * Builds the complete rule set from configuration and provides runner functions
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import type { GeoLintConfig } from '../config/types.js';
import type { LinkExtractor } from '../utils/link-extractor.js';

// Static rule imports
import { titleRules } from './title-rules.js';
import { descriptionRules } from './description-rules.js';
import { duplicateRules } from './duplicate-rules.js';
import { headingRules } from './heading-rules.js';
import { imageRules } from './image-rules.js';
import { contentRules } from './content-rules.js';
import { ogRules } from './og-rules.js';
import { performanceRules } from './performance-rules.js';
import { robotsRules } from './robots-rules.js';
import { slugRules } from './slug-rules.js';
import { createI18nRules } from './i18n-rules.js';
import { dateRules } from './date-rules.js';
import { schemaRules } from './schema-rules.js';
import { keywordCoherenceRules } from './keyword-coherence-rules.js';

// Factory rule imports
import { createLinkRules } from './link-rules.js';
import { createExternalLinkRules } from './external-link-rules.js';
import { createOrphanRules } from './orphan-rules.js';
import { createGeoRules } from './geo-rules.js';
import { createCategoryRules } from './category-rules.js';
import { createCanonicalRules } from './canonical-rules.js';

// GEO advanced rule imports
import { createGeoEeatRules } from './geo-eeat-rules.js';
import { geoStructureRules } from './geo-structure-rules.js';
import { createGeoFreshnessRules } from './geo-freshness-rules.js';
import { createGeoRagRules } from './geo-rag-rules.js';

/**
 * Build the complete rule set from config and link extractor
 */
export function buildRules(config: GeoLintConfig, linkExtractor: LinkExtractor): Rule[] {
  const rules: Rule[] = [
    ...titleRules,
    ...descriptionRules,
    ...duplicateRules,
    ...headingRules,
    ...createLinkRules(linkExtractor),
    ...createExternalLinkRules(linkExtractor),
    ...imageRules,
    ...contentRules,
    ...ogRules,
    ...performanceRules,
    ...createOrphanRules(linkExtractor),
    ...robotsRules,
    ...slugRules,
    ...createI18nRules(config.i18n),
    ...dateRules,
    ...(config.categories.length > 0 ? createCategoryRules(config.categories) : []),
    ...schemaRules,
    ...createGeoRules(config.geo),
    ...createGeoEeatRules(config.geo),
    ...geoStructureRules,
    ...createGeoFreshnessRules(config.geo),
    ...createGeoRagRules(config.geo),
    ...keywordCoherenceRules,
    ...createCanonicalRules(config.siteUrl),
  ];

  // Apply user rule overrides (severity changes + disabling)
  return rules.map(rule => applyRuleOverride(rule, config.rules));
}

/**
 * Apply a user-configured severity override to a rule.
 * 'off' disables the rule by replacing its run function with a no-op.
 */
function applyRuleOverride(
  rule: Rule,
  overrides: Record<string, 'error' | 'warning' | 'off'>
): Rule {
  const override = overrides[rule.name];
  if (!override) return rule;
  if (override === 'off') return { ...rule, run: () => [] };
  return { ...rule, severity: override };
}

/**
 * Run a single rule against a content item (with error isolation)
 */
export function runRule(rule: Rule, item: ContentItem, context: RuleContext): LintResult[] {
  try {
    return rule.run(item, context);
  } catch (error) {
    console.error(`Rule ${rule.name} failed on ${item.slug}:`, error);
    return [];
  }
}

/**
 * Run all provided rules against a single content item
 */
export function runRulesOnItem(
  item: ContentItem,
  context: RuleContext,
  rules: Rule[]
): LintResult[] {
  const results: LintResult[] = [];

  for (const rule of rules) {
    const ruleResults = runRule(rule, item, context);
    results.push(...ruleResults);
  }

  return results;
}

/**
 * Run all provided rules against all content items
 */
export function runAllRules(
  items: ContentItem[],
  context: RuleContext,
  rules: Rule[]
): LintResult[] {
  const results: LintResult[] = [];

  for (const item of items) {
    const itemResults = runRulesOnItem(item, context, rules);
    results.push(...itemResults);
  }

  return results;
}

// Re-export static rules for selective use
export { titleRules } from './title-rules.js';
export { descriptionRules } from './description-rules.js';
export { duplicateRules } from './duplicate-rules.js';
export { headingRules } from './heading-rules.js';
export { imageRules } from './image-rules.js';
export { contentRules } from './content-rules.js';
export { ogRules } from './og-rules.js';
export { performanceRules } from './performance-rules.js';
export { robotsRules } from './robots-rules.js';
export { slugRules } from './slug-rules.js';
export { i18nRules, createI18nRules } from './i18n-rules.js';
export { dateRules } from './date-rules.js';
export { schemaRules } from './schema-rules.js';
export { keywordCoherenceRules } from './keyword-coherence-rules.js';
export { geoStaticRules, geoRules } from './geo-rules.js';

// Re-export factory functions for selective use
export { createLinkRules } from './link-rules.js';
export { createExternalLinkRules } from './external-link-rules.js';
export { createOrphanRules } from './orphan-rules.js';
export { createGeoRules, createGeoEntityRule } from './geo-rules.js';
export { createCategoryRules } from './category-rules.js';
export { createCanonicalRules } from './canonical-rules.js';

// GEO advanced rule re-exports
export { geoEeatStaticRules, createGeoEeatRules } from './geo-eeat-rules.js';
export { geoStructureRules } from './geo-structure-rules.js';
export { geoFreshnessStaticRules, createGeoFreshnessRules } from './geo-freshness-rules.js';
export { geoRagStaticRules, createGeoRagRules } from './geo-rag-rules.js';
