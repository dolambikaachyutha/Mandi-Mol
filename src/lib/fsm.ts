import { FsmState } from '../types';

export type FsmEvent =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'TRANSCRIBE_SUCCESS' }
  | { type: 'TRANSCRIBE_FAIL' }
  | { type: 'EVON_THINKING' }
  | { type: 'EVON_SUCCESS' }
  | { type: 'TTS_START' }
  | { type: 'TTS_FINISH' }
  | { type: 'DEAL_STRUCK' }
  | { type: 'WALKAWAY' }
  | { type: 'SHOW_SCORECARD' }
  | { type: 'RESET' };

// Valid state transition map
const VALID_TRANSITIONS: Record<FsmState, Array<FsmState | '*'>> = {
  idle: ['recording', 'thinking', 'scoring', 'deal', 'walkaway'],
  recording: ['transcribing', 'idle'],
  transcribing: ['thinking', 'idle'],
  thinking: ['speaking', 'deal', 'walkaway', 'idle'],
  speaking: ['idle', 'deal', 'walkaway', 'scoring'],
  deal: ['scoring', 'idle'],
  walkaway: ['scoring', 'idle'],
  scoring: ['idle'],
};

export function isValidTransition(from: FsmState, to: FsmState): boolean {
  if (to === 'idle') return true; // Reset is universally allowed
  const allowed = VALID_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export function fsmReducer(state: FsmState, event: FsmEvent): FsmState {
  let nextState = state;

  switch (event.type) {
    case 'START_RECORDING':
      if (state === 'idle') nextState = 'recording';
      break;

    case 'STOP_RECORDING':
      if (state === 'recording') nextState = 'transcribing';
      break;

    case 'TRANSCRIBE_SUCCESS':
      if (state === 'transcribing') nextState = 'thinking';
      break;

    case 'TRANSCRIBE_FAIL':
      if (state === 'transcribing') nextState = 'idle';
      break;

    case 'EVON_THINKING':
      if (state === 'idle' || state === 'transcribing') nextState = 'thinking';
      break;

    case 'EVON_SUCCESS':
      if (state === 'thinking') nextState = 'speaking';
      break;

    case 'TTS_START':
      if (state === 'thinking') nextState = 'speaking';
      break;

    case 'TTS_FINISH':
      if (state === 'speaking') nextState = 'idle';
      break;

    case 'DEAL_STRUCK':
      nextState = 'deal';
      break;

    case 'WALKAWAY':
      nextState = 'walkaway';
      break;

    case 'SHOW_SCORECARD':
      if (state === 'deal' || state === 'walkaway' || state === 'idle' || state === 'speaking') {
        nextState = 'scoring';
      }
      break;

    case 'RESET':
      nextState = 'idle';
      break;

    default:
      break;
  }

  if (nextState !== state && !isValidTransition(state, nextState)) {
    console.warn(`[Mandi FSM] Illegal transition blocked: ${state} -> ${nextState}`);
    return state;
  }

  return nextState;
}
