/**
 * Word Counter Utility
 * Counts words in MDX content, stripping markdown syntax
 */

/**
 * Strip markdown syntax to get plain text
 */
export function stripMarkdown(text: string): string {
  let result = text;

  // Remove code blocks (``` ... ```)
  result = result.replace(/```[\s\S]*?```/g, '');

  // Remove inline code (`code`)
  result = result.replace(/`[^`]+`/g, '');

  // Remove images ![alt](url)
  result = result.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

  // Remove links but keep text [text](url) -> text
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove HTML/JSX tags
  result = result.replace(/<[^>]+>/g, '');

  // Remove headings markers (#)
  result = result.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic markers
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
  result = result.replace(/\*([^*]+)\*/g, '$1');
  result = result.replace(/__([^_]+)__/g, '$1');
  result = result.replace(/_([^_]+)_/g, '$1');

  // Remove blockquotes
  result = result.replace(/^>\s+/gm, '');

  // Remove horizontal rules
  result = result.replace(/^[-*_]{3,}$/gm, '');

  // Remove list markers
  result = result.replace(/^[\s]*[-*+]\s+/gm, '');
  result = result.replace(/^[\s]*\d+\.\s+/gm, '');

  // Remove frontmatter-style content (import statements, etc.)
  result = result.replace(/^import\s+.*$/gm, '');
  result = result.replace(/^export\s+.*$/gm, '');

  // Remove JSX component tags (like <CalloutBox>...</CalloutBox>)
  result = result.replace(/<\w+[^>]*>[\s\S]*?<\/\w+>/g, (match) => {
    // Try to extract text content from JSX
    return match.replace(/<[^>]+>/g, ' ');
  });

  return result;
}

/**
 * Count words in text
 * Splits on whitespace and counts non-empty tokens
 */
export function countWords(text: string): number {
  const stripped = stripMarkdown(text);

  // Split on whitespace and filter empty strings
  const words = stripped
    .split(/\s+/)
    .filter(word => word.length > 0)
    // Filter out remaining non-word characters
    .filter(word => /\w/.test(word));

  return words.length;
}

/**
 * Count sentences in text
 * Looks for sentence-ending punctuation
 */
export function countSentences(text: string): number {
  const stripped = stripMarkdown(text);

  // Count sentence-ending punctuation
  // This is a simplified approach - handles . ! ? followed by space or end
  const sentences = stripped.match(/[.!?]+(?:\s|$)/g);

  return sentences ? sentences.length : 0;
}

/**
 * Get word count statistics for content
 */
export function getWordStats(mdxBody: string): {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
} {
  const wordCount = countWords(mdxBody);
  const sentenceCount = countSentences(mdxBody);

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence: sentenceCount > 0 ? wordCount / sentenceCount : 0,
  };
}
