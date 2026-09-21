/**
 * MyWallet — Spacing System
 * 
 * Based on an 8-point vertical cadence grid.
 * Mobile-first with adaptive tokens for tablet/desktop.
 */

export const Spacing = {
  /** 2px — Hairline adjustments */
  xxxs: 2,
  /** 4px — Micro spacing (icon gaps, badge padding) */
  xxs: 4,
  /** 6px — Small internal gaps */
  xs: 6,
  /** 8px — Standard small spacing */
  sm: 8,
  /** 12px — Medium-small spacing */
  md: 12,
  /** 16px — Standard spacing (gutter, margin, padding) */
  lg: 16,
  /** 20px — Medium-large spacing */
  xl: 20,
  /** 24px — Large spacing (card internal padding for hero sections) */
  xxl: 24,
  /** 32px — Extra large */
  xxxl: 32,
  /** 48px — Section separation */
  section: 48,
  /** 64px — Major section separation */
  sectionLg: 64,

  // Semantic aliases for common use cases
  /** Card internal padding (standard) — 16px */
  cardPadding: 16,
  /** Card internal padding (hero/prominent sections) — 24px */
  cardPaddingLg: 24,
  /** Gap between stacked cards — 12px */
  cardGap: 12,
  /** Screen horizontal padding — 16px */
  screenPadding: 16,
  /** Bottom tab bar height — 80dp (Android M3 spec) */
  bottomTabHeight: 80,
  /** FAB size — 56dp */
  fabSize: 56,
  /** FAB margin from edge — 16dp */
  fabMargin: 16,
} as const;

export type SpacingToken = keyof typeof Spacing;
