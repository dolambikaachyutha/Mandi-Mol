import React from 'react';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { ImpactStrip } from '../components/landing/ImpactStrip';
import { LandingCta } from '../components/landing/LandingCta';
import { TricksScroller } from '../components/landing/TricksScroller';

interface LandingProps {
  onStartBargaining: () => void;
  onNavigateArchitecture: () => void;
}

export const Landing: React.FC<LandingProps> = ({
  onStartBargaining,
  onNavigateArchitecture,
}) => {
  return (
    <div className="space-y-0">
      <Hero onStart={onStartBargaining} />
      <TricksScroller />
      <HowItWorks onNavigateArchitecture={onNavigateArchitecture} />
      <ImpactStrip />
      <LandingCta onStart={onStartBargaining} />
    </div>
  );
};
