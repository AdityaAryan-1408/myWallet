/**
 * MyWallet — Category Donut Chart (SVG)
 * 
 * High-performance SVG segmented donut chart for categorical burn distribution.
 * Custom built with react-native-svg for lightweight execution and zero dependencies.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Colors, Typography, FontFamily } from '@/theme';

export interface DonutCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

interface CategoryDonutProps {
  categories: DonutCategory[];
  totalSpend: number;
  size?: number;
  strokeWidth?: number;
}

export function CategoryDonut({
  categories,
  totalSpend,
  size = 170,
  strokeWidth = 20,
}: CategoryDonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Compute stroke dash offsets
  let accumulatedPercent = 0;

  // Filter categories with > 0 spend
  const activeCategories = categories.filter((c) => c.total > 0);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Background Track */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={Colors.surfaceContainerHigh}
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Segment Slices */}
            {activeCategories.map((cat) => {
              const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += cat.percentage;

              return (
                <Circle
                  key={cat.categoryId}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={cat.categoryColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              );
            })}
          </G>
        </Svg>

        {/* Center Text */}
        <View style={styles.centerContainer}>
          <Text style={styles.centerLabel}>TOTAL SPENT</Text>
          <Text style={styles.centerAmount}>₹{totalSpend.toLocaleString('en-IN')}</Text>
          <Text style={styles.centerCount}>{activeCategories.length} Categories</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centerLabel: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  centerAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 20,
    lineHeight: 24,
    color: Colors.onSurface,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  centerCount: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
});
