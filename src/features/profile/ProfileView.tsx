import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Edit2,
  Calendar,
  ExternalLink,
  Plus,
  Share2,
  Award,
  Target,
  Flame,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { db, SolveRecord, OtherEventEntry } from '../../data/db';
import { useSessionStore } from '../../stores/sessionStore';
import { useProfileStore } from '../../stores/profileStore';
import { AverageCalculator, getEffectiveTime } from '../../core/stats/averageCalculator';
import { TimeFormatter } from '../../core/timer/timeFormatter';
import { SolveDetailModal } from '../history/SolveDetailModal';
import { useSolveStore } from '../../stores/solveStore';
import { EditProfileModal } from './EditProfileModal';
import { ManualPbModal } from './ManualPbModal';
import { OtherEventModal } from './OtherEventModal';
import { exportProfileCardPng } from './ProfileCardExport';

const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷 Brasil',
  PT: '🇵🇹 Portugal',
  US: '🇺🇸 EUA',
  CA: '🇨🇦 Canadá',
  ES: '🇪🇸 Espanha',
  FR: '🇫🇷 França',
  DE: '🇩🇪 Alemanha',
  GB: '🇬🇧 Reino Unido',
  AR: '🇦🇷 Argentina',
  CL: '🇨🇱 Chile',
  CO: '🇨🇴 Colômbia',
  MX: '🇲🇽 México',
  JP: '🇯🇵 Japão',
  AU: '🇦🇺 Austrália',
  OTHER: '🌍 Outro',
};

