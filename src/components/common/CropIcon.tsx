import React from 'react';
import { Flame, Apple, Wheat, Sprout, Package, Tag, Leaf } from 'lucide-react';

interface CropIconProps {
  cropId?: string;
  name?: string;
  className?: string;
}

export const CropIcon: React.FC<CropIconProps> = ({ cropId, name, className = 'w-5 h-5' }) => {
  const key = (cropId || name || '').toLowerCase();

  if (key.includes('chilli') || key.includes('mirch') || key.includes('teja')) {
    return <Flame className={`${className} text-red-600`} aria-label="Chilli" />;
  }
  if (key.includes('tomato') || key.includes('tamatar')) {
    return <Apple className={`${className} text-red-500`} aria-label="Tomato" />;
  }
  if (key.includes('wheat') || key.includes('gehu') || key.includes('sharbati')) {
    return <Wheat className={`${className} text-amber-600`} aria-label="Wheat" />;
  }
  if (key.includes('paddy') || key.includes('basmati') || key.includes('rice') || key.includes('dhan')) {
    return <Wheat className={`${className} text-emerald-600`} aria-label="Paddy" />;
  }
  if (key.includes('onion') || key.includes('pyaz')) {
    return <Sprout className={`${className} text-purple-600`} aria-label="Onion" />;
  }
  if (key.includes('cotton') || key.includes('kapas')) {
    return <Package className={`${className} text-sky-600`} aria-label="Cotton" />;
  }
  if (key.includes('potato') || key.includes('aloo')) {
    return <Tag className={`${className} text-amber-700`} aria-label="Potato" />;
  }
  if (key.includes('soybean') || key.includes('soya')) {
    return <Leaf className={`${className} text-emerald-600`} aria-label="Soybean" />;
  }

  return <Sprout className={`${className} text-stone-600`} aria-label="Crop" />;
};

