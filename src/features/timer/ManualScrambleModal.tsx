import React, { useState, useMemo } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { MoveParser } from '../../core/cube/moveParser';
import { CubeNetView } from './CubeNetView';

interface ManualScrambleModalProps {
  isOpen: boolean;
  currentScramble: string;
  onClose: () => void;
  onApplyScramble: (newScramble: string) => void;
}

export const ManualScrambleModal: React.FC<ManualScrambleModalProps> = ({
  isOpen,
  currentScramble,
  onClose,
  onApplyScramble,
}) => {
  const [inputScramble, setInputScramble] = useState(currentScramble);

  const validation = useMemo(() => {
    return MoveParser.parse(inputScramble);
  }, [inputScramble]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (validation.isValid && validation.moves.length > 0) {
      onApplyScramble(validation.normalizedAlg);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between pb-4 border-b border-cube-border">
          <h3 className="text-lg font-bold text-white">Editar Scramble Manual</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cube-textMuted hover:text-white hover:bg-cube-surface3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cube-textMuted uppercase mb-1">
              Cole ou digite a sequência de embaralhamento (Notação WCA)
            </label>
            <textarea
              id="input-manual-scramble"
              value={inputScramble}
              onChange={e => setInputScramble(e.target.value)}
              placeholder="Ex: R U R' U' R' F R2 U' R' U' R U R' F'"
              rows={3}
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl p-3 text-sm font-mono text-white placeholder-cube-textDim focus:outline-none focus:border-cube-cyan transition-colors"
            />
          </div>

          {/* Validação inline */}
          {validation.isValid ? (
            <div className="flex items-center gap-2 text-xs text-cube-green bg-cube-green/10 border border-cube-green/20 rounded-lg p-2.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                Notação válida! Contagem: <strong>{validation.htmCount} movimentos (HTM)</strong>.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-cube-red bg-cube-red/10 border border-cube-red/20 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validation.error}</span>
            </div>
          )}

          {/* Preview 2D ao vivo do cubo com o scramble digitado */}
          {validation.isValid && validation.moves.length > 0 && (
            <div className="flex flex-col items-center justify-center p-2 bg-cube-surface1 rounded-xl border border-cube-border">
              <span className="text-[10px] uppercase font-bold text-cube-textDim mb-1 tracking-wider">
                Visualização do Cubo Resultante
              </span>
              <CubeNetView scramble={validation.normalizedAlg} initialCollapsed={false} />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-cube-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-cube-textMuted hover:text-white hover:bg-cube-surface3 transition-colors"
          >
            Cancelar
          </button>

          <button
            id="btn-confirm-manual-scramble"
            onClick={handleConfirm}
            disabled={!validation.isValid || validation.moves.length === 0}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md ${
              validation.isValid && validation.moves.length > 0
                ? 'bg-cube-cyan text-cube-bg hover:bg-cube-cyanGlow shadow-cube-cyanGlow/30'
                : 'bg-cube-surface3 text-cube-textDim opacity-50 cursor-not-allowed'
            }`}
          >
            Aplicar Scramble
          </button>
        </div>
      </div>
    </div>
  );
};
