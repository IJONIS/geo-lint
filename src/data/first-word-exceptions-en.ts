/**
 * English First Word Exceptions
 *
 * Function words that should be skipped when checking for consecutive
 * sentence beginnings. When a sentence starts with one of these, the
 * analyzer uses the second word instead (e.g., "The dog" → "dog").
 */
export const FIRST_WORD_EXCEPTIONS_EN: ReadonlySet<string> = new Set([
  // Articles
  'the', 'a', 'an',
  // Demonstratives
  'this', 'that', 'these', 'those',
  // Cardinal numbers (1–10)
  'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten',
]);
