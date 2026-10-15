import { CubeColor, CubeFacelets, FaceLetter, FaceletCoordinate, MoveName } from './types';

// Configuração padrão de cores WCA
export const DEFAULT_SOLVED_COLORS: Record<FaceLetter, CubeColor> = {
  U: 'white',
  L: 'orange',
  F: 'green',
  R: 'red',
  B: 'blue',
  D: 'yellow',
};

// Mapeamento exato de cada um dos 54 facelets para suas coordenadas 3D e vetor normal
export const FACELET_COORDINATES: FaceletCoordinate[] = [];

function initCoordinates() {
  // Face U (y = 1, normal = [0, 1, 0])
  // Linha 0 (z = -1): x = -1, 0, 1
  // Linha 1 (z =  0): x = -1, 0, 1
  // Linha 2 (z =  1): x = -1, 0, 1
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const z = r - 1; // -1, 0, 1
      const x = c - 1; // -1, 0, 1
      FACELET_COORDINATES.push({
        face: 'U',
        index: r * 3 + c,
        pos: [x, 1, z],
        normal: [0, 1, 0],
      });
    }
  }

  // Face L (x = -1, normal = [-1, 0, 0])
  // Linha 0 (y =  1): z = -1, 0, 1
  // Linha 1 (y =  0): z = -1, 0, 1
  // Linha 2 (y = -1): z = -1, 0, 1
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const y = 1 - r; // 1, 0, -1
      const z = c - 1; // -1, 0, 1
      FACELET_COORDINATES.push({
        face: 'L',
        index: r * 3 + c,
        pos: [-1, y, z],
        normal: [-1, 0, 0],
      });
    }
  }

  // Face F (z = 1, normal = [0, 0, 1])
  // Linha 0 (y =  1): x = -1, 0, 1
  // Linha 1 (y =  0): x = -1, 0, 1
  // Linha 2 (y = -1): x = -1, 0, 1
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const y = 1 - r; // 1, 0, -1
      const x = c - 1; // -1, 0, 1
      FACELET_COORDINATES.push({
        face: 'F',
        index: r * 3 + c,
        pos: [x, y, 1],
        normal: [0, 0, 1],
      });
    }
  }

  // Face R (x = 1, normal = [1, 0, 0])
  // Linha 0 (y =  1): z = 1, 0, -1
  // Linha 1 (y =  0): z = 1, 0, -1
  // Linha 2 (y = -1): z = 1, 0, -1
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const y = 1 - r; // 1, 0, -1
      const z = 1 - c; // 1, 0, -1
      FACELET_COORDINATES.push({
        face: 'R',
        index: r * 3 + c,
        pos: [1, y, z],
        normal: [1, 0, 0],
      });
    }
  }

  // Face B (z = -1, normal = [0, 0, -1])
  // Linha 0 (y =  1): x = 1, 0, -1
  // Linha 1 (y =  0): x = 1, 0, -1
  // Linha 2 (y = -1): x = 1, 0, -1
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const y = 1 - r; // 1, 0, -1
      const x = 1 - c; // 1, 0, -1
      FACELET_COORDINATES.push({
        face: 'B',
        index: r * 3 + c,
        pos: [x, y, -1],
        normal: [0, 0, -1],
      });
    }
  }

  // Face D (y = -1, normal = [0, -1, 0])
  // Linha 0 (z =  1): x = -1, 0, 1
  // Linha 1 (z =  0): x = -1, 0, 1
  // Linha 2 (z = -1): x = -1, 0, 1
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const z = 1 - r; // 1, 0, -1
      const x = c - 1; // -1, 0, 1
      FACELET_COORDINATES.push({
        face: 'D',
        index: r * 3 + c,
        pos: [x, -1, z],
        normal: [0, -1, 0],
      });
    }
  }
}

initCoordinates();

// Tabela de busca rápida para índice 0..53 a partir de (pos, normal)
function findFaceletIndex(pos: [number, number, number], normal: [number, number, number]): number {
  const [px, py, pz] = pos;
  const [nx, ny, nz] = normal;
  for (let i = 0; i < 54; i++) {
    const f = FACELET_COORDINATES[i];
    if (
      f.pos[0] === px &&
      f.pos[1] === py &&
      f.pos[2] === pz &&
      f.normal[0] === nx &&
      f.normal[1] === ny &&
      f.normal[2] === nz
    ) {
      return i;
    }
  }
  throw new Error(`Facelet not found at pos [${pos}], normal [${normal}]`);
}

// Representação do Cubo
export class CubeState {
  private facelets: CubeFacelets;

  constructor(initialFacelets?: CubeFacelets) {
    if (initialFacelets) {
      this.facelets = [...initialFacelets];
    } else {
      this.facelets = CubeState.createSolvedFacelets();
    }
  }

  public static createSolvedFacelets(): CubeFacelets {
    const facelets: CubeColor[] = [];
    const faces: FaceLetter[] = ['U', 'L', 'F', 'R', 'B', 'D'];
    for (const face of faces) {
      const color = DEFAULT_SOLVED_COLORS[face];
      for (let i = 0; i < 9; i++) {
        facelets.push(color);
      }
    }
    return facelets;
  }

  public clone(): CubeState {
    return new CubeState(this.facelets);
  }

  public getFacelets(): CubeFacelets {
    return [...this.facelets];
  }

  public isSolved(): boolean {
    const solved = CubeState.createSolvedFacelets();
    for (let i = 0; i < 54; i++) {
      if (this.facelets[i] !== solved[i]) return false;
    }
    return true;
  }

