import React from 'react';

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
                className={`text-lg transition-all duration-300 transform ${
                  isActive
                    ? 'opacity-100 scale-105 filter drop-shadow'
                    : 'opacity-20 grayscale scale-90'
                }`}
                title={`Patience ${patience}/5`}
                role="img"
                aria-label={isActive ? 'Active chilli' : 'Dim chilli'}
              >
                🌶️
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
