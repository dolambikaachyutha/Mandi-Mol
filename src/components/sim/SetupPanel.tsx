import React from 'react';
import { useGame } from '../../store/useGame';
import { CROPS } from '../../lib/crops';
import { LANGUAGES } from '../../lib/languages';
import { t } from '../../lib/i18n';
import { Crop, Difficulty, Language } from '../../types';

interface SetupPanelProps {
  onStart: () => void;
}

export const SetupPanel: React.FC<SetupPanelProps> = ({ onStart }) => {
  const {
    crop, setCrop, language, setLanguage, difficulty, setDifficulty,
    farmerTerms, setFarmerTerms, traderTerms, setTraderTerms, uiLanguage,
  } = useGame();

  return (
    <div className="max-w-xl mx-auto mandi-card p-6 sm:p-8 bg-[#FFFDF8] border-3 border-[#1B1B3A] shadow-[6px_6px_0px_#1B1B3A] space-y-6">
      {/* Top Banner */}
      <div className="text-center pb-4 border-b-2 border-amber-200">
        <span className="text-3xl">⚖️</span>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1B1B3A] mt-1">
          {t(uiLanguage, 'setupTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Simulate high-stakes APMC bargaining. Reference prices anchored directly to Module 1 live market modal benchmarks.
        </p>
      </div>

      {/* Role Selection (Module 3 Dual Roles) */}
      <div className="space-y-2 bg-amber-50 p-3.5 rounded-xl border-2 border-amber-300">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1B3A]">
          🎭 Simulation Role (भूमिका चुनें)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-[#1B1B3A] text-[#F2B705] font-bold text-xs flex items-center gap-2">
            <span>🌾</span>
            <div>
              <p>Farmer (विक्रेता किसान)</p>
              <p className="text-[10px] text-stone-300 font-normal">Sell to tough trader</p>
            </div>
          </div>
          <div className="p-2.5 rounded-xl border-2 border-stone-300 bg-white text-stone-700 font-bold text-xs flex items-center gap-2">
            <span>💼</span>
            <div>
              <p>Trader (क्रेता व्यापारी)</p>
              <p className="text-[10px] text-stone-500 font-normal">Practice sourcing produce</p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Crop Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1B3A]">
          1. {t(uiLanguage, 'cropLabel')} ({crop.defaultQuantity} kg)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(CROPS).map((c: Crop) => {
            const isSelected = crop.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCrop(c)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-[#1B1B3A] bg-amber-100/90 shadow-[3px_3px_0px_#1B1B3A]'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{c.icon}</span>
                  <span className="font-mono text-xs font-bold text-[#D62828] bg-white px-2 py-0.5 rounded border border-slate-200">
                    {t(uiLanguage, 'practicePrices')}: ₹{c.referencePrice}/kg
                  </span>
                </div>
                <div className="mt-2">
                  <h3 className="font-bold text-sm text-[#1B1B3A]">{c.name}</h3>
                  <p className="text-xs text-slate-500 font-hindi">{c.hindiName}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Language Selection */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1B3A]">
          2. {t(uiLanguage, 'voiceLabel')} (Prisma STT + Timbre TTS)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LANGUAGES.map((l: Language) => {
            const isSelected = language.code === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l)}
                className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                  isSelected
                    ? 'border-[#1B1B3A] bg-amber-100 shadow-[2px_2px_0px_#1B1B3A]'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                <p className="font-bold text-xs text-[#1B1B3A]">{l.name}</p>
                <p className="text-[11px] text-slate-500">{l.nativeName}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Difficulty */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1B3A]">
          3. {t(uiLanguage, 'difficultyLabel')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['easy', 'hard'] as Difficulty[]).map((d) => {
            const isSelected = difficulty === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-[#1B1B3A] bg-amber-100 shadow-[3px_3px_0px_#1B1B3A]'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm text-[#1B1B3A] capitalize">
                  <span>{d === 'easy' ? '🌱' : '🔥'}</span>
                  <span>{t(uiLanguage, d)}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {d === 'easy'
                    ? t(uiLanguage, 'easyDescription')
                    : t(uiLanguage, 'hardDescription')}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B1B3A]">
          {t(uiLanguage, 'termsOptional')}
        </h3>
        <p className="text-xs text-slate-600">{t(uiLanguage, 'termsHelp')}</p>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">{t(uiLanguage, 'farmerTerms')}</span>
          <textarea
            value={farmerTerms}
            onChange={(event) => setFarmerTerms(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t(uiLanguage, 'farmerTermsPlaceholder')}
            className="w-full rounded-lg border-2 border-slate-300 bg-white p-3 text-sm focus:border-[#1B1B3A] focus:outline-none"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">{t(uiLanguage, 'traderTerms')}</span>
          <textarea
            value={traderTerms}
            onChange={(event) => setTraderTerms(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t(uiLanguage, 'traderTermsPlaceholder')}
            className="w-full rounded-lg border-2 border-slate-300 bg-white p-3 text-sm focus:border-[#1B1B3A] focus:outline-none"
          />
        </label>
      </div>

      {/* Summary Box */}
      <div className="bg-amber-50 p-3 rounded-xl border border-amber-300 text-xs font-mono flex items-center justify-between text-slate-700">
        <div>
          <span>{t(uiLanguage, 'quantityToSell')}: </span>
          <span className="font-bold text-[#1B1B3A]">{crop.defaultQuantity} kg</span>
          <span className="mx-2">·</span>
          <span>{t(uiLanguage, 'practicePrices')}: </span>
          <span className="font-bold text-[#2D6A4F]">
            ₹{(crop.referencePrice * crop.defaultQuantity).toLocaleString('en-IN')}
          </span>
        </div>
        <span className="text-[11px] text-slate-500">{t(uiLanguage, 'practicePrices')}</span>
      </div>

      {/* CTA Buttons */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onStart}
          className="flex-1 stamp-btn bg-[#F2B705] hover:bg-amber-400 text-[#1B1B3A] text-base py-3 px-6 text-center"
        >
          {t(uiLanguage, 'enterStall')}
        </button>
      </div>
    </div>
  );
};
