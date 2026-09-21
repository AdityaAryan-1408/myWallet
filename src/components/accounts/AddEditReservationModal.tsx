/**
 * MyWallet — Add / Edit Reservation Modal
 *
 * Phase 9: Sinking Funds & Savings Goal envelope manager.
 * - Name, Current Amount, Target Amount, Affects Available toggle
 * - SVG circular progress ring showing current / target %
 * - Quick-add presets (+₹100, +₹500, +₹1K, +₹5K)
 * - Deposit / Withdraw from bank accounts
 * - Delete with confirmation (edit mode)
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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import {
  X,
  Check,
  Trash2,
  Shield,
  Target,
  Lock,
  Unlock,
} from 'lucide-react-native';

import { Reservation } from '@/db/schema';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';

// ─── SVG Progress Ring ─────────────────────────────────────────────
interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0..1
}

function ProgressRing({ size, strokeWidth, progress }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedProgress);

  // Tint from cyan → chartreuse as progress approaches 100%
  const progressColor = clampedProgress >= 1
    ? Colors.chartreuse
    : clampedProgress >= 0.7
      ? Colors.income
      : clampedProgress >= 0.4
        ? Colors.secondaryFixedDim
        : Colors.secondaryFixed;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.surfaceContainerHigh}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center percentage */}
      <View style={StyleSheet.absoluteFill as any}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.ringPercent, { color: progressColor }]}>
            {Math.round(clampedProgress * 100)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Quick Add Presets ─────────────────────────────────────────────
const QUICK_ADD_AMOUNTS = [100, 500, 1000, 5000];

export interface AddEditReservationModalProps {
  visible: boolean;
  reservationToEdit?: Reservation | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEditReservationModal({
  visible,
  reservationToEdit,
  onClose,
  onSuccess,
}: AddEditReservationModalProps) {
  const insets = useSafeAreaInsets();
  const { createReservation, updateReservation, deleteReservation } = useFinancialStore();

  const isEdit = !!reservationToEdit;

  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [note, setNote] = useState('');
  const [affectsAvailable, setAffectsAvailable] = useState(true);

  // Pre-fill for edit mode
  useEffect(() => {
    if (visible && reservationToEdit) {
      setName(reservationToEdit.name);
      setAmountStr(reservationToEdit.amount.toString());
      setTargetStr(reservationToEdit.target_amount?.toString() || '');
      setNote(reservationToEdit.note || '');
      setAffectsAvailable(reservationToEdit.affects_available === 1);
    } else if (visible) {
      setName('');
      setAmountStr('');
      setTargetStr('');
      setNote('');
      setAffectsAvailable(true);
    }
  }, [visible, reservationToEdit]);

  const amount = parseFloat(amountStr) || 0;
  const targetAmount = parseFloat(targetStr) || 0;
  const isValid = name.trim().length > 0;
  const progress = targetAmount > 0 ? amount / targetAmount : 0;

  // Pacing: "Save ₹X/month to hit target by Dec 2026"
  const pacingHint = useMemo(() => {
    if (targetAmount <= 0 || amount >= targetAmount) return null;
    const remaining = targetAmount - amount;
    const now = new Date();
    // Assume 6 month default horizon
    const monthsLeft = Math.max(1, 6);
    const perMonth = Math.ceil(remaining / monthsLeft);
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthsLeft, 1);
    const monthName = targetDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    return `Save ₹${perMonth.toLocaleString('en-IN')}/month to hit target by ${monthName}`;
  }, [amount, targetAmount]);

  const handleQuickAdd = (addAmount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newAmount = amount + addAmount;
    setAmountStr(newAmount.toString());
  };

  const handleSave = () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEdit && reservationToEdit) {
      updateReservation(reservationToEdit.id, {
        name: name.trim(),
        amount,
        target_amount: targetAmount || null,
        note: note.trim() || null,
        affects_available: affectsAvailable ? 1 : 0,
      });
    } else {
      createReservation({
        id: `res_${Date.now()}`,
        name: name.trim(),
        amount,
        target_amount: targetAmount || null,
        note: note.trim() || null,
        affects_available: affectsAvailable ? 1 : 0,
        is_active: 1,
      });
    }

    onSuccess?.();
    onClose();
  };

  const handleDelete = () => {
    if (!reservationToEdit) return;
    Alert.alert(
      'Delete Reservation',
      `Remove "${reservationToEdit.name}"? This reserved money will be released back into your Available to Spend.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteReservation(reservationToEdit.id);
            onSuccess?.();
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Goal' : 'New Savings Goal'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
            activeOpacity={0.7}
            disabled={!isValid}
          >
            <Check size={20} color={isValid ? '#000' : Colors.onSurfaceVariant} />
            <Text style={[styles.saveBtnText, !isValid && styles.saveBtnTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Progress Ring Hero ─── */}
          {targetAmount > 0 && (
            <View style={styles.ringContainer}>
              <ProgressRing size={120} strokeWidth={10} progress={progress} />
              <View style={styles.ringMeta}>
                <Text style={styles.ringLabel}>
                  ₹{amount.toLocaleString('en-IN')} of ₹{targetAmount.toLocaleString('en-IN')}
                </Text>
                {pacingHint && (
                  <Text style={styles.pacingText}>{pacingHint}</Text>
                )}
              </View>
            </View>
          )}

          {/* ─── Name ─── */}
          <Text style={styles.fieldLabel}>GOAL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Emergency Fund, Goa Trip"
            placeholderTextColor={Colors.onSurfaceVariant + '80'}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />

          {/* ─── Current Amount ─── */}
          <Text style={styles.fieldLabel}>CURRENT AMOUNT</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefix]}
              placeholder="0"
              placeholderTextColor={Colors.onSurfaceVariant + '80'}
              value={amountStr}
              onChangeText={setAmountStr}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          {/* ─── Quick Add Presets ─── */}
          <View style={styles.quickAddRow}>
            {QUICK_ADD_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickAddPill}
                onPress={() => handleQuickAdd(amt)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickAddText}>
                  +₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── Target Amount ─── */}
          <Text style={styles.fieldLabel}>TARGET AMOUNT (OPTIONAL)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefix]}
              placeholder="0 = open-ended buffer"
              placeholderTextColor={Colors.onSurfaceVariant + '80'}
              value={targetStr}
              onChangeText={setTargetStr}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          {/* ─── Affects Available Toggle ─── */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              {affectsAvailable ? (
                <Lock size={16} color={Colors.warning} />
              ) : (
                <Unlock size={16} color={Colors.onSurfaceVariant} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>
                  {affectsAvailable ? 'Reduces Available to Spend' : 'Does NOT reduce Available'}
                </Text>
                <Text style={styles.toggleSub}>
                  {affectsAvailable
                    ? 'This amount is locked away from daily spending'
                    : 'Tracked goal only — not sequestered from spendable money'}
                </Text>
              </View>
            </View>
            <Switch
              value={affectsAvailable}
              onValueChange={setAffectsAvailable}
              trackColor={{
                false: Colors.surfaceContainerHigh,
                true: 'rgba(245, 158, 11, 0.35)',
              }}
              thumbColor={affectsAvailable ? Colors.warning : Colors.onSurfaceVariant}
            />
          </View>

          {/* ─── Notes ─── */}
          <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any details about this goal..."
            placeholderTextColor={Colors.onSurfaceVariant + '80'}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* ─── Delete (edit mode) ─── */}
          {isEdit && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={Colors.expense} />
              <Text style={styles.deleteBtnText}>Delete Reservation</Text>
            </TouchableOpacity>
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeMedium,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 18,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Shapes.pill,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  saveBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: '#000',
    fontWeight: '700',
  },
  saveBtnTextDisabled: {
    color: Colors.onSurfaceVariant,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 60,
    gap: Spacing.sm,
  },

  // ─── Ring ────────────────────────────────────────────────────────
  ringContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xxl,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  ringPercent: {
    fontFamily: FontFamily.numericBold,
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  ringMeta: {
    alignItems: 'center',
    gap: 4,
  },
  ringLabel: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 14,
    color: Colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  pacingText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    textAlign: 'center',
  },

  // ─── Quick Add ───────────────────────────────────────────────────
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  quickAddPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeBright,
  },
  quickAddText: {
    fontFamily: FontFamily.numericSemiBold,
    fontSize: 12,
    color: Colors.income,
    fontVariant: ['tabular-nums'],
  },

  // ─── Fields ──────────────────────────────────────────────────────
  fieldLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 1.0,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontFamily: FontFamily.numericBold,
    fontSize: 18,
    color: Colors.primaryFixed,
    marginRight: 8,
  },
  inputWithPrefix: {
    flex: 1,
    fontFamily: FontFamily.numericMedium,
    fontVariant: ['tabular-nums'],
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },

  // ─── Toggle ──────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    marginTop: Spacing.sm,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  toggleTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  toggleSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
  },

  // ─── Delete ──────────────────────────────────────────────────────
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: Spacing.lg,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
    backgroundColor: 'rgba(255, 82, 82, 0.06)',
  },
  deleteBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: Colors.expense,
    fontWeight: '700',
  },
});
