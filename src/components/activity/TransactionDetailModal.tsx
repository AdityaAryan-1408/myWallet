/**
 * MyWallet — Transaction Detail Modal
 * 
 * Sleek bottom sheet modal displaying comprehensive transaction metadata:
 * - Large monetary display with type badge
 * - Account / Source & Category / Subcategory
 * - Calculator expression preview (if entered via formula mode)
 * - Editable note field
 * - Safe Delete action with confirmation and balance rollback
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Trash2,
  Calendar,
  Clock,
  Wallet,
  CreditCard,
  Calculator,
  FileText,
  Check,
  Edit2,
  ArrowRightLeft,
} from 'lucide-react-native';

import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { TransactionWithDetails, TransactionRepository } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

export interface TransactionDetailModalProps {
  visible: boolean;
  transaction: TransactionWithDetails | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function TransactionDetailModal({
  visible,
  transaction,
  onClose,
  onUpdated,
}: TransactionDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { refreshFinancials } = useFinancialStore();

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState('');

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const isCreditCard = Boolean(transaction.credit_card_id);

  const amountColor = isIncome
    ? Colors.income
    : isTransfer
    ? Colors.transfer
    : Colors.onSurface;

  const amountSign = isIncome ? '+' : isTransfer ? '⇄ ' : '−';

  // Handle Delete with balance restoration
  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete this ${transaction.type}? The financial balances will be automatically restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
            }
            TransactionRepository.delete(transaction.id);
            refreshFinancials();
            onUpdated?.();
            onClose();
          },
        },
      ]
    );
  };

  // Handle Edit Note save
  const handleSaveNote = () => {
    if (!editedNote.trim() && !transaction.note) {
      setIsEditingNote(false);
      return;
    }

    const updated = {
      ...transaction,
      note: editedNote.trim(),
    };

    TransactionRepository.update(updated);
    refreshFinancials();
    setIsEditingNote(false);
    onUpdated?.();
  };

  const startEditingNote = () => {
    setEditedNote(transaction.note || '');
    setIsEditingNote(true);
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
          {/* Top Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>TRANSACTION DETAILS</Text>

            <TouchableOpacity
              style={[styles.iconButton, styles.deleteButton]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={Colors.expense} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Big Amount & Type Card */}
            <View style={styles.amountHero}>
              <View
                style={[
                  styles.typePill,
                  isIncome && styles.incomePill,
                  isTransfer && styles.transferPill,
                ]}
              >
                <Text
                  style={[
                    styles.typePillText,
                    isIncome && { color: Colors.income },
                    isTransfer && { color: Colors.transfer },
                  ]}
                >
                  {transaction.type.toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.amountDisplay, { color: amountColor }]}>
                {amountSign}₹{transaction.amount.toLocaleString('en-IN')}
                <Text style={styles.decimalText}>.00</Text>
              </Text>

              {transaction.expression && (
                <View style={styles.formulaRow}>
                  <Calculator size={13} color={Colors.onSurfaceVariant} />
                  <Text style={styles.formulaText}>Formula: {transaction.expression}</Text>
                </View>
              )}
            </View>

            {/* Metadata Rows */}
            <View style={styles.metaCard}>
              {/* Category Row */}
              {!isTransfer && (
                <View style={styles.metaRow}>
                  <View style={styles.metaLeft}>
                    <View
                      style={[
                        styles.miniIconCircle,
                        { backgroundColor: `${transaction.category_color || Colors.chartreuse}20` },
                      ]}
                    >
                      <CategoryIcon
                        name={transaction.category_icon || 'ShoppingBag'}
                        size={15}
                        color={transaction.category_color || Colors.chartreuse}
                      />
                    </View>
                    <Text style={styles.metaLabel}>Category</Text>
                  </View>
                  <View style={styles.metaRight}>
                    <Text style={styles.metaValue}>
                      {transaction.category_name || 'Uncategorized'}
                    </Text>
                    {transaction.subcategory_name && (
                      <Text style={styles.metaSub}>› {transaction.subcategory_name}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Source Account / Credit Card */}
              <View style={styles.metaRow}>
                <View style={styles.metaLeft}>
                  <View style={styles.miniIconCircle}>
                    {isCreditCard ? (
                      <CreditCard size={15} color={Colors.warning} />
                    ) : (
                      <Wallet size={15} color={Colors.primaryFixed} />
                    )}
                  </View>
                  <Text style={styles.metaLabel}>
                    {isCreditCard ? 'Credit Card' : isTransfer ? 'From Account' : 'Account'}
                  </Text>
                </View>
                <Text style={styles.metaValue}>
                  {transaction.account_name || transaction.credit_card_name || 'Primary Account'}
                </Text>
              </View>

              {/* Destination Account (if Transfer) */}
              {isTransfer && (
                <View style={styles.metaRow}>
                  <View style={styles.metaLeft}>
                    <View style={styles.miniIconCircle}>
                      <ArrowRightLeft size={15} color={Colors.transfer} />
                    </View>
                    <Text style={styles.metaLabel}>To Account</Text>
                  </View>
                  <Text style={[styles.metaValue, { color: Colors.transfer }]}>
                    {transaction.dest_account_name || 'Destination Account'}
                  </Text>
                </View>
              )}

              {/* Date & Time */}
              <View style={styles.metaRow}>
                <View style={styles.metaLeft}>
                  <View style={styles.miniIconCircle}>
                    <Calendar size={15} color={Colors.onSurfaceVariant} />
                  </View>
                  <Text style={styles.metaLabel}>Date & Time</Text>
                </View>
                <View style={styles.metaRight}>
                  <Text style={styles.metaValue}>{transaction.date}</Text>
                  <Text style={styles.metaSub}>{transaction.time ? transaction.time.slice(0, 5) : '00:00'}</Text>
                </View>
              </View>
            </View>

            {/* Note Section (with inline edit) */}
            <View style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.noteHeaderLeft}>
                  <FileText size={14} color={Colors.onSurfaceVariant} />
                  <Text style={styles.noteTitle}>NOTE / MEMO</Text>
                </View>
                {!isEditingNote ? (
                  <TouchableOpacity
                    onPress={startEditingNote}
                    style={styles.editNoteBtn}
                    activeOpacity={0.7}
                  >
                    <Edit2 size={12} color={Colors.primaryFixed} />
                    <Text style={styles.editNoteText}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleSaveNote}
                    style={styles.saveNoteBtn}
                    activeOpacity={0.7}
                  >
                    <Check size={12} color={Colors.onPrimary} />
                    <Text style={styles.saveNoteText}>Save</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isEditingNote ? (
                <TextInput
                  style={styles.noteInput}
                  value={editedNote}
                  onChangeText={setEditedNote}
                  placeholder="Add a note..."
                  placeholderTextColor={Colors.onSurfaceVariant}
                  autoFocus
                  multiline
                />
              ) : (
                <Text style={styles.noteContent}>
                  {transaction.note || 'No note added for this transaction.'}
                </Text>
              )}
            </View>

            {/* Delete CTA button */}
            <TouchableOpacity
              style={styles.deleteCta}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Trash2 size={16} color={Colors.expense} />
              <Text style={styles.deleteCtaText}>Delete Transaction</Text>
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
    maxHeight: '85%',
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
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: 'rgba(255, 82, 82, 0.25)',
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.md,
  },
  amountHero: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  typePill: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
  },
  incomePill: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderColor: 'rgba(0, 230, 118, 0.25)',
  },
  transferPill: {
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderColor: 'rgba(34, 211, 238, 0.25)',
  },
  typePillText: {
    ...Typography.labelCaps,
    fontSize: 10,
    color: Colors.expense,
    fontWeight: '700',
    letterSpacing: 1,
  },
  amountDisplay: {
    fontFamily: FontFamily.numericBold,
    fontSize: 38,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  decimalText: {
    fontSize: 22,
    color: Colors.onSurfaceVariant,
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
  },
  formulaText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  metaCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaValue: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  metaSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 1,
  },
  noteCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteTitle: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  editNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editNoteText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontSize: 11,
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  saveNoteText: {
    ...Typography.bodySmMedium,
    color: Colors.onPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  noteContent: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontSize: 13,
    lineHeight: 18,
  },
  noteInput: {
    ...Typography.bodyMd,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.md,
    padding: 10,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.strokeBright,
  },
  deleteCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Shapes.pill,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
    marginTop: 4,
  },
  deleteCtaText: {
    ...Typography.bodyMdMedium,
    color: Colors.expense,
    fontWeight: '700',
    fontSize: 13,
  },
});
