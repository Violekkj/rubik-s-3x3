import React, { useState } from 'react';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Shuffle,
} from 'lucide-react';
import { AlgorithmCase, AlgProgressState } from '../../data/algorithms/types';
import { AlgCaseNetView } from './AlgCaseNetView';
import { MoveParser } from '../../core/cube/moveParser';
import { useAlgProgressStore } from '../../stores/algProgressStore';

interface TrainingFlashcardsProps {
  cases: AlgorithmCase[];
  onExit: () => void;
}

const STATUS_LABELS: Record<AlgProgressState['status'], string> = {
  unlearned: 'Não aprendi',
  learning: 'Aprendendo',
  known: 'Sei',
  mastered: 'Dominado',
};

const STATUS_BG: Record<AlgProgressState['status'], string> = {
  unlearned: 'bg-cube-surface3 hover:bg-cube-surface3/80',
  learning: 'bg-yellow-800/60 hover:bg-yellow-700/60 border border-yellow-700/50',
  known: 'bg-blue-800/60 hover:bg-blue-700/60 border border-blue-700/50',
  mastered: 'bg-emerald-800/60 hover:bg-emerald-700/60 border border-emerald-700/50',
};

const STATUS_ORDER: AlgProgressState['status'][] = ['unlearned', 'learning', 'known', 'mastered'];

export const TrainingFlashcards: React.FC<TrainingFlashcardsProps> = ({ cases, onExit }) => {
  const {
    flashcardIndex,
    isFlashcardRevealed,
    progress,
    nextFlashcard,
    prevFlashcard,
    revealFlashcard,
    setCaseStatus,
  } = useAlgProgressStore();

  const [copiedAlg, setCopiedAlg] = useState(false);
  const [shuffledCases, setShuffledCases] = useState<AlgorithmCase[]>(() => [...cases]);
  const [isShuffled, setIsShuffled] = useState(false);

  const totalCases = shuffledCases.length;
  const currentCase = shuffledCases[flashcardIndex % totalCases];

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-cube-textMuted">Nenhum caso disponível para treino.</p>
      </div>
    );
  }

  const caseProgress = progress[currentCase.id] || {
    status: 'unlearned' as AlgProgressState['status'],
    preferredAlgIndex: 0,
  };
  const preferredAlg = currentCase.algs[caseProgress.preferredAlgIndex] || currentCase.algs[0];
  const setupMove = currentCase.setupMove || MoveParser.invert(preferredAlg?.notation || '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(preferredAlg?.notation || '');
    setCopiedAlg(true);
    setTimeout(() => setCopiedAlg(false), 1500);
  };

  const handleShuffle = () => {
    const copy = [...cases];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setShuffledCases(copy);
    setIsShuffled(true);
    nextFlashcard(copy.length);
  };

  const handleStatus = (status: AlgProgressState['status']) => {
    setCaseStatus(currentCase.id, status);
    nextFlashcard(totalCases);
  };

  return (
    <div className="flex flex-col items-center h-full px-4 py-6 gap-5">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <button
          id="btn-flashcard-exit"
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-xs font-medium text-cube-textMuted hover:text-white transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Sair
        </button>

        <span className="text-xs font-semibold text-cube-textDim">
          {flashcardIndex % totalCases + 1} / {totalCases}
        </span>

        <button
          id="btn-flashcard-shuffle"
          onClick={handleShuffle}
          title={isShuffled ? 'Embaralhado!' : 'Embaralhar ordem'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isShuffled
              ? 'bg-cube-cyan/20 text-cube-cyan border border-cube-cyan/30'
              : 'bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white'
          }`}
        >
          <Shuffle className="w-3.5 h-3.5" /> Embaralhar
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xl h-1.5 bg-cube-surface2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cube-cyan to-cyan-400 rounded-full transition-all duration-300"
          style={{ width: `${((flashcardIndex % totalCases + 1) / totalCases) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-xl flex-1 flex flex-col items-center gap-5">
        {/* Diagram + question */}
        <div className="w-full bg-cube-surface2 border border-cube-border rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl">
          <div className="text-xs font-bold text-cube-textDim uppercase tracking-widest">
            {currentCase.id.toUpperCase()} — Qual é o algoritmo?
          </div>

          <div className="bg-cube-surface1 rounded-2xl p-4 border border-cube-border/60">
            <AlgCaseNetView
              setupMove={setupMove}
              stickerSize={20}
              mode={currentCase.set === 'f2l' ? 'full' : 'll'}
              highlightU
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-white">{currentCase.name}</p>
            {currentCase.group && (
              <p className="text-xs text-cube-textMuted mt-0.5">{currentCase.group}</p>
            )}
          </div>

          <p className="text-xs text-cube-textMuted text-center max-w-xs">
            {currentCase.recognition}
          </p>
        </div>

        {/* Reveal */}
        {!isFlashcardRevealed ? (
          <button
            id="btn-flashcard-reveal"
            onClick={revealFlashcard}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-cube-cyan text-cube-bg font-bold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cube-cyanGlow/30 active:scale-95"
          >
            <Eye className="w-4 h-4" />
            Revelar Algoritmo
          </button>
        ) : (
          <div className="w-full flex flex-col items-center gap-4 animate-fadeIn">
            {/* Algorithm revealed */}
            <div className="w-full bg-cube-surface2 border border-cube-cyan/30 rounded-2xl p-5 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <code className="font-mono text-base font-bold text-cube-cyan bg-cube-surface1 px-3 py-2 rounded-xl border border-cube-border select-all">
                  {preferredAlg?.notation}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-cube-surface1 hover:bg-cube-surface3 text-cube-textMuted hover:text-white transition-colors"
                >
                  {copiedAlg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-cube-textDim">
                {preferredAlg?.label} · {preferredAlg?.moveCountHTM} HTM
              </p>
            </div>

            {/* Self-assessment buttons */}
            <p className="text-xs font-semibold text-cube-textMuted">Como foi?</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  id={`btn-flashcard-status-${s}`}
                  onClick={() => handleStatus(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${STATUS_BG[s]} text-white`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Skip */}
            <button
              id="btn-flashcard-next"
              onClick={() => nextFlashcard(totalCases)}
              className="flex items-center gap-1.5 text-xs text-cube-textMuted hover:text-white transition-colors"
            >
              Pular <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center gap-3">
        <button
          id="btn-flashcard-prev"
          onClick={() => prevFlashcard(totalCases)}
          className="p-2.5 rounded-xl bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          id="btn-flashcard-next-nav"
          onClick={() => nextFlashcard(totalCases)}
          className="p-2.5 rounded-xl bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
