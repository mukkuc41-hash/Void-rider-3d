/**
 * Procedural Web Audio API sound generator for Void-Rider 3D.
 * Clean, lightweight, reliable, zero external assets required.
 */
class SoundSystem {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private boostOsc: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicInterval: any = null;
  private cinematicMusicBuffer: AudioBuffer | null = null;
  private spaceAmbienceBuffer: AudioBuffer | null = null;
  private launchBuffer: AudioBuffer | null = null;
  private cinematicMusicSource: AudioBufferSourceNode | null = null;
  private spaceAmbienceSource: AudioBufferSourceNode | null = null;
  private cinematicMusicGain: GainNode | null = null;
  private spaceAmbienceGain: GainNode | null = null;
  private cinematicMasterGain: GainNode | null = null;
  private cinematicMusicAudio: HTMLAudioElement | null = null;
  private spaceAmbienceAudio: HTMLAudioElement | null = null;
  private isCinematicAudioActive: boolean = false;
  private isLoadingCinematicBuffers: boolean = false;

  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = true;
  public volume: number = 0.7;
  public sfxVolume: number = 0.7;
  public musicVolume: number = 0.5;
  public isMuted: boolean = false;

  public setSFXVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.volume = this.sfxVolume;
    if (this.spaceAmbienceGain && this.ctx) {
      this.spaceAmbienceGain.gain.setValueAtTime(this.sfxEnabled && !this.isMuted ? 0.45 * this.sfxVolume : 0, this.ctx.currentTime);
    }
    if (this.spaceAmbienceAudio) {
      this.spaceAmbienceAudio.volume = this.sfxEnabled && !this.isMuted ? 0.45 * this.sfxVolume : 0;
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicEnabled && !this.isMuted ? 0.12 * this.musicVolume : 0, this.ctx.currentTime);
    }
    if (this.cinematicMusicGain && this.ctx) {
      this.cinematicMusicGain.gain.setValueAtTime(this.musicEnabled && !this.isMuted ? 0.75 * this.musicVolume : 0, this.ctx.currentTime);
    }
    if (this.cinematicMusicAudio) {
      this.cinematicMusicAudio.volume = this.musicEnabled && !this.isMuted ? 0.75 * this.musicVolume : 0;
    }
  }

  public toggleMute(muted: boolean) {
    this.isMuted = muted;
    this.sfxEnabled = !muted;
    this.musicEnabled = !muted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicEnabled && !this.isMuted ? 0.12 * this.musicVolume : 0, this.ctx.currentTime);
    }
    if (this.cinematicMasterGain && this.ctx) {
      this.cinematicMasterGain.gain.setValueAtTime(muted ? 0 : 1, this.ctx.currentTime);
    }
    if (this.cinematicMusicAudio) {
      this.cinematicMusicAudio.muted = muted;
    }
    if (this.spaceAmbienceAudio) {
      this.spaceAmbienceAudio.muted = muted;
    }
  }

  public playCountdownTick() {
    this.playCountdown(false);
  }

  public playCountdownGo() {
    this.playCountdown(true);
  }

  public playUpgradePurchase() {
    this.playUpgradeUnlock();
  }

  private initContext() {
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (_) {}
  }

  public startEngine() {
    this.initContext();
    if (!this.ctx || this.engineOsc) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.sfxEnabled ? 0.08 * this.volume : 0, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();

      // Boost noise/hum
      this.boostOsc = this.ctx.createOscillator();
      this.boostOsc.type = 'sine';
      this.boostOsc.frequency.setValueAtTime(240, this.ctx.currentTime);

      this.boostGain = this.ctx.createGain();
      this.boostGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.boostOsc.connect(this.boostGain);
      this.boostGain.connect(this.ctx.destination);

      this.boostOsc.start();
    } catch (e) {
      console.warn('Audio start engine err:', e);
    }
  }

  public updateEngine(speedNorm: number, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineFilter || !this.engineGain) return;
    try {
      const now = this.ctx.currentTime;
      const safeNorm = isNaN(speedNorm) || !isFinite(speedNorm) ? 0 : Math.max(0, Math.min(3, speedNorm));
      
      // Pitch scales with normalized speed (0.0 to 1.5+)
      const targetFreq = 70 + safeNorm * 180 + (isBoosting ? 90 : 0);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);

      const filterFreq = 300 + safeNorm * 800 + (isBoosting ? 600 : 0);
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);

      const targetGain = this.sfxEnabled ? (0.05 + safeNorm * 0.12) * this.volume : 0;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);

      if (this.boostGain && this.boostOsc) {
        const boostTarget = (this.sfxEnabled && isBoosting) ? 0.18 * this.volume : 0;
        this.boostGain.gain.setTargetAtTime(boostTarget, now, 0.05);
        if (isBoosting) {
          this.boostOsc.frequency.setTargetAtTime(360 + Math.sin(now * 25) * 40, now, 0.03);
        }
      }
    } catch (_) {}
  }

  public stopEngine() {
    if (this.engineOsc) {
      try { this.engineOsc.stop(); } catch (_) {}
      this.engineOsc.disconnect();
      this.engineOsc = null;
    }
    if (this.boostOsc) {
      try { this.boostOsc.stop(); } catch (_) {}
      this.boostOsc.disconnect();
      this.boostOsc = null;
    }
  }

  public playCountdown(isGo: boolean = false) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isGo ? 'triangle' : 'sine';
    const freq = isGo ? 880 : 440; // A5 for GO, A4 for 3,2,1
    osc.frequency.setValueAtTime(freq, now);

    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.3);
    }

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.6 : 0.25));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isGo ? 0.65 : 0.3));
  }

  public playCountdownBeep(isFinal: boolean = false) {
    this.playCountdown(isFinal);
  }

  public playMenuClick() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);

      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // fallback
    }
  }

  public playRouteSelected() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      // Futuristic resonant tri-tone ascending sweep (F5 -> A5 -> C6)
      const freqs = [698.46, 880.0, 1046.5];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + idx * 0.035 + 0.12);

        gain.gain.setValueAtTime(0.14 * this.volume, now + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }

  public playCheckpoint() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Harmonious dual chime (E5 + B5)
    [659.25, 987.77].forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.04);
      gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.4);
    });
  }

  public playBoostPad() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playCollision() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.16);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playHeavyImpact() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Dual oscillator: low sub-bass thump + metallic crunch
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(25, now + 0.3);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(90, now);
    osc2.frequency.exponentialRampToValueAtTime(20, now + 0.4);

    gain.gain.setValueAtTime(0.42 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  public playShieldImpact() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Resonant futuristic shield chime / deflection buzz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.22);

    gain.gain.setValueAtTime(0.32 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playScrapeSparks() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320 + Math.random() * 100, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playAsteroidHit() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Heavy low punch and resonant metallic ring
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playAlarmAlert() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.setValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playGravityShift(isLowG: boolean) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    if (isLowG) {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.4);
    } else {
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.4);
    }

    gain.gain.setValueAtTime(0.24 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playWormholeWarp() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Ascending hyperspace resonance chord
    [320, 480, 640, 960, 1280].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + i * 0.05 + 0.4);

      gain.gain.setValueAtTime(0.2 * this.volume, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.48);
    });
  }

  public playUpgradeUnlock() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.2 * this.volume, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.38);
    });
  }

  public playFinish() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C major fanfare
    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.22 * this.volume, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.85);
    });
  }

  public playWhoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playCreditPickup() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Two-tone high crystal chime
    [1046.5, 1567.98].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.22 * this.volume, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.28);
    });
  }

  public playShieldActivate() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

    gain.gain.setValueAtTime(0.05 * this.volume, now);
    gain.gain.linearRampToValueAtTime(0.28 * this.volume, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  public playShieldDeflect() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.2);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playShieldHit() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playMissileLaunch() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Rocket booster ignition whoosh with rising high-pitch hiss
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.55);

    gain.gain.setValueAtTime(0.38 * this.volume, now);
    gain.gain.linearRampToValueAtTime(0.48 * this.volume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  public playTargetLock() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // High tech double pulse lock-on confirmation
    [0, 0.09].forEach(delay => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1180, now + delay);
      osc.frequency.setValueAtTime(1480, now + delay + 0.04);

      gain.gain.setValueAtTime(0.22 * this.volume, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.075);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
    });
  }

  public playMissileExplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Concussive impact blast with low sub-bass boom
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(190, now);
    osc1.frequency.exponentialRampToValueAtTime(32, now + 0.45);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(80, now);
    osc2.frequency.exponentialRampToValueAtTime(18, now + 0.6);

    gain.gain.setValueAtTime(0.55 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  }

  public playMissileReloadReady() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.18);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playShieldRechargeReady() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.22 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playMagnetPulse() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(660, now + 0.12);
    osc.frequency.linearRampToValueAtTime(440, now + 0.24);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playHyperBoost() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    [150, 300, 600].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 3.5, now + 0.4);

      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    });
  }

  public playNitroBoost() {
    this.playHyperBoost();
  }

  public playRepairCore() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.38);
    });
  }

  public playEMPPulse() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.45);
    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playTimeWarp() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    [300, 200, 150].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + idx * 0.1 + 0.4);
      gain.gain.setValueAtTime(0.2 * this.volume, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.52);
    });
  }

  public playGravityBurst() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(350, now + 0.2);
    osc.frequency.linearRampToValueAtTime(120, now + 0.4);
    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playDecoySpawn() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playGameOver() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.95);
  }

  public playExplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // 1. Low frequency thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
    oscGain.gain.setValueAtTime(0.45 * this.volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.72);

    // 2. Filtered noise burst for explosion shockwave
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.8);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.7);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (_) {}
  }

  public playRespawn() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Ascending cyber warp chime
    [261.63, 392.0, 523.25, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.3);
    });
  }

  public playWrongWayAlert() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.setValueAtTime(440, now + 0.12);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playDriftMiniTurbo() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.25);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }


  /**
   * Real audio player for the cinematic intro:
   * Plays /audio/cinematic-music.wav and /audio/space-ambience.wav simultaneously.
   * Smoothly fades in on cinematic start, and smoothly fades out on race launch.
   */
  public async preloadCinematicAudio() {
    if (this.isLoadingCinematicBuffers) return;
    this.isLoadingCinematicBuffers = true;

    const loadBuffer = async (url: string): Promise<AudioBuffer | null> => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const ab = await resp.arrayBuffer();
        this.initContext();
        if (!this.ctx) return null;
        return await this.ctx.decodeAudioData(ab);
      } catch (err) {
        console.warn(`[Audio] Failed loading ${url}:`, err);
        return null;
      }
    };

    try {
      const [musicBuf, ambBuf, launchBuf] = await Promise.all([
        loadBuffer('/audio/cinematic-music.wav'),
        loadBuffer('/audio/space-ambience.wav'),
        loadBuffer('/audio/launch.wav'),
      ]);
      if (musicBuf) this.cinematicMusicBuffer = musicBuf;
      if (ambBuf) this.spaceAmbienceBuffer = ambBuf;
      if (launchBuf) this.launchBuffer = launchBuf;

      if (this.isCinematicAudioActive) {
        this.playActiveCinematicTracks();
      }
    } catch (_) {
    } finally {
      this.isLoadingCinematicBuffers = false;
    }
  }

  public startCinematicAudio() {
    this.initContext();
    this.isCinematicAudioActive = true;
    if (this.isMuted) return;

    if (!this.cinematicMusicBuffer || !this.spaceAmbienceBuffer || !this.launchBuffer) {
      this.preloadCinematicAudio();
    }

    this.playActiveCinematicTracks();
  }

  private playActiveCinematicTracks() {
    if (!this.isCinematicAudioActive || this.isMuted) return;
    this.initContext();

    try {
      if (this.ctx) {
        const now = this.ctx.currentTime;
        if (!this.cinematicMasterGain) {
          this.cinematicMasterGain = this.ctx.createGain();
          this.cinematicMasterGain.connect(this.ctx.destination);
        }
        this.cinematicMasterGain.gain.cancelScheduledValues(now);
        this.cinematicMasterGain.gain.setValueAtTime(0.001, now);
        this.cinematicMasterGain.gain.linearRampToValueAtTime(1.0, now + 1.2);

        // 1. Real Cinematic Music (/audio/cinematic-music.wav)
        if (this.cinematicMusicBuffer && !this.cinematicMusicSource) {
          this.cinematicMusicSource = this.ctx.createBufferSource();
          this.cinematicMusicSource.buffer = this.cinematicMusicBuffer;
          this.cinematicMusicSource.loop = true;

          this.cinematicMusicGain = this.ctx.createGain();
          const targetMusicVol = this.musicEnabled ? 0.75 * this.musicVolume : 0;
          this.cinematicMusicGain.gain.setValueAtTime(targetMusicVol, now);

          this.cinematicMusicSource.connect(this.cinematicMusicGain);
          this.cinematicMusicGain.connect(this.cinematicMasterGain);
          this.cinematicMusicSource.start(now);
        }

        // 2. Real Space Ambience (/audio/space-ambience.wav)
        if (this.spaceAmbienceBuffer && !this.spaceAmbienceSource) {
          this.spaceAmbienceSource = this.ctx.createBufferSource();
          this.spaceAmbienceSource.buffer = this.spaceAmbienceBuffer;
          this.spaceAmbienceSource.loop = true;

          this.spaceAmbienceGain = this.ctx.createGain();
          const targetAmbVol = this.sfxEnabled ? 0.45 * this.sfxVolume : 0;
          this.spaceAmbienceGain.gain.setValueAtTime(targetAmbVol, now);

          this.spaceAmbienceSource.connect(this.spaceAmbienceGain);
          this.spaceAmbienceGain.connect(this.cinematicMasterGain);
          this.spaceAmbienceSource.start(now);
        }
      }

      // Audio element fallback in case buffer decode is still resolving or context suspended
      if (!this.cinematicMusicBuffer && !this.cinematicMusicAudio) {
        try {
          this.cinematicMusicAudio = new Audio('/audio/cinematic-music.wav');
          this.cinematicMusicAudio.loop = true;
          this.cinematicMusicAudio.volume = this.musicEnabled && !this.isMuted ? 0.75 * this.musicVolume : 0;
          this.cinematicMusicAudio.play().catch(() => {});
        } catch (_) {}
      }
      if (!this.spaceAmbienceBuffer && !this.spaceAmbienceAudio) {
        try {
          this.spaceAmbienceAudio = new Audio('/audio/space-ambience.wav');
          this.spaceAmbienceAudio.loop = true;
          this.spaceAmbienceAudio.volume = this.sfxEnabled && !this.isMuted ? 0.45 * this.sfxVolume : 0;
          this.spaceAmbienceAudio.play().catch(() => {});
        } catch (_) {}
      }
    } catch (e) {
      console.warn('[Audio] startCinematicAudio error:', e);
    }
  }

  public stopCinematicAudio(fadeSeconds: number = 0.8) {
    this.isCinematicAudioActive = false;

    // Fade HTML5 audio fallbacks if active
    if (this.cinematicMusicAudio) {
      const el = this.cinematicMusicAudio;
      this.cinematicMusicAudio = null;
      let vol = el.volume;
      const interval = setInterval(() => {
        vol = Math.max(0, vol - 0.1);
        el.volume = vol;
        if (vol <= 0) {
          clearInterval(interval);
          el.pause();
          el.currentTime = 0;
        }
      }, 50);
    }
    if (this.spaceAmbienceAudio) {
      const el = this.spaceAmbienceAudio;
      this.spaceAmbienceAudio = null;
      let vol = el.volume;
      const interval = setInterval(() => {
        vol = Math.max(0, vol - 0.1);
        el.volume = vol;
        if (vol <= 0) {
          clearInterval(interval);
          el.pause();
          el.currentTime = 0;
        }
      }, 50);
    }

    if (!this.ctx || !this.cinematicMasterGain) {
      this.cleanupCinematicAudio();
      return;
    }

    try {
      const now = this.ctx.currentTime;
      const duration = Math.max(0.05, fadeSeconds);
      this.cinematicMasterGain.gain.cancelScheduledValues(now);
      this.cinematicMasterGain.gain.setValueAtTime(Math.max(0.001, this.cinematicMasterGain.gain.value), now);
      this.cinematicMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const mSrc = this.cinematicMusicSource;
      const aSrc = this.spaceAmbienceSource;
      const master = this.cinematicMasterGain;
      this.cinematicMusicSource = null;
      this.spaceAmbienceSource = null;
      this.cinematicMasterGain = null;

      window.setTimeout(() => {
        try { mSrc?.stop(); } catch (_) {}
        try { aSrc?.stop(); } catch (_) {}
        try { master?.disconnect(); } catch (_) {}
      }, duration * 1000 + 80);
    } catch (_) {
      this.cleanupCinematicAudio();
    }
  }

  private cleanupCinematicAudio() {
    try { this.cinematicMusicSource?.stop(); } catch (_) {}
    try { this.spaceAmbienceSource?.stop(); } catch (_) {}
    try { this.cinematicMasterGain?.disconnect(); } catch (_) {}
    this.cinematicMusicSource = null;
    this.spaceAmbienceSource = null;
    this.cinematicMasterGain = null;
  }

  public playLaunchSound() {
    this.initContext();
    if (!this.sfxEnabled || this.isMuted) return;

    if (this.ctx && this.launchBuffer) {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.launchBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.9 * this.sfxVolume, this.ctx.currentTime);
        src.connect(gain);
        gain.connect(this.ctx.destination);
        src.start();
        return;
      } catch (_) {}
    }

    try {
      const audio = new Audio('/audio/launch.wav');
      audio.volume = Math.max(0, Math.min(1, 0.9 * this.sfxVolume));
      audio.play().catch(() => {});
    } catch (_) {
      this.playThrusterIgnition();
    }
  }

  public playLaunch() {
    this.playLaunchSound();
  }

  public startCosmicMusic() {
    this.initContext();
    if (!this.ctx || this.musicInterval) return;

    try {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.12 * this.volume : 0, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      // Space Synth Chord sequence (Cm, Ab, Eb, Bb)
      const scale = [
        [130.81, 196.00, 311.13, 392.00], // C3, G3, Eb4, G4
        [103.83, 207.65, 261.63, 329.63], // Ab2, Ab3, C4, E4
        [155.56, 233.08, 311.13, 466.16], // Eb3, Bb3, Eb4, Bb4
        [116.54, 233.08, 293.66, 349.23], // Bb2, Bb3, D4, F4
      ];
      let step = 0;

      this.musicInterval = setInterval(() => {
        if (!this.ctx || !this.musicEnabled || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const chord = scale[Math.floor(step / 4) % scale.length];
        const note = chord[step % chord.length];

        // Bass/lead arp note
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = step % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(note, now);
        
        noteGain.gain.setValueAtTime(0.06 * this.volume, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(noteGain);
        noteGain.connect(this.musicGain!);

        osc.start(now);
        osc.stop(now + 0.3);

        step++;
      }, 160);
    } catch (e) {
      console.warn('Music error:', e);
    }
  }

  public stopCosmicMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // ================= ASTEROID DESTRUCTION BEAM AUDIO =================
  private beamHumOsc: OscillatorNode | null = null;
  private beamHumGain: GainNode | null = null;
  private beamHumFilter: BiquadFilterNode | null = null;

  public playBeamCharge() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playBeamFire(type: string = 'STANDARD', soundPreset?: string) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (soundPreset === 'HEAVY_PLASMA' || type === 'PLASMA') {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.28);
      gain.gain.setValueAtTime(0.26 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    } else if (soundPreset === 'RESONANT_LASER' || type === 'LASER') {
      osc.type = 'triangle';
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.22);
      gain.gain.setValueAtTime(0.22 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    } else if (soundPreset === 'VOID_SURGE' || type === 'VOID') {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);
      gain.gain.setValueAtTime(0.28 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    } else if (soundPreset === 'ARC_DISCHARGE' || type === 'ARC') {
      osc.type = 'square';
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.18);
      gain.gain.setValueAtTime(0.24 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    } else {
      // High energy pulse / standard / quantum
      osc.type = 'sawtooth';
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.24);
      gain.gain.setValueAtTime(0.22 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public startBeamHum(soundPreset?: string) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    if (this.beamHumOsc) return;

    try {
      this.beamHumOsc = this.ctx.createOscillator();
      this.beamHumFilter = this.ctx.createBiquadFilter();
      this.beamHumGain = this.ctx.createGain();

      this.beamHumOsc.type = soundPreset === 'HEAVY_PLASMA' ? 'sawtooth' : 'triangle';
      const baseFreq = soundPreset === 'RESONANT_LASER' ? 520 : soundPreset === 'VOID_SURGE' ? 110 : 280;
      this.beamHumOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      this.beamHumFilter.type = 'bandpass';
      this.beamHumFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.beamHumFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.beamHumGain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);

      this.beamHumOsc.connect(this.beamHumFilter);
      this.beamHumFilter.connect(this.beamHumGain);
      this.beamHumGain.connect(this.ctx.destination);

      this.beamHumOsc.start();
    } catch (e) {
      // Ignore audio start errors
    }
  }

  public stopBeamHum() {
    if (this.beamHumOsc && this.ctx) {
      try {
        this.beamHumGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        setTimeout(() => {
          this.beamHumOsc?.stop();
          this.beamHumOsc?.disconnect();
          this.beamHumOsc = null;
          this.beamHumGain = null;
          this.beamHumFilter = null;
        }, 60);
      } catch (e) {
        this.beamHumOsc = null;
      }
    }
  }

  public playBeamImpact(impactPreset?: string) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (impactPreset === 'CRYSTAL_SHATTER' || impactPreset === 'QUANTUM_FRACTURE') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
      gain.gain.setValueAtTime(0.18 * this.volume, now);
    } else if (impactPreset === 'PLASMA_EXPLOSION' || impactPreset === 'FIREBALL') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
      gain.gain.setValueAtTime(0.22 * this.volume, now);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);
      gain.gain.setValueAtTime(0.19 * this.volume, now);
    }

    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playAsteroidHitCrack() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    gain.gain.setValueAtTime(0.16 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playAsteroidDestroy(size: string = 'MEDIUM') {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Dual layered explosion: Low sub-bass thud + high resonance shatter
    const oscSub = this.ctx.createOscillator();
    const gainSub = this.ctx.createGain();
    oscSub.type = 'sawtooth';

    const baseF = size === 'LARGE' ? 95 : size === 'ARMORED' ? 120 : size === 'ENERGY' ? 240 : 150;
    oscSub.frequency.setValueAtTime(baseF, now);
    oscSub.frequency.exponentialRampToValueAtTime(25, now + 0.45);

    gainSub.gain.setValueAtTime(0.35 * this.volume, now);
    gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    oscSub.connect(gainSub);
    gainSub.connect(this.ctx.destination);
    oscSub.start(now);
    oscSub.stop(now + 0.52);

    // High crystalline/debris crackle
    const oscHigh = this.ctx.createOscillator();
    const gainHigh = this.ctx.createGain();
    oscHigh.type = size === 'ENERGY' ? 'sine' : 'square';
    oscHigh.frequency.setValueAtTime(size === 'ENERGY' ? 980 : 620, now + 0.04);
    oscHigh.frequency.exponentialRampToValueAtTime(80, now + 0.32);

    gainHigh.gain.setValueAtTime(0.24 * this.volume, now + 0.04);
    gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    oscHigh.connect(gainHigh);
    gainHigh.connect(this.ctx.destination);
    oscHigh.start(now + 0.04);
    oscHigh.stop(now + 0.36);
  }

  public playBeamOverheat() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // Sizzling warning alarm tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.setValueAtTime(680, now + 0.1);
    osc.frequency.setValueAtTime(920, now + 0.2);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playBeamCooldownReady() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    // High pitch chime indicating recharge ready
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.08); // A5

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playTargetLocked() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, now); // C6
    osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    gain.gain.setValueAtTime(0.14 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playHazardWarning() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1174.66, now + 0.08);
    osc.frequency.setValueAtTime(880, now + 0.16);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playTransmissionBeep() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.setValueAtTime(1960, now + 0.05);

      gain.gain.setValueAtTime(0.09 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (_) {}
  }

  public playCinematicSwoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.6);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12 * this.volume, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch (_) {}
  }

  public playThrusterIgnition() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.35);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22 * this.volume, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (_) {}
  }

  public playGatePowerUp() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.05);

        gain.gain.setValueAtTime(0.08 * this.volume, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.28);
      });
    } catch (_) {}
  }

  // ==========================================
  // MODE 21 — THE FINAL COLLAPSE SOUND FX
  // ==========================================

  /** Deep gravitational rumbling representing the singularity destabilization */
  public playGravitationalRumble(duration = 3.5) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // Sub-bass oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(42, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(90, now);
      filter.frequency.linearRampToValueAtTime(140, now + duration * 0.5);
      filter.frequency.exponentialRampToValueAtTime(50, now + duration);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.45 * this.volume, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch (_) {}
  }

  /** Shrill pulsing emergency evacuation klaxon siren */
  public playEmergencyAlarm() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Dual-tone alternating siren
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.setValueAtTime(960, now + 0.12);
      osc.frequency.setValueAtTime(720, now + 0.13);
      osc.frequency.setValueAtTime(720, now + 0.25);
      osc.frequency.setValueAtTime(960, now + 0.26);
      osc.frequency.setValueAtTime(960, now + 0.38);
      osc.frequency.setValueAtTime(720, now + 0.39);
      osc.frequency.setValueAtTime(720, now + 0.5);

      gain.gain.setValueAtTime(0.28 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.58);
    } catch (_) {}
  }

  /** Thunderous cosmic explosion of two distant planets colliding */
  public playPlanetaryCollision() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // Heavy sub-bass detonation
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(18, now + 2.8);

      gain.gain.setValueAtTime(0.6 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 3.1);

      // Noise shockwave burst
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(320, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(60, now + 1.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (_) {}
  }

  /** Heavy hydraulic servo release when evacuation blast doors open */
  public playBlastDoorOpen() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      // Mechanical hydraulic hiss & tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(420, now + 0.8);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.95);
    } catch (_) {}
  }

  /** Massive metallic slam and hydraulic lock when blast doors seal */
  public playBlastDoorClose() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      // Heavy metal clank
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.35);

      gain1.gain.setValueAtTime(0.55 * this.volume, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.42);

      // Deep locking bolt thud
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(65, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(20, now + 0.55);

      gain2.gain.setValueAtTime(0.5 * this.volume, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.62);
    } catch (_) {}
  }

  /** Tremendous crescendo implosion and cosmic shockwave */
  public playFinalCosmicCollapse() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      // Inward pitch drop, then high energy release
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);
      osc.frequency.linearRampToValueAtTime(240, now + 1.5);
      osc.frequency.exponentialRampToValueAtTime(20, now + 4.0);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(1200, now + 1.5);
      filter.frequency.exponentialRampToValueAtTime(60, now + 4.2);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.6 * this.volume, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 4.6);
    } catch (_) {}
  }

  /** White flashbang explosion with massive boom and high-frequency ringing */
  public playFlashbangBoom() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // 1. Massive low-end boom detonation
      const oscBoom = this.ctx.createOscillator();
      const gainBoom = this.ctx.createGain();
      oscBoom.type = 'sine';
      oscBoom.frequency.setValueAtTime(110, now);
      oscBoom.frequency.exponentialRampToValueAtTime(18, now + 1.8);

      gainBoom.gain.setValueAtTime(0.85 * this.volume, now);
      gainBoom.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      oscBoom.connect(gainBoom);
      gainBoom.connect(this.ctx.destination);
      oscBoom.start(now);
      oscBoom.stop(now + 2.3);

      // 2. White noise blast
      const bufferSize = this.ctx.sampleRate * 1.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);

      // 3. Tinnitus / ringing after-effect
      const oscRing = this.ctx.createOscillator();
      const gainRing = this.ctx.createGain();
      oscRing.type = 'sine';
      oscRing.frequency.setValueAtTime(3200, now + 0.05);

      gainRing.gain.setValueAtTime(0.18 * this.volume, now + 0.05);
      gainRing.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      oscRing.connect(gainRing);
      gainRing.connect(this.ctx.destination);
      oscRing.start(now + 0.05);
      oscRing.stop(now + 2.6);
    } catch (_) {}
  }

  /** Mechanical clamp lock sound with heavy metallic latch and hydraulic pressure release */
  public playClampLock(clampIndex: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // Heavy metallic clank
      const oscClank = this.ctx.createOscillator();
      const gainClank = this.ctx.createGain();
      oscClank.type = 'triangle';
      const baseFreq = 160 + clampIndex * 24;
      oscClank.frequency.setValueAtTime(baseFreq, now);
      oscClank.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gainClank.gain.setValueAtTime(0.75 * this.volume, now);
      gainClank.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      oscClank.connect(gainClank);
      gainClank.connect(this.ctx.destination);
      oscClank.start(now);
      oscClank.stop(now + 0.24);

      // Hydraulic hiss
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400, now);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4 * this.volume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (_) {}
  }

  /** Tech parking bay lock confirmation chime */
  public playParkingConfirmed() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.35 * this.volume, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.48);
      });
    } catch (_) {}
  }

  /** Secondary pressure door sealing sound */
  public playHydraulicPressureDoor() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(42, now + 0.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);

      gain.gain.setValueAtTime(0.5 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch (_) {}
  }

  /** Power connection and charging cable latch */
  public playChargingConnect() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.35);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch (_) {}
  }

  /** Section 40: Sub-bass gravitational implosion: vacuum-like inward pitch and pressure drop */
  public playSubBassGravitationalImplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      // Inward pitch suck down into deep subsonic range
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(14, now + 1.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(35, now + 1.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.9 * this.volume, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.75);
    } catch (_) {}
  }

  /** Section 35 & 40: Massive deep-space cosmic BOOM with sub-bass detonation (NO high-frequency white blast) */
  public playDeepCosmicBoom() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;

      // Colossal low-end sub-bass impact (35Hz downward to 12Hz)
      const oscSub = this.ctx.createOscillator();
      const gainSub = this.ctx.createGain();
      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(42, now);
      oscSub.frequency.exponentialRampToValueAtTime(12, now + 2.5);

      gainSub.gain.setValueAtTime(1.0 * this.volume, now);
      gainSub.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      oscSub.connect(gainSub);
      gainSub.connect(this.ctx.destination);
      oscSub.start(now);
      oscSub.stop(now + 3.3);

      // Deep rumble body
      const oscBody = this.ctx.createOscillator();
      const gainBody = this.ctx.createGain();
      const filterBody = this.ctx.createBiquadFilter();

      oscBody.type = 'triangle';
      oscBody.frequency.setValueAtTime(65, now);
      oscBody.frequency.exponentialRampToValueAtTime(18, now + 2.0);

      filterBody.type = 'lowpass';
      filterBody.frequency.setValueAtTime(140, now);
      filterBody.frequency.exponentialRampToValueAtTime(30, now + 2.0);

      gainBody.gain.setValueAtTime(0.8 * this.volume, now);
      gainBody.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      oscBody.connect(filterBody);
      filterBody.connect(gainBody);
      gainBody.connect(this.ctx.destination);
      oscBody.start(now);
      oscBody.stop(now + 2.9);
    } catch (_) {}
  }

  /** Section 35 & 40: Dark gravitational shockwave: deep phase-shifted bass sweeping across space */
  public playDarkGravitationalShockwave() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(32, now);
      osc1.frequency.linearRampToValueAtTime(18, now + 3.5);
      osc2.frequency.setValueAtTime(33.5, now); // Detuned for pulsing phase-beat
      osc2.frequency.linearRampToValueAtTime(17.5, now + 3.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(90, now);
      filter.frequency.linearRampToValueAtTime(160, now + 1.2);
      filter.frequency.exponentialRampToValueAtTime(25, now + 3.8);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.7 * this.volume, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 4.1);
      osc2.stop(now + 4.1);
    } catch (_) {}
  }

  /** Section 40: Stabilized interior hum and calm life support hiss */
  public playShelterInteriorHum() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22 * this.volume, now + 1.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 6.0);
    } catch (_) {}
  }

  /** Deep metal structure groaning and creaking sound for collapsing megastructures */
  public playStructureCreak() {
    this.initContext();
    if (!this.ctx || !this.sfxEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.linearRampToValueAtTime(85, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);
      filter.frequency.linearRampToValueAtTime(480, now + 0.4);
      filter.frequency.exponentialRampToValueAtTime(60, now + 1.3);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.45);
    } catch (_) {}
  }
}

export const sound = new SoundSystem();
export const soundSystem = sound;
if (typeof window !== 'undefined') {
  sound.preloadCinematicAudio().catch(() => {});
}
