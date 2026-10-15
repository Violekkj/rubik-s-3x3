import { PenaltyType } from '../timer/types';

export interface SolveLike {
  id?: string;
  timeMs: number;
  penalty: PenaltyType;
  effectiveTimeMs?: number;
  createdAt?: number;
}

export function getEffectiveTime(timeMs: number, penalty: PenaltyType): number {
  if (penalty === 'dnf') return Infinity;
  if (penalty === 'plus2') return timeMs + 2000;
  return timeMs;
}

export class AverageCalculator {
  /**
   * Calcula o k de corte para média aparada WCA: k = ceil(5% * N)
   */
  public static getTrimCount(n: number): number {
    return Math.ceil(0.05 * n);
  }

  /**
   * Calcula a média aparada (AoN) para um array de exatamente N solves
   * Retorna null se solves.length !== n
   * Retorna Infinity se a média for DNF (mais de k DNFs)
   */
  public static calculateTrimmedAverage(solves: SolveLike[], n: number): number | null {
    if (!solves || solves.length !== n) return null;

    const k = AverageCalculator.getTrimCount(n);
    const times = solves.map(s => getEffectiveTime(s.timeMs, s.penalty));

    // Conta quantos DNFs existem na janela
    const dnfCount = times.filter(t => t === Infinity).length;
    if (dnfCount > k) {
      return Infinity; // DNF para a média inteira
    }

    // Ordena os tempos em ordem crescente
    const sorted = [...times].sort((a, b) => a - b);

    // Remove os k melhores (início) e os k piores (fim)
    const trimmed = sorted.slice(k, n - k);

    // Se houver algum DNF no meio do corte (o que não deve acontecer pois dnfCount <= k), vira Infinity
    if (trimmed.some(t => t === Infinity)) {
      return Infinity;
    }

    const sum = trimmed.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / trimmed.length);
  }

  /**
   * Calcula a média corrente das N solves mais recentes de uma lista
   * (assume que solves[0] é a mais recente ou solves[solves.length - 1] é a mais recente)
   */
  public static calculateCurrentAoN(
    solvesOldestToNewest: SolveLike[],
    n: number
  ): number | null {
    if (solvesOldestToNewest.length < n) return null;
    const window = solvesOldestToNewest.slice(solvesOldestToNewest.length - n);
    return AverageCalculator.calculateTrimmedAverage(window, n);
  }

  /**
   * Encontra a melhor média de N (PB AoN) em toda a lista histórica (deslizando janela)
   * Retorna { bestAoN: number, bestWindow: SolveLike[], bestWindowEndIndex: number } | null
   */
  public static findBestAoN(
    solvesOldestToNewest: SolveLike[],
    n: number
  ): { bestAoN: number; bestWindow: SolveLike[]; endIndex: number } | null {
    if (solvesOldestToNewest.length < n) return null;

    let bestAoN = Infinity;
    let bestWindow: SolveLike[] = [];
    let bestEndIndex = -1;

    for (let i = n; i <= solvesOldestToNewest.length; i++) {
      const window = solvesOldestToNewest.slice(i - n, i);
      const avg = AverageCalculator.calculateTrimmedAverage(window, n);

      if (avg !== null && avg < bestAoN) {
        bestAoN = avg;
        bestWindow = window;
        bestEndIndex = i - 1;
      }
    }

    if (bestAoN === Infinity) return null;

    return {
      bestAoN,
      bestWindow,
      endIndex: bestEndIndex,
    };
  }

  /**
   * Encontra o PB Single (menor tempo efetivo válido)
   */
  public static findBestSingle(solves: SolveLike[]): { solve: SolveLike; timeMs: number } | null {
    let bestSolve: SolveLike | null = null;
    let bestTime = Infinity;

    for (const s of solves) {
      const eff = getEffectiveTime(s.timeMs, s.penalty);
      if (eff < bestTime) {
        bestTime = eff;
        bestSolve = s;
      }
    }

    if (!bestSolve || bestTime === Infinity) return null;
    return { solve: bestSolve, timeMs: bestTime };
  }
}
