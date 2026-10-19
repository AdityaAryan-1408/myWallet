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
  RotateCcw,
  Handshake,
} from 'lucide-react-native';

import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CategoryPicker } from '@/components/transaction/CategoryPicker';
import { CategoryType } from '@/db/schema';
import { TransactionWithDetails, TransactionRepository, TemporaryTransactionRepository } from '@/repositories';
import { useFinancialStore, useTemporaryTransactionStore } from '@/stores';
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

  // Full Transaction Edit Mode (Amount, Category, Subcategory, Note)
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editSubcategoryId, setEditSubcategoryId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  React.useEffect(() => {
    if (transaction) {
      setEditAmount(String(transaction.amount));
      setEditCategoryId(transaction.category_id || '');
      setEditSubcategoryId(transaction.subcategory_id || null);
      setEditNote(transaction.note || '');
    }
    setIsEditing(false);
    setIsEditingNote(false);
  }, [transaction?.id]);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const isCreditCard = Boolean(transaction.credit_card_id);
  const isTemp = Boolean(transaction.is_temporary);
  const isReturned = transaction.is_returned === 1;

  const amountColor = isTemp
    ? (isReturned ? Colors.income : Colors.chartreuse)
    : isIncome
    ? Colors.income
    : isTransfer
    ? Colors.transfer
    : Colors.onSurface;

  const amountSign = isIncome ? '+' : isTransfer ? '⇄ ' : '−';

  const handleClose = () => {
    setIsEditing(false);
    setIsEditingNote(false);
    onClose();
  };

  const startFullEdit = () => {
    if (!transaction) return;
    setEditAmount(String(transaction.amount));
    setEditCategoryId(transaction.category_id || '');
    setEditSubcategoryId(transaction.subcategory_id || null);
    setEditNote(transaction.note || '');
    setIsEditing(true);
  };

  const handleSaveFullEdit = () => {
    if (!transaction) return;
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }

    if (isTemp) {
      TemporaryTransactionRepository.update(transaction.id, {
        amount: num,
        category_id: editCategoryId || null,
        notes: editNote.trim() || null,
        title: editNote.trim() || transaction.note || 'Paid on Behalf',
      });
      useTemporaryTransactionStore.getState().refresh();
    } else {
      const updatedTx = {
        ...transaction,
        amount: num,
        category_id: !isTransfer ? (editCategoryId || null) : null,
        subcategory_id: !isTransfer ? (editSubcategoryId || null) : null,
        note: editNote.trim() || (isTransfer ? 'Transfer' : 'Quick Expense'),
      };
      TransactionRepository.update(updatedTx);
    }

    refreshFinancials();
    setIsEditing(false);
    onUpdated?.();
  };

  const handleMarkReturned = () => {
    Alert.alert(
      'Mark as Returned',
      `Have you received ₹${transaction.amount.toLocaleString('en-IN')} back${
        transaction.person_name ? ` from ${transaction.person_name}` : ''
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Returned',
          onPress: () => {
            if (Platform.OS !== 'web') {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
            }
            TemporaryTransactionRepository.markAsReturned(transaction.id);
            useTemporaryTransactionStore.getState().refresh();
            refreshFinancials();
            onUpdated?.();
            onClose();
          },
        },
      ]
    );
  };

  const handleMarkPending = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    TemporaryTransactionRepository.markAsPending(transaction.id);
    useTemporaryTransactionStore.getState().refresh();
    refreshFinancials();
    onUpdated?.();
    onClose();
  };

  // Handle Delete with balance restoration
  const handleDelete = () => {
    if (isTemp) {
      Alert.alert(
        'Delete Record',
        `Are you sure you want to delete this temporary advance of ₹${transaction.amount.toLocaleString('en-IN')}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (Platform.OS !== 'web') {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                } catch {}
              }
              TemporaryTransactionRepository.delete(transaction.id);
              useTemporaryTransactionStore.getState().refresh();
              refreshFinancials();
              onUpdated?.();
              onClose();
            },
          },
        ]
      );
      return;
    }

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
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Top Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {isEditing ? 'EDIT TRANSACTION' : 'TRANSACTION DETAILS'}
            </Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.iconButton, isEditing && styles.editButtonActive]}
                onPress={() => {
                  if (isEditing) {
                    setIsEditing(false);
                  } else {
                    startFullEdit();
                  }
                }}
                activeOpacity={0.7}
              >
                <Edit2 size={16} color={isEditing ? Colors.chartreuse : Colors.onSurface} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconButton, styles.deleteButton]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={Colors.expense} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isEditing ? (
              <View style={styles.editFormCard}>
                {/* 1. Amount Edit */}
                <View style={styles.editFieldGroup}>
                  <Text style={styles.editFieldLabel}>AMOUNT (₹)</Text>
                  <View style={styles.editAmountInputWrap}>
                    <Text style={styles.editCurrencyPrefix}>₹</Text>
                    <TextInput
                      style={styles.editAmountInput}
                      value={editAmount}
                      onChangeText={setEditAmount}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={Colors.onSurfaceVariant}
                      selectTextOnFocus
                    />
                  </View>
                </View>

                {/* 2. Category & Subcategory Picker (if not transfer) */}
                {!isTransfer && (
                  <View style={styles.editFieldGroup}>
                    <Text style={styles.editFieldLabel}>CATEGORY</Text>
                    <CategoryPicker
                      type={isIncome ? 'income' : 'expense'}
                      selectedCategoryId={editCategoryId}
                      selectedSubcategoryId={editSubcategoryId}
                      onSelectCategory={(catId) => {
                        setEditCategoryId(catId);
                        setEditSubcategoryId(null);
                      }}
                      onSelectSubcategory={setEditSubcategoryId}
                    />
                  </View>
                )}

                {/* 3. Note / Description */}
                <View style={styles.editFieldGroup}>
                  <Text style={styles.editFieldLabel}>NOTE / DESCRIPTION</Text>
                  <TextInput
                    style={styles.editNoteInput}
                    value={editNote}
                    onChangeText={setEditNote}
                    placeholder="Add note or merchant..."
                    placeholderTextColor={Colors.onSurfaceVariant}
                  />
                </View>

                {/* 4. Action Buttons */}
                <View style={styles.editActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelEditBtn}
                    onPress={() => setIsEditing(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveEditBtn}
                    onPress={handleSaveFullEdit}
                    activeOpacity={0.8}
                  >
                    <Check size={16} color="#000000" strokeWidth={2.5} />
                    <Text style={styles.saveEditText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {/* Big Amount & Type Card */}
                <View style={styles.amountHero}>
              <View
                style={[
                  styles.typePill,
                  isTemp && styles.tempPill,
                  isIncome && styles.incomePill,
                  isTransfer && styles.transferPill,
                ]}
              >
                <Text
                  style={[
                    styles.typePillText,
                    isTemp && { color: isReturned ? Colors.income : Colors.chartreuse },
                    isIncome && { color: Colors.income },
                    isTransfer && { color: Colors.transfer },
                  ]}
                >
                  {isTemp
                    ? (isReturned ? 'RETURNED ADVANCE' : 'PAID ON BEHALF')
                    : transaction.type.toUpperCase()}
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

              {/* Recipient Friend / Person (if temporary) */}
              {isTemp && transaction.person_name ? (
                <View style={styles.metaRow}>
                  <View style={styles.metaLeft}>
                    <View style={styles.miniIconCircle}>
                      <Handshake size={15} color={Colors.chartreuse} />
                    </View>
                    <Text style={styles.metaLabel}>Paid For</Text>
                  </View>
                  <Text style={[styles.metaValue, { color: Colors.chartreuse, fontWeight: '700' }]}>
                    {transaction.person_name}
                  </Text>
                </View>
              ) : null}

              {/* Status (if temporary) */}
              {isTemp && (
                <View style={styles.metaRow}>
                  <View style={styles.metaLeft}>
                    <View style={styles.miniIconCircle}>
                      {isReturned ? (
                        <Check size={15} color={Colors.income} />
                      ) : (
                        <Clock size={15} color={Colors.warning} />
                      )}
                    </View>
                    <Text style={styles.metaLabel}>Reimbursement</Text>
                  </View>
                  <Text style={[styles.metaValue, { color: isReturned ? Colors.income : Colors.warning, fontWeight: '700' }]}>
                    {isReturned ? `Returned (${transaction.returned_date || transaction.date})` : 'Waiting for Return'}
                  </Text>
                </View>
              )}
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

            {/* Mark as Returned / Reopen CTA (for temporary advances) */}
            {isTemp && (
              !isReturned ? (
                <TouchableOpacity
                  style={styles.markReturnedCta}
                  onPress={handleMarkReturned}
                  activeOpacity={0.8}
                >
                  <Check size={16} color="#000000" strokeWidth={2.5} />
                  <Text style={styles.markReturnedCtaText}>Mark as Returned / Reimbursed</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.reopenCta}
                  onPress={handleMarkPending}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={15} color={Colors.onSurface} />
                  <Text style={styles.reopenCtaText}>Reopen as Pending Advance</Text>
                </TouchableOpacity>
              )
            )}

            {/* Delete CTA button */}
            <TouchableOpacity
              style={styles.deleteCta}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Trash2 size={16} color={Colors.expense} />
              <Text style={styles.deleteCtaText}>
                {isTemp ? 'Delete Advance Record' : 'Delete Transaction'}
              </Text>
            </TouchableOpacity>
              </>
            )}
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
  tempPill: {
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    borderColor: 'rgba(200, 243, 34, 0.3)',
  },
  markReturnedCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.chartreuse,
    marginTop: 4,
  },
  markReturnedCtaText: {
    ...Typography.bodyMdMedium,
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  reopenCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    marginTop: 4,
  },
  reopenCtaText: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButtonActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.15)',
    borderWidth: 1,
    borderColor: Colors.chartreuse,
  },
  editFormCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  editFieldGroup: {
    gap: 8,
  },
  editFieldLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    fontSize: 11,
  },
  editAmountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  editCurrencyPrefix: {
    fontFamily: FontFamily.numericBold,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryFixed,
    marginRight: 6,
  },
  editAmountInput: {
    flex: 1,
    fontFamily: FontFamily.numericBold,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
    paddingVertical: 10,
  },
  editNoteInput: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  editActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  cancelEditBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  cancelEditText: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 13,
  },
  saveEditBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.chartreuse,
  },
  saveEditText: {
    ...Typography.bodyMdMedium,
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
});
