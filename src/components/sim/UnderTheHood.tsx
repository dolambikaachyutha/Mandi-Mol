import React from 'react';
import { useGame } from '../../store/useGame';

export const UnderTheHood: React.FC = () => {
  const { isUnderTheHoodOpen, toggleUnderTheHood, history, reservePrice, dealStruck, traderWalkedAway } = useGame();
  const isGameOver = dealStruck || traderWalkedAway;

  if (!isUnderTheHoodOpen) return null;

  return (
    <aside
      aria-label="Evaluator Architecture & Telemetry Console"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#12122B] text-[#CFE8F0] shadow-2xl border-l-[3px] border-amber-400 flex flex-col font-mono text-xs overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-[#1A1A3A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm">⚡ UNDER THE HOOD</span>
          <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] border border-amber-400/40">
            JUDGE CONSOLE
          </span>
        </div>

        <button
          onClick={toggleUnderTheHood}
          className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs"
        >
          Close (U)
        </button>
      </div>

      {/* Global Invariants Bar */}
      <div className="p-3 bg-[#0D0D1F] border-b border-slate-800 flex items-center justify-between text-[11px]">
        <div>
          <span className="text-slate-400">Reserve Guard: </span>
          <span className="text-amber-300 font-bold">
            {isGameOver ? `₹${reservePrice}/kg (Revealed)` : '▒▒▒ HIDDEN (Engine Lock)'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Total Turns: </span>
          <span className="text-emerald-400 font-bold">{history.length}</span>
        </div>
      </div>

      {/* Turn Telemetry Rows */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-2xl mb-2">🔍</p>
            <p>Awaiting first farmer voice turn...</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Prisma STT, Evon reasoning bounds, and Timbre synthesis metrics will appear here live.
            </p>
          </div>
        ) : (
          history.map((turn) => {
            const tel = turn.telemetry;
            const total = Math.max(1, tel.totalTurnTimeMs);
            const sttPct = (tel.stt.latencyMs / total) * 100;
            const evonPct = (tel.evon.latencyMs / total) * 100;
            const timbrePct = (tel.timbre.latencyMs / total) * 100;

            return (
              <div
                key={turn.round}
                className="p-3 rounded-lg bg-[#1A1A3A] border border-slate-700 space-y-2.5 shadow-inner"
              >
                {/* Round Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
                  <span className="font-bold text-amber-300">
                    ROUND {turn.round} PIPELINE AUDIT
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Turn Latency: <span className="text-white font-bold">{tel.totalTurnTimeMs}ms</span>
                  </span>
                </div>

                {/* Stacked Latency Bar */}
                <div>
                  <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                    <span>Latency Breakdown:</span>
                    <span>STT {tel.stt.latencyMs}ms · Evon {tel.evon.latencyMs}ms · TTS {tel.timbre.latencyMs}ms</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${sttPct}%` }} className="bg-sky-500" title="Prisma STT" />
                    <div style={{ width: `${evonPct}%` }} className="bg-amber-500" title="Evon Reasoning" />
                    <div style={{ width: `${timbrePct}%` }} className="bg-emerald-500" title="Timbre TTS" />
                  </div>
                </div>

                {/* 1. Prisma STT Inspection */}
                <div className="p-2 rounded bg-[#12122B] border border-sky-900/50 space-y-1">
                  <div className="flex justify-between text-sky-400 font-bold text-[11px]">
                    <span>1. PRISMA SPEECH-TO-TEXT</span>
                    <span>{tel.stt.latencyMs}ms</span>
                  </div>
                  <p className="text-slate-300 truncate">
                    Transcript: <span className="text-white">"{tel.stt.transcript}"</span>
                  </p>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Lang: {tel.stt.detectedLanguage}</span>
                    <span>
                      Confidence: {tel.stt.confidence >= 1 ? 'n/a (REST)' : `${(tel.stt.confidence * 100).toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {/* 2. Engine & Evon Bounds Inspection */}
                <div className="p-2 rounded bg-[#12122B] border border-amber-900/50 space-y-1">
                  <div className="flex justify-between text-amber-400 font-bold text-[11px]">
                    <span>
                      2. ENGINE & {tel.evon.provider === 'evon' ? 'EVON' : 'RULE-BASED'} REASONING
                    </span>
                    <span>{tel.evon.latencyMs}ms</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                    <div>Allowed Max: <span className="text-white font-bold">₹{tel.engine.allowedMaxOffer}</span></div>
                    <div>Evon Proposed: <span className="text-amber-300 font-bold">₹{tel.engine.evonProposed}</span></div>
                    <div>Final Clamped: <span className="text-emerald-400 font-bold">₹{tel.engine.finalOffer}</span></div>
                    <div>
                      Provider:{' '}
                      <span className="text-emerald-400">
                        {tel.evon.provider === 'evon' ? 'Evon LLM' : 'Engine rules'}
                      </span>
                    </div>
                  </div>

                  {/* Highlighted Clamping Callout */}
                  {tel.engine.clamped && (
                    <div className="mt-1.5 p-1.5 bg-red-950/80 border border-red-500/60 rounded text-[11px] text-red-300 font-semibold">
                      ⚠️ {tel.engine.clampReason || 'Clamped to engine bounds.'}
                    </div>
                  )}
                </div>

                {/* 3. Timbre TTS Inspection */}
                <div className="p-2 rounded bg-[#12122B] border border-emerald-900/50 space-y-1">
                  <div className="flex justify-between text-emerald-400 font-bold text-[11px]">
                    <span>3. TIMBRE TEXT-TO-SPEECH</span>
                    <span>{tel.timbre.latencyMs}ms</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Synthesized: {tel.timbre.charsSynthesized} chars</span>
                    <span>Cache Hit: {tel.timbre.cacheHit ? 'YES' : 'NO'}</span>
                    <span>Fallback: {tel.timbre.fallbackUsed ? 'Subtitles' : 'Synthetic Audio'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer explanation */}
      <div className="p-3 bg-[#1A1A3A] border-t border-slate-700 text-[10px] text-slate-400 text-center">
        All telemetry instrumentation is measured client/server side in real-time. Code strictly owns all financial offers.
      </div>
    </aside>
  );
};
