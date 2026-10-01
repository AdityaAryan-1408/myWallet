/**
 * MyWallet — Atmospheric Time-of-Day Horizon (v2.0 Visual Upgrade 4.3)
 * 
 * Dynamically reflects the real world outside directly in the dashboard header:
 * - Morning (5 AM – 12 PM): Golden amber sunrise aura • "Good morning, [Name] ☕"
 * - Afternoon (12 PM – 5 PM): Crisp daylight horizon • "Good afternoon, [Name] ☀️"
 * - Evening (5 PM – 9 PM): Deep twilight dusk amber-violet mist • "Good evening, [Name] 🌆"
 * - Night (9 PM – 5 AM): Deep celestial obsidian with twinkling micro-stars • "Good night, [Name] 🌙"
 * 
 * 100% Native Reanimated worklet animations with zero layout shift.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Sun, Sunset, Moon, Sparkles } from 'lucide-react-native';
import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';

interface AtmosphericHorizonGreetingProps {
  userName: string;
}

type HorizonPhase = 'morning' | 'afternoon' | 'evening' | 'night';

interface HorizonConfig {
  phase: HorizonPhase;
  greetingPrefix: string;
  emoji: string;
  subtitle: string;
  tag: string;
  auraCenterColor: string;
  auraEdgeColor: string;
  auraOpacity: number;
  badgeBg: string;
  badgeTextColor: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
}

function getHorizonConfig(userName: string): HorizonConfig {
  const hour = new Date().getHours();
  const name = userName ? userName.trim() : 'there';

  if (hour >= 5 && hour < 12) {
    return {
      phase: 'morning',
      greetingPrefix: `Good morning, ${name}`,
      emoji: '☕',
      subtitle: 'Your daily financial horizon is clear',
      tag: 'SUNRISE PACING',
      auraCenterColor: '#F59E0B',
      auraEdgeColor: '#D97706',
      auraOpacity: 0.16,
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      badgeTextColor: '#FBBF24',
      icon: Sun,
      iconColor: '#F59E0B',
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      phase: 'afternoon',
      greetingPrefix: `Good afternoon, ${name}`,
      emoji: '☀️',
      subtitle: 'Tracking your midday financial velocity',
      tag: 'MIDDAY CLARITY',
      auraCenterColor: '#00D2FF',
      auraEdgeColor: '#0284C7',
      auraOpacity: 0.14,
      badgeBg: 'rgba(0, 210, 255, 0.12)',
      badgeTextColor: '#38BDF8',
      icon: Sun,
      iconColor: '#00D2FF',
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      phase: 'evening',
      greetingPrefix: `Good evening, ${name}`,
      emoji: '🌆',
      subtitle: 'Dusk digest • Wrapping up today\'s spend',
      tag: 'TWILIGHT DUSK',
      auraCenterColor: '#C084FC',
      auraEdgeColor: '#F43F5E',
      auraOpacity: 0.18,
      badgeBg: 'rgba(192, 132, 252, 0.12)',
      badgeTextColor: '#E0AAFF',
      icon: Sunset,
      iconColor: '#C084FC',
    };
  }

  return {
    phase: 'night',
    greetingPrefix: `Good night, ${name}`,
    emoji: '🌙',
    subtitle: 'All balances secured for tomorrow',
    tag: 'CELESTIAL QUIET',
    auraCenterColor: '#6366F1',
    auraEdgeColor: '#4338CA',
    auraOpacity: 0.14,
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    badgeTextColor: '#A5B4FC',
    icon: Moon,
    iconColor: '#818CF8',
  };
}

function TwinklingStar({
  top,
  right,
  size,
  duration,
}: {
  top: number;
  right: number;
  size: number;
  duration: number;
}) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration }),
        withTiming(0.15, { duration })
      ),
      -1,
      true
    );
  }, [duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          right,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#E0E7FF',
        },
        animatedStyle,
      ]}
    />
  );
}

export function AtmosphericHorizonGreeting({ userName }: AtmosphericHorizonGreetingProps) {
  const config = useMemo(() => getHorizonConfig(userName), [userName]);
  const IconComponent = config.icon;

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.container}>
      {/* ── Atmospheric Radial Glow Aura ── */}
      <View style={styles.auraWrapper} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id="horizonGradient"
              cx="15%"
              cy="40%"
              rx="85%"
              ry="75%"
              fx="15%"
              fy="40%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor={config.auraCenterColor} stopOpacity={config.auraOpacity} />
              <Stop offset="60%" stopColor={config.auraEdgeColor} stopOpacity={config.auraOpacity * 0.35} />
              <Stop offset="100%" stopColor={config.auraEdgeColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#horizonGradient)" />
        </Svg>

        {/* Twinkling micro-stars at night */}
        {config.phase === 'night' && (
          <>
            <TwinklingStar top={6} right={24} size={2.5} duration={1800} />
            <TwinklingStar top={18} right={68} size={1.8} duration={2400} />
            <TwinklingStar top={10} right={110} size={2.0} duration={1500} />
            <TwinklingStar top={28} right={45} size={1.4} duration={2100} />
          </>
        )}
      </View>

      {/* ── Content Row ── */}
      <View style={styles.contentRow}>
        <View style={styles.textColumn}>
          {/* Eyebrow tag with time-context icon */}
          <View style={styles.eyebrowRow}>
            <View style={[styles.phaseBadge, { backgroundColor: config.badgeBg }]}>
              <IconComponent size={10} color={config.iconColor} />
              <Text style={[styles.phaseBadgeText, { color: config.badgeTextColor }]}>
                {config.tag}
              </Text>
            </View>
          </View>

          {/* Primary dynamic greeting */}
          <Text style={styles.greetingTitle}>
            {config.greetingPrefix} {config.emoji}
          </Text>

          {/* Contextual subtitle */}
          <Text style={styles.greetingSubtitle}>{config.subtitle}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
    borderRadius: Shapes.lg,
    overflow: 'hidden',
  },
  auraWrapper: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    gap: 3,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: Shapes.pill,
  },
  phaseBadgeText: {
    ...Typography.labelCaps,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  greetingTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  greetingSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
});
