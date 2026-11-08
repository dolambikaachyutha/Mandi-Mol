import React from 'react';
import { useGame } from '../../store/useGame';
import { t, UI_LANGUAGES } from '../../lib/i18n';
import { StatusChips } from './StatusChips';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { toggleUnderTheHood, isUnderTheHoodOpen, uiLanguage, setUiLanguage } = useGame();

  return (
    <header className="sticky top-0 z-40 bg-[#F6EBD3]/95 backdrop-blur-md border-b-[2.5px] border-[#1B1B3A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B1B3A] rounded-lg"
        >
          <span className="text-2xl" role="img" aria-label="Mandi Chilli">
            🌶️
          </span>
          <span className="font-display text-2xl font-bold tracking-tight text-[#1B1B3A] group-hover:text-[#D62828] transition-colors whitespace-nowrap shrink-0">
            Mandi Mol
          </span>
        </button>

        {/* Zone 2: Single-line Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#1B1B3A]">
          <button
            onClick={() => onNavigate('simulator')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#D62828] ${
              currentTab === 'simulator' ? 'text-[#D62828] underline underline-offset-4' : ''
            }`}
          >
            {t(uiLanguage, 'simulator')}
          </button>
          <button
            onClick={() => onNavigate('architecture')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#D62828] ${
              currentTab === 'architecture' ? 'text-[#D62828] underline underline-offset-4' : ''
            }`}
          >
            {t(uiLanguage, 'architecture')}
          </button>
          <button
            onClick={() => onNavigate('results')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#D62828] ${
              currentTab === 'results' ? 'text-[#D62828] underline underline-offset-4' : ''
            }`}
          >
            {t(uiLanguage, 'results')}
          </button>
          <button
            onClick={() => onNavigate('trainer')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#D62828] ${
              currentTab === 'trainer' ? 'text-[#D62828] underline underline-offset-4' : ''
            }`}
          >
            {t(uiLanguage, 'trainer')}
          </button>
        </nav>

        {/* Zone 3: Primary Action & Under the Hood toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <label className="sr-only" htmlFor="app-language">{t(uiLanguage, 'appLanguage')}</label>
          <select
            id="app-language"
            value={uiLanguage}
            onChange={(event) => setUiLanguage(event.target.value as typeof uiLanguage)}
            className="max-w-28 rounded-lg border-2 border-[#1B1B3A] bg-white px-2 py-1.5 text-xs font-semibold"
          >
            {UI_LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>{language.nativeName}</option>
            ))}
          </select>

          <div className="hidden lg:block">
            <StatusChips />
          </div>

          <button
            onClick={toggleUnderTheHood}
            className={`stamp-btn text-xs px-3 py-1.5 flex items-center gap-1.5 ${
              isUnderTheHoodOpen
                ? 'bg-[#1B1B3A] text-amber-300'
                : 'bg-white text-[#1B1B3A] hover:bg-amber-100'
            }`}
            title="Toggle Evaluator Telemetry Panel (Hot-key: U)"
          >
            <span>{t(uiLanguage, 'underHood')}</span>
            <kbd className="hidden sm:inline px-1 py-0.2 text-[10px] bg-slate-200 text-slate-800 rounded font-mono">
              U
            </kbd>
          </button>

          {currentTab !== 'simulator' && (
            <button
              onClick={() => onNavigate('simulator')}
              className="stamp-btn bg-[#F2B705] hover:bg-amber-400 text-[#1B1B3A] text-sm px-4 py-1.5 whitespace-nowrap"
            >
              {t(uiLanguage, 'startBargaining')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
