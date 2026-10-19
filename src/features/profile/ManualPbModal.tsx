import React, { useState, useEffect } from 'react';
import { X, Trophy } from 'lucide-react';
import { ManualPbEntry } from '../../data/db';
import { TimeFormatter } from '../../core/timer/timeFormatter';

interface ManualPbModalProps {
  isOpen: boolean;
  metric: string; // 'single' | 'ao5' | 'ao12' | 'ao30' | 'ao50' | 'ao100'
  initialEntry?: ManualPbEntry;
  onClose: () => void;
  onSave: (entry: ManualPbEntry) => void;
  onDelete?: () => void;
}

export const ManualPbModal: React.FC<ManualPbModalProps> = ({
  isOpen,
  metric,
  initialEntry,
  onClose,
  onSave,
  onDelete,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [compStr, setCompStr] = useState('');
  const [noteStr, setNoteStr] = useState('');
  const [mode, setMode] = useState<'auto' | 'manual' | 'best'>('best');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialEntry && initialEntry.timeMs > 0) {
        setTimeStr(TimeFormatter.format(initialEntry.timeMs).display);
        setDateStr(initialEntry.date || '');
        setCompStr(initialEntry.competition || '');
        setNoteStr(initialEntry.note || '');
        setMode(initialEntry.mode || 'best');
      } else {
        setTimeStr('');
        setDateStr(new Date().toISOString().split('T')[0]);
        setCompStr('');
        setNoteStr('');
        setMode('best');
      }
      setError(null);
    }
  }, [isOpen, initialEntry]);

  if (!isOpen) return null;

  const handleSave = () => {
    const parsed = TimeFormatter.parseManualTime(timeStr);
    if (parsed.timeMs <= 0) {
      setError('Tempo inválido. Use formatos como 12.34 ou 1:02.34.');
      return;
    }

    onSave({
      timeMs: parsed.timeMs,
      date: dateStr || undefined,
      competition: compStr || undefined,
      note: noteStr || undefined,
      mode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-cube-border mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-extrabold text-white text-base">
              PB {metric.toUpperCase()} — Registro Oficial / Manual
            </h3>
          </div>
          <button onClick={onClose} className="text-cube-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-cube-textDim font-bold mb-1">
              Tempo do Recorde <span className="text-cube-red">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={timeStr}
              onChange={e => setTimeStr(e.target.value)}
              placeholder="Ex: 12.34 ou 1:02.34"
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cube-cyan"
            />
            {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-cube-textDim font-bold mb-1">
              Exibição deste PB no Card
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'best', label: 'Melhor dos dois' },
                { id: 'auto', label: 'Só Automático' },
                { id: 'manual', label: 'Só Manual' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id as any)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-colors ${
                    mode === opt.id
                      ? 'border-cube-cyan bg-cube-cyan/15 text-cube-cyan'
                      : 'border-cube-border bg-cube-surface1 text-cube-textMuted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-cube-textDim font-bold mb-1">Data da Conquista</label>
            <input
              type="date"
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cube-cyan"
            />
          </div>

          <div>
            <label className="block text-cube-textDim font-bold mb-1">Competição / Local</label>
            <input
              type="text"
              value={compStr}
              onChange={e => setCompStr(e.target.value)}
              placeholder="Ex: WCA São Paulo Open 2024"
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cube-cyan"
            />
          </div>

          <div>
            <label className="block text-cube-textDim font-bold mb-1">Observações / Scramble</label>
            <textarea
              rows={2}
              value={noteStr}
              onChange={e => setNoteStr(e.target.value)}
              placeholder="Ex: Última camada PLL Skip"
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl p-2.5 text-white focus:outline-none focus:border-cube-cyan resize-none"
            />
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-cube-border flex items-center justify-between">
          {initialEntry && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="text-red-400 hover:text-red-300 text-xs font-semibold"
            >
              Excluir Manual
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-cube-textMuted hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cube-cyan text-cube-bg hover:bg-cube-cyanGlow"
            >
              Salvar PB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
