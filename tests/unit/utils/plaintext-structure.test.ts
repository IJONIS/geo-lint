import { describe, it, expect } from 'vitest';
import {
  detectPlaintextHeadings,
  detectPlaintextTable,
  detectPlaintextList,
  detectPlaintextFaq,
} from '../../../src/utils/plaintext-structure.js';

describe('detectPlaintextHeadings', () => {
  it('detects Title Case short lines followed by blank line', () => {
    const text =
      'Introduction\n\nThis is a paragraph about something.\n\nKey Benefits\n\nHere are the benefits.';
    const headings = detectPlaintextHeadings(text);
    expect(headings.length).toBeGreaterThanOrEqual(2);
    expect(headings[0].text).toBe('Introduction');
    expect(headings[1].text).toBe('Key Benefits');
  });

  it('detects ALL CAPS lines as headings', () => {
    const text =
      'GETTING STARTED\n\nFirst paragraph here.\n\nNEXT STEPS\n\nSecond paragraph.';
    const headings = detectPlaintextHeadings(text);
    expect(headings.length).toBe(2);
  });

  it('ignores long lines (>80 chars)', () => {
    const longLine = 'A'.repeat(81);
    const text = `${longLine}\n\nParagraph after.`;
    const headings = detectPlaintextHeadings(text);
    expect(headings.length).toBe(0);
  });

  it('ignores lines ending with sentence punctuation', () => {
    const text = 'This is a sentence.\n\nParagraph after.';
    const headings = detectPlaintextHeadings(text);
    expect(headings.length).toBe(0);
  });

  it('detects question headings in plain text', () => {
    const text =
      'What Is Dropshipping?\n\nDropshipping is a method...\n\nHow Does It Work?\n\nIt works by...';
    const headings = detectPlaintextHeadings(text);
    expect(headings.length).toBe(2);
    expect(headings[0].text).toBe('What Is Dropshipping?');
  });

  it('returns empty for fully-prose content', () => {
    const text =
      'This is a long paragraph. It has multiple sentences. Nothing looks like a heading here at all because every line is long enough to be a paragraph.';
    const headings = detectPlaintextHeadings(text);
    expect(headings.length).toBe(0);
  });
});

describe('detectPlaintextTable', () => {
  it('detects tab-separated columnar data', () => {
    const text =
      'Feature\tStatus\tPrice\nSEO\tActive\t$10\nGEO\tActive\t$20';
    expect(detectPlaintextTable(text)).toBe(true);
  });

  it('detects multiple-space aligned columns', () => {
    const text =
      'Name          Price    Status\nWidget A      $10      Active\nWidget B      $20      Inactive';
    expect(detectPlaintextTable(text)).toBe(true);
  });

  it('returns false for plain prose', () => {
    expect(detectPlaintextTable('Just a normal paragraph.')).toBe(
      false,
    );
  });
});

describe('detectPlaintextList', () => {
  it('detects bullet characters (•, ·, –, —)', () => {
    const text = '• First item\n• Second item\n• Third item';
    expect(detectPlaintextList(text)).toBe(true);
  });

  it('detects numbered lines without markdown markers', () => {
    const text = '1) First item\n2) Second item\n3) Third item';
    expect(detectPlaintextList(text)).toBe(true);
  });

  it('returns false for plain prose', () => {
    expect(
      detectPlaintextList(
        'Just a normal paragraph with no list items.',
      ),
    ).toBe(false);
  });
});

describe('detectPlaintextFaq', () => {
  it('detects question-answer patterns', () => {
    const text =
      'What is SEO?\nSEO stands for Search Engine Optimization. It helps websites rank higher.\n\nHow does GEO work?\nGEO optimizes content for generative AI engines that summarize web content.';
    const result = detectPlaintextFaq(text);
    expect(result.hasFaq).toBe(true);
    expect(result.questionCount).toBeGreaterThanOrEqual(2);
  });

  it('returns false for prose without Q&A pattern', () => {
    const result = detectPlaintextFaq(
      'Just a regular paragraph without any questions or answers.',
    );
    expect(result.hasFaq).toBe(false);
  });
});
