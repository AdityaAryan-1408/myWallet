/**
 * MyWallet — Living Ambient Particle Engine (v2.0)
 * 
 * 100% Native UI-Thread Reanimated Worklet Engine:
 * - 15 subtle micro-particles drifting in organic sinusoidal trajectories.
 * - Dynamic color tokens matching active theme (Chartreuse, Emerald, Amethyst, Sapphire).
 * - Soft opacities (0.06 - 0.35) creating a luxurious, living cockpit depth.
 * - Zero JS thread blocking, 60/120 FPS native execution.
 * - Respects the user's Ambient Particle Motion preference in Settings.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/theme';
import { useThemeStore } from '@/stores';

interface ParticleSpec {
  id: number;
  leftPercent: number;  // 0 - 100%
  topPercent: number;   // 0 - 100%
  size: number;         // 2.5 - 4.5 dp
  minOpacity: number;
  maxOpacity: number;
  deltaX: number;
  deltaY: number;
  durationMs: number;
  delayMs: number;
}

// 15 curated particle seeds for harmonious distribution
const PARTICLES: ParticleSpec[] = [
  { id: 1, leftPercent: 8, topPercent: 22, size: 3.0, minOpacity: 0.08, maxOpacity: 0.28, deltaX: 14, deltaY: -16, durationMs: 4200, delayMs: 0 },
  { id: 2, leftPercent: 22, topPercent: 78, size: 2.5, minOpacity: 0.06, maxOpacity: 0.24, deltaX: -12, deltaY: 14, durationMs: 4800, delayMs: 400 },
  { id: 3, leftPercent: 35, topPercent: 18, size: 4.0, minOpacity: 0.10, maxOpacity: 0.35, deltaX: 18, deltaY: 12, durationMs: 5200, delayMs: 800 },
  { id: 4, leftPercent: 48, topPercent: 62, size: 2.5, minOpacity: 0.06, maxOpacity: 0.20, deltaX: -10, deltaY: -18, durationMs: 3900, delayMs: 200 },
  { id: 5, leftPercent: 62, topPercent: 28, size: 3.5, minOpacity: 0.08, maxOpacity: 0.30, deltaX: 12, deltaY: -10, durationMs: 4600, delayMs: 600 },
  { id: 6, leftPercent: 75, topPercent: 72, size: 3.0, minOpacity: 0.07, maxOpacity: 0.26, deltaX: -16, deltaY: 15, durationMs: 5100, delayMs: 1000 },
  { id: 7, leftPercent: 88, topPercent: 35, size: 4.2, minOpacity: 0.12, maxOpacity: 0.36, deltaX: -14, deltaY: -14, durationMs: 4400, delayMs: 300 },
  { id: 8, leftPercent: 92, topPercent: 82, size: 2.5, minOpacity: 0.05, maxOpacity: 0.22, deltaX: 10, deltaY: -12, durationMs: 4900, delayMs: 700 },
  { id: 9, leftPercent: 15, topPercent: 50, size: 3.2, minOpacity: 0.07, maxOpacity: 0.25, deltaX: 15, deltaY: 16, durationMs: 4300, delayMs: 500 },
  { id: 10, leftPercent: 42, topPercent: 88, size: 2.8, minOpacity: 0.06, maxOpacity: 0.22, deltaX: -12, deltaY: -10, durationMs: 5400, delayMs: 900 },
  { id: 11, leftPercent: 68, topPercent: 12, size: 3.8, minOpacity: 0.09, maxOpacity: 0.32, deltaX: -15, deltaY: 18, durationMs: 4700, delayMs: 150 },
  { id: 12, leftPercent: 82, topPercent: 55, size: 2.6, minOpacity: 0.06, maxOpacity: 0.24, deltaX: 14, deltaY: -14, durationMs: 4100, delayMs: 850 },
  { id: 13, leftPercent: 28, topPercent: 42, size: 3.2, minOpacity: 0.08, maxOpacity: 0.28, deltaX: 13, deltaY: -12, durationMs: 4500, delayMs: 450 },
  { id: 14, leftPercent: 52, topPercent: 15, size: 2.8, minOpacity: 0.07, maxOpacity: 0.26, deltaX: -14, deltaY: 10, durationMs: 5000, delayMs: 750 },
  { id: 15, leftPercent: 58, topPercent: 82, size: 3.4, minOpacity: 0.08, maxOpacity: 0.30, deltaX: 11, deltaY: -15, durationMs: 4600, delayMs: 350 },
];

function SingleParticle({
  spec,
  particleColor,
  enabled,
}: {
  spec: ParticleSpec;
  particleColor: string;
  enabled: boolean;
}) {
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);
  const opacity = useSharedValue(enabled ? spec.minOpacity : 0);

  useEffect(() => {
    if (!enabled) {
      opacity.value = withTiming(0, { duration: 400 });
      return;
    }

    // Start sinusoidal floating animations on native UI thread
    transX.value = withSequence(
      withTiming(0, { duration: spec.delayMs }),
      withRepeat(
        withSequence(
          withTiming(spec.deltaX, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-spec.deltaX * 0.7, {
            duration: spec.durationMs * 1.1,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    transY.value = withSequence(
      withTiming(0, { duration: spec.delayMs }),
      withRepeat(
        withSequence(
          withTiming(spec.deltaY, {
            duration: spec.durationMs * 0.9,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-spec.deltaY * 0.6, {
            duration: spec.durationMs * 1.15,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    opacity.value = withSequence(
      withTiming(spec.minOpacity, { duration: spec.delayMs }),
      withRepeat(
        withSequence(
          withTiming(spec.maxOpacity, {
            duration: spec.durationMs * 0.7,
            easing: Easing.inOut(Easing.quad),
          }),
          withTiming(spec.minOpacity, {
            duration: spec.durationMs * 0.8,
            easing: Easing.inOut(Easing.quad),
          })
        ),
        -1,
        true
      )
    );
  }, [enabled, spec]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: transX.value },
      { translateY: transY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${spec.leftPercent}%`,
          top: `${spec.topPercent}%`,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: particleColor,
          shadowColor: particleColor,
        },
        animStyle,
      ]}
    />
  );
}

interface AmbientParticleFieldProps {
  color?: string;
  enabled?: boolean;
}

export function AmbientParticleField({ color, enabled }: AmbientParticleFieldProps) {
  const storeEnabled = useThemeStore((s) => s.ambientParticlesEnabled);
  const isEnabled = enabled !== undefined ? enabled : storeEnabled;
  const particleColor = color || Colors.chartreuse;

  if (!isEnabled) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((spec) => (
        <SingleParticle
          key={spec.id}
          spec={spec}
          particleColor={particleColor}
          enabled={isEnabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 1,
  },
});
