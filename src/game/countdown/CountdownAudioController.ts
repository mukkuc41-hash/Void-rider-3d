import { sound } from '../audio';

export class CountdownAudioController {
  private ctx: AudioContext | null = null;
  private sfxEnabled: boolean = true;
  private volume: number = 0.75;

  constructor() {
    this.initContext();
  }

  private initContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && !this.ctx) {
        this.ctx = new AudioContextClass();
      }
    } catch {
      // Audio fallback
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  /**
   * 48.3 RED LIGHT: Low warning tone
   */
  public playRedTone() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low ominous warning buzz/pulse: 220Hz saw + lowpass filter
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.24 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);
    } catch {
      sound.playCountdownBeep?.(false);
    }
  }

  /**
   * 48.5 YELLOW LIGHT: Higher tension alert tone
   */
  public playYellowTone() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Higher tension harmonic chime: 440Hz + 880Hz
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now);

      gain.gain.setValueAtTime(0.22 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch {
      sound.playCountdownBeep?.(false);
    }
  }

  /**
   * 48.7 COUNTDOWN "1": High-tension tone
   */
  public playHighTensionTone() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5

      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      sound.playCountdownBeep?.(false);
    }
  }

  /**
   * 48.8 FINAL ANTICIPATION (RED + YELLOW): Short anticipation chord
   */
  public playAnticipationTone() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(554.37, now); // C#5
      gain.gain.setValueAtTime(0.15 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // audio fallback
    }
  }

  /**
   * 48.9 GREEN LIGHT & 48.10 GO EVENT: Powerful launch sound & race-start impact
   */
  public playGreenLaunchSound() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. High Victory Launch Fanfare Sweep: 880Hz to 1760Hz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.45);

      gain.gain.setValueAtTime(0.35 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);

      // 2. Sub-bass launch punch: 110Hz to 35Hz
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.4);

      subGain.gain.setValueAtTime(0.4 * this.volume, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.52);

      // Also trigger global engine & music audio
      sound.playCountdownGo?.();
    } catch {
      sound.playCountdownGo?.();
    }
  }
}
