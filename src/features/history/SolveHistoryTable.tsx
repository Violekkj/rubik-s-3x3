import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  FolderInput,
  Download,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileQuestion,
} from 'lucide-react';
import { SolveRecord } from '../../data/db';
import { useSolveStore } from '../../stores/solveStore';
import { useSessionStore } from '../../stores/sessionStore';
import { TimeFormatter } from '../../core/timer/timeFormatter';
import { AverageCalculator } from '../../core/stats/averageCalculator';
import { SolveDetailModal } from './SolveDetailModal';
import { ExportImportModal } from './ExportImportModal';

export const SolveHistoryTable: React.FC = () => {
  const { solves, deleteSolve, updateSolve } = useSolveStore();
  const { sessions, activeSessionId, setActiveSessionId } = useSessionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [penaltyFilter, setPenaltyFilter] = useState<'all' | 'valid' | 'plus2' | 'dnf'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'time-asc' | 'time-desc'>(
    'date-desc'
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectSolve, setInspectSolve] = useState<{ solve: SolveRecord; index: number } | null>(
    null
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState(activeSessionId);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Memoiza cálculo de ao5 e ao12 em cada ponto da linha histórica (solves está ordenado cronologicamente)
  const solvesWithAverages = useMemo(() => {
    return solves.map((s, idx) => {
      const window5 = idx >= 4 ? solves.slice(idx - 4, idx + 1) : null;
      const window12 = idx >= 11 ? solves.slice(idx - 11, idx + 1) : null;

      const ao5 = window5 ? AverageCalculator.calculateTrimmedAverage(window5, 5) : null;
      const ao12 = window12 ? AverageCalculator.calculateTrimmedAverage(window12, 12) : null;

      return {
        ...s,
        solveNumber: idx + 1,
        ao5,
        ao12,
      };
    });
  }, [solves]);

  // Filtragem e busca
  const filteredSolves = useMemo(() => {
    let result = [...solvesWithAverages];

    // Filtro de penalidade
    if (penaltyFilter === 'valid') {
      result = result.filter(s => s.penalty === 'none');
    } else if (penaltyFilter === 'plus2') {
      result = result.filter(s => s.penalty === 'plus2');
    } else if (penaltyFilter === 'dnf') {
      result = result.filter(s => s.penalty === 'dnf');
    }

    // Busca por scramble ou nota
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s =>
          s.scramble.toLowerCase().includes(q) ||
          (s.note && s.note.toLowerCase().includes(q))
      );
    }

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return b.createdAt - a.createdAt;
      if (sortBy === 'date-asc') return a.createdAt - b.createdAt;
      if (sortBy === 'time-asc') return a.effectiveTimeMs - b.effectiveTimeMs;
      if (sortBy === 'time-desc') return b.effectiveTimeMs - a.effectiveTimeMs;
      return 0;
    });

    return result;
  }, [solvesWithAverages, penaltyFilter, searchQuery, sortBy]);

  // Solves da página atual
  const totalPages = Math.max(1, Math.ceil(filteredSolves.length / PAGE_SIZE));
  const paginatedSolves = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSolves.slice(start, start + PAGE_SIZE);
  }, [filteredSolves, currentPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedSolves.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    for (const id of Array.from(selectedIds)) {
      await deleteSolve(id);
    }
    setSelectedIds(new Set());
  };

  const handleMoveSelected = async () => {
    if (selectedIds.size === 0 || !targetSessionId) return;
    for (const id of Array.from(selectedIds)) {
      await updateSolve(id, { sessionId: targetSessionId });
    }
    setSelectedIds(new Set());
    setIsMoveModalOpen(false);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Barra de Filtros e Ferramentas Superior */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-4 border-b border-cube-border">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de Sessão na Tela */}
          <select
            value={activeSessionId}
            onChange={e => setActiveSessionId(e.target.value)}
            className="bg-cube-surface2 border border-cube-border rounded-xl px-3 py-2 text-xs font-semibold text-cube-cyan focus:outline-none focus:border-cube-cyan"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id} className="bg-cube-surface2 text-white">
                {s.name}
              </option>
            ))}
          </select>

          {/* Filtro de Penalidade */}
          <div className="flex items-center bg-cube-surface1 rounded-xl border border-cube-border p-0.5 text-xs font-medium">
            <button
              onClick={() => setPenaltyFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                penaltyFilter === 'all' ? 'bg-cube-surface3 text-white' : 'text-cube-textMuted'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setPenaltyFilter('valid')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                penaltyFilter === 'valid' ? 'bg-cube-surface3 text-white' : 'text-cube-textMuted'
              }`}
            >
              OK
            </button>
            <button
              onClick={() => setPenaltyFilter('plus2')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                penaltyFilter === 'plus2' ? 'bg-cube-orange/20 text-cube-orange' : 'text-cube-textMuted'
              }`}
            >
              +2
            </button>
            <button
              onClick={() => setPenaltyFilter('dnf')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                penaltyFilter === 'dnf' ? 'bg-cube-red/20 text-cube-red' : 'text-cube-textMuted'
              }`}
            >
              DNF
            </button>
          </div>

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-cube-surface2 border border-cube-border rounded-xl px-2.5 py-2 text-xs font-medium text-cube-textMuted focus:outline-none"
          >
            <option value="date-desc">Mais recente primeiro</option>
            <option value="date-asc">Mais antigo primeiro</option>
            <option value="time-asc">Menor tempo primeiro</option>
            <option value="time-desc">Maior tempo primeiro</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Campo de Busca */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-cube-textDim" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar scramble ou nota..."
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-cube-textDim focus:outline-none focus:border-cube-cyan"
            />
          </div>

          {/* Botão Exportar / Importar */}
          <button
            id="btn-open-export-modal"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cube-surface2 hover:bg-cube-surface3 border border-cube-border text-xs font-semibold text-cube-text hover:text-white transition-colors"
            title="Backup, exportar e importar"
          >
            <Download className="w-3.5 h-3.5 text-cube-cyan" />
            <span className="hidden sm:inline">Exportar / Importar</span>
          </button>
        </div>
      </div>

      {/* Ações em Lote (quando itens estão selecionados) */}
      {selectedIds.size > 0 && (
        <div className="my-2 p-2.5 bg-cube-cyan/10 border border-cube-cyan/30 rounded-xl flex items-center justify-between text-xs animate-scaleUp">
          <span className="font-semibold text-cube-cyan">
            {selectedIds.size} solve(s) selecionada(s)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMoveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-white border border-cube-border"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Mover de Sessão</span>
            </button>

            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cube-red/20 hover:bg-cube-red text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Solves */}
      <div className="flex-1 overflow-y-auto mt-2 rounded-2xl border border-cube-border bg-cube-surface1/60 backdrop-blur-md">
        {filteredSolves.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-cube-textDim">
            <FileQuestion className="w-12 h-12 mb-3 stroke-1 text-cube-textDim/60" />
            <h4 className="text-base font-bold text-white mb-1">Nenhuma solve encontrada</h4>
            <p className="text-xs max-w-sm">
              Faça algumas resoluções no Timer ou altere os filtros de busca para visualizar o histórico.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-cube-surface2/90 backdrop-blur-md border-b border-cube-border text-cube-textMuted uppercase font-bold text-[10px] tracking-wider z-10 select-none">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedSolves.length > 0 &&
                      paginatedSolves.every(s => selectedIds.has(s.id))
                    }
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="rounded border-cube-border text-cube-cyan focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3 w-14">#</th>
                <th className="p-3">Tempo</th>
                <th className="p-3 hidden sm:table-cell">ao5</th>
                <th className="p-3 hidden md:table-cell">ao12</th>
                <th className="p-3 hidden lg:table-cell">Data</th>
                <th className="p-3">Scramble</th>
                <th className="p-3 w-14 text-center">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cube-border/40 font-mono">
              {paginatedSolves.map(s => {
                const formatted = TimeFormatter.format(s.timeMs, s.penalty);
                const isSelected = selectedIds.has(s.id);

                return (
                  <tr
                    key={s.id}
                    onClick={() => setInspectSolve({ solve: s, index: s.solveNumber })}
                    className={`hover:bg-cube-surface2/60 cursor-pointer transition-colors ${
                      isSelected ? 'bg-cube-cyan/10' : ''
                    }`}
                  >
                    <td
                      className="p-3 text-center"
                      onClick={e => {
                        e.stopPropagation();
                        handleToggleSelect(s.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(s.id)}
                        className="rounded border-cube-border text-cube-cyan focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-semibold text-cube-textDim">{s.solveNumber}</td>
                    <td className="p-3">
                      <span
                        className={`font-bold text-sm ${
                          s.penalty === 'dnf'
                            ? 'text-cube-red'
                            : s.penalty === 'plus2'
                            ? 'text-cube-orange'
                            : 'text-white'
                        }`}
                      >
                        {formatted.display}
                      </span>
                    </td>
                    <td className="p-3 text-cube-textMuted hidden sm:table-cell">
                      {s.ao5 !== null
                        ? s.ao5 === Infinity
                          ? 'DNF'
                          : TimeFormatter.format(s.ao5).display
                        : '—'}
                    </td>
                    <td className="p-3 text-cube-textMuted hidden md:table-cell">
                      {s.ao12 !== null
                        ? s.ao12 === Infinity
                          ? 'DNF'
                          : TimeFormatter.format(s.ao12).display
                        : '—'}
                    </td>
                    <td className="p-3 text-cube-textDim font-sans text-[11px] hidden lg:table-cell">
                      {new Date(s.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3 text-cube-textMuted truncate max-w-xs text-xs">
                      {s.scramble}
                    </td>
                    <td className="p-3 text-center">
                      {s.note ? (
                        <span title={s.note} className="inline-block text-cube-cyan">
                          <MessageSquare className="w-3.5 h-3.5 inline" />
                        </span>
                      ) : (
                        <span className="text-cube-textDim/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Barra de Paginação Inferior */}
      {filteredSolves.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-3 text-xs text-cube-textDim select-none">
          <span>
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredSolves.length)} de{' '}
            {filteredSolves.length} solves
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalhe da Solve */}
      <SolveDetailModal
        solve={inspectSolve?.solve || null}
        solveIndex={inspectSolve?.index || 0}
        isOpen={inspectSolve !== null}
        onClose={() => setInspectSolve(null)}
        onUpdateSolve={updateSolve}
        onDeleteSolve={deleteSolve}
      />

      {/* Modal Exportar / Importar */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Modal Mover de Sessão */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scaleUp">
            <h4 className="text-sm font-bold text-white mb-2">Mover Solves para Outra Sessão</h4>
            <p className="text-xs text-cube-textMuted mb-4">
              Selecione a sessão de destino para as {selectedIds.size} solves selecionadas:
            </p>
            <select
              value={targetSessionId}
              onChange={e => setTargetSessionId(e.target.value)}
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cube-cyan mb-4"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-cube-textMuted"
              >
                Cancelar
              </button>
              <button
                onClick={handleMoveSelected}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cube-cyan text-cube-bg hover:bg-cube-cyanGlow"
              >
                Mover Solves
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
