import { describe, it, expect } from 'vitest';
import { analyzePassiveVoice } from '../../../src/utils/geo-advanced-analyzer.js';

describe('analyzePassiveVoice', () => {
  describe('German passive voice (locale=de)', () => {
    it('detects standard passive with "wurde" + ge-participle', () => {
      const result = analyzePassiveVoice('Der Bericht wurde geschrieben.', 'de');
      expect(result.totalSentences).toBe(1);
      expect(result.passiveSentences).toBe(1);
      expect(result.passiveRatio).toBe(1);
    });

    it('detects passive with -iert participle', () => {
      const result = analyzePassiveVoice('Das System wurde implementiert.', 'de');
      expect(result.passiveSentences).toBe(1);
      expect(result.passiveRatio).toBe(1);
    });

    it('detects passive with separable prefix participle', () => {
      const result = analyzePassiveVoice('Das Fenster wurde aufgemacht.', 'de');
      expect(result.passiveSentences).toBe(1);
      expect(result.passiveRatio).toBe(1);
    });

    it('does not flag active voice as passive', () => {
      const result = analyzePassiveVoice('Der Hund lief schnell.', 'de');
      expect(result.totalSentences).toBe(1);
      expect(result.passiveSentences).toBe(0);
      expect(result.passiveRatio).toBe(0);
    });

    it('detects passive with inseparable prefix participle', () => {
      const result = analyzePassiveVoice('Der Plan wurde beschlossen.', 'de');
      expect(result.passiveSentences).toBe(1);
      expect(result.passiveRatio).toBe(1);
    });
  });

  describe('English passive voice', () => {
    it('detects passive without explicit locale (defaults to en)', () => {
      const result = analyzePassiveVoice('The report was written.');
      expect(result.totalSentences).toBe(1);
      expect(result.passiveSentences).toBe(1);
      expect(result.passiveRatio).toBe(1);
    });

    it('detects passive with explicit locale=en', () => {
      const result = analyzePassiveVoice('The report was written.', 'en');
      expect(result.passiveSentences).toBe(1);
      expect(result.passiveRatio).toBe(1);
    });
  });
});
