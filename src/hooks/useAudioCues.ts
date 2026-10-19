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
   * Toca bipe sonoro de alta precisão via Web Audio API.
   * Onda senoidal ~880 Hz, ~120 ms, fade-in/out de ~15 ms (sem estalos).
   * Volume padrão: ~1/4 (25%), ajustável de 0 a 100%.
   */
  public playBeep(freq = 880, durationMs = 120, volumePercent = 25): void {
    if (volumePercent <= 0) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Volume de pico calibrado (100% = 0.20 ganho máx, 25% padrão = 0.05)
      const peakGain = Math.max(0.0001, (volumePercent / 100) * 0.20);
      const startTime = ctx.currentTime;
      const fadeInDuration = 0.015; // 15 ms
      const fadeOutDuration = 0.015; // 15 ms
      const stopTime = startTime + durationMs / 1000;

      // Inicia em silêncio (0) -> fade-in suave até peakGain em 15ms
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + fadeInDuration);

      // Mantém até o início do fade-out
      const fadeOutStartTime = Math.max(startTime + fadeInDuration, stopTime - fadeOutDuration);
      gain.gain.setValueAtTime(peakGain, fadeOutStartTime);

      // Fade-out suave até silêncio (0) em 15ms
      gain.gain.linearRampToValueAtTime(0, stopTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(stopTime + 0.01);
    } catch (e) {
      console.warn('Web Audio playback error:', e);
    }
  }

  public warnInspection(enabled: boolean, volumePercent = 25): void {
    if (enabled) {
      this.playBeep(880, 120, volumePercent);
    }
  }

  public testBeep(volumePercent = 25): void {
    this.playBeep(880, 120, volumePercent);
  }
}

export const audioCues = new AudioCueManager();

