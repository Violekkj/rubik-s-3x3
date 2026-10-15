import React, { useState, useMemo } from 'react';
import { X, Check, Keyboard } from 'lucide-react';
import { TimeFormatter } from '../../core/timer/timeFormatter';
import { PenaltyType } from '../../core/timer/types';

interface ManualTimeModalProps {
  isOpen: boolean;
  currentScramble: string;
  onClose: () => void;
  onSubmitSolve: (timeMs: number, penalty: PenaltyType, note?: string) => void;
}

export const ManualTimeModal: React.FC<ManualTimeModalProps> = ({
  isOpen,
  onClose,
  onSubmitSolve,
}) => {
  const [rawInput, setRawInput] = useState('');
  const [penalty, setPenalty] = useState<PenaltyType>('none');
  const [note, setNote] = useState('');

  const parsed = useMemo(() => {
    return TimeFormatter.parseManualTime(rawInput);
  }, [rawInput]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed.timeMs > 0 && !parsed.error) {
      onSubmitSolve(parsed.timeMs, penalty, note.trim() || undefined);
      setRawInput('');
      setPenalty('none');
      setNote('');
      onClose();
    }
  };

  const formattedPreview = parsed.timeMs > 0 ? TimeFormatter.format(parsed.timeMs, penalty) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleUp"
      >
        <div className="flex items-center justify-between pb-4 border-b border-cube-border">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-cube-cyan" />
            <h3 className="text-lg font-bold text-white">Digitar Tempo Manual</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-cube-textMuted hover:text-white hover:bg-cube-surface3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cube-textMuted uppercase mb-1">
              Tempo (ex: 12.34, 1234 ou 1:02.34)
            </label>
            <input
              id="input-manual-time"
              type="text"
              autoFocus
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder="12.34"
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl p-3 text-2xl font-mono font-bold text-white placeholder-cube-textDim focus:outline-none focus:border-cube-cyan transition-colors text-center"
            />
            {parsed.error && rawInput.length > 0 && (
              <p className="text-xs text-cube-red mt-1 text-center">{parsed.error}</p>
            )}
          </div>

          {formattedPreview && (
            <div className="text-center py-2 bg-cube-surface1 rounded-xl border border-cube-border">
              <span className="text-xs text-cube-textDim block">Tempo Formatado Oficial</span>
              <span className="text-2xl font-mono font-extrabold text-cube-cyan">
                {formattedPreview.display}
              </span>
            </div>
          )}

          {/* Seletor de Penalidade */}
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

          {/* Nota opcional */}
          <div>
            <label className="block text-xs font-semibold text-cube-textMuted uppercase mb-1">
              Nota (Opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: Treino de PLL, cubo novo..."
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl p-2.5 text-xs text-white placeholder-cube-textDim focus:outline-none focus:border-cube-cyan transition-colors"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-cube-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-cube-textMuted hover:text-white hover:bg-cube-surface3 transition-colors"
          >
            Cancelar
          </button>

          <button
            id="btn-submit-manual-time"
            type="submit"
            disabled={parsed.timeMs <= 0 || !!parsed.error}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md ${
              parsed.timeMs > 0 && !parsed.error
                ? 'bg-cube-cyan text-cube-bg hover:bg-cube-cyanGlow shadow-cube-cyanGlow/30'
                : 'bg-cube-surface3 text-cube-textDim opacity-50 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Adicionar Solve</span>
          </button>
        </div>
      </form>
    </div>
  );
};
