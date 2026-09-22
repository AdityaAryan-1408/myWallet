/**
 * MyWallet — Zenith Financial Design System (Dark & Light)
 * Color palette derived from the Zenith Obsidian & Zenith Light specifications.
 * 
 * Supports dynamic Dark Mode (Zenith Obsidian) and Light Mode (Zenith Light).
 */

export const DarkColors = {
  // ─── Surface Architecture ───────────────────────────────────────
  surface: '#101319',          // Level 0: Canvas base (background)
  surfaceDim: '#101319',       // Alias
  surfaceBright: '#363940',    // Brightest surface variant
  surfaceContainerLowest: '#0b0e14', // Level 0.5: Sub-canvas
  surfaceContainerLow: '#191c22',    // Level 1: Primary container plane
  surfaceContainer: '#1d2026',       // Level 1.5: Default container
  surfaceContainerHigh: '#272a30',   // Level 2: Elevated cards/sheets
  surfaceContainerHighest: '#32353b', // Level 3: Modals/popups

  // ─── On-Surface (Text on dark backgrounds) ─────────────────────
  onSurface: '#e1e2eb',        // Primary text
  onSurfaceVariant: '#c5c9ad', // Secondary/muted text
  inverseSurface: '#e1e2eb',
  inverseOnSurface: '#2d3037',

  // ─── Primary Accent: Electric Chartreuse ────────────────────────
  primary: '#ffffff',
  onPrimary: '#293500',
  primaryContainer: '#c8f322',   // Main accent fill
  onPrimaryContainer: '#576c00',
  primaryFixed: '#c8f322',       // Fixed variant for consistent accent
  primaryFixedDim: '#aed500',    // Dimmed chartreuse
  inversePrimary: '#526600',
  surfaceTint: '#aed500',

  // ─── Secondary Accent: Electric Cyan ────────────────────────────
  secondary: '#d3fbff',
  onSecondary: '#00363a',
  secondaryContainer: '#00eefc',
  onSecondaryContainer: '#00686f',
  secondaryFixed: '#7df4ff',
  secondaryFixedDim: '#00dbe9',

  // ─── Tertiary Accent: Vivid Violet ──────────────────────────────
  tertiary: '#ffffff',
  onTertiary: '#490080',
  tertiaryContainer: '#f0dbff',
  onTertiaryContainer: '#8a33d9',
  tertiaryFixed: '#f0dbff',
  tertiaryFixedDim: '#ddb7ff',

  // ─── Error / Danger ─────────────────────────────────────────────
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  // ─── Outline / Borders ──────────────────────────────────────────
  outline: '#8f937a',
  outlineVariant: '#444934',

  // ─── Semantic Financial Colors ──────────────────────────────────
  income: '#00E676',           // Neon Mint
  expense: '#FF5252',          // Soft Coral
  warning: '#F59E0B',          // Warm Amber
  transfer: '#00dbe9',         // Cyan

  // ─── Surface Strokes ───────────────────────────────────────────
  strokeSubtle: 'rgba(255, 255, 255, 0.04)',
  strokeLight: 'rgba(255, 255, 255, 0.06)',
  strokeMedium: 'rgba(255, 255, 255, 0.08)',
  strokeBright: 'rgba(255, 255, 255, 0.12)',

  // ─── Accent Glows ──────────────────────────────────────────────
  chartreuse: '#D4FF32',
  chartreuseGlow: 'rgba(212, 255, 50, 0.25)',
  chartreuseWash: 'rgba(212, 255, 50, 0.15)',
  chartreuseSubtle: 'rgba(212, 255, 50, 0.10)',

  // ─── Category Colors ───────────────────────────────────────────
  categoryFood: '#FF6B6B',
  categoryShopping: '#FFD93D',
  categoryTransport: '#6BCB77',
  categoryEntertainment: '#4D96FF',
  categoryBills: '#FF8C32',
  categoryHealth: '#00C9A7',
  categoryEducation: '#845EC2',
  categoryTravel: '#00B8D4',
  categoryPersonalCare: '#FF6F91',
  categorySubscriptions: '#C34A36',
  categoryGifts: '#FFC75F',
  categoryOther: '#8F937a',
};

