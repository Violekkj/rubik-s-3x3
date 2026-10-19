import { PenaltyType, TimerConfig, TimerState } from './types';

export interface TimerEventCallbacks {
  onStateChange?: (state: TimerState) => void;
  onInspectionTick?: (remainingMs: number, displayedSec: number, penalty: PenaltyType) => void;
  onInspectionWarning?: (sec: number) => void;
  onInspectionAutoDnf?: (inspectionMs: number) => void;
  onStop?: (elapsedMs: number, penalty: PenaltyType, inspectionMs?: number) => void;
}

export class TimerStateMachine {
  private state: TimerState = 'idle';
  private config: TimerConfig;
  private callbacks: TimerEventCallbacks;

  // Timestamps de alta resolução
  private inspectionStartTime = 0;
  private holdStartTime = 0;
  private solveStartTime = 0;
  private solveStopTime = 0;
  private lastElapsedMs = 0;
  private lastPenalty: PenaltyType = 'none';
  private inspectionMsUsed = 0;

  private holdTimerId: ReturnType<typeof setTimeout> | null = null;
  private inspectionIntervalId: ReturnType<typeof setInterval> | null = null;
  private warnedSeconds = new Set<number>();
  private getTime: () => number;

  // Proteção contra reinício automático e descarte do gesto de parada
  private stopLockoutUntil = 0;
  private stoppingGesture = false;
  private pendingInspectionStart = false;

  constructor(
    config: Partial<TimerConfig> = {},
    callbacks: TimerEventCallbacks = {},
    getTime?: () => number
  ) {
    this.config = {
      inspectionEnabled: config.inspectionEnabled ?? true,
      inspectionDurationMs: config.inspectionDurationMs ?? 15000,
      inspectionWarning1Sec: config.inspectionWarning1Sec ?? 8,
      inspectionWarning2Sec: config.inspectionWarning2Sec ?? 2,
      holdingThresholdMs: config.holdingThresholdMs ?? 300,
      precision: config.precision ?? 'hundredths',
    };
    this.callbacks = callbacks;
    this.getTime = getTime ?? (() => performance.now());
  }

  public getState(): TimerState {
    return this.state;
  }

