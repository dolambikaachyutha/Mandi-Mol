import React, { useState } from 'react';
import { useGame } from '../store/useGame';
import { Scorecard } from '../components/score/Scorecard';
import { SetupPanel } from '../components/sim/SetupPanel';
import { Stall } from '../components/sim/Stall';

interface SimulatorProps {
  onViewPilotData: () => void;
}

export const Simulator: React.FC<SimulatorProps> = ({ onViewPilotData }) => {
  const {
    fsmState,
    initSession,
    resetGame,
    setDifficulty,
  } = useGame();

  const [inStall, setInStall] = useState(false);

  const handleStartSession = () => {
    initSession();
    setInStall(true);
  };

  const handleShowScorecard = () => {
    useGame.setState({ fsmState: 'scoring' });
  };

  const handleTryAgain = () => {
    resetGame();
    setInStall(true);
  };

  const handleHarderTrader = () => {
    setDifficulty('hard');
    resetGame();
    setInStall(true);
  };

  const handleExitToSetup = () => {
    setInStall(false);
    resetGame();
  };

  // If in scoring state, show the Scorecard
  if (fsmState === 'scoring') {
    return (
      <div className="py-8 px-4 sm:px-6">
        <Scorecard
          onTryAgain={handleTryAgain}
          onHarderTrader={handleHarderTrader}
          onViewPilotData={onViewPilotData}
        />
      </div>
    );
  }

  // If not entered stall yet, show SetupPanel
  if (!inStall) {
    return (
      <div className="py-12 px-4 sm:px-6">
        <SetupPanel
          onStart={handleStartSession}
        />
      </div>
    );
  }

  // Otherwise, active Stall
  return (
    <Stall
      onShowScorecard={handleShowScorecard}
      onExitToSetup={handleExitToSetup}
    />
  );
};
