/**
 * MyWallet — Activity / Transaction Ledger (Placeholder)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Colors, Typography, Spacing, Shapes } from '@/theme';

export default function ActivityScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="ACTIVITY" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search bar placeholder */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search 'Rahul', 'Food', '₹120', 'Dinner'...</Text>
        </Animated.View>

        {/* Filter tabs */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.filterRow}>
          {['ALL', 'EXPENSES', 'INCOME', 'TRANSFERS'].map((filter, i) => (
            <View
              key={filter}
              style={[styles.filterPill, i === 0 && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>
                {filter}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Monthly summary card */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.monthCard}>
          <View style={styles.monthCardLeft}>
            <Text style={styles.monthCardIcon}>📊</Text>
            <View>
              <Text style={styles.monthCardTitle}>SEPTEMBER SPEND</Text>
              <Text style={styles.monthCardAmount}>₹8,420 <Text style={styles.monthCardSub}>· 42 Logs</Text></Text>
            </View>
          </View>
        </Animated.View>

        {/* Today group */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateLabel}>TODAY  •  18 Sep</Text>
            <Text style={styles.dateNet}>Net: +₹2,300</Text>
          </View>

          <View style={styles.txGroup}>
            {[
              { icon: '🍽', title: 'Lunch', tag: 'FOOD', sub: 'SBI Savings · 1:15 PM', amount: '-₹120', type: 'EXPENSE', color: Colors.expense },
              { icon: '🚗', title: 'Auto Ride', tag: 'TRANSIT', sub: 'SBI Savings · 9:45 AM', amount: '-₹80', type: 'EXPENSE', color: Colors.expense },
              { icon: '💰', title: 'Salary / Allowance', tag: 'CREDITED', sub: 'SBI Savings · 8:00 AM', amount: '+₹2,500', type: 'DIRECT DEPOSIT', color: Colors.income },
            ].map((tx, i) => (
              <View key={i} style={styles.txRow}>
                <View style={[styles.txIconCircle, { backgroundColor: `${tx.color}15` }]}>
                  <Text style={styles.txIcon}>{tx.icon}</Text>
                </View>
                <View style={styles.txInfo}>
                  <View style={styles.txTitleRow}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagText}>{tx.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.txSub}>{tx.sub}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: tx.color }]}>{tx.amount}</Text>
                  <Text style={styles.txType}>{tx.type}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.surface },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.lg, gap: Spacing.cardGap },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shapes.xl,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.strokeMedium,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { ...Typography.bodyMd, color: Colors.onSurfaceVariant },

  filterRow: { flexDirection: 'row', gap: 8 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Shapes.pill, borderWidth: 1,
    borderColor: Colors.strokeBright, backgroundColor: 'transparent',
  },
  filterPillActive: { backgroundColor: Colors.primaryFixed, borderColor: Colors.primaryFixed },
  filterText: { ...Typography.labelCaps, color: Colors.onSurface, fontSize: 10 },
  filterTextActive: { color: Colors.onPrimary },

  monthCard: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shapes.xl,
    padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.strokeLight,
  },
  monthCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthCardIcon: { fontSize: 24 },
  monthCardTitle: { ...Typography.labelCaps, color: Colors.onSurfaceVariant, fontSize: 10 },
  monthCardAmount: { fontFamily: 'JetBrainsMono-Bold', fontSize: 20, color: Colors.onSurface },
  monthCardSub: { fontFamily: 'JetBrainsMono-Medium', fontSize: 12, color: Colors.onSurfaceVariant },

  dateHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, marginTop: 8,
  },
  dateLabel: { ...Typography.labelCaps, color: Colors.primaryFixed, fontSize: 11 },
  dateNet: { fontFamily: 'JetBrainsMono-Medium', fontSize: 12, color: Colors.onSurfaceVariant },

  txGroup: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shapes.xl, overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.strokeSubtle,
  },
  txIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  txIcon: { fontSize: 18 },
  txInfo: { flex: 1, gap: 4 },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txTitle: { ...Typography.bodyMdMedium, color: Colors.onSurface },
  tagPill: {
    backgroundColor: Colors.surfaceContainerHigh, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  tagText: { ...Typography.labelCaps, fontSize: 8, color: Colors.onSurfaceVariant },
  txSub: { ...Typography.bodySm, color: Colors.onSurfaceVariant, fontSize: 11 },
  txRight: { alignItems: 'flex-end', gap: 2 },
  txAmount: { fontFamily: 'JetBrainsMono-SemiBold', fontSize: 14 },
  txType: { ...Typography.labelCaps, fontSize: 8, color: Colors.onSurfaceVariant },
});
