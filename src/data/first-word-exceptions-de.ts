/**
 * German First Word Exceptions (Funktionswörter)
 *
 * Function words that should be skipped when checking for consecutive
 * sentence beginnings. When a sentence starts with one of these, the
 * analyzer uses the second word instead.
 */
export const FIRST_WORD_EXCEPTIONS_DE: ReadonlySet<string> = new Set([
  // Definite articles (all cases)
  'der', 'die', 'das', 'dem', 'den', 'des',
  // Indefinite articles (all cases)
  'ein', 'eine', 'einem', 'einen', 'einer', 'eines',
  // Demonstrative pronouns
  'diese', 'dieser', 'dieses', 'diesem', 'diesen',
  'jene', 'jener', 'jenes', 'jenem', 'jenen',
  'welch', 'welcher', 'welches',
  // Cardinal numbers (1–10)
  'eins', 'zwei', 'drei', 'vier', 'fünf',
  'sechs', 'sieben', 'acht', 'neun', 'zehn',
]);
