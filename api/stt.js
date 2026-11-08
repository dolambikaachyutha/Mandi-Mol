// server/functions/_gnani.ts
function readEnv(name) {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || /^your[_-]/i.test(trimmed)) return null;
  return trimmed;
}
function getGnaniConfig() {
  const baseUrl = (readEnv("GNANI_BASE_URL") || "https://api.vachana.ai").replace(/\/+$/, "");
  return {
    apiKey: readEnv("GNANI_API_KEY") || "",
    baseUrl,
    sttModel: readEnv("GNANI_STT_MODEL") || "prisma-v3.0",
    ttsModel: readEnv("GNANI_TTS_MODEL") || "timbre-v3.0",
    ttsVoices: {
      hinglish: readEnv("GNANI_TTS_VOICE_HINGLISH") || "Avinash",
      hindi: readEnv("GNANI_TTS_VOICE_HINDI") || "Avinash",
      telugu: readEnv("GNANI_TTS_VOICE_TELUGU") || "Avinash",
      english: readEnv("GNANI_TTS_VOICE_ENGLISH") || "Avinash"
    },
    evonEndpoint: readEnv("EVON_ENDPOINT") || "",
    evonApiKey: readEnv("EVON_API_KEY") || "",
    evonModel: readEnv("EVON_MODEL") || "gnani-evon-v3.3"
  };
}
function isSpeechConfigured() {
  return Boolean(getGnaniConfig().apiKey);
}
function requireApiKey() {
  const config = getGnaniConfig();
  if (!config.apiKey) {
    throw new Error("CONFIG_ERROR: GNANI_API_KEY is not configured.");
  }
  return config;
}
var MIME_TO_EXTENSION = {
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/ogg": "ogg",
  "audio/ogg;codecs=opus": "ogg",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac"
};
function extensionForMime(mimeType) {
  const normalized = (mimeType || "").split(";")[0].trim().toLowerCase();
  const extension = MIME_TO_EXTENSION[normalized];
  if (!extension) {
    throw new Error(
      `UNSUPPORTED_AUDIO_FORMAT: Prisma accepts WAV, MP3, OGG, FLAC, AAC or M4A audio (received ${mimeType || "unknown"}).`
    );
  }
  return extension;
}
async function callPrismaStt(audioBase64, mimeType, languageCode, format = "transcribe") {
  const config = requireApiKey();
  const startTime = Date.now();
  const extension = extensionForMime(mimeType);
  const audioBytes = Buffer.from(audioBase64, "base64");
  if (audioBytes.length === 0) {
    throw new Error("EMPTY_AUDIO: No audio data was recorded.");
  }
  const form = new FormData();
  form.append("audio_file", new Blob([audioBytes], { type: mimeType || "audio/wav" }), `farmer-turn.${extension}`);
  form.append("model", config.sttModel);
  form.append("language_code", languageCode || "indic-auto");
  if (format) form.append("format", format);
  form.append("bias_list", JSON.stringify(["APMC", "mandi", "katauti", "Teja", "Agmarknet", "e-NAM", "quintal"]));
  const response = await fetch(`${config.baseUrl}/stt/v3`, {
    method: "POST",
    headers: { "X-API-Key-ID": config.apiKey },
    body: form
  });
  const latencyMs = Date.now() - startTime;
  const raw = await response.text();
  let json = {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
  }
  if (!response.ok) {
    const detail = json.detail ?? json.error ?? json.message ?? raw;
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    throw new Error(`PRISMA_HTTP_${response.status}: ${message || "transcription failed"}`);
  }
  if (json.success === false) {
    const error = json.error;
    const message = typeof error === "string" ? error : error?.message || "transcription failed";
    throw new Error(`PRISMA_ERROR: ${message}`);
  }
  const text = typeof json.transcript === "string" ? json.transcript.trim() : "";
  const detected = typeof json.detected_language_code === "string" ? json.detected_language_code : languageCode;
  return {
    text,
    language: detected,
    // Prisma REST does not expose a confidence score; 1 means "not reported".
    confidence: typeof json.confidence === "number" ? json.confidence : 1,
    latencyMs: typeof json.end_to_end_latency === "number" ? Math.round(json.end_to_end_latency * 1e3) : latencyMs,
    model: typeof json.model === "string" ? json.model : config.sttModel,
    requestId: typeof json.request_id === "string" ? json.request_id : void 0
  };
}

// server/functions/stt.ts
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  if (!isSpeechConfigured()) {
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "GNANI_NOT_CONFIGURED",
        message: "GNANI_API_KEY is not configured on the server. Please add GNANI_API_KEY to your Vercel Project Settings \u2192 Environment Variables (or .env locally) and redeploy."
      })
    };
  }
  try {
    const {
      audioBase64,
      mimeType,
      languageCode,
      format
    } = JSON.parse(event.body || "{}");
    if (!audioBase64) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "MISSING_AUDIO", message: "Audio payload required" })
      };
    }
    const result = await callPrismaStt(
      audioBase64,
      mimeType || "audio/wav",
      languageCode || "hi-IN",
      format || "transcribe"
    );
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ...result, provider: "prisma" })
    };
  } catch (err) {
    const message = err.message || "STT failure";
    const unsupported = message.startsWith("UNSUPPORTED_AUDIO_FORMAT");
    return {
      statusCode: unsupported ? 415 : 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "PRISMA_STT_ERROR", message })
    };
  }
};

// server/vercelAdapter.ts
function normalizeHeaders(headers) {
  const normalized = {};
  for (const [name, value] of Object.entries(headers)) {
    if (typeof value === "string") normalized[name] = value;
    else if (Array.isArray(value)) normalized[name] = value.join(",");
  }
  return normalized;
}
function serializeBody(body) {
  if (body === void 0 || body === null) return null;
  if (typeof body === "string") return body;
  if (Buffer.isBuffer(body)) return body.toString("utf8");
  return JSON.stringify(body);
}
async function extractBody(request) {
  if (request.body !== void 0 && request.body !== null) {
    return serializeBody(request.body);
  }
  if (request.method === "GET" || request.method === "HEAD") {
    return null;
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve(null);
      } else {
        resolve(Buffer.concat(chunks).toString("utf8"));
      }
    });
    request.on("error", (err) => {
      reject(err);
    });
  });
}
function createVercelHandler(handler2) {
  return async (request, response) => {
    const rawUrl = request.url || "/";
    const url = new URL(rawUrl, `https://${request.headers.host || "localhost"}`);
    try {
      const body = await extractBody(request);
      const event = {
        httpMethod: (request.method || "GET").toUpperCase(),
        path: url.pathname,
        headers: normalizeHeaders(request.headers),
        queryStringParameters: Object.fromEntries(url.searchParams.entries()),
        body,
        isBase64Encoded: false,
        rawUrl: `https://${request.headers.host || "localhost"}${rawUrl}`,
        rawQuery: url.search.replace(/^\?/, "")
      };
      const result = await handler2(event);
      response.statusCode = result.statusCode ?? 200;
      for (const [name, value] of Object.entries(result.headers || {})) {
        if (value !== void 0) response.setHeader(name, String(value));
      }
      const responseBody = result.body || "";
      response.end(result.isBase64Encoded ? Buffer.from(responseBody, "base64") : responseBody);
    } catch (error) {
      console.error("[vercel-function] Handler failed:", error);
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({
          error: "FUNCTION_ERROR",
          message: error instanceof Error ? error.message : "Function request failed"
        }));
      }
    }
  };
}

// server/api-entries/stt.ts
var stt_default = createVercelHandler(handler);
export {
  stt_default as default
};
