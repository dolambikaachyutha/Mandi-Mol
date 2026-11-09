import React from 'react';
import { Square, Clock, Mic, Keyboard, RefreshCw, Sparkles, Volume2 } from 'lucide-react';
import { useGame } from '../../store/useGame';
import { LANGUAGES } from '../../lib/languages';
import { t } from '../../lib/i18n';
import { Waveform } from './Waveform';

export const PushToTalk: React.FC = () => {
  const {
    fsmState,
    language,
    setLanguage,
    startRecording,
    stopRecordingAndProcess,
    setTextInputActive,
    isTextInputActive,
    isStartingRecording,
    voiceError,
    uiLanguage,
  } = useGame();

  const isRecording = fsmState === 'recording' && !isStartingRecording;
  const isTranscribing = fsmState === 'transcribing';
  const isThinking = fsmState === 'thinking';
  const isSpeaking = fsmState === 'speaking';
  const isBusy = isStartingRecording || isTranscribing || isThinking || isSpeaking;

  const handleMicClick = () => {
    if (isBusy) return;
    if (isRecording) {
      void stopRecordingAndProcess();
    } else {
      void startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full max-w-md mx-auto">
      <label className="flex items-center gap-2 text-xs font-bold text-[#1B1B3A]">
        <span>{t(uiLanguage, 'selectLanguage')}</span>
        <select
          value={language.code}
          onChange={(event) => {
            const selectedLanguage = LANGUAGES.find((item) => item.code === event.target.value);
            if (selectedLanguage) setLanguage(selectedLanguage);
          }}
          disabled={isRecording || isBusy}
          className="rounded-lg border-2 border-[#1B1B3A] bg-white px-3 py-2 text-sm disabled:opacity-60"
        >
          {LANGUAGES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name} — {item.nativeName}
            </option>
          ))}
        </select>
      </label>

      {/* Waveform visualizer */}
      <div className="w-full">
        <Waveform isRecording={isRecording} />
      </div>

      <div className="flex items-center gap-4">
        {/* Main Mic Button with Pulsing Ring */}
        <div className="relative">
          {isRecording && (
            <div className="absolute -inset-3 rounded-full bg-red-400 opacity-75 animate-ping pointer-events-none" />
          )}

          <button
            type="button"
            onClick={handleMicClick}
            disabled={isBusy}
            aria-label={isRecording ? 'Stop recording voice' : 'Start speaking'}
            aria-pressed={isRecording}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-3 border-[#1B1B3A] shadow-[4px_4px_0px_#1B1B3A] transition-all transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1B1B3A] select-none ${isRecording
                ? 'bg-[#D62828] text-white scale-105'
                : isBusy
                  ? 'bg-amber-100 text-slate-400 cursor-not-allowed'
                  : 'bg-[#F2B705] hover:bg-amber-400 text-[#1B1B3A]'
              }`}
          >
            <div className="flex items-center justify-center">
              {isRecording ? <Square className="w-6 h-6" /> : isThinking ? <Clock className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
            </div>
            <span className="text-[10px] font-bold uppercase mt-0.5 tracking-tight">
              {isRecording
                ? t(uiLanguage, 'stop')
                : isStartingRecording
                  ? t(uiLanguage, 'wait')
                  : isBusy
                    ? t(uiLanguage, 'busy')
                    : t(uiLanguage, 'speak')}
            </span>
          </button>
        </div>

        {/* Text fallback toggle */}
        <button
          onClick={() => setTextInputActive(!isTextInputActive)}
          className={`stamp-btn p-3 rounded-xl flex items-center justify-center ${isTextInputActive ? 'bg-[#1B1B3A] text-white' : 'bg-white text-[#1B1B3A]'
            }`}
          title="Type your counter-offer manually (keyboard fallback)"
          aria-label="Toggle text input"
        >
          <Keyboard className="w-5 h-5" />
        </button>
      </div>

      {/* State label */}
      <div className="text-center font-mono text-xs font-bold text-[#1B1B3A]">
        {isRecording && (
          <span className="text-[#D62828] animate-pulse flex items-center gap-1.5 justify-center">
            <span className="w-2 h-2 rounded-full bg-[#D62828]" />
            {t(uiLanguage, 'listening', { language: language.name })}
          </span>
        )}
        {isStartingRecording && (
          <span className="text-amber-700">{t(uiLanguage, 'requestMic')}</span>
        )}
        {isTranscribing && (
          <span className="text-amber-700 flex items-center gap-1.5 justify-center">
            <RefreshCw className="animate-spin w-4 h-4" />
            {t(uiLanguage, 'transcribing')}
          </span>
        )}
        {isThinking && (
          <span className="text-indigo-800 flex items-center gap-1.5 justify-center">
            <Sparkles className="animate-bounce w-4 h-4 text-indigo-600" />
            {t(uiLanguage, 'thinking')}
          </span>
        )}
        {isSpeaking && (
          <span className="text-emerald-800 flex items-center gap-1.5 justify-center">
            <Volume2 className="w-4 h-4" />
            {t(uiLanguage, 'speaking')}
          </span>
        )}
        {!isRecording && !isBusy && (
          <span className="text-slate-600">
            {t(uiLanguage, 'tapSpeak')}
          </span>
        )}
      </div>

      {voiceError && (
        <div role="alert" className="w-full text-xs bg-red-100 text-red-800 p-2 rounded border border-red-300 text-center">
          {voiceError}
        </div>
      )}
    </div>
  );
};
