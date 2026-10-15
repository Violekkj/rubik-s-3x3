export class AudioCueManager {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Toca bipe sonoro de alta precisão via Web Audio API
   */
  public playBeep(freq = 880, durationMs = 120, type: OscillatorType = 'sine'): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn('Web Audio playback error:', e);
    }
  }

  /**
   * Fala em pt-BR via Web Speech API (WCA 8s e 12s)
   */
  public speakPtBR(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Cancela falas anteriores
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.1; // Ritmo ágil para competições
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Web Speech API error:', e);
    }
  }

  public warn8Seconds(enableBeep: boolean, enableVoice: boolean): void {
    if (enableBeep) {
      this.playBeep(880, 150, 'sine');
    }
    if (enableVoice) {
      this.speakPtBR('oito segundos');
    }
  }

  public warn12Seconds(enableBeep: boolean, enableVoice: boolean): void {
    if (enableBeep) {
      this.playBeep(1174, 180, 'sine');
    }
    if (enableVoice) {
      this.speakPtBR('doze segundos');
    }
  }
}

export const audioCues = new AudioCueManager();
