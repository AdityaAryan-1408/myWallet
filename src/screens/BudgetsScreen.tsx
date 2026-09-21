/**
 * MyWallet — Budgets Screen
 * 
 * Phase 7: Complete Monthly Budgets & Category Health
 * Matches media_1789928829209.png mockup:
 * - Available Capital hero card with burned %, safe pace, and cushion forecast
 * - Filter pills: ALL <count> | • HEALTHY | • CAUTION | • EXCEEDED
 * - Category budget cards with health badges, progress bars, and spent/budget metrics
 * - "+ Add New Budget Category" CTA button
 * - Zero-Telemetry Local Vault security notice
 * - Add/Edit/Delete Budget Modal flow
 * - Connected to SQLite and reactive store with pull-to-refresh
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, Lock, Layers } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import {
  BudgetSummaryHero,
  BudgetCard,
  BudgetFilterPills,
  BudgetFilterType,
  AddEditBudgetModal,
} from '@/components/budgets';
import { BudgetWithProgress } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

export default function BudgetsScreen() {
  const { budgets, overallBudget, refreshFinancials } = useFinancialStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<BudgetFilterType>('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetWithProgress | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 400);
  }, [refreshFinancials]);

  // Filter budgets based on active filter pill
  const filteredBudgets = useMemo(() => {
    switch (activeFilter) {
      case 'HEALTHY':
        return budgets.filter((b) => b.healthStatus === 'healthy');
      case 'CAUTION':
        return budgets.filter((b) => b.healthStatus === 'caution' || b.healthStatus === 'warning');
      case 'EXCEEDED':
        return budgets.filter((b) => b.healthStatus === 'exceeded');
      case 'ALL':
      default:
        return budgets;
    }
  }, [budgets, activeFilter]);

  const handleOpenAdd = () => {
    setBudgetToEdit(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (budget: BudgetWithProgress) => {
    setBudgetToEdit(budget);
    setModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="BUDGETS" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryFixed}
            colors={[Colors.primaryFixed]}
          />
        }
      >
        {/* ─── Available Capital Hero Card ─── */}
        <BudgetSummaryHero progress={overallBudget} />

        {/* ─── Filter Pills ─── */}
        <BudgetFilterPills
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          totalCount={budgets.length}
        />

        {/* ─── Category Budget Cards List ─── */}
        {filteredBudgets.length > 0 ? (
          <View style={styles.cardsList}>
            {filteredBudgets.map((item, index) => (
              <BudgetCard
                key={item.id}
                budget={item}
                index={index}
                onPress={handleOpenEdit}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Layers size={36} color={Colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyStateTitle}>No Budgets in this Filter</Text>
            <Text style={styles.emptyStateSub}>
              {activeFilter === 'ALL'
                ? 'Create a category budget to begin tracking your spending limits.'
                : `No budget categories currently match the "${activeFilter}" health status.`}
            </Text>
          </View>
        )}

        {/* ─── Add New Budget Category Button ─── */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)}>
          <TouchableOpacity
            style={styles.addCategoryBtn}
            onPress={handleOpenAdd}
            activeOpacity={0.8}
          >
            <View style={styles.addIconCircle}>
              <Plus size={16} color={Colors.primaryFixed} />
            </View>
            <Text style={styles.addCategoryBtnText}>Add New Budget Category</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ─── Zero-Telemetry Local Vault Notice ─── */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.vaultNotice}>
          <View style={styles.vaultHeader}>
            <Lock size={14} color={Colors.onSurfaceVariant} />
            <Text style={styles.vaultTitle}>ZERO-TELEMETRY LOCAL VAULT</Text>
          </View>
          <Text style={styles.vaultDesc}>
            Budget quotas and transaction histories never leave this device. Encrypted at rest.
          </Text>
        </Animated.View>

        {/* Bottom padding for tab bar + FAB */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── Add / Edit Budget Target Modal ─── */}
      <AddEditBudgetModal
        visible={modalVisible}
        budgetToEdit={budgetToEdit}
        onClose={() => {
          setModalVisible(false);
          setBudgetToEdit(null);
        }}
        onSuccess={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    gap: Spacing.cardGap,
  },
  cardsList: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    marginVertical: 8,
  },
  emptyStateTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontSize: 14,
    fontFamily: FontFamily.headingSemiBold,
  },
  emptyStateSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    fontSize: 12,
    maxWidth: 260,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    gap: 10,
    marginTop: 4,
    ...Elevation.low,
  },
  addIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(216, 253, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryBtnText: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontSize: 14,
    fontFamily: FontFamily.headingSemiBold,
  },
  vaultNotice: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.lg,
    marginTop: 8,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaultTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  vaultDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.7,
    maxWidth: 280,
  },
});
