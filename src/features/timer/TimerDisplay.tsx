import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Star, Keyboard, Undo2 } from 'lucide-react';
import { TimerStateMachine } from '../../core/timer/timerStateMachine';
import { TimeFormatter } from '../../core/timer/timeFormatter';
import { PenaltyType, TimerState } from '../../core/timer/types';
import { audioCues } from '../../hooks/useAudioCues';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSolveStore } from '../../stores/solveStore';
import { useSessionStore } from '../../stores/sessionStore';
import { ScrambleBar } from './ScrambleBar';
import { CubeNetView } from './CubeNetView';
import { PostSolveToolbar } from './PostSolveToolbar';
import { ManualScrambleModal } from './ManualScrambleModal';
import { ManualTimeModal } from './ManualTimeModal';
import { SolveDetailModal } from '../history/SolveDetailModal';
import { scrambleManager } from '../../core/scramble/scrambleGenerator';
import { SolveRecord } from '../../data/db';

interface TimerDisplayProps {
  isFocusMode?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ isFocusMode = false }) => {
  const { settings } = useSettingsStore();
  const { activeSessionId } = useSessionStore();
  const {
    solves,
    lastSolve,
    newPbAlert,
    setIsTimerRunning,
    toast,
    showToast,
    clearToast,
    addSolve,
    togglePenalty,
    deleteSolve,
    undoLastSolve,
    updateSolve,
    getCurrentAo5,
    getCurrentAo12,
  } = useSolveStore();

  const [currentScramble, setCurrentScramble] = useState<string>('');
  const [hasPrevScramble, setHasPrevScramble] = useState<boolean>(false);
  const [isManualScrambleModalOpen, setIsManualScrambleModalOpen] = useState(false);
  const [isManualTimeModalOpen, setIsManualTimeModalOpen] = useState(false);
  const [selectedSolveModal, setSelectedSolveModal] = useState<SolveRecord | null>(null);

  // Estados locais reativos do timer
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [displayTime, setDisplayTime] = useState<string>('0.00');
  const [inspectionDisplay, setInspectionDisplay] = useState<{
    text: string;
    isPlus2: boolean;
    isDnf: boolean;
  }>({ text: '15', isPlus2: false, isDnf: false });
  const [lastPenalty, setLastPenalty] = useState<PenaltyType>('none');

  // Referência da máquina de estados e requestAnimationFrame
  const timerMachineRef = useRef<TimerStateMachine | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const runStartTimeRef = useRef<number>(0);

  // Rastreamento de gestos de parada para evitar reinício acidental
  const stopKeyRef = useRef<string | null>(null);
  const stopPointerIdRef = useRef<number | null>(null);
  const stopLockoutUntilRef = useRef<number>(0);

  // Refs para dados atualizados consumidos pelos callbacks estáveis
  const currentScrambleRef = useRef(currentScramble);
  currentScrambleRef.current = currentScramble;

  const activeSessionIdRef = useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const isFocusModeRef = useRef(isFocusMode);
  isFocusModeRef.current = isFocusMode;

  // Inicializa o gerenciador de scrambles na montagem
  useEffect(() => {
    let isMounted = true;
    scrambleManager.init().then(() => {
      if (isMounted) {
        scrambleManager.getNextScramble().then(sc => {
          if (isMounted) {
            setCurrentScramble(sc);
            setHasPrevScramble(scrambleManager.hasPrevious());
          }
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNextScramble = useCallback(async () => {
    const sc = await scrambleManager.getNextScramble();
    setCurrentScramble(sc);
    setHasPrevScramble(scrambleManager.hasPrevious());
  }, []);

  const handlePrevScramble = useCallback(() => {
    const sc = scrambleManager.getPreviousScramble();
    if (sc) {
      setCurrentScramble(sc);
      setHasPrevScramble(scrambleManager.hasPrevious());
    }
  }, []);

  const startRunningRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    const update = () => {
      const now = performance.now();
      const elapsed = Math.max(0, now - runStartTimeRef.current);

      if (settingsRef.current.hideTimerWhileRunning) {
        setDisplayTime('Resolvendo...');
      } else {
        const formatted = TimeFormatter.format(
          elapsed,
          'none',
          settingsRef.current.timerPrecision
        );
        setDisplayTime(formatted.display);
      }

      rafIdRef.current = requestAnimationFrame(update);
    };
    rafIdRef.current = requestAnimationFrame(update);
  }, []);

  const stopRunningRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Criação da máquina de estados UMA ÚNICA VEZ na montagem
  useEffect(() => {
    const machine = new TimerStateMachine(
      {
        inspectionEnabled: settingsRef.current.inspectionEnabled,
        inspectionDurationMs: settingsRef.current.inspectionDurationMs,
        inspectionWarning1Sec: settingsRef.current.inspectionWarning1Sec ?? 8,
        inspectionWarning2Sec: settingsRef.current.inspectionWarning2Sec ?? 2,
        holdingThresholdMs: settingsRef.current.holdingThresholdMs,
        precision: settingsRef.current.timerPrecision,
      },
      {
        onStateChange: newState => {
          setTimerState(newState);
          setIsTimerRunning(newState === 'running');
          if (newState === 'running') {
            runStartTimeRef.current = performance.now();
            startRunningRaf();
          } else {
            stopRunningRaf();
          }
        },
        onInspectionTick: (_remainingMs, displayedSec, penalty) => {
          if (penalty === 'plus2') {
            setInspectionDisplay({ text: '+2', isPlus2: true, isDnf: false });
          } else if (penalty === 'dnf') {
            setInspectionDisplay({ text: 'DNF', isPlus2: false, isDnf: true });
          } else {
            setInspectionDisplay({ text: String(displayedSec), isPlus2: false, isDnf: false });
          }
        },
        onInspectionWarning: () => {
          audioCues.warnInspection(
            settingsRef.current.inspectionAudioAlerts,
            settingsRef.current.beepVolume ?? 25
          );
        },
        onInspectionAutoDnf: async inspectionMs => {
          setLastPenalty('dnf');
          setDisplayTime('DNF');
          const createdSolve = await addSolve({
            sessionId: activeSessionIdRef.current,
            timeMs: 0,
            penalty: 'dnf',
            scramble: currentScrambleRef.current,
            scrambleSource: 'random',
            inspectionMs,
            note: 'auto-DNF',
          });
          showToast('DNF por inspeção (tempo excedido > 17s)', 'Desfazer', async () => {
            if (createdSolve) {
              await deleteSolve(createdSolve.id);
            }
          });
          handleNextScramble();
        },
        onStop: async (elapsedMs, penalty, inspectionMs) => {
          setLastPenalty(penalty);

          const formatted = TimeFormatter.format(
            elapsedMs,
            penalty,
            settingsRef.current.timerPrecision
          );
          setDisplayTime(formatted.display);

          // Salva solve no store e banco Dexie (uma única vez)
          await addSolve({
            sessionId: activeSessionIdRef.current,
            timeMs: elapsedMs,
            penalty,
            scramble: currentScrambleRef.current,
            scrambleSource: 'random',
            inspectionMs,
          });

          // Prepara próximo scramble automaticamente
          handleNextScramble();
        },
      }
    );

    timerMachineRef.current = machine;

    return () => {
      machine.reset();
      stopRunningRaf();
    };
  }, [addSolve, deleteSolve, handleNextScramble, setIsTimerRunning, showToast, startRunningRaf, stopRunningRaf]);

  // Atualiza configurações na máquina quando settings mudar
  useEffect(() => {
    if (timerMachineRef.current) {
      timerMachineRef.current.updateConfig({
        inspectionEnabled: settings.inspectionEnabled,
        inspectionDurationMs: settings.inspectionDurationMs,
        inspectionWarning1Sec: settings.inspectionWarning1Sec ?? 8,
        inspectionWarning2Sec: settings.inspectionWarning2Sec ?? 2,
        holdingThresholdMs: settings.holdingThresholdMs,
        precision: settings.timerPrecision,
      });
    }
  }, [settings]);

  // Listeners de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando em campos de texto
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.repeat) return;

      const machine = timerMachineRef.current;
      if (!machine) return;

      const currentState = machine.getState();

      // Qualquer tecla para o cronômetro enquanto estiver rodando!
      if (currentState === 'running') {
        e.preventDefault();
        stopKeyRef.current = e.code;
        stopLockoutUntilRef.current = performance.now() + 300;
        machine.handlePrimaryDown();
        return;
      }

      // Tecla de cancelamento (ESC)
      if (e.key === 'Escape') {
        // Se estiver no modo foco, o ESC é consumido pela saída do modo foco
        if (isFocusModeRef.current) {
          return;
        }
        machine.cancel();
        setDisplayTime('0.00');
        return;
      }

      // Se estiver em lockout pós-parada, ignora
      if (performance.now() < stopLockoutUntilRef.current) {
        return;
      }

      // Tecla Espaço: controle principal
      if (e.code === 'Space') {
        e.preventDefault();
        machine.handlePrimaryDown();
        return;
      }

      // Atalhos pós-solve no teclado
      if (currentState === 'idle') {
        if (lastSolve) {
          if (e.key === '2') {
            togglePenalty(lastSolve.id, 'plus2');
          } else if (e.key === 'd' || e.key === 'D') {
            togglePenalty(lastSolve.id, 'dnf');
          } else if (e.key === 'Delete') {
            deleteSolve(lastSolve.id);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Se este release pertencia ao gesto que parou o cronômetro, descarta
      if (stopKeyRef.current && e.code === stopKeyRef.current) {
        stopKeyRef.current = null;
        e.preventDefault();
        return;
      }

      if (performance.now() < stopLockoutUntilRef.current) {
        return;
      }

      const machine = timerMachineRef.current;
      if (!machine) return;

      if (e.code === 'Space') {
        e.preventDefault();
        machine.handlePrimaryUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [lastSolve, togglePenalty, deleteSolve]);

  // Handlers para Touch / Pointer na tela
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('a')) {
      return;
    }

    const machine = timerMachineRef.current;
    if (!machine) return;

    if (timerState === 'running') {
      stopPointerIdRef.current = e.pointerId;
      stopLockoutUntilRef.current = performance.now() + 300;
      machine.handlePrimaryDown();
      return;
    }

    if (performance.now() < stopLockoutUntilRef.current) {
      return;
    }

    machine.handlePrimaryDown();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('a')) {
      return;
    }

    // Se este release pertencia ao gesto de parada, descarta
    if (stopPointerIdRef.current !== null && e.pointerId === stopPointerIdRef.current) {
      stopPointerIdRef.current = null;
      return;
    }

    if (performance.now() < stopLockoutUntilRef.current) {
      return;
    }

    const machine = timerMachineRef.current;
    if (!machine) return;

    machine.handlePrimaryUp();
  };

  // Cores dinâmicas do Timer conforme o estado da máquina
  const getTimerColorClass = () => {
    switch (timerState) {
      case 'inspecting':
        if (inspectionDisplay.isPlus2 || inspectionDisplay.isDnf) {
          return 'text-cube-red drop-shadow-[0_0_24px_rgba(255,59,59,0.5)]';
        }
        return Number(inspectionDisplay.text) <= 3 ? 'text-cube-red' : 'text-cube-timerInspect';
      case 'holding':
        return 'text-cube-timerHolding';
      case 'ready':
        return 'text-cube-timerReady drop-shadow-[0_0_24px_rgba(43,224,75,0.4)]';
      case 'running':
        return 'text-white';
      default:
        return lastPenalty === 'dnf'
          ? 'text-cube-red'
          : lastPenalty === 'plus2'
          ? 'text-cube-orange'
          : 'text-white';
    }
  };

  // Cálculo de tamanho responsivo do cronômetro baseado na configuração
  const timerFontSize = useMemo(() => {
    const factor = settings.timerSize === 'small' ? 0.75 : settings.timerSize === 'large' ? 1.3 : 1.0;
    if (isFocusMode) {
      return `clamp(${4 * factor}rem, ${14 * factor}vw, ${9 * factor}rem)`;
    }
    return `clamp(${3 * factor}rem, ${8 * factor}vw, ${5 * factor}rem)`;
  }, [settings.timerSize, isFocusMode]);

  const currentAo5 = getCurrentAo5();
  const currentAo12 = getCurrentAo12();

  // Últimas 5–8 solves da sessão atual para exibição compacta
  const recentSolves = useMemo(() => {
    return solves.slice(-8).reverse();
  }, [solves]);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="flex-1 w-full h-full flex flex-col justify-between items-center relative select-none touch-timer-area overflow-hidden py-1 px-3"
    >
      {/* Topo: Barra de Scramble e Visualização 2D Net */}
      {timerState !== 'running' && (
        <div className="w-full flex flex-col items-center gap-1 z-10 animate-fadeIn max-h-[40%] flex-shrink-0">
          <ScrambleBar
            scramble={currentScramble}
            onNextScramble={handleNextScramble}
            onPrevScramble={handlePrevScramble}
            hasPrevScramble={hasPrevScramble}
            onOpenEditModal={() => setIsManualScrambleModalOpen(true)}
          />

          <CubeNetView scramble={currentScramble} customColors={settings.cubeStickerColors} />
        </div>
      )}

      {/* Centro: Display do Timer */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-auto z-10 pointer-events-none">
        {/* Contador de Inspeção WCA */}
        {timerState === 'inspecting' ? (
          <div className="flex flex-col items-center">
            <span
              className={`text-xs uppercase font-bold tracking-widest mb-1 ${
                inspectionDisplay.isPlus2 || inspectionDisplay.isDnf
                  ? 'text-cube-red font-extrabold animate-pulse'
                  : 'text-cube-timerInspect'
              }`}
            >
              {inspectionDisplay.isPlus2
                ? 'Penalidade +2 (15s excedidos)'
                : inspectionDisplay.isDnf
                ? 'DNF Automático (17s excedidos)'
                : 'Inspeção WCA'}
            </span>
            <div
              className={`tabular-timer font-extrabold leading-none transition-colors ${getTimerColorClass()}`}
              style={{ fontSize: timerFontSize }}
            >
              {inspectionDisplay.text}
            </div>
            <span className="text-[11px] text-cube-textDim mt-1">
              Segure espaço/tela para armar o cubo
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div
              id="main-timer-digits"
              className={`tabular-timer font-extrabold leading-none tracking-tight transition-colors ${getTimerColorClass()}`}
              style={{ fontSize: timerFontSize }}
            >
              {displayTime}
            </div>

            {/* Alerta de Novo PB com Confetes */}
            {newPbAlert && timerState !== 'running' && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cube-cyan/15 border border-cube-cyan/40 text-cube-cyan text-xs font-bold animate-bounce">
                <Star className="w-3.5 h-3.5 fill-cube-cyan" />
                <span>Novo PB {newPbAlert.type.toUpperCase()}!</span>
              </div>
            )}
          </div>
        )}

        {/* Métricas abaixo do timer: ao5 e ao12 atuais */}
        {timerState !== 'running' && (
          <div className="flex items-center gap-5 mt-2 text-xs md:text-sm font-semibold text-cube-textMuted pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-cube-textDim">ao5:</span>
              <span className="font-mono text-white">
                {currentAo5 !== null
                  ? currentAo5 === Infinity
                    ? 'DNF'
                    : TimeFormatter.format(currentAo5).display
                  : '—'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-cube-textDim">ao12:</span>
              <span className="font-mono text-white">
                {currentAo12 !== null
                  ? currentAo12 === Infinity
                    ? 'DNF'
                    : TimeFormatter.format(currentAo12).display
                  : '—'}
              </span>
            </div>

            {/* Botão para entrada de tempo manual */}
            <button
              id="btn-manual-time-entry"
              onClick={() => setIsManualTimeModalOpen(true)}
              className="flex items-center gap-1 text-cube-cyan hover:underline text-xs ml-1"
              title="Digitar tempo de timer externo (ex: Stackmat)"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Digitar</span>
            </button>
          </div>
        )}
      </div>

      {/* Faixa das Últimas 5–8 Solves */}
      {timerState !== 'running' && !isFocusMode && recentSolves.length > 0 && (
        <div className="w-full max-w-2xl flex items-center justify-center gap-1.5 py-1 z-10 pointer-events-auto flex-wrap">
          <span className="text-[10px] text-cube-textDim font-bold uppercase tracking-wider mr-1">
            Recentes:
          </span>
          {recentSolves.map(s => {
            const formatted = TimeFormatter.format(s.timeMs, s.penalty, 'hundredths');
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSolveModal(s)}
                title="Clique para ver detalhes da solve"
                className={`px-2 py-0.5 rounded text-xs font-mono border transition-colors ${
                  s.penalty === 'dnf'
                    ? 'border-cube-red/40 bg-cube-red/10 text-cube-red'
                    : s.penalty === 'plus2'
                    ? 'border-cube-orange/40 bg-cube-orange/10 text-cube-orange'
                    : 'border-cube-border bg-cube-surface1/80 text-cube-text hover:border-cube-cyan/40 hover:text-white'
                }`}
              >
                {formatted.display}
              </button>
            );
          })}
        </div>
      )}

      {/* Rodapé: Barra de Ações Pós-Solve e Instruções */}
      {timerState !== 'running' && (
        <div className="w-full flex flex-col items-center gap-1 z-10 pointer-events-auto pb-1 flex-shrink-0">
          <PostSolveToolbar
            lastSolve={lastSolve}
            onTogglePenalty={togglePenalty}
            onDeleteSolve={deleteSolve}
            onUndoLastSolve={undoLastSolve}
            onUpdateNote={(id, note) => updateSolve(id, { note })}
          />

          <p className="text-[10px] text-cube-textDim text-center hidden sm:block">
            {settings.inspectionEnabled
              ? 'Pressione ESPAÇO ou toque na tela para iniciar a inspeção WCA'
              : `Segure ESPAÇO ou a tela (${settings.holdingThresholdMs}ms) até ficar verde`}
          </p>
        </div>
      )}

      {/* Toast flutuante de notificação / auto-DNF com Desfazer */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-cube-surface2 border border-cube-red/40 shadow-2xl text-xs font-medium text-white animate-scaleUp">
          <span>{toast.message}</span>
          {toast.actionLabel && (
            <button
              onClick={() => {
                toast.onAction?.();
                clearToast();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cube-red text-white font-bold hover:bg-red-600 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>{toast.actionLabel}</span>
            </button>
          )}
          <button
            onClick={clearToast}
            className="text-cube-textDim hover:text-white text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modais de Scramble, Tempo Manual e Detalhes */}
      <ManualScrambleModal
        isOpen={isManualScrambleModalOpen}
        currentScramble={currentScramble}
        onClose={() => setIsManualScrambleModalOpen(false)}
        onApplyScramble={newSc => setCurrentScramble(newSc)}
      />

      <ManualTimeModal
        isOpen={isManualTimeModalOpen}
        currentScramble={currentScramble}
        onClose={() => setIsManualTimeModalOpen(false)}
        onSubmitSolve={async (timeMs, penalty, note) => {
          await addSolve({
            sessionId: activeSessionIdRef.current,
            timeMs,
            penalty,
            scramble: currentScramble,
            scrambleSource: 'manual',
            note,
          });
          const formatted = TimeFormatter.format(timeMs, penalty, settings.timerPrecision);
          setDisplayTime(formatted.display);
          handleNextScramble();
        }}
      />

      {selectedSolveModal && (
        <SolveDetailModal
          solve={selectedSolveModal}
          solveIndex={solves.findIndex(s => s.id === selectedSolveModal.id) + 1}
          isOpen={true}
          onClose={() => setSelectedSolveModal(null)}
          onUpdateSolve={updateSolve}
          onDeleteSolve={deleteSolve}
        />
      )}
    </div>
  );
};
