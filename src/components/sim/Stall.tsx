import React from 'react';
import { useGame } from '../../store/useGame';
import { DealStamp } from './DealStamp';
import { NoiseTestControls } from './NoiseTestControls';
import { PatienceMeter } from './PatienceMeter';
import { PriceTug } from './PriceTug';
import { PushToTalk } from './PushToTalk';
import { SpeechBubble } from './SpeechBubble';
import { TraderAvatar } from './TraderAvatar';
import { Transcript } from './Transcript';
import { TrickBadge } from './TrickBadge';
import { UnderTheHood } from './UnderTheHood';
import { t } from '../../lib/i18n';

interface StallProps {
  onShowScorecard: () => void;
  onExitToSetup: () => void;
}

export const Stall: React.FC<StallProps> = ({ onShowScorecard, onExitToSetup }) => {
  const {
    crop,
    farmerTerms,
    traderTerms,
    uiLanguage,
    round,
    maxRounds,
    patience,
    currentOffer,
    openingOffer,
    reservePrice,
    avatarMood,
    speechBubbleText,
    audioAmplitude,
    fsmState,
    dealStruck,
    traderWalkedAway,
    history,
    tricksUsed,
  } = useGame();

  const lastTurn = history[history.length - 1];
  const activeTrick = lastTurn?.traderTrick;
  const isGameOver = dealStruck || traderWalkedAway;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar: Round Counter, Patience Meter, and Exit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onExitToSetup}
            className="stamp-btn bg-white hover:bg-slate-100 text-[#1B1B3A] text-xs px-3 py-1.5"
          >
            ← {t(uiLanguage, 'backSetup')}
          </button>
          <span className="font-bold text-sm text-[#1B1B3A]">
            {crop.name} · {crop.defaultQuantity} kg
          </span>
        </div>

        <div className="w-full sm:w-auto">
          <PatienceMeter patience={patience} round={round} maxRounds={maxRounds} />
        </div>
      </div>

      {/* Main Two-Column Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stall Visuals, Avatar, Speech & Price Tug (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Night Mandi Card Container */}
          <div className="mandi-card p-5 sm:p-6 bg-[#12122B] text-white border-3 border-[#1B1B3A] shadow-[6px_6px_0px_#1B1B3A] relative overflow-hidden">
            {/* Background Mandi Stall Deco */}
            <div className="absolute top-2 right-3 text-xs font-mono text-slate-500 uppercase tracking-widest">
              {t(uiLanguage, 'stallLabel')}
            </div>

            {/* Trader Avatar */}
            <div className="py-2">
              <TraderAvatar
                mood={avatarMood}
                amplitude={audioAmplitude}
                isThinking={fsmState === 'thinking'}
              />
            </div>

            {/* Speech Bubble */}
            <div className="mt-2 text-slate-900">
              <SpeechBubble text={speechBubbleText} speakerName={t(uiLanguage, 'trader')} />
            </div>

            {(farmerTerms.trim() || traderTerms.trim()) && (
              <section className="mandi-card p-4 bg-white border-2 border-amber-300 space-y-3">
                <h3 className="text-sm font-bold text-[#1B1B3A]">{t(uiLanguage, 'termsOptional')}</h3>
                {farmerTerms.trim() && (
                  <p className="text-xs text-slate-700">
                    <strong>{t(uiLanguage, 'farmerTermsActive')}: </strong>{farmerTerms}
                  </p>
                )}
                {traderTerms.trim() && (
                  <p className="text-xs text-slate-700">
                    <strong>{t(uiLanguage, 'traderTermsActive')}: </strong>{traderTerms}
                  </p>
                )}
              </section>
            )}

            {/* Active Trick Stamp if detected */}
            {activeTrick && (
              <div className="mt-3">
                <TrickBadge trickId={activeTrick} revealed={true} />
              </div>
            )}

            {/* Price Tug of War */}
            <div className="mt-4 text-[#1B1B3A]">
              <PriceTug
                currentOffer={currentOffer}
                openingOffer={openingOffer}
                referencePrice={crop.referencePrice}
                farmerLastAsk={lastTurn ? Math.round(lastTurn.traderOffer * 1.05) : null}
                reservePrice={reservePrice}
                isGameOver={isGameOver}
              />
            </div>
          </div>

          {/* Bottom Push To Talk Controls */}
          {!isGameOver && (
            <div className="mandi-card p-5 bg-[#FFFDF8]">
              <PushToTalk />
            </div>
          )}

          {/* Game Over Actions */}
          {isGameOver && (
            <div className="mandi-card p-5 bg-amber-50 text-center space-y-3">
              <h3 className="font-display text-2xl font-bold text-[#1B1B3A]">
                {dealStruck ? `🎉 ${t(uiLanguage, 'dealComplete')}` : `❌ ${t(uiLanguage, 'traderWalked')}`}
              </h3>
              <p className="text-xs text-slate-600">
                {dealStruck
                  ? t(uiLanguage, 'finalDeal', { price: currentOffer })
                  : 'Patience ran out. Review your scorecard to see where leverage was lost.'}
              </p>
              <button
                onClick={onShowScorecard}
                className="stamp-btn bg-[#2D6A4F] text-white text-base py-3 px-6 hover:bg-emerald-700"
              >
                {t(uiLanguage, 'scorecard')} →
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Transcript, Code-Mix, & Noise Torture Test (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-5">
          <Transcript />
          <NoiseTestControls />
        </div>
      </div>

      {/* Deal Stamp Overlay */}
      {dealStruck && <DealStamp finalPrice={currentOffer} cropName={crop.name} />}

      {/* Under The Hood Judge Panel */}
      <UnderTheHood />
    </div>
  );
};
