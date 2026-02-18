/**
 * Heading Rules Unit Tests
 * Tests for missing-h1, multiple-h1, heading-hierarchy-skip, duplicate-heading-text
 */

import { createItem, createContext } from '../../helpers.js';
import {
  missingH1,
  multipleH1,
  headingHierarchySkip,
  duplicateHeadingText,
} from '../../../src/rules/heading-rules.js';

const ctx = createContext();

// ---------------------------------------------------------------------------
// missingH1
// ---------------------------------------------------------------------------
describe('missingH1', () => {
  it('warns when no H1 heading found in page content', () => {
    const item = createItem({
      body: '## Subheading\n\nSome content here.',
      contentType: 'page',
    });
    const results = missingH1.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('missing-h1');
    expect(results[0].severity).toBe('warning');
    expect(results[0].field).toBe('body');
  });

  it('returns no results when H1 exists in page content', () => {
    const item = createItem({
      body: '# Main Heading\n\n## Subheading\n\nContent.',
      contentType: 'page',
    });
    const results = missingH1.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips blog content (BlogHeader provides H1)', () => {
    const item = createItem({
      body: '## Subheading only, no H1',
      contentType: 'blog',
    });
    const results = missingH1.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips legal category pages (ServicePageHeader provides H1)', () => {
    const item = createItem({
      body: '## Subheading only',
      contentType: 'page',
      category: 'legal',
    });
    const results = missingH1.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips service category pages (ServicePageHeader provides H1)', () => {
    const item = createItem({
      body: '## Subheading only',
      contentType: 'page',
      category: 'service',
    });
    const results = missingH1.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns for project content without H1', () => {
    const item = createItem({
      body: '## Overview\n\nProject details.',
      contentType: 'project',
    });
    const results = missingH1.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('missing-h1');
  });
});

