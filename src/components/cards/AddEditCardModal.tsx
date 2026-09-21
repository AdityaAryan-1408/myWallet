/**
 * MyWallet — Add / Edit Credit Card Modal
 * 
 * Form to create or update credit cards:
 * - Card name, bank issuer, credit limit, cycle reset day (1..31)
 * - Last 4 digits, custom card metallic theme color
 * - SQLite persistence and reactive financial store refresh
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
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, CreditCard as CreditCardIcon, Check, Trash2 } from 'lucide-react-native';

import { CreditCard } from '@/db/schema';
import { CreditCardRepository } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation } from '@/theme';

const CARD_COLORS = [
  '#1E3A8A', // Deep Navy
  '#7C2D12', // Crimson
  '#581C87', // Royal Purple
  '#064E3B', // Emerald
  '#1F2937', // Charcoal Slate
  '#78350F', // Amber Bronze
  '#0F766E', // Teal
  '#831843', // Rose
];

export interface AddEditCardModalProps {
  visible: boolean;
  cardToEdit?: CreditCard | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEditCardModal({
  visible,
  cardToEdit,
  onClose,
  onSuccess,
}: AddEditCardModalProps) {
  const insets = useSafeAreaInsets();
  const { refreshFinancials } = useFinancialStore();

  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [resetDayStr, setResetDayStr] = useState('20');
  const [last4, setLast4] = useState('');
  const [color, setColor] = useState(CARD_COLORS[0]);

  useEffect(() => {
    if (visible) {
      if (cardToEdit) {
        setName(cardToEdit.name);
        setIssuer(cardToEdit.issuer);
        setLimitStr(`${cardToEdit.credit_limit}`);
        setResetDayStr(`${cardToEdit.cycle_reset_day}`);
        setLast4(cardToEdit.last4 || '');
        setColor(cardToEdit.color || CARD_COLORS[0]);
      } else {
        setName('');
        setIssuer('');
        setLimitStr('100000');
        setResetDayStr('20');
        setLast4('');
        setColor(CARD_COLORS[0]);
      }
    }
  }, [visible, cardToEdit]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter a card name.');
      return;
    }

    const limit = parseFloat(limitStr);
    if (isNaN(limit) || limit <= 0) {
      Alert.alert('Invalid Limit', 'Please enter a valid credit limit.');
      return;
    }

    const resetDay = parseInt(resetDayStr, 10);
    if (isNaN(resetDay) || resetDay < 1 || resetDay > 31) {
      Alert.alert('Invalid Reset Day', 'Cycle reset day must be between 1 and 31.');
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }

    if (cardToEdit) {
      CreditCardRepository.update({
        ...cardToEdit,
        name: name.trim(),
        issuer: issuer.trim() || 'Bank',
        credit_limit: limit,
        cycle_reset_day: resetDay,
        last4: last4.trim() || null,
        color,
      });
    } else {
      CreditCardRepository.create({
        id: `card_${Date.now()}`,
        name: name.trim(),
        issuer: issuer.trim() || 'Bank',
        credit_limit: limit,
        cycle_reset_day: resetDay,
        is_active: 1,
        notes: null,
        last4: last4.trim() || null,
        color,
      });
    }

    refreshFinancials();
    onSuccess?.();
    onClose();
  };

  const handleDelete = () => {
    if (!cardToEdit) return;
    Alert.alert(
      'Delete Credit Card',
      `Are you sure you want to delete "${cardToEdit.name}"?\n\nThis card will be removed from your active credit cards and portfolio. Any historical transactions linked to this card will remain in your activity ledger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            CreditCardRepository.delete(cardToEdit.id);
            if (Platform.OS !== 'web') {
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
            }
            refreshFinancials();
            onSuccess?.();
            onClose();
          },
        },
      ]
    );
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

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {cardToEdit ? 'EDIT CREDIT CARD' : 'ADD NEW CARD'}
            </Text>
            {cardToEdit ? (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={Colors.expense} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 34 }} />
            )}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Card Preview Chip */}
            <View style={[styles.previewCard, { backgroundColor: color }]}>
              <View style={styles.previewTop}>
                <CreditCardIcon size={22} color="#FFFFFF" />
                <Text style={styles.previewIssuer}>{issuer || 'Bank Name'}</Text>
              </View>
              <Text style={styles.previewName}>{name || 'Card Name'}</Text>
              <View style={styles.previewBottom}>
                <Text style={styles.previewNumber}>•••• •••• •••• {last4 || '4092'}</Text>
                <Text style={styles.previewCycle}>Cycle: {resetDayStr}th</Text>
              </View>
            </View>

            {/* Field: Card Name */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>CARD NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. HDFC Millennia, Amazon Pay ICICI"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Field: Issuer */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>ISSUING BANK</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. HDFC Bank, ICICI Bank, SBI Cards"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={issuer}
                onChangeText={setIssuer}
              />
            </View>

            {/* Dual Row: Credit Limit & Reset Day */}
            <View style={styles.dualRow}>
              <View style={[styles.fieldBox, { flex: 1.2 }]}>
                <Text style={styles.fieldLabel}>CREDIT LIMIT (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="150000"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={limitStr}
                  onChangeText={(t) => setLimitStr(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.fieldBox, { flex: 0.8 }]}>
                <Text style={styles.fieldLabel}>RESET DAY (1-31)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="20"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={resetDayStr}
                  onChangeText={(t) => setResetDayStr(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            {/* Field: Last 4 digits */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>LAST 4 DIGITS</Text>
              <TextInput
                style={styles.input}
                placeholder="4092"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={last4}
                onChangeText={(t) => setLast4(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            {/* Color Swatch Picker */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>CARD METALLIC COLOR</Text>
              <View style={styles.swatchRow}>
                {CARD_COLORS.map((c) => {
                  const isSelected = color === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.swatch, { backgroundColor: c }, isSelected && styles.swatchSelected]}
                      onPress={() => setColor(c)}
                      activeOpacity={0.8}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {cardToEdit ? 'Save Changes' : 'Create Credit Card'}
              </Text>
            </TouchableOpacity>

            {/* Delete Option (only when editing an existing card) */}
            {cardToEdit && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Trash2 size={15} color={Colors.expense} />
                <Text style={styles.deleteBtnText}>Delete Credit Card</Text>
              </TouchableOpacity>
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
  previewCard: {
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    height: 130,
    justifyContent: 'space-between',
    ...Elevation.medium,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewIssuer: {
    ...Typography.labelCaps,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
  previewName: {
    ...Typography.headlineSm,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  previewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewNumber: {
    ...Typography.bodySm,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
  },
  previewCycle: {
    ...Typography.labelCaps,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
  },
  fieldBox: {
    gap: 6,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    fontSize: 13,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: Colors.primaryFixed,
  },
  submitBtn: {
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 14,
    borderRadius: Shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Elevation.medium,
  },
  submitBtnText: {
    ...Typography.bodyMdMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
    borderRadius: Shapes.pill,
    paddingVertical: 13,
    marginTop: 12,
  },
  deleteBtnText: {
    ...Typography.bodyMdMedium,
    color: Colors.expense,
    fontWeight: '600',
    fontSize: 13,
  },
});
