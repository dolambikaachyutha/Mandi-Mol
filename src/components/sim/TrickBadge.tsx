import React, { useState } from 'react';
import { TRICKS } from '../../lib/tricks';
import { TrickId } from '../../types';

interface TrickBadgeProps {
  trickId: TrickId;
  revealed?: boolean;
}

export const TrickBadge: React.FC<TrickBadgeProps> = ({
  trickId,
  revealed = true,
}) => {
  const [showTip, setShowTip] = useState(false);
  const trick = TRICKS[trickId];
  if (!trick) return null;

  return (
    <div className="my-2 p-3 bg-red-50 border-2 border-[#D62828] rounded-xl shadow-[3px_3px_0px_#D62828] animate-shake">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{trick.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#D62828]">
                Trader Trick Detected:
              </span>
              <span className="text-xs font-bold text-[#1B1B3A]">{trick.name}</span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5">{trick.description}</p>
          </div>
        </div>

        <button
          onClick={() => setShowTip(!showTip)}
          className="stamp-btn bg-white hover:bg-amber-100 text-[#1B1B3A] text-xs px-2.5 py-1 shrink-0"
        >
          {showTip ? 'Hide Counter' : 'How to Counter?'}
        </button>
      </div>

      {(showTip || revealed) && (
        <div className="mt-2.5 pt-2.5 border-t border-red-200 text-xs bg-white p-2 rounded border border-red-100">
          <span className="font-bold text-[#2D6A4F]">💡 Counter it by: </span>
          <span className="text-slate-800">{trick.counterTip}</span>
        </div>
      )}
    </div>
  );
};
