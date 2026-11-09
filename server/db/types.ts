export interface Profile {
  id: string;
  phone_hash?: string | null;
  phone_masked?: string | null;
  role: 'farmer' | 'trader' | 'fpo_admin';
  display_name?: string | null;
  default_state: string;
  default_district: string;
  default_mandi: string;
  preferred_language: string;
  preferred_crops: string[];
  created_at: string;
  updated_at: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: string;
  version: string;
  granted: boolean;
  ip_hash?: string | null;
  consented_at: string;
}

export interface MandiPriceRow {
  id: string;
  commodity_id: string;
  commodity_name: string;
  variety?: string;
  state: string;
  district: string;
  market: string;
  min_price: number; // Rs/Quintal
  modal_price: number; // Rs/Quintal
  max_price: number; // Rs/Quintal
  min_price_kg: number; // Rs/kg
  modal_price_kg: number; // Rs/kg
  max_price_kg: number; // Rs/kg
  arrival_date: string; // YYYY-MM-DD
  source: string;
  is_stale: boolean;
  distance_km?: number; // Calculated distance relative to user's mandi
  trend_pct?: number; // Compared to 7 days ago
}

export interface PracticeSessionRecord {
  id: string;
  user_id: string;
  role: 'farmer' | 'trader';
  crop_id: string;
  crop_name: string;
  mandi_location: string;
  quantity_kg: number;
  reference_price: number; // Real Agmarknet modal rate at start
  target_price?: number;
  walkaway_price?: number;
  opening_offer: number;
  current_offer: number;
  reserve_price: number; // Secret server-side only
  patience: number;
  difficulty: 'easy' | 'hard';
  status: 'active' | 'deal' | 'walkaway';
  trader_name: string;
  trader_firm: string;
  trader_style: string;
  created_at: string;
  closed_at?: string | null;
}

export interface PracticeTurnRecord {
  id: string;
  session_id: string;
  round: number;
  speaker: 'farmer' | 'trader';
  transcript: string;
  detected_language?: string;
  trader_offer: number;
  trader_mood: string;
  trader_line: string;
  trader_trick?: string;
  clamped: boolean;
  farmer_evidence: boolean;
  farmer_trick_countered: boolean;
  farmer_respectful: boolean;
  created_at: string;
}

export interface DealRecord {
  id: string;
  user_id: string;
  sauda_number?: string;
  crop_id: string;
  crop_name?: string;
  deal_type?: 'sold' | 'bought';
  quantity_kg: number;
  price_per_kg?: number;
  agreed_price_per_kg?: number;
  agmarknet_modal_price_per_kg?: number;
  total_gross_amount: number;
  mandi_location: string;
  buyer_seller_name?: string;
  counterparty_name?: string;
  counterparty_firm?: string;
  payment_mode: string;
  settlement_terms?: string;
  market_modal_price_kg?: number;
  diff_vs_market_rs_per_kg: number;
  total_diff_vs_market_rs: number;
  deal_date: string;
  notes?: string;
  created_at: string;
}

export interface PriceAlertRecord {
  id: string;
  user_id: string;
  crop_id: string;
  mandi_location: string;
  target_price_kg?: number;
  target_price_per_kg?: number;
  condition: 'above' | 'below';
  channel: 'whatsapp' | 'push' | 'in_app';
  phone?: string;
  is_triggered?: boolean;
  is_active: boolean;
  triggered_at?: string | null;
  created_at: string;
}

