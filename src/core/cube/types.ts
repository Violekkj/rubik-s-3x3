export type FaceLetter = 'U' | 'L' | 'F' | 'R' | 'B' | 'D';

export type CubeColor = 'white' | 'orange' | 'green' | 'red' | 'blue' | 'yellow';

export interface FaceletCoordinate {
  face: FaceLetter;
  index: number; // 0 to 8
  pos: [number, number, number]; // [x, y, z] in {-1, 0, 1}
  normal: [number, number, number]; // [nx, ny, nz]
}

export type CubeFacelets = CubeColor[]; // Array of 54 colors in order: U(0..8), L(9..17), F(18..26), R(27..35), B(36..44), D(45..53)

export type MoveName =
  | 'U' | 'U\'' | 'U2'
  | 'D' | 'D\'' | 'D2'
  | 'L' | 'L\'' | 'L2'
  | 'R' | 'R\'' | 'R2'
  | 'F' | 'F\'' | 'F2'
  | 'B' | 'B\'' | 'B2'
  | 'M' | 'M\'' | 'M2'
  | 'E' | 'E\'' | 'E2'
  | 'S' | 'S\'' | 'S2'
  | 'x' | 'x\'' | 'x2'
  | 'y' | 'y\'' | 'y2'
  | 'z' | 'z\'' | 'z2'
  | 'Rw' | 'Rw\'' | 'Rw2' | 'r' | 'r\'' | 'r2'
  | 'Lw' | 'Lw\'' | 'Lw2' | 'l' | 'l\'' | 'l2'
  | 'Uw' | 'Uw\'' | 'Uw2' | 'u' | 'u\'' | 'u2'
  | 'Dw' | 'Dw\'' | 'Dw2' | 'd' | 'd\'' | 'd2'
  | 'Fw' | 'Fw\'' | 'Fw2' | 'f' | 'f\'' | 'f2'
  | 'Bw' | 'Bw\'' | 'Bw2' | 'b' | 'b\'' | 'b2';
