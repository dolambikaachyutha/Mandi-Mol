import React from 'react';
import { Volume2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useGame } from '../../store/useGame';
import { MandiNoiseLevel } from '../../lib/noise';
import { telemetry } from '../../lib/telemetry';

export const NoiseTestControls: React.FC = () => {
  const { noiseLevel, setNoiseLevel, noiseLogs, confirmNoiseTestResult } = useGame();

  const handleDownloadCsv = () => {
    const csvContent = telemetry.exportNoiseTestCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mandi_noise_torture_test_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const levels: Array<{ key: MandiNoiseLevel; label: string; snr: string }> = [
    { key: 'off', label: 'Off', snr: '>25dB (Clean)' },
    { key: 'medium', label: 'Medium', snr: '~10dB (Mandi Rush)' },
    { key: 'loud', label: 'Loud', snr: '~0dB (Severe Chaos)' },
  ];

  return (
    <div className="mandi-card p-4 sm:p-5 bg-[#FFFDF8] border-2 border-[#1B1B3A] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200">
        <div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-600" />
            <h4 className="font-bold text-sm text-[#1B1B3A]">
              Mandi Noise Torture Test (Procedural Ambience)
            </h4>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Procedurally injects filtered crowd roar, engine idle, and scale clanks before Prisma STT.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={noiseLogs.length === 0}
          className="stamp-btn bg-white hover:bg-amber-100 text-[#1B1B3A] text-xs px-3 py-1.5 self-start sm:self-auto disabled:opacity-40"
        >
          Export Noise Test CSV
        </button>
      </div>

      {/* Segmented Noise Level Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#1B1B3A] mr-1">Noise Injection:</span>
        <div className="flex gap-1.5 p-1 bg-amber-100 rounded-xl border border-amber-300">
          {levels.map((lvl) => (
            <button
              key={lvl.key}
              onClick={() => setNoiseLevel(lvl.key)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                noiseLevel === lvl.key
                  ? 'bg-[#1B1B3A] text-amber-300 shadow-sm'
                  : 'text-slate-700 hover:text-[#1B1B3A]'
              }`}
            >
              {lvl.label} <span className="text-[10px] opacity-75">({lvl.snr})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Noise Test Session Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-amber-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="p-2">Noise Level</th>
              <th className="p-2">Recognized Transcript</th>
              <th className="p-2">Prisma Latency</th>
              <th className="p-2">Accurate? (Farmer Review)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {noiseLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400 font-sans">
                  No noise tests logged yet. Record a voice turn with Medium or Loud noise enabled!
                </td>
              </tr>
            ) : (
              noiseLogs.slice(-4).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-2 font-bold uppercase text-[#D62828]">
                    {log.noiseLevel} ({log.snrEstimate})
                  </td>
                  <td className="p-2 max-w-xs truncate text-slate-900">
                    "{log.recognizedTranscript}"
                  </td>
                  <td className="p-2 text-slate-700">{log.latencyMs}ms</td>
                  <td className="p-2">
                    {log.farmerConfirmedCorrect === null ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmNoiseTestResult(log.id, true)}
                          className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 flex items-center gap-1"
                          title="Accurate transcription"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Yes</span>
                        </button>
                        <button
                          onClick={() => confirmNoiseTestResult(log.id, false)}
                          className="px-2 py-0.5 rounded bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1"
                          title="Distorted by noise"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>No</span>
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`font-bold ${
                          log.farmerConfirmedCorrect ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {log.farmerConfirmedCorrect ? '✓ Verified Accurate' : '✗ Distorted'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
