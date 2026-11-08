import React from 'react';
import { RubricBreakdown } from '../../types';

interface RubricBarsProps {
  rubrics: RubricBreakdown;
}

export const RubricBars: React.FC<RubricBarsProps> = ({ rubrics }) => {
  const items = [
    { label: 'Final Price Capture', score: rubrics.priceScore, max: 40, weight: '40 pts' },
    { label: 'First Offer Rejection', score: rubrics.firstOfferNotAccepted, max: 10, weight: '10 pts' },
    { label: 'Market Evidence & Benchmarks', score: rubrics.evidenceUsed, max: 15, weight: '15 pts' },
    { label: 'Trader Trick Countered', score: rubrics.trickCountered, max: 15, weight: '15 pts' },
    { label: 'Respectful Firmness', score: rubrics.respectfulFirmness, max: 10, weight: '10 pts' },
    { label: 'Commercial Closing (Cash/APMC)', score: rubrics.cleanClosing, max: 10, weight: '10 pts' },
  ];

  return (
    <div className="space-y-3 font-mono text-xs">
      <h4 className="font-sans font-bold text-sm text-[#1B1B3A] mb-2">
        Transparent Scoring Rubric (Strict Code Evaluation)
      </h4>

      {items.map((it) => {
        const pct = (it.score / it.max) * 100;
        return (
          <div key={it.label} className="space-y-1">
            <div className="flex justify-between text-slate-700">
              <span className="font-medium font-sans">{it.label}</span>
              <span className="font-bold">
                {it.score} / {it.max}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300">
              <div
                style={{ width: `${pct}%` }}
                className={`h-full transition-all duration-500 rounded-full ${
                  pct >= 80 ? 'bg-[#2D6A4F]' : pct >= 50 ? 'bg-[#F2B705]' : 'bg-[#D62828]'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
