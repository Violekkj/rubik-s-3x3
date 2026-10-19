import { useState, useEffect, useCallback } from 'react';
import {
  Timer,
  History,
  User,
  BarChart2,
  BookOpen,
  Settings,
  Eye,
  EyeOff,
  Minimize2,
  Layers,
  Plus,
  ChevronDown,
  Volume2,
} from 'lucide-react';
import { TimerDisplay } from './features/timer/TimerDisplay';
import { SolveHistoryTable } from './features/history/SolveHistoryTable';
import { ProfileView } from './features/profile/ProfileView';
import { StatsView } from './features/stats/StatsView';
import { AlgorithmsView } from './features/algorithms/AlgorithmsView';
import { useSessionStore } from './stores/sessionStore';
import { useSettingsStore } from './stores/settingsStore';
import { useSolveStore } from './stores/solveStore';
import { requestStoragePersistence } from './data/db';
import { audioCues } from './hooks/useAudioCues';

export type ActiveTab = 'timer' | 'history' | 'profile' | 'stats' | 'algorithms';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('timer');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState<boolean>(false);
  const [newSessionName, setNewSessionName] = useState<string>('');
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState<boolean>(false);

  const {
    sessions,
    activeSessionId,
    loadSessions,
    createSession,
    setActiveSessionId,
  } = useSessionStore();

  const { settings, updateSettings, loadSettings } = useSettingsStore();
  const { isTimerRunning, loadSolvesForSession } = useSolveStore();

  // Inicializa dados locais
  useEffect(() => {
    loadSessions();
    loadSettings();
    requestStoragePersistence();
  }, [loadSessions, loadSettings]);

  // Carrega solves sempre que a sessão ativa mudar
  useEffect(() => {
    if (activeSessionId) {
      loadSolvesForSession(activeSessionId);
    }
  }, [activeSessionId, loadSolvesForSession]);

  // Controle de Modo Foco e Sincronização com Fullscreen API
  const enterFocusMode = useCallback(async () => {
    setIsFocusMode(true);
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fallback para iOS / navegadores sem Fullscreen API
    }
  }, []);

  const exitFocusMode = useCallback(async () => {
    setIsFocusMode(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignora erro
    }
  }, []);

  const toggleFocusMode = useCallback(() => {
    if (isFocusMode) {
      exitFocusMode();
    } else {
      enterFocusMode();
    }
  }, [isFocusMode, enterFocusMode, exitFocusMode]);

  // Sincroniza com evento nativo fullscreenchange
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFocusMode(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Atalho ESC para sair do modo foco sem cancelar a solve em andamento
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault();
        exitFocusMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocusMode, exitFocusMode]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleCreateSession = async () => {
    if (newSessionName.trim()) {
      await createSession(newSessionName.trim());
      setNewSessionName('');
      setIsNewSessionModalOpen(false);
      setIsSessionDropdownOpen(false);
    }
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden bg-cube-bg text-cube-text flex-col md:flex-row ${
        isFocusMode ? 'fixed inset-0 z-40' : ''
      }`}
    >
      {/* Botão de Saída do Modo Foco: Canto Superior Direito, 36px, Ícone X/Minimizar */}
      {isFocusMode && (
        <button
          id="btn-exit-focus-mode"
          onClick={exitFocusMode}
          disabled={isTimerRunning}
          aria-label="Sair (Esc)"
          title="Sair (Esc)"
          className={`fixed top-3 right-3 z-50 w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-cube-surface2/80 border border-cube-border backdrop-blur-md ${
            isTimerRunning
              ? 'opacity-20 pointer-events-none'
              : 'opacity-50 hover:opacity-100 hover:bg-cube-surface3 text-white'
          }`}
        >
          <Minimize2 className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Barra Lateral Desktop */}
      {!isFocusMode && (
        <aside className="hidden md:flex flex-col w-64 bg-cube-surface1 border-r border-cube-border select-none z-20 flex-shrink-0">
          <div className="p-4 flex items-center gap-3 border-b border-cube-border">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cube-cyan flex items-center justify-center shadow-lg shadow-cube-cyanGlow">
              <Layers className="w-5 h-5 text-cube-bg font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-cube-text to-cube-cyan bg-clip-text text-transparent">
                CubeLab
              </h1>
              <p className="text-[11px] text-cube-textDim font-medium">3x3 Speedcubing PWA</p>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            <button
              id="nav-timer"
              onClick={() => setActiveTab('timer')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'timer'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Cronômetro</span>
            </button>

            <button
              id="nav-history"
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Histórico</span>
            </button>

            <button
              id="nav-profile"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Perfil & PBs</span>
            </button>

            <button
              id="nav-stats"
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'stats'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Estatísticas</span>
            </button>

            <button
              id="nav-algorithms"
              onClick={() => setActiveTab('algorithms')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'algorithms'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Algoritmos CFOP</span>
            </button>
          </nav>

          <div className="p-3 border-t border-cube-border">
            <button
              id="nav-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-cube-textMuted hover:text-white hover:bg-cube-surface2/60 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
          </div>
        </aside>
      )}

      {/* Área Central de Conteúdo */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        {!isFocusMode && (
          <header className="h-12 border-b border-cube-border bg-cube-surface1/60 backdrop-blur-md px-4 flex items-center justify-between select-none z-30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="md:hidden flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-cube-cyan flex items-center justify-center">
                  <Layers className="w-4 h-4 text-cube-bg font-bold" />
                </div>
                <span className="font-bold text-base text-white">CubeLab</span>
              </div>

              {/* Seletor de Sessão Dropdown */}
              <div className="relative">
                <button
                  id="btn-session-dropdown"
                  onClick={() => setIsSessionDropdownOpen(!isSessionDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cube-surface2 border border-cube-border hover:border-cube-cyan/40 text-xs font-semibold text-cube-cyan transition-colors"
                >
                  <span className="text-cube-textDim">Sessão:</span>
                  <span className="text-white max-w-[120px] truncate">
                    {activeSession?.name || 'Sessão 1'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-cube-textMuted" />
                </button>

                {isSessionDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-cube-surface2 border border-cube-border rounded-xl shadow-2xl py-1 z-50 animate-scaleUp">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-cube-textDim uppercase tracking-wider border-b border-cube-border">
                      Suas Sessões
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                      {sessions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveSessionId(s.id);
                            setIsSessionDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-cube-surface3 transition-colors ${
                            s.id === activeSessionId ? 'text-cube-cyan font-bold bg-cube-surface3/40' : 'text-cube-text'
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          {s.id === activeSessionId && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cube-cyan" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="p-2 border-t border-cube-border">
                      <button
                        onClick={() => {
                          setIsNewSessionModalOpen(true);
                          setIsSessionDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cube-surface1 hover:bg-cube-cyan hover:text-cube-bg text-xs font-semibold text-cube-cyan transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nova Sessão</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-focus-mode"
                onClick={toggleFocusMode}
                title={isFocusMode ? 'Sair do Modo Foco (Esc)' : 'Ativar Modo Foco (Tela Cheia)'}
                className="p-1.5 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white transition-colors"
              >
                {isFocusMode ? <EyeOff className="w-4 h-4 text-cube-cyan" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                id="btn-top-settings"
                onClick={() => setIsSettingsOpen(true)}
                className="md:hidden p-1.5 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}

        {/* View da Tab Ativa */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === 'timer' && <TimerDisplay isFocusMode={isFocusMode} />}

          {activeTab === 'history' && <SolveHistoryTable />}

          {activeTab === 'profile' && <ProfileView />}

          {activeTab === 'stats' && <StatsView />}

          {activeTab === 'algorithms' && <AlgorithmsView />}
        </div>

        {/* Barra Inferior Mobile */}
        {!isFocusMode && (
          <nav className="md:hidden border-t border-cube-border bg-cube-surface1/95 backdrop-blur-md px-2 py-1 flex items-center justify-around z-20 flex-shrink-0">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'timer' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <Timer className="w-4 h-4 mb-0.5" />
              <span>Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'history' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <History className="w-4 h-4 mb-0.5" />
              <span>Histórico</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'profile' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <User className="w-4 h-4 mb-0.5" />
              <span>Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'stats' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <BarChart2 className="w-4 h-4 mb-0.5" />
              <span>Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('algorithms')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'algorithms' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <BookOpen className="w-4 h-4 mb-0.5" />
              <span>Algs</span>
            </button>
          </nav>
        )}
      </main>

      {/* Modal Criar Nova Sessão */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-bold text-white mb-3">Criar Nova Sessão</h3>
            <input
              type="text"
              autoFocus
              value={newSessionName}
              onChange={e => setNewSessionName(e.target.value)}
              placeholder="Ex: Treino OLL, Competição..."
              className="w-full bg-cube-surface1 border border-cube-border rounded-xl p-3 text-sm text-white placeholder-cube-textDim focus:outline-none focus:border-cube-cyan transition-colors"
            />
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewSessionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-cube-textMuted hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!newSessionName.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cube-cyan text-cube-bg hover:bg-cube-cyanGlow disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configurações Completo */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-cube-border mb-4">
              <h3 className="text-lg font-bold text-white">Configurações</h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-cube-textMuted hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-sm">
              {/* Tamanho do Cronômetro */}
              <div>
                <label className="block text-xs font-bold text-cube-textDim uppercase tracking-wider mb-2">
                  Tamanho do Cronômetro
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => updateSettings({ timerSize: size })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        settings.timerSize === size
                          ? 'border-cube-cyan bg-cube-cyan/15 text-cube-cyan'
                          : 'border-cube-border bg-cube-surface1 text-cube-textMuted hover:text-white'
                      }`}
                    >
                      {size === 'small' ? 'Pequeno (0,75x)' : size === 'large' ? 'Grande (1,3x)' : 'Médio (Padrão)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspeção WCA */}
              <div className="pt-3 border-t border-cube-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-white block">Inspeção WCA (15 segundos)</span>
                    <span className="text-xs text-cube-textDim">Regras oficiais WCA com penalidades automáticas</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.inspectionEnabled}
                    onChange={e => updateSettings({ inspectionEnabled: e.target.checked })}
                    className="w-4 h-4 accent-cube-cyan cursor-pointer"
                  />
                </div>

                {settings.inspectionEnabled && (
                  <div className="space-y-3 pl-2 border-l-2 border-cube-cyan/30 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-cube-text">Bipes sonoros da inspeção</span>
                      <input
                        type="checkbox"
                        checked={settings.inspectionAudioAlerts}
                        onChange={e => updateSettings({ inspectionAudioAlerts: e.target.checked })}
                        className="w-4 h-4 accent-cube-cyan cursor-pointer"
                      />
                    </div>

                    {settings.inspectionAudioAlerts && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-cube-textDim mb-1">
                              1º aviso em (s no display):
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={14}
                              value={settings.inspectionWarning1Sec ?? 8}
                              onChange={e => {
                                const val = Math.max(1, Math.min(14, Number(e.target.value) || 8));
                                updateSettings({ inspectionWarning1Sec: val });
                              }}
                              className="w-full bg-cube-surface1 border border-cube-border rounded-lg p-2 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-cube-textDim mb-1">
                              2º aviso em (s no display):
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={14}
                              value={settings.inspectionWarning2Sec ?? 2}
                              onChange={e => {
                                const val = Math.max(1, Math.min(14, Number(e.target.value) || 2));
                                updateSettings({ inspectionWarning2Sec: val });
                              }}
                              className="w-full bg-cube-surface1 border border-cube-border rounded-lg p-2 text-xs text-white"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-cube-textDim">
                          * Nota: no contador regressivo, 8 e 2 equivalem aos avisos oficiais WCA de 7s e 13s decorridos.
                        </p>

                        {/* Slider de Volume dos Bipes */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-cube-text">Volume dos bipes ({settings.beepVolume ?? 25}%)</span>
                            <button
                              onClick={() => audioCues.testBeep(settings.beepVolume ?? 25)}
                              className="flex items-center gap-1 text-[11px] text-cube-cyan hover:underline"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Testar som</span>
                            </button>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={settings.beepVolume ?? 25}
                            onChange={e => updateSettings({ beepVolume: Number(e.target.value) })}
                            className="w-full accent-cube-cyan cursor-pointer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Frente nos Diagramas de Algoritmos */}
              <div className="pt-3 border-t border-cube-border">
                <label className="block text-xs font-bold text-cube-textDim uppercase tracking-wider mb-2">
                  Frente nos Diagramas de Algoritmos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSettings({ diagramFrontColor: 'green' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      (settings.diagramFrontColor ?? 'green') === 'green'
                        ? 'border-cube-cyan bg-cube-cyan/15 text-cube-cyan'
                        : 'border-cube-border bg-cube-surface1 text-cube-textMuted hover:text-white'
                    }`}
                  >
                    Verde (Padrão)
                  </button>
                  <button
                    onClick={() => updateSettings({ diagramFrontColor: 'blue' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      settings.diagramFrontColor === 'blue'
                        ? 'border-cube-cyan bg-cube-cyan/15 text-cube-cyan'
                        : 'border-cube-border bg-cube-surface1 text-cube-textMuted hover:text-white'
                    }`}
                  >
                    Azul
                  </button>
                </div>
              </div>

              {/* Precisão do Timer */}
              <div className="pt-3 border-t border-cube-border">
                <label className="block text-xs font-bold text-cube-textDim uppercase tracking-wider mb-2">
                  Precisão do Timer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSettings({ timerPrecision: 'hundredths' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      settings.timerPrecision === 'hundredths'
                        ? 'border-cube-cyan bg-cube-cyan/15 text-cube-cyan'
                        : 'border-cube-border bg-cube-surface1 text-cube-textMuted hover:text-white'
                    }`}
                  >
                    Centésimos (0.00)
                  </button>
                  <button
                    onClick={() => updateSettings({ timerPrecision: 'thousandths' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      settings.timerPrecision === 'thousandths'
                        ? 'border-cube-cyan bg-cube-cyan/15 text-cube-cyan'
                        : 'border-cube-border bg-cube-surface1 text-cube-textMuted hover:text-white'
                    }`}
                  >
                    Milésimos (0.000)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-cube-cyan text-cube-bg font-bold hover:bg-cube-cyanGlow transition-colors"
            >
              Salvar e Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
