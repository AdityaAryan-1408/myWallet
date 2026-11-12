/**
 * MyWallet — UI Style System
 * 
 * Manages high-level UI styles across the entire application:
 * 1. 'zenith' — The original cyber-luxury HUD aesthetic (glassmorphic bars, ambient particles, floating summary HUD)
 * 2. 'minimal' — Finans warm minimal aesthetic (warm layered card geometry, clean pill ergonomics, quiet scannability)
 * 
 * Works harmoniously alongside the 11 color theme palettes (Dark, Light, Mono, Gold, etc.).
 */

import { NativeModules, Platform } from 'react-native';

export type UIStyle = 'zenith' | 'minimal';

export const VALID_UI_STYLES: readonly UIStyle[] = ['zenith', 'minimal'] as const;

export function isValidUIStyle(val: any): val is UIStyle {
  return typeof val === 'string' && (VALID_UI_STYLES as readonly string[]).includes(val);
}

export function getInitialUIStyle(): UIStyle {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('mywallet_ui_style');
      if (isValidUIStyle(saved)) return saved;
    }
  } else {
    // 1. Check Android NativeModules synchronously from SharedPreferences
    try {
      if (NativeModules.AppTheme?.getStyle) {
        const nativeStyle = NativeModules.AppTheme.getStyle();
        if (isValidUIStyle(nativeStyle)) return nativeStyle;
      }
    } catch {
      // ignore
    }

    // 2. Fallback check from SQLite database
    try {
      const { getDatabase } = require('../db/client');
      const db = getDatabase();
      const row = db.getFirstSync("SELECT value FROM user_settings WHERE key = 'ui_style';");
      if (isValidUIStyle(row?.value)) return row.value;
    } catch {
      // fallback
    }
  }
  return 'zenith';
}

export const activeUIStyle: UIStyle = getInitialUIStyle();
export const isMinimalStyle: boolean = activeUIStyle === 'minimal';
export const isZenithStyle: boolean = activeUIStyle === 'zenith';

