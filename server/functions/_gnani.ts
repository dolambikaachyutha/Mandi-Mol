/**
 * ============================================================================
 * GNANI AI PROVIDER ADAPTER (Hardened: Prisma STT · Timbre TTS · Evon reasoning)
 * ============================================================================
 * Production grade:
 * - Timeouts (AbortSignal)
 * - Exponential backoff retry on transient 5xx/network errors
 * - Circuit breaker to prevent cascading failures
 * - Kill-switch support via KILL_SWITCH=true
 * - Real provider health pinging
 */

export type VoiceLanguage = 'hinglish' | 'hindi' | 'telugu' | 'english';

export interface GnaniConfig {
  apiKey: string;
  baseUrl: string;
  sttModel: string;
  ttsModel: string;
  ttsVoices: Record<VoiceLanguage, string>;
  evonEndpoint: string;
  evonApiKey: string;
  evonModel: string;
}

// ----------------------------------------------------------------------------
// CIRCUIT BREAKER IMPLEMENTATION
// ----------------------------------------------------------------------------
interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuits: Record<'prisma' | 'timbre' | 'evon', CircuitState> = {
  prisma: { failures: 0, lastFailure: 0, isOpen: false },
  timbre: { failures: 0, lastFailure: 0, isOpen: false },
  evon: { failures: 0, lastFailure: 0, isOpen: false },
};

const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 30000; // 30s open window

function checkCircuit(name: 'prisma' | 'timbre' | 'evon'): void {
  const c = circuits[name];
  if (c.isOpen) {
    if (Date.now() - c.lastFailure > CIRCUIT_COOLDOWN_MS) {
      // Half-open: allow a trial request
      c.isOpen = false;
      c.failures = 0;
    } else {
      throw new Error(`GNANI_CIRCUIT_OPEN: ${name.toUpperCase()} circuit is open due to recent failures. Request rejected to prevent cascading errors.`);
    }
  }
}

function recordCircuitSuccess(name: 'prisma' | 'timbre' | 'evon'): void {
  circuits[name].failures = 0;
  circuits[name].isOpen = false;
}

function recordCircuitFailure(name: 'prisma' | 'timbre' | 'evon'): void {
  const c = circuits[name];
  c.failures += 1;
  c.lastFailure = Date.now();
  if (c.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    c.isOpen = true;
  }
}

// ----------------------------------------------------------------------------
// RETRY WITH EXPONENTIAL BACKOFF
// ----------------------------------------------------------------------------
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  baseDelayMs: number = 300
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Only retry on network errors, timeouts, or 5xx
      const isTransient = /timeout|aborted|network|HTTP_5/i.test(msg);
      if (!isTransient || attempt === retries) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || /^your[_-]/i.test(trimmed)) return null;
  return trimmed;
}

export function getGnaniConfig(): GnaniConfig {
  const baseUrl = (readEnv('GNANI_BASE_URL') || 'https://api.vachana.ai').replace(/\/+$/, '');
  return {
    apiKey: readEnv('GNANI_API_KEY') || '',
    baseUrl,
    sttModel: readEnv('GNANI_STT_MODEL') || 'prisma-v3.0',
    ttsModel: readEnv('GNANI_TTS_MODEL') || 'timbre-v3.0',
    ttsVoices: {
      hinglish: readEnv('GNANI_TTS_VOICE_HINGLISH') || 'Avinash',
      hindi: readEnv('GNANI_TTS_VOICE_HINDI') || 'Avinash',
      telugu: readEnv('GNANI_TTS_VOICE_TELUGU') || 'Avinash',
      english: readEnv('GNANI_TTS_VOICE_ENGLISH') || 'Avinash',
    },
    evonEndpoint: readEnv('EVON_ENDPOINT') || '',
    evonApiKey: readEnv('EVON_API_KEY') || '',
    evonModel: readEnv('EVON_MODEL') || 'gnani-evon-v3.3',
  };
}

export function isKillSwitchActive(): boolean {
  return process.env.KILL_SWITCH === 'true';
}

export function isSpeechConfigured(): boolean {
  if (isKillSwitchActive()) return false;
  return Boolean(getGnaniConfig().apiKey);
}

export function isEvonConfigured(): boolean {
  if (isKillSwitchActive()) return false;
  const config = getGnaniConfig();
  return Boolean(config.evonEndpoint && config.evonApiKey);
}

export function getProviderStatus() {
  const config = getGnaniConfig();
  const kill = isKillSwitchActive();
  const speechLive = Boolean(config.apiKey) && !kill;
  const evonLive = isEvonConfigured();

  return {
    killSwitch: kill,
    prisma: {
      ok: speechLive && !circuits.prisma.isOpen,
      circuitOpen: circuits.prisma.isOpen,
      mode: speechLive ? 'live' : 'mock',
      provider: 'Gnani AI Prisma (STT)',
      model: config.sttModel,
    },
    timbre: {
      ok: speechLive && !circuits.timbre.isOpen,
      circuitOpen: circuits.timbre.isOpen,
      mode: speechLive ? 'live' : 'mock',
      provider: 'Gnani AI Timbre (TTS)',
      model: config.ttsModel,
    },
    evon: {
      ok: evonLive && !circuits.evon.isOpen,
      circuitOpen: circuits.evon.isOpen,
      mode: evonLive ? 'live' : 'engine',
      provider: evonLive ? 'Gnani AI Evon (LLM)' : 'Deterministic engine brain',
      model: evonLive ? config.evonModel : 'engine-v1',
    },
  };
}

