import { randomScrambleForEvent } from 'cubing/scramble';

const AXES = [
  ['U', 'D'],
  ['L', 'R'],
  ['F', 'B'],
];

const MODIFIERS = ['', '\'', '2'];

/**
 * Gerador de emergência/offline rápido de scramble WCA 3x3 (20 a 22 movimentos)
 * Garante que não haja repetições consecutivas na mesma face nem no mesmo eixo (ex: R L R)
 */
export function generateFallbackScramble(length = 21): string {
  const moves: string[] = [];
  let lastAxis = -1;
  let secondLastAxis = -1;

  for (let i = 0; i < length; i++) {
    let axis = Math.floor(Math.random() * 3);
    while (axis === lastAxis || (axis === secondLastAxis && lastAxis !== -1)) {
      axis = Math.floor(Math.random() * 3);
    }

    const faceChoices = AXES[axis];
    const face = faceChoices[Math.floor(Math.random() * faceChoices.length)];
    const mod = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    moves.push(`${face}${mod}`);
    secondLastAxis = lastAxis;
    lastAxis = axis;
  }

  return moves.join(' ');
}

export class ScrambleManager {
  private buffer: string[] = [];
  private history: string[] = [];
  private historyIndex = -1;
  private isPrefetching = false;

  /**
   * Inicializa o gerenciador e pré-carrega scrambles
   */
  public async init(): Promise<void> {
    await this.fillBuffer();
  }

  /**
   * Obtém o próximo scramble random-state padrão oficial WCA
   */
  public async getNextScramble(): Promise<string> {
    // Se estiver navegando no histórico de scrambles anteriores
    if (this.historyIndex >= 0 && this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }

    // Tira do buffer ou gera imediatamente
    let scramble: string;
    if (this.buffer.length > 0) {
      scramble = this.buffer.shift()!;
    } else {
      scramble = await this.generateSingle();
    }

    this.history.push(scramble);
    this.historyIndex = this.history.length - 1;

    // Dispara recarga do buffer em segundo plano
    this.fillBuffer();

    return scramble;
  }

  /**
   * Retorna ao scramble anterior no histórico
   */
  public getPreviousScramble(): string | null {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return null;
  }

  /**
   * Verifica se há scramble anterior disponível
   */
  public hasPrevious(): boolean {
    return this.historyIndex > 0;
  }

  private async generateSingle(): Promise<string> {
    try {
      const alg = await randomScrambleForEvent('333');
      const str = alg.toString().trim();
      if (str.length > 0) return str;
    } catch {
      // Fallback robusto se cubing.js falhar em ambientes restritos
    }
    return generateFallbackScramble();
  }

  private async fillBuffer(): Promise<void> {
    if (this.isPrefetching) return;
    this.isPrefetching = true;

    try {
      while (this.buffer.length < 3) {
        const sc = await this.generateSingle();
        this.buffer.push(sc);
      }
    } finally {
      this.isPrefetching = false;
    }
  }
}

export const scrambleManager = new ScrambleManager();
