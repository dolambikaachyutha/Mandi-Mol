// server/functions/_gnani.ts
var circuits = {
  prisma: { failures: 0, lastFailure: 0, isOpen: false },
  timbre: { failures: 0, lastFailure: 0, isOpen: false },
  evon: { failures: 0, lastFailure: 0, isOpen: false }
};
var CIRCUIT_FAILURE_THRESHOLD = 3;
var CIRCUIT_COOLDOWN_MS = 3e4;
function checkCircuit(name) {
  const c = circuits[name];
  if (c.isOpen) {
    if (Date.now() - c.lastFailure > CIRCUIT_COOLDOWN_MS) {
      c.isOpen = false;
      c.failures = 0;
    } else {
      throw new Error(`GNANI_CIRCUIT_OPEN: ${name.toUpperCase()} circuit is open due to recent failures. Request rejected to prevent cascading errors.`);
    }
  }
}
function recordCircuitSuccess(name) {
  circuits[name].failures = 0;
  circuits[name].isOpen = false;
}
function recordCircuitFailure(name) {
  const c = circuits[name];
  c.failures += 1;
  c.lastFailure = Date.now();
  if (c.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    c.isOpen = true;
  }
}
async function withRetry(fn, retries = 2, baseDelayMs = 300) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
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
function isKillSwitchActive() {
  return process.env.KILL_SWITCH === "true";
}
function isSpeechConfigured() {
  if (isKillSwitchActive()) return false;
  return Boolean(getGnaniConfig().apiKey);
}
function requireApiKey() {
  if (isKillSwitchActive()) {
    throw new Error("KILL_SWITCH_ACTIVE: Gnani AI services temporarily paused by admin kill switch.");
  }
  const config = getGnaniConfig();
  if (!config.apiKey) {
    throw new Error("CONFIG_ERROR: GNANI_API_KEY is not configured in Vercel environment variables.");
  }
  return config;
}
var ttsMemoryCache = /* @__PURE__ */ new Map();
async function callTimbreTts(text, voice, language, model) {
  checkCircuit("timbre");
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key-ID": config.apiKey
        },
        body: JSON.stringify({
          text: trimmed,
          voice,
          model: model || config.ttsModel,
          language: language || "auto",
          speed: 1.05,
          audio_config: { container: "mp3", bitrate: "128k" }
        }),
        signal: AbortSignal.timeout(8e3)
        // 8s timeout
      });
      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const errorText = await response.text();
        let message = errorText;
        try {
          const parsed = JSON.parse(errorText);
          message = parsed.message || parsed.detail?.message || errorText;
        } catch {
        }
        throw new Error(`TIMBRE_HTTP_${response.status}: ${message}`);
      }
      const audio = Buffer.from(await response.arrayBuffer());
      if (audio.length === 0) {
        throw new Error("TIMBRE_EMPTY_AUDIO: Timbre returned empty stream.");
      }
      recordCircuitSuccess("timbre");
      const result = {
        audioBase64: audio.toString("base64"),
        mime: response.headers.get("content-type") || "audio/mpeg",
        chars: trimmed.length,
        latencyMs,
        model: model || config.ttsModel
      };
      if (ttsMemoryCache.size < 500) {
        ttsMemoryCache.set(cacheKey, result);
      }
      return result;
    } catch (err) {
      recordCircuitFailure("timbre");
      throw err;
    }
  });
}

// server/functions/tts.ts
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};
var ttsCache = /* @__PURE__ */ new Map();
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
  try {
    const {
      text,
      voiceCode,
      languageCode
    } = JSON.parse(event.body || "{}");
    if (!text) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "MISSING_TEXT", message: "Text required for TTS" })
      };
    }
    const config = getGnaniConfig();
    const voice = voiceCode || config.ttsVoices.hinglish;
    const language = languageCode || "hi-en";
    const cacheKey = `${config.ttsModel}|${voice}|${language}|${text.trim().toLowerCase()}`;
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ...cached, latencyMs: 8, cacheHit: true, fallbackUsed: false })
      };
    }
    if (!isSpeechConfigured()) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          audioBase64: "",
          mime: "",
          chars: 0,
          latencyMs: 0,
          cacheHit: false,
          fallbackUsed: true,
          notice: "GNANI_NOT_CONFIGURED: subtitles only"
        })
      };
    }
    const result = await callTimbreTts(text, voice, language);
    if (text.length < 240 && result.audioBase64) {
      ttsCache.set(cacheKey, {
        audioBase64: result.audioBase64,
        mime: result.mime,
        chars: result.chars,
        model: result.model
      });
    }
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ...result, cacheHit: false, fallbackUsed: false })
    };
  } catch (err) {
    const message = err.message || "TTS failure";
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        audioBase64: "",
        mime: "",
        chars: 0,
        latencyMs: 0,
        cacheHit: false,
        fallbackUsed: true,
        notice: "TIMBRE_DEGRADED: subtitles active",
        error: message
      })
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
  if (request.method === "GET" || request.method === "HEAD" || request.readableEnded) {
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

// server/api-entries/tts.ts
var tts_default = createVercelHandler(handler);
export {
  tts_default as default
};
