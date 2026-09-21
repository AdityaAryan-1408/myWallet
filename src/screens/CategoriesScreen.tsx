/**
 * MyWallet — Categories & Merchant Intelligence Screen
 * 
 * Phase 10: Full Category CRUD & Payee Intelligence
 * - Hierarchical view of major categories and nested subcategories
 * - Category statistics: monthly spend rollups and transaction counts
 * - Expense vs Income filtering + Archived category restoration
 * - Merchant & Payee Intelligence: top merchant spend breakdown and credit card reward tips
 * - Add/Edit modal with visual icon and color palette pickers
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Layers,
  Plus,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  RotateCcw,
  Tag,
  AlertCircle,
} from 'lucide-react-native';

import { Category, CategoryType } from '@/db/schema';
import { useFinancialStore } from '@/stores';
import { CategoryRepository, MerchantRepository, MerchantSummary } from '@/repositories';
import { AddEditCategoryModal, CategoryItemCard, MerchantCard } from '@/components/categories';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

type MainTab = 'categories' | 'merchants';
type CategoryFilter = 'ALL' | 'EXPENSE' | 'INCOME' | 'ARCHIVED';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    categories,
    categoriesWithStats,
    creditCards,
    refreshCategories,
    refreshFinancials,
    unarchiveCategory,
  } = useFinancialStore();

  const [mainTab, setMainTab] = useState<MainTab>('categories');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [presetParentId, setPresetParentId] = useState<string | null>(null);
  const [presetType, setPresetType] = useState<CategoryType>('expense');

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshCategories();
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 400);
  }, [refreshCategories, refreshFinancials]);

  // Major categories with stats based on filter
  const filteredMajorCategories = useMemo(() => {
    if (categoryFilter === 'ARCHIVED') return [];

    let type: CategoryType | undefined;
    if (categoryFilter === 'EXPENSE') type = 'expense';
    if (categoryFilter === 'INCOME') type = 'income';

    return categoriesWithStats.filter((c) => !c.parent_id && (type ? c.type === type : true));
  }, [categoriesWithStats, categoryFilter]);

  // Subcategories map
  const subcategoriesMap = useMemo(() => {
    const map = new Map<string, typeof categoriesWithStats>();
    categoriesWithStats.forEach((c) => {
      if (c.parent_id) {
        const existing = map.get(c.parent_id) || [];
        existing.push(c);
        map.set(c.parent_id, existing);
      }
    });
    return map;
  }, [categoriesWithStats]);

  // Archived categories
  const archivedCategories = useMemo(() => {
    if (categoryFilter !== 'ARCHIVED') return [];
    return CategoryRepository.getArchivedCategories();
  }, [categoryFilter, categories]);

  // Top Merchants Intelligence
  const topMerchants: MerchantSummary[] = useMemo(() => {
    return MerchantRepository.getTopMerchants(12);
  }, [categories, creditCards]);

  // Metrics overview
  const totalMajors = useMemo(() => categories.filter((c) => !c.parent_id && c.is_active === 1).length, [categories]);
  const totalSubs = useMemo(() => categories.filter((c) => c.parent_id && c.is_active === 1).length, [categories]);
  const totalMonthlyExpense = useMemo(
    () => categoriesWithStats.filter((c) => !c.parent_id && c.type === 'expense').reduce((sum, c) => sum + c.monthly_spend, 0),
    [categoriesWithStats]
  );

  const handleOpenAddCategory = (parentCat?: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryToEdit(null);
    if (parentCat) {
      setPresetParentId(parentCat.id);
      setPresetType(parentCat.type);
    } else {
      setPresetParentId(null);
      setPresetType(categoryFilter === 'INCOME' ? 'income' : 'expense');
    }
    setModalVisible(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryToEdit(cat);
    setPresetParentId(cat.parent_id || null);
    setPresetType(cat.type);
    setModalVisible(true);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ─── Top Bar ─── */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <View style={styles.topBarLogo}>
            <Layers size={16} color={Colors.primaryFixed} />
          </View>
          <View>
            <Text style={styles.topBarTitle}>Categories & Intelligence</Text>
            <Text style={styles.topBarSubtitle}>TAXONOMY & REWARD PERKS</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => handleOpenAddCategory()}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#000" />
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Main View Segmented Tabs ─── */}
      <Animated.View entering={FadeIn.duration(400).delay(50)} style={styles.mainTabBar}>
        <TouchableOpacity
          style={[styles.mainTabPill, mainTab === 'categories' && styles.mainTabPillActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setMainTab('categories');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.mainTabText, mainTab === 'categories' && styles.mainTabTextActive]}>
            CATEGORIES ({totalMajors})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabPill, mainTab === 'merchants' && styles.mainTabPillActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setMainTab('merchants');
          }}
          activeOpacity={0.7}
        >
          <Sparkles size={12} color={mainTab === 'merchants' ? '#000' : Colors.chartreuse} />
          <Text style={[styles.mainTabText, mainTab === 'merchants' && styles.mainTabTextActive]}>
            MERCHANTS & PERKS
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryFixed}
            colors={[Colors.primaryFixed]}
          />
        }
      >
        {/* ═══════════════════════════════════════════════════════════
            TAB 1: CATEGORIES & SUBCATEGORIES
            ═══════════════════════════════════════════════════════════ */}
        {mainTab === 'categories' && (
          <>
            {/* Sub-Filter Bar */}
            <View style={styles.filterPillsRow}>
              {(['ALL', 'EXPENSE', 'INCOME', 'ARCHIVED'] as CategoryFilter[]).map((f) => {
                const isActive = categoryFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategoryFilter(f);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Hero Overview */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroEyebrow}>TAXONOMY OVERVIEW</Text>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{totalMajors} MAJORS • {totalSubs} SUBS</Text>
                </View>
              </View>

              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.heroAmount}>
                    ₹{totalMonthlyExpense.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.heroSubLabel}>Total Tracked Spend This Month</Text>
                </View>

                <TouchableOpacity
                  style={styles.heroAddBtn}
                  onPress={() => handleOpenAddCategory()}
                  activeOpacity={0.8}
                >
                  <Plus size={15} color="#000" />
                  <Text style={styles.heroAddText}>Add Category</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Categories List */}
            {categoryFilter === 'ARCHIVED' ? (
              <View style={styles.listSection}>
                <Text style={styles.sectionHeading}>ARCHIVED CATEGORIES ({archivedCategories.length})</Text>
                <Text style={styles.sectionNotice}>
                  Archived categories remain linked to past transactions for accurate historical audit. You can restore them anytime.
                </Text>

                {archivedCategories.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Tag size={32} color={Colors.onSurfaceVariant} />
                    <Text style={styles.emptyTitle}>No Archived Categories</Text>
                    <Text style={styles.emptyDesc}>
                      Active categories you archive will appear here instead of being permanently lost.
                    </Text>
                  </View>
                ) : (
                  archivedCategories.map((archived) => (
                    <View key={archived.id} style={styles.archivedRow}>
                      <View style={styles.archivedLeft}>
                        <View style={[styles.archivedIcon, { backgroundColor: `${archived.color}20` }]}>
                          <Tag size={16} color={archived.color} />
                        </View>
                        <View>
                          <Text style={styles.archivedName}>{archived.name}</Text>
                          <Text style={styles.archivedType}>
                            {archived.type.toUpperCase()} • {archived.parent_id ? 'Subcategory' : 'Major'}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.restoreBtn}
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          unarchiveCategory(archived.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <RotateCcw size={13} color={Colors.chartreuse} />
                        <Text style={styles.restoreBtnText}>Restore</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            ) : (
              <View style={styles.listSection}>
                <View style={styles.listSectionHeader}>
                  <Text style={styles.sectionHeading}>
                    {categoryFilter === 'ALL'
                      ? 'ALL ACTIVE CATEGORIES'
                      : `${categoryFilter} CATEGORIES`}
                  </Text>
                  <Text style={styles.sectionSubCount}>
                    {filteredMajorCategories.length} Categories
                  </Text>
                </View>

                {filteredMajorCategories.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Layers size={32} color={Colors.onSurfaceVariant} />
                    <Text style={styles.emptyTitle}>No Categories Found</Text>
                    <TouchableOpacity
                      style={styles.emptyActionBtn}
                      onPress={() => handleOpenAddCategory()}
                      activeOpacity={0.8}
                    >
                      <Plus size={16} color="#000" />
                      <Text style={styles.emptyActionText}>Create New Category</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  filteredMajorCategories.map((cat, idx) => (
                    <Animated.View
                      key={cat.id}
                      entering={FadeInDown.duration(400).delay(100 + idx * 30)}
                    >
                      <CategoryItemCard
                        category={cat}
                        subcategories={subcategoriesMap.get(cat.id) || []}
                        onEdit={handleOpenEditCategory}
                        onAddSubcategory={handleOpenAddCategory}
                      />
                    </Animated.View>
                  ))
                )}
              </View>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TAB 2: MERCHANTS & REWARDS INTELLIGENCE
            ═══════════════════════════════════════════════════════════ */}
        {mainTab === 'merchants' && (
          <>
            {/* Merchant Intelligence Hero */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroEyebrow}>PAYEE REWARD OPTIMIZER</Text>
                <View style={[styles.heroBadge, { backgroundColor: 'rgba(125, 244, 255, 0.12)' }]}>
                  <Sparkles size={11} color={Colors.secondaryFixed} />
                  <Text style={[styles.heroBadgeText, { color: Colors.secondaryFixed }]}>
                    {creditCards.length} CARDS SYNCED
                  </Text>
                </View>
              </View>

              <Text style={styles.merchantHeroText}>
                Automated payee analysis matches your transaction notes with your active credit card benefits to optimize cashback and points.
              </Text>
            </Animated.View>

            {/* Merchant Ranking List */}
            <View style={styles.listSection}>
              <View style={styles.listSectionHeader}>
                <Text style={styles.sectionHeading}>TOP MERCHANTS & PERKS</Text>
                <Text style={styles.sectionSubCount}>{topMerchants.length} Analyzed</Text>
              </View>

              {topMerchants.map((merchant, idx) => (
                <Animated.View
                  key={merchant.name}
                  entering={FadeInDown.duration(400).delay(100 + idx * 35)}
                >
                  <MerchantCard merchant={merchant} rank={idx + 1} />
                </Animated.View>
              ))}
            </View>
          </>
        )}

        {/* ─── Zero-Telemetry Vault Notice ─── */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.vaultNotice}>
          <ShieldCheck size={18} color={Colors.chartreuse} />
          <View style={styles.vaultContent}>
            <Text style={styles.vaultTitle}>SOVEREIGN PRIVACY ENGINE</Text>
            <Text style={styles.vaultSub}>
              Category allocations, subcategories, and merchant intelligence heuristics execute 100% locally on your device with zero cloud telemetry.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ─── Modal ─── */}
      <AddEditCategoryModal
        visible={modalVisible}
        categoryToEdit={categoryToEdit}
        presetParentId={presetParentId}
        presetType={presetType}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          refreshCategories();
          refreshFinancials();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 10,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  topBarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  topBarLogo: {
    width: 34,
    height: 34,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  topBarTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  topBarSubtitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: Shapes.md,
    backgroundColor: Colors.chartreuse,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Main Tabs
  mainTabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  mainTabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  mainTabPillActive: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primaryFixed,
  },
  mainTabText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  mainTabTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.md,
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  filterPillActive: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderColor: Colors.chartreuse,
  },
  filterPillText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  filterPillTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPaddingLg,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.20)',
    gap: 8,
    ...Elevation.medium,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEyebrow: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  heroBadgeText: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 8.5,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 28,
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
  heroSubLabel: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  heroAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.chartreuse,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
  },
  heroAddText: {
    ...Typography.labelCaps,
    color: '#000',
    fontWeight: '700',
    fontSize: 10,
  },
  merchantHeroText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
  },

  // List Section
  listSection: {
    gap: Spacing.sm,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sectionHeading: {
    ...Typography.labelCaps,
    color: Colors.onSurface,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  sectionSubCount: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9.5,
  },
  sectionNotice: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },

  // Archived Row
  archivedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  archivedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  archivedIcon: {
    width: 36,
    height: 36,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 14,
  },
  archivedType: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.chartreuse,
    backgroundColor: 'rgba(200, 243, 34, 0.08)',
  },
  restoreBtnText: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Empty State
  emptyCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  emptyDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.chartreuse,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Shapes.pill,
    marginTop: 6,
  },
  emptyActionText: {
    ...Typography.labelCaps,
    color: '#000',
    fontWeight: '700',
    fontSize: 11,
  },

  // Vault Notice
  vaultNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    marginTop: Spacing.sm,
  },
  vaultContent: {
    flex: 1,
    gap: 2,
  },
  vaultTitle: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 9.5,
    letterSpacing: 1.0,
  },
  vaultSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 16,
  },
});
