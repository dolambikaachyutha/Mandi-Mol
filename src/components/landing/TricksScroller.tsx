import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { TRICK_LIST } from '../../lib/tricks';
import { useGame } from '../../store/useGame';
import { t } from '../../lib/i18n';

export const TricksScroller: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const uiLanguage = useGame((state) => state.uiLanguage);

  return (
    <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D62828]">
            {t(uiLanguage, 'tricksBadge')}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1B1B3A] mt-1">
            {t(uiLanguage, 'tricksTitle')}
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            {t(uiLanguage, 'tricksDescription')}
          </p>
        </div>

        {/* Quick Tabs on Mobile/Desktop */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-amber-100 rounded-xl border border-amber-300">
          {TRICK_LIST.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => setSelectedIdx(idx)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${selectedIdx === idx
                  ? 'bg-[#1B1B3A] text-amber-300 shadow-sm'
                  : 'text-slate-700 hover:text-[#1B1B3A]'
                }`}
            >
              {t.icon} {t.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of 6 Mandi Poster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TRICK_LIST.map((trick, idx) => {
          const isSelected = selectedIdx === idx;
          return (
            <div
              key={trick.id}
              onClick={() => setSelectedIdx(idx)}
              className={`mandi-card p-6 bg-[#FFFDF8] border-3 transition-all cursor-pointer flex flex-col justify-between ${isSelected
                  ? 'border-[#D62828] shadow-[6px_6px_0px_#D62828] ring-2 ring-red-200'
                  : 'border-[#1B1B3A] hover:border-[#D62828] shadow-[4px_4px_0px_#1B1B3A]'
                }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                  <span className="text-3xl">{trick.icon}</span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 uppercase bg-amber-100 px-2 py-0.5 rounded">
                    {t(uiLanguage, 'trickTag')} #{idx + 1}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-display text-xl font-bold text-[#1B1B3A]">
                    {trick.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-hindi mt-0.5 font-medium">
                    {trick.hindiName}
                  </p>
                </div>

                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                  {trick.description}
                </p>

                {/* Trader line quotation */}
                <div className="mt-4 p-3 bg-red-50/80 rounded-xl border border-red-200">
                  <span className="text-[10px] font-bold text-[#D62828] uppercase tracking-wide block mb-1">
                    {t(uiLanguage, 'traderSays')}:
                  </span>
                  <p className="text-xs italic text-[#1B1B3A] font-medium">
                    "{trick.hinglishExample}"
                  </p>
                </div>
              </div>

              {/* Counter Tip */}
              <div className="mt-4 pt-3 border-t border-amber-200 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{t(uiLanguage, 'counterTip')}:</span>
                </span>
                <p className="text-xs text-slate-800 font-medium">
                  {trick.counterTip}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
