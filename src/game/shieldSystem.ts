import * as THREE from 'three';
import { ActiveShieldTelemetry, ActiveShieldStatus } from '../types';
import { sound } from './audio';

export const SHIELD_CONFIG = {
  ACTIVE_DURATION: 6.0, // Seconds shield bubble stays active
  COOLDOWN_DURATION: 60.0, // Exactly 60 seconds recharge
  DAMAGE_ABSORPTION_RATE: 0.95, // Blocks 95% of incoming kinetic/laser/missile damage while active
};

export class ActiveShieldManager {
  public status: ActiveShieldStatus = 'READY';
  public activeRemaining: number = 0;
  public cooldownRemaining: number = 0;
  public damageBlocked: number = 0;
  private lastAttemptTime: number = 0;

  constructor() {}

  // ==========================================
  // ACTIVATE SHIELD
  // ==========================================
  public activate(): boolean {
    const now = performance.now();
    // Debounce rapid clicking
    if (now - this.lastAttemptTime < 250) {
      return false;
    }
    this.lastAttemptTime = now;

    // Must be READY
    if (this.status !== 'READY') {
      return false;
    }

    this.status = 'ACTIVE';
    this.activeRemaining = SHIELD_CONFIG.ACTIVE_DURATION;
    this.cooldownRemaining = 0;

    // Play activation sound
    sound.playShieldActivate();

    return true;
  }

  // ==========================================
  // UPDATE LOOP (REAL ELAPSED TIME)
  // ==========================================
  public update(dt: number, isPaused: boolean = false) {
    if (isPaused) return;

    if (this.status === 'ACTIVE') {
      this.activeRemaining = Math.max(0, this.activeRemaining - dt);
      if (this.activeRemaining <= 0) {
        // Shield expired -> start 60s recharge
        this.status = 'RECHARGING';
        this.cooldownRemaining = SHIELD_CONFIG.COOLDOWN_DURATION;
      }
    } else if (this.status === 'RECHARGING') {
      const prev = this.cooldownRemaining;
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);

      // Reached zero -> READY!
      if (prev > 0 && this.cooldownRemaining <= 0) {
        this.status = 'READY';
        sound.playShieldRechargeReady();
      }
    }
  }

  // ==========================================
  // DAMAGE REDUCTION INTERACTION
  // ==========================================
  public filterIncomingDamage(rawDmg: number): { netDamage: number; blocked: number } {
    if (this.status === 'ACTIVE') {
      const blocked = rawDmg * SHIELD_CONFIG.DAMAGE_ABSORPTION_RATE;
      const netDamage = rawDmg - blocked;
      this.damageBlocked += blocked;
      sound.playShieldDeflect();
      return { netDamage, blocked };
    }
    return { netDamage: rawDmg, blocked: 0 };
  }

  // ==========================================
  // RESET ON RACE RESTART
  // ==========================================
  public reset() {
    this.status = 'READY';
    this.activeRemaining = 0;
    this.cooldownRemaining = 0;
    this.damageBlocked = 0;
  }

  public getTelemetry(shieldCoreHealth: number): ActiveShieldTelemetry {
    return {
      status: this.status,
      activeRemaining: this.activeRemaining,
      activeTotalDuration: SHIELD_CONFIG.ACTIVE_DURATION,
      cooldownRemaining: this.cooldownRemaining,
      totalCooldown: SHIELD_CONFIG.COOLDOWN_DURATION,
      shieldCoreHealth,
      damageBlocked: Math.round(this.damageBlocked),
    };
  }
}
