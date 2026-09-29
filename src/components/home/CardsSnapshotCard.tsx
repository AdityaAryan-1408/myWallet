/**
 * MyWallet — Credit Cards Snapshot Dashboard Card
 * 
 * Shows active credit cards, live outstanding balances, and utilization percentage.
 * Feature 15: Extracted for modular dashboard arrangement.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';
import { useFinancialStore } from '@/stores';
import { CreditCardRepository } from '@/repositories';

interface CardsSnapshotCardProps {
  onNavigateTab?: (index: number) => void;
}

export function CardsSnapshotCard({ onNavigateTab }: CardsSnapshotCardProps) {
  const { creditCards } = useFinancialStore();

  const handleManagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNavigateTab?.(3); // Cards tab
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <CreditCard size={16} color={Colors.onSurface} />
          <Text style={styles.cardTitle}>Cards Snapshot</Text>
        </View>
        <TouchableOpacity
          onPress={handleManagePress}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>Manage &gt;</Text>
        </TouchableOpacity>
      </View>

      {creditCards.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No credit cards registered</Text>
        </View>
      ) : (
        creditCards.map((card) => {
          const outstanding = CreditCardRepository.getCardOutstanding(card.id);
          const util = card.credit_limit > 0 ? Math.round((outstanding / card.credit_limit) * 100) : 0;
          return (
            <View key={card.id} style={styles.creditCardRow}>
              <View style={styles.cardLogoBox}>
                <CreditCard size={18} color={card.color} />
              </View>
              <View style={styles.creditCardInfo}>
                <Text style={styles.creditCardName}>{card.name}</Text>
                <Text style={styles.creditCardSub}>
                  Limit ₹{card.credit_limit.toLocaleString('en-IN')} • Resets {card.cycle_reset_day}th
                </Text>
              </View>
              <View style={styles.creditCardRight}>
                <Text style={styles.creditCardAmount}>
                  ₹{outstanding.toLocaleString('en-IN')}
                </Text>
                <Text
                  style={[
                    styles.creditCardUtil,
                    { color: util > 30 ? Colors.warning : Colors.income },
                  ]}
                >
                  {util}% utilized
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
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  creditCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  cardLogoBox: {
    width: 36,
    height: 36,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  creditCardInfo: {
    flex: 1,
    gap: 1,
  },
  creditCardName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  creditCardSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  creditCardRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  creditCardAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    color: Colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  creditCardUtil: {
    ...Typography.labelCaps,
    fontSize: 9,
    fontWeight: '700',
  },
  emptyBox: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});
