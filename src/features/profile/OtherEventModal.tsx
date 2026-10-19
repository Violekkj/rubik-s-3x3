import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import { OtherEventEntry } from '../../data/db';
import { TimeFormatter } from '../../core/timer/timeFormatter';

interface OtherEventModalProps {
  isOpen: boolean;
  initialEntry?: OtherEventEntry;
  onClose: () => void;
  onSave: (entry: Omit<OtherEventEntry, 'id'>) => void;
  onDelete?: () => void;
}

const WCA_EVENTS = [
  '2x2',
  '4x4',
  '5x5',
  '6x6',
  '7x7',
  '3x3 OH (Uma Mão)',
  '3x3 BLD (Vendas)',
  'Megaminx',
  'Pyraminx',
  'Skewb',
  'Square-1',
  'Clock',
  'FMC (Menos Movimentos)',
  'Multi-Blind',
];

export const OtherEventModal: React.FC<OtherEventModalProps> = ({
  isOpen,
  initialEntry,
  onClose,
  onSave,
  onDelete,
}) => {
  const [event, setEvent] = useState(WCA_EVENTS[0]);
  const [singleStr, setSingleStr] = useState('');
  const [averageStr, setAverageStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [noteStr, setNoteStr] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialEntry) {
        setEvent(initialEntry.event);
        setSingleStr(initialEntry.singleMs ? TimeFormatter.format(initialEntry.singleMs).display : '');
        setAverageStr(initialEntry.averageMs ? TimeFormatter.format(initialEntry.averageMs).display : '');
        setDateStr(initialEntry.date || '');
        setNoteStr(initialEntry.note || '');
      } else {
        setEvent(WCA_EVENTS[0]);
        setSingleStr('');
        setAverageStr('');
        setDateStr(new Date().toISOString().split('T')[0]);
        setNoteStr('');
      }
      setError(null);
    }
  }, [isOpen, initialEntry]);

  if (!isOpen) return null;

  const handleSave = () => {
    let singleMs: number | undefined = undefined;
    let averageMs: number | undefined = undefined;

    if (singleStr.trim()) {
      const parsed = TimeFormatter.parseManualTime(singleStr.trim());
      if (parsed.timeMs > 0) singleMs = parsed.timeMs;
    }

    if (averageStr.trim()) {
      const parsed = TimeFormatter.parseManualTime(averageStr.trim());
      if (parsed.timeMs > 0) averageMs = parsed.timeMs;
    }

    if (!singleMs && !averageMs) {
      setError('Informe ao menos o tempo de Single ou a Média.');
      return;
    }

    onSave({
      event,
      singleMs,
      averageMs,
      date: dateStr || undefined,
      note: noteStr || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-cube-border mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cube-cyan" />
            <h3 className="font-extrabold text-white text-base">
              {initialEntry ? 'Editar Evento' : 'Adicionar Outro Evento'}
            </h3>
          </div>
          <button onClick={onClose} className="text-cube-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-cube-textDim font-bold mb-1">Evento</label>
            <select
              value={event}
              onChange={e => setEvent(e.target.value)}
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cube-cyan"
            >
              {WCA_EVENTS.map(ev => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-cube-textDim font-bold mb-1">Single</label>
              <input
                type="text"
                value={singleStr}
                onChange={e => setSingleStr(e.target.value)}
                placeholder="Ex: 3.45"
                className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cube-cyan"
              />
            </div>
            <div>
              <label className="block text-cube-textDim font-bold mb-1">Média (Avg)</label>
              <input
                type="text"
                value={averageStr}
                onChange={e => setAverageStr(e.target.value)}
                placeholder="Ex: 4.89"
                className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cube-cyan"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-[11px]">{error}</p>}

          <div>
            <label className="block text-cube-textDim font-bold mb-1">Data</label>
            <input
              type="date"
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cube-cyan"
            />
          </div>

          <div>
            <label className="block text-cube-textDim font-bold mb-1">Observação / Local</label>
            <input
              type="text"
              value={noteStr}
              onChange={e => setNoteStr(e.target.value)}
              placeholder="Ex: Oficial WCA / Treino"
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cube-cyan"
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
              Excluir
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
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
