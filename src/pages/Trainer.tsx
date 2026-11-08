import React from 'react';
import { TrickHeatmap } from '../components/trainer/TrickHeatmap';

export const Trainer: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B5E34]">
          Extension Officer & FPO Curriculum
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1B1B3A] mt-1">
          Trainer Diagnostic & Heatmap View
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Aggregated cohort analytics for agricultural extension officers and FPO master trainers to identify high-frequency negotiation vulnerabilities.
        </p>
      </div>

      <TrickHeatmap />
    </div>
  );
};
