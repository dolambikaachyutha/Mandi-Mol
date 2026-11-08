import React from 'react';
import { useGame } from '../../store/useGame';
import { t } from '../../lib/i18n';

export const Footer: React.FC = () => {
  const uiLanguage = useGame((state) => state.uiLanguage);

  return (
    <footer className="bg-[#1B1B3A] text-[#F6EBD3] border-t-4 border-[#F2B705] mt-16 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌶️</span>
            <span className="font-display text-2xl font-bold text-[#F2B705]">Mandi Mol</span>
          </div>
          <p className="text-sm text-slate-300 mt-2 max-w-md">
            {t(uiLanguage, 'footerDescription')}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-amber-300">
            <span>#GnaniAI</span>
            <span>·</span>
            <span>#GreatIndianAIInternshipChallenge</span>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-300 md:text-right max-w-md">
          <p className="font-semibold text-white">
            {t(uiLanguage, 'footerPracticeNote')}
          </p>
          <p className="text-slate-400">
            {t(uiLanguage, 'footerPrivacy')}
          </p>
        </div>
      </div>
    </footer>
  );
};
