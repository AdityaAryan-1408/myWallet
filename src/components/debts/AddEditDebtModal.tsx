/**
 * MyWallet — Add / Edit Debt Modal
 * 
 * Phase 11: Peer debt management modal for "I Owe" vs "They Owe Me" balances:
 * - Direction toggle: Receivable (They Owe Me) vs Payable (I Owe)
 * - Person name with previously logged people autocomplete chips
 * - Amount with numeric validation
 * - Reason / description with quick common presets (Dinner, Cab, Groceries, Loan)
 * - Safe deletion with confirmation (edit mode)
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Check,
  Trash2,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
} from 'lucide-react-native';

import { PeopleDebt, DebtDirection } from '@/db/schema';
import { DebtRepository } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, FontFamily, Elevation } from '@/theme';

const REASON_PRESETS = [
  'Dinner split',
  'Cab share',
  'Groceries',
  'Coffee & snacks',
  'Movie tickets',
  'Personal loan',
  'Rent share',
];

export interface AddEditDebtModalProps {
  visible: boolean;
  debtToEdit?: PeopleDebt | null;
  presetDirection?: DebtDirection;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEditDebtModal({
  visible,
  debtToEdit,
  presetDirection = 'they_owe',
  onClose,
  onSuccess,
}: AddEditDebtModalProps) {
  const insets = useSafeAreaInsets();
  const { createDebt, updateDebt, deleteDebt } = useFinancialStore();

  const isEdit = !!debtToEdit;

  const [personName, setPersonName] = useState('');
  const [direction, setDirection] = useState<DebtDirection>(presetDirection);
  const [amountStr, setAmountStr] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  // Distinct people from repository for autocomplete
  const existingPeople = useMemo(() => {
    return DebtRepository.getDistinctPeople();
  }, [visible]);

  // Pre-fill fields on open
  useEffect(() => {
    if (visible) {
      if (debtToEdit) {
        setPersonName(debtToEdit.person_name);
        setDirection(debtToEdit.direction);
        setAmountStr(debtToEdit.amount.toString());
        setReason(debtToEdit.reason || '');
        setNote(debtToEdit.note || '');
      } else {
        setPersonName('');
        setDirection(presetDirection);
        setAmountStr('');
        setReason('');
        setNote('');
      }
    }
  }, [visible, debtToEdit, presetDirection]);

  const amount = parseFloat(amountStr) || 0;
  const isValid = personName.trim().length > 0 && amount > 0;

  const handleSave = () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const trimmedName = personName.trim();
    const trimmedReason = reason.trim() || null;
    const trimmedNote = note.trim() || null;

    if (isEdit && debtToEdit) {
      updateDebt(debtToEdit.id, {
        person_name: trimmedName,
        direction,
        amount,
        reason: trimmedReason,
        note: trimmedNote,
      });
    } else {
      createDebt({
        id: `debt_${Date.now()}`,
        person_name: trimmedName,
        direction,
        amount,
        reason: trimmedReason,
        note: trimmedNote,
        is_settled: 0,
      });
    }

    onSuccess?.();
    onClose();
  };

  const handleDelete = () => {
    if (!debtToEdit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Debt Record',
      `Delete debt record with "${debtToEdit.person_name}" for ₹${debtToEdit.amount.toLocaleString('en-IN')}? All repayment history for this debt will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDebt(debtToEdit.id);
            onClose();
          },
        },
      ]
    );
  };

  const activeColor = direction === 'they_owe' ? Colors.income : Colors.expense;

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

          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Debt Record' : 'Log New Debt / Loan'}
          </Text>

          <TouchableOpacity
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Check size={18} color={isValid ? '#000' : Colors.onSurfaceVariant} />
            <Text style={[styles.saveBtnText, !isValid && styles.saveBtnTextDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Direction Segmented Selector ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DEBT DIRECTION</Text>
            <View style={styles.directionSelector}>
              <TouchableOpacity
                style={[
                  styles.directionPill,
                  direction === 'they_owe' && styles.theyOwePillActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDirection('they_owe');
                }}
                activeOpacity={0.7}
              >
                <ArrowDownLeft
                  size={16}
                  color={direction === 'they_owe' ? Colors.income : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.directionPillText,
                    direction === 'they_owe' && { color: Colors.income, fontWeight: '700' },
                  ]}
                >
                  THEY OWE ME
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.directionPill,
                  direction === 'i_owe' && styles.iOwePillActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDirection('i_owe');
                }}
                activeOpacity={0.7}
              >
                <ArrowUpRight
                  size={16}
                  color={direction === 'i_owe' ? Colors.expense : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.directionPillText,
                    direction === 'i_owe' && { color: Colors.expense, fontWeight: '700' },
                  ]}
                >
                  I OWE THEM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Person Name Input & Suggestions ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PERSON NAME</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={Colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.textInputWithIcon}
                placeholder="e.g. Rahul Sharma, Rohit, Mom..."
                placeholderTextColor={Colors.onSurfaceVariant}
                value={personName}
                onChangeText={setPersonName}
                autoFocus={!isEdit}
              />
            </View>

            {/* Quick Person Autocomplete Pills */}
            {existingPeople.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.peopleChipsRow}
              >
                {existingPeople.map((person) => {
                  const isSelected = personName.toLowerCase() === person.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={person}
                      style={[styles.personChip, isSelected && styles.personChipActive]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPersonName(person);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.personChipText,
                          isSelected && styles.personChipTextActive,
                        ]}
                      >
                        {person}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* ─── Amount Input ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AMOUNT</Text>
            <View style={styles.amountInputRow}>
              <Text style={[styles.currencyPrefix, { color: activeColor }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: activeColor }]}
                placeholder="0"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="numeric"
                value={amountStr}
                onChangeText={setAmountStr}
              />
            </View>
          </View>

          {/* ─── Reason & Quick Presets ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REASON / DESCRIPTION</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Dinner split, Cab share, Loan..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={reason}
              onChangeText={setReason}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetChipsRow}
            >
              {REASON_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetChip, reason === p && styles.presetChipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setReason(p);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      reason === p && styles.presetChipTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ─── Optional Notes ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADDITIONAL NOTE (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Any details, payment link, or reminder date..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* ─── Delete Button (Edit Mode Only) ─── */}
          {isEdit && debtToEdit && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={Colors.expense} />
              <Text style={styles.deleteBtnText}>Delete Debt Record</Text>
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

  // Sections
  section: {
    gap: 8,
  },
  sectionLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 1.0,
  },

  // Direction Selector
  directionSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  directionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  theyOwePillActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderColor: Colors.income,
  },
  iOwePillActive: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: Colors.expense,
  },
  directionPillText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
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
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
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
    fontSize: 26,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontFamily: FontFamily.numericBold,
    fontSize: 26,
    paddingVertical: 4,
  },

  // Chips
  peopleChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  personChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  personChipActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.15)',
    borderColor: Colors.chartreuse,
  },
  personChipText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  personChipTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },

  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  presetChipActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    borderColor: Colors.chartreuse,
  },
  presetChipText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  presetChipTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },

  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.4)',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    marginTop: Spacing.sm,
  },
  deleteBtnText: {
    ...Typography.labelCaps,
    color: Colors.expense,
    fontSize: 11,
    fontWeight: '700',
  },
});
