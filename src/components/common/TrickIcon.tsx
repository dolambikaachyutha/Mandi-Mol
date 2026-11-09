import React from 'react';
import { Search, TrendingDown, Package, Scale, Clock, Users, AlertTriangle } from 'lucide-react';

interface TrickIconProps {
  trickId?: string;
  className?: string;
}

export const TrickIcon: React.FC<TrickIconProps> = ({ trickId, className = 'w-5 h-5' }) => {
  switch (trickId) {
    case 'quality_nitpick':
      return <Search className={`${className} text-amber-600`} aria-label="Quality Nitpick" />;
    case 'false_market_drop':
      return <TrendingDown className={`${className} text-red-600`} aria-label="False Market Drop" />;
    case 'fake_scarcity':
      return <Package className={`${className} text-stone-600`} aria-label="Fake Market Glut" />;
    case 'weight_cut':
      return <Scale className={`${className} text-amber-600`} aria-label="Weighbridge Cut" />;
    case 'delayed_payment':
      return <Clock className={`${className} text-orange-600`} aria-label="Delayed Payment" />;
    case 'friendly_pressure':
      return <Users className={`${className} text-sky-600`} aria-label="Friendly Pressure" />;
    default:
      return <AlertTriangle className={`${className} text-amber-600`} aria-label="Mandi Trick" />;
  }
};

