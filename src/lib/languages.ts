import { Language } from '../types';

/**
 * Language wiring for the two Gnani speech services.
 *
 * Prisma (STT):
 *   hinglish → hi-IN + en-IN hints, transliterated so the transcript stays in
 *              Latin script and matches the Hinglish UI.
 *   hindi    → hi-IN, ITN-transcribed (Devanagari).
 *   telugu   → te-IN, ITN-transcribed (Telugu script).
 *
 * Timbre (TTS): Avinash (Timbre v3) is a male trader voice that speaks every
 * supported language, so Lalaji keeps one consistent persona.
 */
export const LANGUAGES: Language[] = [
  {
    code: 'hinglish',
    name: 'Hinglish',
    nativeName: 'हिंग्लिश (Bilingual)',
    prismaCode: 'hi-IN,en-IN',
    sttFormat: 'transliterate',
    timbreCode: 'Avinash',
    ttsLanguage: 'hi-en',
    isRegional: false,
  },
  {
    code: 'telugu',
    name: 'Telugu / Hinglish-South',
    nativeName: 'తెలుగు (Telugu)',
    prismaCode: 'te-IN',
    sttFormat: 'transcribe',
    timbreCode: 'Avinash',
    ttsLanguage: 'te-IN',
    isRegional: true,
  },
  {
    code: 'hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी (Hindi)',
    prismaCode: 'hi-IN',
    sttFormat: 'transcribe',
    timbreCode: 'Avinash',
    ttsLanguage: 'hi-IN',
    isRegional: true,
  },
  {
    code: 'english',
    name: 'English',
    nativeName: 'English',
    prismaCode: 'en-IN',
    sttFormat: 'transcribe',
    timbreCode: 'Avinash',
    ttsLanguage: 'en-IN',
    isRegional: false,
  },
];

export const DEFAULT_LANGUAGE = LANGUAGES[0]; // Hinglish
