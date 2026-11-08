import { create } from 'zustand';
import { PilotSession } from '../types';

interface SessionsStore {
  sessions: PilotSession[];
  addSession: (session: Omit<PilotSession, 'id' | 'timestamp'>) => void;
  importJson: (jsonString: string) => boolean;
  exportJson: () => string;
  clearSessions: () => void;
}

const STORAGE_KEY = 'mandi_mol_pilot_sessions_v1';

function loadStoredSessions(): PilotSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSessions(sessions: PilotSession[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save sessions:', err);
  }
}

export const useSessions = create<SessionsStore>((set, get) => ({
  sessions: loadStoredSessions(),

  addSession: (data) => {
    const newSession: PilotSession = {
      ...data,
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    const updated = [newSession, ...get().sessions];
    saveSessions(updated);
    set({ sessions: updated });
  },

  importJson: (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        saveSessions(parsed);
        set({ sessions: parsed });
        return true;
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
    return false;
  },

  exportJson: () => {
    return JSON.stringify(get().sessions, null, 2);
  },

  clearSessions: () => {
    saveSessions([]);
    set({ sessions: [] });
  },
}));
