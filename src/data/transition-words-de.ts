/**
 * German Transition Words (Konjunktionen & Konnektoren)
 *
 * Transition words and phrases that signal logical flow between sentences.
 * Used by the content-low-transition-words rule to measure content coherence.
 *
 * Sources: Standard German linguistics references, independently compiled.
 */

const singleWords: readonly string[] = [
  'aber', 'abschließend', 'allerdings', 'also', 'andererseits',
  'anfänglich', 'anfangs', 'angenommen', 'anschließend', 'aufgrund',
  'ausgenommen', 'außerdem', 'beispielsweise', 'bevor',
  'beziehungsweise', 'bzw', 'da', 'dabei', 'dadurch', 'dafür',
  'dagegen', 'daher', 'dahingegen', 'danach', 'dann', 'darauf',
  'darum', 'dass', 'davor', 'dazu', 'dementsprechend', 'demgegenüber',
  'demgemäß', 'demzufolge', 'denn', 'dennoch', 'derweil', 'desto',
  'deshalb', 'deswegen', 'doch', 'drittens', 'ebenfalls', 'ebenso',
  'ehe', 'einerseits', 'endlich', 'entsprechend', 'entweder', 'erst',
  'erstens', 'falls', 'ferner', 'folgerichtig', 'folglich',
  'genauso', 'gleichzeitig', 'hierdurch', 'hierzu', 'hingegen',
  'immerhin', 'indem', 'indes', 'indessen', 'infolge',
  'infolgedessen', 'insofern', 'insoweit', 'inzwischen',
  'jedenfalls', 'jedoch', 'kurzum', 'mitnichten', 'mitunter',
  'möglicherweise', 'nachdem', 'nebenher', 'nichtsdestotrotz',
  'nichtsdestoweniger', 'ob', 'obenrein', 'obgleich', 'obschon',
  'obwohl', 'obzwar', 'ohnehin', 'richtigerweise', 'schließlich',
  'seit', 'seitdem', 'sobald', 'sodass', 'sofern', 'sogar',
  'solange', 'somit', 'sondern', 'sooft', 'soviel', 'soweit',
  'sowie', 'sowohl', 'statt', 'stattdessen', 'trotz', 'trotzdem',
  'überdies', 'übrigens', 'ungeachtet', 'vielmehr', 'vorausgesetzt',
  'vorher', 'während', 'währenddessen', 'weder', 'wegen', 'weil',
  'weiter', 'weiterhin', 'wenn', 'wenngleich', 'wennschon',
  'weshalb', 'widrigenfalls', 'wiewohl', 'wobei', 'wohingegen',
  'zudem', 'zuerst', 'zufolge', 'zugleich', 'zuletzt', 'zumal',
  'zunächst', 'zuvor', 'zwar', 'zweitens',
] as const;

const multiWordPhrases: readonly string[] = [
  'abgesehen von', 'abgesehen davon', 'als dass', 'als ob',
  'als wenn', 'anders ausgedrückt', 'anders formuliert',
  'anders gefasst', 'anders gefragt', 'anders gesagt',
  'anders gesprochen', 'anstatt dass', 'auch wenn', 'auf grund',
  'auf jeden fall', 'aus diesem grund', 'außer dass', 'außer wenn',
  'besser ausgedrückt', 'besser formuliert', 'besser gesagt',
  'besser gesprochen', 'bloß dass', 'darüber hinaus', 'das heißt',
  'des weiteren', 'dessen ungeachtet', 'ebenso wie', 'genauso wie',
  'geschweige denn', 'im fall', 'im falle', 'im folgenden',
  'im gegensatz dazu', 'im gegenteil', 'im grunde genommen',
  'in diesem sinne', 'je nachdem', 'kurz gesagt',
  'mit anderen worten', 'ohne dass', 'so dass',
  'umso mehr als', 'umso weniger als', 'unbeschadet dessen',
  'und zwar', 'ungeachtet dessen', 'unter dem strich',
  'zum beispiel', 'zunächst einmal',
] as const;

/** All German transition words and phrases (lowercased). */
export const TRANSITION_WORDS_DE: ReadonlySet<string> = new Set([
  ...singleWords,
  ...multiWordPhrases,
]);

/** Single-word transitions only (for fast set-membership checks). */
export const TRANSITION_SINGLE_WORDS_DE: ReadonlySet<string> = new Set(singleWords);

/** Multi-word phrases only (checked via substring match). */
export const TRANSITION_PHRASES_DE: readonly string[] = multiWordPhrases;
