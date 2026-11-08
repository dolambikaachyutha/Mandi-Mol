import React from 'react';
import { TraderMood } from '../../types';

interface TraderAvatarProps {
  mood: TraderMood;
  amplitude: number; // 0.0 to 1.0 (from AnalyserNode)
  isThinking?: boolean;
}

export const TraderAvatar: React.FC<TraderAvatarProps> = ({
  mood,
  amplitude,
  isThinking = false,
}) => {
  // Mouth opening height modulated by live audio amplitude
  const mouthOpen = mood === 'talking' ? Math.min(22, 4 + amplitude * 36) : mood === 'deal' ? 14 : 3;
  const eyebrowTilt = mood === 'irritated' ? 14 : mood === 'impressed' ? -10 : 0;
  const handLift = mood === 'talking' ? Math.min(20, amplitude * 40) : mood === 'deal' ? 30 : 0;

  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto flex items-center justify-center select-none">
      {/* Background Mandala / Truck-art halo */}
      <svg
        className="absolute inset-0 w-full h-full -z-10 animate-spin-slow opacity-20 text-[#F2B705]"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="6 6" />
        <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>

      {/* Steam puff if irritated */}
      {mood === 'irritated' && (
        <div className="absolute -top-4 right-6 flex gap-1 animate-bounce">
          <span className="text-xl">💨</span>
          <span className="text-base text-red-500 font-bold">💢</span>
        </div>
      )}

      {/* Thinking abacus beads indicator */}
      {isThinking && (
        <div className="absolute -top-6 bg-amber-400 text-[#1B1B3A] border-2 border-[#1B1B3A] rounded-full px-3 py-0.5 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#1B1B3A] animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#1B1B3A] animate-ping" />
          <span>Lalaji thinking...</span>
        </div>
      )}

      {/* Character SVG: Lalaji */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md overflow-visible transition-transform duration-200"
        style={{
          transform: mood === 'irritated' ? 'scale(1.03)' : 'scale(1)',
        }}
      >
        {/* Shadow */}
        <ellipse cx="100" cy="188" rx="60" ry="10" fill="#1B1B3A" opacity="0.25" />

        {/* Traditional Turban (Pagdi) - Saffron Orange & Red */}
        <g id="turban">
          <path
            d="M 50 70 C 45 35, 155 35, 150 70 C 158 50, 42 50, 50 70 Z"
            fill="#D62828"
          />
          <path
            d="M 45 68 C 60 25, 140 25, 155 68 C 145 42, 55 42, 45 68 Z"
            fill="#F2B705"
          />
          {/* Turban brooch / feather */}
          <circle cx="100" cy="38" r="6" fill="#1B1B3A" />
          <circle cx="100" cy="38" r="4" fill="#2D6A4F" />
        </g>

        {/* Ears */}
        <ellipse cx="48" cy="100" rx="9" ry="13" fill="#E8B084" stroke="#1B1B3A" strokeWidth="2.5" />
        <ellipse cx="152" cy="100" rx="9" ry="13" fill="#E8B084" stroke="#1B1B3A" strokeWidth="2.5" />

        {/* Head / Face */}
        <ellipse
          cx="100"
          cy="104"
          rx="52"
          ry="54"
          fill="#F7C9A4"
          stroke="#1B1B3A"
          strokeWidth="3"
        />

        {/* Forehead Tilak */}
        <path d="M 98 64 L 102 64 L 100 78 Z" fill="#D62828" />
        <circle cx="100" cy="80" r="2.5" fill="#F2B705" />

        {/* Eyebrows */}
        <g stroke="#1B1B3A" strokeWidth="3.5" strokeLinecap="round">
          {/* Left Eyebrow */}
          <line
            x1="70"
            y1={88 - eyebrowTilt * 0.4}
            x2="90"
            y2={86 + eyebrowTilt * 0.4}
          />
          {/* Right Eyebrow */}
          <line
            x1="110"
            y1={86 + eyebrowTilt * 0.4}
            x2="130"
            y2={88 - eyebrowTilt * 0.4}
          />
        </g>

        {/* Eyes */}
        <g>
          {/* Left Eye */}
          <circle cx="80" cy="98" r="6" fill="#1B1B3A" />
          <circle cx="78" cy="96" r="2" fill="#FFFFFF" />
          {/* Right Eye */}
          <circle cx="120" cy="98" r="6" fill="#1B1B3A" />
          <circle cx="118" cy="96" r="2" fill="#FFFFFF" />
        </g>

        {/* Spectacles / Gandhi Glasses */}
        <g fill="none" stroke="#1B1B3A" strokeWidth="2.5">
          <circle cx="80" cy="98" r="14" />
          <circle cx="120" cy="98" r="14" />
          <path d="M 94 98 Q 100 94 106 98" />
        </g>

        {/* Nose */}
        <path
          d="M 98 100 Q 100 114 96 118 Q 100 120 104 118"
          fill="none"
          stroke="#1B1B3A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Signature Mandi Mustache */}
        <path
          d="M 68 126 C 85 116, 98 124, 100 126 C 102 124, 115 116, 132 126 C 120 134, 80 134, 68 126 Z"
          fill="#2C1810"
          stroke="#1B1B3A"
          strokeWidth="2"
        />

        {/* Mouth (synced to audio amplitude) */}
        <rect
          x="90"
          y="134"
          width="20"
          height={mouthOpen}
          rx="6"
          fill="#8B1E1E"
          stroke="#1B1B3A"
          strokeWidth="2"
        />
        {/* Teeth */}
        {mouthOpen > 6 && (
          <rect x="94" y="134" width="12" height="3" fill="#FFFFFF" rx="1" />
        )}

        {/* Kurta & Nehru Jacket */}
        <path
          d="M 45 156 Q 100 162 155 156 L 165 200 L 35 200 Z"
          fill="#FFFBF0"
          stroke="#1B1B3A"
          strokeWidth="3"
        />
        {/* Nehru Jacket (Bandi) */}
        <path
          d="M 60 158 L 78 200 L 50 200 Z"
          fill="#8B5E34"
          stroke="#1B1B3A"
          strokeWidth="2"
        />
        <path
          d="M 140 158 L 122 200 L 150 200 Z"
          fill="#8B5E34"
          stroke="#1B1B3A"
          strokeWidth="2"
        />

        {/* Hand Gesture (synced with amplitude or thumbs up for deal) */}
        {mood === 'deal' ? (
          <g transform="translate(145, 120)">
            <ellipse cx="14" cy="18" rx="14" ry="12" fill="#F7C9A4" stroke="#1B1B3A" strokeWidth="2.5" />
            {/* Thumbs up thumb */}
            <path
              d="M 14 8 C 12 0, 18 -6, 22 -6 C 26 -6, 26 2, 22 8 Z"
              fill="#F7C9A4"
              stroke="#1B1B3A"
              strokeWidth="2.5"
            />
          </g>
        ) : (
          <g
            transform={`translate(150, ${150 - handLift})`}
            className="transition-transform duration-100"
          >
            <ellipse cx="10" cy="10" rx="12" ry="10" fill="#F7C9A4" stroke="#1B1B3A" strokeWidth="2.5" />
            {/* Gesturing fingers */}
            <line x1="20" y1="6" x2="26" y2="4" stroke="#1B1B3A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="20" y1="12" x2="27" y2="12" stroke="#1B1B3A" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
