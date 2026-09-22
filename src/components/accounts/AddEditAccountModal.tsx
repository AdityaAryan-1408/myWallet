/**
 * MyWallet — Add / Edit Account Modal
 *
 * Phase 9: Full-screen modal for creating or editing bank & cash accounts.
 * - Name, Type (Bank/Cash), Balance, Institution, Primary toggle
 * - Delete with confirmation (edit mode only)
 * - SQLite persistence via financial store
 */

import React, { useState, useEffect } from 'react';
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
import {
  X,
  Check,
  Trash2,
  Landmark,
  Coins,
  Star,
  EyeOff,
} from 'lucide-react-native';

import { Account } from '@/db/schema';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

export interface AddEditAccountModalProps {
  visible: boolean;
  accountToEdit?: Account | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEditAccountModal({
  visible,
  accountToEdit,
  onClose,
  onSuccess,
}: AddEditAccountModalProps) {
  const insets = useSafeAreaInsets();
  const { createAccount, updateAccount, deleteAccount } = useFinancialStore();

  const isEdit = !!accountToEdit;

  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash'>('bank');
  const [balanceStr, setBalanceStr] = useState('');
  const [institution, setInstitution] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [excludeFromTotal, setExcludeFromTotal] = useState(false);
  const [notes, setNotes] = useState('');

  // Pre-fill for edit mode
  useEffect(() => {
    if (visible && accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setBalanceStr(accountToEdit.balance.toString());
      setInstitution(accountToEdit.institution || '');
      setIsPrimary(accountToEdit.is_primary === 1);
      setExcludeFromTotal(accountToEdit.exclude_from_total === 1);
      setNotes(accountToEdit.notes || '');
    } else if (visible) {
      setName('');
      setType('bank');
      setBalanceStr('');
      setInstitution('');
      setIsPrimary(false);
      setExcludeFromTotal(false);
      setNotes('');
    }
  }, [visible, accountToEdit]);

  const balance = parseFloat(balanceStr) || 0;
  const isValid = name.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isEdit && accountToEdit) {
      updateAccount(accountToEdit.id, {
        name: name.trim(),
        type,
        balance,
        institution: institution.trim() || null,
        is_primary: isPrimary ? 1 : 0,
        exclude_from_total: excludeFromTotal ? 1 : 0,
        notes: notes.trim() || null,
      });
    } else {
      createAccount({
        id: `acc_${Date.now()}`,
        name: name.trim(),
        type,
        balance,
        institution: institution.trim() || null,
        currency: 'INR',
        is_primary: isPrimary ? 1 : 0,
        is_active: 1,
        exclude_from_total: excludeFromTotal ? 1 : 0,
        display_order: 99,
        notes: notes.trim() || null,
      });
    }

    onSuccess?.();
    onClose();
  };

  const handleDelete = () => {
    if (!accountToEdit) return;
    Alert.alert(
      'Delete Account',
      `Remove "${accountToEdit.name}"? This cannot be undone. Transactions linked to this account will have their account reference cleared.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteAccount(accountToEdit.id);
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
            {isEdit ? 'Edit Account' : 'Add Account'}
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
          {/* ─── Type Selector ─── */}
          <Text style={styles.fieldLabel}>ACCOUNT TYPE</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                type === 'bank' && styles.typeCardActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setType('bank');
              }}
              activeOpacity={0.7}
            >
              <Landmark
                size={22}
                color={type === 'bank' ? Colors.primaryFixed : Colors.onSurfaceVariant}
              />
              <Text style={[
                styles.typeText,
                type === 'bank' && styles.typeTextActive,
              ]}>
                Bank
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                type === 'cash' && styles.typeCardActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setType('cash');
              }}
              activeOpacity={0.7}
            >
              <Coins
                size={22}
                color={type === 'cash' ? Colors.primaryFixed : Colors.onSurfaceVariant}
              />
              <Text style={[
                styles.typeText,
                type === 'cash' && styles.typeTextActive,
              ]}>
                Cash
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── Name ─── */}
          <Text style={styles.fieldLabel}>ACCOUNT NAME</Text>
          <TextInput
            style={styles.input}
            placeholder={type === 'bank' ? 'e.g. SBI Savings' : 'e.g. Physical Cash'}
            placeholderTextColor={Colors.onSurfaceVariant + '80'}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />

          {/* ─── Balance ─── */}
          <Text style={styles.fieldLabel}>CURRENT BALANCE</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={[styles.input, styles.inputWithPrefix]}
              placeholder="0"
              placeholderTextColor={Colors.onSurfaceVariant + '80'}
              value={balanceStr}
              onChangeText={setBalanceStr}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          {/* ─── Institution ─── */}
          <Text style={styles.fieldLabel}>
            {type === 'bank' ? 'BANK / INSTITUTION' : 'LOCATION'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={type === 'bank' ? 'e.g. HDFC Bank' : 'e.g. Wallet'}
            placeholderTextColor={Colors.onSurfaceVariant + '80'}
            value={institution}
            onChangeText={setInstitution}
            returnKeyType="next"
          />

          {/* ─── Primary Toggle ─── */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Star size={16} color={isPrimary ? Colors.primaryFixed : Colors.onSurfaceVariant} />
              <View>
                <Text style={styles.toggleTitle}>Primary Account</Text>
                <Text style={styles.toggleSub}>
                  Default source for expense transactions
                </Text>
              </View>
            </View>
            <Switch
              value={isPrimary}
              onValueChange={setIsPrimary}
              trackColor={{
                false: Colors.surfaceContainerHigh,
                true: 'rgba(200, 243, 34, 0.35)',
              }}
              thumbColor={isPrimary ? Colors.primaryFixed : Colors.onSurfaceVariant}
            />
          </View>

          {/* ─── Exclude from Available Toggle ─── */}
          <View style={styles.toggleRow}>
            <View style={[styles.toggleLeft, { flex: 1, paddingRight: Spacing.sm }]}>
              <EyeOff size={16} color={excludeFromTotal ? Colors.warning : Colors.onSurfaceVariant} />
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Exclude from Total</Text>
                <Text style={styles.toggleSub}>
                  Exclude balance from Available to Spend. Adding or spending here won't affect the total.
                </Text>
              </View>
            </View>
            <Switch
              value={excludeFromTotal}
              onValueChange={setExcludeFromTotal}
              trackColor={{
                false: Colors.surfaceContainerHigh,
                true: 'rgba(245, 158, 11, 0.35)',
              }}
              thumbColor={excludeFromTotal ? Colors.warning : Colors.onSurfaceVariant}
            />
          </View>

          {/* ─── Notes ─── */}
          <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Any additional details..."
            placeholderTextColor={Colors.onSurfaceVariant + '80'}
            value={notes}
            onChangeText={setNotes}
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
              <Text style={styles.deleteBtnText}>Delete Account</Text>
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

  // ─── Type Cards ──────────────────────────────────────────────────
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Shapes.xl,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  typeCardActive: {
    borderColor: Colors.primaryFixed,
    backgroundColor: 'rgba(200, 243, 34, 0.08)',
  },
  typeText: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 14,
  },
  typeTextActive: {
    color: Colors.primaryFixed,
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
