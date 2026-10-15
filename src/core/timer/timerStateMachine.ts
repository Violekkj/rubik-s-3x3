import { PenaltyType, TimerConfig, TimerState } from './types';

export interface TimerEventCallbacks {
  onStateChange?: (state: TimerState) => void;
  onInspectionTick?: (remainingMs: number) => void;
  onInspectionWarning?: (sec: 8 | 12) => void;
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
  private hasWarned8s = false;
  private hasWarned12s = false;
  private getTime: () => number;

  constructor(
    config: Partial<TimerConfig> = {},
    callbacks: TimerEventCallbacks = {},
    getTime?: () => number
  ) {
    this.config = {
      inspectionEnabled: config.inspectionEnabled ?? true,
      inspectionDurationMs: config.inspectionDurationMs ?? 15000,
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

  private transitionTo(newState: TimerState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  /**
   * Pressionamento inicial do espaço ou início do toque (pointerdown / keydown)
   */
  public handlePrimaryDown(now = this.getTime()): void {
    // Se o timer estiver rodando, parar imediatamente!
    if (this.state === 'running') {
      this.stop(now);
      return;
    }

    // Se estiver parado, pode preparar próxima tentativa
    if (this.state === 'stopped') {
      this.reset();
    }

    if (this.state === 'idle') {
      if (this.config.inspectionEnabled) {
        // Se a inspeção estiver ligada, o primeiro clique apenas inicia a inspeção quando liberado
        // Então ao apertar enquanto idle com inspeção, aguardamos soltar para iniciar a inspeção
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
    if (this.state === 'idle') {
      if (this.config.inspectionEnabled) {
        // Soltou o primeiro clique -> inicia a inspeção oficial
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
    this.hasWarned8s = false;
    this.hasWarned12s = false;
    this.transitionTo('inspecting');

    this.clearInspectionInterval();
    this.inspectionIntervalId = setInterval(() => {
      const elapsed = this.getTime() - this.inspectionStartTime;
      const remaining = Math.max(0, this.config.inspectionDurationMs - elapsed);

      this.callbacks.onInspectionTick?.(remaining);

      // Alertas de 8 segundos (WCA A3b1)
      if (elapsed >= 8000 && !this.hasWarned8s) {
        this.hasWarned8s = true;
        this.callbacks.onInspectionWarning?.(8);
      }

      // Alertas de 12 segundos (WCA A3b2)
      if (elapsed >= 12000 && !this.hasWarned12s) {
        this.hasWarned12s = true;
        this.callbacks.onInspectionWarning?.(12);
      }
    }, 50);
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
        // >= 17s: DNF
        this.lastPenalty = 'dnf';
      } else if (this.inspectionMsUsed >= 15000) {
        // 15s a 17s: +2 segundos
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

    this.transitionTo('stopped');
    this.callbacks.onStop?.(
      this.lastElapsedMs,
      this.lastPenalty,
      this.config.inspectionEnabled ? this.inspectionMsUsed : undefined
    );
  }

  public reset(): void {
    this.clearHoldTimer();
    this.clearInspectionInterval();
    this.inspectionStartTime = 0;
    this.holdStartTime = 0;
    this.solveStartTime = 0;
    this.solveStopTime = 0;
    this.hasWarned8s = false;
    this.hasWarned12s = false;
    this.transitionTo('idle');
  }

  public cancel(): void {
    this.reset();
  }

  private clearHoldTimer(): void {
    if (this.holdTimerId) {
      clearTimeout(this.holdTimerId);
      this.holdTimerId = null;
    }
  }

  private clearInspectionInterval(): void {
    if (this.inspectionIntervalId) {
      clearInterval(this.inspectionIntervalId);
      this.inspectionIntervalId = null;
    }
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
}
