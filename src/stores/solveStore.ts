import { create } from 'zustand';
import confetti from 'canvas-confetti';
import { db, SolveRecord } from '../data/db';
import { PenaltyType } from '../core/timer/types';
import { AverageCalculator, getEffectiveTime } from '../core/stats/averageCalculator';

interface NewPbAlert {
  type: 'single' | 'ao5' | 'ao12';
  timeMs: number;
}

interface SolveState {
  solves: SolveRecord[]; // Ordenado do mais antigo para o mais recente
  isLoading: boolean;
  lastSolve: SolveRecord | null;
  newPbAlert: NewPbAlert | null;

  // Carregamento e sincronização
  loadSolvesForSession: (sessionId: string) => Promise<void>;

  // Ações da solve
  addSolve: (params: {
    sessionId: string;
    timeMs: number;
    penalty: PenaltyType;
    scramble: string;
    scrambleSource: 'random' | 'manual';
    inspectionMs?: number;
    note?: string;
  }) => Promise<SolveRecord>;

  togglePenalty: (solveId: string, penalty: 'plus2' | 'dnf') => Promise<void>;
  updateSolve: (solveId: string, partial: Partial<SolveRecord>) => Promise<void>;
  deleteSolve: (solveId: string) => Promise<void>;
  undoLastSolve: () => Promise<void>;
  clearPbAlert: () => void;

  // Getters computados
  getCurrentSingle: () => SolveRecord | null;
  getCurrentAo5: () => number | null;
  getCurrentAo12: () => number | null;
  getCurrentAo30: () => number | null;
  getCurrentAo50: () => number | null;
  getCurrentAo100: () => number | null;

  getBestSingle: () => { solve: SolveRecord; timeMs: number } | null;
  getBestAo5: () => { bestAoN: number; bestWindow: SolveRecord[]; endIndex: number } | null;
  getBestAo12: () => { bestAoN: number; bestWindow: SolveRecord[]; endIndex: number } | null;
}

