/**
 * MyWallet — Category Picker
 * 
 * Interactive chip selector for major and sub-categories with color tokens and icons.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CategoryRepository } from '@/repositories';
import { Category, CategoryType } from '@/db/schema';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Colors, Typography, Shapes } from '@/theme';

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
  // Fetch major categories matching current type
  const majorCategories = useMemo(() => {
    return CategoryRepository.getMajorCategories(type);
  }, [type]);

  // Fetch subcategories for the selected major category
  const subcategories = useMemo(() => {
    if (!selectedCategoryId) return [];
    return CategoryRepository.getSubcategories(selectedCategoryId);
  }, [selectedCategoryId]);

  return (
    <View style={styles.container}>
      {/* Major Categories Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {majorCategories.map((cat: Category) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                isSelected && {
                  backgroundColor: `${cat.color}25`,
                  borderColor: cat.color,
                },
              ]}
              onPress={() => {
                onSelectCategory(cat.id);
                onSelectSubcategory(null);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${cat.color}30` },
                ]}
              >
                <CategoryIcon name={cat.icon} size={15} color={cat.color} />
              </View>
              <Text
                style={[
                  styles.chipText,
                  isSelected && { color: Colors.onSurface, fontWeight: '700' },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Subcategories Secondary Row (if any exist) */}
      {subcategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subchipScroll}
        >
          {subcategories.map((sub: Category) => {
            const isSelected = selectedSubcategoryId === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.subchip,
                  isSelected && styles.subchipActive,
                ]}
                onPress={() => {
                  onSelectSubcategory(isSelected ? null : sub.id);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.subchipText,
                    isSelected && styles.subchipTextActive,
                  ]}
                >
                  {sub.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  chipScroll: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...Typography.bodySmMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  subchipScroll: {
    gap: 6,
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  subchip: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  subchipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primaryFixed,
  },
  subchipText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  subchipTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
});
