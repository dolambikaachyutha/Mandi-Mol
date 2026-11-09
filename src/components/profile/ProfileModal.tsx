import React, { useState } from 'react';
import { User, Sprout, Briefcase, ShieldCheck, Trash2, X, Check } from 'lucide-react';
import { deleteUserData } from '../../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  role: 'farmer' | 'trader';
  defaultMandi: string;
  onRoleChange: (newRole: 'farmer' | 'trader') => void;
  onDataDeleted: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  role,
  defaultMandi,
  onRoleChange,
  onDataDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeleteAllData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete all your data? This will erase all your logged deals, practice history, audio records, and price alerts in accordance with DPDP Act 2023.'
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const res = await deleteUserData(userId);
      setDeleteSuccessMsg(
        `All data purged successfully: ${res.deletedDealsCount} deals, ${res.deletedSessionsCount} practice sessions, and ${res.deletedAlertsCount} alerts erased.`
      );
      setTimeout(() => {
        onDataDeleted();
        onClose();
      }, 2500);
    } catch (err) {
      alert(`Deletion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#F6EBD3] border-[3px] border-[#1B1B3A] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-700 hover:text-[#D62828] focus:outline-none p-1"
          aria-label="Close Profile"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-[#1B1B3A] flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-[#1B1B3A]" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-display text-[#1B1B3A]">Mandi Mol Profile</h2>
            <p className="text-xs text-[#1B1B3A]/70 font-mono">ID: {userId.slice(0, 16)}...</p>
          </div>
        </div>

        {deleteSuccessMsg ? (
          <div className="p-4 bg-emerald-100 border-2 border-emerald-600 rounded-xl text-emerald-900 font-bold text-sm mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{deleteSuccessMsg}</span>
          </div>
        ) : null}

        {/* Role Selector */}
        <div className="mb-6 bg-white/70 p-4 rounded-xl border-2 border-[#1B1B3A]">
          <label className="block text-sm font-bold text-[#1B1B3A] mb-2">My Mandi Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onRoleChange('farmer')}
              className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                role === 'farmer'
                  ? 'bg-[#1B1B3A] text-[#F2B705] border-[#1B1B3A]'
                  : 'bg-white text-[#1B1B3A] border-stone-300 hover:border-[#1B1B3A]'
              }`}
            >
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>Kisan (Farmer)</span>
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('trader')}
              className={`p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                role === 'trader'
                  ? 'bg-[#1B1B3A] text-[#F2B705] border-[#1B1B3A]'
                  : 'bg-white text-[#1B1B3A] border-stone-300 hover:border-[#1B1B3A]'
              }`}
            >
              <Briefcase className="w-4 h-4 text-stone-600" />
              <span>Vyapari (Trader)</span>
            </button>
          </div>
          <p className="text-xs text-[#1B1B3A]/70 mt-2">
            Switching role adjusts bargaining practice simulations: Farmer sells to traders; Trader practices sourcing and quality grading.
          </p>
        </div>

        {/* Default Mandi */}
        <div className="mb-6 bg-white/70 p-4 rounded-xl border-2 border-[#1B1B3A]">
          <label className="block text-sm font-bold text-[#1B1B3A] mb-1">Default APMC Yard</label>
          <p className="font-mono text-sm font-bold text-[#1B1B3A]">{defaultMandi}</p>
          <p className="text-xs text-[#1B1B3A]/70 mt-1">
            Prices and pre-trip transport math default to this wholesale APMC yard.
          </p>
        </div>

        {/* DPDP Compliance & Right to Erasure */}
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border-2 border-amber-600/50">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Digital Personal Data Protection (DPDP) Act 2023</span>
          </div>
          <p className="text-xs text-amber-950/80 leading-relaxed">
            Mandi Mol operates with strict purpose limitation: voice notes are converted to text ephemerally with Gnani Prisma; no biometric voiceprints are retained; deal ledgers are anonymous. You hold full right to data erasure at any time.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDeleteAllData}
            disabled={isDeleting}
            className="w-full py-2.5 px-4 rounded-xl border-2 border-[#D62828] bg-red-50 text-[#D62828] font-bold text-sm hover:bg-[#D62828] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Erasing All Data...' : 'Delete My Data (Right to Erasure)'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1B1B3A] text-white font-bold text-sm hover:bg-[#2A2A5A] transition-colors"
          >
            Save & Return to Mandi
          </button>
        </div>
      </div>
    </div>
  );
};

