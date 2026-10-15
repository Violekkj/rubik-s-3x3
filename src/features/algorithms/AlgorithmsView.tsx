import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Filter,
  Layers,
  Brain,
  Info,
} from 'lucide-react';
import { AlgSetSelector } from './AlgSetSelector';
import { AlgCaseCard } from './AlgCaseCard';
import { TrainingFlashcards } from './TrainingFlashcards';
import { useAlgProgressStore, FilterStatus } from '../../stores/algProgressStore';
import { AlgorithmCase } from '../../data/algorithms/types';

// Lazy-load algorithm data files
import pllData from '../../data/algorithms/cfop-pll.json';
import ollData from '../../data/algorithms/cfop-oll.json';
import f2lData from '../../data/algorithms/cfop-f2l.json';
import twolookPllData from '../../data/algorithms/2look-pll.json';
import twolookOllData from '../../data/algorithms/2look-oll.json';
import beginnerData from '../../data/algorithms/beginner.json';

const ALL_DATA: Record<string, AlgorithmCase[]> = {
  pll: pllData as AlgorithmCase[],
  oll: ollData as AlgorithmCase[],
  f2l: f2lData as AlgorithmCase[],
  '2look-pll': twolookPllData as AlgorithmCase[],
  '2look-oll': twolookOllData as AlgorithmCase[],
  beginner: beginnerData as AlgorithmCase[],
};

const FILTER_OPTIONS: { id: FilterStatus; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'favorite', label: '⭐ Favoritos' },
  { id: 'unlearned', label: 'Não aprendi' },
  { id: 'learning', label: 'Aprendendo' },
  { id: 'known', label: 'Sei' },
  { id: 'mastered', label: 'Dominado' },
];

// Notation cheat sheet
const NOTATION_CHEATSHEET = [
  { move: 'R U F L D B', desc: 'Faces: Direita, Cima, Frente, Esquerda, Baixo, Atrás' },
  { move: "R' U' F'", desc: "Apóstrofo (') = sentido anti-horário" },
  { move: 'R2 U2 F2', desc: '2 = meia volta (180°)' },
  { move: 'Rw Uw', desc: 'w (wide) = duas camadas juntas' },
  { move: 'r u f', desc: 'Minúscula = mesma coisa que wide' },
  { move: 'M E S', desc: 'Fatias centrais: M entre R/L, E entre U/D, S entre F/B' },
  { move: 'x y z', desc: 'Rotações do cubo inteiro' },
  { move: 'AUF', desc: 'Adjust U Face — girar U antes de aplicar o algoritmo para reconhecer o caso' },
];

