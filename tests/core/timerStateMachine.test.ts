import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerStateMachine } from '../../src/core/timer/timerStateMachine';
import { TimeFormatter } from '../../src/core/timer/timeFormatter';

describe('TimerStateMachine — Máquina de Estados e Regras Oficiais WCA', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Modo Sem Inspeção: idle -> holding -> ready -> running -> stopped', () => {
    let fakeTime = 1000;
    const getTime = () => fakeTime;
    const stateTransitions: string[] = [];
    let stoppedResult: any = null;

    const timer = new TimerStateMachine(
      { inspectionEnabled: false, holdingThresholdMs: 300 },
      {
        onStateChange: s => stateTransitions.push(s),
        onStop: (ms, pen) => {
          stoppedResult = { ms, pen };
        },
      },
      getTime
    );

    expect(timer.getState()).toBe('idle');

    // Usuário pressiona barra de espaço
    timer.handlePrimaryDown();
    expect(timer.getState()).toBe('holding');

    // Passam 200ms (ainda não atingiu 300ms)
    fakeTime += 200;
    vi.advanceTimersByTime(200);
    expect(timer.getState()).toBe('holding');

    // Atinge 300ms
    fakeTime += 100;
    vi.advanceTimersByTime(100);
    expect(timer.getState()).toBe('ready');

    // Solta a barra de espaço para iniciar
    timer.handlePrimaryUp();
    expect(timer.getState()).toBe('running');

    // Solve dura 12.345 ms
    fakeTime += 12345;
    vi.advanceTimersByTime(12345);
    timer.handlePrimaryDown(); // Para o timer

    expect(timer.getState()).toBe('stopped');
    expect(stoppedResult.ms).toBe(12345);
    expect(stoppedResult.pen).toBe('none');
    expect(stateTransitions).toEqual(['holding', 'ready', 'running', 'stopped']);
  });

  it('Cancela início se soltar antes do limiar de segurar (holding threshold)', () => {
    let fakeTime = 1000;
    const getTime = () => fakeTime;
    const timer = new TimerStateMachine(
      { inspectionEnabled: false, holdingThresholdMs: 300 },
      {},
      getTime
    );

    timer.handlePrimaryDown();
    expect(timer.getState()).toBe('holding');

    fakeTime += 150;
    vi.advanceTimersByTime(150); // Só 150ms
    timer.handlePrimaryUp();

    expect(timer.getState()).toBe('idle');
  });

  it('Modo Inspeção WCA: emite avisos aos 8s e 12s', () => {
    let fakeTime = 1000;
    const getTime = () => fakeTime;
    const warnings: number[] = [];
    const timer = new TimerStateMachine(
      { inspectionEnabled: true, holdingThresholdMs: 300 },
      {
        onInspectionWarning: sec => warnings.push(sec),
      },
      getTime
    );

    // 1º ciclo: aperta e solta para iniciar inspeção
    timer.handlePrimaryDown();
    timer.handlePrimaryUp();
    expect(timer.getState()).toBe('inspecting');

    // Avança 7.9s
    fakeTime += 7900;
    vi.advanceTimersByTime(7900);
    expect(warnings).toEqual([]);

    // Avança para 8s
    fakeTime += 200;
    vi.advanceTimersByTime(200);
    expect(warnings).toEqual([8]);

    // Avança para 12s
    fakeTime += 4000;
    vi.advanceTimersByTime(4000);
    expect(warnings).toEqual([8, 12]);
  });

  it('Aplica penalidade +2 ao iniciar entre 15s e 17s de inspeção (Regra WCA A3c1)', () => {
    let fakeTime = 1000;
    const getTime = () => fakeTime;
    let finalPenalty = 'none';
    const timer = new TimerStateMachine(
      { inspectionEnabled: true, holdingThresholdMs: 300 },
      {
        onStop: (_ms, pen) => {
          finalPenalty = pen;
        },
      },
      getTime
    );

    timer.handlePrimaryDown();
    timer.handlePrimaryUp(); // Começa inspeção no fakeTime = 1000

    // Avança 15.5s (fakeTime = 16500)
    fakeTime += 15500;
    vi.advanceTimersByTime(15500);

    // Segura para armar
    timer.handlePrimaryDown();
    fakeTime += 300;
    vi.advanceTimersByTime(300); // Fica pronto
    expect(timer.getState()).toBe('ready');

    // Solta no fakeTime = 16800 (15.8s de inspeção)
    timer.handlePrimaryUp();
    expect(timer.getState()).toBe('running');
    expect(timer.getLastPenalty()).toBe('plus2');

    fakeTime += 10000;
    timer.handlePrimaryDown();
    expect(finalPenalty).toBe('plus2');
  });

  it('Aplica penalidade DNF ao iniciar após 17s de inspeção (Regra WCA A3c2)', () => {
    let fakeTime = 1000;
    const getTime = () => fakeTime;
    let finalPenalty = 'none';
    const timer = new TimerStateMachine(
      { inspectionEnabled: true, holdingThresholdMs: 300 },
      {
        onStop: (_ms, pen) => {
          finalPenalty = pen;
        },
      },
      getTime
    );

    timer.handlePrimaryDown();
    timer.handlePrimaryUp(); // Inicia inspeção

    // Passam 17.5s
    fakeTime += 17500;
    vi.advanceTimersByTime(17500);

    timer.handlePrimaryDown();
    fakeTime += 300;
    vi.advanceTimersByTime(300);
    timer.handlePrimaryUp(); // Inicia após 17.8s

    expect(timer.getState()).toBe('running');
    expect(timer.getLastPenalty()).toBe('dnf');

    fakeTime += 10000;
    timer.handlePrimaryDown();
    expect(finalPenalty).toBe('dnf');
  });
});

describe('TimeFormatter — Formatação e Truncamento Oficial WCA (Artigo 9f1)', () => {
  it('trunca centésimos conforme convenção da WCA', () => {
    // 12349 ms trunca para 12.34 (e não 12.35)
    const formatted = TimeFormatter.format(12349, 'none', 'hundredths');
    expect(formatted.display).toBe('12.34');
    expect(formatted.seconds).toBe(12);
    expect(formatted.fraction).toBe(34);
  });

  it('formata minutos e horas corretamente', () => {
    // 64.28s -> 1:04.28
    const minFormat = TimeFormatter.format(64280, 'none', 'hundredths');
    expect(minFormat.display).toBe('1:04.28');

    // 3724.50s -> 1:02:04.50
    const hourFormat = TimeFormatter.format(3724500, 'none', 'hundredths');
    expect(hourFormat.display).toBe('1:02:04.50');
  });

  it('adiciona + para penalidade +2 e exibe DNF para DNF', () => {
    const plus2 = TimeFormatter.format(10000, 'plus2', 'hundredths');
    expect(plus2.display).toBe('12.00+'); // 10s + 2s

    const dnf = TimeFormatter.format(10000, 'dnf', 'hundredths');
    expect(dnf.display).toBe('DNF');
    expect(dnf.isEffectiveDnf).toBe(true);
  });

  it('parser de tempo manual aceita múltiplos formatos da comunidade', () => {
    expect(TimeFormatter.parseManualTime('12.34').timeMs).toBe(12340);
    expect(TimeFormatter.parseManualTime('12,34').timeMs).toBe(12340);
    expect(TimeFormatter.parseManualTime('1234').timeMs).toBe(12340); // Stackmat style
    expect(TimeFormatter.parseManualTime('1:02.34').timeMs).toBe(62340);
    expect(TimeFormatter.parseManualTime('1:02:03.45').timeMs).toBe(3723450);
  });
});
