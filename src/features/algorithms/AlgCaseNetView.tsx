import React, { useMemo } from 'react';
import { CubeState } from '../../core/cube/CubeState';
import { CubeColor } from '../../core/cube/types';

interface AlgCaseNetViewProps {
  /** Sequência que CONFIGURA o caso (setup move = inverso do alg). Pode ser '' para cubo resolvido. */
  setupMove?: string;
  /** Tamanho do sticker em px */
  stickerSize?: number;
  /** Mostrar somente a face U (LL view) — para OLL/PLL — ou cruz completa */
  mode?: 'll' | 'full';
  /** Highlight de cantos/arestas (opcional) */
  highlightU?: boolean;
  className?: string;
}

const HEX: Record<CubeColor, string> = {
  white: '#F4F4F4',
  yellow: '#FFE600',
  green: '#2BE04B',
  blue: '#1E63FF',
  red: '#FF3B3B',
  orange: '#FF8A1E',
};

// Dimmed version for non-U faces in LL mode
const DIM: Record<CubeColor, string> = {
  white: '#3a3a3a',
  yellow: '#3a3a3a',
  green: '#3a3a3a',
  blue: '#3a3a3a',
  red: '#3a3a3a',
  orange: '#3a3a3a',
};

export const AlgCaseNetView: React.FC<AlgCaseNetViewProps> = ({
  setupMove = '',
  stickerSize = 14,
  mode = 'll',
  highlightU = true,
  className = '',
}) => {
  const facelets = useMemo(() => {
    const cube = new CubeState();
    try {
      if (setupMove && setupMove.trim().length > 0) {
        cube.applyAlgorithm(setupMove);
      }
    } catch {
      // leave solved
    }
    return cube.getFacelets();
  }, [setupMove]);

  const gap = 1.5;
  const faceSize = 3 * stickerSize + 2 * gap;

  // Face start indices in the 54-facelet array: U=0, L=9, F=18, R=27, B=36, D=45
  const startOf: Record<'U' | 'L' | 'F' | 'R' | 'B' | 'D', number> = {
    U: 0, L: 9, F: 18, R: 27, B: 36, D: 45,
  };

  // For LL view: show U top, and just the top row of L/F/R/B below
  // Full cross: standard cross net

  const renderFace = (
    face: 'U' | 'L' | 'F' | 'R' | 'B' | 'D',
    ox: number,
    oy: number,
    rows = 3,
    startRow = 0,
    dimmed = false
  ) => {
    const rects: React.ReactNode[] = [];
    const si = startOf[face];
    for (let r = startRow; r < startRow + rows; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = si + r * 3 + c;
        const color = facelets[idx] as CubeColor;
        const x = ox + c * (stickerSize + gap);
        const y = oy + (r - startRow) * (stickerSize + gap);
        rects.push(
          <rect
            key={`${face}-${r}-${c}`}
            x={x}
            y={y}
            width={stickerSize}
            height={stickerSize}
            rx={2.5}
            fill={dimmed ? DIM[color] : HEX[color]}
          />
        );
      }
    }
    return rects;
  };

  if (mode === 'll') {
    // LL mode: U face (3x3) + top row of L, F, R, B + nothing else
    // Layout:
    //         [U 3x3]
    //   [L-1] [F-1] [R-1]   (just top row of each side)
    // B is shown at far right (mirrored in a real net) but we simplify to just show U+LFRB-top
    const faceGap = 4;
    const topRowH = stickerSize; // just 1 row of side faces

    const svgW = faceSize + 2 * faceGap;  // some padding
    const svgH = faceSize + faceGap + topRowH + faceGap;

    const uX = 0;
    const uY = 0;
    const sidesY = faceSize + faceGap;

    return (
      <svg
        viewBox={`-${faceGap} -${faceGap} ${svgW + faceGap} ${svgH + faceGap}`}
        width={svgW + faceGap}
        height={svgH + faceGap}
        className={className}
        aria-label="Diagrama 2D da camada superior"
      >
        {/* U face */}
        {renderFace('U', uX, uY)}
        {/* Top rows of L, F, R side faces */}
        {renderFace('L', uX - stickerSize - gap, sidesY, 1, 0, !highlightU)}
        {renderFace('F', uX, sidesY, 1, 0, !highlightU)}
        {renderFace('R', uX + faceSize + gap, sidesY, 1, 0, !highlightU)}
      </svg>
    );
  }

  // Full cross net
  const faceGap = 4;
  const svgW = 4 * faceSize + 3 * faceGap;
  const svgH = 3 * faceSize + 2 * faceGap;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width={svgW}
      height={svgH}
      className={className}
      aria-label="Visualização 2D do cubo planificado"
    >
      {renderFace('U', faceSize + faceGap, 0)}
      {renderFace('L', 0, faceSize + faceGap)}
      {renderFace('F', faceSize + faceGap, faceSize + faceGap)}
      {renderFace('R', 2 * (faceSize + faceGap), faceSize + faceGap)}
      {renderFace('B', 3 * (faceSize + faceGap), faceSize + faceGap)}
      {renderFace('D', faceSize + faceGap, 2 * (faceSize + faceGap))}
    </svg>
  );
};
