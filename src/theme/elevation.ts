/**
 * MyWallet — Elevation / Shadow System
 * 
 * Dark-mode finance uses Tonal Layer Stacking + Hairline Surface Demarcations
 * instead of traditional drop shadows. Shadows are used sparingly for depth.
 */

import { ViewStyle, Platform } from 'react-native';
import { Colors } from './colors';

/**
 * Elevation level definitions:
 * - Level 0: Canvas base. No elevation.
 * - Level 1: Transaction groupings, budget groups.
 * - Level 2: Active cards, balance tiles, chart containers.
 * - Level 3: Interactive modals, FABs.
 * - Level 4: Sticky top bars, navigation (handled separately).
 */
export const Elevation = {
  /** Level 0 — Flat on canvas */
  none: {
    ...Platform.select({
      ios: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  } as ViewStyle,

  /** Level 1 — Subtle depth for grouped containers */
  low: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  } as ViewStyle,

  /** Level 2 — Cards and panels */
  medium: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  } as ViewStyle,

  /** Level 3 — Hero card, modals, FAB */
  high: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
      },
      android: {
        elevation: 8,
      },
    }),
  } as ViewStyle,
} as const;
