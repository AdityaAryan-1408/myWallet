/**
 * MyWallet — Transaction Row Component
 * 
 * Elegant ledger item matching the Zenith Obsidian theme and activity specification:
 * - Colored category icon with subtle ambient wash
 * - Note title + Category badge tag
 * - Account / Card source + timestamp subtitle
 * - Precision tabular amount with signed color coding
 * - Type status badge (DEBIT, CREDIT, INFLOW, TRANSFER)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { TransactionWithDetails } from '@/repositories';
import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';

export interface TransactionRowProps {
  transaction: TransactionWithDetails;
  onPress: (transaction: TransactionWithDetails) => void;
  isLast?: boolean;
}

export function TransactionRow({ transaction, onPress, isLast = false }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const isCreditCard = Boolean(transaction.credit_card_id);

  // Color selection
  const iconColor = transaction.category_color || (isIncome ? Colors.income : isTransfer ? Colors.transfer : Colors.chartreuse);
  const iconBg = `${iconColor}18`;

  // Amount formatting
  const amountColor = isIncome
    ? Colors.income
    : isTransfer
    ? Colors.transfer
    : Colors.onSurface;

  const amountSign = isIncome ? '+' : isTransfer ? '⇄ ' : '−';

  // Type label badge
  let typeTag = 'DEBIT';
  if (isIncome) {
    typeTag = 'INFLOW';
  } else if (isTransfer) {
    typeTag = 'TRANSFER';
  } else if (isCreditCard) {
    typeTag = 'CREDIT';
  }

  // Account / Source display
  let sourceText = transaction.account_name || transaction.credit_card_name || 'Primary Account';
  if (isTransfer && transaction.dest_account_name) {
    sourceText = `${transaction.account_name || 'Source'} → ${transaction.dest_account_name}`;
  }

  const timeStr = transaction.time ? transaction.time.slice(0, 5) : '';

  // Title display
  const titleText = transaction.note?.trim() || transaction.category_name || (isTransfer ? 'Transfer' : 'Transaction');
  const categoryTag = transaction.subcategory_name || transaction.category_name || (isTransfer ? 'Transfer' : 'General');

  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.noBorder]}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      {/* Category Icon Circle */}
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <CategoryIcon
          name={transaction.category_icon || (isIncome ? 'Briefcase' : isTransfer ? 'ArrowRightLeft' : 'ShoppingBag')}
          size={18}
          color={iconColor}
        />
      </View>

      {/* Transaction Info */}
      <View style={styles.infoCol}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {titleText}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {categoryTag.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle} numberOfLines={1}>
          {sourceText} {timeStr ? `• ${timeStr}` : ''}
        </Text>
      </View>

      {/* Amount & Type Tag */}
      <View style={styles.amountCol}>
        <Text style={[styles.amountText, { color: amountColor }]}>
          {amountSign}₹{transaction.amount.toLocaleString('en-IN')}
        </Text>
        <Text style={[styles.typeTag, isCreditCard && styles.creditTag, isIncome && styles.incomeTag]}>
          {typeTag}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  categoryBadgeText: {
    ...Typography.labelCaps,
    fontSize: 8,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amountText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  typeTag: {
    ...Typography.labelCaps,
    fontSize: 8,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  creditTag: {
    color: Colors.warning,
  },
  incomeTag: {
    color: Colors.income,
  },
});
