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
  inspectionWarning1Sec: number; // Padrão 8
  inspectionWarning2Sec: number; // Padrão 2
  beepVolume: number; // 0 a 100, padrão 25
  timerSize: 'small' | 'medium' | 'large'; // Padrão 'medium'
  diagramFrontColor: 'green' | 'blue'; // Padrão 'green'
  scrambleNetCollapsed?: boolean;
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

export interface ManualPbEntry {
  timeMs: number;
  date?: string;
  competition?: string;
  note?: string;
  mode: 'auto' | 'manual' | 'best';
}

export interface OtherEventEntry {
  id: string;
  event: string;
  singleMs?: number;
  averageMs?: number;
  date?: string;
  note?: string;
}

export interface GoalEntry {
  id: string;
  metric: string;
  targetTimeMs: number;
  createdAt: number;
}

export interface UserProfileRecord {
  id: string; // 'current'
  nick: string;
  name?: string;
  bio?: string;
  country?: string;
  city?: string;
  method?: string;
  mainCube?: string;
  cubingSince?: string;
  wcaId?: string;
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    discord?: string;
    website?: string;
  };
  accentColor?: string;
  avatarBlob?: Blob | null;
  bannerBlob?: Blob | null;
  bannerGradient?: string;
  pinnedPbMetrics?: string[]; // Métricas fixadas (ex: ['single', 'ao5', 'ao12', 'ao100'])
  manualPbs?: Record<string, ManualPbEntry>;
  otherEvents?: OtherEventEntry[];
  goals?: GoalEntry[];
}

export class CubeLabDatabase extends Dexie {
  solves!: Table<SolveRecord, string>;
  sessions!: Table<SessionRecord, string>;
  settings!: Table<UserSettingsRecord, string>;
  profiles!: Table<UserProfileRecord, string>;

  constructor() {
    super('CubeLabDB');

    this.version(1).stores({
      solves: 'id, sessionId, createdAt, effectiveTimeMs, penalty',
      sessions: 'id, name, createdAt',
      settings: 'id',
    });

    this.version(2).stores({
      solves: 'id, sessionId, createdAt, effectiveTimeMs, penalty',
      sessions: 'id, name, createdAt',
      settings: 'id',
      profiles: 'id',
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
