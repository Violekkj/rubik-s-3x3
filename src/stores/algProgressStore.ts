import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AlgProgressState } from '../data/algorithms/types';

export type AlgSetId = 'pll' | '2look-pll' | 'oll' | '2look-oll' | 'f2l' | 'beginner';
export type FilterStatus = 'all' | 'unlearned' | 'learning' | 'known' | 'mastered' | 'favorite';

interface AlgProgressStore {
  progress: Record<string, AlgProgressState>;
  activeSet: AlgSetId;
  searchQuery: string;
  filterStatus: FilterStatus;
  selectedGroup: string;
  viewMode: 'cards' | 'flashcards' | 'table';
  flashcardIndex: number;
  isFlashcardRevealed: boolean;

  // Actions
  setActiveSet: (set: AlgSetId) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setSelectedGroup: (group: string) => void;
  setViewMode: (mode: 'cards' | 'flashcards' | 'table') => void;
  setCaseStatus: (caseId: string, status: AlgProgressState['status']) => void;
  setPreferredAlgIndex: (caseId: string, index: number) => void;
  toggleFavorite: (caseId: string) => void;
  addCustomAlg: (caseId: string, alg: string) => void;
  setCaseNotes: (caseId: string, notes: string) => void;
  nextFlashcard: (totalCases: number) => void;
  prevFlashcard: (totalCases: number) => void;
  revealFlashcard: () => void;
  resetFlashcard: () => void;
}

const DEFAULT_STATE: AlgProgressState = {
  status: 'unlearned',
  preferredAlgIndex: 0,
  isFavorite: false,
  notes: '',
  customAlgs: [],
};

export const useAlgProgressStore = create<AlgProgressStore>()(
  persist(
    (set, get) => ({
      progress: {},
      activeSet: 'pll',
      searchQuery: '',
      filterStatus: 'all',
      selectedGroup: 'all',
      viewMode: 'cards',
      flashcardIndex: 0,
      isFlashcardRevealed: false,

      setActiveSet: (activeSet) => set({ activeSet, flashcardIndex: 0, isFlashcardRevealed: false, selectedGroup: 'all' }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setFilterStatus: (filterStatus) => set({ filterStatus }),
      setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
      setViewMode: (viewMode) => set({ viewMode, isFlashcardRevealed: false }),

      setCaseStatus: (caseId, status) => {
        const current = get().progress[caseId] || { ...DEFAULT_STATE };
        set({
          progress: {
            ...get().progress,
            [caseId]: { ...current, status },
          },
        });
      },

      setPreferredAlgIndex: (caseId, index) => {
        const current = get().progress[caseId] || { ...DEFAULT_STATE };
        set({
          progress: {
            ...get().progress,
            [caseId]: { ...current, preferredAlgIndex: index },
          },
        });
      },

      toggleFavorite: (caseId) => {
        const current = get().progress[caseId] || { ...DEFAULT_STATE };
        set({
          progress: {
            ...get().progress,
            [caseId]: { ...current, isFavorite: !current.isFavorite },
          },
        });
      },

      addCustomAlg: (caseId, alg) => {
        const current = get().progress[caseId] || { ...DEFAULT_STATE };
        const updatedCustom = [...(current.customAlgs || []), alg];
        set({
          progress: {
            ...get().progress,
            [caseId]: { ...current, customAlgs: updatedCustom },
          },
        });
      },

      setCaseNotes: (caseId, notes) => {
        const current = get().progress[caseId] || { ...DEFAULT_STATE };
        set({
          progress: {
            ...get().progress,
            [caseId]: { ...current, notes },
          },
        });
      },

      nextFlashcard: (totalCases) => {
        if (totalCases === 0) return;
        set(state => ({
          flashcardIndex: (state.flashcardIndex + 1) % totalCases,
          isFlashcardRevealed: false,
        }));
      },

      prevFlashcard: (totalCases) => {
        if (totalCases === 0) return;
        set(state => ({
          flashcardIndex: (state.flashcardIndex - 1 + totalCases) % totalCases,
          isFlashcardRevealed: false,
        }));
      },

      revealFlashcard: () => set({ isFlashcardRevealed: true }),
      resetFlashcard: () => set({ isFlashcardRevealed: false }),
    }),
    {
      name: 'cubelab-alg-progress',
      partialize: (state) => ({
        progress: state.progress,
        activeSet: state.activeSet,
      }),
    }
  )
);
