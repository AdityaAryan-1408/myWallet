/**
 * MyWallet — Add / Edit Category Modal
 * 
 * Phase 10: Complete category and subcategory creation and editing:
 * - Major category vs nested subcategory selection
 * - Expense vs Income type toggle
 * - Visual Lucide Icon Picker with search filter
 * - Curated Zenith Obsidian color palette picker
 * - Safe soft-archival that preserves historical transaction integrity
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
  Archive,
  RotateCcw,
  Search,
  Tag,
  Layers,
  ChevronDown,
} from 'lucide-react-native';

import { Category, CategoryType } from '@/db/schema';
import { CategoryIcon, AVAILABLE_CATEGORY_ICONS } from '@/components/ui/CategoryIcon';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

export const CATEGORY_PALETTE = [
  '#FF6B6B', // Soft Coral / Food
  '#FF8C32', // Vibrant Orange / Utilities
  '#FFD93D', // Warm Gold / Shopping
  '#6BCB77', // Emerald / Transport
  '#00E676', // Mint / Income
  '#00C9A7', // Teal / Health
  '#00F0FF', // Electric Cyan / Tech
  '#4D96FF', // Sky Blue / Entertainment
  '#845EC2', // Royal Purple / Education
  '#A855F7', // Violet / Investments
  '#FF6F91', // Rose / Personal Care
  '#C8F322', // Electric Chartreuse / Primary Accent
];

export interface AddEditCategoryModalProps {
  visible: boolean;
  categoryToEdit?: Category | null;
  presetParentId?: string | null;
  presetType?: CategoryType;
  onClose: () => void;
  onSuccess?: (category: Category) => void;
}

export function AddEditCategoryModal({
  visible,
  categoryToEdit,
  presetParentId = null,
  presetType = 'expense',
  onClose,
  onSuccess,
}: AddEditCategoryModalProps) {
  const insets = useSafeAreaInsets();
  const { categories, createCategory, updateCategory, archiveCategory, unarchiveCategory } =
    useFinancialStore();

  const isEdit = !!categoryToEdit;

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(presetType);
  const [parentId, setParentId] = useState<string | null>(presetParentId);
  const [icon, setIcon] = useState<string>('Tag');
  const [color, setColor] = useState<string>(CATEGORY_PALETTE[0]);
  const [iconSearch, setIconSearch] = useState('');
  const [showParentPicker, setShowParentPicker] = useState(false);

  // Available parent major categories of current type
  const availableParents = useMemo(() => {
    return categories.filter(
      (c) =>
        c.is_active === 1 &&
        c.parent_id === null &&
        c.type === type &&
        (!categoryToEdit || c.id !== categoryToEdit.id)
    );
  }, [categories, type, categoryToEdit]);

  const selectedParent = useMemo(() => {
    if (!parentId) return null;
    return categories.find((c) => c.id === parentId) || null;
  }, [categories, parentId]);

  // Pre-fill fields on open
  useEffect(() => {
    if (visible) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setType(categoryToEdit.type);
        setParentId(categoryToEdit.parent_id || null);
        setIcon(categoryToEdit.icon || 'Tag');
        setColor(categoryToEdit.color || CATEGORY_PALETTE[0]);
      } else {
        setName('');
        setType(presetType);
        setParentId(presetParentId);
        setIcon('Tag');
        setColor(CATEGORY_PALETTE[0]);
      }
      setIconSearch('');
      setShowParentPicker(false);
    }
  }, [visible, categoryToEdit, presetParentId, presetType]);

  // Filtered icons
  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return AVAILABLE_CATEGORY_ICONS;
    const q = iconSearch.toLowerCase().trim();
    return AVAILABLE_CATEGORY_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [iconSearch]);

  const isValid = name.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const trimmedName = name.trim();

    if (isEdit && categoryToEdit) {
      updateCategory(categoryToEdit.id, {
        name: trimmedName,
        type,
        parent_id: parentId,
        icon,
        color,
      });
      onSuccess?.({
        ...categoryToEdit,
        name: trimmedName,
        type,
        parent_id: parentId,
        icon,
        color,
      });
    } else {
      const newId = `cat_${Date.now()}`;
      const newCategory: Category = {
        id: newId,
        name: trimmedName,
        type,
        parent_id: parentId,
        icon,
        color,
        display_order: 99,
        is_active: 1,
        created_at: new Date().toISOString(),
      };
      createCategory(newCategory);
      onSuccess?.(newCategory);
    }

    onClose();
  };

  const handleArchive = () => {
    if (!categoryToEdit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Archive Category?',
      `Archive "${categoryToEdit.name}"?\n\nHistorical transactions will keep this category name and icon intact, but it will no longer appear when logging new transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            archiveCategory(categoryToEdit.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleUnarchive = () => {
    if (!categoryToEdit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    unarchiveCategory(categoryToEdit.id);
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

          <Text style={styles.headerTitle}>
            {isEdit
              ? parentId
                ? 'Edit Subcategory'
                : 'Edit Category'
              : parentId
                ? 'New Subcategory'
                : 'New Category'}
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
          {/* ─── Preview Card ─── */}
          <View style={styles.previewCard}>
            <View style={[styles.previewIconBox, { backgroundColor: `${color}25` }]}>
              <CategoryIcon name={icon} size={28} color={color} />
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{name.trim() || 'Category Name'}</Text>
              <Text style={styles.previewSub}>
                {selectedParent ? `Subcategory of ${selectedParent.name}` : `${type.toUpperCase()} CATEGORY`}
              </Text>
            </View>
          </View>

          {/* ─── Type Segmented Selector (Disabled if subcategory) ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY TYPE</Text>
            <View style={styles.typeSelector}>
              {(['expense', 'income'] as CategoryType[]).map((t) => {
                const isSelected = type === t;
                const activeColor = t === 'income' ? Colors.income : Colors.expense;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typePill,
                      isSelected && {
                        backgroundColor: `${activeColor}20`,
                        borderColor: activeColor,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setType(t);
                      setParentId(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        isSelected && { color: activeColor, fontWeight: '700' },
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ─── Name Input ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY NAME</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Dining Out, Freelance, Fuel"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={name}
              onChangeText={setName}
              autoFocus={!isEdit}
            />
          </View>

          {/* ─── Parent Category (Subcategory Mode) ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PARENT CATEGORY (OPTIONAL)</Text>
            <TouchableOpacity
              style={styles.parentSelectorBtn}
              onPress={() => {
                Haptics.selectionAsync();
                setShowParentPicker(!showParentPicker);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.parentBtnLeft}>
                <Layers size={16} color={selectedParent ? color : Colors.onSurfaceVariant} />
                <Text style={styles.parentBtnText}>
                  {selectedParent ? `Under: ${selectedParent.name}` : 'None (Top-Level Category)'}
                </Text>
              </View>
              <ChevronDown size={16} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>

            {showParentPicker && (
              <View style={styles.parentDropdown}>
                <TouchableOpacity
                  style={[styles.parentOption, parentId === null && styles.parentOptionActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setParentId(null);
                    setShowParentPicker(false);
                  }}
                >
                  <Text style={[styles.parentOptionText, parentId === null && styles.parentOptionTextActive]}>
                    • None (Top-Level Category)
                  </Text>
                </TouchableOpacity>

                {availableParents.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.parentOption, parentId === p.id && styles.parentOptionActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setParentId(p.id);
                      setColor(p.color);
                      setShowParentPicker(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CategoryIcon name={p.icon} size={14} color={p.color} />
                      <Text
                        style={[
                          styles.parentOptionText,
                          parentId === p.id && styles.parentOptionTextActive,
                        ]}
                      >
                        {p.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ─── Color Palette Picker ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACCENT COLOR</Text>
            <View style={styles.colorPaletteGrid}>
              {CATEGORY_PALETTE.map((c) => {
                const isSelected = color === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      isSelected && styles.colorSwatchSelected,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setColor(c);
                    }}
                    activeOpacity={0.8}
                  >
                    {isSelected && <Check size={14} color="#000" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ─── Icon Picker ─── */}
          <View style={styles.section}>
            <View style={styles.iconSectionHeader}>
              <Text style={styles.sectionLabel}>CHOOSE ICON</Text>
              <View style={styles.iconSearchBox}>
                <Search size={14} color={Colors.onSurfaceVariant} />
                <TextInput
                  style={styles.iconSearchInput}
                  placeholder="Search icons..."
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={iconSearch}
                  onChangeText={setIconSearch}
                />
              </View>
            </View>

            <View style={styles.iconsGrid}>
              {filteredIcons.map((iconName) => {
                const isSelected = icon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[
                      styles.iconBtn,
                      isSelected && {
                        backgroundColor: `${color}30`,
                        borderColor: color,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setIcon(iconName);
                    }}
                    activeOpacity={0.7}
                  >
                    <CategoryIcon
                      name={iconName}
                      size={20}
                      color={isSelected ? color : Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ─── Archival Actions (Edit Mode Only) ─── */}
          {isEdit && categoryToEdit && (
            <View style={styles.dangerSection}>
              {categoryToEdit.is_active === 1 ? (
                <TouchableOpacity
                  style={styles.archiveBtn}
                  onPress={handleArchive}
                  activeOpacity={0.7}
                >
                  <Archive size={16} color={Colors.expense} />
                  <Text style={styles.archiveBtnText}>Archive Category</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.archiveBtn, { borderColor: Colors.chartreuse }]}
                  onPress={handleUnarchive}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={16} color={Colors.chartreuse} />
                  <Text style={[styles.archiveBtnText, { color: Colors.chartreuse }]}>
                    Restore Category
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={styles.archiveHint}>
                Archiving keeps all historical transactions linked to this category for accurate reporting.
              </Text>
            </View>
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

  // Preview Card
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  previewIconBox: {
    width: 54,
    height: 54,
    borderRadius: Shapes.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
    gap: 3,
  },
  previewName: {
    ...Typography.bodyLg,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 18,
  },
  previewSub: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 0.8,
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

  // Type Selector
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    alignItems: 'center',
  },
  typePillText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
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

  // Parent Category
  parentSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  parentBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  parentBtnText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    fontSize: 14,
  },
  parentDropdown: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    marginTop: 4,
    overflow: 'hidden',
  },
  parentOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  parentOptionActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
  },
  parentOptionText: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    fontSize: 13,
  },
  parentOptionTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },

  // Color Swatches
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // Icons Grid
  iconSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    width: 140,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  iconSearchInput: {
    flex: 1,
    color: Colors.onSurface,
    fontSize: 11,
    padding: 0,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },

  // Danger / Archive Section
  dangerSection: {
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeSubtle,
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.4)',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
  },
  archiveBtnText: {
    ...Typography.labelCaps,
    color: Colors.expense,
    fontSize: 11,
    fontWeight: '700',
  },
  archiveHint: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
