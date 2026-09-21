/**
 * MyWallet — Shape / Corner Radius System
 * 
 * M3 shape geometry configured at roundness level 2.
 * Standard structural radii + hyper-curved interactive elements.
 */

export const Shapes = {
  /** 4px — Small elements, inner tokens */
  sm: 4,
  /** 8px — Standard surfaces */
  md: 8,
  /** 12px — Slightly elevated cards */
  lg: 12,
  /** 16px — Transaction tiles, bottom sheets, standard cards */
  xl: 16,
  /** 24px — Hero containers (Available to Spend card) */
  xxl: 24,
  /** 28px — Dialogs, critical overlays (Android 14+ modal spec) */
  dialog: 28,
  /** 9999px — Full pill (buttons, filter pills, FAB, form inputs) */
  pill: 9999,
} as const;

export type ShapeToken = keyof typeof Shapes;
