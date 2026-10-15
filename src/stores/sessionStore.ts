import { create } from 'zustand';
import { db, SessionRecord } from '../data/db';

interface SessionState {
  activeSessionId: string;
  sessions: SessionRecord[];
  isLoading: boolean;
  loadSessions: () => Promise<void>;
  createSession: (name: string) => Promise<string>;
  renameSession: (id: string, newName: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setActiveSessionId: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSessionId: 'default-session',
  sessions: [],
  isLoading: true,

  loadSessions: async () => {
    try {
      const records = await db.sessions.toArray();
      if (records.length === 0) {
        // Cria sessão padrão inicial
        const defaultSession: SessionRecord = {
          id: 'default-session',
          name: 'Sessão 1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: true,
        };
        await db.sessions.add(defaultSession);
        set({ sessions: [defaultSession], activeSessionId: defaultSession.id, isLoading: false });
      } else {
        set({ sessions: records, activeSessionId: records[0].id, isLoading: false });
      }
    } catch (e) {
      console.warn('Erro ao carregar sessões do Dexie:', e);
      set({ isLoading: false });
    }
  },

  createSession: async (name: string) => {
    const newSession: SessionRecord = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || `Sessão ${get().sessions.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.sessions.add(newSession);
    set(state => ({
      sessions: [...state.sessions, newSession],
      activeSessionId: newSession.id,
    }));
    return newSession.id;
  },

  renameSession: async (id: string, newName: string) => {
    await db.sessions.update(id, { name: newName.trim(), updatedAt: Date.now() });
    set(state => ({
      sessions: state.sessions.map(s => (s.id === id ? { ...s, name: newName.trim(), updatedAt: Date.now() } : s)),
    }));
  },

  deleteSession: async (id: string) => {
    const { sessions, activeSessionId } = get();
    if (sessions.length <= 1) return; // Não permite excluir a única sessão

    await db.sessions.delete(id);
    await db.solves.where('sessionId').equals(id).delete();

    const remaining = sessions.filter(s => s.id !== id);
    const nextActive = activeSessionId === id ? remaining[0].id : activeSessionId;

    set({ sessions: remaining, activeSessionId: nextActive });
  },

  setActiveSessionId: (id: string) => {
    set({ activeSessionId: id });
  },
}));