// ----------------------------------------------------------------------------
// REAL HEALTH PING FUNCTION
// ----------------------------------------------------------------------------
export async function pingGnaniProviders(): Promise<{
  prismaPingOk: boolean;
  timbrePingOk: boolean;
  evonPingOk: boolean;
  latenciesMs: { baseUrl: number; evon: number };
}> {
  const config = getGnaniConfig();
  let baseUrlLatency = 0;
  let evonLatency = 0;
  let baseOk = false;
  let evonOk = false;

  if (config.apiKey && !isKillSwitchActive()) {
    try {
      const start = Date.now();
      const res = await fetch(`${config.baseUrl}/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      }).catch(() => fetch(`${config.baseUrl}/`, { method: 'GET', signal: AbortSignal.timeout(3000) }));
      baseUrlLatency = Date.now() - start;
      baseOk = res.status < 500;
    } catch {
      baseOk = false;
    }
  }

  if (config.evonEndpoint && !isKillSwitchActive()) {
    try {
      const start = Date.now();
      const res = await fetch(config.evonEndpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      }).catch(() => fetch(config.evonEndpoint, { method: 'GET', signal: AbortSignal.timeout(3000) }));
      evonLatency = Date.now() - start;
      evonOk = res.status < 500;
    } catch {
      evonOk = false;
    }
  }

  return {
    prismaPingOk: baseOk,
    timbrePingOk: baseOk,
    evonPingOk: evonOk,
    latenciesMs: { baseUrl: baseUrlLatency, evon: evonLatency },
  };
}

function requireApiKey(): GnaniConfig {
  if (isKillSwitchActive()) {
    throw new Error('KILL_SWITCH_ACTIVE: Gnani AI services temporarily paused by admin kill switch.');
  }
  const config = getGnaniConfig();
  if (!config.apiKey) {
    throw new Error('CONFIG_ERROR: GNANI_API_KEY is not configured in Vercel environment variables.');
  }
  return config;
}

// ----------------------------------------------------------------------------
// Audio helpers
// ----------------------------------------------------------------------------
const MIME_TO_EXTENSION: Record<string, string> = {
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/ogg': 'ogg',
  'audio/ogg;codecs=opus': 'ogg',
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/aac': 'aac',
};

function extensionForMime(mimeType: string): string {
  const normalized = (mimeType || '').split(';')[0].trim().toLowerCase();
  const extension = MIME_TO_EXTENSION[normalized];
  if (!extension) {
    throw new Error(
      `UNSUPPORTED_AUDIO_FORMAT: Prisma accepts WAV, MP3, OGG, FLAC, AAC or M4A audio (received ${mimeType || 'unknown'}).`
    );
  }
  return extension;
}

// ----------------------------------------------------------------------------
// 1. PRISMA: SPEECH-TO-TEXT (HARDENED)
// ----------------------------------------------------------------------------
export interface PrismaResult {
  text: string;
  language: string;
  confidence: number;
  latencyMs: number;
  model: string;
  requestId?: string;
}

export async function callPrismaStt(
  audioBase64: string,
  mimeType: string,
  languageCode: string,
  format: 'transcribe' | 'transliterate' | 'codemix' = 'transcribe'
): Promise<PrismaResult> {
  checkCircuit('prisma');
  const config = requireApiKey();
  const extension = extensionForMime(mimeType);

  const audioBytes = Buffer.from(audioBase64, 'base64');
  if (audioBytes.length === 0) {
    throw new Error('EMPTY_AUDIO: No audio data was recorded.');
  }

  const form = new FormData();
  form.append('audio_file', new Blob([audioBytes], { type: mimeType || 'audio/wav' }), `farmer-turn.${extension}`);
  form.append('model', config.sttModel);
  form.append('language_code', languageCode || 'indic-auto');
  if (format) form.append('format', format);
  form.append('bias_list', JSON.stringify(['APMC', 'mandi', 'katauti', 'Teja', 'Agmarknet', 'e-NAM', 'quintal', 'bhav', 'sauda']));

  return await withRetry(async () => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${config.baseUrl}/stt/v3`, {
        method: 'POST',
        headers: { 'X-API-Key-ID': config.apiKey },
        body: form,
        signal: AbortSignal.timeout(10000), // 10s strict timeout
      });

      const latencyMs = Date.now() - startTime;
      const raw = await response.text();
      let json: Record<string, unknown> = {};
      try {
        json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        const detail = (json.detail ?? json.error ?? json.message ?? raw) as unknown;
        const message = typeof detail === 'string' ? detail : JSON.stringify(detail);
        throw new Error(`PRISMA_HTTP_${response.status}: ${message || 'transcription failed'}`);
      }

      if (json.success === false) {
        const error = json.error as { message?: string } | string | undefined;
        const message = typeof error === 'string' ? error : error?.message || 'transcription failed';
        throw new Error(`PRISMA_ERROR: ${message}`);
      }

      recordCircuitSuccess('prisma');
      const text = typeof json.transcript === 'string' ? json.transcript.trim() : '';
      const detected = typeof json.detected_language_code === 'string' ? json.detected_language_code : languageCode;

      return {
        text,
        language: detected,
        confidence: typeof json.confidence === 'number' ? json.confidence : 1,
        latencyMs: typeof json.end_to_end_latency === 'number' ? Math.round(json.end_to_end_latency * 1000) : latencyMs,
        model: typeof json.model === 'string' ? json.model : config.sttModel,
        requestId: typeof json.request_id === 'string' ? json.request_id : undefined,
      };
    } catch (err) {
      recordCircuitFailure('prisma');
      throw err;
    }
  });
}

