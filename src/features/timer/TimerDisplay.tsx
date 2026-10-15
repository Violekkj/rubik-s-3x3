import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Star, Keyboard } from 'lucide-react';
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
import { scrambleManager } from '../../core/scramble/scrambleGenerator';

export const TimerDisplay: React.FC = () => {
  const { settings } = useSettingsStore();
  const {
    activeSessionId,
  } = useSessionStore();
  const {
    lastSolve,
    newPbAlert,
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

  // Estados locais reativos do timer
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [displayTime, setDisplayTime] = useState<string>('0.00');
  const [inspectionRemainingSec, setInspectionRemainingSec] = useState<number>(15);
  const [lastPenalty, setLastPenalty] = useState<PenaltyType>('none');

  // Referência da máquina de estados
  const timerMachineRef = useRef<TimerStateMachine | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const runStartTimeRef = useRef<number>(0);

  // Inicializa o gerenciador de scrambles
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

  // Criação e sincronização da máquina de estados do cronômetro
  useEffect(() => {
    const machine = new TimerStateMachine(
      {
        inspectionEnabled: settings.inspectionEnabled,
        inspectionDurationMs: settings.inspectionDurationMs,
        holdingThresholdMs: settings.holdingThresholdMs,
        precision: settings.timerPrecision,
      },
      {
        onStateChange: newState => {
          setTimerState(newState);
          if (newState === 'running') {
            runStartTimeRef.current = performance.now();
            startRunningRaf();
          } else {
            stopRunningRaf();
          }
        },
        onInspectionTick: remainingMs => {
          setInspectionRemainingSec(Math.ceil(remainingMs / 1000));
        },
        onInspectionWarning: sec => {
          if (sec === 8) {
            audioCues.warn8Seconds(
              settings.inspectionAudioAlerts,
              settings.inspectionVoiceAlerts
            );
          } else if (sec === 12) {
            audioCues.warn12Seconds(
              settings.inspectionAudioAlerts,
              settings.inspectionVoiceAlerts
            );
          }
        },
        onStop: async (elapsedMs, penalty, inspectionMs) => {
          setLastPenalty(penalty);

          const formatted = TimeFormatter.format(
            elapsedMs,
            penalty,
            settings.timerPrecision
          );
          setDisplayTime(formatted.display);

          // Salva solve no store e banco Dexie
          await addSolve({
            sessionId: activeSessionId,
            timeMs: elapsedMs,
            penalty,
            scramble: currentScramble,
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
  }, [settings, activeSessionId, currentScramble, handleNextScramble, addSolve]);

  const startRunningRaf = () => {
    stopRunningRaf();
    const update = () => {
      const now = performance.now();
      const elapsed = Math.max(0, now - runStartTimeRef.current);

      if (settings.hideTimerWhileRunning) {
        setDisplayTime('Resolvendo...');
      } else {
        const formatted = TimeFormatter.format(
          elapsed,
          'none',
          settings.timerPrecision
        );
        setDisplayTime(formatted.display);
      }

      rafIdRef.current = requestAnimationFrame(update);
    };
    rafIdRef.current = requestAnimationFrame(update);
  };

  const stopRunningRaf = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

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
        machine.handlePrimaryDown();
        return;
      }

      // Tecla de cancelamento (ESC)
      if (e.key === 'Escape') {
        machine.cancel();
        setDisplayTime('0.00');
        return;
      }

      // Tecla Espaço: controle principal
      if (e.code === 'Space') {
        e.preventDefault();
        machine.handlePrimaryDown();
        return;
      }

      // Atalhos pós-solve no teclado
      if (currentState === 'idle' || currentState === 'stopped') {
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
    // Apenas se o clique/toque for na área principal do timer (não em botões)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
      return;
    }

    const machine = timerMachineRef.current;
    if (!machine) return;

    machine.handlePrimaryDown();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
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
        return inspectionRemainingSec <= 3 ? 'text-cube-red' : 'text-cube-timerInspect';
      case 'holding':
        return 'text-cube-timerHolding';
      case 'ready':
        return 'text-cube-timerReady drop-shadow-[0_0_24px_rgba(43,224,75,0.4)]';
      case 'running':
        return 'text-white';
      case 'stopped':
        return lastPenalty === 'dnf'
          ? 'text-cube-red'
          : lastPenalty === 'plus2'
          ? 'text-cube-orange'
          : 'text-white';
      default:
        return 'text-white';
    }
  };

  const currentAo5 = getCurrentAo5();
  const currentAo12 = getCurrentAo12();

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="flex-1 w-full h-full flex flex-col justify-between items-center relative select-none touch-timer-area overflow-hidden py-2"
    >
      {/* Topo: Barra de Scramble e Visualização 2D Net */}
      {timerState !== 'running' && (
        <div className="w-full flex flex-col items-center gap-2 z-10 animate-fadeIn">
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

      {/* Centro: Display Gigante do Timer */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-auto z-10 pointer-events-none">
        {/* Contador de Inspeção WCA */}
        {timerState === 'inspecting' ? (
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase font-bold tracking-widest text-cube-timerInspect mb-1">
              Inspeção WCA
            </span>
            <div
              className={`tabular-timer font-extrabold text-8xl md:text-[11rem] leading-none transition-colors ${getTimerColorClass()}`}
            >
              {inspectionRemainingSec}
            </div>
            <span className="text-xs text-cube-textDim mt-2">
              Segure espaço/tela para armar o cubo
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div
              id="main-timer-digits"
              className={`tabular-timer font-extrabold text-[clamp(4.5rem,19vw,11.5rem)] leading-none tracking-tight transition-colors ${getTimerColorClass()}`}
            >
              {displayTime}
            </div>

            {/* Alerta de Novo PB com Confetes */}
            {newPbAlert && timerState === 'stopped' && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cube-cyan/15 border border-cube-cyan/40 text-cube-cyan text-xs font-bold animate-bounce">
                <Star className="w-4 h-4 fill-cube-cyan" />
                <span>Novo PB {newPbAlert.type.toUpperCase()}!</span>
              </div>
            )}
          </div>
        )}

        {/* Métricas abaixo do timer: ao5 e ao12 atuais */}
        {timerState !== 'running' && (
          <div className="flex items-center gap-6 mt-4 text-xs md:text-sm font-semibold text-cube-textMuted pointer-events-auto">
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
              className="flex items-center gap-1 text-cube-cyan hover:underline text-xs ml-2"
              title="Digitar tempo de timer externo (ex: Stackmat)"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Digitar</span>
            </button>
          </div>
        )}
      </div>

      {/* Rodapé: Barra de Ações Pós-Solve e Instruções */}
      {timerState !== 'running' && (
        <div className="w-full flex flex-col items-center gap-2 z-10 pointer-events-auto pb-2">
          <PostSolveToolbar
            lastSolve={lastSolve}
            onTogglePenalty={togglePenalty}
            onDeleteSolve={deleteSolve}
            onUndoLastSolve={undoLastSolve}
            onUpdateNote={(id, note) => updateSolve(id, { note })}
          />

          <p className="text-[11px] text-cube-textDim text-center hidden sm:block">
            {settings.inspectionEnabled
              ? 'Pressione ESPAÇO ou toque na tela para iniciar a inspeção de 15s'
              : `Segure ESPAÇO ou a tela (${settings.holdingThresholdMs}ms) até ficar verde`}
          </p>
        </div>
      )}

      {/* Modais de Scramble e Tempo Manual */}
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
            sessionId: activeSessionId,
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
    </div>
  );
};
