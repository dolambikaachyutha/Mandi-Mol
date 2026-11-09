# Mandi Mol Implementation Checklist & Verification Matrix

This matrix maps every architectural principle, product module, and security requirement to its implementation files, test coverage, and current verification status.

---

## 1. Architectural Principles & Zero-Hallucination Guardrails

| Requirement | Status | Implementation File(s) | Verification & Notes |
|-------------|--------|------------------------|----------------------|
| **Zero Invented Data** | **DONE** | `server/db/repository.ts`, `server/functions/prices.ts` | All benchmark rates map to certified Agmarknet wholesale APMC auction records. Sources, markets, and dates are explicitly displayed; stale data is labelled. |
| **Genuine Gnani Models** | **DONE** | `server/functions/_gnani.ts`, `server/functions/voiceQuery.ts`, `src/lib/api.ts` | Prisma STT (speech in), Timbre TTS (speech out), Evon (reasoning). Never silently swapped for third-party models; degrades visibly with clear notices if unavailable. |
| **Untrusted Client Boundary** | **DONE** | `server/functions/practiceSession.ts`, `server/functions/practiceTurn.ts` | Secret reserve prices, scoring rules, and offer clamping are server-authoritative. Reserve price is hidden until final deal or walkaway. Verified in `tests/mandi-companion.test.ts`. |
| **"Information, Not Advice"** | **DONE** | `src/pages/PricesPage.tsx`, `src/pages/PlannerPage.tsx`, `src/components/deals/SaudaSlipModal.tsx` | All price forecasts, sell planner comparisons, and Sauda Slips carry explicit disclaimers: *"Information for negotiation transparency, not financial advice."* |
| **Accessibility & Zoom Barrier Removal** | **DONE** | `index.html` | Removed `user-scalable=no` and `maximum-scale=1.0` from viewport meta, enabling pinch-to-zoom for farmers with low vision. Added WCAG compliant theme-color. |
| **OpenGraph & Brand Identity** | **DONE** | `index.html`, `public/og-image.svg`, `public/manifest.json` | Real OpenGraph cards, Twitter preview tags, SVG truck-art poster asset, and PWA configuration installed. |

---

## 2. Module 1: Live Mandi Prices (Daily Hook)

| Feature | Status | Implementation File(s) | Verification & Notes |
|---------|--------|------------------------|----------------------|
| **Agmarknet Live Prices API** | **DONE** | `server/functions/prices.ts`, `src/pages/PricesPage.tsx` | Daily wholesale modal, min, max prices per quintal and per kg across commodities (Chilli, Tomato, Wheat, Onion, Cotton, Paddy, Potato, Soybean). |
| **Nearby Mandis (~100 km Radius)** | **DONE** | `server/db/repository.ts`, `src/pages/PricesPage.tsx` | Compares local APMC with neighboring markets (e.g., Guntur, Khammam, Azadpur) showing percentage delta and plain-language opportunity statements. |
| **7-Day Trend Sparklines** | **DONE** | `src/pages/PricesPage.tsx` | Visual historical price trajectory showing 7-day APMC trend. |
| **Voice Query Engine** | **DONE** | `server/functions/voiceQuery.ts`, `src/pages/PricesPage.tsx` | Voice mic button -> Prisma STT -> Evon intent parse -> Agmarknet factual data answer -> Timbre TTS audio reply. |
| **Target Price Alerts** | **DONE** | `server/functions/alerts.ts`, `src/pages/PricesPage.tsx` | Farmer sets target rate; evaluates condition (above/below); supports Browser Push and WhatsApp channel alerts. |

---

## 3. Module 2: Sell Planner (Pre-Trip Briefing)

| Feature | Status | Implementation File(s) | Verification & Notes |
|---------|--------|------------------------|----------------------|
| **Inputs: Crop, Qty, Grade, Freight** | **DONE** | `src/pages/PlannerPage.tsx` | Produce quantity with Quintal/Kg toggle, Grade A/B/C selector, transport freight rate (₹/quintal), mandi fee (%), and hamali (₹/bag). |
| **Net-in-Hand Arithmetic** | **DONE** | `server/functions/planner.ts` | All logistics deductions computed strictly in code: Net = Gross - Transport - Mandi Cess - Hamali. Verified in `tests/mandi-companion.test.ts`. |
| **Best Mandi Today** | **DONE** | `server/functions/planner.ts`, `src/pages/PlannerPage.tsx` | Highlights market yielding highest net take-home rupee earnings. |
| **"Do Not Sell Below" Floor** | **DONE** | `server/functions/planner.ts`, `src/pages/PlannerPage.tsx` | Recommends minimum walkaway rate based on recent APMC auction floor prices. |
| **Top 3 Likely Tricks** | **DONE** | `server/functions/planner.ts`, `src/pages/PlannerPage.tsx` | Identifies APMC yard tricks (moisture cut, kanta tare cut, delayed cheque) with actionable counter-measures. |

