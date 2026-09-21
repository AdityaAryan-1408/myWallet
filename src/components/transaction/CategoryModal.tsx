/**
 * MyWallet — Hierarchical Category Modal & Creator
 * 
 * Delivers Phase 4.3 Refinement:
 * - Grouped & hierarchical category inspector with subcategories
 * - Clean visual hierarchy with icon badges and color accents
 * - Search filter for quick discovery
 * - "+ Custom / Other" category and subcategory creator on the fly
 * - SQLite persistence via CategoryRepository
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react-native';

import { CategoryRepository } from '@/repositories';
import { Category, CategoryType } from '@/db/schema';
import { useFinancialStore } from '@/stores';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

interface CategoryModalProps {
  visible: boolean;
  type: CategoryType;
  selectedCategoryId: string;
  selectedSubcategoryId: string | null;
  onSelect: (categoryId: string, subcategoryId: string | null) => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  '#FF6B6B', // Soft Coral
  '#6BCB77', // Soft Green
  '#4D96FF', // Sky Blue
  '#FFD93D', // Yellow
  '#FF8C32', // Orange
  '#00C9A7', // Teal
  '#845EC2', // Purple
  '#FF6F91', // Pink
  '#00E676', // Mint
  '#00F0FF', // Cyan
  '#A855F7', // Violet
  '#8F937A', // Slate
];

const ICON_PRESETS = [
  'Tag',
  'Utensils',
  'Coffee',
  'ShoppingBag',
  'Car',
  'Fuel',
  'Zap',
  'Film',
  'HeartPulse',
  'Sparkles',
  'Briefcase',
  'Dumbbell',
  'Music',
  'Gamepad2',
  'Book',
  'Gift',
  'Repeat',
];

export function CategoryModal({
  visible,
  type,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelect,
  onClose,
}: CategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCatId, setExpandedCatId] = useState<string | null>(selectedCategoryId);

  // Custom Category Creator State
  const [showCreator, setShowCreator] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customParentId, setCustomParentId] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState(COLOR_PRESETS[0]);
  const [customIcon, setCustomIcon] = useState(ICON_PRESETS[0]);

  // Load categories from database
  const loadCategories = () => {
    try {
      const all = CategoryRepository.getAll(type);
      setCategories(all);
    } catch (e) {
      console.warn('Could not load categories:', e);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCategories();
      setExpandedCatId(selectedCategoryId);
      setShowCreator(false);
      setSearchQuery('');
    }
  }, [visible, type, selectedCategoryId]);

  // Separate into major categories and subcategory map
  const { majorCategories, subcategoriesMap } = useMemo(() => {
    const majors: Category[] = [];
    const subs: Record<string, Category[]> = {};

    categories.forEach((cat) => {
      if (!cat.parent_id) {
        majors.push(cat);
      } else {
        if (!subs[cat.parent_id]) {
          subs[cat.parent_id] = [];
        }
        subs[cat.parent_id].push(cat);
      }
    });

    return { majorCategories: majors, subcategoriesMap: subs };
  }, [categories]);

  // Filtered categories based on search query
  const filteredMajors = useMemo(() => {
    if (!searchQuery.trim()) return majorCategories;
    const q = searchQuery.toLowerCase().trim();

    return majorCategories.filter((major) => {
      if (major.name.toLowerCase().includes(q)) return true;
      const childSubs = subcategoriesMap[major.id] || [];
      return childSubs.some((sub) => sub.name.toLowerCase().includes(q));
    });
  }, [majorCategories, subcategoriesMap, searchQuery]);

  // Handle creating custom category
  const handleSaveCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;

    const newId = `cat_custom_${Date.now()}`;
    const newCat: Omit<Category, 'created_at'> = {
      id: newId,
      name: trimmed,
      icon: customIcon,
      color: customColor,
      parent_id: customParentId,
      display_order: categories.length + 1,
      is_active: 1,
      type,
    };

    try {
      CategoryRepository.create(newCat);
      loadCategories();
      useFinancialStore.getState().refreshFinancials();

      if (customParentId) {
        onSelect(customParentId, newId);
      } else {
        onSelect(newId, null);
      }

      setCustomName('');
      setShowCreator(false);
      onClose();
    } catch (err) {
      console.warn('Failed to create custom category:', err);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          {/* Top handle pill */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Tag size={16} color={Colors.primaryFixed} />
              </View>
              <Text style={styles.title}>
                {type === 'income' ? 'Income Categories' : 'Expense Categories'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Search size={15} color={Colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search category or subcategory..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* + Custom / Other Category Banner */}
          {!showCreator ? (
            <TouchableOpacity
              style={styles.customBannerBtn}
              onPress={() => {
                setShowCreator(true);
                setCustomParentId(null);
                setCustomColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.customBannerIcon}>
                <Plus size={15} color={Colors.primaryFixed} />
              </View>
              <Text style={styles.customBannerText}>Custom / Other Category</Text>
              <Text style={styles.customBannerSub}>Create on the fly</Text>
            </TouchableOpacity>
          ) : (
            /* Inline Custom Creator Card */
            <View style={styles.creatorCard}>
              <View style={styles.creatorHeader}>
                <Text style={styles.creatorTitle}>
                  {customParentId
                    ? `Add Subcategory to ${categories.find((c) => c.id === customParentId)?.name}`
                    : 'Create Custom Category'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCreator(false)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <X size={14} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.creatorInput}
                placeholder="Category name (e.g. Pet Care, Freelance)..."
                placeholderTextColor={Colors.onSurfaceVariant}
                value={customName}
                onChangeText={setCustomName}
                autoFocus={true}
              />

              {/* Color Presets */}
              <Text style={styles.creatorSublabel}>Color Theme</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.swatchScroll}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      customColor === color && styles.colorSwatchActive,
                    ]}
                    onPress={() => setCustomColor(color)}
                    activeOpacity={0.8}
                  />
                ))}
              </ScrollView>

              {/* Icon Presets */}
              <Text style={styles.creatorSublabel}>Icon Symbol</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.swatchScroll}>
                {ICON_PRESETS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconSwatch,
                      customIcon === icon && {
                        backgroundColor: `${customColor}30`,
                        borderColor: customColor,
                      },
                    ]}
                    onPress={() => setCustomIcon(icon)}
                    activeOpacity={0.8}
                  >
                    <CategoryIcon
                      name={icon}
                      size={16}
                      color={customIcon === icon ? customColor : Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.creatorSubmitBtn,
                  !customName.trim() && styles.creatorSubmitBtnDisabled,
                ]}
                onPress={handleSaveCustom}
                disabled={!customName.trim()}
                activeOpacity={0.8}
              >
                <Sparkles size={14} color={Colors.onPrimary} />
                <Text style={styles.creatorSubmitText}>Save & Select Category</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Categories Hierarchical List */}
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredMajors.map((major) => {
              const subs = subcategoriesMap[major.id] || [];
              const isSelectedMajor = selectedCategoryId === major.id;
              const isExpanded = expandedCatId === major.id || searchQuery.trim().length > 0;

              return (
                <View key={major.id} style={styles.categoryGroup}>
                  {/* Major Category Row */}
                  <TouchableOpacity
                    style={[
                      styles.majorRow,
                      isSelectedMajor && !selectedSubcategoryId && {
                        backgroundColor: `${major.color}15`,
                        borderColor: major.color,
                      },
                    ]}
                    onPress={() => {
                      setExpandedCatId(isExpanded ? null : major.id);
                      onSelect(major.id, null);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.catIconCircle,
                        { backgroundColor: `${major.color}25` },
                      ]}
                    >
                      <CategoryIcon name={major.icon} size={16} color={major.color} />
                    </View>

                    <View style={styles.catDetails}>
                      <Text
                        style={[
                          styles.catName,
                          isSelectedMajor && { color: Colors.onSurface, fontWeight: '700' },
                        ]}
                      >
                        {major.name}
                      </Text>
                      <Text style={styles.subsCount}>
                        {subs.length > 0
                          ? `${subs.length} subcategories`
                          : 'Tap to add subcategories'}
                      </Text>
                    </View>

                    {/* Expand indicator or Checkmark */}
                    <View style={styles.majorRowRight}>
                      {isSelectedMajor && !selectedSubcategoryId && (
                        <TouchableOpacity
                          style={[styles.usePill, { backgroundColor: major.color }]}
                          onPress={onClose}
                          activeOpacity={0.7}
                        >
                          <Check size={11} color="#000000" strokeWidth={3} />
                          <Text style={styles.usePillText}>Select</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.chevronBox}
                        onPress={() => setExpandedCatId(isExpanded ? null : major.id)}
                        activeOpacity={0.7}
                      >
                        {isExpanded ? (
                          <ChevronUp size={16} color={Colors.onSurfaceVariant} />
                        ) : (
                          <ChevronDown size={16} color={Colors.onSurfaceVariant} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Subcategories (Pills under parent - available for all categories) */}
                  {isExpanded && (
                    <View style={styles.subsContainer}>
                      <View style={styles.subsPillsGrid}>
                        {subs.map((sub) => {
                          const isSubSelected =
                            selectedCategoryId === major.id &&
                            selectedSubcategoryId === sub.id;

                          return (
                            <TouchableOpacity
                              key={sub.id}
                              style={[
                                styles.subPill,
                                isSubSelected && {
                                  backgroundColor: `${major.color}25`,
                                  borderColor: major.color,
                                },
                              ]}
                              onPress={() => {
                                onSelect(major.id, sub.id);
                                onClose();
                              }}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.subDot,
                                  { backgroundColor: isSubSelected ? major.color : Colors.onSurfaceVariant },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.subPillText,
                                  isSubSelected && {
                                    color: Colors.onSurface,
                                    fontWeight: '700',
                                  },
                                ]}
                              >
                                {sub.name}
                              </Text>
                              {isSubSelected && (
                                <Check size={11} color={major.color} strokeWidth={3} />
                              )}
                            </TouchableOpacity>
                          );
                        })}

                        {/* Add custom subcategory shortcut - single clean plus icon and text */}
                        <TouchableOpacity
                          style={styles.addSubPill}
                          onPress={() => {
                            setCustomParentId(major.id);
                            setCustomColor(major.color);
                            setShowCreator(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Plus size={12} color={Colors.primaryFixed} />
                          <Text style={styles.addSubPillText}>Add Subcategory</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    maxHeight: '88%',
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderColor: Colors.strokeMedium,
    ...Elevation.high,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.headlineSm,
    fontSize: 15,
    color: Colors.onSurface,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Shapes.pill,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.pill,
    marginHorizontal: Spacing.screenPadding,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  searchInput: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    flex: 1,
    paddingVertical: 0,
  },
  customBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 243, 34, 0.08)',
    borderRadius: Shapes.lg,
    marginHorizontal: Spacing.screenPadding,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.3)',
    gap: 8,
  },
  customBannerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(200, 243, 34, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBannerText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontWeight: '700',
    flex: 1,
    fontSize: 12,
  },
  customBannerSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  creatorCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.xl,
    marginHorizontal: Spacing.screenPadding,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryFixed,
    gap: 8,
  },
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creatorTitle: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontWeight: '700',
    fontSize: 12,
  },
  creatorInput: {
    ...Typography.bodyMd,
    backgroundColor: Colors.surface,
    borderRadius: Shapes.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.onSurface,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    fontSize: 13,
  },
  creatorSublabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 4,
  },
  swatchScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  colorSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  iconSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  creatorSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryFixed,
    borderRadius: Shapes.pill,
    paddingVertical: 10,
    marginTop: 6,
    gap: 6,
  },
  creatorSubmitBtnDisabled: {
    opacity: 0.4,
  },
  creatorSubmitText: {
    ...Typography.bodySmMedium,
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 12,
  },
  listContainer: {
    flexGrow: 1,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xxl,
    gap: 8,
  },
  categoryGroup: {
    borderRadius: Shapes.lg,
    overflow: 'hidden',
  },
  majorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 10,
  },
  catIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catDetails: {
    flex: 1,
  },
  catName: {
    ...Typography.bodyMdMedium,
    fontSize: 13,
    color: Colors.onSurface,
  },
  subsCount: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  majorRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    gap: 4,
  },
  usePillText: {
    ...Typography.bodySmMedium,
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  chevronBox: {
    padding: 4,
  },
  subsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomLeftRadius: Shapes.lg,
    borderBottomRightRadius: Shapes.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: -2,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.strokeSubtle,
  },
  subsPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 6,
  },
  subDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  subPillText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  addSubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 243, 34, 0.06)',
    borderRadius: Shapes.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.3)',
    gap: 4,
  },
  addSubPillText: {
    ...Typography.bodySmMedium,
    fontSize: 11,
    color: Colors.primaryFixed,
  },
});
