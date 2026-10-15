import React from 'react';
import { AlgSetId, useAlgProgressStore } from '../../stores/algProgressStore';

const SETS: { id: AlgSetId; label: string; desc: string; count: number; badge?: string }[] = [
  { id: 'pll', label: 'PLL', desc: 'Permutation Last Layer', count: 21, badge: 'CFOP' },
  { id: '2look-pll', label: '2-Look PLL', desc: 'Para iniciantes', count: 6, badge: 'Iniciante' },
  { id: 'oll', label: 'OLL', desc: 'Orientation Last Layer', count: 57, badge: 'CFOP' },
  { id: '2look-oll', label: '2-Look OLL', desc: 'Para iniciantes', count: 9, badge: 'Iniciante' },
  { id: 'f2l', label: 'F2L', desc: 'First Two Layers', count: 41, badge: 'CFOP' },
  { id: 'beginner', label: 'Iniciante', desc: 'Método por camadas', count: 10, badge: 'Básico' },
];

const BADGE_COLORS: Record<string, string> = {
  CFOP: 'bg-cube-cyan/20 text-cube-cyan',
  Iniciante: 'bg-yellow-900/40 text-yellow-400',
  Básico: 'bg-emerald-900/40 text-emerald-400',
};

interface AlgSetSelectorProps {
  caseCounts?: Partial<Record<AlgSetId, number>>;
}

export const AlgSetSelector: React.FC<AlgSetSelectorProps> = ({ caseCounts }) => {
  const { activeSet, setActiveSet } = useAlgProgressStore();

  return (
    <div className="flex gap-2 flex-wrap">
      {SETS.map((s) => {
        const count = caseCounts?.[s.id] ?? s.count;
        const isActive = activeSet === s.id;
        return (
          <button
            key={s.id}
            id={`btn-algset-${s.id}`}
            onClick={() => setActiveSet(s.id)}
            className={`flex flex-col items-start px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200 min-w-[90px] ${
              isActive
                ? 'bg-cube-surface2 border-cube-cyan/50 shadow-md shadow-cube-cyanGlow/15'
                : 'bg-cube-surface1 border-cube-border hover:border-cube-cyan/20 hover:bg-cube-surface2/60'
            }`}
          >
            <div className="flex items-center gap-1.5 w-full">
              <span className={`font-bold text-sm ${isActive ? 'text-cube-cyan' : 'text-white'}`}>
                {s.label}
              </span>
              {s.badge && (
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${BADGE_COLORS[s.badge] || ''}`}>
                  {s.badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-cube-textMuted leading-none">{s.desc}</span>
              <span className={`text-[10px] font-semibold ml-auto ${isActive ? 'text-cube-cyan' : 'text-cube-textDim'}`}>
                {count}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
