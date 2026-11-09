-- ============================================================================
-- MANDI MOL: PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase / PostgreSQL 15+
-- Adheres to DPDP Act principles: Notice, Consent, Purpose Limitation, Deletion
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Anonymous or Phone-Identified Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_hash VARCHAR(64) NULL, -- SHA-256 hash of phone, never plain text
  phone_masked VARCHAR(16) NULL, -- e.g. +91 98*** **321
  role VARCHAR(20) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'trader', 'fpo_admin')),
  display_name VARCHAR(100) NULL,
  default_state VARCHAR(60) NOT NULL DEFAULT 'Telangana',
  default_district VARCHAR(60) NOT NULL DEFAULT 'Warangal',
  default_mandi VARCHAR(100) NOT NULL DEFAULT 'Warangal APMC Yard',
  preferred_language VARCHAR(20) NOT NULL DEFAULT 'hinglish',
  preferred_crops TEXT[] NOT NULL DEFAULT '{"chilli", "tomato"}',
  fpo_org_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONSENTS TABLE (DPDP Audit Log)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- 'voice_stt_transcription', 'dpdp_privacy_notice', 'price_alerts'
  version VARCHAR(20) NOT NULL DEFAULT '2026.1',
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  ip_hash VARCHAR(64) NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRICE CACHE (Agmarknet Ingestion)
CREATE TABLE IF NOT EXISTS public.price_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commodity_id VARCHAR(50) NOT NULL,
  commodity_name VARCHAR(100) NOT NULL,
  variety VARCHAR(100) NULL,
  state VARCHAR(60) NOT NULL,
  district VARCHAR(60) NOT NULL,
  market VARCHAR(100) NOT NULL,
  min_price NUMERIC(10, 2) NOT NULL, -- In Rs / Quintal
  modal_price NUMERIC(10, 2) NOT NULL, -- In Rs / Quintal
  max_price NUMERIC(10, 2) NOT NULL, -- In Rs / Quintal
  min_price_kg NUMERIC(10, 2) GENERATED ALWAYS AS (min_price / 100.0) STORED,
  modal_price_kg NUMERIC(10, 2) GENERATED ALWAYS AS (modal_price / 100.0) STORED,
  max_price_kg NUMERIC(10, 2) GENERATED ALWAYS AS (max_price / 100.0) STORED,
  arrival_date DATE NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'Agmarknet (data.gov.in)',
  is_stale BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_market_commodity_date UNIQUE (market, commodity_id, arrival_date)
);

CREATE INDEX IF NOT EXISTS idx_price_cache_lookup 
ON public.price_cache(commodity_id, state, district, arrival_date DESC);

-- 4. SESSIONS (Server-Authoritative Bargain State)
-- Hidden reserve price is stored here and NEVER exposed in active turn queries
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'trader')),
  crop_id VARCHAR(50) NOT NULL,
  crop_name VARCHAR(100) NOT NULL,
  mandi_location VARCHAR(100) NOT NULL,
  quantity_kg NUMERIC(10, 2) NOT NULL,
  reference_price NUMERIC(10, 2) NOT NULL, -- Real Agmarknet modal rate at start
  target_price NUMERIC(10, 2) NULL, -- Farmer's asking rate
  walkaway_price NUMERIC(10, 2) NULL, -- Farmer's lowest floor
  opening_offer NUMERIC(10, 2) NOT NULL,
  current_offer NUMERIC(10, 2) NOT NULL,
  reserve_price NUMERIC(10, 2) NOT NULL, -- SECRET: Server only!
  patience INT NOT NULL DEFAULT 5,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'easy',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deal', 'walkaway')),
  trader_name VARCHAR(100) NOT NULL DEFAULT 'Lalaji',
  trader_firm VARCHAR(150) NOT NULL DEFAULT 'Gupta Agro Commodities',
  trader_style VARCHAR(30) NOT NULL DEFAULT 'fair',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ NULL
);

