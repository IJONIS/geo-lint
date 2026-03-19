import { describe, it, expect } from 'vitest';
import { createItem } from '../../helpers.js';

describe('ContentItem contentSource', () => {
  it('defaults to file when not specified', () => {
    const item = createItem();
    expect(item.contentSource ?? 'file').toBe('file');
  });

  it('can be set to url', () => {
    const item = createItem({ contentSource: 'url' });
    expect(item.contentSource).toBe('url');
  });
});
