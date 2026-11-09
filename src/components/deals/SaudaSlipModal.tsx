import React, { useRef } from 'react';
import { X, Copy, MessageSquare, Printer, Receipt } from 'lucide-react';

interface SaudaSlipProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: {
    receiptNo: string;
    dealId?: string;
    date: string;
    crop: string;
    mandi: string;
    party: string;
    role: string;
    quantityKg: number;
    quantityQuintal: number;
    ratePerKg: number;
    ratePerQuintal: number;
    grossTotalRs: number;
    paymentMode: string;
    diffVsMarketTotalRs?: number;
    disputeProofNotice?: string;
  } | null;
}

export const SaudaSlipModal: React.FC<SaudaSlipProps> = ({ isOpen, onClose, receipt }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
MANDI SAUDA SLIP (सौदे की पर्ची)
Receipt No: ${receipt.receiptNo}
Date: ${receipt.date}
Mandi Yard: ${receipt.mandi}
----------------------------------------
Crop: ${receipt.crop.toUpperCase()}
Quantity: ${receipt.quantityKg} kg (${receipt.quantityQuintal} Quintals)
Agreed Rate: ₹${receipt.ratePerKg}/kg (₹${receipt.ratePerQuintal}/Quintal)
Gross Total: ₹${receipt.grossTotalRs.toLocaleString('en-IN')}
Payment Terms: ${receipt.paymentMode.toUpperCase()}
Counter-Party: ${receipt.party} (${receipt.role})
----------------------------------------
Verified on Mandi Mol (https://mandimol.vercel.app)
Notice: Standard APMC mutual record for transparency.
    `.trim();

    navigator.clipboard.writeText(text);
    alert('Sauda Slip copied to clipboard!');
  };

  const handleShareWhatsApp = () => {
    const text = `*MANDI SAUDA SLIP (सौदे की पर्ची)*%0A*Receipt:* ${receipt.receiptNo}%0A*Date:* ${receipt.date}%0A*Mandi:* ${receipt.mandi}%0A*Crop:* ${receipt.crop}%0A*Weight:* ${receipt.quantityKg} kg (${receipt.quantityQuintal} Qtl)%0A*Rate:* ₹${receipt.ratePerKg}/kg (₹${receipt.ratePerQuintal}/Qtl)%0A*Total:* ₹${receipt.grossTotalRs.toLocaleString('en-IN')}%0A*Payment:* ${receipt.paymentMode}%0A*Party:* ${receipt.party}%0A%0A_Generated via Mandi Mol (https://mandimol.vercel.app)_`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="bg-[#FAF4E6] border-[3px] border-[#1B1B3A] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto print:border-none print:shadow-none print:p-2">
        {/* Close Button (Hidden on Print) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-700 hover:text-[#D62828] focus:outline-none print:hidden p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Slip Container */}
        <div ref={printAreaRef} className="border-2 border-dashed border-[#1B1B3A] p-5 rounded-xl bg-white shadow-inner">
          {/* Header */}
          <div className="text-center border-b-2 border-[#1B1B3A] pb-3 mb-4">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Receipt className="w-6 h-6 text-[#D62828]" />
              <h2 className="text-2xl font-black font-display tracking-tight text-[#1B1B3A]">
                MANDI SAUDA SLIP
              </h2>
            </div>
            <p className="text-xs font-bold text-[#D62828] uppercase tracking-wider">
              APMC Trade Confirmation Slip / सौदे की पर्ची
            </p>
            <p className="text-[11px] text-[#1B1B3A]/70 font-mono mt-0.5">
              Ref: {receipt.receiptNo} • Date: {receipt.date}
            </p>
          </div>

          {/* Details Table */}
          <div className="space-y-2 text-xs text-[#1B1B3A]">
            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="font-bold text-stone-600">APMC Mandi Yard:</span>
              <span className="font-bold font-mono">{receipt.mandi}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="font-bold text-stone-600">Commodity (Crop):</span>
              <span className="font-black text-sm uppercase text-[#1B1B3A]">{receipt.crop}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="font-bold text-stone-600">Weight (Net):</span>
              <span className="font-bold font-mono">
                {receipt.quantityKg} kg ({receipt.quantityQuintal} Quintals)
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="font-bold text-stone-600">Agreed Rate:</span>
              <span className="font-black text-[#1B1B3A] font-mono text-sm">
                ₹{receipt.ratePerKg}/kg <span className="text-stone-500 font-normal">(₹{receipt.ratePerQuintal}/Qtl)</span>
              </span>
            </div>

            <div className="flex justify-between py-2 border-b-2 border-[#1B1B3A] bg-amber-50 px-2 rounded">
              <span className="font-black text-sm text-[#1B1B3A]">Total Gross Payable:</span>
              <span className="font-black font-mono text-base text-[#D62828]">
                ₹{receipt.grossTotalRs.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="font-bold text-stone-600">Payment Terms:</span>
              <span className="font-bold uppercase text-emerald-800">{receipt.paymentMode}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-stone-200">
              <span className="font-bold text-stone-600">Counter-Party:</span>
              <span className="font-bold text-right">{receipt.party}</span>
            </div>

            {receipt.diffVsMarketTotalRs !== undefined && receipt.diffVsMarketTotalRs !== 0 && (
              <div className="flex justify-between py-1 border-b border-stone-200 bg-emerald-50 px-2 rounded">
                <span className="font-bold text-emerald-800">Mandi Benchmark Edge:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {receipt.diffVsMarketTotalRs > 0 ? `+₹${receipt.diffVsMarketTotalRs.toLocaleString('en-IN')} above modal` : `-₹${Math.abs(receipt.diffVsMarketTotalRs).toLocaleString('en-IN')} below modal`}
                </span>
              </div>
            )}
          </div>

          {/* Legal / Transparency Disclaimer */}
          <div className="mt-4 pt-3 border-t border-stone-300 text-[10px] text-stone-500 text-center leading-relaxed">
            <p className="font-semibold text-stone-700 mb-0.5">Dispute Transparency Record</p>
            <p>
              This digital slip records terms mutually agreed upon in the Mandi. It serves as evidence of rate, weight, and settlement method to prevent post-agreement deductions. Information record only; verify against official APMC weighment receipt.
            </p>
          </div>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="grid grid-cols-3 gap-2 mt-5 print:hidden">
          <button
            type="button"
            onClick={handleCopyText}
            className="py-2.5 px-3 rounded-xl border-2 border-[#1B1B3A] bg-white font-bold text-xs text-[#1B1B3A] hover:bg-stone-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Text</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 rounded-xl border-2 border-emerald-700 bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl border-2 border-[#1B1B3A] bg-[#1B1B3A] font-bold text-xs text-[#F2B705] hover:bg-[#2A2A5A] transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};

