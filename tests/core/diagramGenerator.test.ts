import { describe, it, expect } from 'vitest';
import {
  CubeState,
  RESOLUTION_COLORS_GREEN_FRONT,
  RESOLUTION_COLORS_BLUE_FRONT,
} from '../../src/core/cube/CubeState';
import { MoveParser } from '../../src/core/cube/moveParser';

import pllData from '../../src/data/algorithms/cfop-pll.json';
import ollData from '../../src/data/algorithms/cfop-oll.json';
import { AlgorithmCase } from '../../src/data/algorithms/types';

describe('DiagramGenerator — Validação dos Diagramas 2D (Topo Amarelo e 12 Barras)', () => {
  it('Cubo resolvido (orientação padrão com frente verde): topo 100% amarelo e 12 barras com centros das faces', () => {
    const solved = CubeState.createSolvedFacelets(RESOLUTION_COLORS_GREEN_FRONT);
    const cube = new CubeState(solved);
    const facelets = cube.getFacelets();

    // 1. Face U (0..8) deve ser 100% amarela
    for (let i = 0; i < 9; i++) {
      expect(facelets[i]).toBe('yellow');
    }

    // 2. Barras Superiores (Face B, indices 36, 37, 38) devem ser azuis
    expect(facelets[36]).toBe('blue');
    expect(facelets[37]).toBe('blue');
    expect(facelets[38]).toBe('blue');

    // 3. Barras Inferiores (Face F, indices 18, 19, 20) devem ser verdes
    expect(facelets[18]).toBe('green');
    expect(facelets[19]).toBe('green');
    expect(facelets[20]).toBe('green');

    // 4. Barras Esquerdas (Face L, indices 9, 10, 11) devem ser vermelhas
    expect(facelets[9]).toBe('red');
    expect(facelets[10]).toBe('red');
    expect(facelets[11]).toBe('red');

    // 5. Barras Direitas (Face R, indices 27, 28, 29) devem ser laranjas
    expect(facelets[27]).toBe('orange');
    expect(facelets[28]).toBe('orange');
    expect(facelets[29]).toBe('orange');
  });

  it('Cubo resolvido (orientação alternativa com frente azul): topo 100% amarelo e faces x2', () => {
    const solved = CubeState.createSolvedFacelets(RESOLUTION_COLORS_BLUE_FRONT);
    const cube = new CubeState(solved);
    const facelets = cube.getFacelets();

    // Face U 100% amarela
    for (let i = 0; i < 9; i++) {
      expect(facelets[i]).toBe('yellow');
    }

    // Frente é azul, trás é verde, direita é vermelha, esquerda é laranja
    expect(facelets[18]).toBe('blue'); // F
    expect(facelets[36]).toBe('green'); // B
    expect(facelets[27]).toBe('red'); // R
    expect(facelets[9]).toBe('orange'); // L
  });

  it('PLL: TODOS os casos de PLL têm topo 100% amarelo e 12 barras com cores laterais da LL', () => {
    const cases = pllData as AlgorithmCase[];
    expect(cases.length).toBe(21);

    for (const c of cases) {
      const preferredAlg = c.algs[0]?.notation || '';
      const setupMove = c.setupMove || MoveParser.invert(preferredAlg);

      const solved = CubeState.createSolvedFacelets(RESOLUTION_COLORS_GREEN_FRONT);
      const cube = new CubeState(solved);
      cube.applyAlgorithm(setupMove);
      const facelets = cube.getFacelets();

      // Face U (0..8) deve ser SEMPRE 100% amarela em PLL
      for (let i = 0; i < 9; i++) {
        expect(facelets[i], `Caso ${c.id}: facelet U${i} deve ser amarelo`).toBe('yellow');
      }

      // As 12 barras laterais devem conter apenas cores da última camada (azul, verde, vermelho, laranja)
      const sideIndices = [
        38, 37, 36, // Top (B)
        18, 19, 20, // Bottom (F)
        9, 10, 11,  // Left (L)
        29, 28, 27, // Right (R)
      ];

      expect(sideIndices.length).toBe(12);
      for (const idx of sideIndices) {
        expect(['blue', 'green', 'red', 'orange']).toContain(facelets[idx]);
      }
    }
  });

  it('OLL: TODOS os casos de OLL possuem número correto de adesivos amarelos na última camada', () => {
    const cases = ollData as AlgorithmCase[];
    expect(cases.length).toBeGreaterThanOrEqual(12);

    for (const c of cases) {
      const preferredAlg = c.algs[0]?.notation || '';
      const setupMove = c.setupMove || MoveParser.invert(preferredAlg);

      const solved = CubeState.createSolvedFacelets(RESOLUTION_COLORS_GREEN_FRONT);
      const cube = new CubeState(solved);
      cube.applyAlgorithm(setupMove);
      const facelets = cube.getFacelets();

      // Na última camada (U 0..8 + 12 barras laterais), existem EXATAMENTE 9 adesivos amarelos!
      const llIndices = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, // U face
        38, 37, 36, // Top (B)
        18, 19, 20, // Bottom (F)
        9, 10, 11,  // Left (L)
        29, 28, 27, // Right (R)
      ];

      const yellowCount = llIndices.filter(idx => facelets[idx] === 'yellow').length;
      expect(yellowCount, `Caso OLL ${c.id} deve ter exatamente 9 adesivos amarelos na LL`).toBe(9);
    }
  });
});
