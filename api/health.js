// server/functions/_gnani.ts
var circuits = {
  prisma: { failures: 0, lastFailure: 0, isOpen: false },
  timbre: { failures: 0, lastFailure: 0, isOpen: false },
  evon: { failures: 0, lastFailure: 0, isOpen: false }
};
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
function isEvonConfigured() {
  if (isKillSwitchActive()) return false;
  const config = getGnaniConfig();
  return Boolean(config.evonEndpoint && config.evonApiKey);
}
function getProviderStatus() {
  const config = getGnaniConfig();
  const kill = isKillSwitchActive();
  const speechLive = Boolean(config.apiKey) && !kill;
  const evonLive = isEvonConfigured();
  return {
    killSwitch: kill,
    prisma: {
      ok: speechLive && !circuits.prisma.isOpen,
      circuitOpen: circuits.prisma.isOpen,
      mode: speechLive ? "live" : "mock",
      provider: "Gnani AI Prisma (STT)",
      model: config.sttModel
    },
    timbre: {
      ok: speechLive && !circuits.timbre.isOpen,
      circuitOpen: circuits.timbre.isOpen,
      mode: speechLive ? "live" : "mock",
      provider: "Gnani AI Timbre (TTS)",
      model: config.ttsModel
    },
    evon: {
      ok: evonLive && !circuits.evon.isOpen,
      circuitOpen: circuits.evon.isOpen,
      mode: evonLive ? "live" : "engine",
      provider: evonLive ? "Gnani AI Evon (LLM)" : "Deterministic engine brain",
      model: evonLive ? config.evonModel : "engine-v1"
    }
  };
}
async function pingGnaniProviders() {
  const config = getGnaniConfig();
  let baseUrlLatency = 0;
  let evonLatency = 0;
  let baseOk = false;
  let evonOk = false;
  if (config.apiKey && !isKillSwitchActive()) {
    try {
      const start = Date.now();
      const res = await fetch(`${config.baseUrl}/`, {
        method: "HEAD",
        signal: AbortSignal.timeout(3e3)
      }).catch(() => fetch(`${config.baseUrl}/`, { method: "GET", signal: AbortSignal.timeout(3e3) }));
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
        method: "HEAD",
        signal: AbortSignal.timeout(3e3)
      }).catch(() => fetch(config.evonEndpoint, { method: "GET", signal: AbortSignal.timeout(3e3) }));
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
    latenciesMs: { baseUrl: baseUrlLatency, evon: evonLatency }
  };
}

// server/functions/health.ts
var handler = async (event) => {
  const config = getGnaniConfig();
  const status = getProviderStatus();
  const shouldPing = event?.queryStringParameters?.ping === "1" || event?.queryStringParameters?.live === "true";
  let livePings = null;
  if (shouldPing) {
    livePings = await pingGnaniProviders();
  }
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache"
    },
    body: JSON.stringify({
      timestamp: Date.now(),
      status: status.killSwitch ? "PAUSED" : "OPERATIONAL",
      killSwitch: status.killSwitch,
      configured: {
        gnani: isSpeechConfigured(),
        evon: isEvonConfigured()
      },
      baseUrl: config.baseUrl,
      prisma: {
        ...status.prisma,
        latencyMs: livePings ? livePings.latenciesMs.baseUrl : 0,
        pingOk: livePings ? livePings.prismaPingOk : void 0
      },
      timbre: {
        ...status.timbre,
        latencyMs: livePings ? livePings.latenciesMs.baseUrl : 0,
        pingOk: livePings ? livePings.timbrePingOk : void 0
      },
      evon: {
        ...status.evon,
        latencyMs: livePings ? livePings.latenciesMs.evon : 0,
        pingOk: livePings ? livePings.evonPingOk : void 0
      },
      voices: config.ttsVoices
    })
  };
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

// server/api-entries/health.ts
var health_default = createVercelHandler(handler);
export {
  health_default as default
};