// ----------------------------------------------------------------------------
// 2. TIMBRE: TEXT-TO-SPEECH (HARDENED WITH IN-MEMORY HASH CACHE)
// ----------------------------------------------------------------------------
export interface TimbreResult {
  audioBase64: string;
  mime: string;
  chars: number;
  latencyMs: number;
  model: string;
}

const ttsMemoryCache = new Map<string, TimbreResult>();

export async function callTimbreTts(
  text: string,
  voice: string,
  language: string,
  model?: string
): Promise<TimbreResult> {
  checkCircuit('timbre');
  const config = requireApiKey();
  const trimmed = text.slice(0, 480);
  const cacheKey = `${voice}_${language}_${trimmed}`;

  const cached = ttsMemoryCache.get(cacheKey);
  if (cached) {
    return { ...cached, latencyMs: 5 };
  }

  return await withRetry(async () => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${config.baseUrl}/api/v1/tts/inference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key-ID': config.apiKey,
        },
        body: JSON.stringify({
          text: trimmed,
          voice,
          model: model || config.ttsModel,
          language: language || 'auto',
          speed: 1.05,
          audio_config: { container: 'mp3', bitrate: '128k' },
        }),
        signal: AbortSignal.timeout(8000), // 8s timeout
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        let message = errorText;
        try {
          const parsed = JSON.parse(errorText) as { message?: string; detail?: { message?: string } };
          message = parsed.message || parsed.detail?.message || errorText;
        } catch {
          // keep raw body
        }
        throw new Error(`TIMBRE_HTTP_${response.status}: ${message}`);
      }

      const audio = Buffer.from(await response.arrayBuffer());
      if (audio.length === 0) {
        throw new Error('TIMBRE_EMPTY_AUDIO: Timbre returned empty stream.');
      }

      recordCircuitSuccess('timbre');
      const result: TimbreResult = {
        audioBase64: audio.toString('base64'),
        mime: response.headers.get('content-type') || 'audio/mpeg',
        chars: trimmed.length,
        latencyMs,
        model: model || config.ttsModel,
      };

      if (ttsMemoryCache.size < 500) {
        ttsMemoryCache.set(cacheKey, result);
      }

      return result;
    } catch (err) {
      recordCircuitFailure('timbre');
      throw err;
    }
  });
}

// ----------------------------------------------------------------------------
// 3. EVON: REASONING & INTENT PARSING (HARDENED)
// ----------------------------------------------------------------------------
export interface EvonResult {
  rawText: string;
  latencyMs: number;
  model: string;
}

export async function callEvonInference(systemPrompt: string, userPrompt: string): Promise<EvonResult> {
  checkCircuit('evon');
  const config = getGnaniConfig();
  if (!config.evonEndpoint || !config.evonApiKey || isKillSwitchActive()) {
    throw new Error('EVON_NOT_CONFIGURED: Evon is not provisioned for this key.');
  }

  return await withRetry(async () => {
    const startTime = Date.now();
    try {
      const response = await fetch(config.evonEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key-ID': config.evonApiKey,
          Authorization: `Bearer ${config.evonApiKey}`,
        },
        body: JSON.stringify({
          model: config.evonModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 450,
        }),
        signal: AbortSignal.timeout(12000), // 12s timeout
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`EVON_HTTP_${response.status}: ${errText}`);
      }

      const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        content?: string;
        text?: string;
        output?: string;
      };

      const rawText =
        json.choices?.[0]?.message?.content || json.content || json.text || json.output || '';

      if (!rawText.trim()) {
        throw new Error('EVON_EMPTY_RESPONSE: Model returned no text.');
      }

      recordCircuitSuccess('evon');
      return { rawText, latencyMs, model: config.evonModel };
    } catch (err) {
      recordCircuitFailure('evon');
      throw err;
    }
  });
}
