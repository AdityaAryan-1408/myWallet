/**
 * MyWallet — Directional Specular Glass Highlight (v2.0 Visual Upgrade 4.1)
 * 
 * Simulates directional overhead lighting on frosted glass surfaces:
 * - Top-left hairline catches a crisp white/accent specular glint.
 * - Fades smoothly down the sides to 0% opacity at bottom-right.
 * - 100% Native vector rendering via react-native-svg.
 * - Zero JS thread overhead, zero layout shifts.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Shapes } from '@/theme';

interface SpecularHighlightProps {
  borderRadius?: number;
  accentColor?: string;
  intensity?: number;
}

export function SpecularHighlight({
  borderRadius = Shapes.xl,
  accentColor = Colors.chartreuse,
  intensity = 1.0,
}: SpecularHighlightProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const gradId = useMemo(
    () => `spec_${Math.random().toString(36).substring(2, 9)}`,
    []
  );

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      if (!size || Math.abs(size.width - width) > 1 || Math.abs(size.height - height) > 1) {
        setSize({ width, height });
      }
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={handleLayout}>
      {size && size.width > 0 && size.height > 0 && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="90%" y2="100%">
              {/* Crisp top-left specular edge */}
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.28 * intensity} />
              {/* Subtle theme accent wash */}
              <Stop offset="25%" stopColor={accentColor} stopOpacity={0.20 * intensity} />
              <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.05 * intensity} />
              {/* Fades to transparent toward bottom-right */}
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.0} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0.6}
            y={0.6}
            width={Math.max(0, size.width - 1.2)}
            height={Math.max(0, size.height - 1.2)}
            rx={borderRadius}
            ry={borderRadius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={1.2}
          />
        </Svg>
      )}
    </View>
  );
}
