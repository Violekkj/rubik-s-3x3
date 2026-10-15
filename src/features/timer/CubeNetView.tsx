import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CubeState } from '../../core/cube/CubeState';
import { CubeColor } from '../../core/cube/types';

interface CubeNetViewProps {
  scramble: string;
  customColors?: {
    U: string;
    D: string;
    F: string;
    B: string;
    R: string;
    L: string;
  };
  initialCollapsed?: boolean;
}

const DEFAULT_HEX_COLORS: Record<CubeColor, string> = {
  white: '#F4F4F4',
  yellow: '#FFE600',
  green: '#2BE04B',
  blue: '#1E63FF',
  red: '#FF3B3B',
  orange: '#FF8A1E',
};

export const CubeNetView: React.FC<CubeNetViewProps> = ({
  scramble,
  customColors,
  initialCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  // Computa o estado dos 54 facelets a partir do scramble
  const facelets = useMemo(() => {
    const cube = new CubeState();
    try {
      if (scramble && scramble.trim().length > 0) {
        cube.applyAlgorithm(scramble);
      }
    } catch (e) {
      console.warn('Erro ao aplicar scramble ao modelo de visualização:', e);
    }
    return cube.getFacelets();
  }, [scramble]);

  const getColorHex = (c: CubeColor): string => {
    if (customColors) {
      if (c === 'white' && customColors.U) return customColors.U;
      if (c === 'yellow' && customColors.D) return customColors.D;
      if (c === 'green' && customColors.F) return customColors.F;
      if (c === 'blue' && customColors.B) return customColors.B;
      if (c === 'red' && customColors.R) return customColors.R;
      if (c === 'orange' && customColors.L) return customColors.L;
    }
    return DEFAULT_HEX_COLORS[c] || '#FFFFFF';
  };

  // Dimensões do SVG:
  // Cada sticker: 18x18 px, raio rx=3.5px
  // Gap entre stickers na mesma face: 2px
  // Tamanho de uma face 3x3: 3*18 + 2*2 = 58px
  // Gap entre faces: 6px
  // Largura total (4 faces L-F-R-B): 4*58 + 3*6 = 250px
  // Altura total (3 faces U-F-D): 3*58 + 2*6 = 186px
  const STICKER_SIZE = 18;
  const STICKER_GAP = 2;
  const FACE_GAP = 6;
  const FACE_SIZE = 3 * STICKER_SIZE + 2 * STICKER_GAP; // 58px

  // Posições das faces no plano (coluna 0..3, linha 0..2)
  // U: col 1, linha 0
  // L: col 0, linha 1
  // F: col 1, linha 1
  // R: col 2, linha 1
  // B: col 3, linha 1
  // D: col 1, linha 2
  const facePositions: Record<'U' | 'L' | 'F' | 'R' | 'B' | 'D', { x: number; y: number; startIdx: number }> = {
    U: { x: FACE_SIZE + FACE_GAP, y: 0, startIdx: 0 },
    L: { x: 0, y: FACE_SIZE + FACE_GAP, startIdx: 9 },
    F: { x: FACE_SIZE + FACE_GAP, y: FACE_SIZE + FACE_GAP, startIdx: 18 },
    R: { x: 2 * (FACE_SIZE + FACE_GAP), y: FACE_SIZE + FACE_GAP, startIdx: 27 },
    B: { x: 3 * (FACE_SIZE + FACE_GAP), y: FACE_SIZE + FACE_GAP, startIdx: 36 },
    D: { x: FACE_SIZE + FACE_GAP, y: 2 * (FACE_SIZE + FACE_GAP), startIdx: 45 },
  };

  const renderFaceStickers = (face: 'U' | 'L' | 'F' | 'R' | 'B' | 'D') => {
    const { x: faceX, y: faceY, startIdx } = facePositions[face];
    const rects: React.ReactNode[] = [];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = startIdx + r * 3 + c;
        const color = facelets[idx];
        const sX = faceX + c * (STICKER_SIZE + STICKER_GAP);
        const sY = faceY + r * (STICKER_SIZE + STICKER_GAP);

        rects.push(
          <rect
            key={`${face}-${r}-${c}`}
            x={sX}
            y={sY}
            width={STICKER_SIZE}
            height={STICKER_SIZE}
            rx={3.5}
            ry={3.5}
            fill={getColorHex(color)}
          />
        );
      }
    }

    return rects;
  };

  const svgWidth = 4 * FACE_SIZE + 3 * FACE_GAP; // 250px
  const svgHeight = 3 * FACE_SIZE + 2 * FACE_GAP; // 186px

  return (
    <div
      id="scramble-preview-panel"
      className="inline-flex flex-col items-center bg-cube-surface1/85 backdrop-blur-md border border-cube-border rounded-2xl px-5 py-3 shadow-xl select-none transition-all duration-300"
    >
      {/* Botão colapsável "Scramble ⌄" */}
      <button
        id="btn-toggle-scramble-net"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1.5 text-xs font-semibold text-cube-text hover:text-cube-cyan transition-colors py-1 px-3 rounded-lg hover:bg-cube-surface2/60"
        title="Expandir ou recolher visualização do cubo"
      >
        <span>Scramble</span>
        {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-cube-textMuted" /> : <ChevronUp className="w-3.5 h-3.5 text-cube-textMuted" />}
      </button>

      {/* SVG do Cubo Planificado */}
      {!isCollapsed && (
        <div className="mt-2 flex items-center justify-center p-1 animate-fadeIn">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width={svgWidth}
            height={svgHeight}
            className="overflow-visible drop-shadow-sm"
          >
            {renderFaceStickers('U')}
            {renderFaceStickers('L')}
            {renderFaceStickers('F')}
            {renderFaceStickers('R')}
            {renderFaceStickers('B')}
            {renderFaceStickers('D')}
          </svg>
        </div>
      )}
    </div>
  );
};
