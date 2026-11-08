import React from 'react';
import { useSessions } from '../../store/useSessions';

export const PilotCharts: React.FC = () => {
  const { sessions, clearSessions, exportJson, importJson } = useSessions();
  const n = sessions.length;

  const attempt1 = sessions.filter((s) => s.attemptNumber === 1);
  const attempt3 = sessions.filter((s) => s.attemptNumber >= 3);

  const avgScore1 = attempt1.length
    ? Math.round(attempt1.reduce((acc, s) => acc + s.score, 0) / attempt1.length)
    : 0;
  const avgScore3 = attempt3.length
    ? Math.round(attempt3.reduce((acc, s) => acc + s.score, 0) / attempt3.length)
    : 0;

  const avgMoney1 = attempt1.length
    ? Math.round(attempt1.reduce((acc, s) => acc + s.moneyLeftOnTable, 0) / attempt1.length)
    : 0;
  const avgMoney3 = attempt3.length
    ? Math.round(attempt3.reduce((acc, s) => acc + s.moneyLeftOnTable, 0) / attempt3.length)
    : 0;

  const handleExport = () => {
    const json = exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandi_mol_pilot_sessions_n${n}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        importJson(text);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Sample Size and Data Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border-2 border-[#1B1B3A] rounded-xl shadow-[3px_3px_0px_#1B1B3A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-[#1B1B3A]">
              Pilot Evidence Dashboard
            </span>
            <span className="font-mono text-xs font-bold bg-[#1B1B3A] text-amber-300 px-2 py-0.5 rounded">
              n = {n} {n === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Recorded pilot data stored locally in this browser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="stamp-btn bg-white hover:bg-slate-50 text-[#1B1B3A] text-xs px-3 py-1.5 cursor-pointer">
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            disabled={n === 0}
            className="stamp-btn bg-[#2D6A4F] text-white hover:bg-emerald-700 text-xs px-3 py-1.5 disabled:opacity-40"
          >
            Export JSON
          </button>
          {n > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all stored pilot session data?')) {
                  clearSessions();
                }
              }}
              className="text-xs text-red-600 hover:underline px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Empty State vs Real Data */}
      {n === 0 ? (
        <div className="mandi-card p-12 text-center bg-[#FFFDF8] border-2 border-dashed border-slate-300 space-y-3">
          <span className="text-4xl">📊</span>
          <h3 className="font-display text-xl font-bold text-[#1B1B3A]">
            No pilot records yet.
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Add actual field-trial results with the form above. No sample results are preloaded.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Attempt 1 vs Attempt 3 Score Progression */}
          <div className="mandi-card p-5 bg-[#FFFDF8] border-2 border-[#1B1B3A] space-y-4">
            <h4 className="font-bold text-sm text-[#1B1B3A]">
              Progression: Attempt 1 vs Attempt 3 Score
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Attempt 1 (Baseline, n={attempt1.length}):</span>
                  <span className="font-bold">{avgScore1} / 100</span>
                </div>
                <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-300">
                  <div
                    style={{ width: `${avgScore1}%` }}
                    className="h-full bg-amber-500 flex items-center justify-end pr-2 text-white text-[10px] font-bold"
                  >
                    {avgScore1}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Attempt 3 (Post-Coaching, n={attempt3.length}):</span>
                  <span className="font-bold text-emerald-700">{avgScore3} / 100</span>
                </div>
                <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-300">
                  <div
                    style={{ width: `${avgScore3}%` }}
                    className="h-full bg-emerald-600 flex items-center justify-end pr-2 text-white text-[10px] font-bold"
                  >
                    {avgScore3}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Delta: {avgScore3 >= avgScore1 ? `+${avgScore3 - avgScore1} pts` : `${avgScore3 - avgScore1} pts`} average gain after coaching rounds.
            </p>
          </div>

          {/* Chart 2: Rupee Reduction in Money Left on Table */}
          <div className="mandi-card p-5 bg-[#FFFDF8] border-2 border-[#1B1B3A] space-y-4">
            <h4 className="font-bold text-sm text-[#1B1B3A]">
              Rupee Impact: Money Left on Table (Lower is Better)
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <span className="text-xs text-slate-500 font-bold uppercase">Attempt 1 Avg</span>
                <p className="font-display text-2xl font-black text-[#D62828] mt-1">
                  ₹{avgMoney1.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-500">Lost margin per trip</span>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs text-slate-500 font-bold uppercase">Attempt 3 Avg</span>
                <p className="font-display text-2xl font-black text-[#2D6A4F] mt-1">
                  ₹{avgMoney3.toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-500">Captured in farmer pocket</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Average Rupee Savings: ₹{Math.max(0, avgMoney1 - avgMoney3).toLocaleString('en-IN')} per trip.
            </p>
          </div>

          {/* Table: Individual Participant Rows */}
          <div className="md:col-span-2 mandi-card p-5 bg-white border-2 border-[#1B1B3A] overflow-x-auto">
            <h4 className="font-bold text-sm text-[#1B1B3A] mb-3">
              Participant Session Log (Recorded Pilot Data)
            </h4>
            <table className="w-full text-left font-mono text-xs border border-slate-200">
              <thead className="bg-amber-50 border-b border-slate-200">
                <tr>
                  <th className="p-2">Participant</th>
                  <th className="p-2">Attempt</th>
                  <th className="p-2">Crop</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Money Left</th>
                  <th className="p-2">Rounds</th>
                  <th className="p-2">Tricks Countered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-slate-900">{s.participantLabel}</td>
                    <td className="p-2">#{s.attemptNumber}</td>
                    <td className="p-2 uppercase">{s.cropId}</td>
                    <td className="p-2 font-bold text-[#2D6A4F]">{s.score}/100</td>
                    <td className="p-2 text-[#D62828] font-bold">₹{s.moneyLeftOnTable}</td>
                    <td className="p-2">{s.roundsCount}</td>
                    <td className="p-2">{s.tricksCounteredCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
