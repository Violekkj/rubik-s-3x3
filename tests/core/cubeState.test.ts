import { describe, it, expect } from 'vitest';
import { CubeState } from '../../src/core/cube/CubeState';
import { MoveParser } from '../../src/core/cube/moveParser';
import { MoveName } from '../../src/core/cube/types';

describe('CubeState — Modelo Matemático de 54 Facelets', () => {
  it('inicializa no estado resolvido', () => {
    const cube = new CubeState();
    expect(cube.isSolved()).toBe(true);
    expect(cube.getFacelets().length).toBe(54);
  });

  it('X^4 = Identidade para cada uma das 6 faces (U, D, L, R, F, B)', () => {
    const faces: MoveName[] = ['U', 'D', 'L', 'R', 'F', 'B'];
    for (const face of faces) {
      const cube = new CubeState();
      for (let i = 0; i < 4; i++) {
        cube.applyMove(face);
      }
      expect(cube.isSolved(), `Face ${face}^4 deveria ser a identidade`).toBe(true);
    }
  });

  it('X * X\' = Identidade para todas as rotações', () => {
    const moves: [MoveName, MoveName][] = [
      ['U', 'U\''],
      ['D', 'D\''],
      ['L', 'L\''],
      ['R', 'R\''],
      ['F', 'F\''],
      ['B', 'B\''],
      ['M', 'M\''],
      ['E', 'E\''],
      ['S', 'S\''],
      ['Rw', 'Rw\''],
    ];

    for (const [m, mPrime] of moves) {
      const cube = new CubeState();
      cube.applyMove(m);
      expect(cube.isSolved()).toBe(false);
      cube.applyMove(mPrime);
      expect(cube.isSolved(), `${m} * ${mPrime} deve retornar ao resolvido`).toBe(true);
    }
  });

  it('Scramble + Inverso = Resolvido', () => {
    const scramble = 'R U R\' F\' U2 D B2 R2 L F\' D2 B\'';
    const inverted = MoveParser.invert(scramble);

    const cube = new CubeState();
    cube.applyAlgorithm(scramble);
    expect(cube.isSolved()).toBe(false);

    cube.applyAlgorithm(inverted);
    expect(cube.isSolved()).toBe(true);
  });

  it('Sexy Move (R U R\' U\') possui ordem exatamente 6', () => {
    const sexy = 'R U R\' U\'';
    const cube = new CubeState();

    for (let i = 1; i <= 5; i++) {
      cube.applyAlgorithm(sexy);
      expect(cube.isSolved(), `Repetição ${i} do sexy move não pode estar resolvida`).toBe(false);
    }

    cube.applyAlgorithm(sexy); // 6ª repetição
    expect(cube.isSolved(), '6ª repetição do sexy move deve resolver o cubo').toBe(true);
  });

  it('Sune (R U R\' U R U2 R\') possui ordem exatamente 6', () => {
    const sune = 'R U R\' U R U2 R\'';
    const cube = new CubeState();

    for (let i = 1; i <= 5; i++) {
      cube.applyAlgorithm(sune);
      expect(cube.isSolved(), `Repetição ${i} do Sune não pode estar resolvida`).toBe(false);
    }

    cube.applyAlgorithm(sune); // 6ª repetição
    expect(cube.isSolved(), '6ª repetição do Sune deve resolver o cubo').toBe(true);
  });

  it('T-Perm (R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\') possui ordem exatamente 2', () => {
    const tPerm = 'R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\'';
    const cube = new CubeState();

    cube.applyAlgorithm(tPerm);
    expect(cube.isSolved(), '1 aplicação do T-Perm não deve estar resolvida').toBe(false);

    cube.applyAlgorithm(tPerm); // 2ª aplicação
    expect(cube.isSolved(), '2ª aplicação do T-Perm deve resolver o cubo').toBe(true);
  });

  it('Superflip inverte as 12 arestas mantendo cantos e centros intactos', () => {
    const superflip = 'U R2 F B R B2 R U2 L B2 R U\' D\' R2 F R\' L B2 U2 F2';
    const cube = new CubeState();
    cube.applyAlgorithm(superflip);

    expect(cube.isSolved()).toBe(false);

    const facelets = cube.getFacelets();
    // Centros continuam resolvidos
    expect(facelets[4]).toBe('white');   // U center
    expect(facelets[13]).toBe('orange'); // L center
    expect(facelets[22]).toBe('green');  // F center
    expect(facelets[31]).toBe('red');    // R center
    expect(facelets[40]).toBe('blue');   // B center
    expect(facelets[49]).toBe('yellow'); // D center

    // Cantos continuam com a cor de suas respectivas faces
    // U corners: 0, 2, 6, 8
    expect(facelets[0]).toBe('white');
    expect(facelets[2]).toBe('white');
    expect(facelets[6]).toBe('white');
    expect(facelets[8]).toBe('white');

    // D corners: 45, 47, 51, 53
    expect(facelets[45]).toBe('yellow');
    expect(facelets[47]).toBe('yellow');
    expect(facelets[51]).toBe('yellow');
    expect(facelets[53]).toBe('yellow');

    // As arestas de U estão invertidas (não são brancas)
    expect(facelets[1]).not.toBe('white');
    expect(facelets[3]).not.toBe('white');
    expect(facelets[5]).not.toBe('white');
    expect(facelets[7]).not.toBe('white');

    // Aplicar o superflip uma segunda vez retorna ao resolvido (ordem 2)
    cube.applyAlgorithm(superflip);
    expect(cube.isSolved()).toBe(true);
  });
});
