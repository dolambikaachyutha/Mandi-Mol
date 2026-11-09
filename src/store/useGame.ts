import { create } from 'zustand';
import {
  Crop,
  Difficulty,
  FsmState,
  Language,
  NoiseTestLog,
  ProviderMode,
  ScorecardData,
  TraderMood,
  TrickId,
  Turn,
} from '../types';
import { audioManager } from '../lib/audio';
import {
  checkProviderHealth,
  requestCoachScorecard,
  requestTraderTurn,
  synthesizeSpeech,
  transcribeAudio,
} from '../lib/api';
import { DEFAULT_CROP } from '../lib/crops';
import { MandiGameEngine } from '../lib/engine';
import { fsmReducer } from '../lib/fsm';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../lib/languages';
import { MandiNoiseLevel, mixMandiNoiseIntoAudio } from '../lib/noise';
import { calculateScore } from '../lib/scoring';
import { telemetry } from '../lib/telemetry';
import { convertToPrismaWav } from '../lib/wav';
import { t, UiLang } from '../lib/i18n';

const UI_LANGUAGE_STORAGE_KEY = 'mandi_mol_ui_language_v1';
const UI_LANGUAGES: UiLang[] = ['en', 'hi', 'te', 'bn', 'ta'];

function getStoredUiLanguage(): UiLang {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
  return UI_LANGUAGES.includes(saved as UiLang) ? (saved as UiLang) : 'en';
}

function getOpeningLine(crop: Crop, language: Language, openingOffer: number): string {
  if (language.code === 'telugu') {
    return `నమస్కారం! ${crop.name} పంటకు కిలోకు ₹${openingOffer} ఇవ్వగలను.`;
  }
  if (language.code === 'hindi') {
    return `नमस्ते! ${crop.name} के लिए ₹${openingOffer}/किलो दे सकता हूँ।`;
  }
  if (language.code === 'english') {
    return `Hello! I can offer ₹${openingOffer}/kg for your ${crop.name}.`;
  }
  return `Namaste bhai! ${crop.name} ke liye ₹${openingOffer}/kg de sakta hoon.`;
}

interface GameStore {
  // Config
  crop: Crop;
  language: Language;
  uiLanguage: UiLang;
  difficulty: Difficulty;
  farmerTerms: string;
  traderTerms: string;
  quantityKg: number;
  engine: MandiGameEngine | null;

  // Runtime
  fsmState: FsmState;
  round: number;
  maxRounds: number;
  currentOffer: number;
  openingOffer: number;
  reservePrice: number; // Hidden from player until game ends
  patience: number;
  tricksUsed: TrickId[];
  tricksChallenged: TrickId[];
  history: Turn[];
  scorecard: ScorecardData | null;
  dealStruck: boolean;
  traderWalkedAway: boolean;

  // Visual & Audio States
  avatarMood: TraderMood;
  speechBubbleText: string;
  audioAmplitude: number;
  isUnderTheHoodOpen: boolean;
  noiseLevel: MandiNoiseLevel;
  noiseLogs: NoiseTestLog[];
  isTextInputActive: boolean;
  isStartingRecording: boolean;
  voiceError: string | null;
  providerHealth: {
    prisma: { ok: boolean; latencyMs: number; mode: ProviderMode };
    evon: { ok: boolean; latencyMs: number; mode: ProviderMode };
    timbre: { ok: boolean; latencyMs: number; mode: ProviderMode };
  };

  // Actions
  setCrop: (crop: Crop) => void;
  setLanguage: (lang: Language) => void;
  setUiLanguage: (language: UiLang) => void;
  setFarmerTerms: (terms: string) => void;
  setTraderTerms: (terms: string) => void;
  setDifficulty: (diff: Difficulty) => void;
  setNoiseLevel: (level: MandiNoiseLevel) => void;
  toggleUnderTheHood: () => void;
  setTextInputActive: (active: boolean) => void;
  initSession: () => void;
  startRecording: () => Promise<void>;
  stopRecordingAndProcess: () => Promise<void>;
  submitManualFarmerText: (text: string, providedStt?: Turn['telemetry']['stt']) => Promise<void>;
  confirmNoiseTestResult: (id: string, accurate: boolean) => void;
  resetGame: () => void;
  refreshHealth: () => Promise<void>;
}

