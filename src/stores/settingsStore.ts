import { create } from 'zustand';
import { db, UserSettingsRecord } from '../data/db';

interface SettingsState {
  settings: UserSettingsRecord;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<UserSettingsRecord>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettingsRecord = {
  id: 'default',
  inspectionEnabled: true,
  inspectionDurationMs: 15000,
  inspectionAudioAlerts: true,
  inspectionVoiceAlerts: true,
  holdingThresholdMs: 300,
  timerPrecision: 'hundredths',
  hideTimerWhileRunning: false,
  cubeStickerColors: {
    U: '#F4F4F4',
    D: '#FFE600',
    F: '#2BE04B',
    B: '#1E63FF',
    R: '#FF3B3B',
    L: '#FF8A1E',
  },
  userName: 'SpeedCuber',
  avatarSeed: 'cubelab',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,

  loadSettings: async () => {
    try {
      const record = await db.settings.get('default');
      if (record) {
        set({ settings: record, isLoading: false });
      } else {
        await db.settings.put(DEFAULT_SETTINGS);
        set({ settings: DEFAULT_SETTINGS, isLoading: false });
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações do Dexie:', e);
      set({ isLoading: false });
    }
  },

  updateSettings: async (partial: Partial<UserSettingsRecord>) => {
    const updated = { ...get().settings, ...partial };
    await db.settings.put(updated);
    set({ settings: updated });
  },

  resetToDefaults: async () => {
    await db.settings.put(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
