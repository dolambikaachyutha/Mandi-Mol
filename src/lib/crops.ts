import { Crop } from '../types';

export const CROPS: Record<string, Crop> = {
  chilli: {
    id: 'chilli',
    name: 'Teja Chilli (Dry)',
    hindiName: 'तेजा मिर्च (सूखी)',
    variety: 'Guntur Teja #S17',
    unit: 'kg',
    referencePrice: 185, // Illustrative practice price, not a live mandi quote
    defaultQuantity: 500, // kg
    minReserveMult: 0.98,
    maxReserveMult: 1.05,
    minOpenMult: 0.78,
    maxOpenMult: 0.85,
    description: 'High pungency, deep red, export-grade dry red chilli from Guntur/Warangal belt.',
    icon: '🌶️',
  },
  tomato: {
    id: 'tomato',
    name: 'Hybrid Tomato',
    hindiName: 'हाइब्रिड टमाटर',
    variety: 'Shivam Semi-Determinate',
    unit: 'kg',
    referencePrice: 32, // Illustrative practice price, not a live mandi quote
    defaultQuantity: 500, // kg (approx 20 crates)
    minReserveMult: 0.97,
    maxReserveMult: 1.04,
    minOpenMult: 0.76,
    maxOpenMult: 0.84,
    description: 'Firm, uniform red harvest. Perishable, high moisture, sensitive to market gluts.',
    icon: '🍅',
  },
};

export const DEFAULT_CROP = CROPS.chilli;