export const LightColors: typeof DarkColors = {
  // ─── Surface Architecture (Zenith Light) ────────────────────────
  surface: '#F4F6F9',          // Level 0: Soft slate/white canvas
  surfaceDim: '#EAEFF5',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FFFFFF',    // Level 1: Pure white cards
  surfaceContainer: '#F0F3F7',       // Level 1.5: Subtle container
  surfaceContainerHigh: '#E5EAF2',   // Level 2: Interactive elements/inputs
  surfaceContainerHighest: '#DAE0EC', // Level 3: Elevated popups/pills

  // ─── On-Surface (Text on light backgrounds) ─────────────────────
  onSurface: '#0F172A',        // Slate 900: High-contrast primary text
  onSurfaceVariant: '#5A6A80', // Slate 600: Secondary text
  inverseSurface: '#101319',
  inverseOnSurface: '#E1E2EB',

  // ─── Primary Accent: Crisp Emerald Green ───────────────────────
  primary: '#15803D',
  onPrimary: '#FFFFFF',
  primaryContainer: '#16A34A',
  onPrimaryContainer: '#052E16',
  primaryFixed: '#16A34A',
  primaryFixedDim: '#15803D',
  inversePrimary: '#C8F322',
  surfaceTint: '#16A34A',

  // ─── Secondary Accent: Vivid Azure Cyan ────────────────────────
  secondary: '#0284C7',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#0284C7',
  onSecondaryContainer: '#FFFFFF',
  secondaryFixed: '#0284C7',
  secondaryFixedDim: '#0369A1',

  // ─── Tertiary Accent: Royal Violet ──────────────────────────────
  tertiary: '#7C3AED',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#7C3AED',
  onTertiaryContainer: '#FFFFFF',
  tertiaryFixed: '#7C3AED',
  tertiaryFixedDim: '#6D28D9',

  // ─── Error / Danger ─────────────────────────────────────────────
  error: '#DC2626',
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#991B1B',

  // ─── Outline / Borders ──────────────────────────────────────────
  outline: '#94A3B8',
  outlineVariant: '#CBD5E1',

  // ─── Semantic Financial Colors ──────────────────────────────────
  income: '#16A34A',           // Vibrant Emerald Green
  expense: '#DC2626',          // Crisp Crimson Red
  warning: '#D97706',          // Warm Amber
  transfer: '#0284C7',         // Vivid Cyan

  // ─── Surface Strokes ───────────────────────────────────────────
  strokeSubtle: 'rgba(0, 0, 0, 0.06)',
  strokeLight: 'rgba(0, 0, 0, 0.08)',
  strokeMedium: 'rgba(0, 0, 0, 0.12)',
  strokeBright: 'rgba(0, 0, 0, 0.18)',

  // ─── Accent Glows ──────────────────────────────────────────────
  chartreuse: '#16A34A',
  chartreuseGlow: 'rgba(22, 163, 74, 0.20)',
  chartreuseWash: 'rgba(22, 163, 74, 0.12)',
  chartreuseSubtle: 'rgba(22, 163, 74, 0.08)',

  // ─── Category Colors (Crisp) ───────────────────────────────────
  categoryFood: '#E11D48',
  categoryShopping: '#D97706',
  categoryTransport: '#059669',
  categoryEntertainment: '#2563EB',
  categoryBills: '#EA580C',
  categoryHealth: '#0D9488',
  categoryEducation: '#7C3AED',
  categoryTravel: '#0284C7',
  categoryPersonalCare: '#DB2777',
  categorySubscriptions: '#B91C1C',
  categoryGifts: '#D97706',
  categoryOther: '#64748B',
};

import { NativeModules, Platform } from 'react-native';

// Check stored theme synchronously at module load
export function getInitialTheme(): 'dark' | 'light' {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('mywallet_theme_mode');
      if (saved === 'light') return 'light';
      if (saved === 'dark') return 'dark';
      if (saved === 'system' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    }
  } else {
    // 1. Check Android NativeModules synchronously (from SharedPreferences)
    try {
      if (NativeModules.AppTheme?.getTheme) {
        const nativeTheme = NativeModules.AppTheme.getTheme();
        if (nativeTheme === 'light') return 'light';
        if (nativeTheme === 'dark') return 'dark';
      }
    } catch {
      // ignore
    }

    // 2. Fallback check from SQLite database
    try {
      const { getDatabase } = require('../db/client');
      const db = getDatabase();
      const row = db.getFirstSync("SELECT value FROM user_settings WHERE key = 'theme_mode';");
      if (row?.value === 'light') return 'light';
    } catch {
      // fallback
    }
  }
  return 'dark';
}

const activeTheme = getInitialTheme();

/**
 * Design system color tokens for the active theme.
 */
export const Colors = {
  ...(activeTheme === 'light' ? LightColors : DarkColors),
};

export type ColorToken = keyof typeof DarkColors;

