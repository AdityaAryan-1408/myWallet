/**
 * MyWallet — Pocket Audit Banner (Feature B7)
 * 
 * Minimalist, elegant prompt appearing on HomeScreen when unreviewed transactions exist.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Shapes, FontFamily } from '@/theme';

interface PocketAuditBannerProps {
  unreviewedCount: number;
  onPress: () => void;
}

export function PocketAuditBanner({ unreviewedCount, onPress }: PocketAuditBannerProps) {
  if (unreviewedCount <= 0) return null;

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View style={styles.left}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={15} color={Colors.primaryFixed} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>
                {unreviewedCount} UNREVIEWED {unreviewedCount === 1 ? 'EXPENSE' : 'EXPENSES'}
              </Text>
              <View style={styles.badge}>
                <Sparkles size={9} color={Colors.primaryFixed} />
                <Text style={styles.badgeText}>60s AUDIT</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Tap to verify ledger accuracy</Text>
          </View>
        </View>

        <ChevronRight size={18} color={Colors.onSurfaceVariant} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(212, 255, 50, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.22)',
    borderRadius: Shapes.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 255, 50, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: Colors.onSurface,
    letterSpacing: 0.6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(212, 255, 50, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: Shapes.pill,
  },
  badgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 8,
    color: Colors.primaryFixed,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
});
