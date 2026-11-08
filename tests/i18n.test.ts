import { describe, expect, it } from 'vitest';
import { t, UI_LANGUAGES } from '../src/lib/i18n';

describe('UI language translations', () => {
  it('provides the supported Indian-language UI options', () => {
    expect(UI_LANGUAGES.map(({ code }) => code)).toEqual(['en', 'hi', 'te', 'bn', 'ta']);
  });

  it('translates setup labels and interpolates the speech error in every UI language', () => {
    for (const { code } of UI_LANGUAGES) {
      for (const key of [
        'quantityToSell',
        'farmerTerms',
        'howTitle',
        'tricksTitle',
        'footerPrivacy',
      ]) {
        expect(t(code, key)).not.toBe(key);
      }
      expect(t(code, 'noSpeech', { language: 'Hindi' })).not.toContain('{language}');
    }
  });
});
