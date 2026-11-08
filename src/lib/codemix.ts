/**
 * Code-Mix Language Detector (Heuristic)
 * Identifies script and vocabulary origin per word in speech transcripts.
 */

export type WordLanguage = 'hindi' | 'telugu' | 'english' | 'hinglish';

// Common Latin-transliterated Hindi / Mandi terms
const HINDI_ROMAN_WORDS = new Set([
  'bhai', 'bhaiya', 'lalaji', 'daam', 'bhav', 'rate', 'maal', 'kanta', 'bori', 'quintal',
  'aaj', 'subah', 'mandi', 'pados', 'udhari', 'udhaari', 'nagad', 'rokda', 'kam', 'zyada',
  'kisaan', 'kisan', 'khet', 'diesel', 'kharcha', 'theek', 'thik', 'hai', 'hain', 'mein',
  'se', 'ka', 'ki', 'ke', 'aur', 'par', 'pe', 'karo', 'kar', 'do', 'nahi', 'kuch', 'toh',
  'sample', 'laal', 'peela', 'kharab', 'badhao', 'dekh', 'lo', 'pakka', 'sauda', 'manjoor',
  'apmc', 'teja', 'shivam', 'tamatar', 'mirch', 'paisa', 'rupaye', 'rupayee'
]);

// Common Latin-transliterated Telugu terms
const TELUGU_ROMAN_WORDS = new Set([
  'meeru', 'cheppedi', 'undi', 'thakkuva', 'ivvanu', 'ivvandi', 'sare', 'saripothundi',
  'oppukunna', 'chala', 'mandi', 'dharalu', 'rate', 'evaru', 'kadu', 'ledu', 'anna',
  'babu', 'gaaru', 'kilo', 'basti', 'roopayalu', 'ivvali'
]);

export interface AnalyzedWord {
  word: string;
  lang: WordLanguage;
  script: 'Devanagari' | 'Telugu' | 'Latin' | 'Other';
}

export interface CodeMixAnalysis {
  words: AnalyzedWord[];
  languagesDetected: Set<WordLanguage>;
  isMixed: boolean;
  dominantLang: WordLanguage;
  stats: {
    hindi: number;
    telugu: number;
    english: number;
  };
}

export function analyzeCodeMix(text: string): CodeMixAnalysis {
  if (!text) {
    return {
      words: [],
      languagesDetected: new Set(),
      isMixed: false,
      dominantLang: 'english',
      stats: { hindi: 0, telugu: 0, english: 0 },
    };
  }

  const rawWords = text.trim().split(/\s+/);
  const words: AnalyzedWord[] = [];
  const detectedLangs = new Set<WordLanguage>();
  const stats = { hindi: 0, telugu: 0, english: 0 };

  for (const rawWord of rawWords) {
    // Strip trailing punctuation
    const cleanWord = rawWord.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
    if (!cleanWord) continue;

    let lang: WordLanguage = 'english';
    let script: AnalyzedWord['script'] = 'Latin';

    // 1. Script checks via Unicode ranges
    if (/[\u0900-\u097F]/.test(cleanWord)) {
      script = 'Devanagari';
      lang = 'hindi';
    } else if (/[\u0C00-\u0C7F]/.test(cleanWord)) {
      script = 'Telugu';
      lang = 'telugu';
    } else {
      // 2. Latin script vocabulary checks
      if (HINDI_ROMAN_WORDS.has(cleanWord)) {
        lang = 'hindi';
      } else if (TELUGU_ROMAN_WORDS.has(cleanWord)) {
        lang = 'telugu';
      } else {
        lang = 'english';
      }
    }

    if (lang === 'hindi') stats.hindi++;
    else if (lang === 'telugu') stats.telugu++;
    else stats.english++;

    detectedLangs.add(lang);
    words.push({ word: rawWord, lang, script });
  }

  const distinctCount = detectedLangs.size;
  const isMixed = distinctCount > 1;

  let dominantLang: WordLanguage = 'english';
  if (stats.hindi >= stats.telugu && stats.hindi >= stats.english) dominantLang = 'hindi';
  else if (stats.telugu >= stats.hindi && stats.telugu >= stats.english) dominantLang = 'telugu';

  return {
    words,
    languagesDetected: detectedLangs,
    isMixed,
    dominantLang,
    stats,
  };
}
