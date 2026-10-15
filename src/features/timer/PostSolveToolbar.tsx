import React, { useState } from 'react';
import { Trash2, Undo2, MessageSquare, HelpCircle, X } from 'lucide-react';
import { SolveRecord } from '../../data/db';

interface PostSolveToolbarProps {
  lastSolve: SolveRecord | null;
  onTogglePenalty: (solveId: string, penalty: 'plus2' | 'dnf') => void;
  onDeleteSolve: (solveId: string) => void;
  onUndoLastSolve: () => void;
  onUpdateNote: (solveId: string, note: string) => void;
}

export const PostSolveToolbar: React.FC<PostSolveToolbarProps> = ({
  lastSolve,
  onTogglePenalty,
  onDeleteSolve,
  onUndoLastSolve,
  onUpdateNote,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(lastSolve?.note || '');

  if (!lastSolve) {
    return (
      <div className="flex items-center justify-center p-2 text-xs text-cube-textDim">
        <button
          onClick={() => setIsHelpOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cube-surface1 hover:bg-cube-surface2 border border-cube-border text-cube-textMuted hover:text-white transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Atalhos de Teclado</span>
        </button>

        {isHelpOpen && <KeyboardHelpModal onClose={() => setIsHelpOpen(false)} />}
      </div>
    );
  }

  const handleSaveNote = () => {
    onUpdateNote(lastSolve.id, noteText.trim());
    setIsNoteOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="inline-flex items-center gap-1.5 bg-cube-surface1/90 backdrop-blur-md border border-cube-border px-3 py-1.5 rounded-2xl shadow-lg flex-wrap justify-center text-xs font-semibold">
        {/* +2 */}
        <button
          id="btn-toggle-plus2"
          onClick={() => onTogglePenalty(lastSolve.id, 'plus2')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            lastSolve.penalty === 'plus2'
              ? 'bg-cube-orange text-cube-bg font-extrabold shadow-sm'
              : 'text-cube-textMuted hover:text-cube-orange hover:bg-cube-surface2'
          }`}
          title="Alternar penalidade +2"
        >
          +2
        </button>

        {/* DNF */}
        <button
          id="btn-toggle-dnf"
          onClick={() => onTogglePenalty(lastSolve.id, 'dnf')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            lastSolve.penalty === 'dnf'
              ? 'bg-cube-red text-white font-extrabold shadow-sm'
              : 'text-cube-textMuted hover:text-cube-red hover:bg-cube-surface2'
          }`}
          title="Alternar penalidade DNF"
        >
          DNF
        </button>

        <div className="h-4 w-px bg-cube-border mx-1" />

        {/* Nota */}
        <button
          id="btn-edit-note"
          onClick={() => {
            setNoteText(lastSolve.note || '');
            setIsNoteOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            lastSolve.note
              ? 'text-cube-cyan bg-cube-cyan/10'
              : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2'
          }`}
          title="Adicionar ou editar nota da solve"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{lastSolve.note ? 'Com nota' : 'Nota'}</span>
        </button>

        {/* Excluir */}
        <button
          id="btn-delete-solve"
          onClick={() => onDeleteSolve(lastSolve.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-cube-textMuted hover:text-cube-red hover:bg-cube-surface2 transition-all"
          title="Excluir esta solve"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Excluir</span>
        </button>

        {/* Desfazer */}
        <button
          id="btn-undo-solve"
          onClick={onUndoLastSolve}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-cube-textMuted hover:text-white hover:bg-cube-surface2 transition-all"
          title="Desfazer última solve"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Desfazer</span>
        </button>

        {/* Ajuda */}
        <button
          onClick={() => setIsHelpOpen(true)}
          className="p-1.5 rounded-xl text-cube-textDim hover:text-white hover:bg-cube-surface2 transition-colors ml-1"
          title="Atalhos do teclado"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Modal de Nota */}
      {isNoteOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-scaleUp">
            <h4 className="text-sm font-bold text-white mb-2">Nota da Solve</h4>
            <textarea
              autoFocus
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Ex: Treino de F2L, falha no reconhecimento..."
              rows={3}
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl p-3 text-xs text-white placeholder-cube-textDim focus:outline-none focus:border-cube-cyan transition-colors"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNoteOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-cube-textMuted hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cube-cyan text-cube-bg hover:bg-cube-cyanGlow"
              >
                Salvar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atalhos */}
      {isHelpOpen && <KeyboardHelpModal onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
};

const KeyboardHelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-cube-border">
          <h3 className="text-base font-bold text-white">Atalhos de Teclado</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-cube-textMuted hover:text-white hover:bg-cube-surface3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-cube-border/40">
            <span className="text-cube-textMuted">Iniciar Inspeção / Armar</span>
            <kbd className="px-2 py-1 rounded bg-cube-surface1 border border-cube-border font-mono text-cube-cyan font-bold">
              ESPAÇO
            </kbd>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-cube-border/40">
            <span className="text-cube-textMuted">Parar Cronômetro</span>
            <kbd className="px-2 py-1 rounded bg-cube-surface1 border border-cube-border font-mono text-cube-cyan font-bold">
              QUALQUER TECLA
            </kbd>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-cube-border/40">
            <span className="text-cube-textMuted">Cancelar / Resetar</span>
            <kbd className="px-2 py-1 rounded bg-cube-surface1 border border-cube-border font-mono text-cube-cyan font-bold">
              ESC
            </kbd>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-cube-border/40">
            <span className="text-cube-textMuted">Alternar penalidade +2</span>
            <kbd className="px-2 py-1 rounded bg-cube-surface1 border border-cube-border font-mono text-cube-orange font-bold">
              2
            </kbd>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-cube-border/40">
            <span className="text-cube-textMuted">Alternar penalidade DNF</span>
            <kbd className="px-2 py-1 rounded bg-cube-surface1 border border-cube-border font-mono text-cube-red font-bold">
              D
            </kbd>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-cube-border/40">
            <span className="text-cube-textMuted">Excluir última solve</span>
            <kbd className="px-2 py-1 rounded bg-cube-surface1 border border-cube-border font-mono text-cube-red font-bold">
              DELETE
            </kbd>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 rounded-xl bg-cube-surface3 text-white text-xs font-bold hover:bg-cube-cyan hover:text-cube-bg transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
