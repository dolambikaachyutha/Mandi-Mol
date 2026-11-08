/**
 * ============================================================================
 * GNANI AI PROVIDER ADAPTER (Prisma STT · Timbre TTS · Evon reasoning)
 * ============================================================================
 * Every Gnani-specific URL, header, payload and response parser lives here.
 * Docs: https://docs.gnani.ai
 *
 *   Prisma (STT) : POST {base}/stt/v3                multipart/form-data
 *   Timbre (TTS) : POST {base}/api/v1/tts/inference  JSON in, binary audio out
 *   Evon (LLM)   : OpenAI-compatible chat completions (waitlist access only)
 *
 * Auth: every request sends the key in the `X-API-Key-ID` header.
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

export function isSpeechConfigured(): boolean {
  return Boolean(getGnaniConfig().apiKey);
}

export function isEvonConfigured(): boolean {
  const config = getGnaniConfig();
  return Boolean(config.evonEndpoint && config.evonApiKey);
}

export function getProviderStatus() {
  const config = getGnaniConfig();
  const speechLive = Boolean(config.apiKey);
  const evonLive = isEvonConfigured();

  return {
    prisma: {
      ok: speechLive,
      mode: speechLive ? 'live' : 'mock',
      provider: 'Gnani AI Prisma (STT)',
      model: config.sttModel,
    },
    timbre: {
      ok: speechLive,
      mode: speechLive ? 'live' : 'mock',
      provider: 'Gnani AI Timbre (TTS)',
      model: config.ttsModel,
    },
    evon: {
      ok: evonLive,
      mode: evonLive ? 'live' : 'engine',
      provider: evonLive ? 'Gnani AI Evon (LLM)' : 'Deterministic engine brain',
      model: evonLive ? config.evonModel : 'engine-v1',
    },
  };
}

function requireApiKey(): GnaniConfig {
  const config = getGnaniConfig();
  if (!config.apiKey) {
    throw new Error('CONFIG_ERROR: GNANI_API_KEY is not configured.');
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
// 1. PRISMA: SPEECH-TO-TEXT
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
  const config = requireApiKey();
  const startTime = Date.now();
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
  // Bias the recognizer towards mandi vocabulary so crop/price words survive noisy audio.
  form.append('bias_list', JSON.stringify(['APMC', 'mandi', 'katauti', 'Teja', 'Agmarknet', 'e-NAM', 'quintal']));

  const response = await fetch(`${config.baseUrl}/stt/v3`, {
    method: 'POST',
    headers: { 'X-API-Key-ID': config.apiKey },
    body: form,
  });

  const latencyMs = Date.now() - startTime;
  const raw = await response.text();
  let json: Record<string, unknown> = {};
  try {
    json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    // Non-JSON error page
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

  const text = typeof json.transcript === 'string' ? json.transcript.trim() : '';
  const detected = typeof json.detected_language_code === 'string' ? json.detected_language_code : languageCode;

  return {
    text,
    language: detected,
    // Prisma REST does not expose a confidence score; 1 means "not reported".
    confidence: typeof json.confidence === 'number' ? json.confidence : 1,
    latencyMs:
      typeof json.end_to_end_latency === 'number' ? Math.round(json.end_to_end_latency * 1000) : latencyMs,
    model: typeof json.model === 'string' ? json.model : config.sttModel,
    requestId: typeof json.request_id === 'string' ? json.request_id : undefined,
  };
}

// ----------------------------------------------------------------------------
// 2. TIMBRE: TEXT-TO-SPEECH
// ----------------------------------------------------------------------------

export interface TimbreResult {
  audioBase64: string;
  mime: string;
  chars: number;
  latencyMs: number;
  model: string;
}

export async function callTimbreTts(
  text: string,
  voice: string,
  language: string,
  model?: string
): Promise<TimbreResult> {
  const config = requireApiKey();
  const startTime = Date.now();
  const trimmed = text.slice(0, 480);

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
      speed: 1.05, // Mandi traders speak briskly
      audio_config: { container: 'mp3', bitrate: '128k' },
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText) as { message?: string; detail?: { message?: string } };
      message = parsed.message || parsed.detail?.message || errorText;
    } catch {
      // keep the raw body
    }
    throw new Error(`TIMBRE_HTTP_${response.status}: ${message}`);
  }

  const audio = Buffer.from(await response.arrayBuffer());
  if (audio.length === 0) {
    throw new Error('TIMBRE_EMPTY_AUDIO: Timbre returned no audio.');
  }

  return {
    audioBase64: audio.toString('base64'),
    mime: response.headers.get('content-type') || 'audio/mpeg',
    chars: trimmed.length,
    latencyMs,
    model: model || config.ttsModel,
  };
}

// ----------------------------------------------------------------------------
// 3. EVON: REASONING (optional — Gnani provisions it per account)
// ----------------------------------------------------------------------------

export interface EvonResult {
  rawText: string;
  latencyMs: number;
  model: string;
}

export async function callEvonInference(systemPrompt: string, userPrompt: string): Promise<EvonResult> {
  const config = getGnaniConfig();
  if (!config.evonEndpoint || !config.evonApiKey) {
    throw new Error('EVON_NOT_CONFIGURED: Evon is not provisioned for this key.');
  }

  const startTime = Date.now();
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
      max_tokens: 400,
    }),
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

  return { rawText, latencyMs, model: config.evonModel };
}
