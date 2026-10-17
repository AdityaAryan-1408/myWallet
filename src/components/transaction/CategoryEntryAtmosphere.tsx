/**
 * MyWallet — Category-Specific Transaction Entry Skin (A5)
 *
 * Casts a subtle, luxurious atmospheric mood wash behind the Add Transaction screen:
 * - Dynamically shifts color when a category is selected (e.g. Food -> Coral/Amber,
 *   Entertainment -> Violet, Shopping -> Gold, Transport -> Emerald/Teal).
 * - Multi-layer cross-fader using Reanimated UI-thread timing for 100% flicker-free transitions.
 * - Deep Zenith Obsidian dark mode is fully preserved (contrast & readability untouched).
 * - Zero touch blocking (pointerEvents="none").
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface CategoryEntryAtmosphereProps {
  color: string;
}

interface LayerState {
  color: string;
  id: string;
}

export function CategoryEntryAtmosphere({ color }: CategoryEntryAtmosphereProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  // Maintain dual layers for smooth cross-fading
  const [layerA, setLayerA] = useState<LayerState>({
    color: color || '#FF6B6B',
    id: `atm_a_${Math.random().toString(36).substring(2, 7)}`,
  });
  const [layerB, setLayerB] = useState<LayerState>({
    color: color || '#FF6B6B',
    id: `atm_b_${Math.random().toString(36).substring(2, 7)}`,
  });

  // Track which layer is currently active (0 = A, 1 = B)
  const activeLayer = useRef<0 | 1>(0);
  const opacityA = useSharedValue(1);
  const opacityB = useSharedValue(0);

  const prevColorRef = useRef(color);

  useEffect(() => {
    if (color === prevColorRef.current) return;
    prevColorRef.current = color;

    // Cross-fade between layers
    if (activeLayer.current === 0) {
      // Transition from Layer A to Layer B
      setLayerB({
        color,
        id: `atm_b_${Math.random().toString(36).substring(2, 7)}`,
      });
      activeLayer.current = 1;
      opacityA.value = withTiming(0, { duration: 340, easing: Easing.inOut(Easing.ease) });
      opacityB.value = withTiming(1, { duration: 340, easing: Easing.inOut(Easing.ease) });
    } else {
      // Transition from Layer B to Layer A
      setLayerA({
        color,
        id: `atm_a_${Math.random().toString(36).substring(2, 7)}`,
      });
      activeLayer.current = 0;
      opacityB.value = withTiming(0, { duration: 340, easing: Easing.inOut(Easing.ease) });
      opacityA.value = withTiming(1, { duration: 340, easing: Easing.inOut(Easing.ease) });
    }
  }, [color, opacityA, opacityB]);

  const styleA = useAnimatedStyle(() => ({
    opacity: opacityA.value,
  }));

  const styleB = useAnimatedStyle(() => ({
    opacity: opacityB.value,
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      if (!size || Math.abs(size.width - width) > 1 || Math.abs(size.height - height) > 1) {
        setSize({ width, height });
      }
    }
  };

  const renderAtmosphereSvg = (layer: LayerState) => {
    if (!size || size.width <= 0 || size.height <= 0) return null;
    const { width, height } = size;

    return (
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Upper Radial Bloom centered behind amount card & category button */}
          <RadialGradient
            id={`${layer.id}_radial`}
            cx="50%"
            cy="20%"
            rx="85%"
            ry="48%"
          >
            <Stop offset="0%" stopColor={layer.color} stopOpacity={0.16} />
            <Stop offset="45%" stopColor={layer.color} stopOpacity={0.06} />
            <Stop offset="85%" stopColor={layer.color} stopOpacity={0.0} />
          </RadialGradient>

          {/* Subtle Diagonal Mood Wash across entire canvas */}
          <LinearGradient
            id={`${layer.id}_linear`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="85%"
          >
            <Stop offset="0%" stopColor={layer.color} stopOpacity={0.08} />
            <Stop offset="55%" stopColor={layer.color} stopOpacity={0.02} />
            <Stop offset="100%" stopColor="#101319" stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {/* Diagonal Wash */}
        <Rect x="0" y="0" width={width} height={height} fill={`url(#${layer.id}_linear)`} />

        {/* Radial Atmosphere Bloom */}
        <Rect x="0" y="0" width={width} height={height} fill={`url(#${layer.id}_radial)`} />
      </Svg>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={handleLayout}>
      {/* Layer A */}
      <Animated.View style={[StyleSheet.absoluteFill, styleA]} pointerEvents="none">
        {renderAtmosphereSvg(layerA)}
      </Animated.View>

      {/* Layer B */}
      <Animated.View style={[StyleSheet.absoluteFill, styleB]} pointerEvents="none">
        {renderAtmosphereSvg(layerB)}
      </Animated.View>
    </View>
  );
}
