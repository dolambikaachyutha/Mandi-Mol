import React, { useState } from 'react';
import { useSessions } from '../../store/useSessions';
import { CROPS } from '../../lib/crops';
import { CropId, Difficulty, LanguageCode } from '../../types';

export const PilotForm: React.FC = () => {
  const { addSession } = useSessions();
  const [participantLabel, setParticipantLabel] = useState('');
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [cropId, setCropId] = useState<CropId>('chilli');
  const [languageCode, setLanguageCode] = useState<LanguageCode>('hinglish');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState('');
  const [moneyLeft, setMoneyLeft] = useState('');
  const [isFarmer, setIsFarmer] = useState(true);
  const [roundsCount, setRoundsCount] = useState('');
  const [tricksCounteredCount, setTricksCounteredCount] = useState('');
  const [dealStruck, setDealStruck] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ([score, moneyLeft, roundsCount, tricksCounteredCount].some((value) => value === '')) return;
    addSession({
      participantLabel: participantLabel.trim() || 'Anonymous',
      attemptNumber,
      cropId,
      languageCode,
      difficulty,
      score: Number(score),
      moneyLeftOnTable: Number(moneyLeft),
      isFarmer,
      dealStruck,
      roundsCount: Number(roundsCount),
      tricksCounteredCount: Number(tricksCounteredCount),
    });
    setStatusMsg(`Session logged for ${participantLabel} (Attempt ${attemptNumber})`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="mandi-card p-5 bg-[#FFFDF8] border-2 border-[#1B1B3A] space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-amber-200">
        <h4 className="font-bold text-sm text-[#1B1B3A]">
          Log Anonymous Pilot Field Session
        </h4>
        <span className="text-[11px] text-slate-500 font-mono">
          FPO / KVK field intake
        </span>
      </div>

      {statusMsg && (
        <div className="p-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded border border-emerald-300">
          ✓ {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Participant ID</label>
          <input
            type="text"
            value={participantLabel}
            onChange={(e) => setParticipantLabel(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded font-mono"
            placeholder="Anonymous"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Attempt #</label>
          <select
            value={attemptNumber}
            onChange={(e) => setAttemptNumber(Number(e.target.value))}
            className="w-full p-2 border border-slate-300 rounded"
          >
            <option value={1}>Attempt 1 (Baseline)</option>
            <option value={2}>Attempt 2 (Practice)</option>
            <option value={3}>Attempt 3 (Post-Coaching)</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Crop</label>
          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value as CropId)}
            className="w-full p-2 border border-slate-300 rounded"
          >
            <option value="chilli">Chilli (Guntur Teja)</option>
            <option value="tomato">Tomato (Shivam)</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full p-2 border border-slate-300 rounded"
          >
            <option value="easy">Easy Mode</option>
            <option value="hard">Hard Mode</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Score (/100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            required
            className="w-full p-2 border border-slate-300 rounded font-mono"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Money Left (₹)</label>
          <input
            type="number"
            min={0}
            step={100}
            value={moneyLeft}
            onChange={(e) => setMoneyLeft(e.target.value)}
            required
            className="w-full p-2 border border-slate-300 rounded font-mono"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Rounds Taken</label>
          <input
            type="number"
            min={1}
            max={8}
            value={roundsCount}
            onChange={(e) => setRoundsCount(e.target.value)}
            required
            className="w-full p-2 border border-slate-300 rounded font-mono"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Tricks Countered</label>
          <input
            type="number"
            min={0}
            max={5}
            value={tricksCounteredCount}
            onChange={(e) => setTricksCounteredCount(e.target.value)}
            required
            className="w-full p-2 border border-slate-300 rounded font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isFarmer}
              onChange={(e) => setIsFarmer(e.target.checked)}
              className="rounded text-[#2D6A4F]"
            />
            <span>Participant is a practicing farmer / grower</span>
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={dealStruck}
              onChange={(e) => setDealStruck(e.target.checked)}
              className="rounded text-[#2D6A4F]"
            />
            <span>A deal was reached</span>
          </label>
        </div>

        <button
          type="submit"
          className="stamp-btn bg-[#F2B705] hover:bg-amber-400 text-[#1B1B3A] text-xs px-4 py-2"
        >
          Add Pilot Record
        </button>
      </div>
    </form>
  );
};