// ---------------------------------------------------------------------------
// multipleH1
// ---------------------------------------------------------------------------
describe('multipleH1', () => {
  it('returns error when multiple H1 headings found', () => {
    const item = createItem({
      body: '# First Heading\n\nContent.\n\n# Second Heading\n\nMore content.',
      contentType: 'page',
    });
    const results = multipleH1.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('multiple-h1');
    expect(results[0].severity).toBe('error');
    expect(results[0].message).toContain('2');
    expect(results[0].suggestion).toContain('line');
  });

  it('returns no results when exactly one H1 exists', () => {
    const item = createItem({
      body: '# Only Heading\n\n## Subheading\n\nContent.',
      contentType: 'page',
    });
    const results = multipleH1.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('returns no results when no H1 exists (handled by missingH1)', () => {
    const item = createItem({
      body: '## Subheading\n\nContent.',
      contentType: 'page',
    });
    const results = multipleH1.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('skips blog content (exempt from H1 count)', () => {
    const item = createItem({
      body: '# First\n\n# Second\n\n# Third',
      contentType: 'blog',
    });
    const results = multipleH1.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('detects three H1 headings', () => {
    const item = createItem({
      body: '# First\n\n# Second\n\n# Third',
      contentType: 'page',
    });
    const results = multipleH1.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('3');
  });
});

// ---------------------------------------------------------------------------
// headingHierarchySkip
// ---------------------------------------------------------------------------
describe('headingHierarchySkip', () => {
  it('warns when heading levels are skipped (H1 -> H3)', () => {
    const item = createItem({
      body: '# Main Heading\n\n### Skipped to H3\n\nContent.',
      contentType: 'page',
    });
    const results = headingHierarchySkip.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('heading-hierarchy-skip');
    expect(results[0].severity).toBe('warning');
    expect(results[0].message).toContain('H1');
    expect(results[0].message).toContain('H3');
    expect(results[0].line).toBeDefined();
  });

  it('returns no results when hierarchy is correct (H1 -> H2 -> H3)', () => {
    const item = createItem({
      body: '# Main\n\n## Section\n\n### Subsection\n\nContent.',
      contentType: 'page',
    });
    const results = headingHierarchySkip.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('returns no results when heading goes up (H3 -> H1 is valid)', () => {
    const item = createItem({
      body: '# Main\n\n## Section\n\n### Sub\n\n# Another Main\n\n## Next Section',
      contentType: 'page',
    });
    const results = headingHierarchySkip.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('detects multiple hierarchy violations', () => {
    const item = createItem({
      body: '# Main\n\n#### Skipped two levels\n\n## Back to H2\n\n##### Deep skip',
      contentType: 'page',
    });
    const results = headingHierarchySkip.run(item, ctx);
    expect(results).toHaveLength(2);
    // First violation: H1 -> H4 (skipped H2, H3)
    expect(results[0].message).toContain('H1');
    expect(results[0].message).toContain('H4');
    // Second violation: H2 -> H5 (skipped H3, H4)
    expect(results[1].message).toContain('H2');
    expect(results[1].message).toContain('H5');
  });

  it('returns no results when no headings exist', () => {
    const item = createItem({
      body: 'Just plain text without any headings.',
      contentType: 'page',
    });
    const results = headingHierarchySkip.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('allows same-level consecutive headings', () => {
    const item = createItem({
      body: '## Section A\n\n## Section B\n\n## Section C',
      contentType: 'page',
    });
    const results = headingHierarchySkip.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('ignores headings inside code blocks', () => {
    const item = createItem({
      body: '# Main\n\n```\n### This is in a code block\n```\n\n## Valid H2',
      contentType: 'page',
    });
    const results = headingHierarchySkip.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// duplicateHeadingText
// ---------------------------------------------------------------------------
describe('duplicateHeadingText', () => {
  it('warns when duplicate heading text is found', () => {
    const item = createItem({
      body: '## Overview\n\nContent.\n\n## Overview\n\nMore content.',
      contentType: 'page',
    });
    const results = duplicateHeadingText.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('duplicate-heading-text');
    expect(results[0].severity).toBe('warning');
    expect(results[0].message).toContain('Overview');
    expect(results[0].line).toBeDefined();
  });

  it('returns no results when all headings are unique', () => {
    const item = createItem({
      body: '## Introduction\n\n## Methods\n\n## Results\n\n## Conclusion',
      contentType: 'page',
    });
    const results = duplicateHeadingText.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const item = createItem({
      body: '## Overview\n\nContent.\n\n## overview\n\nMore content.',
      contentType: 'page',
    });
    const results = duplicateHeadingText.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('duplicate-heading-text');
  });

  it('reports the second occurrence with line number', () => {
    const item = createItem({
      body: '## Title\n\nParagraph one.\n\n## Title\n\nParagraph two.',
      contentType: 'page',
    });
    const results = duplicateHeadingText.run(item, ctx);
    expect(results).toHaveLength(1);
    // The second "## Title" is on line 5 (1-indexed)
    expect(results[0].line).toBe(5);
    expect(results[0].suggestion).toContain('line 1');
    expect(results[0].suggestion).toContain('line 5');
  });

  it('detects duplicates across different heading levels', () => {
    const item = createItem({
      body: '# Setup\n\n## Setup\n\nContent.',
      contentType: 'page',
    });
    const results = duplicateHeadingText.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('Setup');
  });

  it('detects multiple sets of duplicates', () => {
    const item = createItem({
      body: '## Alpha\n\n## Beta\n\n## Alpha\n\n## Beta',
      contentType: 'page',
    });
    const results = duplicateHeadingText.run(item, ctx);
    expect(results).toHaveLength(2);
  });

  it('returns no results when no headings exist', () => {
    const item = createItem({
      body: 'Plain content without headings.',
      contentType: 'page',
    });
    const results = duplicateHeadingText.run(item, ctx);
    expect(results).toHaveLength(0);
  });
});
