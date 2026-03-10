import { describe, it, expect } from 'vitest';
import {
  createNoFeedRule,
  createNoLlmsTxtRule,
  createTechnicalSiteRules,
} from '../../../src/rules/technical-site-rules.js';
import { createItem, createContext } from '../../helpers.js';

const ctx = createContext();

// ---------------------------------------------------------------------------
// technical-no-feed
// ---------------------------------------------------------------------------

describe('technical-no-feed', () => {
  it('skips when feedUrls is undefined (not configured)', () => {
    const rule = createNoFeedRule(undefined);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('warns when feedUrls is empty array', () => {
    const rule = createNoFeedRule([]);
    const item = createItem();
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('technical-no-feed');
    expect(results[0].severity).toBe('warning');
  });

  it('passes when feedUrls has at least one entry', () => {
    const rule = createNoFeedRule(['/feed.xml']);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('fires only once across multiple items', () => {
    const rule = createNoFeedRule([]);
    const item1 = createItem({ slug: 'post-1' });
    const item2 = createItem({ slug: 'post-2' });
    const r1 = rule.run(item1, ctx);
    const r2 = rule.run(item2, ctx);
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// technical-no-llms-txt
// ---------------------------------------------------------------------------

describe('technical-no-llms-txt', () => {
  it('skips when llmsTxtUrl is undefined (not configured)', () => {
    const rule = createNoLlmsTxtRule(undefined);
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('warns when llmsTxtUrl is empty string', () => {
    const rule = createNoLlmsTxtRule('');
    const item = createItem();
    const results = rule.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('technical-no-llms-txt');
    expect(results[0].severity).toBe('warning');
  });

  it('passes when llmsTxtUrl is set', () => {
    const rule = createNoLlmsTxtRule('/llms.txt');
    const item = createItem();
    expect(rule.run(item, ctx)).toHaveLength(0);
  });

  it('fires only once across multiple items', () => {
    const rule = createNoLlmsTxtRule('');
    const item1 = createItem({ slug: 'post-1' });
    const item2 = createItem({ slug: 'post-2' });
    const r1 = rule.run(item1, ctx);
    const r2 = rule.run(item2, ctx);
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// createTechnicalSiteRules (builder)
// ---------------------------------------------------------------------------

describe('createTechnicalSiteRules', () => {
  it('returns 2 rules', () => {
    const rules = createTechnicalSiteRules({
      feedUrls: [],
      llmsTxtUrl: '',
    });
    expect(rules).toHaveLength(2);
    expect(rules.map(r => r.name)).toContain('technical-no-feed');
    expect(rules.map(r => r.name)).toContain('technical-no-llms-txt');
  });
});
