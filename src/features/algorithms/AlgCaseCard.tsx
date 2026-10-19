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
  CheckCircle2,
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
  unlearned: 'bg-cube-surface3 text-cube-textMuted border-cube-border/60',
  learning: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50',
  known: 'bg-blue-900/40 text-blue-400 border-blue-700/50',
  mastered: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
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
  const [isRecogExpanded, setIsRecogExpanded] = useState(false);

  const preferredAlg = algCase.algs[caseProgress.preferredAlgIndex] || algCase.algs[0];

  const copyAlg = useCallback(async (notation: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(notation);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1800);
    } catch {
      // Fallback
    }
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
      className={`relative flex flex-col bg-cube-surface2 border rounded-2xl transition-all duration-200 hover:border-cube-cyan/40 hover:shadow-xl hover:shadow-cube-cyanGlow/5 [container-type:inline-size] ${
        caseProgress.isFavorite ? 'border-yellow-500/50 shadow-md shadow-yellow-500/10' : 'border-cube-border'
      }`}
    >
      {/* Topo do Card: Diagrama 2D + Informações */}
      <div className="flex items-start gap-3 p-4">
        {/* Diagrama 2D Amarelo no Topo (~64–72px) */}
        <div className="flex-shrink-0 bg-cube-surface1 rounded-xl p-1.5 border border-cube-border/60 flex items-center justify-center">
          <AlgCaseNetView
            setupMove={setupMove}
            algSet={algCase.set}
            className="w-16 h-16 sm:w-[68px] sm:h-[68px]"
          />
        </div>

        {/* Detalhes do Caso */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-[11px] font-extrabold text-cube-textDim uppercase tracking-wider">
              {algCase.id.toUpperCase()}
            </span>
            {algCase.group && (
              <span className="text-[10px] px-1.5 py-0.5 bg-cube-surface3 rounded text-cube-textMuted font-medium truncate max-w-[180px]">
                {algCase.group}
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-sm text-white leading-tight truncate">
            {algCase.name}
          </h3>

          {/* Texto de reconhecimento com "ver mais" expansível */}
          <div className="mt-1">
            <p
              className={`text-[11px] text-cube-textMuted leading-relaxed transition-all ${
                isRecogExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {algCase.recognition}
            </p>
            {algCase.recognition && algCase.recognition.length > 55 && (
              <button
                onClick={() => setIsRecogExpanded(!isRecogExpanded)}
                className="text-[10px] text-cube-cyan hover:underline font-semibold mt-0.5"
              >
                {isRecogExpanded ? 'ver menos' : 'ver mais'}
              </button>
            )}
          </div>

          {/* Algoritmo Principal em Fonte Mono com Quebra Segura */}
          <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
            <code className="text-xs font-mono text-cube-cyan bg-cube-surface1 px-2.5 py-1.5 rounded-lg border border-cube-border/60 select-all leading-normal [overflow-wrap:anywhere] break-words">
              {displayAlg}
            </code>
            <span className="text-[10px] text-cube-textDim font-medium flex-shrink-0">
              {preferredAlg?.moveCountHTM} HTM
            </span>
          </div>
        </div>
      </div>

      {/* Rodapé de Ações com flex-wrap: Nenhum botão cortado */}
      <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
        {/* Copiar (32x32px) */}
        <button
          id={`btn-copy-${algCase.id}`}
          onClick={() => copyAlg(displayAlg, 0)}
          aria-label="Copiar algoritmo"
          title="Copiar algoritmo"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-cube-surface1 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border border-cube-border/70 transition-colors flex-shrink-0"
        >
          {copiedIdx === 0 ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Espelhar LR (32x32px) */}
        <button
          id={`btn-mirror-${algCase.id}`}
          onClick={() => setShowMirror(!showMirror)}
          aria-label={showMirror ? 'Mostrar algoritmo original' : 'Espelhar algoritmo (LR)'}
          title={showMirror ? 'Mostrar original' : 'Espelhar (LR)'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0 ${
            showMirror
              ? 'bg-cube-cyan/20 text-cube-cyan border-cube-cyan/40'
              : 'bg-cube-surface1 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border-cube-border/70'
          }`}
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Favoritar (32x32px) */}
        <button
          id={`btn-fav-${algCase.id}`}
          onClick={() => toggleFavorite(algCase.id)}
          aria-label={caseProgress.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          title={caseProgress.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0 ${
            caseProgress.isFavorite
              ? 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50'
              : 'bg-cube-surface1 hover:bg-cube-surface3 text-cube-textMuted hover:text-white border-cube-border/70'
          }`}
        >
          {caseProgress.isFavorite ? (
            <Star className="w-3.5 h-3.5 fill-yellow-400" />
          ) : (
            <StarOff className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Chip de Status de Aprendizado Compacto */}
        <button
          id={`btn-status-${algCase.id}`}
          onClick={cycleStatus}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${STATUS_COLORS[caseProgress.status]}`}
          title="Clique para alternar o status de aprendizado"
        >
          <BookOpen className="w-3 h-3" />
          <span>{STATUS_LABELS[caseProgress.status]}</span>
        </button>

        {/* Botão de Alternativas: Sempre visível, ocupa linha dedicada quando estreito */}
        {algCase.algs.length > 1 && (
          <button
            id={`btn-expand-${algCase.id}`}
            onClick={() => setExpanded(!expanded)}
            aria-label={`${expanded ? 'Recolher' : 'Ver'} ${algCase.algs.length} alternativas`}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-cube-surface1 hover:bg-cube-surface3 text-cube-textMuted hover:text-white text-xs font-semibold border border-cube-border/70 transition-colors @[340px]:ml-auto w-full @[340px]:w-auto mt-1 @[340px]:mt-0"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{algCase.algs.length} alternativas</span>
          </button>
        )}
      </div>

      {/* Acordeão Inline de Alternativas */}
      {expanded && (
        <div className="border-t border-cube-border bg-cube-surface1/60 px-4 pt-3 pb-4 flex flex-col gap-2 animate-fadeIn rounded-b-2xl">
          <p className="text-[10px] font-bold text-cube-textDim uppercase tracking-wider mb-1">
            Algoritmos Alternativos
          </p>
          {algCase.algs.map((alg, idx) => {
            const mirroredAlg = showMirror ? MoveParser.mirrorLR(alg.notation) : alg.notation;
            const isPreferred = caseProgress.preferredAlgIndex === idx;

            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isPreferred
                    ? 'border-cube-cyan/50 bg-cube-cyan/10 shadow-sm'
                    : 'border-cube-border bg-cube-surface2 hover:border-cube-cyan/30'
                }`}
                onClick={() => setPreferredAlgIndex(algCase.id, idx)}
                title="Clique para definir como algoritmo padrão deste caso"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-cube-textDim">
                      #{alg.popularityRank}
                    </span>
                    <span className="text-[10px] font-semibold text-cube-text">
                      {alg.label}
                    </span>
                    <span className="text-[10px] text-cube-textDim ml-auto font-mono">
                      {alg.moveCountHTM} HTM
                    </span>
                  </div>
                  <code className="text-xs font-mono text-cube-cyan block mt-1 select-all [overflow-wrap:anywhere] break-words">
                    {mirroredAlg}
                  </code>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyAlg(mirroredAlg, idx + 10);
                    }}
                    aria-label="Copiar algoritmo alternativo"
                    title="Copiar algoritmo"
                    className="p-1.5 rounded-lg hover:bg-cube-surface3 text-cube-textMuted hover:text-white transition-colors"
                  >
                    {copiedIdx === idx + 10 ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isPreferred && (
                    <span title="Algoritmo preferido ativo">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cube-cyan" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Links para fontes externas confiáveis */}
          <div className="mt-1 flex gap-2 flex-wrap items-center">
            <span className="text-[10px] text-cube-textDim">Fontes:</span>
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
