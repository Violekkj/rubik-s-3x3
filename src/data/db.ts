import Dexie, { Table } from 'dexie';
import { PenaltyType } from '../core/timer/types';

export interface SolveRecord {
  id: string; // UUID v4
  sessionId: string; // Referência da sessão
  createdAt: number; // Timestamp Unix ms
  timeMs: number; // Tempo bruto cronometrado
  effectiveTimeMs: number; // timeMs (+2000 se plus2, Infinity se dnf)
  penalty: PenaltyType;
  scramble: string; // Notação WCA
  scrambleSource: 'random' | 'manual';
  inspectionMs?: number; // Tempo de inspeção utilizado
  note?: string; // Anotações do usuário
  tags?: string[];
}

export interface SessionRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
}

export interface UserSettingsRecord {
  id: string; // 'default'
  inspectionEnabled: boolean;
  inspectionDurationMs: number;
  inspectionAudioAlerts: boolean;
  inspectionVoiceAlerts: boolean;
  holdingThresholdMs: number;
  timerPrecision: 'hundredths' | 'thousandths';
  hideTimerWhileRunning: boolean;
  cubeStickerColors: {
    U: string;
    D: string;
    F: string;
    B: string;
    R: string;
    L: string;
  };
  userName: string;
  avatarSeed: string;
}

export class CubeLabDatabase extends Dexie {
  solves!: Table<SolveRecord, string>;
  sessions!: Table<SessionRecord, string>;
  settings!: Table<UserSettingsRecord, string>;

  constructor() {
    super('CubeLabDB');

    this.version(1).stores({
      solves: 'id, sessionId, createdAt, effectiveTimeMs, penalty',
      sessions: 'id, name, createdAt',
      settings: 'id',
    });
  }
}

export const db = new CubeLabDatabase();

// Tenta obter persistência no navegador
export async function requestStoragePersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}
