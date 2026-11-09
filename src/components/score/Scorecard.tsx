import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, AlertTriangle, Award } from 'lucide-react';
import { useGame } from '../../store/useGame';
import { useSessions } from '../../store/useSessions';
import { RubricBars } from './RubricBars';
import { SayThisInstead } from './SayThisInstead';

interface ScorecardProps {
  onTryAgain: () => void;
  onHarderTrader: () => void;
  onViewPilotData: () => void;
}

export const Scorecard: React.FC<ScorecardProps> = ({
  onTryAgain,
  onHarderTrader,
  onViewPilotData,
}) => {
  const { scorecard, crop, language, difficulty } = useGame();
  const { addSession } = useSessions();

  useEffect(() => {
    if (scorecard?.squeezedTrader) {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });
    }
  }, [scorecard]);

  if (!scorecard) return null;

  const handleSaveToPilot = () => {
    addSession({
      participantLabel: `Farmer_${Math.floor(100 + Math.random() * 900)}`,
      attemptNumber: 1,
      cropId: crop.id,
      languageCode: language.code,
      difficulty,
      score: scorecard.totalScore,
      moneyLeftOnTable: scorecard.moneyLeftOnTable,
      isFarmer: true,
      dealStruck: scorecard.dealStruck,
      roundsCount: scorecard.roundsTaken,
      tricksCounteredCount: scorecard.rubrics.trickCountered > 0 ? 1 : 0,
    });
    onViewPilotData();
  };

  const isSqueezed = scorecard.squeezedTrader;

  return (
    <div className="max-w-2xl mx-auto mandi-card p-6 sm:p-8 bg-[#FFFDF8] border-3 border-[#1B1B3A] shadow-[8px_8px_0px_#1B1B3A] space-y-6">
      {/* Top Ledger Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-amber-200">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#8B5E34]">
            APMC POST-NEGOTIATION AUDIT
          </span>
          <h2 className="font-display text-3xl font-extrabold text-[#1B1B3A] mt-0.5">
            Bargaining Scorecard
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {crop.name} · {scorecard.quantityKg} kg Lot · {scorecard.roundsTaken} Rounds
          </p>
        </div>

        {/* Big /100 Score Stamp */}
        <div className="self-start sm:self-auto flex items-center gap-3">
          <div className="w-20 h-20 rounded-2xl border-3 border-[#1B1B3A] bg-amber-100 flex flex-col items-center justify-center shadow-[3px_3px_0px_#1B1B3A]">
            <span className="font-display text-3xl font-black text-[#1B1B3A] leading-none">
              {scorecard.totalScore}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-600 uppercase mt-0.5">
              out of 100
            </span>
          </div>
        </div>
      </div>

      {/* Squeezed Trader Banner */}
      {isSqueezed && (
        <div className="p-3.5 bg-emerald-100 border-2 border-[#2D6A4F] rounded-xl text-center space-y-0.5 shadow-sm">
          <p className="font-display text-lg font-bold text-[#2D6A4F] flex items-center justify-center gap-1.5">
            <Award className="w-5 h-5" />
            <span>You Squeezed the Trader!</span>
          </p>
          <p className="text-xs text-emerald-900">
            You captured virtually every rupee Lalaji was budgeted to concede!
          </p>
        </div>
      )}

      {/* Money Left on the Table Callout Box */}
      <div className="p-5 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Money Left on the Table:
            </span>
            <h3 className="font-display text-3xl sm:text-4xl font-black text-[#D62828] mt-0.5">
              ₹{scorecard.moneyLeftOnTable.toLocaleString('en-IN')}
            </h3>
          </div>

          <div className="font-mono text-xs text-right space-y-1">
            <div>
              Settled: <span className="font-bold text-[#1B1B3A]">₹{scorecard.finalPrice}/kg</span>
            </div>
            <div>
              Trader Reserve: <span className="font-bold text-[#2D6A4F]">₹{scorecard.reservePrice}/kg</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Difference: ₹{Math.max(0, scorecard.reservePrice - scorecard.finalPrice)}/kg × {scorecard.quantityKg} kg
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Rubric Bars */}
      <div className="pt-2">
        <RubricBars rubrics={scorecard.rubrics} />
      </div>

      {/* Field Coaching Feedback */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
          <h5 className="font-bold text-xs uppercase tracking-wide text-emerald-900 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-700" />
            <span>What Went Well:</span>
          </h5>
          <ul className="text-xs text-slate-700 space-y-1 pl-1 list-disc list-inside">
            {scorecard.coachFeedback.wentWell.map((w, idx) => (
              <li key={idx} className="leading-relaxed">{w}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-1.5">
          <h5 className="font-bold text-xs uppercase tracking-wide text-red-900 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
            <span>Missed Opportunities:</span>
          </h5>
          <ul className="text-xs text-slate-700 space-y-1 pl-1 list-disc list-inside">
            {scorecard.coachFeedback.missed.map((m, idx) => (
              <li key={idx} className="leading-relaxed">{m}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Say This Instead Cards */}
      <div className="pt-2">
        <SayThisInstead
          betterLines={scorecard.coachFeedback.betterLines}
          languageVoiceCode={language.timbreCode}
          languageCode={language.ttsLanguage}
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t-2 border-amber-200 flex flex-wrap gap-3">
        <button
          onClick={onTryAgain}
          className="flex-1 stamp-btn bg-[#F2B705] hover:bg-amber-400 text-[#1B1B3A] text-sm py-2.5 px-4 text-center"
        >
          Try Again
        </button>

        <button
          onClick={onHarderTrader}
          className="stamp-btn bg-white hover:bg-slate-100 text-[#1B1B3A] text-xs py-2.5 px-3 text-center"
        >
          Fight Harder Trader
        </button>

        <button
          onClick={handleSaveToPilot}
          className="stamp-btn bg-[#2D6A4F] text-white hover:bg-emerald-700 text-xs py-2.5 px-3 text-center"
        >
          Save to Pilot Results
        </button>
      </div>
    </div>
  );
};
