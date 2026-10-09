/**
 * MyWallet — Recent Activity Dashboard Card
 * 
 * Displays the latest transaction records with visual category icons and debit/credit styling.
 * Feature 15: Extracted for modular dashboard arrangement.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';
import { useFinancialStore } from '@/stores';

interface RecentActivityCardProps {
  onNavigateTab?: (index: number) => void;
}

export function RecentActivityCard({ onNavigateTab }: RecentActivityCardProps) {
  const { recentTransactions } = useFinancialStore();

  const handleAllPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNavigateTab?.(1); // Activity tab
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <TouchableOpacity
          onPress={handleAllPress}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>All &gt;</Text>
        </TouchableOpacity>
      </View>

      {recentTransactions.length === 0 ? (
        <View style={styles.emptyRecentBox}>
          <Text style={styles.emptyRecentText}>No transactions recorded yet</Text>
        </View>
      ) : (
        recentTransactions.slice(0, 5).map((tx) => {
          const isIncome = tx.type === 'income';
          const isTemp = Boolean(tx.is_temporary);
          const isReturned = tx.is_returned === 1;

          const iconName = isTemp ? 'Handshake' : isIncome ? 'Briefcase' : 'ShoppingBag';
          const iconColor = isTemp ? Colors.chartreuse : isIncome ? Colors.income : Colors.expense;
          const iconBg = isTemp
            ? 'rgba(200, 243, 34, 0.15)'
            : isIncome
            ? 'rgba(0, 230, 118, 0.12)'
            : 'rgba(255, 82, 82, 0.12)';

          const title = isTemp && tx.person_name
            ? `${tx.person_name} • ${tx.note || 'Paid on Behalf'}`
            : (tx.note || (isTemp ? 'Paid on Behalf' : 'Transaction'));

          const subtitle = isTemp
            ? `${tx.date} • ${isReturned ? 'Returned' : 'Paid on Behalf'}`
            : `${tx.date} • ${tx.time.slice(0, 5)}`;

          const tag = isTemp
            ? (isReturned ? 'RETURNED' : 'ON BEHALF')
            : (isIncome ? 'INFLOW' : 'DEBIT');

          return (
            <View key={tx.id} style={styles.txRow}>
              <View
                style={[
                  styles.txIconCircle,
                  { backgroundColor: iconBg },
                ]}
              >
                <CategoryIcon
                  name={iconName}
                  size={18}
                  color={iconColor}
                />
              </View>

              <View style={styles.txInfo}>
                <Text style={styles.txTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.txSub}>
                  {subtitle}
                </Text>
              </View>

              <View style={styles.txRight}>
                <Text
                  style={[
                    styles.txAmount,
                    {
                      color: isTemp
                        ? (isReturned ? Colors.income : Colors.chartreuse)
                        : isIncome
                        ? Colors.income
                        : Colors.onSurface,
                    },
                  ]}
                >
                  {isIncome ? '+' : '−'}₹{tx.amount.toLocaleString('en-IN')}
                </Text>
                <Text
                  style={[
                    styles.txTag,
                    isTemp && !isReturned && styles.txTagTemp,
                    isTemp && isReturned && styles.txTagReturned,
                  ]}
                >
                  {tag}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 14,
  },
  linkText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontSize: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeSubtle,
  },
  txIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  txSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  txAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  txTag: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  txTagTemp: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },
  txTagReturned: {
    color: Colors.income,
    fontWeight: '700',
  },
  emptyRecentBox: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecentText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});
