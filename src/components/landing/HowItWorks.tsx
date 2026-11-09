import React from 'react';
import { Sliders, Mic, TrendingUp } from 'lucide-react';
import { useGame } from '../../store/useGame';
import { t } from '../../lib/i18n';

interface HowItWorksProps {
  onNavigateArchitecture: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigateArchitecture }) => {
  const uiLanguage = useGame((state) => state.uiLanguage);
  const steps = [
    { number: '01', title: 'setupStep', description: 'setupStepDescription', icon: Sliders, color: 'border-sky-500 bg-sky-50/50' },
    { number: '02', title: 'bargainStep', description: 'bargainStepDescription', icon: Mic, color: 'border-amber-500 bg-amber-50/50' },
    { number: '03', title: 'reviewStep', description: 'reviewStepDescription', icon: TrendingUp, color: 'border-emerald-500 bg-emerald-50/50' },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 bg-[#FFFDF8] border-y-3 border-[#1B1B3A]">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full text-xs font-mono font-bold text-[#1B1B3A] border border-amber-300">
            {t(uiLanguage, 'howBadge')}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1B1B3A]">
            {t(uiLanguage, 'howTitle')}
          </h2>
          <p className="text-sm text-slate-600">{t(uiLanguage, 'howDescription')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={`mandi-card p-6 border-3 border-[#1B1B3A] shadow-[5px_5px_0px_#1B1B3A] space-y-4 ${step.color}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#1B1B3A] flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 text-[#1B1B3A]" />
                  </div>
                  <span className="font-mono text-2xl font-black text-[#1B1B3A]/30">{step.number}</span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#1B1B3A] leading-snug">
                  {t(uiLanguage, step.title)}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {t(uiLanguage, step.description)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onNavigateArchitecture}
            className="stamp-btn bg-white hover:bg-amber-100 text-[#1B1B3A] text-sm py-2.5 px-6 inline-flex items-center gap-2"
          >
            <span>{t(uiLanguage, 'architectureLink')}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
};
