import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface DealStampProps {
  finalPrice: number;
  cropName: string;
}

export const DealStamp: React.FC<DealStampProps> = ({ finalPrice, cropName }) => {
  useEffect(() => {
    // Trigger vibration on devices supporting it
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 150]);
    }

    // Trigger marigold orange / saffron / turmeric petal confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F2B705', '#D62828', '#E76F51', '#2A9D8F', '#E9C46A'],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 pointer-events-none">
      <div className="bg-[#FFFDF8] border-4 border-[#D62828] rounded-2xl p-6 sm:p-8 text-center shadow-[10px_10px_0px_#1B1B3A] rotate-[-4deg] animate-stamp-slam max-w-sm pointer-events-auto">
        <div className="border-4 border-dashed border-[#D62828] p-4 rounded-xl">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#D62828]">
            APMC MANDI OFFICIAL SETTLEMENT
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#D62828] my-2 tracking-wider">
            SAUDA PAKKA!
          </h2>
          <p className="text-sm font-bold text-[#1B1B3A]">
            SOLD AT ₹{finalPrice} / kg
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {cropName} · 500 kg Lot
          </p>
        </div>
      </div>
    </div>
  );
};
