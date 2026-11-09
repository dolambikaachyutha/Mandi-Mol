import React, { useState } from 'react';
import { Mic, Check, Volume2 } from 'lucide-react';
import { CoachBetterLine } from '../../types';
import { synthesizeSpeech } from '../../lib/api';
import { audioManager } from '../../lib/audio';

interface SayThisInsteadProps {
  betterLines: CoachBetterLine[];
  languageVoiceCode?: string;
  languageCode?: string;
}

export const SayThisInstead: React.FC<SayThisInsteadProps> = ({
  betterLines,
  languageVoiceCode = 'Avinash',
  languageCode = 'hi-en',
}) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const handlePlayVoice = async (text: string, index: number) => {
    try {
      setPlayingIndex(index);
      const res = await synthesizeSpeech(text, languageVoiceCode, languageCode);
      if (res.audioBase64) {
        audioManager.playAudio(
          `data:${res.mime};base64,${res.audioBase64}`,
          undefined,
          () => setPlayingIndex(null)
        );
      } else {
        setTimeout(() => setPlayingIndex(null), 2000);
      }
    } catch {
      setPlayingIndex(null);
    }
  };

  if (!betterLines || betterLines.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Mic className="w-5 h-5 text-amber-700" />
        <h4 className="font-bold text-base text-[#1B1B3A]">
          Say This Instead (Field Negotiation Coaching)
        </h4>
      </div>

      <div className="space-y-3">
        {betterLines.map((item, idx) => (
          <div
            key={idx}
            className="p-4 bg-amber-50/60 rounded-xl border-2 border-amber-300 space-y-2.5"
          >
            {/* What you said */}
            <div className="text-xs">
              <span className="font-bold text-slate-500 uppercase">You said:</span>
              <p className="text-slate-800 italic mt-0.5 pl-2 border-l-2 border-slate-300">
                "{item.original}"
              </p>
            </div>

            {/* Recommended better line */}
            <div className="text-sm bg-white p-3 rounded-lg border border-emerald-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wide flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Recommended Power Counter:</span>
                </span>
                <button
                  onClick={() => handlePlayVoice(item.better, idx)}
                  className="stamp-btn bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs px-2.5 py-1 flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{playingIndex === idx ? 'Playing...' : 'Listen (Timbre)'}</span>
                </button>
              </div>
              <p className="font-semibold text-[#1B1B3A] leading-snug">
                "{item.better}"
              </p>
            </div>

            {/* Why it works */}
            <p className="text-xs text-slate-600 pl-1">
              <span className="font-bold text-slate-800">Negotiation rationale: </span>
              {item.why}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
