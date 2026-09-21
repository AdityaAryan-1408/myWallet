/**
 * MyWallet — Payment Source Selector
 * 
 * Selects funding account (Bank/Cash) or Credit Card for transactions and transfers.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Building, Wallet, CreditCard as CardIcon } from 'lucide-react-native';
import { Account, CreditCard } from '@/db/schema';
import { Colors, Typography, Shapes } from '@/theme';

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
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bank & Cash Accounts */}
        {accounts.map((acc) => {
          const isSelected =
            selectedSourceType === 'account' && selectedSourceId === acc.id;
          const isCash = acc.type === 'cash';

          return (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.sourcePill,
                isSelected && styles.sourcePillActive,
              ]}
              onPress={() => onSelectSource('account', acc.id)}
              activeOpacity={0.7}
            >
              {isCash ? (
                <Wallet
                  size={14}
                  color={isSelected ? Colors.onPrimary : Colors.primaryFixed}
                />
              ) : (
                <Building
                  size={14}
                  color={isSelected ? Colors.onPrimary : Colors.onSurfaceVariant}
                />
              )}
              <Text
                style={[
                  styles.sourceName,
                  isSelected && styles.sourceNameActive,
                ]}
              >
                {acc.name}
              </Text>
              <Text
                style={[
                  styles.sourceBalance,
                  isSelected && styles.sourceBalanceActive,
                ]}
              >
                ₹{acc.balance.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Credit Cards (available for expenses only, not transfers) */}
        {!isTransfer &&
          creditCards.map((card) => {
            const isSelected =
              selectedSourceType === 'credit_card' && selectedSourceId === card.id;

            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.sourcePill,
                  isSelected && styles.sourcePillActive,
                ]}
                onPress={() => onSelectSource('credit_card', card.id)}
                activeOpacity={0.7}
              >
                <CardIcon
                  size={14}
                  color={isSelected ? Colors.onPrimary : card.color || Colors.secondaryFixed}
                />
                <Text
                  style={[
                    styles.sourceName,
                    isSelected && styles.sourceNameActive,
                  ]}
                >
                  {card.name}
                </Text>
                <Text
                  style={[
                    styles.sourceBalance,
                    isSelected && styles.sourceBalanceActive,
                  ]}
                >
                  •• {card.last4 || 'Card'}
                </Text>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  scrollContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  sourcePillActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryFixed,
  },
  sourceName: {
    ...Typography.bodySmMedium,
    fontSize: 12,
    color: Colors.onSurface,
  },
  sourceNameActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  sourceBalance: {
    fontFamily: Typography.numericSm.fontFamily,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  sourceBalanceActive: {
    color: Colors.onPrimary,
    opacity: 0.85,
  },
});
