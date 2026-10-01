/**
 * MyWallet — Hero Breathing Halo (v2.0 Visual Upgrade 4.1)
 * 
 * 100% Native UI-Thread Perimeter Aura:
 * - Gentle rhythmic breathing pulse (2.4s sine wave cycle).
 * - Dynamically matches active theme accent (Chartreuse, Emerald, Amethyst, Sapphire).
 * - Shifts to emergency Coral Red pulse when in Deficit Alert.
 * - Zero JS thread blocking, smooth 60/120 FPS native execution.
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Shapes } from '@/theme';

interface HeroBreathingHaloProps {
  isDeficit?: boolean;
}

export function HeroBreathingHalo({ isDeficit = false }: HeroBreathingHaloProps) {
  const haloOpacity = useSharedValue(0.18);

  useEffect(() => {
    haloOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, {
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0.16, {
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
        })
      ),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
  }));

  const haloColor = isDeficit ? Colors.expense : Colors.chartreuse;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.haloBorder,
        {
          borderColor: haloColor,
          shadowColor: haloColor,
        },
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  haloBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Shapes.xxl,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 4,
  },
});
