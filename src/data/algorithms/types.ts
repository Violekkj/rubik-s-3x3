export interface AlgSource {
  name: string;
  url: string;
  accessedAt?: string;
}

export interface AlgAlternative {
  notation: string;
  label: string; // ex: "Mais rápido / Padrão", "Ergonômico / Sem regrip", "OH (Uma mão)", "Menos movimentos"
  moveCountHTM: number;
  popularityRank: number; // 1 = mais popular da comunidade
  sources: AlgSource[];
}

export interface AlgorithmCase {
  id: string; // ex: "pll-t", "oll-21", "f2l-01"
  set: 'pll' | 'oll' | '2look-pll' | '2look-oll' | 'f2l' | 'beginner';
  name: string; // ex: "T-Perm", "OLL 21", "Caso 1 (Básico)"
  caseNumber?: number;
  group?: string; // Grupo morfológico (ex: "Troca Adjacente de Cantos", "T-Shape", "Cantos")
  setupMove?: string; // Notação para configurar o caso a partir do resolvido
  algs: AlgAlternative[];
  recognition: string;
  notes?: string;
}

export interface AlgProgressState {
  status: 'unlearned' | 'learning' | 'known' | 'mastered';
  preferredAlgIndex: number;
  isFavorite: boolean;
  notes?: string;
  customAlgs?: string[];
}
