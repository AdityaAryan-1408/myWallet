/**
 * MyWallet — Record Debt Repayment Modal
 * 
 * Phase 11: Records an immutable partial or full repayment event on a peer debt.
 * - Displays balance summary: Original amount, already repaid, and remaining balance
 * - Quick "Pay Full Remaining (₹X)" one-tap button
 * - Quick preset increments (+₹100, +₹500, +₹1,000)
 * - Date and payment method note (e.g. UPI, cash)
 * - Automatically marks debt as settled when remaining balance hits zero
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react-native';

import { DebtWithRepayments } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';

export interface RecordRepaymentModalProps {
  visible: boolean;
  debt: DebtWithRepayments | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecordRepaymentModal({
  visible,
  debt,
  onClose,
  onSuccess,
}: RecordRepaymentModalProps) {
  const insets = useSafeAreaInsets();
  const { recordDebtRepayment } = useFinancialStore();

  const [amountStr, setAmountStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [note, setNote] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (visible && debt) {
      // Default to remaining balance
      setAmountStr(debt.remaining_amount.toString());
      setDateStr(todayStr);
      setNote('UPI / Cash repayment');
    }
  }, [visible, debt, todayStr]);

  if (!debt) return null;

  const remaining = debt.remaining_amount;
  const isTheyOwe = debt.direction === 'they_owe';
  const accentColor = isTheyOwe ? Colors.income : Colors.expense;

  const enteredAmount = parseFloat(amountStr) || 0;
  const isValid = enteredAmount > 0;
  const willFullySettle = enteredAmount >= remaining;

  const handleQuickAdd = (inc: number) => {
    Haptics.selectionAsync();
    const current = parseFloat(amountStr) || 0;
    const next = Math.min(current + inc, remaining);
    setAmountStr(next.toString());
  };

  const handleSetFull = () => {
    Haptics.selectionAsync();
    setAmountStr(remaining.toString());
  };

  const handleSubmit = () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    recordDebtRepayment(debt.id, enteredAmount, dateStr, note.trim() || undefined);

    onSuccess?.();
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

          <Text style={styles.headerTitle}>Record Repayment</Text>

          <TouchableOpacity
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Check size={18} color={isValid ? '#000' : Colors.onSurfaceVariant} />
            <Text style={[styles.saveBtnText, !isValid && styles.saveBtnTextDisabled]}>Record</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Context Card ─── */}
          <View style={styles.contextCard}>
            <View style={styles.contextHeader}>
              <View
                style={[
                  styles.directionIconBox,
                  { backgroundColor: isTheyOwe ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 82, 82, 0.15)' },
                ]}
              >
                {isTheyOwe ? (
                  <ArrowDownLeft size={20} color={Colors.income} />
                ) : (
                  <ArrowUpRight size={20} color={Colors.expense} />
                )}
              </View>

              <View style={styles.contextInfo}>
                <Text style={styles.contextLabel}>
                  {isTheyOwe ? 'RECEIVING REPAYMENT FROM' : 'PAYING REPAYMENT TO'}
                </Text>
                <Text style={styles.contextPerson}>{debt.person_name}</Text>
                {debt.reason ? <Text style={styles.contextReason}>{debt.reason}</Text> : null}
              </View>
            </View>

            {/* Balances Breakdown */}
            <View style={styles.balancesRow}>
              <View style={styles.balanceCol}>
                <Text style={styles.balanceLabel}>ORIGINAL</Text>
                <Text style={styles.balanceVal}>₹{debt.amount.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.balanceDivider} />

              <View style={styles.balanceCol}>
                <Text style={styles.balanceLabel}>ALREADY PAID</Text>
                <Text style={[styles.balanceVal, { color: Colors.income }]}>
                  ₹{debt.paid_amount.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.balanceDivider} />

              <View style={styles.balanceCol}>
                <Text style={styles.balanceLabel}>REMAINING</Text>
                <Text style={[styles.balanceVal, { color: accentColor }]}>
                  ₹{remaining.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          {/* ─── Repayment Amount Input ─── */}
          <View style={styles.section}>
            <View style={styles.amountLabelRow}>
              <Text style={styles.sectionLabel}>REPAYMENT AMOUNT</Text>
              <TouchableOpacity onPress={handleSetFull} activeOpacity={0.7}>
                <Text style={styles.fullBalanceLink}>
                  Pay Full Balance (₹{remaining.toLocaleString('en-IN')})
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputRow}>
              <Text style={[styles.currencyPrefix, { color: accentColor }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: accentColor }]}
                placeholder="0"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="numeric"
                value={amountStr}
                onChangeText={setAmountStr}
                autoFocus
              />
            </View>

            {/* Quick Increment Buttons */}
            <View style={styles.quickPresetsRow}>
              {[100, 500, 1000].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetBtn}
                  onPress={() => handleQuickAdd(preset)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetText}>+₹{preset}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.presetBtn, styles.fullBtn]}
                onPress={handleSetFull}
                activeOpacity={0.7}
              >
                <Text style={styles.fullBtnText}>Full ₹{remaining.toLocaleString('en-IN')}</Text>
              </TouchableOpacity>
            </View>

            {/* Settlement Status Notice */}
            {willFullySettle && (
              <View style={styles.settleBanner}>
                <Sparkles size={14} color={Colors.chartreuse} />
                <Text style={styles.settleBannerText}>
                  This payment will fully settle the balance and mark this debt as complete!
                </Text>
              </View>
            )}
          </View>

          {/* ─── Repayment Note / Payment Mode ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTE / PAYMENT MODE</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. UPI transfer, Cash, Splitwise settle..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={note}
              onChangeText={setNote}
            />
          </View>
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
  headerTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.chartreuse,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  saveBtnText: {
    ...Typography.labelCaps,
    color: '#000',
    fontWeight: '700',
    fontSize: 11,
  },
  saveBtnTextDisabled: {
    color: Colors.onSurfaceVariant,
  },
  scrollBody: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },

  // Context Card
  contextCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: Spacing.md,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  directionIconBox: {
    width: 44,
    height: 44,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextInfo: {
    flex: 1,
    gap: 2,
  },
  contextLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  contextPerson: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 17,
  },
  contextReason: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  balancesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Shapes.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  balanceDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.strokeSubtle,
  },
  balanceLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 8.5,
  },
  balanceVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 13,
    color: Colors.onSurface,
  },

  // Sections
  section: {
    gap: 8,
  },
  amountLabelRow: {
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
  fullBalanceLink: {
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
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontFamily: FontFamily.numericBold,
    fontSize: 28,
    paddingVertical: 4,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  presetText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 11,
    color: Colors.onSurface,
  },
  fullBtn: {
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    borderColor: 'rgba(200, 243, 34, 0.3)',
    flex: 1.3,
  },
  fullBtnText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 11,
    color: Colors.chartreuse,
  },
  settleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(200, 243, 34, 0.08)',
    borderRadius: Shapes.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.20)',
    marginTop: 4,
  },
  settleBannerText: {
    ...Typography.bodySm,
    color: Colors.chartreuse,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },

  // Text Input
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
});
