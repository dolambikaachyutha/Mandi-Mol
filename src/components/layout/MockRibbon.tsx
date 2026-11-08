import React from 'react';
import { useGame } from '../../store/useGame';

export const MockRibbon: React.FC = () => {
  const { providerHealth } = useGame();
  const isAnyMock =
    providerHealth.prisma.mode === 'mock' ||
    providerHealth.timbre.mode === 'mock' ||
    import.meta.env.VITE_MOCK === 'true';

  if (!isAnyMock) return null;

  return (
    <div className="bg-amber-400 text-[#1B1B3A] text-xs font-mono font-bold px-3 py-1 flex items-center justify-between border-b-2 border-[#1B1B3A]">
      <div className="flex items-center gap-2">
        <span className="bg-[#1B1B3A] text-amber-300 px-1.5 py-0.2 rounded text-[10px]">
          NOTICE
        </span>
        <span>
          MOCK MODE ACTIVE: Running local deterministic Gnani stubs. Set GNANI_API_KEY in .env for production.
        </span>
      </div>
      <span className="hidden sm:inline text-[11px] underline">
        Press 'U' for live telemetry & engine clamp logs
      </span>
    </div>
  );
};
