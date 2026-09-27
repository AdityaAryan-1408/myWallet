/**
 * MyWallet — Quick UPI Pay Modal (Phase 17)
 * 
 * Frictionless UPI Intent launcher for peer debts:
 * - Pre-populates payee name, recipient VPA (UPI ID), and remaining debt amount
 * - Allows instant VPA input with quick handle chips if not previously saved
 * - Automatically saves VPA to debt contact for zero-friction future payments
 * - Deep-links directly to installed UPI apps (GPay, PhonePe, Paytm, CRED)
 * - Prompts to record debt repayment upon return to keep financial ledgers in sync
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
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Zap,
  Check,
  AtSign,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';

import { DebtWithRepayments } from '@/repositories';
import { useFinancialStore } from '@/stores';
import {
  COMMON_UPI_HANDLES,
  validateUpiId,
  launchUpiPayment,
  normalizeUpiId,
} from '@/utils/upi';
import { Colors, Typography, Spacing, Shapes, FontFamily, Elevation } from '@/theme';

export interface QuickUpiPayModalProps {
  visible: boolean;
  debt: DebtWithRepayments | null;
  onClose: () => void;
  onPaymentSuccess?: (debt: DebtWithRepayments, amountPaid: number) => void;
}

export function QuickUpiPayModal({
  visible,
  debt,
  onClose,
  onPaymentSuccess,
}: QuickUpiPayModalProps) {
  const insets = useSafeAreaInsets();
  const { updateDebt, recordDebtRepayment } = useFinancialStore();

  const [upiId, setUpiId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [saveToContact, setSaveToContact] = useState(true);
  const [note, setNote] = useState('');
  const [isPendingReturn, setIsPendingReturn] = useState(false);
  const [lastPaidAmount, setLastPaidAmount] = useState(0);

  useEffect(() => {
    if (visible && debt) {
      setUpiId(debt.upi_id || '');
      setAmountStr(debt.remaining_amount.toString());
      setNote(debt.reason ? `${debt.reason} repayment` : 'Debt Repayment');
      setIsPendingReturn(false);
      setLastPaidAmount(0);
    }
  }, [visible, debt]);

  if (!debt) return null;

  const enteredAmount = parseFloat(amountStr) || 0;
  const isUpiValid = validateUpiId(upiId);
  const canLaunch = isUpiValid && enteredAmount > 0;

  const handleAppendUpiSuffix = (suffix: string) => {
    Haptics.selectionAsync();
    const current = upiId.trim();
    const atIndex = current.indexOf('@');
    if (atIndex !== -1) {
      setUpiId(current.substring(0, atIndex) + suffix);
    } else if (current.length > 0) {
      setUpiId(current + suffix);
    } else {
      setUpiId(suffix);
    }
  };

  const handleLaunchUpi = async () => {
    if (!canLaunch) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const cleanUpi = normalizeUpiId(upiId);

    // Persist UPI ID to contact if checked or if not present before
    if (saveToContact || !debt.upi_id) {
      updateDebt(debt.id, { upi_id: cleanUpi });
    }

    setLastPaidAmount(enteredAmount);

    const result = await launchUpiPayment({
      upiId: cleanUpi,
      payeeName: debt.person_name,
      amount: enteredAmount,
      note: note.trim() || 'Debt Repayment',
      transactionRef: `MW_${debt.id.slice(-6)}_${Date.now().toString().slice(-4)}`,
    });

    if (result.success) {
      // Transition to return verification state
      setIsPendingReturn(true);
    } else {
      Alert.alert(
        'Unable to Open UPI App',
        result.error || 'Please make sure a UPI app (Google Pay, PhonePe, Paytm) is installed on your device.',
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Record Repayment Anyway',
            onPress: () => {
              handleRecordDirectly(enteredAmount);
            },
          },
        ]
      );
    }
  };

  const handleRecordDirectly = (amountToRecord: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const today = new Date().toISOString().split('T')[0];
    recordDebtRepayment(debt.id, amountToRecord, today, `UPI: ${normalizeUpiId(upiId)}`);
    onPaymentSuccess?.(debt, amountToRecord);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top || 16 }]}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            activeOpacity={0.7}
          >
            <X size={20} color={Colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Zap size={16} color={Colors.chartreuse} />
            <Text style={styles.headerTitle}>UPI Quick Pay</Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Post-Launch Confirmation Banner ─── */}
          {isPendingReturn ? (
            <View style={styles.pendingReturnCard}>
              <View style={styles.pendingIconBox}>
                <CheckCircle2 size={24} color={Colors.chartreuse} />
              </View>
              <Text style={styles.pendingTitle}>Did your UPI payment complete?</Text>
              <Text style={styles.pendingDesc}>
                If your payment of ₹{lastPaidAmount.toLocaleString('en-IN')} to{' '}
                <Text style={{ fontWeight: '700', color: Colors.onSurface }}>
                  {debt.person_name}
                </Text>{' '}
                was successful, record it now to update your ledger.
              </Text>

              <View style={styles.pendingActions}>
                <TouchableOpacity
                  style={styles.confirmRepayBtn}
                  onPress={() => handleRecordDirectly(lastPaidAmount)}
                  activeOpacity={0.8}
                >
                  <Check size={16} color="#000" />
                  <Text style={styles.confirmRepayBtnText}>
                    Yes, Record ₹{lastPaidAmount.toLocaleString('en-IN')} Paid
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => setIsPendingReturn(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryBtnText}>Reopen / Edit Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* ─── Payee Summary Hero ─── */}
              <View style={styles.heroCard}>
                <View style={styles.heroRow}>
                  <View style={styles.avatarBox}>
                    <Text style={styles.avatarInitial}>
                      {debt.person_name.trim()[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.heroInfo}>
                    <Text style={styles.heroLabel}>PAYING BORROWED DEBT TO</Text>
                    <Text style={styles.heroName}>{debt.person_name}</Text>
                    {debt.reason ? (
                      <Text style={styles.heroReason}>{debt.reason}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.heroDivider} />

                <View style={styles.heroRemainingRow}>
                  <Text style={styles.heroRemainingLabel}>REMAINING OUTSTANDING</Text>
                  <Text style={styles.heroRemainingVal}>
                    ₹{debt.remaining_amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* ─── Amount Input ─── */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>AMOUNT TO PAY</Text>
                  {debt.remaining_amount !== enteredAmount && (
                    <TouchableOpacity
                      onPress={() => setAmountStr(debt.remaining_amount.toString())}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resetAmountLink}>
                        Full ₹{debt.remaining_amount.toLocaleString('en-IN')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.amountInputRow}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    keyboardType="numeric"
                    value={amountStr}
                    onChangeText={setAmountStr}
                  />
                </View>
              </View>

              {/* ─── UPI VPA Input ─── */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>RECIPIENT UPI ID / VPA</Text>
                  {isUpiValid ? (
                    <View style={styles.validBadge}>
                      <Check size={11} color={Colors.income} />
                      <Text style={styles.validBadgeText}>VALID VPA</Text>
                    </View>
                  ) : upiId.length > 0 ? (
                    <View style={styles.hintBadge}>
                      <Text style={styles.hintBadgeText}>username@handle</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.inputWrapper}>
                  <AtSign
                    size={18}
                    color={isUpiValid ? Colors.income : Colors.onSurfaceVariant}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="e.g. rahul@okaxis, 9876543210@paytm"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Quick Handle Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.handleChipsRow}
                >
                  {COMMON_UPI_HANDLES.map((handle) => (
                    <TouchableOpacity
                      key={handle}
                      style={[
                        styles.handleChip,
                        upiId.includes(handle) && styles.handleChipActive,
                      ]}
                      onPress={() => handleAppendUpiSuffix(handle)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.handleChipText,
                          upiId.includes(handle) && styles.handleChipTextActive,
                        ]}
                      >
                        {handle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* ─── Note Input ─── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PAYMENT NOTE / DESCRIPTION</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Dinner split, Friend loan..."
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={note}
                  onChangeText={setNote}
                  maxLength={60}
                />
              </View>

              {/* ─── Save VPA Toggle ─── */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSaveToContact(!saveToContact);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, saveToContact && styles.checkboxActive]}>
                  {saveToContact && <Check size={12} color="#000" />}
                </View>
                <Text style={styles.toggleText}>
                  Save this UPI ID to {debt.person_name}'s contact record
                </Text>
              </TouchableOpacity>

              {/* ─── Launch Button ─── */}
              <TouchableOpacity
                style={[styles.launchBtn, !canLaunch && styles.launchBtnDisabled]}
                onPress={handleLaunchUpi}
                disabled={!canLaunch}
                activeOpacity={0.8}
              >
                <Zap size={18} color={canLaunch ? '#000' : Colors.onSurfaceVariant} />
                <Text style={[styles.launchBtnText, !canLaunch && styles.launchBtnTextDisabled]}>
                  Pay ₹{enteredAmount.toLocaleString('en-IN')} via UPI App
                </Text>
                <ExternalLink
                  size={15}
                  color={canLaunch ? '#000' : Colors.onSurfaceVariant}
                />
              </TouchableOpacity>

              {/* ─── Apps Supported Footer ─── */}
              <View style={styles.supportedFooter}>
                <ShieldCheck size={14} color={Colors.chartreuse} />
                <Text style={styles.supportedFooterText}>
                  Launches Google Pay • PhonePe • Paytm • CRED • BHIM via NPCI Intent
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  scrollBody: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.20)',
    gap: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: Shapes.md,
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  avatarInitial: {
    fontFamily: FontFamily.numericBold,
    fontSize: 20,
    color: Colors.expense,
  },
  heroInfo: {
    flex: 1,
    gap: 2,
  },
  heroLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  heroName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 17,
  },
  heroReason: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.strokeSubtle,
  },
  heroRemainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroRemainingLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9.5,
  },
  heroRemainingVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 16,
    color: Colors.expense,
  },

  // Sections
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 1.0,
  },
  resetAmountLink: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Amount Input
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  currencyPrefix: {
    fontFamily: FontFamily.numericBold,
    fontSize: 28,
    color: Colors.chartreuse,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontFamily: FontFamily.numericBold,
    fontSize: 28,
    color: Colors.chartreuse,
    paddingVertical: 4,
  },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: 12,
    color: Colors.onSurface,
    fontSize: 15,
  },
  textInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    color: Colors.onSurface,
    fontSize: 15,
  },

  // Badges
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  validBadgeText: {
    ...Typography.labelCaps,
    color: Colors.income,
    fontSize: 8.5,
    fontWeight: '800',
  },
  hintBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  hintBadgeText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 8.5,
  },

  // Handle Chips
  handleChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 2,
  },
  handleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  handleChipActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    borderColor: Colors.chartreuse,
  },
  handleChipText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  handleChipTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.strokeMedium,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.chartreuse,
    borderColor: Colors.chartreuse,
  },
  toggleText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    fontSize: 12,
  },

  // Launch Button
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.chartreuse,
    paddingVertical: 14,
    borderRadius: Shapes.pill,
    ...Elevation.low,
    marginTop: 4,
  },
  launchBtnDisabled: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  launchBtnText: {
    ...Typography.labelCaps,
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  launchBtnTextDisabled: {
    color: Colors.onSurfaceVariant,
  },

  // Supported Footer
  supportedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  supportedFooterText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10.5,
    textAlign: 'center',
  },

  // Pending Return Card
  pendingReturnCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.3)',
    marginTop: 20,
  },
  pendingIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
    textAlign: 'center',
  },
  pendingDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  pendingActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  confirmRepayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.chartreuse,
    paddingVertical: 13,
    borderRadius: Shapes.pill,
  },
  confirmRepayBtnText: {
    ...Typography.labelCaps,
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },
  retryBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  retryBtnText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
});
