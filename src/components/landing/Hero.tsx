import React from 'react';
import { Scale } from 'lucide-react';
import { useGame } from '../../store/useGame';
import { t } from '../../lib/i18n';

interface HeroProps {
  onStart: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const uiLanguage = useGame((state) => state.uiLanguage);

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center px-4 sm:px-6 py-12 overflow-hidden">
      {/* Decorative truck-art borders at top/bottom */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Headlines & Rubber Stamp CTAs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 border-2 border-[#1B1B3A] rounded-full text-xs font-mono font-bold text-[#1B1B3A] shadow-[2px_2px_0px_#1B1B3A]">
            <Scale className="w-3.5 h-3.5 text-[#D62828]" />
            <span>{t(uiLanguage, 'heroBadge')}</span>
          </div>

          {/* Staggered Main Headline */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-6xl font-extrabold text-[#1B1B3A] leading-[1.08] tracking-tight">
            <span>{t(uiLanguage, 'heroFirst')} </span>
            <span className="text-[#D62828] underline decoration-[#F2B705] decoration-wavy decoration-2">
              {t(uiLanguage, 'heroSecond')}
            </span>
          </h1>

          {/* Rotating Subline with crossfade */}
          <div className="h-16 flex items-center">
            <p className="text-base sm:text-lg text-slate-800 leading-snug font-medium transition-opacity duration-300">
              {t(uiLanguage, 'heroDescription')}
            </p>
          </div>

          {/* Gnani AI Technology Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
            <span className="text-slate-500 font-semibold">{t(uiLanguage, 'gnaniStack')}</span>
            <span className="bg-white border border-[#1B1B3A] px-2.5 py-1 rounded-md text-[#1B1B3A] font-bold shadow-xs">
              Prisma STT
            </span>
            <span className="bg-white border border-[#1B1B3A] px-2.5 py-1 rounded-md text-[#1B1B3A] font-bold shadow-xs">
              Timbre TTS
            </span>
          </div>

          {/* Chunky Rubber Stamp CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={onStart}
              className="stamp-btn bg-[#F2B705] hover:bg-amber-400 text-[#1B1B3A] text-lg font-bold py-3.5 px-8 text-center flex items-center justify-center gap-2"
            >
              <span>{t(uiLanguage, 'startBargaining')}</span>
              <span className="text-xl">→</span>
            </button>

          </div>

          <p className="text-xs text-slate-500">{t(uiLanguage, 'practiceDisclaimer')}</p>
        </div>

        {/* Right Column: Animated SVG Mandi Stall Illustration (5 cols) */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-square bg-[#FFFDF8] border-3 border-[#1B1B3A] rounded-2xl p-6 shadow-[8px_8px_0px_#1B1B3A] overflow-hidden group">
            {/* Wooden stall awning */}
            <div className="absolute top-0 inset-x-0 h-10 truck-border border-b-2 border-[#1B1B3A]" />

            <svg viewBox="0 0 300 300" className="w-full h-full pt-8">
              {/* Hanging Red Chillies */}
              <g className="animate-pulse">
                <path d="M 60 50 Q 65 75 70 95" stroke="#2D6A4F" strokeWidth="2" fill="none" />
                <path d="M 70 95 C 65 110, 80 125, 72 135 C 70 120, 60 105, 70 95 Z" fill="#D62828" stroke="#1B1B3A" strokeWidth="1.5" />
                
                <path d="M 90 50 Q 88 70 95 90" stroke="#2D6A4F" strokeWidth="2" fill="none" />
                <path d="M 95 90 C 90 105, 105 120, 97 130 C 95 115, 85 100, 95 90 Z" fill="#D62828" stroke="#1B1B3A" strokeWidth="1.5" />
              </g>

              {/* Jute Sacks with Stencil Markings */}
              <g>
                <path
                  d="M 160 160 C 150 140, 240 140, 230 160 L 245 250 C 240 265, 140 265, 145 250 Z"
                  fill="#8B5E34"
                  stroke="#1B1B3A"
                  strokeWidth="2.5"
                />
                {/* Tied rope mouth */}
                <ellipse cx="195" cy="155" rx="35" ry="8" fill="#D4A373" stroke="#1B1B3A" strokeWidth="2" />
                {/* Stencil */}
                <text x="175" y="210" fill="#FFFDF8" fontSize="13" fontFamily="monospace" fontWeight="bold">
                  TEJA
                </text>
                <text x="175" y="225" fill="#FFFDF8" fontSize="11" fontFamily="monospace">
                  PRACTICE LOT
                </text>
              </g>

              {/* Mandi Balance Scale (Tarazu) */}
              <g transform="translate(45, 110)">
                {/* Stand */}
                <line x1="50" y1="20" x2="50" y2="120" stroke="#1B1B3A" strokeWidth="4" />
                <polygon points="25,120 75,120 50,110" fill="#1B1B3A" />
                {/* Beam */}
                <line x1="10" y1="25" x2="90" y2="25" stroke="#1B1B3A" strokeWidth="3" />
                {/* Left Pan (Chilli Lot) */}
                <line x1="10" y1="25" x2="0" y2="65" stroke="#8B5E34" strokeWidth="1.5" />
                <line x1="10" y1="25" x2="20" y2="65" stroke="#8B5E34" strokeWidth="1.5" />
                <path d="M -5 65 Q 10 75 25 65 Z" fill="#D4A373" stroke="#1B1B3A" strokeWidth="2" />
                <circle cx="10" cy="62" r="5" fill="#D62828" />

                {/* Right Pan (Brass Weights) */}
                <line x1="90" y1="25" x2="80" y2="60" stroke="#8B5E34" strokeWidth="1.5" />
                <line x1="90" y1="25" x2="100" y2="60" stroke="#8B5E34" strokeWidth="1.5" />
                <path d="M 75 60 Q 90 70 105 60 Z" fill="#F2B705" stroke="#1B1B3A" strokeWidth="2" />
                <rect x="85" y="52" width="10" height="8" fill="#1B1B3A" rx="1" />
              </g>

              {/* Wooden Tomato Crate */}
              <g transform="translate(100, 230)">
                <rect x="0" y="0" width="75" height="35" fill="#C29B72" stroke="#1B1B3A" strokeWidth="2" />
                <line x1="0" y1="12" x2="75" y2="12" stroke="#1B1B3A" strokeWidth="1.5" />
                <line x1="0" y1="24" x2="75" y2="24" stroke="#1B1B3A" strokeWidth="1.5" />
                {/* Tomatoes */}
                <circle cx="15" cy="5" r="9" fill="#D62828" stroke="#1B1B3A" strokeWidth="1.5" />
                <circle cx="35" cy="4" r="9" fill="#D62828" stroke="#1B1B3A" strokeWidth="1.5" />
                <circle cx="55" cy="5" r="9" fill="#D62828" stroke="#1B1B3A" strokeWidth="1.5" />
              </g>
            </svg>

            {/* Price Tag Sticker */}
            <div className="absolute bottom-4 right-4 bg-[#F2B705] border-2 border-[#1B1B3A] rounded-lg px-3 py-1 font-mono font-bold text-xs shadow-[2px_2px_0px_#1B1B3A] rotate-[-5deg]">
              Practice price
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
