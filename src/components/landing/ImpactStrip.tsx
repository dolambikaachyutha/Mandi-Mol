import React from 'react';
import { useSessions } from '../../store/useSessions';
import { useGame } from '../../store/useGame';
import { t } from '../../lib/i18n';

export const ImpactStrip: React.FC = () => {
  const { sessions } = useSessions();
  const uiLanguage = useGame((state) => state.uiLanguage);
  const n = sessions.length;
  const averageScore = n
    ? Math.round(sessions.reduce((total, session) => total + session.score, 0) / n)
    : null;

  return (
    <section className="py-12 px-4 sm:px-6 bg-[#1A1A3A] text-white border-y-2 border-amber-400">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
            {t(uiLanguage, 'measuredImpact')}
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#CFE8F0]">
            {t(uiLanguage, 'impactHeadline')}
          </h3>
        </div>

        {n === 0 ? (
          <p className="max-w-md text-sm text-slate-300">{t(uiLanguage, 'noTrials')}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-8">
            <div>
              <span className="block font-mono text-3xl font-black text-amber-400">{n}</span>
              <span className="text-xs text-slate-300">{t(uiLanguage, 'recordedSessions', { count: n })}</span>
            </div>
            <div>
              <span className="block font-mono text-3xl font-black text-emerald-400">{averageScore}%</span>
              <span className="text-xs text-slate-300">{t(uiLanguage, 'averagePracticeScore')}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
