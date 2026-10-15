import { CubeState } from '../../core/cube/CubeState';
import { MoveParser } from '../../core/cube/moveParser';
import { MoveName } from '../../core/cube/types';
import { AlgorithmCase } from './types';

export interface AlgValidationReport {
  caseId: string;
  algNotation: string;
  isValid: boolean;
  expectedHTM: number;
  actualHTM: number;
  error?: string;
}



export class AlgValidator {
  /**
   * Testa se um algoritmo resolve um caso de PLL a menos de AUF e rotações y
   */
  public static testPLL(alg: string, setupOrPrimaryAlg: string): boolean {
    const setup = MoveParser.invert(setupOrPrimaryAlg);
    const yRots: (MoveName | '')[] = ['', 'y', 'y\'', 'y2'];
    const preAufs: (MoveName | '')[] = ['', 'U', 'U\'', 'U2'];
    const postAufs: (MoveName | '')[] = ['', 'U', 'U\'', 'U2'];

    for (const y of yRots) {
      for (const pre of preAufs) {
        const cube = new CubeState();
        cube.applyAlgorithm(setup);
        if (y) cube.applyMove(y);
        if (pre) cube.applyMove(pre);
        cube.applyAlgorithm(alg);

        if (cube.isSolvedAnyOrientation()) return true;

        for (const post of postAufs) {
          const testCube = cube.clone();
          if (post) testCube.applyMove(post);
          if (testCube.isSolvedAnyOrientation()) return true;
        }
      }
    }

    return false;
  }

  /**
   * Testa se um algoritmo resolve um caso de OLL
   * (A camada U inteira deve ficar orientada e os dois primeiros andares F2L preservados)
   */
  public static testOLL(alg: string, setupOrPrimaryAlg: string): boolean {
    const setup = MoveParser.invert(setupOrPrimaryAlg);
    const yRots: (MoveName | '')[] = ['', 'y', 'y\'', 'y2'];
    const preAufs: (MoveName | '')[] = ['', 'U', 'U\'', 'U2'];

    for (const y of yRots) {
      for (const pre of preAufs) {
        const cube = new CubeState();
        cube.applyAlgorithm(setup);
        if (y) cube.applyMove(y);
        if (pre) cube.applyMove(pre);
        cube.applyAlgorithm(alg);

        if (AlgValidator.isOllSolved(cube)) return true;
      }
    }

    return false;
  }

  private static isOllSolved(cube: CubeState): boolean {
    const facelets = cube.getFacelets();

    // 1. Todos os 9 adesivos da face U devem ter a mesma cor do centro U
    const uCenter = facelets[4];
    for (let i = 0; i < 9; i++) {
      if (facelets[i] !== uCenter) return false;
    }

    // 2. A face D deve permanecer com a cor do centro D
    const dCenter = facelets[49];
    for (let i = 45; i < 54; i++) {
      if (facelets[i] !== dCenter) return false;
    }

    // 3. As duas primeiras camadas (camadas E e D) de L, F, R, B devem permanecer intactas
    const faces = [
      { start: 9, centerIdx: 13 },  // L
      { start: 18, centerIdx: 22 }, // F
      { start: 27, centerIdx: 31 }, // R
      { start: 36, centerIdx: 40 }, // B
    ];

    for (const f of faces) {
      const c = facelets[f.centerIdx];
      for (const idx of [3, 4, 5, 6, 7, 8]) {
        if (facelets[f.start + idx] !== c) return false;
      }
    }

    return true;
  }

  /**
   * Valida todos os algoritmos de um caso
   */
  public static validateCase(caseItem: AlgorithmCase): AlgValidationReport[] {
    const reports: AlgValidationReport[] = [];
    const primaryNotation = caseItem.algs[0]?.notation;
    const setupStr = caseItem.setupMove || primaryNotation;

    for (const alt of caseItem.algs) {
      const parsed = MoveParser.parse(alt.notation);
      if (!parsed.isValid) {
        reports.push({
          caseId: caseItem.id,
          algNotation: alt.notation,
          isValid: false,
          expectedHTM: alt.moveCountHTM,
          actualHTM: 0,
          error: parsed.error,
        });
        continue;
      }

      // Valida contagem HTM
      if (parsed.htmCount !== alt.moveCountHTM) {
        reports.push({
          caseId: caseItem.id,
          algNotation: alt.notation,
          isValid: false,
          expectedHTM: alt.moveCountHTM,
          actualHTM: parsed.htmCount,
          error: `HTM divergente: esperado ${alt.moveCountHTM}, calculado ${parsed.htmCount}`,
        });
        continue;
      }

      // Valida resolução do caso por simulação no cubo
      let resolves = false;
      if (caseItem.set === 'pll' || caseItem.set === '2look-pll') {
        resolves = AlgValidator.testPLL(alt.notation, setupStr);
      } else if (caseItem.set === 'oll' || caseItem.set === '2look-oll') {
        resolves = AlgValidator.testOLL(alt.notation, setupStr);
      } else {
        // F2L e Iniciante: testa se notação é válida
        resolves = true;
      }

      if (!resolves) {
        reports.push({
          caseId: caseItem.id,
          algNotation: alt.notation,
          isValid: false,
          expectedHTM: alt.moveCountHTM,
          actualHTM: parsed.htmCount,
          error: 'O algoritmo não resolve o caso pretendido.',
        });
      } else {
        reports.push({
          caseId: caseItem.id,
          algNotation: alt.notation,
          isValid: true,
          expectedHTM: alt.moveCountHTM,
          actualHTM: parsed.htmCount,
        });
      }
    }

    return reports;
  }
}
