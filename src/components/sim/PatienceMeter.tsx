import React from 'react';
import { Flame } from 'lucide-react';

interface PatienceMeterProps {
  patience: number; // 0 to 5
  round: number;
  maxRounds: number;
}

export const PatienceMeter: React.FC<PatienceMeterProps> = ({
  patience,
  round,
  maxRounds,
}) => {
  return (
    <div className="flex items-center justify-between bg-[#FFFDF8] border-2 border-[#1B1B3A] rounded-xl px-4 py-2 shadow-[2px_2px_0px_#1B1B3A]">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#1B1B3A]">Lalaji's Patience:</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((level) => {
            const isActive = level <= patience;
            return (
              <span
                key={level}
                className="transition-all duration-300 transform"
                title={`Patience ${patience}/5`}
              >
                <Flame
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-[#D62828] fill-[#D62828] scale-110 drop-shadow'
                      : 'text-stone-300 scale-90'
                  }`}
                />
              </span>
            );
          })}
        </div>
        {patience <= 1 && patience > 0 && (
          <span className="text-[11px] font-bold text-[#D62828] animate-pulse">
            Warning: Close to walkaway!
          </span>
        )}
      </div>

      <div className="font-mono text-xs font-bold bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[#1B1B3A]">
        Round {round} / {maxRounds}
      </div>
    </div>
  );
};
