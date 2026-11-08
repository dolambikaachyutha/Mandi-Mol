# Mandi Mol (मंडी मोल)
### Voice-First Mandi Negotiation Simulator Powered by Gnani AI
> *"Practice the bargain. Keep the profit."*

[![Vitest Passing](https://img.shields.io/badge/tests-20%2F20%20passing-brightgreen)](tests/trader-contract.test.ts)
[![Powered By](https://img.shields.io/badge/Powered%20By-Gnani%20AI%20(Prisma%20·%20Evon%20·%20Timbre)-blue)](#gnani-ai-technology-stack)
[![Architecture](https://img.shields.io/badge/Engine-Deterministic%20Zero--Trust%20Clamp-red)](#game-engine-invariants)

---

## 1. What is Mandi Mol?
**Mandi Mol** is a voice-first bargaining trainer designed for Indian farmers. A farmer chooses a practice crop and voice language (Hinglish, Hindi, Telugu, or English), adds optional farmer and trader requirements, then practices bargaining with **Lalaji**. Practice prices are illustrative only; they are not live mandi prices.

After 4–8 intense bargaining rounds, the farmer receives an actionable coaching scorecard showing **"Money Left on the Table" in exact rupees**, transparent rubric scoring, and **"Say This Instead"** voice cards.

Judges and evaluators can inspect live execution via the **Under the Hood** panel (hotkey `U` or `?judge=1`), revealing latency breakdowns, Zod validation, and real-time engine clamping.

---

## 2. Genuine Gnani AI Technology Stack

| Gnani Technology | Role in Mandi Mol | Where Used |
| :--- | :--- | :--- |
| **Prisma** | **Speech-to-Text (STT)** | Transcribes farmer's spoken counter-offers with code-mix detection (Hinglish / Telugu / Hindi). |
| **Evon** | **Reasoning & Planning** | Drives Lalaji's psychological trick selection, mood shifts, and generates the rupee-denominated coaching scorecard. |
| **Timbre** | **Text-to-Speech (TTS)** | Synthesizes authentic, brisk mandi trader voice lines with client-side lipsync. Degrades gracefully to typewriter subtitles if unavailable. |

---

## 3. Evaluator Features (Core Innovations)

### 3.1 Live "Under the Hood" Console (`U` key or `?judge=1`)
- **Real Turn Telemetry**: Stacked latency bar showing STT (Prisma), Reasoning (Evon), and TTS (Timbre) durations.
- **Engine Guard Callouts**: Visual callouts whenever Evon proposes an offer exceeding bounds (e.g. `⚠️ BLOCKED: Evon proposed ₹195, engine clamped to ₹188`).
- **Secret Reserve Masking**: Trader's maximum reserve price remains masked (`▒▒▒ HIDDEN`) until the negotiation completes.
- **Zero Fabrication**: All numbers come from real instrumentation in `src/lib/telemetry.ts`.

### 3.2 Mandi Noise Torture Test
- Procedurally injects realistic mandi acoustic conditions (filtered crowd murmur, engine rumbles, scale clanks) at **Off (>25dB SNR)**, **Medium (~10dB SNR)**, and **Loud (~0dB SNR)** before sending audio to Prisma STT.
- Features farmer verification review (thumbs up/down) and a one-click **Export Noise Test CSV** button.

### 3.3 Code-Mix Script & Vocabulary View
- Detects multi-lingual speech using Unicode script ranges (Devanagari, Telugu, Latin) and regional agricultural vocabulary to visually highlight language mixing.

### 3.4 6 Authentic Mandi Trader Tricks
1. **Quality Nitpicking**: Trader spots 2 slightly dry chillies to discount the entire 500 kg lot.
2. **False Market Drop**: Trader claims morning arrivals crashed rates by ₹15.
3. **Fake Scarcity**: Trader pretends godown is packed to create desperation.
4. **Weight Cut (Kanta Deduction)**: Demands unjustified 4–5 kg/quintal moisture cuts.
5. **Delayed Payment (Udhaari)**: Offers higher rates only on 15–20 day checks.
6. **Friendly Pressure**: Leverages tea, chai-paani, and past relationships.

---

## 4. Test Results: 20/20 Rule Invariants Passing
All 20 scripted adversarial inputs (system prompt overrides, roleplay bypasses, rude insults, invalid JSON) run against the engine:
```bash
npm run test
```
**Test Summary:**
```text
✓ tests/trader-contract.test.ts (1 test, 20 fixtures)
✓ tests/engine.test.ts (6 tests)
✓ tests/scoring.test.ts (2 tests)
Test Files  3 passed (3)
Tests       9 passed (9)
```
- **Rule 1**: Trader offer NEVER exceeds reserve price under any condition.
- **Rule 2**: Reserve price NEVER appears in any trader spoken line.
- **Rule 3**: JSON always valid after Zod clamp/fallback.
- **Rule 4**: Financial scores computed strictly in pure TypeScript code.
- **Rule 5**: Patience bounds strictly respected (0 to 5).

---

## 5. Local Setup & Quickstart

### Prerequisites
- Node.js 18+
- npm or pnpm

### Development
```bash
# 1. Install dependencies
npm install

# 2. Add your Gnani key
cp .env.example .env    # then set GNANI_API_KEY

# 3. Start the app and its local voice functions
npm run dev
```
Open [http://localhost:8888](http://localhost:8888). The Vite server also
mounts the Netlify functions at `/.netlify/functions/*`; no separate Netlify
CLI process is needed for local voice testing. Confirm the function is
reachable at [http://localhost:8888/.netlify/functions/health](http://localhost:8888/.netlify/functions/health).
Its JSON should report `configured.gnani: true` when `GNANI_API_KEY` is loaded.
The app interface is available in English, Hindi, Telugu, Bengali, and Tamil.
Set `VITE_MOCK=true` to disable live speech services while working on the UI;
speech transcription will not use a canned transcript.

### Full Stack with the Netlify CLI

Alternatively, run Netlify's local runtime:

```powershell
$env:NODE_OPTIONS = '--require dotenv/config'
npx netlify dev --port 9999 --target-port 8888 --functions netlify/functions --no-open
```

Open [http://localhost:9999](http://localhost:9999). The Netlify CLI option
proxies the Vite app running on port 8888.

---

## 6. How the Gnani Integration Works
All provider-specific headers, endpoints, and parsing logic are isolated in **`netlify/functions/_gnani.ts`**:
```typescript
// Prisma STT: POST https://api.vachana.ai/stt/v3  (multipart, header X-API-Key-ID)
// Timbre TTS: POST https://api.vachana.ai/api/v1/tts/inference  (JSON in, binary audio out)
// Evon LLM:   OpenAI-compatible chat completions, provisioned by Gnani per account
export function getGnaniConfig() {
  return {
    apiKey: process.env.GNANI_API_KEY,
    baseUrl: process.env.GNANI_BASE_URL || 'https://api.vachana.ai',
    sttModel: process.env.GNANI_STT_MODEL || 'prisma-v3.0',
    ttsModel: process.env.GNANI_TTS_MODEL || 'timbre-v3.0',
    ttsVoices: { hinglish: 'Avinash', hindi: 'Avinash', telugu: 'Avinash' },
  };
}
```
Recorded browser audio is converted to 16 kHz mono WAV before upload (Prisma does not accept WEBM).

**Evon is waitlist-gated.** When `EVON_ENDPOINT` and `EVON_API_KEY` are set, Lalaji's turns and the coaching scorecard come from Evon. Until then `netlify/functions/_brain.ts` produces the same JSON contract with auditable rules, and the UI labels the reasoning provider as `ENGINE` in the status chips and the Under the Hood console.

---

## 7. Deployment Instructions (Netlify)
1. Push repository to GitHub.
2. Link repository in Netlify Dashboard.
3. Configure environment variables in Netlify site settings:
   - `GNANI_API_KEY`: Your Gnani API key (required)
   - `GNANI_BASE_URL`: `https://api.vachana.ai`
   - `GNANI_STT_MODEL`: `prisma-v3.0`
   - `GNANI_TTS_MODEL`: `timbre-v3.0`
   - `GNANI_TTS_VOICE_HINGLISH` / `_HINDI` / `_TELUGU` / `_ENGLISH`: `Avinash`
   - `EVON_ENDPOINT` / `EVON_API_KEY`: optional, only if Evon is provisioned
4. Deploy the site. Security headers and microphone policy are pre-configured in `netlify.toml`.

---

## 8. Troubleshooting
- **Microphone Access**: Modern browsers require HTTPS (or localhost) for `navigator.mediaDevices.getUserMedia`. In non-HTTPS environments, click the keyboard icon to use text fallback.
- **iOS Safari Audio Unlock**: Web Audio requires a user gesture; tapping the microphone or start button unlocks the audio pipeline automatically.
- **Timbre TTS Degraded**: If Timbre returns 5xx or latency spikes, Mandi Mol automatically degrades to real-time typewriter subtitles so the bargaining round never hangs.
