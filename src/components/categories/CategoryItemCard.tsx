/**
 * MyWallet — Category Item Card
 * 
 * Expandable card for major categories displaying:
 * - Category icon with color wash
 * - Category name, transaction count, and monthly spend
 * - Expandable nested subcategories with their own stats
 * - Quick "+ Add Subcategory" trigger
 * - Edit trigger for category and subcategories
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  FolderTree,
} from 'lucide-react-native';

import { Category } from '@/db/schema';
import { CategoryWithStats } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';

interface CategoryItemCardProps {
  category: CategoryWithStats;
  subcategories: CategoryWithStats[];
  onEdit: (category: Category) => void;
  onAddSubcategory: (parentCategory: Category) => void;
}

export function CategoryItemCard({
  category,
  subcategories,
  onEdit,
  onAddSubcategory,
}: CategoryItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasSubs = subcategories.length > 0;
  const catColor = category.color || Colors.primaryFixed;

  const toggleExpand = () => {
    Haptics.selectionAsync();
    setExpanded(!expanded);
  };

  return (
    <View style={styles.card}>
      {/* ─── Major Category Header ─── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerClickable}
          onPress={hasSubs ? toggleExpand : () => onEdit(category)}
          activeOpacity={0.75}
        >
          <View style={[styles.iconBox, { backgroundColor: `${catColor}20` }]}>
            <CategoryIcon name={category.icon} size={22} color={catColor} />
          </View>

          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Text style={styles.nameText} numberOfLines={1}>
                {category.name}
              </Text>
            </View>

            <View style={styles.metaRow}>
              {hasSubs && (
                <View style={styles.metaBadge}>
                  <FolderTree size={10} color={Colors.onSurfaceVariant} />
                  <Text style={styles.metaBadgeText}>
                    {subcategories.length} {subcategories.length === 1 ? 'sub' : 'subs'}
                  </Text>
                </View>
              )}

              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>
                  {category.transactions_count} {category.transactions_count === 1 ? 'txn' : 'txns'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Spend & Actions */}
        <View style={styles.rightActions}>
          <View style={styles.spendBlock}>
            <Text style={styles.spendLabel}>THIS MONTH</Text>
            <Text style={styles.spendAmount}>
              ₹{category.monthly_spend.toLocaleString('en-IN')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEdit(category);
            }}
            activeOpacity={0.7}
          >
            <Edit2 size={15} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          {hasSubs && (
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={toggleExpand}
              activeOpacity={0.7}
            >
              {expanded ? (
                <ChevronUp size={18} color={Colors.onSurfaceVariant} />
              ) : (
                <ChevronDown size={18} color={Colors.onSurfaceVariant} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Expanded Subcategories ─── */}
      {expanded && (
        <View style={styles.subcategoriesContainer}>
          <View style={[styles.subTreeLine, { backgroundColor: `${catColor}40` }]} />

          <View style={styles.subsList}>
            {subcategories.map((sub) => {
              const subColor = sub.color || catColor;
              return (
                <View key={sub.id} style={styles.subRow}>
                  <View style={styles.subLeft}>
                    <View style={[styles.subIconBox, { backgroundColor: `${subColor}18` }]}>
                      <CategoryIcon name={sub.icon} size={14} color={subColor} />
                    </View>
                    <View>
                      <Text style={styles.subName}>{sub.name}</Text>
                      <Text style={styles.subMeta}>
                        {sub.transactions_count} {sub.transactions_count === 1 ? 'txn' : 'txns'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.subRight}>
                    <Text style={styles.subSpend}>
                      ₹{sub.monthly_spend.toLocaleString('en-IN')}
                    </Text>
                    <TouchableOpacity
                      style={styles.subEditBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onEdit(sub);
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={13} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Quick Add Subcategory */}
            <TouchableOpacity
              style={styles.addSubBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddSubcategory(category);
              }}
              activeOpacity={0.7}
            >
              <Plus size={13} color={Colors.primaryFixed} />
              <Text style={styles.addSubText}>Add Subcategory</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.cardPadding,
  },
  headerClickable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Shapes.pill,
  },
  metaBadgeText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spendBlock: {
    alignItems: 'flex-end',
    gap: 1,
  },
  spendLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 8,
    letterSpacing: 0.6,
  },
  spendAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 14,
    color: Colors.onSurface,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: Shapes.sm,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  expandBtn: {
    width: 32,
    height: 32,
    borderRadius: Shapes.sm,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },

  // Subcategories
  subcategoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.cardPadding,
    paddingBottom: Spacing.cardPadding,
    gap: Spacing.md,
  },
  subTreeLine: {
    width: 2,
    borderRadius: 1,
    marginLeft: 20,
    marginVertical: 4,
  },
  subsList: {
    flex: 1,
    gap: 8,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  subIconBox: {
    width: 28,
    height: 28,
    borderRadius: Shapes.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    ...Typography.bodySm,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  subMeta: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
  },
  subRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subSpend: {
    fontFamily: FontFamily.numeric,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  subEditBtn: {
    padding: 4,
  },
  addSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  addSubText: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    fontSize: 10,
    letterSpacing: 0.6,
  },
});
