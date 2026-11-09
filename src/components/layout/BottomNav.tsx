import React from 'react';
import { TrendingUp, Compass, Mic, FileText } from 'lucide-react';
import { useGame } from '../../store/useGame';
import { t } from '../../lib/i18n';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onNavigate }) => {
  const { uiLanguage } = useGame();

  const navItems = [
    {
      id: 'prices',
      icon: TrendingUp,
      label: uiLanguage === 'hi' ? 'आज का भाव' : uiLanguage === 'te' ? 'ధరలు' : 'Prices',
      sublabel: 'Agmarknet',
      badge: 'LIVE',
    },
    {
      id: 'planner',
      icon: Compass,
      label: uiLanguage === 'hi' ? 'प्लानर' : uiLanguage === 'te' ? 'ప్లానర్' : 'Plan',
      sublabel: 'Pre-trip',
    },
    {
      id: 'simulator',
      icon: Mic,
      label: uiLanguage === 'hi' ? 'मोल-भाव' : uiLanguage === 'te' ? 'ప్రాక్టీస్' : 'Practice',
      sublabel: 'Simulate',
    },
    {
      id: 'deals',
      icon: FileText,
      label: uiLanguage === 'hi' ? 'सौदा बही' : uiLanguage === 'te' ? 'డీల్స్' : 'My Deals',
      sublabel: 'Proof & Slip',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#F6EBD3]/95 backdrop-blur-md border-t-[3px] border-[#1B1B3A] shadow-2xl safe-area-bottom"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all focus:outline-none ${
                isActive
                  ? 'bg-[#1B1B3A] text-white shadow-md transform -translate-y-0.5'
                  : 'text-[#1B1B3A] hover:bg-[#EAD8B7]/60'
              }`}
            >
              {item.badge && (
                <span
                  className={`absolute -top-1.5 right-1 px-1 py-0.2 text-[9px] font-black rounded uppercase tracking-wider ${
                    isActive ? 'bg-[#D62828] text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              <span className="mb-0.5" aria-hidden="true">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#F2B705]' : 'text-[#1B1B3A]'}`} />
              </span>
              <span className={`text-xs font-bold leading-tight ${isActive ? 'text-[#F2B705]' : 'text-[#1B1B3A]'}`}>
                {item.label}
              </span>
              <span
                className={`text-[9px] font-medium leading-none opacity-80 ${
                  isActive ? 'text-amber-100' : 'text-[#1B1B3A]/70'
                }`}
              >
                {item.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
