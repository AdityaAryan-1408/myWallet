/**
 * MyWallet — Smooth Rolling Number Indicator
 * 
 * Inspired by premium gas-station / odometer readouts:
 * - Single continuous clean text (NO visible tiles, cards, boxes, or vignettes)
 * - Only changed digits roll vertically in place to their new value
 * - Natural typographical kerning and unified baseline alignment
 * - Fast, subtle spring settling effect
 * - Monospaced JetBrains Mono typography with zero horizontal jitter
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FontFamily } from '@/theme';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface RollingDigitProps {
  digit: string;
  height: number;
  width: number;
  fontSize: number;
  textStyle?: TextStyle;
}

function RollingDigit({ digit, height, width, fontSize, textStyle }: RollingDigitProps) {
  const isNumber = !isNaN(parseInt(digit, 10));
  const numericValue = isNumber ? parseInt(digit, 10) : 0;
  const translateY = useSharedValue(-numericValue * height);
  const prevDigit = useSharedValue(numericValue);

  useEffect(() => {
    if (!isNumber) return;

    if (prevDigit.value !== numericValue) {
      prevDigit.value = numericValue;
      translateY.value = withSpring(-numericValue * height, {
        damping: 24,
        stiffness: 260,
        mass: 0.6,
      });
    }
  }, [numericValue, height, isNumber, translateY, prevDigit]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isNumber) {
    return (
      <View style={[styles.column, { height, width }]}>
        <Text
          style={[
            styles.digitText,
            textStyle,
            { fontSize, height, lineHeight: height },
          ]}
        >
          {digit}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.column, { height, width }]}>
      <Animated.View style={animatedStyle}>
        {DIGITS.map((d) => (
          <View
            key={d}
            style={{
              height,
              width,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={[
                styles.digitText,
                textStyle,
                { fontSize, height, lineHeight: height },
              ]}
            >
              {d}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

interface AnimatedNumberProps {
  value: number;
  fontSize?: number;
  lineHeight?: number;
  prefix?: string;
  suffix?: string;
  textStyle?: TextStyle;
  duration?: number;
}

export function AnimatedNumber({
  value,
  fontSize = 48,
  lineHeight = 56,
  prefix = '₹',
  suffix = '.00',
  textStyle,
}: AnimatedNumberProps) {
  const isNegative = value < 0;
  const absValue = Math.abs(Math.round(value));
  const formattedString = absValue.toLocaleString('en-IN');
  const chars = formattedString.split('');

  const totalChars = chars.length;
  const prefixString = isNegative ? `−${prefix}` : prefix;

  // Proportional widths for clean, continuous typography
  const digitWidth = Math.round(fontSize * 0.6);
  const commaWidth = Math.round(fontSize * 0.28);

  return (
    <View style={styles.container}>
      {prefixString ? (
        <Text
          style={[
            styles.affix,
            textStyle,
            {
              fontSize: Math.round(fontSize * 0.8),
              lineHeight,
              marginRight: 2,
            },
          ]}
        >
          {prefixString}
        </Text>
      ) : null}

      <View style={styles.numberRow}>
        {chars.map((char, index) => {
          const posFromRight = totalChars - 1 - index;
          const isNum = !isNaN(parseInt(char, 10));
          return (
            <RollingDigit
              key={`digit-pos-${posFromRight}`}
              digit={char}
              height={lineHeight}
              width={isNum ? digitWidth : commaWidth}
              fontSize={fontSize}
              textStyle={textStyle}
            />
          );
        })}
      </View>

      {suffix ? (
        <Text
          style={[
            styles.affix,
            textStyle,
            styles.decimalSuffix,
            {
              fontSize: Math.round(fontSize * 0.58),
              lineHeight,
              marginLeft: 2,
            },
          ]}
        >
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  column: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
  },
  digitText: {
    fontFamily: FontFamily.numeric,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    backgroundColor: 'transparent',
    includeFontPadding: false,
  },
  affix: {
    fontFamily: FontFamily.headingBold,
    fontWeight: '700',
    backgroundColor: 'transparent',
    includeFontPadding: false,
  },
  decimalSuffix: {
    opacity: 0.65,
    fontFamily: FontFamily.numericMedium,
  },
});
