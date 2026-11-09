import React, { useEffect, useState } from 'react';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { GrainOverlay } from './components/layout/GrainOverlay';
import { MockRibbon } from './components/layout/MockRibbon';
import { Navbar } from './components/layout/Navbar';
import { ProfileModal } from './components/profile/ProfileModal';
import { CROPS_LIST } from './lib/crops';
import { Architecture } from './pages/Architecture';
import { DealsLedgerPage } from './pages/DealsLedgerPage';
import { Landing } from './pages/Landing';
import { PlannerPage } from './pages/PlannerPage';
import { PricesPage } from './pages/PricesPage';
import { Results } from './pages/Results';
import { Simulator } from './pages/Simulator';
import { TradeBoardPage } from './pages/TradeBoardPage';
import { Trainer } from './pages/Trainer';
import { useGame } from './store/useGame';

export type AppTab =
  | 'prices'
  | 'tradeboard'
  | 'planner'
  | 'simulator'
  | 'deals'
  | 'landing'
  | 'architecture'
  | 'results'
  | 'trainer';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('prices');
  const [userId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('mandi_mol_user_id');
      if (stored) return stored;
      const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      window.localStorage.setItem('mandi_mol_user_id', newId);
      return newId;
    }
    return 'user_local_farmer';
  });

  const [role, setRole] = useState<'farmer' | 'trader'>('farmer');
  const [defaultMandi, setDefaultMandi] = useState('Warangal APMC Yard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Cross-module passing
  const [plannerCropId, setPlannerCropId] = useState<string>('chilli');

  const { toggleUnderTheHood, initSession, refreshHealth, setCrop } = useGame();

  // Listen for 'U' key to toggle Under The Hood evaluator panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Handlers for cross-module flows
  const handleStartPracticeWithCrop = (cropId: string, referencePrice: number) => {
    const targetCrop = CROPS_LIST.find((c) => c.id === cropId) || CROPS_LIST[0];
    const updatedCrop = { ...targetCrop, referencePrice };
    setCrop(updatedCrop);
    initSession();
    setCurrentTab('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPlannerWithCrop = (cropId: string) => {
    setPlannerCropId(cropId);
    setCurrentTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartPracticeWithPlan = (cropId: string, referencePrice: number, floorPrice: number) => {
    const targetCrop = CROPS_LIST.find((c) => c.id === cropId) || CROPS_LIST[0];
    const updatedCrop = { ...targetCrop, referencePrice };
    setCrop(updatedCrop);
    initSession();
    setCurrentTab('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDataDeleted = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
    setCurrentTab('prices');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6EBD3] text-[#1B1B3A] relative selection:bg-[#F2B705] selection:text-[#1B1B3A]">
      {/* SVG Paper Grain Texture */}
      <GrainOverlay />

      {/* Mock Mode Ribbon (visible whenever mock mode is active) */}
      <MockRibbon />

      {/* Top Bar Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab as AppTab)}
        onOpenProfile={() => setIsProfileOpen(true)}
        userRole={role}
        onSwitchRole={(newRole) => setRole(newRole)}
      />

      {/* Main Content View */}
      <main className="flex-1">
        {/* Module 1: Live Mandi Prices (Default Daily Hook) */}
        {currentTab === 'prices' && (
          <PricesPage
            onStartPracticeWithCrop={handleStartPracticeWithCrop}
            onOpenPlannerWithCrop={handleOpenPlannerWithCrop}
          />
        )}

        {/* Real Trade Board: Direct Farmer & Trader Exchange */}
        {currentTab === 'tradeboard' && (
          <TradeBoardPage
            userRole={role}
            onSwitchRole={(newRole) => setRole(newRole)}
          />
        )}

        {/* Module 2: Sell Planner (Pre-trip briefing) */}
        {currentTab === 'planner' && (
          <PlannerPage
            initialCropId={plannerCropId}
            onStartPracticeWithPlan={handleStartPracticeWithPlan}
          />
        )}

        {/* Module 3: Bargain Practice (Keep & Upgrade) */}
        {currentTab === 'simulator' && (
          <Simulator onViewPilotData={() => setCurrentTab('results')} />
        )}

        {/* Module 4: Deal Ledger & Proof of Impact */}
        {currentTab === 'deals' && (
          <DealsLedgerPage userId={userId} />
        )}

        {/* Overview & Pitch */}
        {currentTab === 'landing' && (
          <Landing
            onStartBargaining={() => setCurrentTab('simulator')}
            onNavigateArchitecture={() => setCurrentTab('architecture')}
          />
        )}

        {/* Technical Architecture */}
        {currentTab === 'architecture' && <Architecture />}

        {/* Pilot Results */}
        {currentTab === 'results' && <Results />}

        {/* Trainer & Evaluator View */}
        {currentTab === 'trainer' && <Trainer />}
      </main>

      {/* DPDP Profile & Right-to-Erasure Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={userId}
        role={role}
        defaultMandi={defaultMandi}
        onRoleChange={(newRole) => setRole(newRole)}
        onDataDeleted={handleDataDeleted}
      />

      {/* Bottom Sticky Tab Navigation */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab as AppTab)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
