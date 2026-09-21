/**
 * MyWallet — Typography System
 * 
 * Pairs Plus Jakarta Sans (structural prose, headlines) with
 * JetBrains Mono (all monetary values, balances, timestamps).
 * 
 * Typography tokens match the Zenith Obsidian DESIGN.md specification.
 */

import { Platform, TextStyle } from 'react-native';

// Font family constants — these map to the loaded font names
export const FontFamily = {
  heading: 'PlusJakartaSans',
  headingBold: 'PlusJakartaSans-Bold',
  headingExtraBold: 'PlusJakartaSans-ExtraBold',
  headingSemiBold: 'PlusJakartaSans-SemiBold',
  headingMedium: 'PlusJakartaSans-Medium',
  body: 'PlusJakartaSans',
  numeric: 'JetBrainsMono',
  numericMedium: 'JetBrainsMono-Medium',
  numericSemiBold: 'JetBrainsMono-SemiBold',
  numericBold: 'JetBrainsMono-Bold',
} as const;

// Pre-defined text style tokens
export const Typography = {
  // ─── Display ────────────────────────────────────────────────────
  displayLg: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -0.03 * 56,
  } as TextStyle,

  displayLgMobile: {
    fontFamily: FontFamily.headingExtraBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.02 * 40,
  } as TextStyle,

  // ─── Headlines ──────────────────────────────────────────────────
  headlineLg: {
    fontFamily: FontFamily.headingBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.02 * 32,
  } as TextStyle,

  headlineMd: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.015 * 26,
  } as TextStyle,

  headlineSm: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.01 * 20,
  } as TextStyle,

  // ─── Body ───────────────────────────────────────────────────────
  bodyLg: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  bodyMd: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.01 * 14,
  } as TextStyle,

  bodySm: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.015 * 12,
  } as TextStyle,

  // ─── Numeric Labels (JetBrains Mono — tabular figures) ──────────
  numericLg: {
    fontFamily: FontFamily.numericSemiBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.02 * 28,
    fontVariant: ['tabular-nums' as const],
  } as TextStyle,

  numericMd: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0,
    fontVariant: ['tabular-nums' as const],
  } as TextStyle,

  numericSm: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.02 * 12,
    fontVariant: ['tabular-nums' as const],
  } as TextStyle,

  // ─── Label Caps (uppercase metadata, category badges) ──────────
  labelCaps: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.08 * 11,
    textTransform: 'uppercase' as const,
  } as TextStyle,

  // ─── Utility combinations ──────────────────────────────────────
  bodyMdMedium: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.01 * 14,
  } as TextStyle,

  bodySmMedium: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.015 * 12,
  } as TextStyle,
} as const;

export type TypographyToken = keyof typeof Typography;
