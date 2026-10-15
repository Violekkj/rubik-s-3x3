import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Star,
  Edit2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { db, SolveRecord } from '../../data/db';
import { useSessionStore } from '../../stores/sessionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { AverageCalculator, getEffectiveTime } from '../../core/stats/averageCalculator';
import { TimeFormatter } from '../../core/timer/timeFormatter';
import { SolveDetailModal } from '../history/SolveDetailModal';
import { useSolveStore } from '../../stores/solveStore';

export const ProfileView: React.FC = () => {
  const { activeSessionId } = useSessionStore();
  const { settings, updateSettings } = useSettingsStore();
  const { updateSolve, deleteSolve } = useSolveStore();

  const [scope, setScope] = useState<'all' | 'current'>('all');
  const [allSolves, setAllSolves] = useState<SolveRecord[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(settings.userName || 'SpeedCuber');

  // Modal para ver as solves de um PB
  const [pbSolvesModal, setPbSolvesModal] = useState<{
    title: string;
    solves: SolveRecord[];
  } | null>(null);

  // Modal para inspecionar chip selecionado
  const [selectedChipSolve, setSelectedChipSolve] = useState<{
    solve: SolveRecord;
    index: number;
  } | null>(null);

  // Carrega todas as solves do Dexie para cálculo global ou por sessão
  useEffect(() => {
    let isMounted = true;
    const fetchSolves = async () => {
      try {
        let records: SolveRecord[] = [];
        if (scope === 'all') {
          records = await db.solves.orderBy('createdAt').toArray();
        } else {
          records = await db.solves
            .where('sessionId')
            .equals(activeSessionId)
            .sortBy('createdAt');
        }
        if (isMounted) setAllSolves(records);
      } catch (e) {
        console.warn('Erro ao carregar solves do perfil:', e);
      }
    };
    fetchSolves();
    return () => {
      isMounted = false;
    };
  }, [scope, activeSessionId]);

  // Recordes Pessoais
  const bestSingle = useMemo(() => AverageCalculator.findBestSingle(allSolves), [allSolves]);
  const bestAo5 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 5), [allSolves]);
  const bestAo12 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 12), [allSolves]);
  const bestAo30 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 30), [allSolves]);
  const bestAo50 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 50), [allSolves]);
  const bestAo100 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 100), [allSolves]);

  // Médias Atuais
  const currentSingle = allSolves.length > 0 ? allSolves[allSolves.length - 1] : null;
  const currentAo5 = AverageCalculator.calculateCurrentAoN(allSolves, 5);
  const currentAo12 = AverageCalculator.calculateCurrentAoN(allSolves, 12);
  const currentAo30 = AverageCalculator.calculateCurrentAoN(allSolves, 30);
  const currentAo50 = AverageCalculator.calculateCurrentAoN(allSolves, 50);
  const currentAo100 = AverageCalculator.calculateCurrentAoN(allSolves, 100);

  // Últimas 20 solves
  const last20Solves = useMemo(() => {
    return allSolves.slice(-20).reverse();
  }, [allSolves]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateSettings({ userName: nameInput.trim() });
      setIsEditingName(false);
    }
  };

  const metricsTable = [
    {
      label: 'Single',
      current: currentSingle ? getEffectiveTime(currentSingle.timeMs, currentSingle.penalty) : null,
      best: bestSingle?.timeMs ?? null,
      needed: 1,
    },
    {
      label: 'Ao5',
      current: currentAo5,
      best: bestAo5?.bestAoN ?? null,
      needed: 5,
    },
    {
      label: 'Ao12',
      current: currentAo12,
      best: bestAo12?.bestAoN ?? null,
      needed: 12,
    },
    {
      label: 'Ao30',
      current: currentAo30,
      best: bestAo30?.bestAoN ?? null,
      needed: 30,
    },
    {
      label: 'Ao50',
      current: currentAo50,
      best: bestAo50?.bestAoN ?? null,
      needed: 50,
    },
    {
      label: 'Ao100',
      current: currentAo100,
      best: bestAo100?.bestAoN ?? null,
      needed: 100,
    },
  ];

  return (
    <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 select-none space-y-6">
      {/* Cabeçalho do Perfil & Seletor de Escopo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-cube-surface1 border border-cube-border">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cube-cyan to-blue-600 flex items-center justify-center text-cube-bg font-extrabold text-2xl shadow-lg shadow-cube-cyanGlow">
            {settings.userName?.charAt(0).toUpperCase() || 'C'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="bg-cube-surface2 border border-cube-cyan rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded bg-cube-cyan text-cube-bg"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white">
                    {settings.userName || 'SpeedCuber'}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-cube-textDim hover:text-cube-cyan transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-cube-textDim mt-0.5">
              {allSolves.length} resoluções registradas no total
            </p>
          </div>
        </div>

        {/* Seletor de Escopo */}
        <div className="flex items-center bg-cube-surface2 p-1 rounded-xl border border-cube-border text-xs font-semibold">
          <button
            onClick={() => setScope('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              scope === 'all'
                ? 'bg-cube-cyan text-cube-bg shadow-sm'
                : 'text-cube-textMuted hover:text-white'
            }`}
          >
            Todas as Sessões
          </button>
          <button
            onClick={() => setScope('current')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              scope === 'current'
                ? 'bg-cube-cyan text-cube-bg shadow-sm'
                : 'text-cube-textMuted hover:text-white'
            }`}
          >
            Sessão Atual
          </button>
        </div>
      </div>

      {/* Cartões de Destaque de PBs */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-cube-textDim mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Recordes Pessoais (PBs)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PB Single */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-cube-surface2 to-cube-surface1 border border-cube-border shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-semibold text-cube-cyan mb-1">
              <span>PB SINGLE</span>
              <Star className="w-4 h-4 fill-cube-cyan" />
            </div>
            <div className="tabular-timer text-3xl font-extrabold text-white my-1">
              {bestSingle ? TimeFormatter.format(bestSingle.timeMs).display : '—'}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-cube-border/40 text-[11px] text-cube-textDim">
              <span>
                {bestSingle?.solve.createdAt
                  ? new Date(bestSingle.solve.createdAt).toLocaleDateString('pt-BR')
                  : 'Nenhum tempo'}
              </span>
              {bestSingle && (
                <button
                  onClick={() =>
                    setPbSolvesModal({
                      title: 'PB Single',
                      solves: [bestSingle.solve as SolveRecord],
                    })
                  }
                  className="flex items-center gap-1 text-cube-cyan hover:underline font-semibold"
                >
                  <span>Ver solve</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* PB Ao5 */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-cube-surface2 to-cube-surface1 border border-cube-border shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-semibold text-cube-green mb-1">
              <span>PB Ao5</span>
              <Trophy className="w-4 h-4 text-cube-green" />
            </div>
            <div className="tabular-timer text-3xl font-extrabold text-white my-1">
              {bestAo5 ? TimeFormatter.format(bestAo5.bestAoN).display : '—'}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-cube-border/40 text-[11px] text-cube-textDim">
              <span>
                {bestAo5?.bestWindow[bestAo5.bestWindow.length - 1]?.createdAt
                  ? new Date(
                      bestAo5.bestWindow[bestAo5.bestWindow.length - 1].createdAt!
                    ).toLocaleDateString('pt-BR')
                  : 'Nenhum registro'}
              </span>
              {bestAo5 && (
                <button
                  onClick={() =>
                    setPbSolvesModal({
                      title: 'Solves do PB Ao5',
                      solves: bestAo5.bestWindow as SolveRecord[],
                    })
                  }
                  className="flex items-center gap-1 text-cube-green hover:underline font-semibold"
                >
                  <span>Ver 5 solves</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* PB Ao12 */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-cube-surface2 to-cube-surface1 border border-cube-border shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400 mb-1">
              <span>PB Ao12</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="tabular-timer text-3xl font-extrabold text-white my-1">
              {bestAo12 ? TimeFormatter.format(bestAo12.bestAoN).display : '—'}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-cube-border/40 text-[11px] text-cube-textDim">
              <span>
                {bestAo12?.bestWindow[bestAo12.bestWindow.length - 1]?.createdAt
                  ? new Date(
                      bestAo12.bestWindow[bestAo12.bestWindow.length - 1].createdAt!
                    ).toLocaleDateString('pt-BR')
                  : 'Nenhum registro'}
              </span>
              {bestAo12 && (
                <button
                  onClick={() =>
                    setPbSolvesModal({
                      title: 'Solves do PB Ao12',
                      solves: bestAo12.bestWindow as SolveRecord[],
                    })
                  }
                  className="flex items-center gap-1 text-amber-400 hover:underline font-semibold"
                >
                  <span>Ver 12 solves</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Atual vs Melhor */}
      <div className="p-5 rounded-2xl bg-cube-surface1 border border-cube-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cube-textDim mb-3">
          Tabela de Performance: Atual × Recordes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-cube-border text-cube-textDim uppercase text-[10px] tracking-wider">
              <tr>
                <th className="pb-2">Métrica</th>
                <th className="pb-2">Atual</th>
                <th className="pb-2">Melhor PB</th>
                <th className="pb-2 font-sans">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cube-border/40">
              {metricsTable.map(row => {
                const isShort = allSolves.length < row.needed;
                const remaining = row.needed - allSolves.length;

                return (
                  <tr key={row.label} className="hover:bg-cube-surface2/40">
                    <td className="py-3 font-sans font-bold text-cube-cyan">{row.label}</td>
                    <td className="py-3 font-bold text-white">
                      {row.current !== null && row.current !== undefined
                        ? row.current === Infinity
                          ? 'DNF'
                          : TimeFormatter.format(row.current).display
                        : '—'}
                    </td>
                    <td className="py-3 text-cube-green font-bold">
                      {row.best !== null && row.best !== undefined
                        ? row.best === Infinity
                          ? 'DNF'
                          : TimeFormatter.format(row.best).display
                        : '—'}
                    </td>
                    <td className="py-3 font-sans text-cube-textDim text-[11px]">
                      {isShort ? (
                        <span className="text-cube-orange">
                          Faltam {remaining} solve{remaining > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-cube-textMuted">Fechada</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Últimos 20 Tempos (Chips Interativos) */}
      <div className="p-5 rounded-2xl bg-cube-surface1 border border-cube-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cube-textDim mb-3">
          Últimos 20 Tempos (Clique para inspecionar / editar)
        </h3>

        {last20Solves.length === 0 ? (
          <p className="text-xs text-cube-textDim">Nenhuma solve recente para exibir.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {last20Solves.map((s, idx) => {
              const formatted = TimeFormatter.format(s.timeMs, s.penalty);
              const isPb = bestSingle && s.id === bestSingle.solve.id;

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedChipSolve({ solve: s, index: allSolves.length - idx })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1.5 shadow-sm hover:scale-105 ${
                    isPb
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                      : s.penalty === 'dnf'
                      ? 'bg-cube-red/20 text-cube-red border-cube-red/40'
                      : s.penalty === 'plus2'
                      ? 'bg-cube-orange/20 text-cube-orange border-cube-orange/40'
                      : 'bg-cube-surface2 hover:bg-cube-surface3 text-white border-cube-border'
                  }`}
                >
                  {isPb && <Star className="w-3 h-3 fill-amber-300 shrink-0" />}
                  <span>{formatted.display}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Ver Solves do PB */}
      {pbSolvesModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scaleUp max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-cube-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{pbSolvesModal.title}</span>
              </h3>
              <button
                onClick={() => setPbSolvesModal(null)}
                className="p-1 text-cube-textMuted hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {pbSolvesModal.solves.map((s, i) => (
                <div
                  key={s.id || i}
                  className="p-3 bg-cube-surface1 rounded-xl border border-cube-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-cube-textDim">#{i + 1}</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {TimeFormatter.format(s.timeMs, s.penalty).display}
                    </span>
                  </div>
                  <span className="font-mono text-cube-textMuted truncate max-w-[200px] text-[11px]">
                    {s.scramble}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end pt-3 border-t border-cube-border">
              <button
                onClick={() => setPbSolvesModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cube-cyan text-cube-bg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inspecionar Solve do Chip */}
      <SolveDetailModal
        solve={selectedChipSolve?.solve || null}
        solveIndex={selectedChipSolve?.index || 0}
        isOpen={selectedChipSolve !== null}
        onClose={() => setSelectedChipSolve(null)}
        onUpdateSolve={updateSolve}
        onDeleteSolve={deleteSolve}
      />
    </div>
  );
};
