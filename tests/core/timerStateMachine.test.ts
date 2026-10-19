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

  it('Modo Sem Inspeção: idle -> holding -> ready -> running -> idle pós-stop', () => {
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

    expect(timer.getState()).toBe('idle');
    expect(stoppedResult.ms).toBe(12345);
    expect(stoppedResult.pen).toBe('none');
    expect(stateTransitions).toEqual(['holding', 'ready', 'running', 'idle']);
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

  it('Modo Inspeção WCA: bipes alinhados ao número exibido (8 em t=7000ms e 2 em t=13000ms)', () => {
    let fakeTime = 1000;
    const getTime = () => fakeTime;
    const warnings: number[] = [];
    const ticks: Array<{ remaining: number; displayed: number; penalty: string }> = [];

    const timer = new TimerStateMachine(
      {
        inspectionEnabled: true,
        inspectionDurationMs: 15000,
        inspectionWarning1Sec: 8,
        inspectionWarning2Sec: 2,
        holdingThresholdMs: 300,
      },
      {
        onInspectionTick: (remaining, displayed, penalty) => {
          ticks.push({ remaining, displayed, penalty });
        },
        onInspectionWarning: sec => warnings.push(sec),
      },
      getTime
    );

    // 1º ciclo: aperta e solta para iniciar inspeção
    timer.handlePrimaryDown();
    timer.handlePrimaryUp();
    expect(timer.getState()).toBe('inspecting');

    // Em t=6900ms (faltam 8100ms, displayed = 9) -> nenhum bipe
    fakeTime += 6900;
    vi.advanceTimersByTime(6900);
    expect(warnings).toEqual([]);

    // Em t=7000ms (faltam 8000ms, displayed = 8) -> 1º bipe toca!
    fakeTime += 100;
    vi.advanceTimersByTime(100);
    expect(warnings).toEqual([8]);

    // Em t=12900ms (faltam 2100ms, displayed = 3) -> ainda apenas [8]
    fakeTime += 5900;
    vi.advanceTimersByTime(5900);
    expect(warnings).toEqual([8]);

    // Em t=13000ms (faltam 2000ms, displayed = 2) -> 2º bipe toca!
    fakeTime += 100;
    vi.advanceTimersByTime(100);
    expect(warnings).toEqual([8, 2]);

    // Avança mais 500ms e garante que os bipes NÃO tocam de novo (disparo único)
    fakeTime += 500;
    vi.advanceTimersByTime(500);
    expect(warnings).toEqual([8, 2]);
  });

  it('Uma solve por vez: parar solve -> keyup -> avançar 30s continua idle sem reinício automático', () => {
    let fakeTime = 1000;
    const getTime = () => fakeTime;
    let stopCallCount = 0;
    let inspectionCallCount = 0;

    const timer = new TimerStateMachine(
      { inspectionEnabled: true, holdingThresholdMs: 300 },
      {
        onStop: () => {
          stopCallCount++;
        },
        onInspectionTick: () => {
          inspectionCallCount++;
        },
      },
      getTime
    );

    // 1. Inicia inspeção
    timer.handlePrimaryDown();
    timer.handlePrimaryUp();
    expect(timer.getState()).toBe('inspecting');

    // 2. Segura 300ms e solta para iniciar solve
    timer.handlePrimaryDown();
    fakeTime += 300;
    vi.advanceTimersByTime(300);
    timer.handlePrimaryUp();
    expect(timer.getState()).toBe('running');

    // 3. Usuário para a solve pressionando espaço (keydown)
    fakeTime += 8500;
    vi.advanceTimersByTime(8500);
    timer.handlePrimaryDown(); // Para o cronômetro
    expect(timer.getState()).toBe('idle');
    expect(stopCallCount).toBe(1);

    // 4. Usuário solta a tecla de parada (keyup)
    fakeTime += 50;
    vi.advanceTimersByTime(50);
    timer.handlePrimaryUp(); // Release do gesto de parada DESCARTADO!

    // 5. Avança 30 segundos no tempo fictício
    const previousInspectionTicks = inspectionCallCount;
    fakeTime += 30000;
    vi.advanceTimersByTime(30000);

    // Continua idle! Nenhuma inspeção começou, nenhuma solve extra foi salva
    expect(timer.getState()).toBe('idle');
    expect(stopCallCount).toBe(1);
    expect(inspectionCallCount).toBe(previousInspectionTicks);

    // 6. Novo gesto explícito do usuário -> agora sim a inspeção inicia!
    timer.handlePrimaryDown();
    timer.handlePrimaryUp();
    expect(timer.getState()).toBe('inspecting');
  });

  it('Aplica penalidade +2 ao chegar a 15s de inspeção (Regra WCA A3c1)', () => {
    let fakeTime = 1000;
    const getTime = () => fakeTime;
    let lastTickPenalty = 'none';
    let finalPenalty = 'none';

    const timer = new TimerStateMachine(
      { inspectionEnabled: true, holdingThresholdMs: 300 },
      {
        onInspectionTick: (_rem, _disp, pen) => {
          lastTickPenalty = pen;
        },
        onStop: (_ms, pen) => {
          finalPenalty = pen;
        },
      },
      getTime
    );

    timer.handlePrimaryDown();
    timer.handlePrimaryUp(); // Começa inspeção no fakeTime = 1000

    // Avança 15.1s
    fakeTime += 15100;
    vi.advanceTimersByTime(15100);
    expect(lastTickPenalty).toBe('plus2');

    // Segura para armar
    timer.handlePrimaryDown();
    fakeTime += 300;
    vi.advanceTimersByTime(300);
    expect(timer.getState()).toBe('ready');

    // Solta no fakeTime = 16400 (15.4s de inspeção)
    timer.handlePrimaryUp();
    expect(timer.getState()).toBe('running');
    expect(timer.getLastPenalty()).toBe('plus2');

    fakeTime += 5000;
    timer.handlePrimaryDown();
    expect(finalPenalty).toBe('plus2');
  });

  it('Aplica DNF automático aos 17s de inspeção (Regra WCA A3c2)', () => {
    let fakeTime = 1000;
    const getTime = () => fakeTime;
    let autoDnfCalledWith: number | null = null;

    const timer = new TimerStateMachine(
      { inspectionEnabled: true, holdingThresholdMs: 300 },
      {
        onInspectionAutoDnf: ms => {
          autoDnfCalledWith = ms;
        },
      },
      getTime
    );

    timer.handlePrimaryDown();
    timer.handlePrimaryUp(); // Inicia inspeção
    expect(timer.getState()).toBe('inspecting');

    // Passam 16.9s -> ainda não é auto DNF
    fakeTime += 16900;
    vi.advanceTimersByTime(16900);
    expect(autoDnfCalledWith).toBeNull();

    // Passam 17.0s -> DNF automático dispara e volta para idle!
    fakeTime += 200;
    vi.advanceTimersByTime(200);
    expect(autoDnfCalledWith).toBe(17000);
    expect(timer.getState()).toBe('idle');
    expect(timer.getLastPenalty()).toBe('dnf');
  });
});

describe('TimeFormatter — Formatação e Truncamento Oficial WCA (Artigo 9f1)', () => {
  it('trunca centésimos conforme convenção da WCA', () => {
    const formatted = TimeFormatter.format(12349, 'none', 'hundredths');
    expect(formatted.display).toBe('12.34');
    expect(formatted.seconds).toBe(12);
    expect(formatted.fraction).toBe(34);
  });

  it('formata minutos e horas corretamente', () => {
    const minFormat = TimeFormatter.format(64280, 'none', 'hundredths');
    expect(minFormat.display).toBe('1:04.28');

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
