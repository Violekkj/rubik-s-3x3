export type TimerState =
  | 'idle'
  | 'inspecting'
  | 'holding'
  | 'ready'
  | 'running'
  | 'stopped';

export type PenaltyType = 'none' | 'plus2' | 'dnf';

export type TimerPrecision = 'hundredths' | 'thousandths';

export interface TimerConfig {
  inspectionEnabled: boolean;
  inspectionDurationMs: number; // Padrão 15000 ms (15s)
  inspectionWarning1Sec?: number; // Padrão 8 (exibido aos 7000ms decorridos)
  inspectionWarning2Sec?: number; // Padrão 2 (exibido aos 13000ms decorridos)
  holdingThresholdMs: number; // Padrão 300 ms
  precision: TimerPrecision;
}

export interface FormattedTime {
  display: string;
  hours?: number;
  minutes?: number;
  seconds: number;
  fraction: number; // Centésimos ou milésimos
  penalty: PenaltyType;
  isEffectiveDnf: boolean;
}
