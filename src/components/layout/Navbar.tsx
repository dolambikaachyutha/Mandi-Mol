import React from 'react';
import { useGame } from '../../store/useGame';
import { t, UI_LANGUAGES } from '../../lib/i18n';
import { StatusChips } from './StatusChips';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenProfile }) => {
  const { toggleUnderTheHood, isUnderTheHoodOpen, uiLanguage, setUiLanguage } = useGame();

  return (
    <header className="sticky top-0 z-40 bg-[#F6EBD3]/95 backdrop-blur-md border-b-[2.5px] border-[#1B1B3A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('prices')}
          className="flex items-center gap-2 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B1B3A] rounded-lg"
        >
          <span className="text-2xl" role="img" aria-label="Mandi Chilli">
            🌶️
          </span>
          <div className="flex flex-col">
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#1B1B3A] group-hover:text-[#D62828] transition-colors whitespace-nowrap shrink-0 leading-tight">
              Mandi Mol
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-[#D62828] leading-none hidden sm:inline">
              Daily Mandi Companion
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs lg:text-sm font-bold text-[#1B1B3A]">
          <button
            onClick={() => onNavigate('prices')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#D62828] ${
              currentTab === 'prices' ? 'text-[#D62828] underline underline-offset-4' : ''
            }`}
          >
            📊 {uiLanguage === 'hi' ? 'आज का भाव' : 'Live Prices'}
          </button>
          <button
            onClick={() => onNavigate('planner')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#D62828] ${
              currentTab === 'planner' ? 'text-[#D62828] underline underline-offset-4' : ''
            }`}
          >
            🗺️ {uiLanguage === 'hi' ? 'प्लानर' : 'Sell Planner'}
          </button>
          <button
            onClick={() => onNavigate('simulator')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#D62828] ${
              currentTab === 'simulator' ? 'text-[#D62828] underline underline-offset-4' : ''
            }`}
          >
            🎙️ {uiLanguage === 'hi' ? 'मोल-भाव प्रैक्टिस' : 'Bargain Practice'}
          </button>
          <button
            onClick={() => onNavigate('deals')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#D62828] ${
              currentTab === 'deals' ? 'text-[#D62828] underline underline-offset-4' : ''
            }`}
          >
            📜 {uiLanguage === 'hi' ? 'सौदा बही' : 'My Deals & Slip'}
          </button>
          <button
            onClick={() => onNavigate('architecture')}
            className={`transition-colors whitespace-nowrap shrink-0 text-stone-600 hover:text-[#1B1B3A] ${
              currentTab === 'architecture' ? 'text-[#1B1B3A] underline underline-offset-4' : ''
            }`}
          >
            Architecture
          </button>
        </nav>

        {/* Zone 3: Primary Actions, Profile & Under the Hood */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <label className="sr-only" htmlFor="app-language">{t(uiLanguage, 'appLanguage')}</label>
          <select
            id="app-language"
            value={uiLanguage}
            onChange={(event) => setUiLanguage(event.target.value as typeof uiLanguage)}
            className="max-w-24 sm:max-w-28 rounded-lg border-2 border-[#1B1B3A] bg-white px-2 py-1 text-xs font-semibold"
          >
            {UI_LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>{language.nativeName}</option>
            ))}
          </select>

          <div className="hidden xl:block">
            <StatusChips />
          </div>

          {/* Profile & Privacy Button */}
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border-2 border-[#1B1B3A] bg-white text-xs font-bold text-[#1B1B3A] hover:bg-amber-100 flex items-center gap-1"
              title="Profile, Role & DPDP Privacy Settings"
            >
              <span>👤</span>
              <span className="hidden sm:inline">Profile</span>
            </button>
          )}

          <button
            onClick={toggleUnderTheHood}
            className={`stamp-btn text-xs px-2 sm:px-3 py-1 flex items-center gap-1 ${
              isUnderTheHoodOpen
                ? 'bg-[#1B1B3A] text-amber-300'
                : 'bg-white text-[#1B1B3A] hover:bg-amber-100'
            }`}
            title="Toggle Evaluator Telemetry Panel (Hot-key: U)"
          >
            <span>Telemetry</span>
            <kbd className="hidden sm:inline px-1 py-0.2 text-[10px] bg-slate-200 text-slate-800 rounded font-mono">
              U
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
