import React, { useState } from 'react';
import { FileText, Mic, Check, User, Store } from 'lucide-react';
import { useGame } from '../../store/useGame';
import { CodeMixText } from './CodeMixText';
import { t } from '../../lib/i18n';

export const Transcript: React.FC = () => {
  const { history, submitManualFarmerText, isTextInputActive, fsmState, uiLanguage } = useGame();
  const [typedInput, setTypedInput] = useState('');
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    submitManualFarmerText(typedInput.trim());
    setTypedInput('');
  };

  const handleEditRetrySubmit = (round: number) => {
    if (!editText.trim()) return;
    submitManualFarmerText(editText.trim());
    setEditingRound(null);
  };

  return (
    <div className="mandi-card p-4 sm:p-5 flex flex-col h-full bg-[#FFFDF8]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-amber-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-700" />
          <h3 className="font-bold text-sm sm:text-base text-[#1B1B3A]">
            {t(uiLanguage, 'transcript')}
          </h3>
        </div>
        <span className="font-mono text-xs text-slate-500">
          {history.length} {history.length === 1 ? t(uiLanguage, 'turn') : t(uiLanguage, 'turns')}
        </span>
      </div>

      {/* Manual Keyboard Input bar if active */}
      {isTextInputActive && (
        <form onSubmit={handleManualSubmit} className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-300">
          <label className="block text-xs font-bold text-[#1B1B3A] mb-1">
            {t(uiLanguage, 'textMode')}:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={t(uiLanguage, 'counterPlaceholder')}
              disabled={fsmState !== 'idle'}
              className="flex-1 text-sm px-3 py-2 border-2 border-[#1B1B3A] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
            />
            <button
              type="submit"
              disabled={fsmState !== 'idle' || !typedInput.trim()}
              className="stamp-btn bg-[#2D6A4F] text-white text-xs px-4 py-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              {t(uiLanguage, 'send')}
            </button>
          </div>
        </form>
      )}

      {/* Turn History List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[380px]">
        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <Mic className="w-8 h-8 mx-auto mb-1 text-slate-300" />
            <p>{t(uiLanguage, 'emptyTranscript')}</p>
            <p className="text-xs text-slate-400 mt-1">
              {t(uiLanguage, 'tapSpeak')}
            </p>
          </div>
        ) : (
          history.map((turn) => (
            <div
              key={turn.round}
              className="p-3.5 rounded-xl border border-slate-200 bg-white/90 shadow-sm space-y-2.5"
            >
              {/* Farmer Speech Row */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-[#2D6A4F] font-bold">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{t(uiLanguage, 'round')} {turn.round} · {t(uiLanguage, 'yourTurn')}:</span>
                    {turn.farmerEvidence && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                        <Check className="w-3 h-3" />
                        <span>{t(uiLanguage, 'evidenceAnchored')}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEditingRound(turn.round);
                      setEditText(turn.farmerText);
                    }}
                    className="text-[11px] text-slate-500 hover:text-[#1B1B3A] underline"
                  >
                    {t(uiLanguage, 'editRetry')}
                  </button>
                </div>

                {editingRound === turn.round ? (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 text-xs p-1.5 border border-[#1B1B3A] rounded"
                    />
                    <button
                      onClick={() => handleEditRetrySubmit(turn.round)}
                      className="stamp-btn bg-[#F2B705] text-[#1B1B3A] text-xs px-2 py-1"
                    >
                      {t(uiLanguage, 'resubmit')}
                    </button>
                    <button
                      onClick={() => setEditingRound(null)}
                      className="text-xs text-slate-500 px-2 py-1"
                    >
                      {t(uiLanguage, 'cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="pl-1">
                    <CodeMixText text={turn.farmerText} showLegend={false} />
                  </div>
                )}
              </div>

              {/* Trader Reply Row */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs text-[#8B5E34] font-bold">
                  <span className="flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    <span>{t(uiLanguage, 'trader')}:</span>
                  </span>
                  <span className="font-mono text-[11px] bg-amber-100 text-[#1B1B3A] px-1.5 py-0.2 rounded">
                    {t(uiLanguage, 'offer')}: ₹{turn.traderOffer}/kg
                  </span>
                </div>
                <p className="text-xs text-slate-800 italic pl-1">
                  "{turn.traderLine}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