  public getConfig(): TimerConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public setCallbacks(callbacks: TimerEventCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getLastElapsedMs(): number {
    return this.lastElapsedMs;
  }

  public getLastPenalty(): PenaltyType {
    return this.lastPenalty;
  }

  public getInspectionMsUsed(): number {
    return this.inspectionMsUsed;
  }

  public getHoldDuration(now = this.getTime()): number {
    return this.holdStartTime > 0 ? Math.max(0, now - this.holdStartTime) : 0;
  }

  private transitionTo(newState: TimerState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  /**
   * Pressionamento inicial do espaço ou início do toque (pointerdown / keydown)
   */
  public handlePrimaryDown(now = this.getTime()): void {
    // Se o timer estiver rodando, parar imediatamente e ir para idle
    if (this.state === 'running') {
      this.stop(now);
      return;
    }

    // Se estiver em lockout pós-parada, ignora qualquer novo down
    if (now < this.stopLockoutUntil) {
      return;
    }

    if (this.state === 'idle') {
      if (this.config.inspectionEnabled) {
        // Marca intenção de iniciar inspeção ao soltar
        this.pendingInspectionStart = true;
        return;
      } else {
        // Sem inspeção: segurar entra direto em 'holding'
        this.startHolding(now);
      }
    } else if (this.state === 'inspecting') {
      // Durante inspeção: segurar entra em 'holding'
      this.startHolding(now);
    }
  }

  /**
   * Liberação do espaço ou do toque (pointerup / keyup)
   */
  public handlePrimaryUp(now = this.getTime()): void {
    // Se este up pertence ao gesto que parou o cronômetro, descarta
    if (this.stoppingGesture) {
      this.stoppingGesture = false;
      return;
    }

    // Se estiver em lockout pós-parada, ignora
    if (now < this.stopLockoutUntil) {
      return;
    }

    if (this.state === 'idle') {
      if (this.config.inspectionEnabled && this.pendingInspectionStart) {
        this.pendingInspectionStart = false;
        this.startInspection(now);
      }
      return;
    }

    if (this.state === 'holding') {
      // Soltou antes do limiar (não ficou verde) -> aborta início
      this.clearHoldTimer();
      if (this.config.inspectionEnabled && this.inspectionStartTime > 0) {
        this.transitionTo('inspecting');
      } else {
        this.transitionTo('idle');
      }
      return;
    }

    if (this.state === 'ready') {
      // Estava pronto (verde) e soltou -> inicia a resolução!
      this.startRunning(now);
      return;
    }
  }

  private startInspection(now: number): void {
    this.inspectionStartTime = now;
    this.warnedSeconds.clear();
    this.transitionTo('inspecting');

    this.clearInspectionInterval();
    this.inspectionIntervalId = setInterval(() => {
      const elapsed = this.getTime() - this.inspectionStartTime;

      if (elapsed < this.config.inspectionDurationMs) {
        const remaining = Math.max(0, this.config.inspectionDurationMs - elapsed);
        const displayedSec = Math.ceil(remaining / 1000);

        this.callbacks.onInspectionTick?.(remaining, displayedSec, 'none');

        // Dispara avisos baseados no número exibido (única fonte da verdade)
        const w1 = this.config.inspectionWarning1Sec ?? 8;
        const w2 = this.config.inspectionWarning2Sec ?? 2;

        if (displayedSec === w1 && !this.warnedSeconds.has(w1)) {
          this.warnedSeconds.add(w1);
          this.callbacks.onInspectionWarning?.(w1);
        }

        if (displayedSec === w2 && !this.warnedSeconds.has(w2)) {
          this.warnedSeconds.add(w2);
          this.callbacks.onInspectionWarning?.(w2);
        }
      } else if (elapsed < this.config.inspectionDurationMs + 2000) {
        // Entre 15s e 17s: exibe +2 em vermelho e armazena penalidade
        this.callbacks.onInspectionTick?.(0, 0, 'plus2');
      } else {
        // >= 17s: DNF automático por inspeção expirada
        this.clearInspectionInterval();
        this.clearHoldTimer();
        this.lastPenalty = 'dnf';
        this.callbacks.onInspectionAutoDnf?.(17000);
        this.transitionTo('idle');
      }
    }, 25);
  }

  private startHolding(now: number): void {
    this.holdStartTime = now;
    this.transitionTo('holding');

    this.clearHoldTimer();
    this.holdTimerId = setTimeout(() => {
      if (this.state === 'holding') {
        this.transitionTo('ready');
      }
    }, this.config.holdingThresholdMs);
  }

  private startRunning(now: number): void {
    this.clearHoldTimer();
    this.clearInspectionInterval();

    this.solveStartTime = now;

    // Avaliação de penalidade de inspeção (Regra WCA A3c1 e A3c2)
    this.lastPenalty = 'none';
    if (this.config.inspectionEnabled && this.inspectionStartTime > 0) {
      this.inspectionMsUsed = now - this.inspectionStartTime;
      if (this.inspectionMsUsed >= 17000) {
        this.lastPenalty = 'dnf';
      } else if (this.inspectionMsUsed >= 15000) {
        this.lastPenalty = 'plus2';
      }
    } else {
      this.inspectionMsUsed = 0;
    }

    this.transitionTo('running');
  }

  public stop(now = this.getTime()): void {
    if (this.state !== 'running') return;

    this.solveStopTime = now;
    this.lastElapsedMs = Math.max(0, this.solveStopTime - this.solveStartTime);

    // Ativa lockout e marca gesto de parada para ignorar o release subsequente
    this.stopLockoutUntil = now + 300;
    this.stoppingGesture = true;

    // Ao parar o cronômetro: salvar UMA solve, exibir o tempo e ir para idle
    this.transitionTo('idle');

    this.callbacks.onStop?.(
      this.lastElapsedMs,
      this.lastPenalty,
      this.config.inspectionEnabled ? this.inspectionMsUsed : undefined
    );
  }

  public cancel(): void {
    this.clearHoldTimer();
    this.clearInspectionInterval();
    this.warnedSeconds.clear();
    this.stoppingGesture = false;
    this.pendingInspectionStart = false;
    this.inspectionStartTime = 0;
    this.transitionTo('idle');
  }

  public reset(): void {
    this.clearHoldTimer();
    this.clearInspectionInterval();
    this.warnedSeconds.clear();
    this.stoppingGesture = false;
    this.pendingInspectionStart = false;
    this.inspectionStartTime = 0;
    this.solveStartTime = 0;
    this.solveStopTime = 0;
    this.lastElapsedMs = 0;
    this.lastPenalty = 'none';
    this.inspectionMsUsed = 0;
    this.transitionTo('idle');
  }

  private clearHoldTimer(): void {
    if (this.holdTimerId !== null) {
      clearTimeout(this.holdTimerId);
      this.holdTimerId = null;
    }
  }

  private clearInspectionInterval(): void {
    if (this.inspectionIntervalId !== null) {
      clearInterval(this.inspectionIntervalId);
      this.inspectionIntervalId = null;
    }
  }
}