export const AlgorithmsView: React.FC = () => {
  const {
    activeSet,
    searchQuery,
    filterStatus,
    selectedGroup,
    viewMode,
    progress,
    setSearchQuery,
    setFilterStatus,
    setSelectedGroup,
    setViewMode,
  } = useAlgProgressStore();

  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const activeCases: AlgorithmCase[] = ALL_DATA[activeSet] || [];

  // Groups unique to current set
  const groups = useMemo(() => {
    const g = new Set(activeCases.map((c) => c.group || '').filter(Boolean));
    return ['all', ...Array.from(g)];
  }, [activeCases]);

  // Filtered & searched cases
  const filteredCases = useMemo(() => {
    let list = activeCases;

    if (selectedGroup !== 'all') {
      list = list.filter((c) => c.group === selectedGroup);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.recognition.toLowerCase().includes(q) ||
          c.algs.some((a) => a.notation.toLowerCase().includes(q))
      );
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'favorite') {
        list = list.filter((c) => progress[c.id]?.isFavorite);
      } else {
        list = list.filter((c) => (progress[c.id]?.status || 'unlearned') === filterStatus);
      }
    }

    return list;
  }, [activeCases, selectedGroup, searchQuery, filterStatus, progress]);

  // Progress summary
  const progressSummary = useMemo(() => {
    const total = activeCases.length;
    const mastered = activeCases.filter((c) => progress[c.id]?.status === 'mastered').length;
    const known = activeCases.filter((c) => progress[c.id]?.status === 'known').length;
    const learning = activeCases.filter((c) => progress[c.id]?.status === 'learning').length;
    return { total, mastered, known, learning };
  }, [activeCases, progress]);

  if (viewMode === 'flashcards') {
    return <TrainingFlashcards cases={filteredCases.length > 0 ? filteredCases : activeCases} onExit={() => setViewMode('cards')} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top toolbar */}
      <div className="flex-shrink-0 border-b border-cube-border bg-cube-surface1/60 backdrop-blur-md px-4 py-3 space-y-3">
        {/* Set Selector */}
        <div className="overflow-x-auto">
          <AlgSetSelector
            caseCounts={Object.fromEntries(Object.entries(ALL_DATA).map(([k, v]) => [k, v.length]))}
          />
        </div>

        {/* Second row: search + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cube-textMuted" />
            <input
              id="alg-search-input"
              type="text"
              placeholder="Buscar por nome, notação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-cube-surface2 border border-cube-border rounded-xl text-xs text-white placeholder-cube-textDim focus:outline-none focus:border-cube-cyan/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cube-textMuted hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            id="btn-alg-filter"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              filterStatus !== 'all' || selectedGroup !== 'all'
                ? 'bg-cube-cyan/20 text-cube-cyan border border-cube-cyan/30'
                : 'bg-cube-surface2 text-cube-textMuted hover:text-white border border-cube-border hover:border-cube-cyan/20'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
          </button>

          {/* Flashcard mode */}
          <button
            id="btn-alg-flashcards"
            onClick={() => setViewMode('flashcards')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cube-surface2 border border-cube-border hover:border-cube-cyan/30 text-cube-textMuted hover:text-white text-xs font-medium transition-colors"
          >
            <Brain className="w-3.5 h-3.5" />
            Treinar
          </button>

          {/* Cheat Sheet */}
          <button
            id="btn-alg-cheatsheet"
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              showCheatSheet
                ? 'bg-cube-cyan/20 text-cube-cyan border border-cube-cyan/30'
                : 'bg-cube-surface2 text-cube-textMuted hover:text-white border border-cube-border hover:border-cube-cyan/20'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Notação
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="space-y-2 animate-fadeIn">
            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  id={`btn-filter-${f.id}`}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                    filterStatus === f.id
                      ? 'bg-cube-cyan text-cube-bg'
                      : 'bg-cube-surface2 text-cube-textMuted hover:text-white border border-cube-border'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Group filter */}
            {groups.length > 2 && (
              <div className="flex gap-1.5 flex-wrap">
                {groups.map((g) => (
                  <button
                    key={g}
                    id={`btn-group-${g}`}
                    onClick={() => setSelectedGroup(g)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                      selectedGroup === g
                        ? 'bg-cube-surface3 text-white border border-cube-cyan/30'
                        : 'bg-cube-surface1 text-cube-textMuted hover:text-white border border-cube-border'
                    }`}
                  >
                    {g === 'all' ? 'Todos os grupos' : g}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress summary */}
        <div className="flex items-center gap-3 text-[10px] text-cube-textDim">
          <span>{filteredCases.length} casos</span>
          <span>·</span>
          <span className="text-emerald-400">{progressSummary.mastered} dominados</span>
          <span>·</span>
          <span className="text-blue-400">{progressSummary.known} sei</span>
          <span>·</span>
          <span className="text-yellow-400">{progressSummary.learning} aprendendo</span>
          {/* Progress bar */}
          <div className="flex-1 h-1.5 bg-cube-surface2 rounded-full overflow-hidden min-w-[60px] ml-1">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{
                width: `${
                  progressSummary.total > 0
                    ? ((progressSummary.mastered + progressSummary.known) / progressSummary.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Cheat sheet panel */}
      {showCheatSheet && (
        <div className="flex-shrink-0 bg-cube-surface2/80 border-b border-cube-border px-4 py-3 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-white">Guia de Notação WCA</h4>
            <button onClick={() => setShowCheatSheet(false)} className="text-cube-textMuted hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
            {NOTATION_CHEATSHEET.map((item) => (
              <div key={item.move} className="flex gap-2 items-start">
                <code className="text-[10px] font-mono text-cube-cyan bg-cube-surface1 px-1.5 py-0.5 rounded flex-shrink-0">
                  {item.move}
                </code>
                <span className="text-[10px] text-cube-textMuted leading-tight">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cases grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-cube-textMuted gap-3">
            <Layers className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">Nenhum caso encontrado</p>
            <p className="text-xs">Tente ajustar os filtros ou a busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-min">
            {filteredCases.map((algCase) => (
              <AlgCaseCard key={algCase.id} algCase={algCase} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
