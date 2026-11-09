import { Crop } from '../types';

export const BASE_CROPS: Record<string, Crop> = {
  chilli: {
    id: 'chilli',
    name: 'Teja Chilli (Dry)',
    hindiName: 'तेजा मिर्च (सूखी)',
    variety: 'Guntur Teja #S17',
    unit: 'kg',
    referencePrice: 185, // ₹185/kg = ₹18,500/quintal
    defaultQuantity: 500, // kg
    minReserveMult: 0.98,
    maxReserveMult: 1.05,
    minOpenMult: 0.78,
    maxOpenMult: 0.85,
    description: 'High pungency, deep red, export-grade dry red chilli from Guntur/Warangal belt.',
    icon: '',
    category: 'spices',
    mandiHub: 'Guntur & Warangal APMC',
  },
  tomato: {
    id: 'tomato',
    name: 'Hybrid Tomato',
    hindiName: 'हाइब्रिड टमाटर',
    variety: 'Shivam Semi-Determinate',
    unit: 'kg',
    referencePrice: 32, // ₹32/kg = ₹3,200/quintal
    defaultQuantity: 1000, // kg (approx 40 crates)
    minReserveMult: 0.97,
    maxReserveMult: 1.04,
    minOpenMult: 0.76,
    maxOpenMult: 0.84,
    description: 'Firm, uniform red harvest. Perishable, high moisture, sensitive to market gluts.',
    icon: '',
    category: 'vegetables',
    mandiHub: 'Azadpur & Kolar APMC',
  },
  wheat: {
    id: 'wheat',
    name: 'Sharbati Wheat',
    hindiName: 'शरबती गेहूं',
    variety: 'C-306 Golden Grain',
    unit: 'kg',
    referencePrice: 28, // ₹28/kg = ₹2,800/quintal
    defaultQuantity: 2000, // kg (20 quintals / 40 bags)
    minReserveMult: 0.98,
    maxReserveMult: 1.05,
    minOpenMult: 0.80,
    maxOpenMult: 0.86,
    description: 'Lustrous, heavy golden grains with high gluten. Premium benchmark in Sehore/Khanna yards.',
    icon: '',
    category: 'grains',
    mandiHub: 'Khanna & Sehore Mandi',
  },
  paddy: {
    id: 'paddy',
    name: 'Sona Masoori Paddy',
    hindiName: 'धान (सोना मसूरी)',
    variety: 'BPT-5204 Samba Mahsuri',
    unit: 'kg',
    referencePrice: 26, // ₹26/kg = ₹2,600/quintal
    defaultQuantity: 3000, // kg (30 quintals)
    minReserveMult: 0.98,
    maxReserveMult: 1.04,
    minOpenMult: 0.78,
    maxOpenMult: 0.84,
    description: 'Fine aromatic paddy with low broken percentage. High millers demand in Raichur and Miryalaguda.',
    icon: '',
    category: 'grains',
    mandiHub: 'Miryalaguda & Raichur APMC',
  },
  onion: {
    id: 'onion',
    name: 'Nashik Red Onion',
    hindiName: 'नासिक लाल प्याज',
    variety: 'Garwa Summer Stock',
    unit: 'kg',
    referencePrice: 24, // ₹24/kg = ₹2,400/quintal
    defaultQuantity: 1500, // kg (15 quintals)
    minReserveMult: 0.97,
    maxReserveMult: 1.06,
    minOpenMult: 0.75,
    maxOpenMult: 0.82,
    description: 'Export-grade dry skins, tightly packed layers. Sensitive to moisture tare and grading cuts.',
    icon: '',
    category: 'vegetables',
    mandiHub: 'Lasalgaon Mandi',
  },
  cotton: {
    id: 'cotton',
    name: 'Raw Cotton (Kapas)',
    hindiName: 'कपास (रुई)',
    variety: 'Shankar-6 Long Staple (28-29mm)',
    unit: 'kg',
    referencePrice: 72, // ₹72/kg = ₹7,200/quintal
    defaultQuantity: 1000, // kg (10 quintals)
    minReserveMult: 0.98,
    maxReserveMult: 1.05,
    minOpenMult: 0.80,
    maxOpenMult: 0.86,
    description: 'Clean white fiber with low trash content (<3%) and high ginning outturn (34%).',
    icon: '',
    category: 'cash_crop',
    mandiHub: 'Rajkot & Adilabad Yard',
  },
  potato: {
    id: 'potato',
    name: 'Kufri Jyoti Potato',
    hindiName: 'आलू (कुफरी ज्योति)',
    variety: 'Table / Processing Grade',
    unit: 'kg',
    referencePrice: 18, // ₹18/kg = ₹1,800/quintal
    defaultQuantity: 2500, // kg (25 quintals)
    minReserveMult: 0.96,
    maxReserveMult: 1.04,
    minOpenMult: 0.76,
    maxOpenMult: 0.83,
    description: 'Uniform oval tubers, smooth skin, low sugar content. High demand in Agra and Farrukhabad.',
    icon: '',
    category: 'vegetables',
    mandiHub: 'Agra & Farrukhabad Mandi',
  },
  soybean: {
    id: 'soybean',
    name: 'Yellow Soybean',
    hindiName: 'पीली सोयाबीन',
    variety: 'JS-335 Oilseed Grade',
    unit: 'kg',
    referencePrice: 46, // ₹46/kg = ₹4,600/quintal
    defaultQuantity: 1200, // kg (12 quintals)
    minReserveMult: 0.98,
    maxReserveMult: 1.05,
    minOpenMult: 0.79,
    maxOpenMult: 0.85,
    description: 'High oil recovery (>18%), clean round grain with moisture <10%. Indore benchmark.',
    icon: '',
    category: 'oilseeds',
    mandiHub: 'Indore & Ujjain APMC',
  },
};

const CUSTOM_CROPS_STORAGE_KEY = 'mandi_mol_custom_crops_v1';

export function getCustomCrops(): Record<string, Crop> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_CROPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomCrop(crop: Crop): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomCrops();
    existing[crop.id] = crop;
    localStorage.setItem(CUSTOM_CROPS_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save custom crop:', err);
  }
}

export function getAllCrops(): Record<string, Crop> {
  return { ...BASE_CROPS, ...getCustomCrops() };
}

export const CROPS = BASE_CROPS;
export const CROPS_LIST: Crop[] = Object.values(BASE_CROPS);
export const DEFAULT_CROP = CROPS.chilli;
