/**
 * English Transition Words
 *
 * Transition words and phrases that signal logical flow between sentences.
 * Used by the content-low-transition-words rule to measure content coherence.
 *
 * Sources: Standard English linguistics references, independently compiled.
 * Thresholds inspired by Yoast SEO's readability analysis.
 */

const singleWords: readonly string[] = [
  'accordingly', 'additionally', 'afterward', 'afterwards', 'albeit',
  'also', 'although', 'altogether', 'basically', 'because', 'before',
  'besides', 'but', 'certainly', 'chiefly', 'comparatively',
  'concurrently', 'consequently', 'contrarily', 'conversely',
  'correspondingly', 'despite', 'during', 'earlier', 'emphatically',
  'equally', 'especially', 'eventually', 'evidently', 'explicitly',
  'finally', 'firstly', 'following', 'formerly', 'furthermore',
  'generally', 'hence', 'henceforth', 'however', 'identically',
  'indeed', 'initially', 'instead', 'lastly', 'later', 'likewise',
  'markedly', 'meanwhile', 'moreover', 'nevertheless', 'nonetheless',
  'nor', 'notwithstanding', 'obviously', 'occasionally', 'otherwise',
  'overall', 'particularly', 'presently', 'previously', 'rather',
  'regardless', 'secondly', 'shortly', 'significantly', 'similarly',
  'simultaneously', 'since', 'so', 'soon', 'specifically', 'still',
  'subsequently', 'surely', 'surprisingly', 'than', 'then',
  'thereafter', 'therefore', 'thereupon', 'thirdly', 'though',
  'thus', 'undeniably', 'undoubtedly', 'unless', 'unlike',
  'unquestionably', 'until', 'whereas', 'while', 'actually',
  'anyway', 'anyhow', 'mostly', 'namely', 'including', 'suddenly',
  'if', 'when', 'whenever', 'whether',
] as const;

const multiWordPhrases: readonly string[] = [
  'above all', 'after all', 'after that', 'all in all',
  'all things considered', 'as a matter of fact', 'as a result',
  'as an illustration', 'as can be seen', 'as has been noted',
  'as long as', 'as much as', 'as opposed to', 'as shown above',
  'as soon as', 'as well as', 'at any rate', 'at first', 'at last',
  'at least', 'at length', 'at the same time', 'balanced against',
  'being that', 'by all means', 'by and large', 'by comparison',
  'by the same token', 'by the time', 'compared to',
  'be that as it may', 'coupled with', 'different from', 'due to',
  'equally important', 'even if', 'even more', 'even so',
  'even though', 'for example', 'for instance', 'for one thing',
  'for that reason', 'for the most part', 'for this reason',
  'from time to time', 'given that', 'given these points',
  'in a word', 'in addition', 'in any case', 'in any event',
  'in brief', 'in case', 'in conclusion', 'in contrast',
  'in detail', 'in effect', 'in either case', 'either way',
  'in essence', 'in fact', 'in general', 'in light of',
  'in like fashion', 'in like manner', 'in order to',
  'in other words', 'in particular', 'in reality', 'in short',
  'in similar fashion', 'in spite of', 'in sum', 'in summary',
  'in that case', 'in the event that', 'in the first place',
  'in the long run', 'in the meantime', 'in the same fashion',
  'in the same way', 'in the second place', 'in the third place',
  'in this case', 'in this situation', 'in time', 'in truth',
  'in view of', 'most important', 'not only', 'not to mention',
  'note that', 'now that', 'of course', 'on account of',
  'on balance', 'on condition that', 'on one hand',
  'on the condition that', 'on the contrary',
  'on the other hand', 'on the whole', 'only if', 'owing to',
  'prior to', 'provided that', 'seeing that', 'so as to',
  'so far', 'so long as', 'so that', 'sooner or later',
  'such as', 'summing up', 'that is', 'that is to say',
  'then again', 'to begin with', 'to clarify', 'to conclude',
  'to demonstrate', 'to emphasize', 'to explain', 'to illustrate',
  'to put it another way', 'to put it differently', 'to repeat',
  'to rephrase it', 'to say nothing of', 'to sum up',
  'to summarize', 'to that end', 'together with',
  'under those circumstances', 'until now', 'what is more',
  'while it may be true', 'with this in mind', 'without a doubt',
  'without delay', 'without doubt', 'according to', 'from now on',
] as const;

/** All English transition words and phrases (lowercased). */
export const TRANSITION_WORDS_EN: ReadonlySet<string> = new Set([
  ...singleWords,
  ...multiWordPhrases,
]);

/** Single-word transitions only (for fast set-membership checks). */
export const TRANSITION_SINGLE_WORDS_EN: ReadonlySet<string> = new Set(singleWords);

/** Multi-word phrases only (checked via substring match). */
export const TRANSITION_PHRASES_EN: readonly string[] = multiWordPhrases;
