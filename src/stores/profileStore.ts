import { create } from 'zustand';
import { db, UserProfileRecord, ManualPbEntry, OtherEventEntry, GoalEntry } from '../data/db';

interface ProfileState {
  profile: UserProfileRecord;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isLoading: boolean;

  loadProfile: () => Promise<void>;
  updateProfile: (partial: Partial<UserProfileRecord>) => Promise<void>;
  setAvatarBlob: (blob: Blob | null) => Promise<void>;
  setBannerBlob: (blob: Blob | null) => Promise<void>;
  setManualPb: (metric: string, entry: ManualPbEntry) => Promise<void>;
  deleteManualPb: (metric: string) => Promise<void>;
  addOtherEvent: (entry: Omit<OtherEventEntry, 'id'>) => Promise<void>;
  updateOtherEvent: (id: string, entry: Partial<OtherEventEntry>) => Promise<void>;
  deleteOtherEvent: (id: string) => Promise<void>;
  addGoal: (goal: Omit<GoalEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const DEFAULT_PROFILE: UserProfileRecord = {
  id: 'current',
  nick: 'speedcuber',
  name: 'SpeedCuber',
  bio: 'Treinando rumo ao sub-15 no 3x3! Focado em aprender Full OLL e melhorar o lookahead no F2L.',
  country: 'BR',
  city: 'São Paulo',
  method: 'CFOP',
  mainCube: 'MoYu RS3M V5 Ball-Core',
  cubingSince: '2023-01',
  wcaId: '2023SILV01',
  socialLinks: {
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com',
    tiktok: '',
    discord: 'SpeedCuber#1234',
    website: '',
  },
  accentColor: '#06b6d4',
  bannerGradient: 'from-cyan-600 via-blue-700 to-indigo-900',
  pinnedPbMetrics: ['single', 'ao5', 'ao12', 'ao100'],
  manualPbs: {},
  otherEvents: [
    {
      id: 'event-2x2',
      event: '2x2',
      singleMs: 3450,
      averageMs: 4890,
      date: '2024-02-15',
      note: 'Oficial WCA',
    },
    {
      id: 'event-4x4',
      event: '4x4',
      singleMs: 58200,
      averageMs: 67300,
      date: '2024-03-10',
      note: 'Treino em casa',
    },
  ],
  goals: [
    {
      id: 'goal-sub15-single',
      metric: 'single',
      targetTimeMs: 15000,
      createdAt: Date.now() - 30 * 86400000,
    },
    {
      id: 'goal-sub20-ao12',
      metric: 'ao12',
      targetTimeMs: 20000,
      createdAt: Date.now() - 15 * 86400000,
    },
  ],
};

let activeAvatarUrl: string | null = null;
let activeBannerUrl: string | null = null;

function setSafeAvatarUrl(blob: Blob | null | undefined): string | null {
  if (activeAvatarUrl) {
    URL.revokeObjectURL(activeAvatarUrl);
    activeAvatarUrl = null;
  }
  if (blob) {
    activeAvatarUrl = URL.createObjectURL(blob);
    return activeAvatarUrl;
  }
  return null;
}

function setSafeBannerUrl(blob: Blob | null | undefined): string | null {
  if (activeBannerUrl) {
    URL.revokeObjectURL(activeBannerUrl);
    activeBannerUrl = null;
  }
  if (blob) {
    activeBannerUrl = URL.createObjectURL(blob);
    return activeBannerUrl;
  }
  return null;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: DEFAULT_PROFILE,
  avatarUrl: null,
  bannerUrl: null,
  isLoading: true,

  loadProfile: async () => {
    try {
      const record = await db.profiles.get('current');
      if (record) {
        const merged: UserProfileRecord = {
          ...DEFAULT_PROFILE,
          ...record,
          socialLinks: { ...DEFAULT_PROFILE.socialLinks, ...(record.socialLinks || {}) },
          manualPbs: record.manualPbs || {},
          otherEvents: record.otherEvents || DEFAULT_PROFILE.otherEvents,
          goals: record.goals || DEFAULT_PROFILE.goals,
        };
        const avatarUrl = setSafeAvatarUrl(record.avatarBlob);
        const bannerUrl = setSafeBannerUrl(record.bannerBlob);
        set({ profile: merged, avatarUrl, bannerUrl, isLoading: false });
      } else {
        await db.profiles.put(DEFAULT_PROFILE);
        set({ profile: DEFAULT_PROFILE, avatarUrl: null, bannerUrl: null, isLoading: false });
      }
    } catch (e) {
      console.warn('Erro ao carregar perfil do Dexie:', e);
      set({ isLoading: false });
    }
  },

  updateProfile: async (partial: Partial<UserProfileRecord>) => {
    const updated: UserProfileRecord = { ...get().profile, ...partial };
    await db.profiles.put(updated);
    set({ profile: updated });
  },

  setAvatarBlob: async (blob: Blob | null) => {
    const avatarUrl = setSafeAvatarUrl(blob);
    const updated: UserProfileRecord = { ...get().profile, avatarBlob: blob };
    await db.profiles.put(updated);
    set({ profile: updated, avatarUrl });
  },

  setBannerBlob: async (blob: Blob | null) => {
    const bannerUrl = setSafeBannerUrl(blob);
    const updated: UserProfileRecord = { ...get().profile, bannerBlob: blob };
    await db.profiles.put(updated);
    set({ profile: updated, bannerUrl });
  },

  setManualPb: async (metric: string, entry: ManualPbEntry) => {
    const manualPbs = { ...(get().profile.manualPbs || {}), [metric]: entry };
    await get().updateProfile({ manualPbs });
  },

  deleteManualPb: async (metric: string) => {
    const manualPbs = { ...(get().profile.manualPbs || {}) };
    delete manualPbs[metric];
    await get().updateProfile({ manualPbs });
  },

  addOtherEvent: async (entry: Omit<OtherEventEntry, 'id'>) => {
    const newEntry: OtherEventEntry = {
      ...entry,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    };
    const otherEvents = [...(get().profile.otherEvents || []), newEntry];
    await get().updateProfile({ otherEvents });
  },

  updateOtherEvent: async (id: string, partial: Partial<OtherEventEntry>) => {
    const otherEvents = (get().profile.otherEvents || []).map(ev =>
      ev.id === id ? { ...ev, ...partial } : ev
    );
    await get().updateProfile({ otherEvents });
  },

  deleteOtherEvent: async (id: string) => {
    const otherEvents = (get().profile.otherEvents || []).filter(ev => ev.id !== id);
    await get().updateProfile({ otherEvents });
  },

  addGoal: async (goal: Omit<GoalEntry, 'id' | 'createdAt'>) => {
    const newGoal: GoalEntry = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: Date.now(),
    };
    const goals = [...(get().profile.goals || []), newGoal];
    await get().updateProfile({ goals });
  },

  deleteGoal: async (id: string) => {
    const goals = (get().profile.goals || []).filter(g => g.id !== id);
    await get().updateProfile({ goals });
  },
}));
