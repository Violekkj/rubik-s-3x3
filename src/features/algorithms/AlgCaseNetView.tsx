import React, { useMemo } from 'react';
import {
  CubeState,
  RESOLUTION_COLORS_GREEN_FRONT,
  RESOLUTION_COLORS_BLUE_FRONT,
} from '../../core/cube/CubeState';
import { CubeColor } from '../../core/cube/types';
import { useSettingsStore } from '../../stores/settingsStore';

export interface AlgCaseNetViewProps {
  /** Sequência que CONFIGURA o caso (setup move = inverso do alg). Vazio para cubo resolvido. */
  setupMove?: string;
  /** Conjunto do algoritmo para estilização específica (PLL, OLL, F2L, etc.) */
  algSet?: 'pll' | 'oll' | 'f2l' | '2look-oll' | '2look-pll' | 'beginner' | string;
  /** Orientação da frente: verde (padrão) ou azul */
  frontColor?: 'green' | 'blue';
  /** Tamanho do sticker central em px (padrão 13) */
  stickerSize?: number;
  className?: string;
}

const HEX_COLORS: Record<CubeColor, string> = {
  white: '#F4F4F4',
  yellow: '#FFE600',
  green: '#2BE04B',
  blue: '#1E63FF',
  red: '#FF3B3B',
  orange: '#FF8A1E',
};

const UNORIENTED_GRAY = '#262a33';

// Cache global em memória para os ~120 casos (renderização instantânea 0ms)
const faceletCache = new Map<string, CubeColor[]>();

function getComputedFacelets(setupMove: string, front: 'green' | 'blue'): CubeColor[] {
  const cacheKey = `${setupMove.trim()}_${front}`;
  const cached = faceletCache.get(cacheKey);
  if (cached) return cached;

  const orientation =
    front === 'blue' ? RESOLUTION_COLORS_BLUE_FRONT : RESOLUTION_COLORS_GREEN_FRONT;
  const solvedFacelets = CubeState.createSolvedFacelets(orientation);
  const cube = new CubeState(solvedFacelets);

  if (setupMove && setupMove.trim().length > 0) {
    try {
      cube.applyAlgorithm(setupMove);
    } catch {
      // Deixa resolvido se houver notação inválida
    }
  }

  const result = cube.getFacelets();
  faceletCache.set(cacheKey, result);
  return result;
}

