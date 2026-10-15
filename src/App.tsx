import { useState, useEffect } from 'react';
import {
  Timer,
  History,
  User,
  BarChart2,
  BookOpen,
  Settings,
  Eye,
  EyeOff,
  Layers,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { TimerDisplay } from './features/timer/TimerDisplay';
import { useSessionStore } from './stores/sessionStore';
import { useSettingsStore } from './stores/settingsStore';
import { useSolveStore } from './stores/solveStore';
import { requestStoragePersistence } from './data/db';

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

  const { loadSettings } = useSettingsStore();
  const { loadSolvesForSession } = useSolveStore();

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
    <div className="flex h-screen w-screen overflow-hidden bg-cube-bg text-cube-text flex-col md:flex-row">
      {/* Barra Lateral Desktop */}
      {!isFocusMode && (
        <aside className="hidden md:flex flex-col w-64 bg-cube-surface1 border-r border-cube-border select-none z-20">
          <div className="p-5 flex items-center gap-3 border-b border-cube-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-cube-cyan flex items-center justify-center shadow-lg shadow-cube-cyanGlow">
              <Layers className="w-6 h-6 text-cube-bg font-bold" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-cube-text to-cube-cyan bg-clip-text text-transparent">
                CubeLab
              </h1>
              <p className="text-xs text-cube-textDim font-medium">3x3 Speedcubing PWA</p>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            <button
              id="nav-timer"
              onClick={() => setActiveTab('timer')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'timer'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <Timer className="w-5 h-5" />
              <span>Cronômetro</span>
            </button>

            <button
              id="nav-history"
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <History className="w-5 h-5" />
              <span>Histórico</span>
            </button>

            <button
              id="nav-profile"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Perfil & PBs</span>
            </button>

            <button
              id="nav-stats"
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'stats'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              <span>Estatísticas</span>
            </button>

            <button
              id="nav-algorithms"
              onClick={() => setActiveTab('algorithms')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'algorithms'
                  ? 'bg-cube-surface2 text-cube-cyan border border-cube-cyan/30 shadow-md shadow-cube-cyanGlow/20'
                  : 'text-cube-textMuted hover:text-white hover:bg-cube-surface2/60'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Algoritmos CFOP</span>
            </button>
          </nav>

          <div className="p-4 border-t border-cube-border">
            <button
              id="nav-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-cube-textMuted hover:text-white hover:bg-cube-surface2/60 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Configurações</span>
            </button>
          </div>
        </aside>
      )}

      {/* Área Central de Conteúdo */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        {!isFocusMode && (
          <header className="h-14 border-b border-cube-border bg-cube-surface1/60 backdrop-blur-md px-4 flex items-center justify-between select-none z-30">
            <div className="flex items-center gap-3">
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-cube-cyan flex items-center justify-center">
                  <Layers className="w-5 h-5 text-cube-bg font-bold" />
                </div>
                <span className="font-bold text-lg text-white">CubeLab</span>
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
                onClick={() => setIsFocusMode(!isFocusMode)}
                title={isFocusMode ? 'Sair do Modo Foco' : 'Ativar Modo Foco'}
                className="p-2 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white transition-colors"
              >
                {isFocusMode ? <EyeOff className="w-4 h-4 text-cube-cyan" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                id="btn-top-settings"
                onClick={() => setIsSettingsOpen(true)}
                className="md:hidden p-2 rounded-lg bg-cube-surface2 hover:bg-cube-surface3 text-cube-textMuted hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}

        {/* View da Tab Ativa */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === 'timer' && <TimerDisplay />}

          {activeTab === 'history' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Histórico de Solves</h2>
              <p className="text-cube-textMuted text-sm">Próxima fase de integração.</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Perfil & PBs</h2>
              <p className="text-cube-textMuted text-sm">Próxima fase de integração.</p>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Estatísticas</h2>
              <p className="text-cube-textMuted text-sm">Próxima fase de integração.</p>
            </div>
          )}

          {activeTab === 'algorithms' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Biblioteca de Algoritmos</h2>
              <p className="text-cube-textMuted text-sm">Fase 4 de curadoria e validação.</p>
            </div>
          )}
        </div>

        {/* Barra Inferior Mobile */}
        {!isFocusMode && (
          <nav className="md:hidden border-t border-cube-border bg-cube-surface1/95 backdrop-blur-md px-2 py-1 flex items-center justify-around z-20">
            <button
              onClick={() => setActiveTab('timer')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'timer' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <Timer className="w-5 h-5 mb-0.5" />
              <span>Timer</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'history' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <History className="w-5 h-5 mb-0.5" />
              <span>Histórico</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'profile' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span>Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'stats' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <BarChart2 className="w-5 h-5 mb-0.5" />
              <span>Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('algorithms')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'algorithms' ? 'text-cube-cyan' : 'text-cube-textMuted'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
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

      {/* Modal de Configurações */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cube-surface2 border border-cube-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Configurações</h3>
            <p className="text-sm text-cube-textMuted mb-6">
              Opções de inspeção WCA, limiar de segurar, precisão e temas.
            </p>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-2.5 rounded-xl bg-cube-cyan text-cube-bg font-bold hover:bg-cube-cyanGlow transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
