/**
 * Image Extractor Utility
 * Extracts images and their alt text from MDX content
 */

import type { ExtractedImage } from '../types.js';

/**
 * Check if a line is inside a code block
 */
function isInCodeBlock(lines: string[], lineIndex: number): boolean {
  let inCodeBlock = false;

  for (let i = 0; i < lineIndex; i++) {
    const line = lines[i].trim();
    if (line.startsWith('```') || line.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
    }
  }

  return inCodeBlock;
}

/**
 * Extract all images from MDX body content
 * Handles markdown images ![alt](src) and JSX/HTML img tags
 */
export function extractImages(mdxBody: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const lines = mdxBody.split('\n');

  // Regex patterns
  // Markdown: ![alt](src) or ![alt](src "title")
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

  // JSX/HTML: <img src="..." alt="..." /> or <Image src="..." alt="..." />
  const jsxImageRegex = /<(?:img|Image)\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const altAttrRegex = /alt=["']([^"']*)["']/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip lines inside code blocks
    if (isInCodeBlock(lines, i)) {
      continue;
    }

    // Find markdown images: ![alt](src)
    let match;
    while ((match = markdownImageRegex.exec(line)) !== null) {
      const [, alt, src] = match;

      images.push({
        src,
        alt: alt.trim(),
        line: i + 1,
        hasAlt: alt.trim().length > 0,
        source: 'inline',
      });
    }

    // Reset regex lastIndex for reuse
    markdownImageRegex.lastIndex = 0;

    // Find JSX/HTML images: <img src="..." /> or <Image src="..." />
    while ((match = jsxImageRegex.exec(line)) !== null) {
      const [fullMatch, src] = match;

      // Extract alt attribute if present
      const altMatch = fullMatch.match(altAttrRegex);
      const alt = altMatch ? altMatch[1] : '';

      // Skip if this src was already captured by markdown regex
      const alreadyCaptured = images.some(
        img => img.line === i + 1 && img.src === src
      );

      if (!alreadyCaptured) {
        images.push({
          src,
          alt: alt.trim(),
          line: i + 1,
          hasAlt: alt.trim().length > 0,
          source: 'inline',
        });
      }
    }

    // Reset regex lastIndex for reuse
    jsxImageRegex.lastIndex = 0;
  }

  return images;
}

/**
 * Get images missing alt text
 */
export function getImagesMissingAlt(images: ExtractedImage[]): ExtractedImage[] {
  return images.filter(img => !img.hasAlt);
}

/**
 * Create an ExtractedImage from frontmatter data
 */
export function createFrontmatterImage(
  imagePath: string | undefined,
  imageAlt: string | undefined
): ExtractedImage | null {
  if (!imagePath) {
    return null;
  }

  return {
    src: imagePath,
    alt: imageAlt || '',
    line: 0, // Frontmatter doesn't have a specific line
    hasAlt: !!imageAlt && imageAlt.trim().length > 0,
    source: 'frontmatter',
  };
}

/**
 * Normalize image path for comparison
 */
export function normalizeImagePath(src: string): string {
  let normalized = src;

  // Handle relative paths
  if (!normalized.startsWith('/') && !normalized.startsWith('http')) {
    normalized = '/' + normalized;
  }

  // Remove query strings
  normalized = normalized.split('?')[0];

  return normalized;
}
