/**
 * MyWallet — Theme & Visual Ambient Zustand Store
 * 
 * Manages active theme selection, palette switching, and ambient particle engine states.
 * Persists theme mode to Android SharedPreferences / SQLite / LocalStorage, and
 * triggers smooth app reloads to rebind all static design tokens across the app.
 */

import { NativeModules, Platform, DevSettings } from 'react-native';
import { create } from 'zustand';
import { ThemeMode, activeTheme } from '@/theme';
import { SettingsRepository } from '@/repositories/settingsRepository';

interface ThemeState {
  themeMode: ThemeMode;
  ambientParticlesEnabled: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setAmbientParticlesEnabled: (enabled: boolean) => void;
  toggleAmbientParticles: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: activeTheme,
  ambientParticlesEnabled: SettingsRepository.getAmbientParticlesEnabled(),

  setThemeMode: (mode: ThemeMode) => {
    const current = get().themeMode;
    if (current === mode) return;

    // Update in-memory state
    set({ themeMode: mode });

    // Persist to SQLite
    try {
      SettingsRepository.setThemeMode(mode);
    } catch (e) {
      console.warn('Could not save theme to SQLite:', e);
    }

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('mywallet_theme_mode', mode);
      }
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location) {
          window.location.reload();
        }
      }, 100);
    } else {
      // Native Android / iOS: Save to SharedPreferences and restart smoothly
      try {
        if (NativeModules.AppTheme?.setTheme) {
          NativeModules.AppTheme.setTheme(mode);
        }
      } catch (e) {
        console.warn('Could not set native theme:', e);
      }

      setTimeout(() => {
        try {
          if (NativeModules.AppTheme?.restartApp) {
            NativeModules.AppTheme.restartApp();
          } else if (__DEV__ && DevSettings?.reload) {
            DevSettings.reload();
          }
        } catch (e) {
          console.warn('Could not restart app:', e);
        }
      }, 120);
    }
  },

  setAmbientParticlesEnabled: (enabled: boolean) => {
    set({ ambientParticlesEnabled: enabled });
    try {
      SettingsRepository.setAmbientParticlesEnabled(enabled);
    } catch (e) {
      console.warn('Could not save ambient particles setting:', e);
    }
  },

  toggleAmbientParticles: () => {
    const next = !get().ambientParticlesEnabled;
    get().setAmbientParticlesEnabled(next);
  },
}));