  // Verifica se o cubo está resolvido a menos de rotações de cubo inteiro
  public isSolvedAnyOrientation(): boolean {
    for (let f = 0; f < 6; f++) {
      const faceStart = f * 9;
      const centerColor = this.facelets[faceStart + 4];
      for (let i = 0; i < 9; i++) {
        if (this.facelets[faceStart + i] !== centerColor) return false;
      }
    }
    return true;
  }

  // Rotação de uma única camada (90° horário)
  private applySingleQuarterTurn(
    filter: (pos: [number, number, number]) => boolean,
    rot: (p: [number, number, number]) => [number, number, number]
  ): void {
    const nextFacelets = [...this.facelets];

    for (let i = 0; i < 54; i++) {
      const coord = FACELET_COORDINATES[i];
      if (filter(coord.pos)) {
        const nextPos = rot(coord.pos);
        const nextNormal = rot(coord.normal);
        const targetIdx = findFaceletIndex(nextPos, nextNormal);
        nextFacelets[targetIdx] = this.facelets[i];
      }
    }

    this.facelets = nextFacelets;
  }

  // Aplica movimento atômico com suporte a ' e 2
  public applyMove(move: MoveName): this {
    // Normalizar notação
    let base = move.replace(/['2]/g, '');
    const isPrime = move.includes('\'');
    const isDouble = move.includes('2');
    const turns = isDouble ? 2 : isPrime ? 3 : 1;

    for (let t = 0; t < turns; t++) {
      this.executeQuarterTurn(base);
    }
    return this;
  }

  private executeQuarterTurn(base: string): void {
    switch (base) {
      // U: gira y = 1 (sentido horário olhando para baixo no eixo +y)
      case 'U':
        this.applySingleQuarterTurn(
          pos => pos[1] === 1,
          ([x, y, z]) => [-z, y, x]
        );
        break;

      // D: gira y = -1 (sentido horário olhando de baixo no eixo -y)
      case 'D':
        this.applySingleQuarterTurn(
          pos => pos[1] === -1,
          ([x, y, z]) => [z, y, -x]
        );
        break;

      // F: gira z = 1 (sentido horário olhando para o eixo +z)
      case 'F':
        this.applySingleQuarterTurn(
          pos => pos[2] === 1,
          ([x, y, z]) => [y, -x, z]
        );
        break;

      // B: gira z = -1 (sentido horário olhando para o eixo -z)
      case 'B':
        this.applySingleQuarterTurn(
          pos => pos[2] === -1,
          ([x, y, z]) => [-y, x, z]
        );
        break;

      // R: gira x = 1 (sentido horário olhando para o eixo +x)
      case 'R':
        this.applySingleQuarterTurn(
          pos => pos[0] === 1,
          ([x, y, z]) => [x, z, -y]
        );
        break;

      // L: gira x = -1 (sentido horário olhando para o eixo -x)
      case 'L':
        this.applySingleQuarterTurn(
          pos => pos[0] === -1,
          ([x, y, z]) => [x, -z, y]
        );
        break;

      // M: fatia central x = 0 no sentido de L
      case 'M':
        this.applySingleQuarterTurn(
          pos => pos[0] === 0,
          ([x, y, z]) => [x, -z, y]
        );
        break;

      // E: fatia central y = 0 no sentido de D
      case 'E':
        this.applySingleQuarterTurn(
          pos => pos[1] === 0,
          ([x, y, z]) => [z, y, -x]
        );
        break;

      // S: fatia central z = 0 no sentido de F
      case 'S':
        this.applySingleQuarterTurn(
          pos => pos[2] === 0,
          ([x, y, z]) => [y, -x, z]
        );
        break;

      // Rotações de cubo inteiro
      case 'x':
        this.applySingleQuarterTurn(
          () => true,
          ([x, y, z]) => [x, z, -y]
        );
        break;

      case 'y':
        this.applySingleQuarterTurn(
          () => true,
          ([x, y, z]) => [-z, y, x]
        );
        break;

      case 'z':
        this.applySingleQuarterTurn(
          () => true,
          ([x, y, z]) => [y, -x, z]
        );
        break;

      // Movimentos largos (Wide)
      case 'Rw':
      case 'r':
        this.applySingleQuarterTurn(
          pos => pos[0] >= 0,
          ([x, y, z]) => [x, z, -y]
        );
        break;

      case 'Lw':
      case 'l':
        this.applySingleQuarterTurn(
          pos => pos[0] <= 0,
          ([x, y, z]) => [x, -z, y]
        );
        break;

      case 'Uw':
      case 'u':
        this.applySingleQuarterTurn(
          pos => pos[1] >= 0,
          ([x, y, z]) => [-z, y, x]
        );
        break;

      case 'Dw':
      case 'd':
        this.applySingleQuarterTurn(
          pos => pos[1] <= 0,
          ([x, y, z]) => [z, y, -x]
        );
        break;

      case 'Fw':
      case 'f':
        this.applySingleQuarterTurn(
          pos => pos[2] >= 0,
          ([x, y, z]) => [y, -x, z]
        );
        break;

      case 'Bw':
      case 'b':
        this.applySingleQuarterTurn(
          pos => pos[2] <= 0,
          ([x, y, z]) => [-y, x, z]
        );
        break;

      default:
        console.warn(`Movimento não reconhecido: ${base}`);
    }
  }

  // Aplica sequência de movimentos em string de notação WCA
  public applyAlgorithm(alg: string): this {
    const tokens = alg.trim().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      // Normaliza aspas tipográficas (ex: ’, `) para '
      const normalized = token.replace(/[’`]/g, '\'') as MoveName;
      this.applyMove(normalized);
    }
    return this;
  }
}
