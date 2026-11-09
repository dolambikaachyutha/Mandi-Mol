import React, { useEffect, useState } from 'react';
import { Store } from 'lucide-react';

interface SpeechBubbleProps {
  text: string;
  speakerName?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  speakerName = 'Lalaji (Trader)',
}) => {
  const [displayedText, setDisplayedText] = useState('');

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
      }
    }, 20);

    return () => clearInterval(timer);
  }, [text]);

  return (
    <div className="relative mandi-card p-4 sm:p-5 max-w-xl mx-auto shadow-[4px_4px_0px_#1B1B3A] border-[2.5px] border-[#1B1B3A] bg-[#FFFDF8]">
      {/* Speaker header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200 text-xs font-bold text-[#8B5E34]">
        <div className="flex items-center gap-1.5">
          <Store className="w-4 h-4 text-amber-800" />
          <span>{speakerName}</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500 bg-amber-100 px-2 py-0.5 rounded">
          Subtitles ON
        </span>
      </div>

      {/* Main speech line with typewriter animation */}
      <p className="text-base sm:text-lg font-semibold text-[#1B1B3A] leading-snug min-h-[3rem]">
        "{displayedText}"
        {displayedText.length < text.length && (
          <span className="inline-block w-2 h-4 ml-1 bg-[#D62828] animate-pulse align-middle" />
        )}
      </p>

      {/* Tail pointing towards avatar */}
      <div
        className="absolute -bottom-3 left-12 w-6 h-6 bg-[#FFFDF8] border-r-[2.5px] border-b-[2.5px] border-[#1B1B3A] rotate-45"
        aria-hidden="true"
      />
    </div>
  );
};
