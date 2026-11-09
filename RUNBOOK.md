# Mandi Mol Operations Runbook & Architecture Guide

This runbook documents the deployment, monitoring, security boundaries, and incident response procedures for **Mandi Mol** (Production host: [mandimol.vercel.app](https://mandimol.vercel.app)).

---

## 1. System Topology & Architecture

```
[ Farmer / Trader Client ]
  │
  ├── Browser PWA (React 19 + TypeScript + Vite 8)
  │     ├── Module 1: Live Mandi Prices (Agmarknet certified wholesale feeds)
  │     ├── Module 2: Sell Planner (Pre-trip freight & net-in-hand math)
  │     ├── Module 3: Bargain Practice (Server-authoritative simulator)
  │     └── Module 4: Deal Ledger & Proof of Impact (Sauda Slip receipts)
  │
  └── WhatsApp Cloud API Gateway (Optional low-literacy voice note interface)
        │
        ▼
[ Vercel Edge / Serverless Functions (Node.js 22 ESM) ]
  ├── /api/prices               --> Cached Agmarknet APMC rates & nearby comparisons
  ├── /api/planner              --> Code-owned net-in-hand logistics arithmetic
  ├── /api/practiceSession      --> Server-authoritative session (hides reserve price)
  ├── /api/practiceTurn         --> Server clamping & Evon trader reasoning
  ├── /api/deals                --> Verified transaction ledger & receipt generation
  ├── /api/alerts               --> Price target monitoring & webhook notifications
  ├── /api/fpo-dashboard        --> Anonymized FPO analytics (k >= 5 users DPDP rule)
  ├── /api/voiceQuery           --> Prisma STT -> Evon intent -> Agmarknet data -> Timbre TTS
  ├── /api/health               --> Provider circuit breaker & ping statuses
  └── /api/profile              --> DPDP consent & "Delete My Data" cascading erasure
        │
        ├── Gnani AI Services (Prisma STT, Timbre TTS, Evon 8B Reasoning)
        ├── data.gov.in / Agmarknet API (Daily APMC wholesale auction feeds)
        └── Supabase / Postgres (Profiles, Consents, Sessions, Deals, Alerts)
```

---

## 2. Environment Variables Specification

Configure the following variables in **Vercel Project Settings → Environment Variables**:

| Variable Name | Required | Default / Example | Purpose |
|---------------|----------|-------------------|---------|
| `GNANI_API_KEY` | **Yes** | `your_gnani_api_key` | Unified API key for Gnani Prisma STT and Timbre TTS |
| `GNANI_BASE_URL` | No | `https://api.gnani.ai/v1` | Gnani REST gateway base endpoint |
| `EVON_API_KEY` | No | `your_evon_api_key` | Evon 8B LLM key (falls back to `GNANI_API_KEY` if omitted) |
| `EVON_ENDPOINT` | No | `https://api.gnani.ai/v1/chat/completions` | Evon OpenAI-compatible reasoning endpoint |
| `EVON_MODEL` | No | `evon-8b-instruct` | Evon reasoning model identifier |
| `AGMARKNET_API_KEY` | No | `data.gov.in API key` | Key for automated daily Agmarknet price sync |
| `SUPABASE_URL` | No | `https://xxx.supabase.co` | Supabase Postgres URL for external persistent storage |
| `SUPABASE_SERVICE_ROLE_KEY` | No | `eyJhbG...` | Supabase service key for server-side RLS enforcement |
| `ENABLE_WHATSAPP_GATEWAY` | No | `false` (Set `true` to enable) | Feature flag for Meta WhatsApp Cloud API webhooks |
| `WHATSAPP_VERIFY_TOKEN` | No | `mandi_mol_verify_token_2026` | Webhook verification challenge token for Meta |
| `WHATSAPP_ACCESS_TOKEN` | No | `EAAB...` | Meta Graph API access token for WhatsApp messaging |
| `KILL_SWITCH` | No | `false` | Emergency kill switch: Disables all outbound AI calls instantly |

---

## 3. Deployment & Build Procedure

### Build Command:
```bash
npm run build
```
Under the hood, `npm run build` runs:
1. `vite build`: Compiles the React 19 single-page application into `dist/`.
2. `node ./scripts/build-api.js`: Uses `esbuild` to compile a unified API Gateway router into a single self-contained ESM bundle at `api/index.js` (107 KB). This guarantees that Vercel uses **exactly 1 Serverless Function**, staying well below the Vercel Hobby plan limit of 12 functions while preserving shared in-memory repository cache across all endpoints.

### Deployment to Vercel:
```bash
git push origin main
```
Vercel automatically detects the build command, deploys the static frontend to its global CDN, and attaches `api/index.js` as the single unified serverless function handling all `/api/*` traffic via `vercel.json` rewrites.

---

## 4. Operational Safety, Quotas & Circuit Breakers

1. **Untrusted Client Invariant:**
   - The secret reserve price and allowed maximum trader bids live strictly server-side in `server/functions/practiceTurn.ts` and `server/functions/practiceSession.ts`.
   - The client never receives the hidden reserve price during active rounds; it is revealed only upon final deal strike or walkaway.

2. **Audio Duration Enforcement:**
   - Maximum audio payload length is hard-capped at **2 MB** (~12 seconds of 16 kHz 16-bit mono WAV). Payloads exceeding this limit receive HTTP 400 rejection to protect upstream transcription quotas.

3. **Rate Limiting & Daily Quota:**
   - Sliding-window rate limiter restricts clients to 30 requests per minute per IP.
   - Daily turn quota restricts practice turns to 60 per user/day.

4. **Circuit Breaker:**
   - Consecutive failure threshold: **3 failures**.
   - Cooldown period: **30 seconds**.
   - If Prisma STT, Timbre TTS, or Evon fail 3 times consecutively, the circuit opens, preventing thundering herds and allowing graceful degradation (subtitles-only mode for speech, template engine fallback for trader reasoning).

5. **Kill Switch:**
   - Setting `KILL_SWITCH=true` in Vercel environment variables immediately forces all endpoints to return HTTP 503 / graceful local fallbacks without calling external AI providers.

---

## 5. DPDP Act 2023 Compliance & Data Retention Protocol

Mandi Mol is architected in accordance with India's **Digital Personal Data Protection (DPDP) Act 2023**:
1. **Notice & Consent:** Users are presented with a plain-language consent briefing explaining that speech audio is transcribed ephemerally and never retained for voiceprinting.
2. **Right to Erasure ("Delete My Data"):**
   - Accessible from the profile modal or via `DELETE /api/profile?userId=<USER_ID>`.
   - Executing this cascades a complete purge: profile, consents, active sessions, practice turns, price alerts, and logged deals are immediately wiped from memory and database tables.
3. **Anonymity Threshold for FPO Intelligence:**
   - The FPO dashboard only aggregates and displays trends for crop/mandi clusters containing **at least 5 unique users** (`k >= 5`), preventing individual transaction de-anonymization.

---

## 6. Meta WhatsApp Cloud API Setup Guide

To enable farmer voice note price queries and alerts via WhatsApp:
1. In Meta Developers Console, configure a **WhatsApp Cloud API** app.
2. Set Webhook URL to: `https://mandimol.vercel.app/api/whatsapp`.
3. Set Verify Token to: match `WHATSAPP_VERIFY_TOKEN` (default: `mandi_mol_whatsapp_verify_token_2026`).
4. Subscribe to the `messages` webhook field.
5. In Vercel Environment Variables, set:
   - `ENABLE_WHATSAPP_GATEWAY=true`
   - `WHATSAPP_ACCESS_TOKEN=<your_system_user_token>`
6. When farmers send a voice note or message to your registered WhatsApp business number, Mandi Mol automatically transcribes their query with Prisma STT, resolves the commodity rate from Agmarknet cache, and responds with a text summary plus a spoken Timbre voice note!

