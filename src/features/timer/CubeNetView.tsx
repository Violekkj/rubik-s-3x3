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

  // Dimensões compactas do SVG:
  // Cada sticker: 16x16 px, raio rx=3px
  // Gap entre stickers na mesma face: 2px
  // Tamanho de uma face 3x3: 3*16 + 2*2 = 52px
  // Gap entre faces: 4px
  // Largura total (4 faces L-F-R-B): 4*52 + 3*4 = 220px
  // Altura total (3 faces U-F-D): 3*52 + 2*4 = 164px
  const STICKER_SIZE = 16;
  const STICKER_GAP = 2;
  const FACE_GAP = 4;
  const FACE_SIZE = 3 * STICKER_SIZE + 2 * STICKER_GAP; // 52px

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
            rx={3}
            ry={3}
            fill={getColorHex(color)}
          />
        );
      }
    }

    return rects;
  };

  const svgWidth = 4 * FACE_SIZE + 3 * FACE_GAP; // 220px
  const svgHeight = 3 * FACE_SIZE + 2 * FACE_GAP; // 164px

  return (
    <div
      id="scramble-preview-panel"
      className="inline-flex flex-col items-center bg-cube-surface1/80 backdrop-blur-sm border border-cube-border/70 rounded-xl px-2.5 py-1 shadow-lg select-none transition-all duration-200"
    >
      {/* Botão colapsável compacto */}
      <button
        id="btn-toggle-scramble-net"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1 text-[11px] font-semibold text-cube-textMuted hover:text-cube-cyan transition-colors py-0.5 px-2 rounded-md hover:bg-cube-surface2/50"
        title={isCollapsed ? 'Expandir visualização do cubo' : 'Recolher visualização do cubo'}
      >
        <span>Preview do Cubo</span>
        {isCollapsed ? <ChevronDown className="w-3 h-3 text-cube-textDim" /> : <ChevronUp className="w-3 h-3 text-cube-textDim" />}
      </button>

      {/* SVG do Cubo Planificado */}
      {!isCollapsed && (
        <div className="mt-1 flex items-center justify-center p-1 animate-fadeIn">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width={svgWidth}
            height={svgHeight}
            className="overflow-visible drop-shadow-sm max-w-[240px]"
            aria-label="Cubo planificado em 2D"
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
