/**
 * MyWallet — Security Repository
 * 
 * Manages device PIN protection, app lock configuration,
 * biometrics preferences, and auto-lock timeouts.
 */

import { SettingsRepository } from './settingsRepository';

const KEY_APP_LOCK = 'security_app_lock_enabled';
const KEY_PIN_HASH = 'security_pin_hash';
const KEY_BIOMETRICS = 'security_biometrics_enabled';
const KEY_AUTO_LOCK = 'security_auto_lock_timeout';

// Simple deterministic hash function for local PIN validation
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `zenith_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export type AutoLockOption = 'immediately' | '1_min' | '5_min' | '15_min';

export const SecurityRepository = {
  /**
   * Returns whether App Lock is enabled and a valid PIN exists.
   */
  isAppLockEnabled(): boolean {
    const enabled = SettingsRepository.get(KEY_APP_LOCK, '0') === '1';
    return enabled && this.hasPin();
  },

  /**
   * Enables or disables App Lock. If enabling without a PIN, throws an error.
   */
  setAppLockEnabled(enabled: boolean): void {
    if (enabled && !this.hasPin()) {
      throw new Error('A 4-digit PIN must be set before enabling App Lock.');
    }
    SettingsRepository.set(KEY_APP_LOCK, enabled ? '1' : '0');
  },

  /**
   * Checks if a security PIN is set.
   */
  hasPin(): boolean {
    const hash = SettingsRepository.get(KEY_PIN_HASH, '');
    return Boolean(hash && hash.length > 0);
  },

  /**
   * Verifies an entered PIN against the stored hash.
   */
  verifyPin(pin: string): boolean {
    const storedHash = SettingsRepository.get(KEY_PIN_HASH, '');
    if (!storedHash) return false;
    return storedHash === hashPin(pin);
  },

  /**
   * Sets or updates the 4-digit security PIN.
   */
  setPin(pin: string): void {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      throw new Error('PIN must be exactly 4 numeric digits.');
    }
    const hash = hashPin(pin);
    SettingsRepository.set(KEY_PIN_HASH, hash);
    SettingsRepository.set(KEY_APP_LOCK, '1');
  },

  /**
   * Clears the security PIN and disables app lock.
   */
  removePin(): void {
    SettingsRepository.set(KEY_PIN_HASH, '');
    SettingsRepository.set(KEY_APP_LOCK, '0');
    SettingsRepository.set(KEY_BIOMETRICS, '0');
  },

  /**
   * Returns whether biometrics (Face ID / Touch ID) is enabled.
   */
  isBiometricsEnabled(): boolean {
    return SettingsRepository.get(KEY_BIOMETRICS, '0') === '1';
  },

  /**
   * Sets biometrics preference.
   */
  setBiometricsEnabled(enabled: boolean): void {
    SettingsRepository.set(KEY_BIOMETRICS, enabled ? '1' : '0');
  },

  /**
   * Returns configured auto-lock timeout duration.
   */
  getAutoLockTimeout(): AutoLockOption {
    const val = SettingsRepository.get(KEY_AUTO_LOCK, 'immediately');
    if (val === '1_min' || val === '5_min' || val === '15_min') {
      return val;
    }
    return 'immediately';
  },

  /**
   * Sets auto-lock timeout duration.
   */
  setAutoLockTimeout(timeout: AutoLockOption): void {
    SettingsRepository.set(KEY_AUTO_LOCK, timeout);
  },
};
