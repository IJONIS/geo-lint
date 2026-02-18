/**
 * Title Rules Unit Tests
 * Tests for title-missing, title-too-short, title-too-long, title-approaching-limit
 */

import { createItem, createContext } from '../../helpers.js';
import {
  titleMissing,
  titleTooShort,
  titleTooLong,
  titleApproachingLimit,
} from '../../../src/rules/title-rules.js';

const ctx = createContext();

describe('titleMissing', () => {
  it('returns error when title is empty string', () => {
    const item = createItem({ title: '' });
    const results = titleMissing.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('title-missing');
    expect(results[0].severity).toBe('error');
    expect(results[0].field).toBe('title');
  });

  it('returns error when title is only whitespace', () => {
    const item = createItem({ title: '   ' });
    const results = titleMissing.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('title-missing');
    expect(results[0].severity).toBe('error');
  });

  it('returns no results when title exists', () => {
    const item = createItem({ title: 'A Valid Title' });
    const results = titleMissing.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

describe('titleTooShort', () => {
  it('returns warning when title < 30 chars', () => {
    const item = createItem({ title: 'Short Title' }); // 11 chars
    const results = titleTooShort.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('title-too-short');
    expect(results[0].severity).toBe('warning');
    expect(results[0].message).toContain('11');
    expect(results[0].message).toContain('30');
  });

  it('returns no results when title >= 30 chars', () => {
    const item = createItem({ title: 'This Is a Title With Exactly Thirty Chars!' }); // > 30
    const results = titleTooShort.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('returns no results when title is empty (other rule handles)', () => {
    const item = createItem({ title: '' });
    const results = titleTooShort.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

describe('titleTooLong', () => {
  it('returns error when title > 60 chars', () => {
    const longTitle = 'A'.repeat(61);
    const item = createItem({ title: longTitle });
    const results = titleTooLong.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('title-too-long');
    expect(results[0].severity).toBe('error');
    expect(results[0].message).toContain('61');
    expect(results[0].message).toContain('60');
  });

  it('returns no results when title <= 60 chars', () => {
    const item = createItem({ title: 'A'.repeat(60) });
    const results = titleTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('returns no results when title is empty', () => {
    const item = createItem({ title: '' });
    const results = titleTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

describe('titleApproachingLimit', () => {
  it('warns when title is 56-60 chars', () => {
    const title56 = 'A'.repeat(56);
    const item = createItem({ title: title56 });
    const results = titleApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('title-approaching-limit');
    expect(results[0].severity).toBe('warning');
    expect(results[0].message).toContain('56');
  });

  it('warns at exactly 60 chars (upper boundary)', () => {
    const title60 = 'A'.repeat(60);
    const item = createItem({ title: title60 });
    const results = titleApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('title-approaching-limit');
  });

  it('no result when title <= 55 chars', () => {
    const title55 = 'A'.repeat(55);
    const item = createItem({ title: title55 });
    const results = titleApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('no result when title > 60 chars (handled by titleTooLong)', () => {
    const title61 = 'A'.repeat(61);
    const item = createItem({ title: title61 });
    const results = titleApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('no result when title is empty', () => {
    const item = createItem({ title: '' });
    const results = titleApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});
