/**
 * MyWallet — Accounts Snapshot Dashboard Card
 * 
 * Shows active bank & cash accounts, balances, and primary/excluded badges.
 * Complements CardsSnapshotCard for comprehensive liquidity visibility.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Landmark, Coins, Star, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';
import { useFinancialStore } from '@/stores';

interface AccountsSnapshotCardProps {
  onNavigateTab?: (index: number) => void;
}

export function AccountsSnapshotCard({ onNavigateTab }: AccountsSnapshotCardProps) {
  const router = useRouter();
  const { accounts, totalBankCashBalance } = useFinancialStore();

  const handleManagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onNavigateTab) {
      onNavigateTab(2); // Accounts & Reserves tab (index 2)
    } else {
      router.push('/accounts' as any);
    }
  };

  const activeAccounts = accounts.filter((a) => (a.is_active ?? 1) === 1);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Landmark size={16} color={Colors.onSurface} />
          <Text style={styles.cardTitle}>Accounts Snapshot</Text>
        </View>
        <TouchableOpacity
          onPress={handleManagePress}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>Manage &gt;</Text>
        </TouchableOpacity>
      </View>

      {activeAccounts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No accounts registered</Text>
        </View>
      ) : (
        activeAccounts.map((account) => {
          const isBank = account.type === 'bank';
          const isPrimary = account.is_primary === 1;
          const isExcluded = account.exclude_from_total === 1;

          return (
            <View key={account.id} style={styles.accountRow}>
              <View style={[styles.accountLogoBox, isBank ? styles.bankLogoBox : styles.cashLogoBox]}>
                {isBank ? (
                  <Landmark size={18} color={isExcluded ? Colors.onSurfaceVariant : Colors.primaryFixed} />
                ) : (
                  <Coins size={18} color={isExcluded ? Colors.onSurfaceVariant : Colors.secondaryFixed} />
                )}
              </View>

              <View style={styles.accountInfo}>
                <View style={styles.accountNameRow}>
                  <Text style={[styles.accountName, isExcluded && styles.accountNameExcluded]} numberOfLines={1}>
                    {account.name}
                  </Text>
                  {isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Star size={9} color={Colors.onPrimary} fill={Colors.onPrimary} />
                      <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                    </View>
                  )}
                  {isExcluded && (
                    <View style={styles.excludedBadge}>
                      <EyeOff size={8} color={Colors.warning} />
                      <Text style={styles.excludedBadgeText}>EXCLUDED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.accountSub} numberOfLines={1}>
                  {account.institution || (isBank ? 'Bank Account' : 'Physical Cash')}
                </Text>
              </View>

              <View style={styles.accountRight}>
                <Text style={[styles.accountAmount, isExcluded && styles.accountAmountExcluded]}>
                  ₹{(account.balance ?? 0).toLocaleString('en-IN')}
                </Text>
                <Text
                  style={[
                    styles.accountStatus,
                    { color: isExcluded ? Colors.warning : Colors.income },
                  ]}
                >
                  {isExcluded ? 'Excluded' : 'Liquid'}
                </Text>
              </View>
            </View>
          );
        })
      )}

      {activeAccounts.length > 0 && (
        <View style={styles.totalFooter}>
          <Text style={styles.totalFooterLabel}>Total Liquid Capital</Text>
          <Text style={styles.totalFooterAmount}>₹{(totalBankCashBalance ?? 0).toLocaleString('en-IN')}</Text>
        </View>
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
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  accountLogoBox: {
    width: 36,
    height: 36,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  bankLogoBox: {},
  cashLogoBox: {},
  accountInfo: {
    flex: 1,
    gap: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  accountNameExcluded: {
    color: Colors.onSurfaceVariant,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontFamily: FontFamily.mono,
    fontSize: 8,
    fontWeight: '800',
    color: Colors.onPrimary,
    letterSpacing: 0.5,
  },
  excludedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(235, 127, 43, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  excludedBadgeText: {
    fontFamily: FontFamily.mono,
    fontSize: 8,
    fontWeight: '700',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
  accountSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  accountRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  accountAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    color: Colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  accountAmountExcluded: {
    color: Colors.onSurfaceVariant,
  },
  accountStatus: {
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
  totalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs + 2,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.strokeSubtle,
  },
  totalFooterLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  totalFooterAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 12,
    color: Colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
});
