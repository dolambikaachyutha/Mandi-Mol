import React from 'react';
import { useGame } from '../../store/useGame';

export const StatusChips: React.FC = () => {
  const { providerHealth } = useGame();

  const providers = [
    { name: 'Prisma (STT)', ...providerHealth.prisma },
    { name: 'Evon (Reasoning)', ...providerHealth.evon },
    { name: 'Timbre (TTS)', ...providerHealth.timbre },
  ];

  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      {providers.map((p) => {
        const isLive = p.mode === 'live' && p.ok;
        const label = isLive ? 'LIVE' : p.mode === 'engine' ? 'ENGINE' : 'MOCK';
        const dotClass = isLive ? 'bg-emerald-600' : p.mode === 'engine' ? 'bg-indigo-500' : 'bg-amber-500';
        return (
          <div
            key={p.name}
            className="flex items-center gap-1.5 text-slate-700 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200"
            title={`${p.name} latency: ${p.latencyMs}ms | Mode: ${p.mode}`}
          >
            <span className={`w-2 h-2 rounded-full ${dotClass}`} />
            <span className="font-semibold">{p.name}</span>
            <span className="text-[10px] text-slate-500">
              {label}
              {p.latencyMs > 0 ? ` · ${p.latencyMs}ms` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};
