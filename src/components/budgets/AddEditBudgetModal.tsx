/**
 * MyWallet — Add / Edit Budget Target Modal
 * 
 * Create or modify category monthly budget targets:
 * - Select from available expense categories (or inspect current)
 * - Numeric budget quota input with quick amount presets (₹500, ₹1K, ₹2.5K, ₹5K, ₹10K)
 * - Real-time daily pacing preview (≈ ₹X/day)
 * - Safe delete flow with confirmation alert and store refresh
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
import { X, Trash2, Check, Sparkles } from 'lucide-react-native';

import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Category } from '@/db/schema';
import { BudgetWithProgress, BudgetRepository } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

const AMOUNT_PRESETS = [500, 1000, 2500, 5000, 10000];

interface AddEditBudgetModalProps {
  visible: boolean;
  budgetToEdit?: BudgetWithProgress | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEditBudgetModal({
  visible,
  budgetToEdit,
  onClose,
  onSuccess,
}: AddEditBudgetModalProps) {
  const insets = useSafeAreaInsets();
  const { setBudget, deleteBudget, refreshFinancials } = useFinancialStore();

  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');

  useEffect(() => {
    if (visible) {
      if (budgetToEdit) {
        setSelectedCategoryId(budgetToEdit.categoryId);
        setAmountStr(`${budgetToEdit.budgetAmount}`);
      } else {
        const unbudgeted = BudgetRepository.getUnbudgetedExpenseCategories();
        setAvailableCategories(unbudgeted);
        setSelectedCategoryId(unbudgeted.length > 0 ? unbudgeted[0].id : '');
        setAmountStr('2500');
      }
    }
  }, [visible, budgetToEdit]);

  const parsedAmount = parseFloat(amountStr) || 0;

  // Calculate daily pacing preview for current month
  const pacingPreview = useMemo(() => {
    if (parsedAmount <= 0) return null;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - now.getDate());
    const dailyAllowance = Math.round(parsedAmount / daysInMonth);
    return {
      dailyAllowance,
      daysRemaining,
    };
  }, [parsedAmount]);

  const handleSave = () => {
    if (!selectedCategoryId) {
      Alert.alert('Category Missing', 'Please select an expense category to budget.');
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a budget target greater than ₹0.');
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }

    setBudget(selectedCategoryId, parsedAmount);
    refreshFinancials();
    onSuccess?.();
    onClose();
  };

  const handleDelete = () => {
    if (!budgetToEdit) return;

    Alert.alert(
      'Delete Budget Target',
      `Are you sure you want to delete the budget for "${budgetToEdit.categoryName}"?\n\nHistorical transactions in this category will not be touched.`,
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
            deleteBudget(budgetToEdit.id);
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

          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={Colors.onSurface} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {budgetToEdit ? 'EDIT MONTHLY BUDGET' : 'NEW BUDGET TARGET'}
            </Text>

            {budgetToEdit ? (
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
            {/* Category Selector / Display */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>CATEGORY</Text>

              {budgetToEdit ? (
                <View style={styles.readonlyCategoryCard}>
                  <View
                    style={[
                      styles.catIconCircle,
                      { backgroundColor: `${budgetToEdit.categoryColor}25` },
                    ]}
                  >
                    <CategoryIcon
                      name={budgetToEdit.categoryIcon}
                      size={20}
                      color={budgetToEdit.categoryColor}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catNameText}>{budgetToEdit.categoryName}</Text>
                    <Text style={styles.catSubText}>Currently budgeted</Text>
                  </View>
                </View>
              ) : availableCategories.length > 0 ? (
                <View style={styles.categoryGrid}>
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catPill,
                          isSelected && {
                            borderColor: Colors.primaryFixed,
                            backgroundColor: 'rgba(216, 253, 74, 0.08)',
                          },
                        ]}
                        onPress={() => setSelectedCategoryId(cat.id)}
                        activeOpacity={0.7}
                      >
                        <CategoryIcon
                          name={cat.icon}
                          size={15}
                          color={isSelected ? Colors.primaryFixed : cat.color}
                        />
                        <Text
                          style={[
                            styles.catPillText,
                            isSelected && { color: Colors.primaryFixed, fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                        {isSelected && <Check size={13} color={Colors.primaryFixed} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyCategoriesText}>
                  All expense categories currently have budget targets assigned.
                </Text>
              )}
            </View>

            {/* Monthly Budget Quota Input */}
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>MONTHLY TARGET QUOTA (₹)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.numericInput}
                  placeholder="2500"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={amountStr}
                  onChangeText={(t) => setAmountStr(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={7}
                  autoFocus={!budgetToEdit}
                />
              </View>
            </View>

            {/* Quick Amount Presets */}
            <View style={styles.presetsRow}>
              {AMOUNT_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetChip}
                  onPress={() => {
                    setAmountStr(`${preset}`);
                    if (Platform.OS !== 'web') {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>₹{preset.toLocaleString('en-IN')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pacing Preview Card */}
            {pacingPreview && (
              <View style={styles.pacingBanner}>
                <Sparkles size={16} color={Colors.primaryFixed} />
                <View style={styles.pacingInfo}>
                  <Text style={styles.pacingTitle}>
                    Pacing Target: ≈ ₹{pacingPreview.dailyAllowance.toLocaleString('en-IN')} / day
                  </Text>
                  <Text style={styles.pacingSub}>
                    Provides a smooth daily spend pace for the month without overshooting.
                  </Text>
                </View>
              </View>
            )}

            {/* Save CTA Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {budgetToEdit ? 'Save Budget Changes' : 'Create Budget Target'}
              </Text>
            </TouchableOpacity>

            {/* Delete Option when editing */}
            {budgetToEdit && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Trash2 size={15} color={Colors.expense} />
                <Text style={styles.deleteBtnText}>Delete This Budget</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },
  fieldBox: {
    gap: 8,
  },
  fieldLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  readonlyCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  catIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catNameText: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontSize: 14,
    fontFamily: FontFamily.headingSemiBold,
  },
  catSubText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeLight,
    borderRadius: Shapes.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catPillText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    fontSize: 12,
  },
  emptyCategoriesText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  currencyPrefix: {
    fontFamily: FontFamily.numericBold,
    fontSize: 22,
    color: Colors.primaryFixed,
    marginRight: 6,
  },
  numericInput: {
    flex: 1,
    height: 52,
    fontFamily: FontFamily.numericBold,
    fontSize: 24,
    color: Colors.onSurface,
    fontVariant: ['tabular-nums'],
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    borderRadius: Shapes.pill,
  },
  presetChipText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  pacingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(216, 253, 74, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(216, 253, 74, 0.25)',
    borderRadius: Shapes.lg,
    padding: 12,
  },
  pacingInfo: {
    flex: 1,
    gap: 2,
  },
  pacingTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
    color: Colors.primaryFixed,
  },
  pacingSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  submitBtn: {
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 14,
    borderRadius: Shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  },
  deleteBtnText: {
    ...Typography.bodyMdMedium,
    color: Colors.expense,
    fontWeight: '600',
    fontSize: 13,
  },
});
