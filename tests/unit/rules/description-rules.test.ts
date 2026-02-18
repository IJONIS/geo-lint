/**
 * Description Rules Unit Tests
 * Tests for description-missing, description-too-long, description-approaching-limit, description-too-short
 */

import { createItem, createContext } from '../../helpers.js';
import {
  descriptionMissing,
  descriptionTooLong,
  descriptionApproachingLimit,
  descriptionTooShort,
} from '../../../src/rules/description-rules.js';

const ctx = createContext();

describe('descriptionMissing', () => {
  it('returns error when description is empty string', () => {
    const item = createItem({ description: '' });
    const results = descriptionMissing.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('description-missing');
    expect(results[0].severity).toBe('error');
    expect(results[0].field).toBe('description');
  });

  it('returns error when description is only whitespace', () => {
    const item = createItem({ description: '    ' });
    const results = descriptionMissing.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('description-missing');
    expect(results[0].severity).toBe('error');
  });

  it('returns no results when description exists', () => {
    const item = createItem({ description: 'A valid description for testing.' });
    const results = descriptionMissing.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

describe('descriptionTooLong', () => {
  it('returns error when description > 160 chars', () => {
    const longDesc = 'A'.repeat(161);
    const item = createItem({ description: longDesc });
    const results = descriptionTooLong.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('description-too-long');
    expect(results[0].severity).toBe('error');
    expect(results[0].message).toContain('161');
    expect(results[0].message).toContain('160');
  });

  it('returns no results when description <= 160 chars', () => {
    const item = createItem({ description: 'A'.repeat(160) });
    const results = descriptionTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('returns no results when description is empty', () => {
    const item = createItem({ description: '' });
    const results = descriptionTooLong.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

describe('descriptionApproachingLimit', () => {
  it('warns when description is 151-160 chars', () => {
    const desc151 = 'A'.repeat(151);
    const item = createItem({ description: desc151 });
    const results = descriptionApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('description-approaching-limit');
    expect(results[0].severity).toBe('warning');
    expect(results[0].message).toContain('151');
  });

  it('warns at exactly 160 chars (upper boundary)', () => {
    const desc160 = 'A'.repeat(160);
    const item = createItem({ description: desc160 });
    const results = descriptionApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('description-approaching-limit');
  });

  it('no result when description <= 150 chars', () => {
    const desc150 = 'A'.repeat(150);
    const item = createItem({ description: desc150 });
    const results = descriptionApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('no result when description > 160 chars (handled by descriptionTooLong)', () => {
    const desc161 = 'A'.repeat(161);
    const item = createItem({ description: desc161 });
    const results = descriptionApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('no result when description is empty', () => {
    const item = createItem({ description: '' });
    const results = descriptionApproachingLimit.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

describe('descriptionTooShort', () => {
  it('returns warning when description < 70 chars', () => {
    const shortDesc = 'A short description here.'; // 25 chars
    const item = createItem({ description: shortDesc });
    const results = descriptionTooShort.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('description-too-short');
    expect(results[0].severity).toBe('warning');
    expect(results[0].message).toContain('70');
  });

  it('returns no results when description >= 70 chars', () => {
    const item = createItem({ description: 'A'.repeat(70) });
    const results = descriptionTooShort.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('returns no results when description is empty (handled by descriptionMissing)', () => {
    const item = createItem({ description: '' });
    const results = descriptionTooShort.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('returns no results when description is only whitespace (handled by descriptionMissing)', () => {
    const item = createItem({ description: '   ' });
    const results = descriptionTooShort.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('returns warning at boundary (69 chars)', () => {
    const desc69 = 'A'.repeat(69);
    const item = createItem({ description: desc69 });
    const results = descriptionTooShort.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('description-too-short');
  });

  it('returns no results at exact minimum (70 chars)', () => {
    const desc70 = 'A'.repeat(70);
    const item = createItem({ description: desc70 });
    const results = descriptionTooShort.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});
