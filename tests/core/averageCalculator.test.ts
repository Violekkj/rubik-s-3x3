import { describe, it, expect } from 'vitest';
import { AverageCalculator, SolveLike } from '../../src/core/stats/averageCalculator';

describe('AverageCalculator — Médias Aparadas WCA e PBs', () => {
  it('calcula o valor correto de k de corte conforme convenção WCA', () => {
    expect(AverageCalculator.getTrimCount(5)).toBe(1);
    expect(AverageCalculator.getTrimCount(12)).toBe(1);
    expect(AverageCalculator.getTrimCount(30)).toBe(2);
    expect(AverageCalculator.getTrimCount(50)).toBe(3);
    expect(AverageCalculator.getTrimCount(100)).toBe(5);
  });

  it('calcula Ao5 simples descartando 1 melhor e 1 pior', () => {
    // Tempos: 10.00s, 12.00s, 11.00s, 13.00s, 9.00s
    // Ordenado: 9.00, 10.00, 11.00, 12.00, 13.00
    // Descarta 9.00 e 13.00 -> Média de 10, 11, 12 = 11.00s (11000 ms)
    const solves: SolveLike[] = [
      { timeMs: 10000, penalty: 'none' },
      { timeMs: 12000, penalty: 'none' },
      { timeMs: 11000, penalty: 'none' },
      { timeMs: 13000, penalty: 'none' },
      { timeMs: 9000, penalty: 'none' },
    ];

    const ao5 = AverageCalculator.calculateTrimmedAverage(solves, 5);
    expect(ao5).toBe(11000);
  });

  it('Ao5 com 1 DNF é VÁLIDO (DNF é descartado como o pior tempo)', () => {
    // Tempos: 10.00s, 12.00s, 11.00s, DNF, 9.00s
    // Ordenado: 9.00, 10.00, 11.00, 12.00, DNF
    // Descarta 9.00 e DNF -> Média de 10, 11, 12 = 11.00s
    const solves: SolveLike[] = [
      { timeMs: 10000, penalty: 'none' },
      { timeMs: 12000, penalty: 'none' },
      { timeMs: 11000, penalty: 'none' },
      { timeMs: 15000, penalty: 'dnf' },
      { timeMs: 9000, penalty: 'none' },
    ];

    const ao5 = AverageCalculator.calculateTrimmedAverage(solves, 5);
    expect(ao5).toBe(11000);
  });

  it('Ao5 com 2 DNFs é DNF (Infinity)', () => {
    const solves: SolveLike[] = [
      { timeMs: 10000, penalty: 'none' },
      { timeMs: 12000, penalty: 'dnf' },
      { timeMs: 11000, penalty: 'none' },
      { timeMs: 15000, penalty: 'dnf' },
      { timeMs: 9000, penalty: 'none' },
    ];

    const ao5 = AverageCalculator.calculateTrimmedAverage(solves, 5);
    expect(ao5).toBe(Infinity);
  });

  it('penalidade +2 adiciona 2000ms antes do cálculo da média', () => {
    // Tempos brutos: 10.00s, 10.00s(+2->12.00s), 11.00s, 13.00s, 9.00s
    // Efetivos: 10, 12, 11, 13, 9 -> descartados 9 e 13 -> média(10, 11, 12) = 11.00s
    const solves: SolveLike[] = [
      { timeMs: 10000, penalty: 'none' },
      { timeMs: 10000, penalty: 'plus2' }, // vira 12000
      { timeMs: 11000, penalty: 'none' },
      { timeMs: 13000, penalty: 'none' },
      { timeMs: 9000, penalty: 'none' },
    ];

    const ao5 = AverageCalculator.calculateTrimmedAverage(solves, 5);
    expect(ao5).toBe(11000);
  });

  it('janela incompleta (< N) retorna null', () => {
    const solves: SolveLike[] = [
      { timeMs: 10000, penalty: 'none' },
      { timeMs: 11000, penalty: 'none' },
    ];
    expect(AverageCalculator.calculateCurrentAoN(solves, 5)).toBeNull();
  });

  it('encontra o melhor PB Single e melhor Ao5 em lista com histórico', () => {
    const solves: SolveLike[] = [
      { id: '1', timeMs: 15000, penalty: 'none' },
      { id: '2', timeMs: 14000, penalty: 'none' },
      { id: '3', timeMs: 13000, penalty: 'none' },
      { id: '4', timeMs: 12000, penalty: 'none' },
      { id: '5', timeMs: 8000, penalty: 'none' }, // Single PB
      { id: '6', timeMs: 11000, penalty: 'none' },
      { id: '7', timeMs: 10000, penalty: 'none' },
    ];

    const bestSingle = AverageCalculator.findBestSingle(solves);
    expect(bestSingle?.timeMs).toBe(8000);
    expect(bestSingle?.solve.id).toBe('5');

    const bestAo5 = AverageCalculator.findBestAoN(solves, 5);
    expect(bestAo5).not.toBeNull();
    // Janela 3 a 7: 13, 12, 8, 11, 10 -> descartados 8 e 13 -> média(12, 11, 10) = 11.00s
    expect(bestAo5?.bestAoN).toBe(11000);
    expect(bestAo5?.endIndex).toBe(6);
  });
});
