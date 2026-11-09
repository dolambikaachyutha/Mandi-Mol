# MANDI MOL: SYSTEM AUDIT & ARCHITECTURE TRANSITION
**Date:** November 2026  
**Status:** In Transition from Demo / Practice Prototype to Production Mandi Companion  
**Goal:** Transform Mandi Mol from a synthetic bargaining simulator into a daily-use agritech tool powered by live Agmarknet prices, server-authoritative negotiation, real mandi deal logging, and genuine Gnani AI multi-modal voice processing.

---

## 1. Demo Artifacts & Synthetic Code Inventory

This audit catalogs every placeholder, mock path, hardcoded dataset, and client-side vulnerability identified in the repository.

### 1.1 Client-Side Secrets & Untrusted Game State
- **Exposed Reserve Price:** In `src/lib/engine.ts` and `src/store/useGame.ts`, the trader's hidden maximum reserve price (`reservePrice`) was generated on the client via `Math.random` and stored in Zustand state. Any user with browser DevTools could inspect `useGame.getState().reservePrice` on turn 1.
- **Client-Side Turn Evaluation:** Farmer argument validation (`sanitizeFarmerInput`, `detectAcceptance`, `extractFarmerAsk`) ran in the browser bundle before or alongside server calls, allowing tampering.
- **Client-Side Scoring:** `calculateScore` ran in the browser in `src/lib/scoring.ts`, computing "money left on the table" directly from the client-stored reserve.

### 1.2 Scripted Replies & Model Swapping Fallbacks
- **`VITE_MOCK` Fallback Switch:** In `src/lib/api.ts` (lines 69, 139, 182, 281), `isMockForced = import.meta.env.VITE_MOCK === 'true'` completely disabled live Gnani speech services.
- **Deterministic Scripted Trader Dialogue:** When `VITE_MOCK=true` or when `/api/trader` errored, `src/lib/api.ts` generated scripted responses:
  - *"Dekho bhai, maal ke liye ₹170/kg de sakta hoon..."*
  - *"Moisture zyada hai, katauti lagegi..."*
- **Hardcoded Coaching Feedback:** When `/api/coach` failed, `src/lib/api.ts` returned hardcoded bullet points citing Warangal yard Teja chilli regardless of which crop was practiced.

### 1.3 Hardcoded Commodity Prices & Multipliers
- **`src/lib/crops.ts`:** Hardcoded static reference prices (`chilli: 185`, `tomato: 32`), with formulaic random multipliers (`minOpenMult: 0.78`, `minReserveMult: 0.98`).
- **No Real Market Linkage:** In the demo, neither price changed based on day, arrival volume, or actual APMC auction results.
- **Fake Market Fluctuations:** `false_market_drop` trick claimed prices dropped without referencing real Agmarknet bulletin data.

### 1.4 LocalStorage-Only Pilot & Trainer Data
- **`src/store/useSessions.ts`:** Stored synthetic "Pilot Records" (`P1`, `P2`, `P3`) exclusively in browser `localStorage` under `mandi_mol_pilot_sessions_v1`.
- **`src/components/trainer/TrickHeatmap.tsx`:** Aggregated tricks purely from local browser storage, resetting whenever a user cleared their cache or switched phones.
- **`src/components/results/PilotForm.tsx` & `PilotCharts.tsx`:** Synthetic form allowing arbitrary manual entry of participant scores with zero verification against genuine trades.

### 1.5 Frontend & Accessibility Flaws
- **Viewport Zoom Blocking:** `index.html` contained `user-scalable=no, maximum-scale=1.0`, violating WCAG accessibility guidelines and preventing low-vision farmers from pinching to zoom on mobile devices.
- **Missing OpenGraph Assets:** Missing absolute `og:image` URL, canonical tag, and mobile theme color definitions.
- **Intrusive Demo Banners:** `MockRibbon.tsx` displayed an all-screen yellow banner shouting "MOCK MODE ACTIVE" and "PRESS U FOR JUDGE TELEMETRY", degrading confidence in commercial production.