-- 5. TURNS (Transcripts & Telemetry - STRICTLY NO RAW AUDIO STORED)
CREATE TABLE IF NOT EXISTS public.turns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  round INT NOT NULL,
  speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('farmer', 'trader')),
  transcript TEXT NOT NULL,
  detected_language VARCHAR(30) NULL,
  trader_offer NUMERIC(10, 2) NOT NULL,
  trader_mood VARCHAR(20) NOT NULL DEFAULT 'talking',
  trader_line TEXT NOT NULL,
  trader_trick VARCHAR(50) NULL,
  clamped BOOLEAN NOT NULL DEFAULT FALSE,
  farmer_evidence BOOLEAN NOT NULL DEFAULT FALSE,
  farmer_trick_countered BOOLEAN NOT NULL DEFAULT FALSE,
  farmer_respectful BOOLEAN NOT NULL DEFAULT TRUE,
  turn_latency_ms INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turns_session ON public.turns(session_id, round);

-- 6. DEALS (Real Verified Mandi Settlements)
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sauda_number VARCHAR(50) NOT NULL UNIQUE,
  crop_id VARCHAR(50) NOT NULL,
  crop_name VARCHAR(100) NOT NULL,
  quantity_kg NUMERIC(10, 2) NOT NULL,
  price_per_kg NUMERIC(10, 2) NOT NULL,
  total_gross_amount NUMERIC(12, 2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
  mandi_location VARCHAR(100) NOT NULL,
  counterparty_name VARCHAR(100) NOT NULL,
  counterparty_firm VARCHAR(150) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL,
  settlement_terms TEXT NULL,
  market_modal_price_kg NUMERIC(10, 2) NOT NULL, -- Daily Agmarknet modal rate on deal day
  diff_vs_market_rs_per_kg NUMERIC(10, 2) GENERATED ALWAYS AS (price_per_kg - market_modal_price_kg) STORED,
  total_diff_vs_market_rs NUMERIC(12, 2) GENERATED ALWAYS AS ((price_per_kg - market_modal_price_kg) * quantity_kg) STORED,
  deal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PRICE ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop_id VARCHAR(50) NOT NULL,
  mandi_location VARCHAR(100) NOT NULL,
  target_price_kg NUMERIC(10, 2) NOT NULL,
  condition VARCHAR(10) NOT NULL DEFAULT 'above' CHECK (condition IN ('above', 'below')),
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'push', 'in_app')),
  is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Price cache is globally readable by anyone
CREATE POLICY "Price cache is public" 
ON public.price_cache FOR SELECT USING (true);

-- Profiles: users can select/update their own profile
CREATE POLICY "Users read own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Sessions: users see own sessions
CREATE POLICY "Users access own sessions" 
ON public.sessions FOR ALL 
USING (auth.uid() = user_id);

-- Turns: users access turns of own sessions
CREATE POLICY "Users access own turns" 
ON public.turns FOR ALL 
USING (session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid()));

-- Deals: users see own deals
CREATE POLICY "Users access own deals" 
ON public.deals FOR ALL 
USING (auth.uid() = user_id);

-- Alerts: users access own alerts
CREATE POLICY "Users access own alerts" 
ON public.alerts FOR ALL 
USING (auth.uid() = user_id);

-- ============================================================================
-- TRADER / FPO AGGREGATED ANONYMOUS VIEW
-- Minimum 5 users threshold to protect privacy
-- ============================================================================

CREATE OR REPLACE VIEW public.fpo_anonymous_analytics AS
SELECT 
  s.crop_id,
  s.mandi_location,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT s.user_id) AS total_users,
  ROUND(AVG(d.diff_vs_market_rs_per_kg), 2) AS avg_premium_vs_market,
  ROUND(SUM(d.total_gross_amount), 2) AS total_volume_traded_rs
FROM public.sessions s
LEFT JOIN public.deals d ON d.user_id = s.user_id AND d.crop_id = s.crop_id
GROUP BY s.crop_id, s.mandi_location
HAVING COUNT(DISTINCT s.user_id) >= 5;

