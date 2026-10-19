/**
 * MyWallet — Dynamic Hero Health Gradient (A3)
 *
 * Real-time dynamic SVG gradient background for the dashboard hero card:
 * - 🟢 Healthy (>60% budget): Calm emerald-to-teal oceanic gradient (#064E3B -> #0D9488)
 * - 🟡 Caution (30–60% budget): Warm amber-to-gold gradient (#78350F -> #D97706)
 * - 🔴 Critical (<30% or overspent): Deep crimson with native 60 FPS breathing pulse (#7F1D1D -> #DC2626)
 *
 * Native vector rendering via react-native-svg & Reanimated UI-thread animations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { FinancialHealthTier } from '@/domain/financialCalculations';
import { Shapes } from '@/theme';

interface DynamicHeroHealthGradientProps {
  healthTier: FinancialHealthTier;
  borderRadius?: number;
  isLight?: boolean;
}

interface TierGradientConfig {
  linearStart: string;
  linearMid: string;
  linearEnd: string;
  linearStartOpacity: number;
  linearMidOpacity: number;
  linearEndOpacity: number;
  radialColor: string;
  radialOpacity: number;
  specularColor: string;
  specularOpacity: number;
}

const TIER_CONFIGS_DARK: Record<FinancialHealthTier, TierGradientConfig> = {
  healthy: {
    linearStart: '#042F2E',
    linearMid: '#064E3B',
    linearEnd: '#021C16',
    linearStartOpacity: 0.65,
    linearMidOpacity: 0.45,
    linearEndOpacity: 0.20,
    radialColor: '#10B981',
    radialOpacity: 0.22,
    specularColor: '#34D399',
    specularOpacity: 0.28,
  },
  caution: {
    linearStart: '#451A03',
    linearMid: '#78350F',
    linearEnd: '#1A0A02',
    linearStartOpacity: 0.70,
    linearMidOpacity: 0.50,
    linearEndOpacity: 0.25,
    radialColor: '#F59E0B',
    radialOpacity: 0.24,
    specularColor: '#FBBF24',
    specularOpacity: 0.32,
  },
  critical: {
    linearStart: '#4C0519',
    linearMid: '#7F1D1D',
    linearEnd: '#1F040A',
    linearStartOpacity: 0.75,
    linearMidOpacity: 0.58,
    linearEndOpacity: 0.30,
    radialColor: '#EF4444',
    radialOpacity: 0.35,
    specularColor: '#F87171',
    specularOpacity: 0.38,
  },
};

const TIER_CONFIGS_LIGHT: Record<FinancialHealthTier, TierGradientConfig> = {
  healthy: {
    linearStart: '#A7F3D0',
    linearMid: '#D1FAE5',
    linearEnd: '#F0FDF4',
    linearStartOpacity: 0.85,
    linearMidOpacity: 0.60,
    linearEndOpacity: 0.25,
    radialColor: '#059669',
    radialOpacity: 0.18,
    specularColor: '#10B981',
    specularOpacity: 0.22,
  },
  caution: {
    linearStart: '#FDE68A',
    linearMid: '#FEF3C7',
    linearEnd: '#FFFBEB',
    linearStartOpacity: 0.85,
    linearMidOpacity: 0.60,
    linearEndOpacity: 0.25,
    radialColor: '#D97706',
    radialOpacity: 0.18,
    specularColor: '#F59E0B',
    specularOpacity: 0.22,
  },
  critical: {
    linearStart: '#FECDD3',
    linearMid: '#FFE4E6',
    linearEnd: '#FFF1F2',
    linearStartOpacity: 0.88,
    linearMidOpacity: 0.62,
    linearEndOpacity: 0.25,
    radialColor: '#E11D48',
    radialOpacity: 0.20,
    specularColor: '#EF4444',
    specularOpacity: 0.24,
  },
};

export function DynamicHeroHealthGradient({
  healthTier,
  borderRadius = Shapes.xxl,
  isLight = false,
}: DynamicHeroHealthGradientProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  // Unique IDs for SVG gradients to prevent clash
  const gradPrefix = useMemo(
    () => `hero_health_${Math.random().toString(36).substring(2, 8)}`,
    []
  );

  // Breathing pulse shared value for Critical tier
  const pulseOpacity = useSharedValue(0.35);

  useEffect(() => {
    if (healthTier === 'critical') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.85, {
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0.30, {
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );
    } else {
      pulseOpacity.value = withTiming(0.35, { duration: 350 });
    }
  }, [healthTier, pulseOpacity]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      if (!size || Math.abs(size.width - width) > 1 || Math.abs(size.height - height) > 1) {
        setSize({ width, height });
      }
    }
  };

  const configs = isLight ? TIER_CONFIGS_LIGHT : TIER_CONFIGS_DARK;
  const config = configs[healthTier] ?? configs.healthy;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={handleLayout}>
      {size && size.width > 0 && size.height > 0 && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Primary Diagonal Gradient */}
            <LinearGradient
              id={`${gradPrefix}_linear`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop
                offset="0%"
                stopColor={config.linearStart}
                stopOpacity={config.linearStartOpacity}
              />
              <Stop
                offset="38%"
                stopColor={config.linearMid}
                stopOpacity={config.linearMidOpacity}
              />
              <Stop
                offset="80%"
                stopColor={config.linearEnd}
                stopOpacity={config.linearEndOpacity}
              />
              <Stop offset="100%" stopColor={isLight ? '#FFFFFF' : '#0B0D11'} stopOpacity={0.0} />
            </LinearGradient>

            {/* Ambient Corner Glow Radial */}
            <RadialGradient
              id={`${gradPrefix}_radial`}
              cx="82%"
              cy="18%"
              rx="65%"
              ry="65%"
              fx="82%"
              fy="18%"
            >
              <Stop
                offset="0%"
                stopColor={config.radialColor}
                stopOpacity={config.radialOpacity}
              />
              <Stop
                offset="45%"
                stopColor={config.radialColor}
                stopOpacity={config.radialOpacity * 0.45}
              />
              <Stop offset="100%" stopColor={config.radialColor} stopOpacity={0.0} />
            </RadialGradient>
          </Defs>

          {/* 1. Diagonal Atmosphere */}
          <Rect
            x="0"
            y="0"
            width={size.width}
            height={size.height}
            fill={`url(#${gradPrefix}_linear)`}
            rx={borderRadius}
          />

          {/* 2. Ambient Corner Light Orb */}
          <Rect
            x="0"
            y="0"
            width={size.width}
            height={size.height}
            fill={`url(#${gradPrefix}_radial)`}
            rx={borderRadius}
          />
        </Svg>
      )}

      {/* 4. Critical Tier Breathing Pulse Glow Overlay */}
      {healthTier === 'critical' && size && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius,
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
            },
            animatedPulseStyle,
          ]}
        />
      )}
    </View>
  );
}
