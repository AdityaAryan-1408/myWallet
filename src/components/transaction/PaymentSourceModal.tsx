/**
 * MyWallet — Payment Source Selection Modal
 * 
 * Dropdown bottom-sheet displaying Bank Accounts, Cash Wallets,
 * and Credit Cards with available balances/limits and primary indicator.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  X,
  Check,
  Building,
  Wallet,
  CreditCard as CardIcon,
  Star,
} from 'lucide-react-native';
import { Account, CreditCard } from '@/db/schema';
import { CreditCardRepository } from '@/repositories';
import { Colors, Typography, FontFamily, Spacing, Shapes, Elevation } from '@/theme';

interface PaymentSourceModalProps {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  creditCards: CreditCard[];
  selectedSourceType: 'account' | 'credit_card';
  selectedSourceId: string;
  onSelectSource: (type: 'account' | 'credit_card', id: string) => void;
  isTransfer?: boolean;
}

export function PaymentSourceModal({
  visible,
  onClose,
  accounts,
  creditCards,
  selectedSourceType,
  selectedSourceId,
  onSelectSource,
  isTransfer = false,
}: PaymentSourceModalProps) {
  const handleSelect = (type: 'account' | 'credit_card', id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectSource(type, id);
    onClose();
  };

  // Sort accounts: Primary first, then other bank accounts, then cash
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.is_primary === 1) return -1;
    if (b.is_primary === 1) return 1;
    if (a.type === 'bank' && b.type === 'cash') return -1;
    if (a.type === 'cash' && b.type === 'bank') return 1;
    return a.display_order - b.display_order;
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {isTransfer ? 'Select Destination Account' : 'Select Payment Source'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isTransfer ? 'Funds will be transferred here' : 'Accounts & Cards with available limits'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* ─── Bank Accounts & Cash ─── */}
            <Text style={styles.sectionHeader}>BANK ACCOUNTS & CASH</Text>
            {sortedAccounts.length === 0 ? (
              <View style={[styles.groupCard, { padding: Spacing.md, alignItems: 'center' }]}>
                <Text style={{ ...Typography.bodySm, color: Colors.onSurfaceVariant }}>
                  No accounts found. Please add an account first.
                </Text>
              </View>
            ) : (
              <View style={styles.groupCard}>
                {sortedAccounts.map((acc, index) => {
                  const isSelected = selectedSourceType === 'account' && selectedSourceId === acc.id;
                  const isCash = acc.type === 'cash';
                  const isPrimary = acc.is_primary === 1;

                  return (
                    <React.Fragment key={acc.id}>
                      {index > 0 && <View style={styles.rowDivider} />}
                      <TouchableOpacity
                        style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                        activeOpacity={0.7}
                        onPress={() => handleSelect('account', acc.id)}
                      >
                      <View
                        style={[
                          styles.iconBox,
                          isCash
                            ? { backgroundColor: `${Colors.primaryFixed}1A` }
                            : { backgroundColor: `${Colors.primaryFixed}15` },
                        ]}
                      >
                        {isCash ? (
                          <Wallet size={18} color={Colors.primaryFixed} />
                        ) : (
                          <Building size={18} color={isPrimary ? Colors.chartreuse : Colors.primaryFixed} />
                        )}
                      </View>

                      <View style={styles.itemMeta}>
                        <View style={styles.titleLine}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {acc.name}
                          </Text>
                          {isPrimary && (
                            <View style={styles.primaryBadge}>
                              <Star size={9} color={Colors.chartreuse} fill={Colors.chartreuse} />
                              <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.itemSub}>
                          {acc.institution ? `${acc.institution} • ` : ''}
                          {isCash ? 'Physical Cash' : 'Bank Account'}
                        </Text>
                      </View>

                      <View style={styles.itemRight}>
                        <Text style={styles.itemBalance}>
                          ₹{acc.balance.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.itemBalanceSub}>Available</Text>
                      </View>

                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <Check size={12} color={Colors.surface} strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
              </View>
            )}

            {/* ─── Credit Cards ─── */}
            {!isTransfer && creditCards.length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { marginTop: Spacing.md }]}>CREDIT CARDS</Text>
                <View style={styles.groupCard}>
                  {creditCards.map((card, index) => {
                    const isSelected =
                      selectedSourceType === 'credit_card' && selectedSourceId === card.id;
                    const cardColor = card.color || Colors.secondaryFixed;
                    const outstanding = CreditCardRepository.getCardOutstanding(card.id);
                    const availableLine = Math.max(0, card.credit_limit - outstanding);

                    return (
                      <React.Fragment key={card.id}>
                        {index > 0 && <View style={styles.rowDivider} />}
                        <TouchableOpacity
                          style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                          activeOpacity={0.7}
                          onPress={() => handleSelect('credit_card', card.id)}
                        >
                          <View
                            style={[
                              styles.iconBox,
                              { backgroundColor: `${cardColor}1A` },
                            ]}
                          >
                            <CardIcon size={18} color={cardColor} />
                          </View>

                          <View style={styles.itemMeta}>
                            <View style={styles.titleLine}>
                              <Text style={styles.itemName} numberOfLines={1}>
                                {card.name}
                              </Text>
                              {card.last4 && (
                                <View style={styles.last4Badge}>
                                  <Text style={styles.last4Text}>•• {card.last4}</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.itemSub}>
                              Limit: ₹{card.credit_limit.toLocaleString('en-IN')}
                            </Text>
                          </View>

                          <View style={styles.itemRight}>
                            <Text style={[styles.itemBalance, { color: cardColor }]}>
                              ₹{availableLine.toLocaleString('en-IN')}
                            </Text>
                            <Text style={styles.itemBalanceSub}>Line Available</Text>
                          </View>

                          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                            {isSelected && <Check size={12} color={Colors.surface} strokeWidth={3} />}
                          </View>
                        </TouchableOpacity>
                      </React.Fragment>
                    );
                  })}
                </View>
              </>
            )}

            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    ...Elevation.high,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeSubtle,
  },
  headerTitle: {
    ...Typography.bodyLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    ...Typography.labelCaps,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginVertical: Spacing.xs + 2,
    paddingHorizontal: 2,
  },
  groupCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.cardPadding,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.sm + 2,
  },
  itemRowSelected: {
    backgroundColor: `${Colors.primaryFixed}08`,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.strokeSubtle,
    marginLeft: 56,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flex: 1,
    gap: 2,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    ...Typography.bodySm,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${Colors.chartreuse}1A`,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}40`,
  },
  primaryBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 8.5,
    color: Colors.chartreuse,
    letterSpacing: 0.5,
  },
  last4Badge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Shapes.sm,
  },
  last4Text: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  itemSub: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  itemBalance: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13.5,
    color: Colors.onSurface,
  },
  itemBalanceSub: {
    ...Typography.bodySm,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.strokeMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  radioCircleSelected: {
    backgroundColor: Colors.chartreuse,
    borderColor: Colors.chartreuse,
  },
});
