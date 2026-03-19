import { describe, it, expect } from 'vitest';
import { slugInvalidCharacters } from '../../../src/rules/slug-rules.js';
import { createItem, createContext } from '../../helpers.js';

describe('slug-invalid-characters with URL content', () => {
  it('allows slashes in URL-sourced slugs', () => {
    const item = createItem({
      slug: 'blog/what-is-dropshipping',
      contentSource: 'url',
    });
    const results = slugInvalidCharacters.run(item, createContext());
    expect(results).toHaveLength(0);
  });

  it('still flags uppercase in URL-sourced slugs', () => {
    const item = createItem({
      slug: 'Blog/What-Is-Dropshipping',
      contentSource: 'url',
    });
    const results = slugInvalidCharacters.run(item, createContext());
    expect(results).toHaveLength(1);
  });

  it('still rejects slashes in file-sourced slugs', () => {
    const item = createItem({
      slug: 'blog/what-is-dropshipping',
      contentSource: 'file',
    });
    const results = slugInvalidCharacters.run(item, createContext());
    expect(results).toHaveLength(1);
  });
});