export const useGame = create<GameStore>((set, get) => ({
  crop: DEFAULT_CROP,
  language: DEFAULT_LANGUAGE,
  uiLanguage: getStoredUiLanguage(),
  difficulty: 'easy',
  farmerTerms: '',
  traderTerms: '',
  quantityKg: DEFAULT_CROP.defaultQuantity,
  engine: null,

  fsmState: 'idle',
  round: 0,
  maxRounds: 7,
  currentOffer: 155,
  openingOffer: 155,
  reservePrice: 190,
  patience: 5,
  tricksUsed: [],
  tricksChallenged: [],
  history: [],
  scorecard: null,
  dealStruck: false,
  traderWalkedAway: false,

  avatarMood: 'idle',
  speechBubbleText: '',
  audioAmplitude: 0,
  isUnderTheHoodOpen: typeof window !== 'undefined' && window.location.search.includes('judge=1'),
  noiseLevel: 'off',
  noiseLogs: [],
  isTextInputActive: false,
  isStartingRecording: false,
  voiceError: null,
  providerHealth: {
    prisma: { ok: true, latencyMs: 140, mode: 'mock' },
    evon: { ok: true, latencyMs: 220, mode: 'mock' },
    timbre: { ok: true, latencyMs: 190, mode: 'mock' },
  },

  setCrop: (crop) => set({ crop, quantityKg: crop.defaultQuantity }),
  setLanguage: (language) => set({ language, voiceError: null }),
  setUiLanguage: (uiLanguage) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, uiLanguage);
    }
    let matchedLang = get().language;
    if (uiLanguage === 'te') {
      matchedLang = LANGUAGES.find((l) => l.code === 'telugu') || matchedLang;
    } else if (uiLanguage === 'hi') {
      matchedLang = LANGUAGES.find((l) => l.code === 'hindi') || matchedLang;
    } else if (uiLanguage === 'en') {
      matchedLang = LANGUAGES.find((l) => l.code === 'english') || matchedLang;
    }
    set({ uiLanguage, language: matchedLang });
  },
  setFarmerTerms: (farmerTerms) => set({ farmerTerms: farmerTerms.slice(0, 500) }),
  setTraderTerms: (traderTerms) => set({ traderTerms: traderTerms.slice(0, 500) }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setNoiseLevel: (noiseLevel) => set({ noiseLevel }),
  toggleUnderTheHood: () => set((s) => ({ isUnderTheHoodOpen: !s.isUnderTheHoodOpen })),
  setTextInputActive: (isTextInputActive) => set({ isTextInputActive }),

  initSession: () => {
    const { crop, language, difficulty, quantityKg } = get();
    const engine = new MandiGameEngine({
      crop,
      language,
      difficulty,
      quantityKg,
    });

    set({
      engine,
      fsmState: 'idle',
      round: 0,
      maxRounds: engine.maxRounds,
      currentOffer: engine.openingOffer,
      openingOffer: engine.openingOffer,
      reservePrice: engine.reservePrice,
      patience: 5,
      tricksUsed: [],
      tricksChallenged: [],
      history: [],
      scorecard: null,
      dealStruck: false,
      traderWalkedAway: false,
      avatarMood: 'idle',
      speechBubbleText: getOpeningLine(crop, language, engine.openingOffer),
    });
  },

  refreshHealth: async () => {
    const h = await checkProviderHealth();
    set({ providerHealth: h });
  },

  startRecording: async () => {
    const state = get();
    if (state.fsmState !== 'idle' || state.dealStruck || state.traderWalkedAway) return;

    try {
      set({
        fsmState: fsmReducer(state.fsmState, { type: 'START_RECORDING' }),
        isStartingRecording: true,
        voiceError: null,
      });
      await audioManager.startRecording(() => {
        get().stopRecordingAndProcess();
      });
      set({ isStartingRecording: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start microphone recording.';
      set({
        fsmState: 'idle',
        isStartingRecording: false,
        isTextInputActive: true,
        voiceError: message,
      });
    }
  },

  stopRecordingAndProcess: async () => {
    const state = get();
    if (state.fsmState !== 'recording') return;

    set({
      fsmState: fsmReducer(state.fsmState, { type: 'STOP_RECORDING' }),
      isStartingRecording: false,
      voiceError: null,
    });

    try {
      const rec = await audioManager.stopRecording();
      // Apply noise torture test mixer if active
      const { mixedBlob, snrDb } = await mixMandiNoiseIntoAudio(rec.blob, state.noiseLevel);
      // Prisma accepts WAV/MP3/OGG/FLAC/AAC/M4A, not the WEBM that Chrome records.
      const uploadBlob = await convertToPrismaWav(mixedBlob);

      set({ fsmState: 'transcribing' });
      const stt = await transcribeAudio(
        uploadBlob,
        uploadBlob.type || 'audio/wav',
        state.language.prismaCode,
        state.language.sttFormat
      );

      // Record noise test telemetry
      const noiseLogId = `noise_${Date.now()}`;
      const logEntry: NoiseTestLog = {
        id: noiseLogId,
        timestamp: Date.now(),
        noiseLevel: state.noiseLevel,
        snrEstimate: snrDb,
        recognizedTranscript: stt.text,
        farmerConfirmedCorrect: null,
        confidence: stt.confidence,
        latencyMs: stt.latencyMs,
      };
      telemetry.recordNoiseTest(logEntry);
      set({ noiseLogs: telemetry.getNoiseLogs() });

      if (!stt.text) {
        set({
          fsmState: 'idle',
          voiceError: t(get().uiLanguage, 'noSpeech', { language: state.language.name }),
        });
        return;
      }

      const sttTelemetry: Turn['telemetry']['stt'] = {
        transcript: stt.text,
        detectedLanguage: stt.language,
        confidence: stt.confidence,
        latencyMs: stt.latencyMs,
      };

      await get().submitManualFarmerText(stt.text, sttTelemetry);
    } catch (err) {
      console.error('Recording processing error:', err);
      const message = err instanceof Error ? err.message : 'Voice processing failed. Please try again.';
      set({
        fsmState: 'idle',
        isStartingRecording: false,
        voiceError: message,
      });
    }
  },

  submitManualFarmerText: async (farmerText: string, providedStt?: Turn['telemetry']['stt']) => {
    const state = get();
    if (!state.engine) return;

    const stt = providedStt || {
      transcript: farmerText,
      detectedLanguage: state.language.prismaCode,
      confidence: 1.0,
      latencyMs: 15,
    };

    set({ fsmState: 'thinking', avatarMood: 'idle', voiceError: null });

    // Request Evon Trader turn
    const allowedMax = state.engine.getAllowedMaxOffer(state.round + 1);
    const traderResp = await requestTraderTurn({
      farmerSpeech: farmerText,
      cropName: state.crop.name,
      cropVariety: state.crop.variety,
      currentOffer: state.engine.currentOffer,
      allowedMaxOffer: allowedMax,
      round: state.round + 1,
      maxRounds: state.engine.maxRounds,
      difficulty: state.difficulty,
      patience: state.engine.patience,
      languageName: state.language.name,
      languageCode: state.language.code,
      usedTricks: [...state.engine.tricksUsed],
      farmerTerms: state.farmerTerms,
      traderTerms: state.traderTerms,
      historySummary: state.history.map((h) => `Round ${h.round}: Farmer said "${h.farmerText}", Trader offered ₹${h.traderOffer}`).join('\n'),
    });

    // Synthesize Timbre TTS for trader line
    const tts = await synthesizeSpeech(traderResp.line, state.language.timbreCode, state.language.ttsLanguage);

    // Engine processTurn: CODE OWNS ALL NUMBERS
    const turn = state.engine.processTurn(
      farmerText,
      traderResp,
      stt,
      traderResp.latencyMs,
      {
        charsSynthesized: tts.chars,
        latencyMs: tts.latencyMs,
        cacheHit: tts.cacheHit,
        fallbackUsed: tts.fallbackUsed,
      },
      traderResp.provider ?? 'engine'
    );

    telemetry.recordTurn(turn.telemetry);

    set({
      history: [...state.engine.history],
      round: state.engine.round,
      currentOffer: state.engine.currentOffer,
      patience: state.engine.patience,
      tricksUsed: [...state.engine.tricksUsed],
      tricksChallenged: [...state.engine.tricksChallenged],
      dealStruck: state.engine.isDeal,
      traderWalkedAway: state.engine.isWalkaway,
      avatarMood: turn.traderMood,
      speechBubbleText: turn.traderLine,
      fsmState: 'speaking',
    });

    // Play synthesized voice with avatar mouth movement if audio returned
    if (tts.audioBase64) {
      audioManager.playAudio(
        `data:${tts.mime};base64,${tts.audioBase64}`,
        (amp) => set({ audioAmplitude: amp }),
        () => {
          set({ audioAmplitude: 0 });
          finishTurn(get());
        }
      );
    } else {
      // Subtitles only mode: brief reading delay
      setTimeout(() => finishTurn(get()), 2400);
    }
  },

  confirmNoiseTestResult: (id, accurate) => {
    telemetry.updateNoiseTestConfirmation(id, accurate);
    set({ noiseLogs: telemetry.getNoiseLogs() });
  },

  resetGame: () => {
    audioManager.stopPlayback();
    get().initSession();
  },
}));

async function finishTurn(state: ReturnType<typeof useGame.getState>) {
  if (state.dealStruck || state.traderWalkedAway) {
    const turnsSummary = state.history
      .map((t) => `Round ${t.round}: Farmer: "${t.farmerText}" -> Trader: "${t.traderLine}" (Offer: ₹${t.traderOffer})`)
      .join('\n');

    const coachResp = await requestCoachScorecard({
      cropName: state.crop.name,
      finalPrice: state.currentOffer,
      reservePrice: state.reservePrice,
      quantityKg: state.quantityKg,
      turnsSummary,
    });

    const finalScore = calculateScore({
      finalPrice: state.currentOffer,
      reservePrice: state.reservePrice,
      openingOffer: state.openingOffer,
      referencePrice: state.crop.referencePrice,
      quantityKg: state.quantityKg,
      roundsTaken: state.round,
      tricksChallengedCount: state.tricksChallenged.length,
      history: state.history,
      dealStruck: state.dealStruck,
      evonCoachFeedback: coachResp,
    });

    useGame.setState({
      fsmState: 'scoring',
      scorecard: finalScore,
    });
  } else {
    useGame.setState({ fsmState: 'idle' });
  }
}
