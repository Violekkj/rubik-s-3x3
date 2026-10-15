import React, { useState, useCallback } from 'react';
import {
  Copy,
  Check,
  Star,
  StarOff,
  FlipHorizontal,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import { AlgorithmCase, AlgProgressState } from '../../data/algorithms/types';
import { MoveParser } from '../../core/cube/moveParser';
import { AlgCaseNetView } from './AlgCaseNetView';
import { useAlgProgressStore } from '../../stores/algProgressStore';

interface AlgCaseCardProps {
  algCase: AlgorithmCase;
}

const STATUS_LABELS: Record<AlgProgressState['status'], string> = {
  unlearned: 'Não aprendi',
  learning: 'Aprendendo',
  known: 'Sei',
  mastered: 'Dominado',
};

const STATUS_COLORS: Record<AlgProgressState['status'], string> = {
  unlearned: 'bg-cube-surface3 text-cube-textMuted',
  learning: 'bg-yellow-900/60 text-yellow-400 border border-yellow-700/50',
  known: 'bg-blue-900/60 text-blue-400 border border-blue-700/50',
  mastered: 'bg-emerald-900/60 text-emerald-400 border border-emerald-700/50',
};

const STATUS_ORDER: AlgProgressState['status'][] = ['unlearned', 'learning', 'known', 'mastered'];

export const AlgCaseCard: React.FC<AlgCaseCardProps> = ({ algCase }) => {
  const { progress, setCaseStatus, setPreferredAlgIndex, toggleFavorite } = useAlgProgressStore();
  const caseProgress = progress[algCase.id] || {
    status: 'unlearned' as AlgProgressState['status'],
    preferredAlgIndex: 0,
    isFavorite: false,
  };

  const [expanded, setExpanded] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showMirror, setShowMirror] = useState(false);

  const preferredAlg = algCase.algs[caseProgress.preferredAlgIndex] || algCase.algs[0];

  const copyAlg = useCallback(async (notation: string, idx: number) => {
    await navigator.clipboard.writeText(notation);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  }, []);

  const cycleStatus = () => {
    const cur = STATUS_ORDER.indexOf(caseProgress.status);
    const next = STATUS_ORDER[(cur + 1) % STATUS_ORDER.length];
    setCaseStatus(algCase.id, next);
  };

  const setupMove = algCase.setupMove || MoveParser.invert(preferredAlg?.notation || '');
  const displayAlg = showMirror
    ? MoveParser.mirrorLR(preferredAlg?.notation || '')
    : preferredAlg?.notation || '';

  return (
    <div
      id={`alg-card-${algCase.id}`}
      className={`relative flex flex-col bg-cube-surface2 border border-cube-border rounded-2xl overflow-hidden transition-all duration-200 hover:border-cube-cyan/30 hover:shadow-lg hover:shadow-cube-cyanGlow/10 ${
        caseProgress.isFavorite ? 'border-yellow-500/40' : ''
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start gap-3 p-4">
        {/* 2D Diagram */}
        <div className="flex-shrink-0 bg-cube-surface1 rounded-xl p-2 border border-cube-border/60">
          <AlgCaseNetView
            setupMove={setupMove}
            stickerSize={algCase.set === 'f2l' ? 10 : 13}
            mode={algCase.set === 'f2l' ? 'full' : 'll'}
            highlightU
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-cube-textDim uppercase tracking-widest">
              {algCase.id.toUpperCase()}
            </span>
            {algCase.group && (
              <span className="text-[10px] px-1.5 py-0.5 bg-cube-surface3 rounded text-cube-textMuted">
                {algCase.group}
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm text-white leading-tight truncate">{algCase.name}</h3>
          <p className="text-[11px] text-cube-textMuted mt-0.5 leading-snug line-clamp-2">
            {algCase.recognition}
          </p>

          {/* Primary alg */}
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <code className="text-[11px] font-mono text-cube-cyan bg-cube-surface1 px-2 py-1 rounded-lg border border-cube-border/60 select-all leading-tight">
              {displayAlg}
            </code>
            <span className="text-[10px] text-cube-textDim">
              {preferredAlg?.moveCountHTM} HTM
            </span>
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center gap-1.5 px-4 pb-3">
        {/* Copy */}
        <button
          id={`btn-copy-${algCase.id}`}
          onClick={() => copyAlg(displayAlg, 0)}
          title="Copiar algoritmo"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cube-surface1 hover:bg-cube-surface3 text-cube-textMuted hover:text-white text-xs transition-colors"
        >
          {copiedIdx === 0 ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Mirror */}
        <button
          id={`btn-mirror-${algCase.id}`}
          onClick={() => setShowMirror(!showMirror)}
          title={showMirror ? 'Mostrar original' : 'Mostrar espelho (LR)'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
            showMirror
              ? 'bg-cube-cyan/20 text-cube-cyan border border-cube-cyan/30'
              : 'bg-cube-surface1 hover:bg-cube-surface3 text-cube-textMuted hover:text-white'
          }`}
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Favorite */}
        <button
          id={`btn-fav-${algCase.id}`}
          onClick={() => toggleFavorite(algCase.id)}
          title={caseProgress.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
            caseProgress.isFavorite
              ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/40'
              : 'bg-cube-surface1 hover:bg-cube-surface3 text-cube-textMuted hover:text-white'
          }`}
        >
          {caseProgress.isFavorite ? (
            <Star className="w-3.5 h-3.5 fill-yellow-400" />
          ) : (
            <StarOff className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Status Cycle */}
        <button
          id={`btn-status-${algCase.id}`}
          onClick={cycleStatus}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${STATUS_COLORS[caseProgress.status]}`}
          title="Clique para avançar status de aprendizado"
        >
          <BookOpen className="w-3 h-3" />
          {STATUS_LABELS[caseProgress.status]}
        </button>

        {/* Expand/Collapse alternatives */}
        {algCase.algs.length > 1 && (
          <button
            id={`btn-expand-${algCase.id}`}
            onClick={() => setExpanded(!expanded)}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cube-surface1 hover:bg-cube-surface3 text-cube-textMuted hover:text-white text-xs transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{algCase.algs.length} algs</span>
          </button>
        )}
      </div>

      {/* Expanded: alternatives */}
      {expanded && (
        <div className="border-t border-cube-border px-4 pt-3 pb-4 flex flex-col gap-2 animate-fadeIn">
          <p className="text-[10px] font-bold text-cube-textDim uppercase tracking-wider mb-1">
            Alternativas
          </p>
          {algCase.algs.map((alg, idx) => {
            const mirroredAlg = showMirror ? MoveParser.mirrorLR(alg.notation) : alg.notation;
            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  caseProgress.preferredAlgIndex === idx
                    ? 'border-cube-cyan/40 bg-cube-cyan/5'
                    : 'border-cube-border bg-cube-surface1 hover:border-cube-cyan/20'
                }`}
                onClick={() => setPreferredAlgIndex(algCase.id, idx)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-cube-textDim">
                      #{alg.popularityRank}
                    </span>
                    <span className="text-[10px] text-cube-textMuted">{alg.label}</span>
                    <span className="text-[10px] text-cube-textDim ml-auto">{alg.moveCountHTM} HTM</span>
                  </div>
                  <code className="text-[11px] font-mono text-cube-cyan block mt-1 select-all">
                    {mirroredAlg}
                  </code>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyAlg(mirroredAlg, idx + 10); }}
                    className="p-1.5 rounded-lg hover:bg-cube-surface2 text-cube-textMuted hover:text-white transition-colors"
                  >
                    {copiedIdx === idx + 10 ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  {caseProgress.preferredAlgIndex === idx && (
                    <Pencil className="w-3 h-3 text-cube-cyan" />
                  )}
                </div>
              </div>
            );
          })}

          {/* Sources */}
          <div className="mt-1 flex gap-1.5 flex-wrap">
            {algCase.algs[caseProgress.preferredAlgIndex]?.sources.map((src) => (
              <a
                key={src.url}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cube-textMuted hover:text-cube-cyan underline underline-offset-2 transition-colors"
              >
                {src.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
