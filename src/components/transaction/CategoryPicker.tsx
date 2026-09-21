/**
 * MyWallet — Preselected Category Button & Trigger
 * 
 * Delivers Phase 4.3 Refinement:
 * - Replaces horizontal scrolling chips with a clean, preselected category button
 * - Displays active category icon, name, and subcategory breadcrumb
 * - Tapping opens the hierarchical CategoryModal with grouped categories & custom category creation
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ChevronDown, Tag } from 'lucide-react-native';

import { CategoryRepository } from '@/repositories';
import { CategoryType } from '@/db/schema';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CategoryModal } from './CategoryModal';
import { Colors, Typography, Spacing, Shapes, Elevation } from '@/theme';

interface CategoryPickerProps {
  type: CategoryType;
  selectedCategoryId: string;
  selectedSubcategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory: (subcategoryId: string | null) => void;
}

export function CategoryPicker({
  type,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
}: CategoryPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch active major category details
  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return CategoryRepository.getById(selectedCategoryId);
  }, [selectedCategoryId]);

  // Fetch active subcategory details (if any)
  const activeSubcategory = useMemo(() => {
    if (!selectedSubcategoryId) return null;
    return CategoryRepository.getById(selectedSubcategoryId);
  }, [selectedSubcategoryId]);

  const catColor = activeCategory?.color || Colors.primaryFixed;

  return (
    <View style={styles.container}>
      {/* ─── Preselected Category Button ─── */}
      <TouchableOpacity
        style={[
          styles.button,
          { borderColor: `${catColor}60` },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {/* Left: Category Icon Circle */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${catColor}25` },
          ]}
        >
          <CategoryIcon
            name={activeCategory?.icon || 'Tag'}
            size={18}
            color={catColor}
          />
        </View>

        {/* Center: Category & Subcategory Labels */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.categoryName} numberOfLines={1}>
              {activeCategory?.name || 'Select Category'}
            </Text>
            {activeSubcategory && (
              <View style={[styles.subBadge, { backgroundColor: `${catColor}20` }]}>
                <Text style={[styles.subBadgeText, { color: catColor }]} numberOfLines={1}>
                  › {activeSubcategory.name}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.tapHint}>
            {activeSubcategory
              ? `${activeCategory?.name} • ${activeSubcategory.name}`
              : 'Tap to view subcategories or choose different'}
          </Text>
        </View>

        {/* Right: Dropdown Chevron */}
        <View style={styles.chevronBox}>
          <ChevronDown size={18} color={Colors.onSurfaceVariant} />
        </View>
      </TouchableOpacity>

      {/* ─── Hierarchical Category Modal ─── */}
      <CategoryModal
        visible={modalVisible}
        type={type}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryId={selectedSubcategoryId}
        onSelect={(catId, subId) => {
          onSelectCategory(catId);
          onSelectSubcategory(subId);
        }}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 12,
    ...Elevation.low,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryName: {
    ...Typography.bodyMdMedium,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  subBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  subBadgeText: {
    ...Typography.bodySmMedium,
    fontSize: 11,
    fontWeight: '600',
  },
  tapHint: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  chevronBox: {
    padding: 4,
  },
});
