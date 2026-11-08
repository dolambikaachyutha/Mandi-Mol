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
function isEvonConfigured() {
  const config = getGnaniConfig();
  return Boolean(config.evonEndpoint && config.evonApiKey);
}
async function callEvonInference(systemPrompt, userPrompt) {
  const config = getGnaniConfig();
  if (!config.evonEndpoint || !config.evonApiKey) {
    throw new Error("EVON_NOT_CONFIGURED: Evon is not provisioned for this key.");
  }
  const startTime = Date.now();
  const response = await fetch(config.evonEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key-ID": config.evonApiKey,
      Authorization: `Bearer ${config.evonApiKey}`
    },
    body: JSON.stringify({
      model: config.evonModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 400
    })
  });
  const latencyMs = Date.now() - startTime;
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`EVON_HTTP_${response.status}: ${errText}`);
  }
  const json = await response.json();
  const rawText = json.choices?.[0]?.message?.content || json.content || json.text || json.output || "";
  if (!rawText.trim()) {
    throw new Error("EVON_EMPTY_RESPONSE: Model returned no text.");
  }
  return { rawText, latencyMs, model: config.evonModel };
}

// server/functions/_brain.ts
function buildCoachFallback(payload) {
  const crop = payload.cropName || "your lot";
  const finalPrice = Number(payload.finalPrice) || 0;
  const reservePrice = Number(payload.reservePrice) || finalPrice;
  const quantityKg = Number(payload.quantityKg) || 0;
  const moneyLeft = Math.max(0, (reservePrice - finalPrice) * quantityKg);
  return {
    wentWell: [
      `You kept the conversation on price instead of letting Lalaji settle it in silence, and closed at \u20B9${finalPrice}/kg for ${quantityKg} kg.`,
      finalPrice >= reservePrice - 2 ? `You pushed Lalaji right up to his \u20B9${reservePrice}/kg limit \u2014 that is a strong close.` : `You did not accept the opening lowball and forced at least one upward revision.`
    ],
    missed: [
      `\u20B9${moneyLeft.toLocaleString("en-IN")} stayed on the table because the trader could stretch to \u20B9${reservePrice}/kg.`,
      `Each uncountered objection (quality, moisture, delayed payment) was worth roughly \u20B9${Math.max(
        1,
        Math.round((reservePrice - finalPrice) / 3)
      )}/kg in leverage.`
    ],
    betterLines: [
      {
        original: "Bhaiya thoda rate badhao na",
        better: `${crop} ka aaj ka mandi benchmark \u20B9${reservePrice}/kg hai. Quality first grade hai, isliye \u20B9${Math.min(
          reservePrice,
          finalPrice + 4
        )} se kam nahi banta.`,
        why: "A quoted benchmark plus a specific number forces the trader to argue with evidence, not with your confidence."
      },
      {
        original: "Chalo jo dena hai de do",
        better: `Kanta APMC certified par hi hoga aur bhugtan aaj shaam RTGS se. Udhaari par maal nahi utrega.`,
        why: "Fixing the weighbridge and the payment channel removes the two deductions a trader adds after the rate is agreed."
      }
    ],
    tone: "Respectful and firm, with room to use more hard evidence."
  };
}

// server/functions/coach.ts
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
  try {
    const payload = JSON.parse(event.body || "{}");
    const fallback = buildCoachFallback(payload);
    if (!isEvonConfigured() || !payload.turnsSummary) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ...fallback, provider: "engine", latencyMs: 0 })
      };
    }
    const moneyLeft = Math.max(0, (payload.reservePrice - payload.finalPrice) * payload.quantityKg);
    const systemPrompt = `You are an empathetic agricultural economist and mandi negotiation coach.
Review the farmer's negotiation against trader Lalaji.
Crop: ${payload.cropName}, Quantity: ${payload.quantityKg} kg. Final settled price: \u20B9${payload.finalPrice}/kg. Trader's hidden reserve limit was \u20B9${payload.reservePrice}/kg.
Money left on the table: \u20B9${moneyLeft.toLocaleString("en-IN")}.

Provide constructive, concrete, rupee-focused coaching:
1. Two specific things the farmer did well.
2. Two missed opportunities where the farmer gave away leverage or accepted a trader objection too easily.
3. Two "Say This Instead" cards comparing the farmer's actual weak phrase with a punchy, data-backed counter phrase in simple Hinglish, explaining the exact negotiation reason.

Return strictly a JSON object:
{
  "wentWell": ["...", "..."],
  "missed": ["...", "..."],
  "betterLines": [{"original": "...", "better": "...", "why": "..."}],
  "tone": "..."
}`;
    try {
      const { rawText, latencyMs, model } = await callEvonInference(
        systemPrompt,
        `Negotiation turns:
${payload.turnsSummary}`
      );
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const wentWell = Array.isArray(parsed.wentWell) ? parsed.wentWell.filter((v) => typeof v === "string") : [];
      const missed = Array.isArray(parsed.missed) ? parsed.missed.filter((v) => typeof v === "string") : [];
      const betterLines = Array.isArray(parsed.betterLines) ? parsed.betterLines.filter(
        (card) => typeof card.original === "string" && typeof card.better === "string" && typeof card.why === "string"
      ).map((card) => ({
        original: card.original,
        better: card.better,
        why: card.why
      })) : [];
      if (wentWell.length === 0 || missed.length === 0 || betterLines.length === 0) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ ...fallback, provider: "engine", latencyMs })
        };
      }
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          wentWell,
          missed,
          betterLines,
          tone: typeof parsed.tone === "string" ? parsed.tone : fallback.tone,
          provider: "evon",
          model,
          latencyMs
        })
      };
    } catch {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ...fallback, provider: "engine", latencyMs: 0 })
      };
    }
  } catch (err) {
    const message = err.message || "Coach inference error";
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "COACH_ERROR", message })
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

// server/api-entries/coach.ts
var coach_default = createVercelHandler(handler);
export {
  coach_default as default
};
