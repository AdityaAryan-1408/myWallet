/**
 * MyWallet — Payment Source Selector (Dropdown Trigger)
 * 
 * Replaces horizontal scroll with an interactive source selector button
 * matching the CategoryPicker design. Tapping opens PaymentSourceModal
 * displaying Bank Accounts, Cash Wallets, and Credit Cards with real-time balances.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  ChevronDown,
  Building,
  Wallet,
  CreditCard as CardIcon,
  Star,
} from 'lucide-react-native';
import { Account, CreditCard } from '@/db/schema';
import { CreditCardRepository } from '@/repositories';
import { PaymentSourceModal } from './PaymentSourceModal';
import { Colors, Typography, FontFamily, Spacing, Shapes, Elevation } from '@/theme';

interface PaymentSourceSelectorProps {
  accounts: Account[];
  creditCards: CreditCard[];
  selectedSourceType: 'account' | 'credit_card';
  selectedSourceId: string;
  onSelectSource: (type: 'account' | 'credit_card', id: string) => void;
  isTransfer?: boolean;
}

export function PaymentSourceSelector({
  accounts,
  creditCards,
  selectedSourceType,
  selectedSourceId,
  onSelectSource,
  isTransfer = false,
}: PaymentSourceSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Active account or card
  const activeAccount = useMemo(() => {
    if (selectedSourceType !== 'account') return null;
    return accounts.find((a) => a.id === selectedSourceId) || accounts[0] || null;
  }, [accounts, selectedSourceType, selectedSourceId]);

  const activeCard = useMemo(() => {
    if (selectedSourceType !== 'credit_card') return null;
    return creditCards.find((c) => c.id === selectedSourceId) || creditCards[0] || null;
  }, [creditCards, selectedSourceType, selectedSourceId]);

  // Derived metadata
  const sourceMeta = useMemo(() => {
    if (selectedSourceType === 'credit_card' && activeCard) {
      const outstanding = CreditCardRepository.getCardOutstanding(activeCard.id);
      const availableLine = Math.max(0, activeCard.credit_limit - outstanding);
      const color = activeCard.color || Colors.secondaryFixed;
      return {
        name: activeCard.name,
        badge: activeCard.last4 ? `•• ${activeCard.last4}` : 'Credit Card',
        badgeColor: color,
        subLabel: `Available Line: ₹${availableLine.toLocaleString('en-IN')}`,
        color,
        iconType: 'card' as const,
        isPrimary: false,
      };
    }

    if (activeAccount) {
      const isCash = activeAccount.type === 'cash';
      const isPrimary = activeAccount.is_primary === 1;
      const color = isPrimary ? Colors.chartreuse : Colors.primaryFixed;
      return {
        name: activeAccount.name,
        badge: isPrimary ? 'PRIMARY' : isCash ? 'CASH' : (activeAccount.institution || 'BANK'),
        badgeColor: color,
        subLabel: `Available Balance: ₹${activeAccount.balance.toLocaleString('en-IN')}`,
        color,
        iconType: (isCash ? 'cash' : 'bank') as 'cash' | 'bank',
        isPrimary,
      };
    }

    return {
      name: 'Select Payment Source',
      badge: '',
      badgeColor: Colors.onSurfaceVariant,
      subLabel: 'Tap to choose account or card',
      color: Colors.primaryFixed,
      iconType: 'bank' as const,
      isPrimary: false,
    };
  }, [selectedSourceType, activeAccount, activeCard]);

  return (
    <View style={styles.container}>
      {/* ─── Source Selector Trigger Button ─── */}
      <TouchableOpacity
        style={[
          styles.button,
          { borderColor: `${sourceMeta.color}50` },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {/* Left: Icon Circle */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${sourceMeta.color}20` },
          ]}
        >
          {sourceMeta.iconType === 'card' ? (
            <CardIcon size={18} color={sourceMeta.color} />
          ) : sourceMeta.iconType === 'cash' ? (
            <Wallet size={18} color={sourceMeta.color} />
          ) : (
            <Building size={18} color={sourceMeta.color} />
          )}
        </View>

        {/* Center: Source Name & Balance */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.sourceName} numberOfLines={1}>
              {sourceMeta.name}
            </Text>
            {sourceMeta.badge ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: `${sourceMeta.badgeColor}20` },
                ]}
              >
                {sourceMeta.isPrimary && (
                  <Star size={9} color={sourceMeta.badgeColor} fill={sourceMeta.badgeColor} />
                )}
                <Text
                  style={[
                    styles.badgeText,
                    { color: sourceMeta.badgeColor },
                  ]}
                  numberOfLines={1}
                >
                  {sourceMeta.badge}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subLabel} numberOfLines={1}>
            {sourceMeta.subLabel}
          </Text>
        </View>

        {/* Right: Chevron */}
        <View style={styles.chevronBox}>
          <ChevronDown size={18} color={Colors.onSurfaceVariant} />
        </View>
      </TouchableOpacity>

      {/* ─── Bottom-Sheet Modal ─── */}
      <PaymentSourceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        accounts={accounts}
        creditCards={creditCards}
        selectedSourceType={selectedSourceType}
        selectedSourceId={selectedSourceId}
        onSelectSource={onSelectSource}
        isTransfer={isTransfer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 12,
    ...Elevation.low,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  sourceName: {
    ...Typography.bodyMdMedium,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  badgeText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  subLabel: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  chevronBox: {
    padding: 4,
  },
});