export const ProfileView: React.FC = () => {
  const { activeSessionId } = useSessionStore();
  const { updateSolve, deleteSolve } = useSolveStore();
  const {
    profile,
    avatarUrl,
    bannerUrl,
    loadProfile,
    setManualPb,
    deleteManualPb,
    addOtherEvent,
    updateOtherEvent,
    deleteOtherEvent,
    addGoal,
    deleteGoal,
  } = useProfileStore();

  const [scope, setScope] = useState<'all' | 'current'>('all');
  const [allSolves, setAllSolves] = useState<SolveRecord[]>([]);

  // Modais
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeManualPbMetric, setActiveManualPbMetric] = useState<string | null>(null);
  const [isOtherEventModalOpen, setIsOtherEventModalOpen] = useState(false);
  const [editingOtherEvent, setEditingOtherEvent] = useState<OtherEventEntry | undefined>(undefined);
  const [selectedChipSolve, setSelectedChipSolve] = useState<{ solve: SolveRecord; index: number } | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalMetric, setNewGoalMetric] = useState('ao12');
  const [newGoalTimeStr, setNewGoalTimeStr] = useState('20.00');

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Carrega todas as solves do Dexie
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

  // Recordes Automáticos
  const autoBestSingle = useMemo(() => AverageCalculator.findBestSingle(allSolves), [allSolves]);
  const autoBestAo5 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 5), [allSolves]);
  const autoBestAo12 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 12), [allSolves]);
  const autoBestAo30 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 30), [allSolves]);
  const autoBestAo50 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 50), [allSolves]);
  const autoBestAo100 = useMemo(() => AverageCalculator.findBestAoN(allSolves, 100), [allSolves]);

  // Médias Atuais
  const currentSingle = allSolves.length > 0 ? allSolves[allSolves.length - 1] : null;
  const currentAo5 = AverageCalculator.calculateCurrentAoN(allSolves, 5);
  const currentAo12 = AverageCalculator.calculateCurrentAoN(allSolves, 12);
  const currentAo30 = AverageCalculator.calculateCurrentAoN(allSolves, 30);
  const currentAo50 = AverageCalculator.calculateCurrentAoN(allSolves, 50);
  const currentAo100 = AverageCalculator.calculateCurrentAoN(allSolves, 100);

  // Estatísticas Rápidas
  const totalSolves = allSolves.length;
  const totalSolvingTimeMs = useMemo(() => {
    return allSolves.reduce((acc, s) => acc + (s.penalty === 'dnf' ? 0 : s.timeMs), 0);
  }, [allSolves]);

  const totalSolvingTimeFormatted = useMemo(() => {
    const totalSec = Math.floor(totalSolvingTimeMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) return `${hours}h ${minutes}min`;
    if (minutes > 0) return `${minutes}min ${seconds}s`;
    return `${seconds}s`;
  }, [totalSolvingTimeMs]);

  // Cálculo de Streak (dias consecutivos)
  const currentStreakDays = useMemo(() => {
    if (allSolves.length === 0) return 0;
    const daysSet = new Set(
      allSolves.map(s => new Date(s.createdAt).toISOString().split('T')[0])
    );
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!daysSet.has(today) && !daysSet.has(yesterday)) return 0;

    let streak = 0;
    let checkDate = daysSet.has(today) ? new Date() : new Date(Date.now() - 86400000);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (daysSet.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [allSolves]);

  // Helper para obter PB efetivo considerando Automático vs Manual
  const getEffectivePb = (metric: 'single' | 'ao5' | 'ao12' | 'ao30' | 'ao50' | 'ao100') => {
    const manual = profile.manualPbs?.[metric];
    let autoTime: number | null = null;
    let autoDate: string | undefined = undefined;

    if (metric === 'single') {
      autoTime = autoBestSingle ? autoBestSingle.timeMs : null;
      if (autoBestSingle) {
        autoDate = new Date(autoBestSingle.solve.createdAt ?? Date.now()).toISOString().split('T')[0];
      }
    } else if (metric === 'ao5') {
      autoTime = autoBestAo5 ? autoBestAo5.bestAoN : null;
    } else if (metric === 'ao12') {
      autoTime = autoBestAo12 ? autoBestAo12.bestAoN : null;
    } else if (metric === 'ao30') {
      autoTime = autoBestAo30 ? autoBestAo30.bestAoN : null;
    } else if (metric === 'ao50') {
      autoTime = autoBestAo50 ? autoBestAo50.bestAoN : null;
    } else if (metric === 'ao100') {
      autoTime = autoBestAo100 ? autoBestAo100.bestAoN : null;
    }

    if (!manual) {
      return {
        timeMs: autoTime,
        source: 'auto' as const,
        date: autoDate,
        competition: undefined,
        note: undefined,
      };
    }

    if (manual.mode === 'manual') {
      return {
        timeMs: manual.timeMs,
        source: 'manual' as const,
        date: manual.date,
        competition: manual.competition,
        note: manual.note,
      };
    }

    if (manual.mode === 'auto') {
      return {
        timeMs: autoTime,
        source: 'auto' as const,
        date: autoDate,
        competition: undefined,
        note: undefined,
      };
    }

    // Modo 'best' (melhor dos dois)
    if (autoTime !== null && manual.timeMs > 0) {
      if (manual.timeMs < autoTime) {
        return {
          timeMs: manual.timeMs,
          source: 'manual' as const,
          date: manual.date,
          competition: manual.competition,
          note: manual.note,
        };
      } else {
        return {
          timeMs: autoTime,
          source: 'auto' as const,
          date: autoDate,
          competition: undefined,
          note: undefined,
        };
      }
    }

    return {
      timeMs: manual.timeMs || autoTime,
      source: (manual.timeMs ? 'manual' : 'auto') as 'manual' | 'auto',
      date: manual.date || autoDate,
      competition: manual.competition,
      note: manual.note,
    };
  };

  // Últimas 20 solves
  const last20Solves = useMemo(() => {
    return allSolves.slice(-20).reverse();
  }, [allSolves]);

  // Lista de Métricas Comparativas
  const metricsTable = [
    {
      label: 'Single',
      current: currentSingle ? getEffectiveTime(currentSingle.timeMs, currentSingle.penalty) : null,
      best: getEffectivePb('single').timeMs,
    },
    {
      label: 'Ao5',
      current: currentAo5,
      best: getEffectivePb('ao5').timeMs,
    },
    {
      label: 'Ao12',
      current: currentAo12,
      best: getEffectivePb('ao12').timeMs,
    },
    {
      label: 'Ao30',
      current: currentAo30,
      best: getEffectivePb('ao30').timeMs,
    },
    {
      label: 'Ao50',
      current: currentAo50,
      best: getEffectivePb('ao50').timeMs,
    },
    {
      label: 'Ao100',
      current: currentAo100,
      best: getEffectivePb('ao100').timeMs,
    },
  ];

  // Conquistas e Selos Automáticos
  const badges = useMemo(() => {
    const list = [];
    const bestSingleMs = getEffectivePb('single').timeMs || Infinity;
    const bestAo5Ms = getEffectivePb('ao5').timeMs || Infinity;

    if (totalSolves >= 1) list.push({ id: 'b-1', title: 'Primeira Solve', icon: '🚀', desc: 'Completou a primeira solve oficial no app' });
    if (totalSolves >= 100) list.push({ id: 'b-100', title: 'Centenário (100)', icon: '💯', desc: '100 solves registradas' });
    if (totalSolves >= 1000) list.push({ id: 'b-1000', title: 'Milenar (1.000)', icon: '⚡', desc: '1.000 solves registradas' });
    if (totalSolves >= 10000) list.push({ id: 'b-10000', title: 'Lenda (10.000)', icon: '👑', desc: '10.000 solves registradas' });

    if (bestSingleMs < 60000) list.push({ id: 'b-sub60', title: 'Sub-60 Single', icon: '⏱️', desc: 'Tempo individual abaixo de 1 minuto' });
    if (bestSingleMs < 30000) list.push({ id: 'b-sub30', title: 'Sub-30 Single', icon: '🔥', desc: 'Tempo individual abaixo de 30 segundos' });
    if (bestSingleMs < 20000) list.push({ id: 'b-sub20', title: 'Sub-20 Single', icon: '💎', desc: 'Tempo individual abaixo de 20 segundos' });
    if (bestSingleMs < 15000) list.push({ id: 'b-sub15', title: 'Sub-15 Single', icon: '🌟', desc: 'Tempo individual abaixo de 15 segundos' });
    if (bestSingleMs < 10000) list.push({ id: 'b-sub10', title: 'Sub-10 Single', icon: '⚡', desc: 'Tempo individual abaixo de 10 segundos' });

    if (bestAo5Ms < 20000) list.push({ id: 'b-ao5-sub20', title: 'Sub-20 Ao5', icon: '🏆', desc: 'Média de 5 consistente abaixo de 20 segundos' });
    if (bestAo5Ms < 15000) list.push({ id: 'b-ao5-sub15', title: 'Sub-15 Ao5', icon: '🎯', desc: 'Média de 5 consistente abaixo de 15 segundos' });

    if (currentStreakDays >= 7) list.push({ id: 'b-streak7', title: 'Sequência 7 Dias', icon: '🔥', desc: 'Treinou por 7 dias consecutivos' });
    if (currentStreakDays >= 30) list.push({ id: 'b-streak30', title: 'Sequência 30 Dias', icon: '💫', desc: 'Treinou por 30 dias consecutivos' });

    return list;
  }, [totalSolves, getEffectivePb, currentStreakDays]);

  const handleExportPng = () => {
    exportProfileCardPng(profile, avatarUrl, bannerUrl, {
      totalSolves,
      totalTimeFormatted: totalSolvingTimeFormatted,
      bestSingleDisplay: getEffectivePb('single').timeMs ? TimeFormatter.format(getEffectivePb('single').timeMs!).display : '—',
      bestAo5Display: getEffectivePb('ao5').timeMs ? TimeFormatter.format(getEffectivePb('ao5').timeMs!).display : '—',
      bestAo12Display: getEffectivePb('ao12').timeMs ? TimeFormatter.format(getEffectivePb('ao12').timeMs!).display : '—',
    });
  };

  const handleCreateGoal = () => {
    const parsed = TimeFormatter.parseManualTime(newGoalTimeStr);
    if (parsed.timeMs > 0) {
      addGoal({ metric: newGoalMetric, targetTimeMs: parsed.timeMs });
      setIsAddingGoal(false);
      setNewGoalTimeStr('20.00');
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto p-3 sm:p-5 md:p-6 select-none space-y-6">
      {/* 1. CABEÇALHO DO PERFIL COM BANNER E AVATAR SOBREPOSTO */}
      <div className="bg-cube-surface1 border border-cube-border rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Banner (3:1, 120px mobile / 200px desktop) */}
        <div
          className={`w-full h-32 md:h-52 relative bg-cover bg-center ${
            !bannerUrl ? `bg-gradient-to-r ${profile.bannerGradient || 'from-cyan-600 via-blue-700 to-indigo-900'}` : ''
          }`}
          style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}}
        >
          {/* Overlay escuro na base para contraste AA */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

          {/* Botões do topo do banner */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={handleExportPng}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold border border-white/20 transition-all shadow-md"
              title="Exportar cartão do perfil como imagem PNG"
            >
              <Share2 className="w-3.5 h-3.5 text-cube-cyan" />
              <span className="hidden sm:inline">Exportar PNG</span>
            </button>

            <button
              id="btn-edit-profile-header"
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cube-cyan text-cube-bg hover:bg-cube-cyanGlow text-xs font-extrabold shadow-lg shadow-cube-cyanGlow/20 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar Perfil</span>
            </button>
          </div>
        </div>

        {/* Informações do Usuário com Avatar Sobreposto */}
        <div className="px-5 pb-5 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-16 mb-3">
            {/* Avatar Circular (88px mobile / 120px desktop) sobreposto */}
            <div className="flex items-end gap-4">
              <div
                className="w-22 h-22 md:w-30 md:h-30 rounded-full border-4 border-cube-surface1 bg-cube-surface2 overflow-hidden shadow-2xl flex-shrink-0 flex items-center justify-center relative z-10"
                style={{ borderColor: profile.accentColor || '#06b6d4' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile.name || profile.nick} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-cube-bg font-extrabold text-3xl md:text-4xl">
                    {profile.nick?.charAt(0).toUpperCase() || 'C'}
                  </div>
                )}
              </div>

              {/* Nick e Nome */}
              <div className="pt-2 md:pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    @{profile.nick}
                  </h1>
                  {profile.country && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cube-surface2 border border-cube-border text-cube-text font-semibold">
                      {COUNTRY_FLAGS[profile.country] || profile.country}
                    </span>
                  )}
                </div>
                {profile.name && (
                  <p className="text-xs md:text-sm text-cube-textMuted font-medium">{profile.name}</p>
                )}
              </div>
            </div>

            {/* Estatísticas Rápidas no Cabeçalho */}
            <div className="flex items-center gap-3 sm:gap-6 bg-cube-surface2/70 border border-cube-border/80 px-4 py-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cube-cyan" />
                <div>
                  <span className="text-[10px] text-cube-textDim block font-bold uppercase">Solves</span>
                  <span className="text-sm font-extrabold text-white font-mono">{totalSolves}</span>
                </div>
              </div>

              <div className="w-px h-8 bg-cube-border" />

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-[10px] text-cube-textDim block font-bold uppercase">Tempo Total</span>
                  <span className="text-sm font-extrabold text-white font-mono">{totalSolvingTimeFormatted}</span>
                </div>
              </div>

              <div className="w-px h-8 bg-cube-border" />

              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <div>
                  <span className="text-[10px] text-cube-textDim block font-bold uppercase">Sequência</span>
                  <span className="text-sm font-extrabold text-white font-mono">{currentStreakDays} dias</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-xs md:text-sm text-cube-textMuted max-w-2xl leading-relaxed whitespace-pre-wrap mt-2">
              {profile.bio}
            </p>
          )}

          {/* Chips de Informações Adicionais */}
          <div className="flex items-center gap-2 flex-wrap mt-3 text-xs">
            {profile.method && (
              <span className="px-2.5 py-1 rounded-lg bg-cube-surface2 border border-cube-border font-medium text-cube-text">
                Método: <strong className="text-cube-cyan">{profile.method}</strong>
              </span>
            )}

            {profile.mainCube && (
              <span className="px-2.5 py-1 rounded-lg bg-cube-surface2 border border-cube-border font-medium text-cube-text">
                Main: <strong className="text-white">{profile.mainCube}</strong>
              </span>
            )}

            {profile.cubingSince && (
              <span className="px-2.5 py-1 rounded-lg bg-cube-surface2 border border-cube-border font-medium text-cube-text">
                Cubando desde: <strong className="text-white">{profile.cubingSince}</strong>
              </span>
            )}

            {profile.wcaId && (
              <a
                href={`https://www.worldcubeassociation.org/persons/${profile.wcaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-700/60 font-mono font-bold text-blue-300 hover:text-white hover:bg-blue-900 transition-colors"
                title="Ver perfil oficial na WCA"
              >
                <span>WCA: {profile.wcaId}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. CARDS DE DESTAQUE DOS PBS (Single, Ao5, Ao12, Ao100) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-base font-extrabold text-white">Recordes Pessoais (PBs)</h2>
          </div>

          {/* Seletor de Escopo */}
          <div className="flex items-center gap-1 bg-cube-surface1 border border-cube-border rounded-xl p-0.5">
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                scope === 'all' ? 'bg-cube-surface2 text-cube-cyan' : 'text-cube-textMuted hover:text-white'
              }`}
            >
              Geral
            </button>
            <button
              onClick={() => setScope('current')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                scope === 'current' ? 'bg-cube-surface2 text-cube-cyan' : 'text-cube-textMuted hover:text-white'
              }`}
            >
              Sessão Atual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['single', 'ao5', 'ao12', 'ao100'] as const).map(metric => {
            const pbData = getEffectivePb(metric);
            const formatted = pbData.timeMs ? TimeFormatter.format(pbData.timeMs).display : '—';
            const manualConfig = profile.manualPbs?.[metric];

            return (
              <div
                key={metric}
                className="bg-cube-surface1 border border-cube-border hover:border-cube-cyan/40 rounded-2xl p-4 shadow-lg transition-all flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase text-cube-textDim tracking-wider">
                      PB {metric.toUpperCase()}
                    </span>

                    <button
                      onClick={() => setActiveManualPbMetric(metric)}
                      className="text-[11px] text-cube-textMuted hover:text-cube-cyan flex items-center gap-1 transition-colors"
                      title="Editar registro manual/oficial"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{pbData.source === 'manual' ? 'Manual' : 'Editar'}</span>
                    </button>
                  </div>

                  <div className="font-mono text-3xl font-extrabold text-white tracking-tight my-1">
                    {formatted}
                  </div>

                  {pbData.competition && (
                    <p className="text-[11px] text-cube-cyan font-medium truncate mt-1">
                      📍 {pbData.competition}
                    </p>
                  )}

                  {pbData.date && (
                    <p className="text-[10px] text-cube-textDim flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{pbData.date}</span>
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-cube-border/60 flex items-center justify-between text-[10px] text-cube-textDim">
                  <span>Modo: {manualConfig?.mode === 'manual' ? 'Só Manual' : manualConfig?.mode === 'auto' ? 'Só Auto' : 'Melhor'}</span>
                  {pbData.source === 'manual' && (
                    <span className="text-yellow-400 font-semibold">Oficial / Externo</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. TABELA ATUAL × MELHOR & ÚLTIMOS TEMPOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela Atual x Melhor */}
        <div className="bg-cube-surface1 border border-cube-border rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cube-cyan" />
            <span>Tabela: Atual × Melhor</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cube-border text-cube-textDim">
                  <th className="pb-2.5 font-bold">Métrica</th>
                  <th className="pb-2.5 font-bold">Atual</th>
                  <th className="pb-2.5 font-bold">Melhor (PB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cube-border/50">
                {metricsTable.map(m => (
                  <tr key={m.label} className="hover:bg-cube-surface2/40 transition-colors">
                    <td className="py-2.5 font-bold text-white">{m.label}</td>
                    <td className="py-2.5 font-mono text-cube-cyan">
                      {m.current !== null
                        ? m.current === Infinity
                          ? 'DNF'
                          : TimeFormatter.format(m.current).display
                        : '—'}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-white">
                      {m.best !== null ? TimeFormatter.format(m.best).display : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metas Ativas com Barra de Progresso Automática */}
        <div className="bg-cube-surface1 border border-cube-border rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">Metas Pessoais</h3>
              </div>
              <button
                onClick={() => setIsAddingGoal(!isAddingGoal)}
                className="flex items-center gap-1 text-xs text-cube-cyan hover:underline font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Meta</span>
              </button>
            </div>

            {isAddingGoal && (
              <div className="p-3 bg-cube-surface2 border border-cube-border rounded-xl mb-4 text-xs space-y-2 animate-scaleUp">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-cube-textDim block">Métrica:</label>
                    <select
                      value={newGoalMetric}
                      onChange={e => setNewGoalMetric(e.target.value)}
                      className="w-full bg-cube-surface1 border border-cube-border rounded-lg p-1.5 text-white text-xs"
                    >
                      <option value="single">Single</option>
                      <option value="ao5">Ao5</option>
                      <option value="ao12">Ao12</option>
                      <option value="ao50">Ao50</option>
                      <option value="ao100">Ao100</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-cube-textDim block">Alvo:</label>
                    <input
                      type="text"
                      value={newGoalTimeStr}
                      onChange={e => setNewGoalTimeStr(e.target.value)}
                      placeholder="Ex: 15.00"
                      className="w-full bg-cube-surface1 border border-cube-border rounded-lg p-1.5 text-white text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsAddingGoal(false)}
                    className="px-2.5 py-1 text-cube-textMuted hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateGoal}
                    className="px-3 py-1 bg-cube-cyan text-cube-bg font-bold rounded-lg hover:bg-cube-cyanGlow"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {(profile.goals || []).map(g => {
                const currentPb = getEffectivePb(g.metric as any).timeMs;
                const isAchieved = currentPb !== null && currentPb <= g.targetTimeMs;
                const progressPercent = currentPb !== null
                  ? Math.min(100, Math.max(0, (g.targetTimeMs / currentPb) * 100))
                  : 0;

                return (
                  <div key={g.id} className="p-3 bg-cube-surface2/60 border border-cube-border rounded-xl">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white">
                        Sub-{TimeFormatter.format(g.targetTimeMs).display} no {g.metric.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        {isAchieved ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700/50">
                            ✓ Conquistada!
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-cube-textDim">
                            Atual: {currentPb ? TimeFormatter.format(currentPb).display : '—'}
                          </span>
                        )}
                        <button
                          onClick={() => deleteGoal(g.id)}
                          className="text-cube-textDim hover:text-red-400 text-xs ml-1"
                          title="Remover meta"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-cube-surface1 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isAchieved
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                            : 'bg-gradient-to-r from-cube-cyan to-blue-500'
                        }`}
                        style={{ width: `${isAchieved ? 100 : progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SEÇÃO "OUTROS EVENTOS" (Manual) */}
      <div className="bg-cube-surface1 border border-cube-border rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-extrabold text-white">
              Outros Eventos WCA (Registros Manuais)
            </h3>
          </div>
          <button
            onClick={() => {
              setEditingOtherEvent(undefined);
              setIsOtherEventModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cube-surface2 hover:bg-cube-surface3 border border-cube-border text-xs font-semibold text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-cube-cyan" />
            <span>Adicionar Evento</span>
          </button>
        </div>

        {(profile.otherEvents || []).length === 0 ? (
          <p className="text-xs text-cube-textDim py-4 text-center">
            Nenhum outro evento registrado ainda. Adicione seus recordes em 2x2, 4x4, Megaminx, Pyraminx e mais!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(profile.otherEvents || []).map(ev => (
              <div
                key={ev.id}
                className="p-3 bg-cube-surface2/80 border border-cube-border rounded-xl hover:border-cube-cyan/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs text-white">{ev.event}</span>
                    <button
                      onClick={() => {
                        setEditingOtherEvent(ev);
                        setIsOtherEventModalOpen(true);
                      }}
                      className="text-cube-textDim hover:text-white"
                      title="Editar evento"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    {ev.singleMs && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cube-textDim">Single:</span>
                        <span className="font-bold text-white">{TimeFormatter.format(ev.singleMs).display}</span>
                      </div>
                    )}
                    {ev.averageMs && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cube-textDim">Média:</span>
                        <span className="font-bold text-cube-cyan">{TimeFormatter.format(ev.averageMs).display}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(ev.date || ev.note) && (
                  <div className="mt-2 pt-1.5 border-t border-cube-border/60 text-[10px] text-cube-textDim flex items-center justify-between">
                    <span>{ev.date || ''}</span>
                    <span className="truncate max-w-[100px]">{ev.note || ''}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. CONQUISTAS E SELOS AUTOMÁTICOS */}
      <div className="bg-cube-surface1 border border-cube-border rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>Conquistas Desbloqueadas ({badges.length})</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {badges.map(b => (
            <div
              key={b.id}
              className="p-3 rounded-xl bg-cube-surface2/60 border border-cube-border hover:border-yellow-500/40 transition-colors flex flex-col items-center text-center"
            >
              <span className="text-2xl mb-1">{b.icon}</span>
              <span className="text-xs font-bold text-white leading-tight">{b.title}</span>
              <span className="text-[10px] text-cube-textDim leading-snug mt-1">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. ÚLTIMOS TEMPOS (CHIPS) */}
      <div className="bg-cube-surface1 border border-cube-border rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-extrabold text-white mb-3">Últimas 20 Solves</h3>
        {last20Solves.length === 0 ? (
          <p className="text-xs text-cube-textDim">Nenhuma solve registrada ainda.</p>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {last20Solves.map((s, idx) => {
              const formatted = TimeFormatter.format(s.timeMs, s.penalty, 'hundredths');
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedChipSolve({ solve: s, index: allSolves.length - 1 - idx })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                    s.penalty === 'dnf'
                      ? 'border-cube-red/40 bg-cube-red/10 text-cube-red'
                      : s.penalty === 'plus2'
                      ? 'border-cube-orange/40 bg-cube-orange/10 text-cube-orange'
                      : 'border-cube-border bg-cube-surface2 hover:border-cube-cyan/40 text-cube-text hover:text-white'
                  }`}
                >
                  {formatted.display}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modais de Edição e Ação */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      {activeManualPbMetric && (
        <ManualPbModal
          isOpen={true}
          metric={activeManualPbMetric}
          initialEntry={profile.manualPbs?.[activeManualPbMetric]}
          onClose={() => setActiveManualPbMetric(null)}
          onSave={entry => setManualPb(activeManualPbMetric, entry)}
          onDelete={() => deleteManualPb(activeManualPbMetric)}
        />
      )}

      {isOtherEventModalOpen && (
        <OtherEventModal
          isOpen={true}
          initialEntry={editingOtherEvent}
          onClose={() => setIsOtherEventModalOpen(false)}
          onSave={entry => {
            if (editingOtherEvent) {
              updateOtherEvent(editingOtherEvent.id, entry);
            } else {
              addOtherEvent(entry);
            }
          }}
          onDelete={() => {
            if (editingOtherEvent) deleteOtherEvent(editingOtherEvent.id);
          }}
        />
      )}

      {selectedChipSolve && (
        <SolveDetailModal
          solve={selectedChipSolve.solve}
          solveIndex={selectedChipSolve.index}
          isOpen={true}
          onClose={() => setSelectedChipSolve(null)}
          onUpdateSolve={updateSolve}
          onDeleteSolve={deleteSolve}
        />
      )}
    </div>
  );
};