export const useSolveStore = create<SolveState>((set, get) => ({
  solves: [],
  isLoading: true,
  lastSolve: null,
  newPbAlert: null,

  loadSolvesForSession: async (sessionId: string) => {
    set({ isLoading: true });
    try {
      const records = await db.solves
        .where('sessionId')
        .equals(sessionId)
        .sortBy('createdAt'); // Do mais antigo ao mais recente

      set({
        solves: records,
        lastSolve: records.length > 0 ? records[records.length - 1] : null,
        isLoading: false,
      });
    } catch (e) {
      console.warn('Erro ao carregar solves do Dexie:', e);
      set({ isLoading: false });
    }
  },

  addSolve: async params => {
    const effectiveTimeMs = getEffectiveTime(params.timeMs, params.penalty);
    const newSolve: SolveRecord = {
      id: `solve-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      sessionId: params.sessionId,
      createdAt: Date.now(),
      timeMs: params.timeMs,
      effectiveTimeMs,
      penalty: params.penalty,
      scramble: params.scramble,
      scrambleSource: params.scrambleSource,
      inspectionMs: params.inspectionMs,
      note: params.note,
    };

    const previousSolves = get().solves;
    const oldBestSingle = AverageCalculator.findBestSingle(previousSolves)?.timeMs ?? Infinity;
    const oldBestAo5 = AverageCalculator.findBestAoN(previousSolves, 5)?.bestAoN ?? Infinity;
    const oldBestAo12 = AverageCalculator.findBestAoN(previousSolves, 12)?.bestAoN ?? Infinity;

    // Salva no banco de dados Dexie
    await db.solves.add(newSolve);

    const updatedSolves = [...previousSolves, newSolve];

    // Verifica novos PBs
    let pbAlert: NewPbAlert | null = null;
    if (effectiveTimeMs < oldBestSingle && params.penalty !== 'dnf') {
      pbAlert = { type: 'single', timeMs: effectiveTimeMs };
    } else {
      const currentAo5 = AverageCalculator.calculateCurrentAoN(updatedSolves, 5);
      if (currentAo5 !== null && currentAo5 < oldBestAo5 && currentAo5 !== Infinity) {
        pbAlert = { type: 'ao5', timeMs: currentAo5 };
      } else {
        const currentAo12 = AverageCalculator.calculateCurrentAoN(updatedSolves, 12);
        if (currentAo12 !== null && currentAo12 < oldBestAo12 && currentAo12 !== Infinity) {
          pbAlert = { type: 'ao12', timeMs: currentAo12 };
        }
      }
    }

    if (pbAlert) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#00D4FF', '#2BE04B', '#FFE600', '#FF3B3B', '#F4F4F4'],
        });
      } catch {
        // Ambiente sem DOM/canvas
      }
    }

    set({
      solves: updatedSolves,
      lastSolve: newSolve,
      newPbAlert: pbAlert,
    });

    return newSolve;
  },

  togglePenalty: async (solveId: string, penaltyToToggle: 'plus2' | 'dnf') => {
    const { solves } = get();
    const solve = solves.find(s => s.id === solveId);
    if (!solve) return;

    const newPenalty: PenaltyType = solve.penalty === penaltyToToggle ? 'none' : penaltyToToggle;
    const effectiveTimeMs = getEffectiveTime(solve.timeMs, newPenalty);

    await db.solves.update(solveId, { penalty: newPenalty, effectiveTimeMs });

    const updatedSolves = solves.map(s =>
      s.id === solveId ? { ...s, penalty: newPenalty, effectiveTimeMs } : s
    );

    set({
      solves: updatedSolves,
      lastSolve: updatedSolves.length > 0 ? updatedSolves[updatedSolves.length - 1] : null,
    });
  },

  updateSolve: async (solveId: string, partial: Partial<SolveRecord>) => {
    const { solves } = get();
    const solve = solves.find(s => s.id === solveId);
    if (!solve) return;

    const merged = { ...solve, ...partial };
    if (partial.timeMs !== undefined || partial.penalty !== undefined) {
      merged.effectiveTimeMs = getEffectiveTime(merged.timeMs, merged.penalty);
    }

    await db.solves.update(solveId, merged);

    const updatedSolves = solves.map(s => (s.id === solveId ? merged : s));
    set({
      solves: updatedSolves,
      lastSolve: updatedSolves.length > 0 ? updatedSolves[updatedSolves.length - 1] : null,
    });
  },

  deleteSolve: async (solveId: string) => {
    await db.solves.delete(solveId);
    const updated = get().solves.filter(s => s.id !== solveId);
    set({
      solves: updated,
      lastSolve: updated.length > 0 ? updated[updated.length - 1] : null,
    });
  },

  undoLastSolve: async () => {
    const { lastSolve } = get();
    if (lastSolve) {
      await get().deleteSolve(lastSolve.id);
    }
  },

  clearPbAlert: () => {
    set({ newPbAlert: null });
  },

  getCurrentSingle: () => {
    const { solves } = get();
    return solves.length > 0 ? solves[solves.length - 1] : null;
  },

  getCurrentAo5: () => {
    return AverageCalculator.calculateCurrentAoN(get().solves, 5);
  },

  getCurrentAo12: () => {
    return AverageCalculator.calculateCurrentAoN(get().solves, 12);
  },

  getCurrentAo30: () => {
    return AverageCalculator.calculateCurrentAoN(get().solves, 30);
  },

  getCurrentAo50: () => {
    return AverageCalculator.calculateCurrentAoN(get().solves, 50);
  },

  getCurrentAo100: () => {
    return AverageCalculator.calculateCurrentAoN(get().solves, 100);
  },

  getBestSingle: () => {
    return AverageCalculator.findBestSingle(get().solves) as any;
  },

  getBestAo5: () => {
    return AverageCalculator.findBestAoN(get().solves, 5) as any;
  },

  getBestAo12: () => {
    return AverageCalculator.findBestAoN(get().solves, 12) as any;
  },
}));