---

## 2. Stated Architectural Assumptions

Instead of halting execution for interactive Q&A, the following explicit engineering assumptions are established:

1. **Agmarknet Live Price Ingestion:**
   - Source: Open Government Data (data.gov.in) API for daily wholesale mandi prices.
   - Resource: Agmarknet Daily Wholesale Prices (`9ef84268-d588-465a-a308-a864a43d0070` or current active commodity endpoint).
   - Rate Quote Standard: Agmarknet quotes prices in **₹ / Quintal** (1 Quintal = 100 kg). The system normalizes and displays both **₹/kg** and **₹/quintal** consistently.
   - Fallback Strategy: If data.gov.in is slow or down, the server serves the last cached valid snapshot with an explicit tag: *"Data as of [Date] from Agmarknet cache; live feed temporarily delayed"*. Never invent prices.

2. **Server-Authoritative Session Lifecycle:**
   - All session state (session ID, target mandi, crop, secret reserve price, trader patience, used tricks, turn history) lives on the server in a transactional database (Supabase/PostgreSQL) with an in-memory TTL cache for sub-second turn latency.
   - Client sends only `{ sessionId, text | audioBase64, languageCode }`.
   - Client receives only public turn responses `{ round, currentOffer, mood, line, audioBase64, isDeal, isWalkaway }`.
   - The reserve price and exact rupee breakdown are revealed **strictly after** the session transitions to `deal` or `walkaway`.

3. **Gnani Multi-Modal Voice Pipeline:**
   - Speech-to-Text: **Gnani AI Prisma v3.0** via multipart request (`audio_file`, `model`, `language_code: "indic-auto"`).
   - Text-to-Speech: **Gnani AI Timbre v3.0** returning raw 16/24 kHz WAV/MP3 audio with server-side in-memory hashing cache.
   - Reasoning: **Gnani AI Evon v3.3** via `EVON_ENDPOINT` OpenAI-compatible chat completions.
   - Outage Graceful Degradation: If Prisma fails, UI immediately opens keyboard input with an explicit warning banner: *"Voice recognition service unavailable. Please type your counter-offer."* If Timbre fails, UI displays typewriter subtitles with: *"Audio voice line unavailable. Reading subtitles."* No silent fallback to third-party models.

4. **Privacy & DPDP Compliance:**
   - Raw voice audio recordings are streamed to Prisma for transcription and **never persisted** on disk or database. Only transcripts and telemetry metrics are saved.
   - Anonymous sign-in creates an ephemeral UUID profile. A farmer can promote their account with a phone number or clear all records via "Delete My Data" (`DELETE /api/profile`).

5. **Units & Terminology:**
   - Metric unit: Kilograms (`kg`) and Quintals (`q`, 100 kg).
   - Currency: Indian Rupee (`₹`), formatted with Indian numbering (Lakhs / Crores: `₹1,85,000`).

---

## 3. Transformation Roadmap

| Module | Old Prototype State | New Production State |
| :--- | :--- | :--- |
| **1. Live Mandi Prices** | Hardcoded static prices in `crops.ts` | Daily Agmarknet feed, modal/min/max rates, 100km radius mandi comparisons, trend sparklines, voice price query. |
| **2. Sell Planner** | None (only practiced single crop) | Pre-trip calculator: net-in-hand across nearby mandis after transport/hamali/tare deductions, floor recommendation, trick alert. |
| **3. Bargain Practice** | Client-side engine, exposed reserve | Server-authoritative session, reference price anchored in real daily modal rate, dual Farmer & Trader roles. |
| **4. Deal Ledger & Impact** | Fake pilot form in localStorage | Real post-sale logger, market comparison (above/below modal rate), dispute-proof Sauda Slip generator, FPO dashboard. |
| **Access & Delivery** | Web-only demo with mock ribbon | Installable PWA, WhatsApp Cloud API voice note gateway, low-bandwidth optimizations. |

