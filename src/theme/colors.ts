/**
 * MyWallet — Zenith Financial Design System (Multi-Theme Palette Engine)
 * 
 * Supports 11 curated, immersive design themes:
 * 1. Zenith Dark (AMOLED Obsidian & Electric Chartreuse)
 * 2. Zenith Light (Crisp Daylight Slate & Emerald Green)
 * 3. Minimal OLED Dark (Pure #000000 Monochrome, zero red/green distractions)
 * 4. Minimal Ink Light (Pure #FFFFFF Monochrome, zero red/green distractions)
 * 5. Emerald Reserve (Swiss Vault, Forest Obsidian & Mint Emerald)
 * 6. Cyberpunk Crimson (Neo-Tokyo Pitch Black & Laser Crimson)
 * 7. Desert Dune (Warm Espresso Terracotta & Desert Sand Gold)
 * 8. Sunset Mirage (Twilight Obsidian & Sunset Coral Horizon)
 * 9. Sovereign Gold (Imperial Regal Navy & 24k Bullion Gold)
 * 10. Midnight Amethyst (Obsidian Plum & Electric Amethyst)
 * 11. Sapphire Horizon (Abyssal Navy & Electric Cyan Glaze)
 */

import { NativeModules, Platform } from 'react-native';

// ─── 1. Zenith Dark (Default) ────────────────────────────────────────────────
export const DarkColors = {
  // Surface Architecture
  surface: '#101319',
  surfaceDim: '#101319',
  surfaceBright: '#363940',
  surfaceContainerLowest: '#0b0e14',
  surfaceContainerLow: '#191c22',
  surfaceContainer: '#1d2026',
  surfaceContainerHigh: '#272a30',
  surfaceContainerHighest: '#32353b',

  // On-Surface (Text)
  onSurface: '#e1e2eb',
  onSurfaceVariant: '#c5c9ad',
  inverseSurface: '#e1e2eb',
  inverseOnSurface: '#2d3037',

  // Primary Accent: Electric Chartreuse
  primary: '#ffffff',
  onPrimary: '#293500',
  primaryContainer: '#c8f322',
  onPrimaryContainer: '#576c00',
  primaryFixed: '#c8f322',
  primaryFixedDim: '#aed500',
  inversePrimary: '#526600',
  surfaceTint: '#aed500',

  // Secondary Accent: Electric Cyan
  secondary: '#d3fbff',
  onSecondary: '#00363a',
  secondaryContainer: '#00eefc',
  onSecondaryContainer: '#00686f',
  secondaryFixed: '#7df4ff',
  secondaryFixedDim: '#00dbe9',

  // Tertiary Accent: Vivid Violet
  tertiary: '#ffffff',
  onTertiary: '#490080',
  tertiaryContainer: '#f0dbff',
  onTertiaryContainer: '#8a33d9',
  tertiaryFixed: '#f0dbff',
  tertiaryFixedDim: '#ddb7ff',

  // Error / Danger
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  // Outline / Borders
  outline: '#8f937a',
  outlineVariant: '#444934',

  // Semantic Financial Colors
  income: '#00E676',
  expense: '#FF5252',
  warning: '#F59E0B',
  transfer: '#00dbe9',

  // Surface Strokes
  strokeSubtle: 'rgba(255, 255, 255, 0.04)',
  strokeLight: 'rgba(255, 255, 255, 0.06)',
  strokeMedium: 'rgba(255, 255, 255, 0.08)',
  strokeBright: 'rgba(255, 255, 255, 0.12)',

  // Accent Glows
  chartreuse: '#D4FF32',
  chartreuseGlow: 'rgba(212, 255, 50, 0.25)',
  chartreuseWash: 'rgba(212, 255, 50, 0.15)',
  chartreuseSubtle: 'rgba(212, 255, 50, 0.10)',

  // Category Colors
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

// ─── 2. Zenith Light ─────────────────────────────────────────────────────────
export const LightColors: typeof DarkColors = {
  surface: '#F4F6F9',
  surfaceDim: '#EAEFF5',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FFFFFF',
  surfaceContainer: '#F0F3F7',
  surfaceContainerHigh: '#E5EAF2',
  surfaceContainerHighest: '#DAE0EC',

  onSurface: '#0F172A',
  onSurfaceVariant: '#5A6A80',
  inverseSurface: '#101319',
  inverseOnSurface: '#E1E2EB',

  primary: '#15803D',
  onPrimary: '#FFFFFF',
  primaryContainer: '#16A34A',
  onPrimaryContainer: '#052E16',
  primaryFixed: '#16A34A',
  primaryFixedDim: '#15803D',
  inversePrimary: '#C8F322',
  surfaceTint: '#16A34A',

  secondary: '#0284C7',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#0284C7',
  onSecondaryContainer: '#FFFFFF',
  secondaryFixed: '#0284C7',
  secondaryFixedDim: '#0369A1',

  tertiary: '#7C3AED',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#7C3AED',
  onTertiaryContainer: '#FFFFFF',
  tertiaryFixed: '#7C3AED',
  tertiaryFixedDim: '#6D28D9',

  error: '#DC2626',
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#991B1B',

  outline: '#94A3B8',
  outlineVariant: '#CBD5E1',

  income: '#16A34A',
  expense: '#DC2626',
  warning: '#D97706',
  transfer: '#0284C7',

  strokeSubtle: 'rgba(0, 0, 0, 0.06)',
  strokeLight: 'rgba(0, 0, 0, 0.08)',
  strokeMedium: 'rgba(0, 0, 0, 0.12)',
  strokeBright: 'rgba(0, 0, 0, 0.18)',

  chartreuse: '#16A34A',
  chartreuseGlow: 'rgba(22, 163, 74, 0.20)',
  chartreuseWash: 'rgba(22, 163, 74, 0.12)',
  chartreuseSubtle: 'rgba(22, 163, 74, 0.08)',

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

// ─── 3. Minimal OLED Dark (Pure Black & White — Red/Green Free) ──────────────
export const MonoDarkColors: typeof DarkColors = {
  ...DarkColors,
  surface: '#000000',
  surfaceDim: '#000000',
  surfaceBright: '#1A1A1A',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#0A0A0A',
  surfaceContainer: '#121212',
  surfaceContainerHigh: '#1C1C1C',
  surfaceContainerHighest: '#262626',

  onSurface: '#FFFFFF',
  onSurfaceVariant: '#9E9E9E',
  inverseSurface: '#FFFFFF',
  inverseOnSurface: '#000000',

  primary: '#FFFFFF',
  onPrimary: '#000000',
  primaryContainer: '#262626',
  onPrimaryContainer: '#FFFFFF',
  primaryFixed: '#FFFFFF',
  primaryFixedDim: '#E0E0E0',
  inversePrimary: '#757575',
  surfaceTint: '#FFFFFF',

  secondary: '#CCCCCC',
  onSecondary: '#000000',
  secondaryContainer: '#222222',
  onSecondaryContainer: '#FFFFFF',
  secondaryFixed: '#CCCCCC',
  secondaryFixedDim: '#9E9E9E',

  tertiary: '#E0E0E0',
  onTertiary: '#000000',
  tertiaryContainer: '#2A2A2A',
  onTertiaryContainer: '#FFFFFF',
  tertiaryFixed: '#E0E0E0',
  tertiaryFixedDim: '#BDBDBD',

  error: '#CCCCCC',
  onError: '#000000',
  errorContainer: '#262626',
  onErrorContainer: '#FFFFFF',

  outline: '#444444',
  outlineVariant: '#262626',

  // Red & Green 100% removed: Inflows are crisp white, Outflows are neutral silver
  income: '#FFFFFF',
  expense: '#8C8C8C',
  warning: '#CCCCCC',
  transfer: '#AAAAAA',

  strokeSubtle: 'rgba(255, 255, 255, 0.08)',
  strokeLight: 'rgba(255, 255, 255, 0.12)',
  strokeMedium: 'rgba(255, 255, 255, 0.18)',
  strokeBright: 'rgba(255, 255, 255, 0.30)',

  chartreuse: '#FFFFFF',
  chartreuseGlow: 'rgba(255, 255, 255, 0.15)',
  chartreuseWash: 'rgba(255, 255, 255, 0.08)',
  chartreuseSubtle: 'rgba(255, 255, 255, 0.04)',

  // Pure monochrome grayscale spectrum
  categoryFood: '#FFFFFF',
  categoryShopping: '#E0E0E0',
  categoryTransport: '#CCCCCC',
  categoryEntertainment: '#BDBDBD',
  categoryBills: '#A8A8A8',
  categoryHealth: '#949494',
  categoryEducation: '#808080',
  categoryTravel: '#D4D4D4',
  categoryPersonalCare: '#BFBFBF',
  categorySubscriptions: '#737373',
  categoryGifts: '#EAEAEA',
  categoryOther: '#8C8C8C',
};

// ─── 4. Minimal Ink Light (Pure White & Black — Red/Green Free) ──────────────
export const MonoLightColors: typeof DarkColors = {
  ...LightColors,
  surface: '#FFFFFF',
  surfaceDim: '#F7F7F7',
  surfaceBright: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FAFAFA',
  surfaceContainer: '#F2F2F2',
  surfaceContainerHigh: '#E8E8E8',
  surfaceContainerHighest: '#DCDCDC',

  onSurface: '#000000',
  onSurfaceVariant: '#555555',
  inverseSurface: '#000000',
  inverseOnSurface: '#FFFFFF',

  primary: '#000000',
  onPrimary: '#FFFFFF',
  primaryContainer: '#000000',
  onPrimaryContainer: '#FFFFFF',
  primaryFixed: '#000000',
  primaryFixedDim: '#2B2B2B',
  inversePrimary: '#E0E0E0',
  surfaceTint: '#000000',

  secondary: '#333333',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8E8E8',
  onSecondaryContainer: '#000000',
  secondaryFixed: '#333333',
  secondaryFixedDim: '#555555',

  tertiary: '#555555',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#EEEEEE',
  onTertiaryContainer: '#000000',
  tertiaryFixed: '#444444',
  tertiaryFixedDim: '#666666',

  error: '#222222',
  onError: '#FFFFFF',
  errorContainer: '#EAEAEA',
  onErrorContainer: '#000000',

  outline: '#888888',
  outlineVariant: '#CCCCCC',

  // Red & Green 100% removed: Inflows are bold black, Outflows are muted charcoal
  income: '#000000',
  expense: '#666666',
  warning: '#444444',
  transfer: '#555555',

  strokeSubtle: 'rgba(0, 0, 0, 0.08)',
  strokeLight: 'rgba(0, 0, 0, 0.12)',
  strokeMedium: 'rgba(0, 0, 0, 0.18)',
  strokeBright: 'rgba(0, 0, 0, 0.28)',

  chartreuse: '#000000',
  chartreuseGlow: 'rgba(0, 0, 0, 0.10)',
  chartreuseWash: 'rgba(0, 0, 0, 0.05)',
  chartreuseSubtle: 'rgba(0, 0, 0, 0.02)',

  // Pure ink grayscale spectrum
  categoryFood: '#000000',
  categoryShopping: '#212121',
  categoryTransport: '#333333',
  categoryEntertainment: '#484848',
  categoryBills: '#5C5C5C',
  categoryHealth: '#6B6B6B',
  categoryEducation: '#7D7D7D',
  categoryTravel: '#1A1A1A',
  categoryPersonalCare: '#383838',
  categorySubscriptions: '#8A8A8A',
  categoryGifts: '#282828',
  categoryOther: '#707070',
};

// ─── 5. Emerald Reserve (Swiss Vault & Forest Obsidian) ──────────────────────
export const EmeraldColors: typeof DarkColors = {
  ...DarkColors,
  surface: '#08120C',
  surfaceDim: '#08120C',
  surfaceBright: '#1C2E22',
  surfaceContainerLowest: '#040906',
  surfaceContainerLow: '#0E1C14',
  surfaceContainer: '#13241B',
  surfaceContainerHigh: '#1A3024',
  surfaceContainerHighest: '#243F30',

  onSurface: '#E6F4EA',
  onSurfaceVariant: '#9EB8A5',
  inverseSurface: '#E6F4EA',
  inverseOnSurface: '#13241B',

  primary: '#FFFFFF',
  onPrimary: '#003820',
  primaryContainer: '#10B981',
  onPrimaryContainer: '#002615',
  primaryFixed: '#10B981',
  primaryFixedDim: '#059669',
  inversePrimary: '#047857',
  surfaceTint: '#10B981',

  secondary: '#FCD34D',
  onSecondary: '#3B2900',
  secondaryContainer: '#F59E0B',
  onSecondaryContainer: '#451A03',
  secondaryFixed: '#FCD34D',
  secondaryFixedDim: '#F59E0B',

  tertiary: '#6EE7B7',
  onTertiary: '#003826',
  tertiaryContainer: '#10B981',
  onTertiaryContainer: '#022C1C',
  tertiaryFixed: '#6EE7B7',
  tertiaryFixedDim: '#34D399',

  outline: '#587A64',
  outlineVariant: '#254230',

  income: '#10B981',
  expense: '#F43F5E',
  warning: '#F59E0B',
  transfer: '#34D399',

  strokeSubtle: 'rgba(16, 185, 129, 0.06)',
  strokeLight: 'rgba(16, 185, 129, 0.10)',
  strokeMedium: 'rgba(16, 185, 129, 0.16)',
  strokeBright: 'rgba(16, 185, 129, 0.26)',

  chartreuse: '#10B981',
  chartreuseGlow: 'rgba(16, 185, 129, 0.25)',
  chartreuseWash: 'rgba(16, 185, 129, 0.14)',
  chartreuseSubtle: 'rgba(16, 185, 129, 0.08)',
};

// ─── 6. Cyberpunk Crimson (Neo-Tokyo Pitch Black & Neon Laser) ───────────────
export const CrimsonColors: typeof DarkColors = {
  ...DarkColors,
  surface: '#050508',
  surfaceDim: '#050508',
  surfaceBright: '#242030',
  surfaceContainerLowest: '#020204',
  surfaceContainerLow: '#0F0E17',
  surfaceContainer: '#161421',
  surfaceContainerHigh: '#1E1B2D',
  surfaceContainerHighest: '#28243C',

  onSurface: '#F5F6FA',
  onSurfaceVariant: '#9D9AB5',
  inverseSurface: '#F5F6FA',
  inverseOnSurface: '#161421',

  primary: '#FFFFFF',
  onPrimary: '#4D0014',
  primaryContainer: '#FF2A55',
  onPrimaryContainer: '#2B000B',
  primaryFixed: '#FF2A55',
  primaryFixedDim: '#E01742',
  inversePrimary: '#B30B30',
  surfaceTint: '#FF2A55',

  secondary: '#FF9E00',
  onSecondary: '#3E1F00',
  secondaryContainer: '#FF7A00',
  onSecondaryContainer: '#2E1100',
  secondaryFixed: '#FFAA2B',
  secondaryFixedDim: '#FF7A00',

  tertiary: '#00F0FF',
  onTertiary: '#00383C',
  tertiaryContainer: '#00C8D6',
  onTertiaryContainer: '#002528',
  tertiaryFixed: '#7DF4FF',
  tertiaryFixedDim: '#00E5FF',

  outline: '#7E6C8F',
  outlineVariant: '#393047',

  income: '#00E676',
  expense: '#FF2A55',
  warning: '#FF9E00',
  transfer: '#00F0FF',

  strokeSubtle: 'rgba(255, 42, 85, 0.06)',
  strokeLight: 'rgba(255, 42, 85, 0.10)',
  strokeMedium: 'rgba(255, 42, 85, 0.16)',
  strokeBright: 'rgba(255, 42, 85, 0.28)',

  chartreuse: '#FF2A55',
  chartreuseGlow: 'rgba(255, 42, 85, 0.28)',
  chartreuseWash: 'rgba(255, 42, 85, 0.16)',
  chartreuseSubtle: 'rgba(255, 42, 85, 0.09)',
};

// ─── 7. Desert Dune (Warm Espresso Terracotta & Sand Gold) ───────────────────
export const DuneColors: typeof DarkColors = {
  ...DarkColors,
  surface: '#141210',
  surfaceDim: '#141210',
  surfaceBright: '#302A25',
  surfaceContainerLowest: '#0C0A09',
  surfaceContainerLow: '#1B1814',
  surfaceContainer: '#211D19',
  surfaceContainerHigh: '#2A2520',
  surfaceContainerHighest: '#36302A',

  onSurface: '#F4EFEA',
  onSurfaceVariant: '#B5ABA0',
  inverseSurface: '#F4EFEA',
  inverseOnSurface: '#211D19',

  primary: '#FFFFFF',
  onPrimary: '#3E1C12',
  primaryContainer: '#E07A5F',
  onPrimaryContainer: '#260B04',
  primaryFixed: '#E07A5F',
  primaryFixedDim: '#C8664D',
  inversePrimary: '#A64D36',
  surfaceTint: '#E07A5F',

  secondary: '#E9C46A',
  onSecondary: '#3B2D00',
  secondaryContainer: '#D4A373',
  onSecondaryContainer: '#332007',
  secondaryFixed: '#E9C46A',
  secondaryFixedDim: '#D4A373',

  tertiary: '#81B29A',
  onTertiary: '#122E21',
  tertiaryContainer: '#659880',
  onTertiaryContainer: '#0B2016',
  tertiaryFixed: '#A3CBB7',
  tertiaryFixedDim: '#81B29A',

  outline: '#827467',
  outlineVariant: '#403830',

  income: '#81B29A',
  expense: '#E07A5F',
  warning: '#E9C46A',
  transfer: '#D4A373',

  strokeSubtle: 'rgba(224, 122, 95, 0.06)',
  strokeLight: 'rgba(224, 122, 95, 0.10)',
  strokeMedium: 'rgba(224, 122, 95, 0.16)',
  strokeBright: 'rgba(224, 122, 95, 0.26)',

  chartreuse: '#E07A5F',
  chartreuseGlow: 'rgba(224, 122, 95, 0.25)',
  chartreuseWash: 'rgba(224, 122, 95, 0.14)',
  chartreuseSubtle: 'rgba(224, 122, 95, 0.08)',
};

// ─── 8. Sunset Mirage (Twilight Obsidian & Sunset Coral) ─────────────────────
export const SunsetColors: typeof DarkColors = {
  ...DarkColors,
  surface: '#0D0B18',
  surfaceDim: '#0D0B18',
  surfaceBright: '#292242',
  surfaceContainerLowest: '#07060E',
  surfaceContainerLow: '#151125',
  surfaceContainer: '#1C1731',
  surfaceContainerHigh: '#241E3F',
  surfaceContainerHighest: '#2F2751',

  onSurface: '#FDF0ED',
  onSurfaceVariant: '#B5A6C4',
  inverseSurface: '#FDF0ED',
  inverseOnSurface: '#1C1731',

  primary: '#FFFFFF',
  onPrimary: '#440F15',
  primaryContainer: '#FF6B6B',
  onPrimaryContainer: '#2B0509',
  primaryFixed: '#FF6B6B',
  primaryFixedDim: '#E65252',
  inversePrimary: '#C93636',
  surfaceTint: '#FF6B6B',

  secondary: '#FFBE0B',
  onSecondary: '#3D2A00',
  secondaryContainer: '#FB5607',
  onSecondaryContainer: '#3B0F00',
  secondaryFixed: '#FFD166',
  secondaryFixedDim: '#FFBE0B',

  tertiary: '#8338EC',
  onTertiary: '#1F004D',
  tertiaryContainer: '#6E1EDB',
  onTertiaryContainer: '#130030',
  tertiaryFixed: '#A663F7',
  tertiaryFixedDim: '#8338EC',

  outline: '#7E6E94',
  outlineVariant: '#3C334A',

  income: '#06D6A0',
  expense: '#FF6B6B',
  warning: '#FFBE0B',
  transfer: '#8338EC',

  strokeSubtle: 'rgba(255, 107, 107, 0.06)',
  strokeLight: 'rgba(255, 107, 107, 0.10)',
  strokeMedium: 'rgba(255, 107, 107, 0.16)',
  strokeBright: 'rgba(255, 107, 107, 0.28)',

  chartreuse: '#FF6B6B',
  chartreuseGlow: 'rgba(255, 107, 107, 0.26)',
  chartreuseWash: 'rgba(255, 107, 107, 0.15)',
  chartreuseSubtle: 'rgba(255, 107, 107, 0.08)',
};

// ─── 9. Sovereign Gold (Imperial Regal Navy & 24k Gold) ──────────────────────
export const GoldColors: typeof DarkColors = {
  ...DarkColors,
  surface: '#080C16',
  surfaceDim: '#080C16',
  surfaceBright: '#202C45',
  surfaceContainerLowest: '#04070E',
  surfaceContainerLow: '#0E1525',
  surfaceContainer: '#141D30',
  surfaceContainerHigh: '#1B2740',
  surfaceContainerHighest: '#253554',

  onSurface: '#F7F4EA',
  onSurfaceVariant: '#9BA8BD',
  inverseSurface: '#F7F4EA',
  inverseOnSurface: '#141D30',

  primary: '#FFFFFF',
  onPrimary: '#3A2C00',
  primaryContainer: '#F5C518',
  onPrimaryContainer: '#241B00',
  primaryFixed: '#F5C518',
  primaryFixedDim: '#DDAA00',
  inversePrimary: '#B58800',
  surfaceTint: '#F5C518',

  secondary: '#38BDF8',
  onSecondary: '#002E44',
  secondaryContainer: '#0284C7',
  onSecondaryContainer: '#001A29',
  secondaryFixed: '#7DD3FC',
  secondaryFixedDim: '#38BDF8',

  tertiary: '#FDE047',
  onTertiary: '#3A3200',
  tertiaryContainer: '#EAB308',
  onTertiaryContainer: '#262000',
  tertiaryFixed: '#FEF08A',
  tertiaryFixedDim: '#FDE047',

  outline: '#6D7C94',
  outlineVariant: '#313C4E',

  income: '#10B981',
  expense: '#EF4444',
  warning: '#F59E0B',
  transfer: '#38BDF8',

  strokeSubtle: 'rgba(245, 197, 24, 0.06)',
  strokeLight: 'rgba(245, 197, 24, 0.10)',
  strokeMedium: 'rgba(245, 197, 24, 0.16)',
  strokeBright: 'rgba(245, 197, 24, 0.28)',

  chartreuse: '#F5C518',
  chartreuseGlow: 'rgba(245, 197, 24, 0.25)',
  chartreuseWash: 'rgba(245, 197, 24, 0.15)',
  chartreuseSubtle: 'rgba(245, 197, 24, 0.08)',
};

// ─── 10. Midnight Amethyst (Obsidian Plum & Vivid Violet) ─────────────────────
export const AmethystColors: typeof DarkColors = {
  ...DarkColors,
  surface: '#0D0B14',
  surfaceDim: '#0D0B14',
  surfaceBright: '#302A42',
  surfaceContainerLowest: '#08060D',
  surfaceContainerLow: '#161322',
  surfaceContainer: '#1D192C',
  surfaceContainerHigh: '#28233C',
  surfaceContainerHighest: '#342E4E',

  onSurface: '#F3E8FF',
  onSurfaceVariant: '#A89EC2',
  inverseSurface: '#F3E8FF',
  inverseOnSurface: '#1D192C',

  primary: '#FFFFFF',
  onPrimary: '#2D0052',
  primaryContainer: '#A855F7',
  onPrimaryContainer: '#3B0764',
  primaryFixed: '#A855F7',
  primaryFixedDim: '#9333EA',
  inversePrimary: '#7E22CE',
  surfaceTint: '#A855F7',

  secondary: '#E0AAFF',
  onSecondary: '#37005B',
  secondaryContainer: '#C084FC',
  onSecondaryContainer: '#581C87',
  secondaryFixed: '#E0AAFF',
  secondaryFixedDim: '#D8B4FE',

  tertiary: '#F0ABFC',
  onTertiary: '#4A044E',
  tertiaryContainer: '#E879F9',
  onTertiaryContainer: '#701A75',
  tertiaryFixed: '#F0ABFC',
  tertiaryFixedDim: '#E879F9',

  chartreuse: '#A855F7',
  chartreuseGlow: 'rgba(168, 85, 247, 0.25)',
  chartreuseWash: 'rgba(168, 85, 247, 0.15)',
  chartreuseSubtle: 'rgba(168, 85, 247, 0.10)',

  outline: '#8B7B9E',
  outlineVariant: '#433756',
  strokeSubtle: 'rgba(168, 85, 247, 0.08)',
  strokeLight: 'rgba(168, 85, 247, 0.12)',
  strokeMedium: 'rgba(168, 85, 247, 0.18)',
  strokeBright: 'rgba(168, 85, 247, 0.28)',
};

// ─── 11. Sapphire Horizon (Abyssal Navy & Electric Cyan) ─────────────────────
export const SapphireColors: typeof DarkColors = {
  ...DarkColors,
  surface: '#080D1A',
  surfaceDim: '#080D1A',
  surfaceBright: '#203152',
  surfaceContainerLowest: '#050812',
  surfaceContainerLow: '#0E172B',
  surfaceContainer: '#13203A',
  surfaceContainerHigh: '#1C2E52',
  surfaceContainerHighest: '#273E6D',

  onSurface: '#E0F2FE',
  onSurfaceVariant: '#8BA3C7',
  inverseSurface: '#E0F2FE',
  inverseOnSurface: '#13203A',

  primary: '#FFFFFF',
  onPrimary: '#00293D',
  primaryContainer: '#00D2FF',
  onPrimaryContainer: '#003B57',
  primaryFixed: '#00D2FF',
  primaryFixedDim: '#00B4D8',
  inversePrimary: '#0284C7',
  surfaceTint: '#00D2FF',

  secondary: '#60A5FA',
  onSecondary: '#082F49',
  secondaryContainer: '#38BDF8',
  onSecondaryContainer: '#075985',
  secondaryFixed: '#60A5FA',
  secondaryFixedDim: '#38BDF8',

  tertiary: '#93C5FD',
  onTertiary: '#1E3A8A',
  tertiaryContainer: '#60A5FA',
  onTertiaryContainer: '#1D4ED8',
  tertiaryFixed: '#93C5FD',
  tertiaryFixedDim: '#60A5FA',

  chartreuse: '#00D2FF',
  chartreuseGlow: 'rgba(0, 210, 255, 0.22)',
  chartreuseWash: 'rgba(0, 210, 255, 0.14)',
  chartreuseSubtle: 'rgba(0, 210, 255, 0.08)',

  outline: '#647D9E',
  outlineVariant: '#2A4363',
  strokeSubtle: 'rgba(0, 210, 255, 0.06)',
  strokeLight: 'rgba(0, 210, 255, 0.10)',
  strokeMedium: 'rgba(0, 210, 255, 0.16)',
  strokeBright: 'rgba(0, 210, 255, 0.26)',
};

// ─── Theme Mode Identification ───────────────────────────────────────────────
export type ThemeMode =
  | 'dark'
  | 'light'
  | 'mono_dark'
  | 'mono_light'
  | 'emerald'
  | 'crimson'
  | 'dune'
  | 'sunset'
  | 'gold'
  | 'amethyst'
  | 'sapphire';

export const VALID_THEMES: readonly ThemeMode[] = [
  'dark',
  'light',
  'mono_dark',
  'mono_light',
  'emerald',
  'crimson',
  'dune',
  'sunset',
  'gold',
  'amethyst',
  'sapphire',
] as const;

export function isValidTheme(val: any): val is ThemeMode {
  return typeof val === 'string' && (VALID_THEMES as readonly string[]).includes(val);
}

export function getThemePalette(mode: ThemeMode) {
  switch (mode) {
    case 'light':
      return LightColors;
    case 'mono_dark':
      return MonoDarkColors;
    case 'mono_light':
      return MonoLightColors;
    case 'emerald':
      return EmeraldColors;
    case 'crimson':
      return CrimsonColors;
    case 'dune':
      return DuneColors;
    case 'sunset':
      return SunsetColors;
    case 'gold':
      return GoldColors;
    case 'amethyst':
      return AmethystColors;
    case 'sapphire':
      return SapphireColors;
    case 'dark':
    default:
      return DarkColors;
  }
}

// Check stored theme synchronously at module load
export function getInitialTheme(): ThemeMode {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('mywallet_theme_mode');
      if (isValidTheme(saved)) return saved;
      if (saved === 'system' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    }
  } else {
    // 1. Check Android NativeModules synchronously (from SharedPreferences)
    try {
      if (NativeModules.AppTheme?.getTheme) {
        const nativeTheme = NativeModules.AppTheme.getTheme();
        if (isValidTheme(nativeTheme)) return nativeTheme;
      }
    } catch {
      // ignore
    }

    // 2. Fallback check from SQLite database
    try {
      const { getDatabase } = require('../db/client');
      const db = getDatabase();
      const row = db.getFirstSync("SELECT value FROM user_settings WHERE key = 'theme_mode';");
      if (isValidTheme(row?.value)) return row.value;
    } catch {
      // fallback
    }
  }
  return 'dark';
}

export const activeTheme: ThemeMode = getInitialTheme();

/**
 * Design system color tokens for the active theme.
 */
export const Colors = {
  ...getThemePalette(activeTheme),
};

export type ColorToken = keyof typeof DarkColors;
