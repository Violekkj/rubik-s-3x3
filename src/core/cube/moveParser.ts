import { MoveName } from './types';

const VALID_MOVE_REGEX = /^(?:[UDFBLRxyzMES]|[UDFBLR]w|[udfblr])['2]?$/;

export interface AlgValidationResult {
  isValid: boolean;
  error?: string;
  normalizedAlg: string;
  moves: MoveName[];
  htmCount: number;
}

export class MoveParser {
  /**
   * Valida e normaliza uma sequência de movimentos WCA
   */
  public static parse(algStr: string): AlgValidationResult {
    if (!algStr || algStr.trim().length === 0) {
      return {
        isValid: true,
        normalizedAlg: '',
        moves: [],
        htmCount: 0,
      };
    }

    // Normaliza apóstrofos tipográficos e quebras de linha/espaços múltiplos
    const cleaned = algStr
      .replace(/[’`´]/g, '\'')
      .replace(/[\(\)\[\]\{\}]/g, ' ') // Remove parênteses comumente usados em notação de triggers
      .trim();

    const rawTokens = cleaned.split(/\s+/).filter(Boolean);
    const moves: MoveName[] = [];
    let htmCount = 0;

    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      if (!VALID_MOVE_REGEX.test(token)) {
        return {
          isValid: false,
          error: `Movimento inválido na posição ${i + 1}: "${token}"`,
          normalizedAlg: cleaned,
          moves: [],
          htmCount: 0,
        };
      }

      moves.push(token as MoveName);

      // HTM: Rotações de cubo inteiro (x, y, z) não contam como movimentos em HTM
      const base = token.replace(/['2w]/g, '');
      if (!['x', 'y', 'z'].includes(base)) {
        htmCount++;
      }
    }

    return {
      isValid: true,
      normalizedAlg: moves.join(' '),
      moves,
      htmCount,
    };
  }

  /**
   * Inverte um algoritmo (ex: "R U R' U'" -> "U R U' R'")
   */
  public static invert(algStr: string): string {
    const parseRes = MoveParser.parse(algStr);
    if (!parseRes.isValid || parseRes.moves.length === 0) {
      return '';
    }

    const invertedMoves = parseRes.moves
      .slice()
      .reverse()
      .map(m => {
        if (m.endsWith('2')) return m;
        if (m.endsWith('\'')) return m.slice(0, -1);
        return `${m}'`;
      });

    return invertedMoves.join(' ');
  }

  /**
   * Espelha um algoritmo horizontalmente (mão direita <-> mão esquerda)
   * R <-> L, U -> U, D -> D, F -> F, B -> B
   */
  public static mirrorLR(algStr: string): string {
    const parseRes = MoveParser.parse(algStr);
    if (!parseRes.isValid || parseRes.moves.length === 0) {
      return '';
    }

    const mapMove = (m: MoveName): string => {
      const isPrime = m.includes('\'');
      const isDouble = m.includes('2');
      let base = m.replace(/['2]/g, '');

      // Troca R por L e vice-versa
      if (base === 'R') base = 'L';
      else if (base === 'L') base = 'R';
      else if (base === 'Rw') base = 'Lw';
      else if (base === 'Lw') base = 'Rw';
      else if (base === 'r') base = 'l';
      else if (base === 'l') base = 'r';

      // Ao espelhar, giros horários tornam-se anti-horários
      let suffix = '';
      if (isDouble) {
        suffix = '2';
      } else if (isPrime) {
        suffix = ''; // Era anti-horário, vira horário
      } else {
        suffix = '\''; // Era horário, vira anti-horário
      }

      return `${base}${suffix}`;
    };

    return parseRes.moves.map(mapMove).join(' ');
  }
}
