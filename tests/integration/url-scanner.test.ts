import { describe, it, expect } from 'vitest';
import { createItem, createContext } from '../helpers.js';
import type { ContentItem } from '../../src/types.js';
import { calculateReadability } from '../../src/utils/readability.js';
import { slugInvalidCharacters } from '../../src/rules/slug-rules.js';
import { missingH1 } from '../../src/rules/heading-rules.js';
import { geoNoQuestionHeadings } from '../../src/rules/geo-rules.js';
import { detectPlaintextHeadings } from '../../src/utils/plaintext-structure.js';

/**
 * Simulates content extracted from a URL via @mozilla/readability.
 * No markdown syntax — just plain text with structure.
 */
function createUrlItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return createItem({
    contentSource: 'url',
    contentType: 'blog',
    locale: 'de',
    slug: 'blog/ki-sichtbarkeit-chatgpt',
    title: 'KI-Sichtbarkeit: Warum Ihr Unternehmen in ChatGPT unsichtbar ist',
    description: 'Erfahren Sie, warum Ihre Marke in KI-Suchmaschinen nicht auftaucht und wie GEO hilft.',
    permalink: '/blog/ki-sichtbarkeit-chatgpt',
    body: `KI-Sichtbarkeit: Warum Ihr Unternehmen in ChatGPT unsichtbar ist

Viele Unternehmen investieren in SEO, aber werden von KI-Suchmaschinen ignoriert. Laut einer Studie von Gartner werden bis 2026 etwa 40% aller Suchanfragen über KI-Assistenten laufen.

Was ist Generative Engine Optimization?

GEO ist die Optimierung von Inhalten für KI-basierte Suchmaschinen wie ChatGPT, Perplexity und Google AI Overviews. Im Gegensatz zu traditionellem SEO geht es nicht nur um Rankings, sondern um Zitierbarkeit.

Wie funktioniert GEO in der Praxis?

Der Prozess umfasst drei Schritte: Strukturierung, Anreicherung mit Daten und Entitätsoptimierung. Unternehmen, die GEO einsetzen, sehen laut Studien eine 30% höhere Sichtbarkeit in KI-Ergebnissen.

Warum werden Sie von ChatGPT ignoriert?

Es gibt mehrere Gründe: fehlende strukturierte Daten, zu wenig Fakten und Statistiken, keine klaren Antwortstrukturen. ChatGPT bevorzugt Inhalte mit konkreten Zahlen und Faktenblöcken.

Feature\tVorteil\tWirkung
Strukturierte Daten\tBessere Erkennung\tHoch
Faktenblöcke\tHöhere Zitierrate\t+30%
E-E-A-T Signale\tVertrauenswürdigkeit\tMittel

Häufig gestellte Fragen

Was kostet GEO?
Die Kosten variieren je nach Umfang der Optimierung, beginnen aber typischerweise bei 500 Euro pro Monat für kleine Unternehmen.

Wie lange dauert es bis zu Ergebnissen?
Erste Verbesserungen in der KI-Sichtbarkeit zeigen sich in der Regel nach vier bis sechs Wochen.

Brauche ich trotzdem noch SEO?
Ja, SEO und GEO ergänzen sich. SEO sorgt für traditionelle Suchsichtbarkeit, während GEO die Zitierbarkeit in KI-Systemen verbessert.

${'Weitere Informationen zur Optimierung finden Sie in unseren Fallstudien. '.repeat(20)}`,
    ...overrides,
  });
}

describe('URL scanner integration', () => {
  it('detects plain-text headings in URL content', () => {
    const item = createUrlItem();
    const headings = detectPlaintextHeadings(item.body);
    expect(headings.length).toBeGreaterThan(0);
    const questionHeadings = headings.filter(h => h.text.endsWith('?'));
    expect(questionHeadings.length).toBeGreaterThan(0);
  });

  it('readability score is non-zero for German URL content', () => {
    const item = createUrlItem();
    const result = calculateReadability(item.body, 'de');
    expect(result.score).toBeGreaterThan(0);
    expect(result.avgSentenceLength).toBeGreaterThan(0);
  });

  it('slug-invalid-characters does not fire on URL path', () => {
    const item = createUrlItem();
    const results = slugInvalidCharacters.run(item, createContext());
    expect(results).toHaveLength(0);
  });

  it('missing-h1 does not fire on URL content', () => {
    const item = createUrlItem({ contentType: 'page' });
    const results = missingH1.run(item, createContext());
    expect(results).toHaveLength(0);
  });

  it('GEO question heading rule works on plain-text URL content', () => {
    const body = `What Is Dropshipping?\n\n${'word '.repeat(130)}\n\nHow Does It Work?\n\n${'word '.repeat(130)}\n\nGetting Started\n\n${'word '.repeat(130)}\n\nAdvanced Tips\n\n${'word '.repeat(130)}`;
    const item = createItem({ body, contentSource: 'url' });
    const results = geoNoQuestionHeadings.run(item, createContext());
    // 2/4 headings are questions = 50%, passes 20% threshold
    expect(results).toHaveLength(0);
  });
});
