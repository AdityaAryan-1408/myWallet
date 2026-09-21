/**
 * MyWallet — Zenith Obsidian Financial Design System
 * Color palette derived from the DESIGN.md specification.
 * 
 * This is the single source of truth for all colors in the app.
 * Do NOT use hardcoded hex values in components — always reference this file.
 */

export const Colors = {
  // ─── Surface Architecture ───────────────────────────────────────
  // Tonal layer stacking from deepest to brightest
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
  // Hero metrics, CTAs, active states, Available to Spend
  primary: '#ffffff',
  onPrimary: '#293500',
  primaryContainer: '#c8f322',   // The chartreuse! Main accent fill
  onPrimaryContainer: '#576c00',
  primaryFixed: '#c8f322',       // Fixed variant for consistent accent
  primaryFixedDim: '#aed500',    // Dimmed chartreuse
  inversePrimary: '#526600',
  surfaceTint: '#aed500',

  // ─── Secondary Accent: Electric Cyan ────────────────────────────
  // Automated intelligence, scheduled transfers, biometric status
  secondary: '#d3fbff',
  onSecondary: '#00363a',
  secondaryContainer: '#00eefc',
  onSecondaryContainer: '#00686f',
  secondaryFixed: '#7df4ff',
  secondaryFixedDim: '#00dbe9',

  // ─── Tertiary Accent: Vivid Violet ──────────────────────────────
  // Investments, portfolio, long-term reserves, savings
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
  // These go beyond the M3 spec for financial-specific meaning
  income: '#00E676',           // Neon Mint — inbound capital, positive yield
  expense: '#FF5252',          // Soft Coral — debit burn, category breaches
  warning: '#F59E0B',          // Warm Amber — pending, alerts, caution
  transfer: '#00dbe9',         // Cyan — transfers, settlements

  // ─── Surface Strokes ───────────────────────────────────────────
  // Use these for hairline borders on cards/containers
  strokeSubtle: 'rgba(255, 255, 255, 0.04)',
  strokeLight: 'rgba(255, 255, 255, 0.06)',
  strokeMedium: 'rgba(255, 255, 255, 0.08)',
  strokeBright: 'rgba(255, 255, 255, 0.12)',

  // ─── Accent Glows (for shadows/halos) ──────────────────────────
  chartreuse: '#D4FF32',       // Pure bright chartreuse for glows
  chartreuseGlow: 'rgba(212, 255, 50, 0.25)',
  chartreuseWash: 'rgba(212, 255, 50, 0.15)',
  chartreuseSubtle: 'rgba(212, 255, 50, 0.10)',

  // ─── Category Default Colors ───────────────────────────────────
  // Curated palette for expense categories
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
} as const;

export type ColorToken = keyof typeof Colors;
