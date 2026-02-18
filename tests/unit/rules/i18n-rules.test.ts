import { describe, it, expect } from 'vitest';
import { createI18nRules } from '../../../src/rules/i18n-rules.js';
import { createItem, createContext } from '../../helpers.js';
import type { Rule } from '../../../src/types.js';

/** Helper to find a rule by name from the generated rule set */
function findRule(rules: Rule[], name: string): Rule {
  const rule = rules.find(r => r.name === name);
  if (!rule) throw new Error(`Rule "${name}" not found`);
  return rule;
}

// ---------------------------------------------------------------------------
// Default 2-locale config (backward compat)
// ---------------------------------------------------------------------------

describe('createI18nRules (de/en)', () => {
  const rules = createI18nRules({ locales: ['de', 'en'], defaultLocale: 'de' });

  describe('translation-pair-missing', () => {
    const rule = findRule(rules, 'translation-pair-missing');

    it('no warning when translationKey is absent', () => {
      const item = createItem({ locale: 'de', translationKey: undefined });
      expect(rule.run(item, createContext())).toHaveLength(0);
    });

    it('warns when en translation is missing for de item', () => {
      const deItem = createItem({ slug: 'de-post', locale: 'de', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [deItem] });
      const results = rule.run(deItem, ctx);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('"en"');
    });

    it('warns when de translation is missing for en item', () => {
      const enItem = createItem({ slug: 'en-post', locale: 'en', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [enItem] });
      const results = rule.run(enItem, ctx);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('"de"');
    });

    it('passes when both locales present', () => {
      const deItem = createItem({ slug: 'de-post', locale: 'de', translationKey: 'my-post' });
      const enItem = createItem({ slug: 'en-post', locale: 'en', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [deItem, enItem] });
      expect(rule.run(deItem, ctx)).toHaveLength(0);
      expect(rule.run(enItem, ctx)).toHaveLength(0);
    });
  });

  describe('missing-locale', () => {
    const rule = findRule(rules, 'missing-locale');

    it('warns when locale is absent', () => {
      const item = createItem({ locale: undefined });
      const results = rule.run(item, createContext());
      expect(results).toHaveLength(1);
      expect(results[0].suggestion).toContain('de / en');
    });

    it('passes when locale is set', () => {
      const item = createItem({ locale: 'de' });
      expect(rule.run(item, createContext())).toHaveLength(0);
    });
  });

  describe('x-default-missing', () => {
    const rule = findRule(rules, 'x-default-missing');

    it('no warning when translationKey is absent', () => {
      const item = createItem({ locale: 'en', translationKey: undefined });
      expect(rule.run(item, createContext())).toHaveLength(0);
    });

    it('no warning when item is in default locale', () => {
      const item = createItem({ slug: 'de-post', locale: 'de', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [item] });
      expect(rule.run(item, ctx)).toHaveLength(0);
    });

    it('warns when default locale version is absent', () => {
      const enItem = createItem({ slug: 'en-post', locale: 'en', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [enItem] });
      const results = rule.run(enItem, ctx);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('no de version');
    });

    it('passes when default locale version exists', () => {
      const deItem = createItem({ slug: 'de-post', locale: 'de', translationKey: 'my-post' });
      const enItem = createItem({ slug: 'en-post', locale: 'en', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [deItem, enItem] });
      expect(rule.run(enItem, ctx)).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 3-locale config
// ---------------------------------------------------------------------------

describe('createI18nRules (de/en/fr)', () => {
  const rules = createI18nRules({ locales: ['de', 'en', 'fr'], defaultLocale: 'de' });

  describe('translation-pair-missing', () => {
    const rule = findRule(rules, 'translation-pair-missing');

    it('warns for each missing locale', () => {
      const deItem = createItem({ slug: 'de-post', locale: 'de', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [deItem] });
      const results = rule.run(deItem, ctx);
      expect(results).toHaveLength(2); // missing en + fr
      expect(results.map(r => r.message)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('"en"'),
          expect.stringContaining('"fr"'),
        ]),
      );
    });

    it('warns for single missing locale', () => {
      const deItem = createItem({ slug: 'de-post', locale: 'de', translationKey: 'my-post' });
      const enItem = createItem({ slug: 'en-post', locale: 'en', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [deItem, enItem] });
      const results = rule.run(deItem, ctx);
      expect(results).toHaveLength(1);
      expect(results[0].message).toContain('"fr"');
    });

    it('passes when all 3 locales present', () => {
      const deItem = createItem({ slug: 'de-post', locale: 'de', translationKey: 'my-post' });
      const enItem = createItem({ slug: 'en-post', locale: 'en', translationKey: 'my-post' });
      const frItem = createItem({ slug: 'fr-post', locale: 'fr', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [deItem, enItem, frItem] });
      expect(rule.run(deItem, ctx)).toHaveLength(0);
    });
  });

  describe('missing-locale', () => {
    const rule = findRule(rules, 'missing-locale');

    it('suggestion lists all 3 configured locales', () => {
      const item = createItem({ locale: undefined });
      const results = rule.run(item, createContext());
      expect(results[0].suggestion).toContain('de / en / fr');
    });
  });

  describe('x-default-missing', () => {
    const rule = findRule(rules, 'x-default-missing');

    it('fires once per group when default locale absent', () => {
      const enItem = createItem({ slug: 'en-post', locale: 'en', translationKey: 'my-post' });
      const frItem = createItem({ slug: 'fr-post', locale: 'fr', translationKey: 'my-post' });
      const ctx = createContext({ allContent: [enItem, frItem] });

      // Only fires on the first non-default item by slug sort
      const enResults = rule.run(enItem, ctx);
      const frResults = rule.run(frItem, ctx);

      const totalWarnings = enResults.length + frResults.length;
      expect(totalWarnings).toBe(1);
    });
  });
});
