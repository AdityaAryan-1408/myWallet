/**
 * MyWallet — Theme & Visual Ambient Zustand Store
 * 
 * Manages active theme selection, palette switching, and ambient particle engine states.
 * Persists theme mode to Android SharedPreferences / SQLite / LocalStorage, and
 * triggers smooth app reloads to rebind all static design tokens across the app.
 */

import { NativeModules, Platform, DevSettings } from 'react-native';
import { create } from 'zustand';
import { ThemeMode, activeTheme, UIStyle, activeUIStyle } from '@/theme';
import { SettingsRepository } from '@/repositories/settingsRepository';

interface ThemeState {
  themeMode: ThemeMode;
  uiStyle: UIStyle;
  ambientParticlesEnabled: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setUIStyle: (style: UIStyle) => void;
  setAmbientParticlesEnabled: (enabled: boolean) => void;
  toggleAmbientParticles: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: activeTheme,
  uiStyle: activeUIStyle,
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

  setUIStyle: (style: UIStyle) => {
    const current = get().uiStyle;
    if (current === style) return;

    set({ uiStyle: style });

    try {
      SettingsRepository.setUIStyle(style);
    } catch (e) {
      console.warn('Could not save UI style to SQLite:', e);
    }

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('mywallet_ui_style', style);
      }
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.location) {
          window.location.reload();
        }
      }, 100);
    } else {
      try {
        if (NativeModules.AppTheme?.setStyle) {
          NativeModules.AppTheme.setStyle(style);
        }
      } catch (e) {
        console.warn('Could not set native UI style:', e);
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
