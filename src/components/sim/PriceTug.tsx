import React from 'react';

interface PriceTugProps {
  currentOffer: number;
  openingOffer: number;
  referencePrice: number;
  farmerLastAsk: number | null;
  reservePrice: number;
  isGameOver: boolean;
}

export const PriceTug: React.FC<PriceTugProps> = ({
  currentOffer,
  openingOffer,
  referencePrice,
  farmerLastAsk,
  reservePrice,
  isGameOver,
}) => {
  const targetAsk = farmerLastAsk || Math.round(referencePrice * 1.02);
  const minPrice = Math.min(openingOffer, currentOffer) - 5;
  const maxPrice = Math.max(targetAsk, referencePrice + 5);
  const totalRange = Math.max(10, maxPrice - minPrice);

  const offerPct = Math.min(100, Math.max(0, ((currentOffer - minPrice) / totalRange) * 100));
  const askPct = Math.min(100, Math.max(0, ((targetAsk - minPrice) / totalRange) * 100));

  return (
    <div className="w-full bg-[#FFFDF8] border-2 border-[#1B1B3A] rounded-xl p-3 sm:p-4 shadow-[3px_3px_0px_#1B1B3A]">
      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#1B1B3A] mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D62828]" />
          <span>Trader: ₹{currentOffer}/kg</span>
        </div>

        <div className="text-center font-sans text-slate-500 font-normal">
          Ref: <span className="font-mono font-semibold text-[#1B1B3A]">₹{referencePrice}</span>
          <span className="mx-2">·</span>
          Reserve:{' '}
          <span className="font-mono font-bold text-[#D62828]">
            {isGameOver ? `₹${reservePrice}` : '▒▒▒ (Hidden)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-right">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
          <span>Farmer Ask: ₹{targetAsk}/kg</span>
        </div>
      </div>

      {/* Jute Rope Tug Bar */}
      <div className="relative h-6 bg-[#EBD8BE] rounded-full border-2 border-[#1B1B3A] overflow-hidden flex items-center px-1">
        {/* Rope weave pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #8B5E34, #8B5E34 6px, #D4A373 6px, #D4A373 12px)',
          }}
        />

        {/* Trader offer marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 z-10"
          style={{ left: `calc(${offerPct}% - 14px)` }}
        >
          <div className="w-7 h-7 rounded-full bg-[#D62828] border-2 border-[#1B1B3A] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
            ₹{currentOffer}
          </div>
        </div>

        {/* Farmer Ask marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 z-10"
          style={{ left: `calc(${askPct}% - 14px)` }}
        >
          <div className="w-7 h-7 rounded-full bg-[#2D6A4F] border-2 border-[#1B1B3A] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
            ₹{targetAsk}
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
        <span>Lowball Start (₹{openingOffer})</span>
        <span>Gap: ₹{Math.max(0, targetAsk - currentOffer)}</span>
        <span>Target Anchor (₹{targetAsk})</span>
      </div>
    </div>
  );
};