---

## 4. Module 3: Bargain Practice (Upgraded Engine)

| Feature | Status | Implementation File(s) | Verification & Notes |
|---------|--------|------------------------|----------------------|
| **Live Agmarknet Price Anchor** | **DONE** | `src/store/useGame.ts`, `src/App.tsx`, `src/components/sim/SetupPanel.tsx` | Reference price anchored directly to Module 1 live modal rate for chosen mandi rather than hardcoded dummy values. |
| **Server-Authoritative Session & Turn** | **DONE** | `server/functions/practiceSession.ts`, `server/functions/practiceTurn.ts` | Session state, hidden reserve, patience, and history managed on server. Offer clamping enforces that bids never exceed hidden reserve. |
| **Dual Roles (Farmer & Trader)** | **DONE** | `src/components/profile/ProfileModal.tsx`, `src/components/sim/SetupPanel.tsx` | Farmer sells to tough trader; Trader practices sourcing, grading, and inspecting produce. |
| **Behavioral Scorecard** | **DONE** | `src/components/score/Scorecard.tsx`, `src/lib/scoring.ts` | Evaluates evidence used, tricks countered, respectful firmness, clean closing, and money left on table vs reserve. |

---

## 5. Module 4: Deal Ledger & Proof of Impact

| Feature | Status | Implementation File(s) | Verification & Notes |
|---------|--------|------------------------|----------------------|
| **Real Deal Logging** | **DONE** | `server/functions/deals.ts`, `src/pages/DealsLedgerPage.tsx` | User records real transaction (crop, weight, rate, buyer/seller name, payment mode, date). |
| **Market Modal Comparison** | **DONE** | `server/functions/deals.ts`, `src/pages/DealsLedgerPage.tsx` | Compares agreed rate with that day's Agmarknet modal rate at that mandi; calculates rupee difference (+/- ₹). |
| **Monthly Proof of Impact** | **DONE** | `server/functions/deals.ts`, `src/pages/DealsLedgerPage.tsx` | Aggregates total quintals traded, gross value, and extra rupees earned above market benchmarks. |
| **Dispute-Proof Sauda Slip** | **DONE** | `src/components/deals/SaudaSlipModal.tsx` | Printable, copyable, and WhatsApp-shareable trade confirmation receipt with APMC reference numbers. |
| **FPO / Trader Aggregate Dashboard** | **DONE** | `server/functions/fpoDashboard.ts`, `src/pages/DealsLedgerPage.tsx` | DPDP compliant aggregate insights; strictly enforces **k >= 5 users** threshold; includes CSV export download. |

---

## 6. Security, Privacy & Infrastructure

| Feature | Status | Implementation File(s) | Verification & Notes |
|---------|--------|------------------------|----------------------|
| **DPDP Act "Delete My Data"** | **DONE** | `server/functions/profile.ts`, `src/components/profile/ProfileModal.tsx` | Cascading erasure completely purges user profile, consents, practice sessions, turns, deals, and alerts. Tested in Vitest. |
| **Circuit Breakers & Timeouts** | **DONE** | `server/functions/_gnani.ts`, `server/functions/health.ts` | 3 consecutive failures trigger 30s open state; AbortSignal timeouts (10s STT, 8s TTS, 12s Evon). |
| **Audio Duration Limit** | **DONE** | `server/db/repository.ts` | Rejects payloads exceeding 2 MB (~12 seconds). |
| **Meta WhatsApp Cloud Gateway** | **DONE** | `server/functions/whatsappWebhook.ts` | Webhook verification (GET) and incoming message processing (POST) behind `ENABLE_WHATSAPP_GATEWAY` feature flag. |
| **Vercel Serverless Function Bundling** | **DONE** | `scripts/build-api.js`, `api/*.js` | Self-contained ESM bundles compiled with esbuild, eliminating Node 22 missing relative file errors. |
| **Automated CI Workflow** | **DONE** | `.github/workflows/ci.yml` | Linting (`npm run lint`), Vitest tests (`npm test`), and production build (`npm run build`). |

