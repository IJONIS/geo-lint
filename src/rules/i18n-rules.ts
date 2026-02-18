/**
 * Internationalization Validation Rules
 * Validates translation completeness, locale metadata, and hreflang x-default readiness
 */

import type { Rule, ContentItem, RuleContext, LintResult } from '../types.js';
import type { I18nConfig } from '../config/types.js';
import { getDisplayPath } from '../utils/display-path.js';

/**
 * Create a translation-pair-missing rule for the configured locales.
 * Checks that every translation group has versions for all configured locales.
 */
function createTranslationPairMissingRule(i18n: I18nConfig): Rule {
  return {
    name: 'translation-pair-missing',
    severity: 'warning',
    category: 'i18n',
    fixStrategy: 'Create the missing translation version with the same translationKey',
    run: (item: ContentItem, context: RuleContext): LintResult[] => {
      if (!item.translationKey) return [];
      if (!item.locale) return [];

      const siblings = context.allContent.filter(
        c => c.translationKey === item.translationKey && c.slug !== item.slug,
      );
      const presentLocales = new Set([item.locale, ...siblings.map(s => s.locale)]);
      const results: LintResult[] = [];

      for (const locale of i18n.locales) {
        if (!presentLocales.has(locale)) {
          results.push({
            file: getDisplayPath(item),
            field: 'translationKey',
            rule: 'translation-pair-missing',
            severity: 'warning',
            message: `Missing "${locale}" translation for translationKey "${item.translationKey}"`,
            suggestion: `Create a ${locale} version with the same translationKey value.`,
          });
        }
      }

      return results;
    },
  };
}

/**
 * Create a missing-locale rule that lists all configured locales in the suggestion.
 */
function createMissingLocaleRule(i18n: I18nConfig): Rule {
  const localeList = i18n.locales.join(' / ');

  return {
    name: 'missing-locale',
    severity: 'warning',
    category: 'i18n',
    fixStrategy: `Add a locale field (${localeList}) to the frontmatter`,
    run: (item: ContentItem): LintResult[] => {
      if (!item.locale) {
        return [{
          file: getDisplayPath(item),
          field: 'locale',
          rule: 'missing-locale',
          severity: 'warning',
          message: 'Missing locale field',
          suggestion: `Add a locale field (${localeList}) to the frontmatter for proper i18n support.`,
        }];
      }
      return [];
    },
  };
}

/**
 * Create an x-default-missing rule.
 * Checks that each translation group has a version in the default locale.
 * Fires once per group (on the first non-default item, sorted by slug).
 */
function createXDefaultMissingRule(i18n: I18nConfig): Rule {
  return {
    name: 'x-default-missing',
    severity: 'warning',
    category: 'i18n',
    fixStrategy: `Create a ${i18n.defaultLocale} version so hreflang x-default resolves correctly`,
    run: (item: ContentItem, context: RuleContext): LintResult[] => {
      if (!item.translationKey) return [];
      if (item.locale === i18n.defaultLocale) return [];

      const groupItems = context.allContent.filter(
        c => c.translationKey === item.translationKey,
      );

      const hasDefaultLocale = groupItems.some(c => c.locale === i18n.defaultLocale);
      if (hasDefaultLocale) return [];

      // Fire only on the first non-default item (sorted by slug for determinism)
      const sortedNonDefault = groupItems
        .filter(c => c.locale !== i18n.defaultLocale)
        .sort((a, b) => a.slug.localeCompare(b.slug));

      if (sortedNonDefault.length === 0 || sortedNonDefault[0].slug !== item.slug) {
        return [];
      }

      return [{
        file: getDisplayPath(item),
        field: 'translationKey',
        rule: 'x-default-missing',
        severity: 'warning',
        message: `Translation group "${item.translationKey}" has no ${i18n.defaultLocale} version — hreflang x-default will not resolve`,
        suggestion: `Create a ${i18n.defaultLocale} version with translationKey "${item.translationKey}".`,
      }];
    },
  };
}

/**
 * Create all i18n rules from configuration.
 * Supports configurable locales and default locale.
 */
export function createI18nRules(i18n: I18nConfig): Rule[] {
  return [
    createTranslationPairMissingRule(i18n),
    createMissingLocaleRule(i18n),
    createXDefaultMissingRule(i18n),
  ];
}

/** Static export for backward compatibility (DE/EN defaults) */
export const i18nRules: Rule[] = createI18nRules({
  locales: ['de', 'en'],
  defaultLocale: 'de',
});
