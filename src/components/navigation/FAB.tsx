/**
 * MyWallet — Floating Action Button
 * 
 * 56dp chartreuse circle with obsidian "+" icon.
 * Positioned bottom-right, above the navigation bar.
 * Features press scale compression and ambient glow.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { Colors, Spacing } from '@/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface FABProps {
  onPress: () => void;
  bottomOffset?: number;
}

export function FAB({ onPress, bottomOffset = 90 }: FABProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[
        styles.fab,
        animatedStyle,
        { bottom: bottomOffset },
      ]}
    >
      <View style={styles.glow} />
      <Plus size={26} color={Colors.onPrimary} strokeWidth={2.8} />
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.fabMargin,
    width: Spacing.fabSize,
    height: Spacing.fabSize,
    borderRadius: Spacing.fabSize / 2,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    // Shadow for ambient glow effect
    shadowColor: Colors.chartreuse,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Spacing.fabSize / 2,
    backgroundColor: 'transparent',
  },
});
