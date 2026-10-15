import React, { useState } from 'react';
import { X, Trash2, Check, Clock, Calendar, Edit3 } from 'lucide-react';
import { SolveRecord } from '../../data/db';
import { PenaltyType } from '../../core/timer/types';
import { TimeFormatter } from '../../core/timer/timeFormatter';
import { CubeNetView } from '../timer/CubeNetView';

interface SolveDetailModalProps {
  solve: SolveRecord | null;
  solveIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSolve: (solveId: string, partial: Partial<SolveRecord>) => void;
  onDeleteSolve: (solveId: string) => void;
}

export const SolveDetailModal: React.FC<SolveDetailModalProps> = ({
  solve,
  solveIndex,
  isOpen,
  onClose,
  onUpdateSolve,
  onDeleteSolve,
}) => {
  if (!isOpen || !solve) return null;

  const [timeInput, setTimeInput] = useState(
    (solve.timeMs / 1000).toFixed(2)
  );
  const [penalty, setPenalty] = useState<PenaltyType>(solve.penalty);
  const [note, setNote] = useState(solve.note || '');
  const [isEditingTime, setIsEditingTime] = useState(false);

  const handleSave = () => {
    let parsedMs = solve.timeMs;
    if (isEditingTime) {
      const p = TimeFormatter.parseManualTime(timeInput);
      if (p.timeMs > 0 && !p.error) {
        parsedMs = p.timeMs;
      }
    }

    onUpdateSolve(solve.id, {
      timeMs: parsedMs,
      penalty,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const formatted = TimeFormatter.format(solve.timeMs, penalty);
  const dateStr = new Date(solve.createdAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-cube-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cube-surface1 text-cube-cyan border border-cube-border">
              #{solveIndex}
            </span>
            <h3 className="text-lg font-bold text-white">Detalhes da Solve</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-cube-textMuted hover:text-white hover:bg-cube-surface3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Destaque do Tempo com opção de editar */}
          <div className="flex flex-col items-center justify-center p-4 bg-cube-surface1 rounded-xl border border-cube-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cube-textDim mb-1">
              Tempo Efetivo
            </span>
            {isEditingTime ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={timeInput}
                  onChange={e => setTimeInput(e.target.value)}
                  className="bg-cube-surface2 border border-cube-cyan rounded-lg px-3 py-1 font-mono text-3xl font-extrabold text-white text-center w-36"
                />
                <button
                  onClick={() => setIsEditingTime(false)}
                  className="px-2 py-1 rounded bg-cube-surface3 text-xs text-cube-cyan"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="tabular-timer text-5xl font-extrabold text-white">
                  {formatted.display}
                </span>
                <button
                  onClick={() => setIsEditingTime(true)}
                  className="p-1.5 rounded-lg text-cube-textDim hover:text-cube-cyan hover:bg-cube-surface2 transition-colors"
                  title="Editar valor bruto do tempo"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            <span className="text-xs text-cube-textDim mt-1">
              Tempo bruto: {(solve.timeMs / 1000).toFixed(2)}s
            </span>
          </div>

          {/* Seletor de Penalidades */}
          <div>
            <label className="block text-xs font-semibold text-cube-textMuted uppercase mb-1.5">
              Penalidade
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPenalty('none')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  penalty === 'none'
                    ? 'bg-cube-surface3 text-white border border-cube-cyan/40 shadow-sm'
                    : 'bg-cube-surface1 text-cube-textMuted hover:text-white'
                }`}
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setPenalty('plus2')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  penalty === 'plus2'
                    ? 'bg-cube-orange/20 text-cube-orange border border-cube-orange/50 shadow-sm'
                    : 'bg-cube-surface1 text-cube-textMuted hover:text-white'
                }`}
              >
                +2
              </button>
              <button
                type="button"
                onClick={() => setPenalty('dnf')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  penalty === 'dnf'
                    ? 'bg-cube-red/20 text-cube-red border border-cube-red/50 shadow-sm'
                    : 'bg-cube-surface1 text-cube-textMuted hover:text-white'
                }`}
              >
                DNF
              </button>
            </div>
          </div>

          {/* Metadados: Data e Inspeção */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-cube-surface1 rounded-xl border border-cube-border flex items-center gap-2 text-cube-textMuted">
              <Calendar className="w-4 h-4 text-cube-cyan shrink-0" />
              <span className="truncate">{dateStr}</span>
            </div>
            <div className="p-2.5 bg-cube-surface1 rounded-xl border border-cube-border flex items-center gap-2 text-cube-textMuted">
              <Clock className="w-4 h-4 text-cube-cyan shrink-0" />
              <span>
                {solve.inspectionMs
                  ? `Inspeção: ${(solve.inspectionMs / 1000).toFixed(1)}s`
                  : 'Sem inspeção'}
              </span>
            </div>
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs font-semibold text-cube-textMuted uppercase mb-1">
              Nota
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Adicione observações sobre esta solve..."
              rows={2}
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl p-2.5 text-xs text-white placeholder-cube-textDim focus:outline-none focus:border-cube-cyan transition-colors"
            />
          </div>

          {/* Scramble com Visualizador 2D */}
          <div>
            <span className="block text-xs font-semibold text-cube-textMuted uppercase mb-1">
              Scramble ({solve.scrambleSource === 'random' ? 'Oficial Random' : 'Manual'})
            </span>
            <div className="p-3 bg-cube-surface1 rounded-xl border border-cube-border font-mono text-xs text-white select-text mb-2">
              {solve.scramble}
            </div>

            <div className="flex justify-center">
              <CubeNetView scramble={solve.scramble} initialCollapsed={false} />
            </div>
          </div>
        </div>

        {/* Rodapé: Ações */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-cube-border">
          <button
            onClick={() => {
              onDeleteSolve(solve.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-cube-red hover:bg-cube-red/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Solve</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-cube-textMuted hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-cube-cyan text-cube-bg hover:bg-cube-cyanGlow transition-colors shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
