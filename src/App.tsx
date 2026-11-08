import React, { useEffect, useState } from 'react';
import { Footer } from './components/layout/Footer';
import { GrainOverlay } from './components/layout/GrainOverlay';
import { MockRibbon } from './components/layout/MockRibbon';
import { Navbar } from './components/layout/Navbar';
import { Architecture } from './pages/Architecture';
import { Landing } from './pages/Landing';
import { Results } from './pages/Results';
import { Simulator } from './pages/Simulator';
import { Trainer } from './pages/Trainer';
import { useGame } from './store/useGame';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'simulator' | 'architecture' | 'results' | 'trainer'>('landing');
  const { toggleUnderTheHood, initSession, refreshHealth } = useGame();

  // Listen for 'U' key to toggle Under The Hood evaluator panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        toggleUnderTheHood();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleUnderTheHood]);

  // Initial health check
  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  const handleStartBargaining = () => {
    initSession();
    setCurrentTab('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateArchitecture = () => {
    setCurrentTab('architecture');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6EBD3] text-[#1B1B3A] relative selection:bg-[#F2B705] selection:text-[#1B1B3A]">
      {/* SVG Paper Grain Texture */}
      <GrainOverlay />

      {/* Mock Mode Ribbon (visible whenever mock mode is active) */}
      <MockRibbon />

      {/* Top Bar Navigation */}
      <Navbar currentTab={currentTab} onNavigate={(tab) => setCurrentTab(tab as typeof currentTab)} />

      {/* Main Content View */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <Landing
            onStartBargaining={handleStartBargaining}
            onNavigateArchitecture={handleNavigateArchitecture}
          />
        )}

        {currentTab === 'simulator' && (
          <Simulator onViewPilotData={() => setCurrentTab('results')} />
        )}

        {currentTab === 'architecture' && <Architecture />}

        {currentTab === 'results' && <Results />}

        {currentTab === 'trainer' && <Trainer />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
