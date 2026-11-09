import React from 'react';
import { Globe } from 'lucide-react';
import { analyzeCodeMix, WordLanguage } from '../../lib/codemix';

interface CodeMixTextProps {
  text: string;
  showLegend?: boolean;
}

const LANG_STYLES: Record<WordLanguage, { border: string; bg: string; label: string; color: string }> = {
  hindi: {
    border: 'border-b-2 border-[#D62828]',
    bg: 'bg-red-50 text-red-900',
    label: 'Hindi / Hinglish',
    color: 'text-[#D62828]',
  },
  telugu: {
    border: 'border-b-2 border-[#2D6A4F]',
    bg: 'bg-emerald-50 text-emerald-900',
    label: 'Telugu',
    color: 'text-[#2D6A4F]',
  },
  english: {
    border: 'border-b-2 border-[#1B1B3A]',
    bg: 'bg-slate-100 text-slate-900',
    label: 'English',
    color: 'text-[#1B1B3A]',
  },
  hinglish: {
    border: 'border-b-2 border-amber-500',
    bg: 'bg-amber-50 text-amber-900',
    label: 'Hinglish',
    color: 'text-amber-700',
  },
};

export const CodeMixText: React.FC<CodeMixTextProps> = ({
  text,
  showLegend = true,
}) => {
  const analysis = analyzeCodeMix(text);

  if (!text) return null;

  return (
    <div className="space-y-2">
      {/* Code-mix badge */}
      {analysis.isMixed && (
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-amber-200 text-[#1B1B3A] font-bold px-2 py-0.5 rounded border border-[#1B1B3A] text-[11px] inline-flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span>Code-Mixed Speech Detected</span>
          </span>
          <span className="text-[11px] text-slate-500">
            (Prisma STT script & vocabulary heuristic)
          </span>
        </div>
      )}

      {/* Underlined words */}
      <div className="flex flex-wrap gap-1.5 text-base sm:text-lg leading-relaxed font-medium">
        {analysis.words.map((item, idx) => {
          const style = LANG_STYLES[item.lang] || LANG_STYLES.english;
          return (
            <span
              key={idx}
              className={`inline-block px-1 py-0.5 rounded-sm ${style.border} ${style.bg}`}
              title={`Script: ${item.script} | Identified: ${style.label}`}
            >
              {item.word}
            </span>
          );
        })}
      </div>

      {/* Colour legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-4 pt-1.5 text-xs text-slate-600 border-t border-slate-200">
          <span className="font-semibold text-slate-800">Language Detection:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#D62828]" />
            <span>Hindi / Hinglish</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#2D6A4F]" />
            <span>Telugu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#1B1B3A]" />
            <span>English</span>
          </div>
        </div>
      )}
    </div>
  );
};
