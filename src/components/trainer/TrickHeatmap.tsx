import React from 'react';
import { useSessions } from '../../store/useSessions';

export const TrickHeatmap: React.FC = () => {
  const { sessions } = useSessions();

  const average = (difficulty: 'easy' | 'hard') => {
    const records = sessions.filter((session) => session.difficulty === difficulty);
    if (records.length === 0) return null;
    return Math.round(records.reduce((sum, session) => sum + session.score, 0) / records.length);
  };

  const easyAverage = average('easy');
  const hardAverage = average('hard');

  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-slate-700">
        <span className="font-bold text-[#1B1B3A]">Trainer analytics</span>
        <p className="mt-1 text-slate-600">
          Only locally recorded session results are shown. Per-trick vulnerability is not yet collected, so no estimated rates are displayed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {([
          { title: 'Easy sessions', count: sessions.filter((session) => session.difficulty === 'easy').length, score: easyAverage },
          { title: 'Hard sessions', count: sessions.filter((session) => session.difficulty === 'hard').length, score: hardAverage },
        ]).map((group) => (
          <div key={group.title} className="mandi-card p-5 bg-[#FFFDF8] border-2 border-[#1B1B3A]">
            <h3 className="font-bold text-sm text-[#1B1B3A]">{group.title}</h3>
            <p className="mt-2 text-sm text-slate-600">Recorded sessions: {group.count}</p>
            <p className="mt-1 font-mono text-lg font-bold text-[#2D6A4F]">
              {group.score === null ? 'No score data' : `Average score: ${group.score}/100`}
            </p>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="mandi-card p-10 text-center bg-[#FFFDF8] border-2 border-dashed border-slate-300 text-sm text-slate-600">
          No recorded sessions yet. Complete a practice session or add a real field record to see analytics.
        </div>
      )}
    </div>
  );
};
