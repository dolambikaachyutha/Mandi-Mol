import React from 'react';
import { useGame } from '../../store/useGame';
import { t } from '../../lib/i18n';

interface LandingCtaProps {
  onStart: () => void;
}

export const LandingCta: React.FC<LandingCtaProps> = ({ onStart }) => {
  const uiLanguage = useGame((state) => state.uiLanguage);
  return (
    <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
      <div className="mandi-card p-8 sm:p-12 bg-amber-100 border-3 border-[#1B1B3A] shadow-[8px_8px_0px_#1B1B3A] space-y-6">
        <span className="text-4xl">🌾</span>
        <h2 className="font-display text-3xl sm:text-5xl font-black text-[#1B1B3A] leading-tight">
          {t(uiLanguage, 'ctaTitle')}
        </h2>
        <p className="text-base text-slate-700 max-w-xl mx-auto">
          {t(uiLanguage, 'ctaDescription')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <button
            onClick={onStart}
            className="stamp-btn bg-[#F2B705] hover:bg-amber-400 text-[#1B1B3A] text-lg font-bold py-3.5 px-8"
          >
            {t(uiLanguage, 'startVoice')} →
          </button>

        </div>

        <p className="text-xs text-slate-600 font-mono">
          {t(uiLanguage, 'ctaMicNote')}
        </p>
      </div>
    </section>
  );
};
