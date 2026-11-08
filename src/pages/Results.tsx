import React from 'react';
import { PilotCharts } from '../components/results/PilotCharts';
import { PilotForm } from '../components/results/PilotForm';

export const Results: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2D6A4F]">
          Pilot Records
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1B1B3A] mt-1">
          Pilot Trial Results
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Add and review participant results recorded by your team. Entries are stored in this browser
          and are not independently verified.
        </p>
      </div>

      <PilotForm />
      <PilotCharts />
    </div>
  );
};
