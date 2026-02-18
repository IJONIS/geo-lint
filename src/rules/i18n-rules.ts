/**
 * Internationalization Validation Rules
 * Validates translation pairs and locale metadata for bilingual content
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Rule: Blog/project content with translationKey must have both DE and EN versions
 */
export const translationPairMissing: Rule = {
  name: 'translation-pair-missing',
  severity: 'warning',
  category: 'i18n',
  fixStrategy: 'Create the missing translation version with the same translationKey',
  run: (item: ContentItem, context: RuleContext): LintResult[] => {
    // Only applies to blog and project content
    if (item.contentType === 'page') return [];
    if (!item.translationKey) return [];

    const siblings = context.allContent.filter(
      c => c.translationKey === item.translationKey && c.slug !== item.slug
    );

    const locales = new Set([item.locale, ...siblings.map(s => s.locale)]);
    const results: LintResult[] = [];

    if (item.locale === 'de' && !locales.has('en')) {
      results.push({
        file: getDisplayPath(item),
        field: 'translationKey',
        rule: 'translation-pair-missing',
        severity: 'warning',
        message: `Missing English translation for translationKey "${item.translationKey}"`,
        suggestion: 'Create an English (.en.mdx) version with the same translationKey',
      });
    }

    if (item.locale === 'en' && !locales.has('de')) {
      results.push({
        file: getDisplayPath(item),
        field: 'translationKey',
        rule: 'translation-pair-missing',
        severity: 'warning',
        message: `Missing German translation for translationKey "${item.translationKey}"`,
        suggestion: 'Create a German (.de.mdx) version with the same translationKey',
      });
    }

    return results;
  },
};

/**
 * Rule: Blog/project content should have a locale field
 */
export const missingLocale: Rule = {
  name: 'missing-locale',
  severity: 'warning',
  category: 'i18n',
  fixStrategy: 'Add a locale field ("de" or "en") to the frontmatter',
  run: (item: ContentItem): LintResult[] => {
    // Only applies to blog and project content
    if (item.contentType === 'page') return [];

    if (!item.locale) {
      return [{
        file: getDisplayPath(item),
        field: 'locale',
        rule: 'missing-locale',
        severity: 'warning',
        message: 'Missing locale field',
        suggestion: 'Add a locale field ("de" or "en") to the frontmatter for proper i18n support',
      }];
    }
    return [];
  },
};

/**
 * All i18n rules
 */
export const i18nRules: Rule[] = [
  translationPairMissing,
  missingLocale,
];
