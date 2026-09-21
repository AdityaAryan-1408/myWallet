/**
 * MyWallet — Pay Credit Card Bill Modal
 * 
 * High-speed debt settlement modal:
 * - One-tap presets: Full Due, Minimum Due, Custom
 * - Bank account source picker with live balance preview
 * - Debt settlement semantics (does not double-count as an expense)
 * - Immediate SQLite execution and store refresh
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  CreditCard as CreditCardIcon,
  Wallet,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';

import { CreditCard } from '@/db/schema';
import { CreditCardRepository } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

export interface PayCardBillModalProps {
  visible: boolean;
  card: CreditCard | null;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export function PayCardBillModal({
  visible,
  card,
  onClose,
  onPaymentSuccess,
}: PayCardBillModalProps) {
  const insets = useSafeAreaInsets();
  const { accounts, refreshFinancials } = useFinancialStore();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [activePreset, setActivePreset] = useState<'full' | 'min' | 'custom'>('full');

  const outstanding = useMemo(() => {
    if (!card) return 0;
    return CreditCardRepository.getCardOutstanding(card.id);
  }, [card]);

  const minDue = useMemo(() => {
    return Math.max(500, Math.round(outstanding * 0.05));
  }, [outstanding]);

  // Reset form when card changes
  useEffect(() => {
    if (visible && card) {
      const primaryAccount = accounts.find((a) => a.is_primary) || accounts[0];
      setSelectedAccountId(primaryAccount ? primaryAccount.id : '');
      setAmountStr(`${outstanding}`);
      setActivePreset('full');
    }
  }, [visible, card, accounts, outstanding]);

  if (!card) return null;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const parsedAmount = parseFloat(amountStr) || 0;
  const isBalanceSufficient = (selectedAccount?.balance ?? 0) >= parsedAmount;

  const handleSelectPreset = (preset: 'full' | 'min' | 'custom') => {
    setActivePreset(preset);
    if (preset === 'full') {
      setAmountStr(`${outstanding}`);
    } else if (preset === 'min') {
      setAmountStr(`${minDue}`);
    } else {
      setAmountStr('');
    }
  };

  const handleConfirmPayment = () => {
    if (parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than zero.');
      return;
    }

    if (!selectedAccount) {
      Alert.alert('No Account Selected', 'Please select a source account to pay from.');
      return;
    }

    if (!isBalanceSufficient) {
      Alert.alert(
        'Insufficient Balance',
        `The selected account has ₹${selectedAccount.balance.toLocaleString('en-IN')}, which is less than ₹${parsedAmount.toLocaleString('en-IN')}.`
      );
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }

    CreditCardRepository.payBill(
      card.id,
      selectedAccount.id,
      parsedAmount,
      `Bill Payment for ${card.name}`
    );

    refreshFinancials();
    onPaymentSuccess?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.handleBar} />

          {/* Top Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SETTLE CARD BILL</Text>
            <View style={{ width: 34 }} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Target Card Hero */}
            <View style={styles.cardHero}>
              <View style={[styles.cardLogoBox, { backgroundColor: card.color }]}>
                <CreditCardIcon size={20} color="#FFFFFF" />
              </View>
              <View style={styles.cardHeroInfo}>
                <Text style={styles.cardHeroName}>{card.name}</Text>
                <Text style={styles.cardHeroSub}>
                  •••• {card.last4 || '4092'} • Total Outstanding: ₹{outstanding.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Presets Row */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={[styles.presetBtn, activePreset === 'full' && styles.presetBtnActive]}
                onPress={() => handleSelectPreset('full')}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetLabel, activePreset === 'full' && styles.presetTextActive]}>
                  Full Due
                </Text>
                <Text style={[styles.presetValue, activePreset === 'full' && styles.presetTextActive]}>
                  ₹{outstanding.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetBtn, activePreset === 'min' && styles.presetBtnActive]}
                onPress={() => handleSelectPreset('min')}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetLabel, activePreset === 'min' && styles.presetTextActive]}>
                  Min Due (5%)
                </Text>
                <Text style={[styles.presetValue, activePreset === 'min' && styles.presetTextActive]}>
                  ₹{minDue.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetBtn, activePreset === 'custom' && styles.presetBtnActive]}
                onPress={() => handleSelectPreset('custom')}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetLabel, activePreset === 'custom' && styles.presetTextActive]}>
                  Custom
                </Text>
                <Text style={[styles.presetValue, activePreset === 'custom' && styles.presetTextActive]}>
                  Enter ₹
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.amountInputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amountStr}
                onChangeText={(val) => {
                  setAmountStr(val.replace(/[^0-9.]/g, ''));
                  setActivePreset('custom');
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.onSurfaceVariant}
              />
            </View>

            {/* Paid From Account Picker */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>PAY FROM ACCOUNT</Text>
              <View style={styles.accountList}>
                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      style={[styles.accountOption, isSelected && styles.accountOptionActive]}
                      onPress={() => setSelectedAccountId(acc.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.accountLeft}>
                        <Wallet size={16} color={isSelected ? Colors.primaryFixed : Colors.onSurfaceVariant} />
                        <View>
                          <Text style={[styles.accountName, isSelected && styles.accountNameActive]}>
                            {acc.name}
                          </Text>
                          <Text style={styles.accountBal}>
                            Bal: ₹{acc.balance.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>
                      {isSelected && <CheckCircle2 size={16} color={Colors.primaryFixed} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Financial Logic Explanatory Notice */}
            <View style={styles.noticeCard}>
              <ShieldCheck size={16} color={Colors.primaryFixed} />
              <Text style={styles.noticeText}>
                Classified as Debt Settlement / Transfer. Reduces your credit card outstanding and your bank balance simultaneously without creating artificial expenses.
              </Text>
            </View>

            {/* Confirm Payment Button */}
            <TouchableOpacity
              style={[styles.payButton, (!isBalanceSufficient || parsedAmount <= 0) && styles.payButtonDisabled]}
              onPress={handleConfirmPayment}
              activeOpacity={0.8}
              disabled={!isBalanceSufficient || parsedAmount <= 0}
            >
              <Text style={styles.payButtonText}>
                Confirm Payment (₹{parsedAmount > 0 ? parsedAmount.toLocaleString('en-IN') : '0'})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    borderTopWidth: 1,
    borderColor: Colors.strokeMedium,
    maxHeight: '90%',
    ...Elevation.high,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.onSurfaceVariant,
    opacity: 0.4,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  headerTitle: {
    ...Typography.labelCaps,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  scroll: {
    maxHeight: 560,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.md,
  },
  cardHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  cardLogoBox: {
    width: 42,
    height: 42,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeroInfo: {
    flex: 1,
    gap: 2,
  },
  cardHeroName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 14,
  },
  cardHeroSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 2,
  },
  presetBtnActive: {
    backgroundColor: Colors.chartreuseWash,
    borderColor: Colors.primaryFixed,
  },
  presetLabel: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  presetValue: {
    fontFamily: FontFamily.numericSemiBold,
    fontSize: 12,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  presetTextActive: {
    color: Colors.primaryFixed,
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.xl,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.strokeBright,
  },
  currencySymbol: {
    fontSize: 32,
    color: Colors.primaryFixed,
    fontFamily: FontFamily.numericBold,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 36,
    color: Colors.onSurface,
    fontFamily: FontFamily.numericBold,
    minWidth: 120,
    textAlign: 'center',
  },
  sectionBox: {
    gap: 8,
  },
  sectionLabel: {
    ...Typography.labelCaps,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  accountList: {
    gap: 6,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  accountOptionActive: {
    borderColor: Colors.primaryFixed,
    backgroundColor: 'rgba(212, 255, 50, 0.05)',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontSize: 13,
  },
  accountNameActive: {
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  accountBal: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(212, 255, 50, 0.06)',
    borderRadius: Shapes.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.18)',
  },
  noticeText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  payButton: {
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 14,
    borderRadius: Shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...Elevation.medium,
  },
  payButtonDisabled: {
    opacity: 0.4,
  },
  payButtonText: {
    ...Typography.bodyMdMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
