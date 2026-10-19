/**
 * MyWallet — Sound Service (Ambient Sound Design / Financial Sonic Branding)
 * 
 * Manages zero-latency, tactile micro-audio effects (<100ms) for key financial actions:
 * - 💰 Income logged: Soft ascending chime (C6 → G6)
 * - 💸 Expense saved: Quiet papery whoosh
 * - ✅ Goal milestone hit: Warm resonant bell harmonic
 * - 🔔 Budget warning crossed: Low tonal ambient hum
 * - 📊 Pull-to-refresh: Crisp mechanical camera/dial click
 * 
 * Fully opt-in, disabled by default, and volume follows system media.
 */

import { Platform } from 'react-native';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { SettingsRepository } from '@/repositories/settingsRepository';

export type SoundEffect =
  | 'income'
  | 'expense'
  | 'goal'
  | 'budget_warning'
  | 'refresh';

const SOUND_ASSETS: Record<SoundEffect, number> = {
  income: require('../../assets/sounds/income_chime.wav'),
  expense: require('../../assets/sounds/expense_whoosh.wav'),
  goal: require('../../assets/sounds/goal_bell.wav'),
  budget_warning: require('../../assets/sounds/budget_hum.wav'),
  refresh: require('../../assets/sounds/refresh_click.wav'),
};

class SoundServiceImpl {
  private players: Partial<Record<SoundEffect, AudioPlayer>> = {};
  private isMutedByUser: boolean = false;

  constructor() {
    this.refreshSettings();
  }

  /**
   * Refreshes the user's sound toggle from SQLite settings
   */
  public refreshSettings(): void {
    try {
      this.isMutedByUser = !SettingsRepository.getSoundsEnabled();
    } catch {
      this.isMutedByUser = true;
    }
  }

  /**
   * Retrieves or initializes a pooled player instance for the given sound effect
   */
  private getPlayer(effect: SoundEffect): AudioPlayer | null {
    try {
      if (!this.players[effect]) {
        const source = SOUND_ASSETS[effect];
        if (!source) return null;
        this.players[effect] = createAudioPlayer(source);
      }
      return this.players[effect] || null;
    } catch (err) {
      console.warn(`[SoundService] Failed to create player for ${effect}:`, err);
      return null;
    }
  }

  /**
   * Plays a financial sound effect if sounds are enabled by the user
   */
  public play(effect: SoundEffect): void {
    if (this.isMutedByUser) return;
    this.playImmediate(effect);
  }

  /**
   * Plays a sound effect regardless of the user's toggle (e.g. previewing in Settings)
   */
  public playPreview(effect: SoundEffect): void {
    this.playImmediate(effect);
  }

  private playImmediate(effect: SoundEffect): void {
    if (Platform.OS === 'web') return;

    try {
      const player = this.getPlayer(effect);
      if (player) {
        // Rewind and play with low latency
        player.seekTo(0).catch(() => {});
        player.play();
      }
    } catch (e) {
      // Audio playback should never disrupt app flow
      console.warn(`[SoundService] Playback error for ${effect}:`, e);
    }
  }
}

export const SoundService = new SoundServiceImpl();
