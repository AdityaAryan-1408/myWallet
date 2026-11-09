/**
 * MyWallet — Moment Cluster Card (Feature B3: Money Memory)
 * 
 * Displays auto-grouped temporal and contextual spending moments:
 * "Saturday Night Out — ₹2,840 across Uber, Zomato, PVR"
 * "Morning Commute & Breakfast — ₹340 across Metro, Blue Tokai"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { FinancialMoment } from '@/services/moneyMemoryService';
import { Colors, FontFamily, Typography } from '@/theme';
import { useFinancialStore } from '@/stores';

interface MomentClusterCardProps {
  moment: FinancialMoment;
}

export function MomentClusterCard({ moment }: MomentClusterCardProps) {
  const themeMode = useFinancialStore((s) => s.themeMode);
  const isLight = themeMode === 'light' || themeMode === 'mono_light';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLight ? '#FFFBEB' : '#1B1E29',
          borderColor: isLight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)',
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Text style={styles.momentEmoji}>{moment.emoji}</Text>
          <View>
            <View style={styles.eyebrowContainer}>
              <Sparkles size={10} color="#F59E0B" />
              <Text style={styles.eyebrowText}>MOMENT CLUSTER</Text>
            </View>
            <Text
              style={[
                styles.momentTitle,
                { color: isLight ? '#92400E' : '#FDE68A' },
              ]}
            >
              {moment.title}
            </Text>
          </View>
        </View>

        <View style={[styles.amountPill, { backgroundColor: isLight ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)' }]}>
          <Text style={styles.amountText}>
            ₹{Math.round(moment.totalAmount).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.narrativeText,
          { color: isLight ? '#78350F' : '#E2E8F0' },
        ]}
        numberOfLines={2}
      >
        {moment.narrative}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  momentEmoji: {
    fontSize: 18,
  },
  eyebrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  eyebrowText: {
    fontSize: 8.5,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 0.6,
  },
  momentTitle: {
    fontSize: 13,
    fontFamily: FontFamily.heading,
    fontWeight: '700',
  },
  amountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  amountText: {
    fontSize: 12,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    color: '#F59E0B',
  },
  narrativeText: {
    fontSize: 11.5,
    fontFamily: FontFamily.body,
    lineHeight: 15,
  },
});