export const AlgCaseNetView: React.FC<AlgCaseNetViewProps> = ({
  setupMove = '',
  algSet = 'pll',
  frontColor,
  stickerSize = 13,
  className = '',
}) => {
  const { settings } = useSettingsStore();
  const effectiveFrontColor = frontColor || settings.diagramFrontColor || 'green';

  const facelets = useMemo(() => {
    return getComputedFacelets(setupMove, effectiveFrontColor);
  }, [setupMove, effectiveFrontColor]);

  const isOLL = algSet === 'oll' || algSet === '2look-oll';
  const isF2L = algSet === 'f2l';

  // ==========================================
  // RENDERIZADOR ISOMÉTRICO PARA F2L
  // ==========================================
  if (isF2L) {
    // Projeção isométrica estilizada das faces U, F, R
    // Ângulo 30°: cos(30°) ≈ 0.866, sin(30°) = 0.5
    const isoSize = 9;
    const cos30 = 0.866025;
    const sin30 = 0.5;
    const originX = 36;
    const originY = 22;

    const projectPoint = (x: number, y: number, z: number): [number, number] => {
      const px = originX + (x - z) * isoSize * cos30;
      const py = originY + (x + z) * isoSize * sin30 - y * isoSize;
      return [px, py];
    };

    const makePolygon = (
      p0: [number, number, number],
      p1: [number, number, number],
      p2: [number, number, number],
      p3: [number, number, number],
      color: string
    ) => {
      const [x0, y0] = projectPoint(...p0);
      const [x1, y1] = projectPoint(...p1);
      const [x2, y2] = projectPoint(...p2);
      const [x3, y3] = projectPoint(...p3);
      const points = `${x0.toFixed(1)},${y0.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}`;
      return (
        <polygon
          key={points}
          points={points}
          fill={color}
          stroke="#111622"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      );
    };

    const polygons: React.ReactNode[] = [];

    // Face U (y = 3, z de 0 a 3, x de 0 a 3)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const uIdx = r * 3 + c;
        const color = facelets[uIdx];
        const isTargetPiece = (r === 2 && c === 2) || (r === 1 && c === 2) || (r === 2 && c === 1);
        const fill = isTargetPiece ? HEX_COLORS[color] : color === 'yellow' ? '#FFE600' : UNORIENTED_GRAY;

        polygons.push(
          makePolygon(
            [c, 3, r],
            [c + 0.9, 3, r],
            [c + 0.9, 3, r + 0.9],
            [c, 3, r + 0.9],
            fill
          )
        );
      }
    }

    // Face F (z = 3, x de 0 a 3, y de 3 a 0)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const fIdx = 18 + r * 3 + c;
        const color = facelets[fIdx];
        const yTop = 3 - r;
        const yBot = yTop - 0.9;
        const isFRSlot = c === 2; // Coluna frontal-direita
        const fill = isFRSlot ? HEX_COLORS[color] : UNORIENTED_GRAY;

        polygons.push(
          makePolygon(
            [c, yTop, 3],
            [c + 0.9, yTop, 3],
            [c + 0.9, yBot, 3],
            [c, yBot, 3],
            fill
          )
        );
      }
    }

    // Face R (x = 3, z de 3 a 0, y de 3 a 0)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const rIdx = 27 + r * 3 + (2 - c);
        const color = facelets[rIdx];
        const yTop = 3 - r;
        const yBot = yTop - 0.9;
        const isFRSlot = c === 2; // Coluna direita-frontal
        const fill = isFRSlot ? HEX_COLORS[color] : UNORIENTED_GRAY;

        polygons.push(
          makePolygon(
            [3, yTop, 2 - c + 0.9],
            [3, yTop, 2 - c],
            [3, yBot, 2 - c],
            [3, yBot, 2 - c + 0.9],
            fill
          )
        );
      }
    }

    return (
      <svg
        viewBox="0 0 72 72"
        width={72}
        height={72}
        className={`overflow-visible select-none ${className}`}
        aria-label="Diagrama 2D do caso F2L"
      >
        {polygons}
      </svg>
    );
  }

  // ==========================================
  // RENDERIZADOR LL: TOPO AMARELO + 12 BARRAS LATERAIS
  // ==========================================
  // Dimensões do grid 3x3:
  const gap = 2;
  const faceSize = 3 * stickerSize + 2 * gap; // 43px
  const barThickness = 5;
  const barGap = 2.5;
  const margin = 14;

  const uX = margin;
  const uY = margin;
  const totalSize = 2 * margin + faceSize; // 71px

  // Adesivos da Face U (3x3 central)
  const renderUStickers = () => {
    const rects: React.ReactNode[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const uIdx = r * 3 + c;
        const color = facelets[uIdx];

        let fill: string;
        if (isOLL) {
          // OLL: amarelo se orientado, cinza escuro se não orientado
          fill = color === 'yellow' ? '#FFE600' : UNORIENTED_GRAY;
        } else {
          // PLL / Geral: topo sempre 100% amarelo
          fill = '#FFE600';
        }

        const sX = uX + c * (stickerSize + gap);
        const sY = uY + r * (stickerSize + gap);

        rects.push(
          <rect
            key={`u-${r}-${c}`}
            x={sX}
            y={sY}
            width={stickerSize}
            height={stickerSize}
            rx={2.5}
            fill={fill}
            stroke="#1a202c"
            strokeWidth="0.5"
          />
        );
      }
    }
    return rects;
  };

  // 12 Barras Laterais (Top/Back, Bottom/Front, Left, Right)
  // Top: Face B (c=2 esquerda, c=1 meio, c=0 direita)
  const topBars = [
    { c: 0, idx: 38 }, // B c=2
    { c: 1, idx: 37 }, // B c=1
    { c: 2, idx: 36 }, // B c=0
  ];

  // Bottom: Face F (c=0 esquerda, c=1 meio, c=2 direita)
  const bottomBars = [
    { c: 0, idx: 18 }, // F c=0
    { c: 1, idx: 19 }, // F c=1
    { c: 2, idx: 20 }, // F c=2
  ];

  // Left: Face L (c=0 topo, c=1 meio, c=2 base)
  const leftBars = [
    { r: 0, idx: 9 },  // L c=0
    { r: 1, idx: 10 }, // L c=1
    { r: 2, idx: 11 }, // L c=2
  ];

  // Right: Face R (c=2 topo, c=1 meio, c=0 base)
  const rightBars = [
    { r: 0, idx: 29 }, // R c=2
    { r: 1, idx: 28 }, // R c=1
    { r: 2, idx: 27 }, // R c=0
  ];

  const getSideBarFill = (idx: number): string => {
    const color = facelets[idx];
    if (isOLL) {
      // OLL: barra amarela somente se o adesivo lateral for amarelo; senão cinza
      return color === 'yellow' ? '#FFE600' : UNORIENTED_GRAY;
    }
    // PLL: cores reais da face
    return HEX_COLORS[color] || '#FFE600';
  };

  return (
    <svg
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      width={totalSize}
      height={totalSize}
      className={`overflow-visible select-none drop-shadow-sm ${className}`}
      aria-label="Diagrama 2D do algoritmo CFOP com topo amarelo"
    >
      {/* 1. Face U 3x3 Amarela */}
      {renderUStickers()}

      {/* 2. Barras Superiores (Back) */}
      {topBars.map(bar => {
        const x = uX + bar.c * (stickerSize + gap);
        const y = uY - barThickness - barGap;
        return (
          <rect
            key={`top-bar-${bar.c}`}
            x={x}
            y={y}
            width={stickerSize}
            height={barThickness}
            rx={2}
            fill={getSideBarFill(bar.idx)}
            stroke="#1a202c"
            strokeWidth="0.5"
          />
        );
      })}

      {/* 3. Barras Inferiores (Front) */}
      {bottomBars.map(bar => {
        const x = uX + bar.c * (stickerSize + gap);
        const y = uY + faceSize + barGap;
        return (
          <rect
            key={`bot-bar-${bar.c}`}
            x={x}
            y={y}
            width={stickerSize}
            height={barThickness}
            rx={2}
            fill={getSideBarFill(bar.idx)}
            stroke="#1a202c"
            strokeWidth="0.5"
          />
        );
      })}

      {/* 4. Barras Esquerdas (Left) */}
      {leftBars.map(bar => {
        const x = uX - barThickness - barGap;
        const y = uY + bar.r * (stickerSize + gap);
        return (
          <rect
            key={`left-bar-${bar.r}`}
            x={x}
            y={y}
            width={barThickness}
            height={stickerSize}
            rx={2}
            fill={getSideBarFill(bar.idx)}
            stroke="#1a202c"
            strokeWidth="0.5"
          />
        );
      })}

      {/* 5. Barras Direitas (Right) */}
      {rightBars.map(bar => {
        const x = uX + faceSize + barGap;
        const y = uY + bar.r * (stickerSize + gap);
        return (
          <rect
            key={`right-bar-${bar.r}`}
            x={x}
            y={y}
            width={barThickness}
            height={stickerSize}
            rx={2}
            fill={getSideBarFill(bar.idx)}
            stroke="#1a202c"
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
};
