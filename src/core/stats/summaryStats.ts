import { SolveRecord } from '../../data/db';
import { getEffectiveTime } from './averageCalculator';

export interface SummaryStatsResult {
  totalSolves: number;
  validSolves: number;
  plus2Solves: number;
  dnfSolves: number;
  totalTimeRawMs: number; // Soma de todos os tempos brutos (inclusive DNFs)
  totalTimeFormatted: string; // "Xh YYmin ZZs"
  solvesToday: number;
  solvesThisWeek: number;
  solvesThisMonth: number;
  streakDays: number;
  avgPerActiveDay: number;
  meanMs: number | null; // Média aritmética das solves válidas
  medianMs: number | null;
  stdDevMs: number | null;
  bestTimeMs: number | null;
  worstTimeMs: number | null;
  histogram: { range: string; count: number; min: number; max: number }[];
  activityCalendar: { date: string; count: number; level: number }[]; // YYYY-MM-DD
}

export class SummaryStatsCalculator {
  public static calculate(solves: SolveRecord[], timeFilterDays?: number): SummaryStatsResult {
    let filtered = solves;

    if (timeFilterDays && timeFilterDays > 0) {
      const cutoff = Date.now() - timeFilterDays * 86400000;
      filtered = solves.filter(s => s.createdAt >= cutoff);
    }

    const totalSolves = filtered.length;
    let validSolves = 0;
    let plus2Solves = 0;
    let dnfSolves = 0;
    let totalTimeRawMs = 0;

    const validEffectiveTimes: number[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - ((now.getDay() + 6) % 7) * 86400000; // Começando na segunda
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let solvesToday = 0;
    let solvesThisWeek = 0;
    let solvesThisMonth = 0;

    const solvesByDay = new Map<string, number>();

    for (const s of filtered) {
      totalTimeRawMs += s.timeMs;

      if (s.penalty === 'dnf') {
        dnfSolves++;
      } else {
        if (s.penalty === 'plus2') {
          plus2Solves++;
        }
        validSolves++;
        validEffectiveTimes.push(getEffectiveTime(s.timeMs, s.penalty));
      }

      if (s.createdAt >= startOfToday) solvesToday++;
      if (s.createdAt >= startOfWeek) solvesThisWeek++;
      if (s.createdAt >= startOfMonth) solvesThisMonth++;

      // Agrupa por dia (YYYY-MM-DD)
      const d = new Date(s.createdAt);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      solvesByDay.set(dayKey, (solvesByDay.get(dayKey) || 0) + 1);
    }

    // Formata tempo total: Xh YYmin ZZs
    const totalSecs = Math.floor(totalTimeRawMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const totalTimeFormatted = `${hours}h ${mins}min ${secs}s`;

    // Média geral, mediana e desvio-padrão das solves válidas
    let meanMs: number | null = null;
    let medianMs: number | null = null;
    let stdDevMs: number | null = null;
    let bestTimeMs: number | null = null;
    let worstTimeMs: number | null = null;

    if (validEffectiveTimes.length > 0) {
      validEffectiveTimes.sort((a, b) => a - b);
      bestTimeMs = validEffectiveTimes[0];
      worstTimeMs = validEffectiveTimes[validEffectiveTimes.length - 1];

      const sum = validEffectiveTimes.reduce((a, b) => a + b, 0);
      meanMs = Math.round(sum / validEffectiveTimes.length);

      const mid = Math.floor(validEffectiveTimes.length / 2);
      medianMs =
        validEffectiveTimes.length % 2 !== 0
          ? validEffectiveTimes[mid]
          : Math.round((validEffectiveTimes[mid - 1] + validEffectiveTimes[mid]) / 2);

      const variance =
        validEffectiveTimes.reduce((acc, t) => acc + Math.pow(t - meanMs!, 2), 0) /
        validEffectiveTimes.length;
      stdDevMs = Math.round(Math.sqrt(variance));
    }

    // Sequência de dias consecutivos (streak)
    let streakDays = 0;
    let checkDate = new Date();
    // Verifica se hoje tem solve; se não tiver, verifica ontem (para não quebrar streak se ainda não treinou hoje)
    const todayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(checkDate.getDate()).padStart(2, '0')}`;

    if (!solvesByDay.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (solvesByDay.has(key)) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const activeDaysCount = solvesByDay.size;
    const avgPerActiveDay =
      activeDaysCount > 0 ? Math.round((totalSolves / activeDaysCount) * 10) / 10 : 0;

    // Histograma de tempos em faixas
    const histogram = SummaryStatsCalculator.buildHistogram(validEffectiveTimes);

    // Heatmap dos últimos 90 dias
    const activityCalendar = SummaryStatsCalculator.buildCalendar(solvesByDay);

    return {
      totalSolves,
      validSolves,
      plus2Solves,
      dnfSolves,
      totalTimeRawMs,
      totalTimeFormatted,
      solvesToday,
      solvesThisWeek,
      solvesThisMonth,
      streakDays,
      avgPerActiveDay,
      meanMs,
      medianMs,
      stdDevMs,
      bestTimeMs,
      worstTimeMs,
      histogram,
      activityCalendar,
    };
  }

  private static buildHistogram(
    sortedTimes: number[]
  ): { range: string; count: number; min: number; max: number }[] {
    if (sortedTimes.length === 0) return [];

    const minSec = Math.floor(sortedTimes[0] / 1000);
    const maxSec = Math.ceil(sortedTimes[sortedTimes.length - 1] / 1000);
    const span = Math.max(1, maxSec - minSec);

    // Determina o tamanho da faixa do histograma (1s, 2s, ou 5s)
    let binSizeSec = 1;
    if (span > 30) binSizeSec = 2;
    if (span > 60) binSizeSec = 5;

    const bins: { range: string; count: number; min: number; max: number }[] = [];
    for (let s = minSec; s < maxSec; s += binSizeSec) {
      const minMs = s * 1000;
      const maxMs = (s + binSizeSec) * 1000;
      const count = sortedTimes.filter(t => t >= minMs && t < maxMs).length;
      bins.push({
        range: `${s}-${s + binSizeSec}s`,
        count,
        min: minMs,
        max: maxMs,
      });
    }

    return bins;
  }

  private static buildCalendar(
    solvesByDay: Map<string, number>
  ): { date: string; count: number; level: number }[] {
    const calendar: { date: string; count: number; level: number }[] = [];
    const today = new Date();

    // Gera últimos 84 dias (12 semanas)
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      const count = solvesByDay.get(key) || 0;
      let level = 0;
      if (count >= 1 && count <= 5) level = 1;
      else if (count >= 6 && count <= 15) level = 2;
      else if (count >= 16 && count <= 30) level = 3;
      else if (count > 30) level = 4;

      calendar.push({ date: key, count, level });
    }

    return calendar;
  }
}
