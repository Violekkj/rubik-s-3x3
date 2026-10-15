import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  Flame,
  Calendar,
  BarChart2,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useSolveStore } from '../../stores/solveStore';
import { SummaryStatsCalculator } from '../../core/stats/summaryStats';
import { TimeFormatter } from '../../core/timer/timeFormatter';

export const StatsView: React.FC = () => {
  const { solves } = useSolveStore();
  const [timeFilterDays, setTimeFilterDays] = useState<number>(0); // 0 = Tudo

  const stats = useMemo(() => {
    return SummaryStatsCalculator.calculate(solves, timeFilterDays);
  }, [solves, timeFilterDays]);

  // Prepara dados para o gráfico de progresso
  const progressChartData = useMemo(() => {
    return solves.slice(-60).map((s, idx) => ({
      index: idx + 1,
      time: s.penalty === 'dnf' ? null : Math.round(s.effectiveTimeMs / 10) / 100,
    }));
  }, [solves]);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto p-4 md:p-6 select-none space-y-6">
      {/* Topo: Título e Filtro de Período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cube-border">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cube-cyan" />
            <span>Estatísticas e Análise de Desempenho</span>
          </h2>
          <p className="text-xs text-cube-textDim mt-0.5">
            Métricas analíticas calculadas em tempo real com base no seu histórico
          </p>
        </div>

        {/* Filtros de período: 7d, 30d, 90d, Tudo */}
        <div className="flex items-center bg-cube-surface2 p-1 rounded-xl border border-cube-border text-xs font-semibold">
          <button
            onClick={() => setTimeFilterDays(7)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              timeFilterDays === 7
                ? 'bg-cube-cyan text-cube-bg shadow-sm'
                : 'text-cube-textMuted hover:text-white'
            }`}
          >
            7d
          </button>
          <button
            onClick={() => setTimeFilterDays(30)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              timeFilterDays === 30
                ? 'bg-cube-cyan text-cube-bg shadow-sm'
                : 'text-cube-textMuted hover:text-white'
            }`}
          >
            30d
          </button>
          <button
            onClick={() => setTimeFilterDays(90)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              timeFilterDays === 90
                ? 'bg-cube-cyan text-cube-bg shadow-sm'
                : 'text-cube-textMuted hover:text-white'
            }`}
          >
            90d
          </button>
          <button
            onClick={() => setTimeFilterDays(0)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              timeFilterDays === 0
                ? 'bg-cube-cyan text-cube-bg shadow-sm'
                : 'text-cube-textMuted hover:text-white'
            }`}
          >
            Tudo
          </button>
        </div>
      </div>

      {/* Cartão de Destaque: Tempo Total Resolvendo */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cube-surface2 via-cube-surface1 to-cube-surface2 border border-cube-border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cube-cyan mb-1">
            <Clock className="w-4 h-4" />
            <span>Tempo Total Resolvendo</span>
            <div
              className="relative group cursor-pointer ml-1"
              title="Soma de todos os tempos brutos de tentativas, incluindo DNFs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cube-textDim hover:text-white" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            {stats.totalTimeFormatted}
          </div>
          <p className="text-xs text-cube-textDim mt-1">
            Tempo real investido girando o cubo mágico no cronômetro.
          </p>
        </div>

        {/* Sequência (Streak) */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cube-surface3/40 border border-cube-border">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Flame className="w-6 h-6 fill-orange-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-cube-textDim uppercase">Sequência</div>
            <div className="text-lg font-extrabold text-white">
              {stats.streakDays} {stats.streakDays === 1 ? 'dia' : 'dias'} 🔥
            </div>
          </div>
        </div>
      </div>

      {/* Grade de Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-cube-surface1 border border-cube-border">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cube-textDim uppercase mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cube-green" />
            <span>Total Solves</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{stats.totalSolves}</div>
          <div className="text-[11px] text-cube-textDim mt-1 flex gap-2">
            <span>OK: {stats.validSolves}</span>
            <span>+2: {stats.plus2Solves}</span>
            <span>DNF: {stats.dnfSolves}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-cube-surface1 border border-cube-border">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cube-textDim uppercase mb-1">
            <Calendar className="w-3.5 h-3.5 text-cube-cyan" />
            <span>Hoje / Semana</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{stats.solvesToday}</div>
          <div className="text-[11px] text-cube-textDim mt-1">
            Esta semana: <strong>{stats.solvesThisWeek}</strong>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-cube-surface1 border border-cube-border">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cube-textDim uppercase mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-cube-cyan" />
            <span>Média / Mediana</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats.meanMs ? TimeFormatter.format(stats.meanMs).display : '—'}
          </div>
          <div className="text-[11px] text-cube-textDim mt-1">
            Mediana: {stats.medianMs ? TimeFormatter.format(stats.medianMs).display : '—'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-cube-surface1 border border-cube-border">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cube-textDim uppercase mb-1">
            <span>Desvio Padrão</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {stats.stdDevMs ? `±${(stats.stdDevMs / 1000).toFixed(2)}s` : '—'}
          </div>
          <div className="text-[11px] text-cube-textDim mt-1">
            Média/dia ativo: {stats.avgPerActiveDay}
          </div>
        </div>
      </div>

      {/* Histograma de Distribuição */}
      <div className="p-5 rounded-2xl bg-cube-surface1 border border-cube-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cube-textDim mb-3">
          Distribuição dos Tempos (Histograma)
        </h3>
        {stats.histogram.length === 0 ? (
          <p className="text-xs text-cube-textDim py-8 text-center">
            Poucas solves para gerar o histograma de distribuição.
          </p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.histogram}>
                <XAxis dataKey="range" stroke="#536E87" fontSize={11} tickLine={false} />
                <YAxis stroke="#536E87" fontSize={11} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0E253B',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#FFF',
                  }}
                />
                <Bar dataKey="count" fill="#00D4FF" radius={[4, 4, 0, 0]} name="Solves" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Gráfico de Progresso das Últimas 60 Solves */}
      <div className="p-5 rounded-2xl bg-cube-surface1 border border-cube-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cube-textDim mb-3">
          Progresso Recente (Últimas 60 Solves em Segundos)
        </h3>
        {progressChartData.length < 3 ? (
          <p className="text-xs text-cube-textDim py-8 text-center">
            Faça mais solves para gerar o gráfico de evolução.
          </p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressChartData}>
                <XAxis dataKey="index" stroke="#536E87" fontSize={11} tickLine={false} />
                <YAxis stroke="#536E87" fontSize={11} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0E253B',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#FFF',
                  }}
                  formatter={(val: any) => [`${val}s`, 'Tempo']}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#2BE04B"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#2BE04B' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Calendário de Atividade (Heatmap de Consistência) */}
      <div className="p-5 rounded-2xl bg-cube-surface1 border border-cube-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cube-textDim">
            Consistência de Treino (Últimos 84 Dias)
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] text-cube-textDim">
            <span>Menos</span>
            <span className="w-2.5 h-2.5 rounded-sm bg-cube-surface2" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-900" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-700" />
            <span className="w-2.5 h-2.5 rounded-sm bg-cube-cyan" />
            <span>Mais</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {stats.activityCalendar.map(day => {
            let bgClass = 'bg-cube-surface2';
            if (day.level === 1) bgClass = 'bg-cyan-950 text-cyan-200';
            else if (day.level === 2) bgClass = 'bg-cyan-800 text-cyan-100';
            else if (day.level === 3) bgClass = 'bg-cyan-600 text-white';
            else if (day.level === 4) bgClass = 'bg-cube-cyan text-cube-bg';

            return (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} solves`}
                className={`w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer ${bgClass}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
