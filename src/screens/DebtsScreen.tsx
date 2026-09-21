/**
 * MyWallet — People & Debts Screen
 * 
 * Phase 11: Peer debt ledger ("I Owe" vs "They Owe Me")
 * - Net financial position overview hero (Total They Owe, Total You Owe, Net Balance)
 * - Segmented filtering: ALL PENDING, THEY OWE ME, I OWE, SETTLED
 * - Peer debt cards with partial repayment tracking, progress bars, and timeline
 * - Interactive modals for adding debts, recording partial repayments, and full settlements
 * - Zero-telemetry offline privacy assurance
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
  Users,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
} from 'lucide-react-native';

import { PeopleDebt, DebtDirection } from '@/db/schema';
import { DebtWithRepayments } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { AddEditDebtModal, RecordRepaymentModal, DebtCard } from '@/components/debts';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

type DebtFilter = 'all_pending' | 'they_owe' | 'i_owe' | 'settled';

export default function DebtsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    debts,
    debtSummary,
    refreshDebts,
    refreshFinancials,
    settleDebt,
    unsettleDebt,
  } = useFinancialStore();

  const [activeFilter, setActiveFilter] = useState<DebtFilter>('all_pending');
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<PeopleDebt | null>(null);
  const [presetDirection, setPresetDirection] = useState<DebtDirection>('they_owe');

  const [repayModalVisible, setRepayModalVisible] = useState(false);
  const [debtForRepayment, setDebtForRepayment] = useState<DebtWithRepayments | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshDebts();
    refreshFinancials();
    setTimeout(() => setRefreshing(false), 400);
  }, [refreshDebts, refreshFinancials]);

  // Filter debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (activeFilter === 'all_pending') return d.is_settled === 0;
      if (activeFilter === 'they_owe') return d.is_settled === 0 && d.direction === 'they_owe';
      if (activeFilter === 'i_owe') return d.is_settled === 0 && d.direction === 'i_owe';
      if (activeFilter === 'settled') return d.is_settled === 1;
      return true;
    });
  }, [debts, activeFilter]);

  const summary = debtSummary || {
    total_i_owe: 0,
    total_they_owe: 0,
    net_balance: 0,
    pending_count: 0,
    settled_count: 0,
  };

  const handleOpenAdd = (direction: DebtDirection = 'they_owe') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDebtToEdit(null);
    setPresetDirection(direction);
    setAddModalVisible(true);
  };

  const handleOpenEdit = (debt: DebtWithRepayments) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDebtToEdit(debt);
    setPresetDirection(debt.direction);
    setAddModalVisible(true);
  };

  const handleOpenRepayment = (debt: DebtWithRepayments) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDebtForRepayment(debt);
    setRepayModalVisible(true);
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
            <Users size={16} color={Colors.primaryFixed} />
          </View>
          <View>
            <Text style={styles.topBarTitle}>People & Debts</Text>
            <Text style={styles.topBarSubtitle}>PEER LEDGER & SPLITS</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => handleOpenAdd(activeFilter === 'i_owe' ? 'i_owe' : 'they_owe')}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#000" />
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Filter Tabs ─── */}
      <Animated.View entering={FadeIn.duration(400).delay(50)} style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'all_pending' && styles.filterPillActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveFilter('all_pending');
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'all_pending' && styles.filterPillTextActive,
            ]}
          >
            PENDING ({summary.pending_count})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'they_owe' && styles.filterPillActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveFilter('they_owe');
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'they_owe' && styles.filterPillTextActive,
            ]}
          >
            THEY OWE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'i_owe' && styles.filterPillActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveFilter('i_owe');
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'i_owe' && styles.filterPillTextActive,
            ]}
          >
            I OWE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, activeFilter === 'settled' && styles.filterPillActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveFilter('settled');
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterPillText,
              activeFilter === 'settled' && styles.filterPillTextActive,
            ]}
          >
            SETTLED ({summary.settled_count})
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── Scroll Body ─── */}
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
            NET POSITION HERO CARD
            ═══════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroEyebrow}>NET DEBT POSITION</Text>
            <View
              style={[
                styles.heroBadge,
                summary.net_balance >= 0 ? styles.heroBadgeGreen : styles.heroBadgeRed,
              ]}
            >
              <Text
                style={[
                  styles.heroBadgeText,
                  { color: summary.net_balance >= 0 ? Colors.income : Colors.expense },
                ]}
              >
                {summary.net_balance >= 0 ? '+ NET RECEIVABLE' : '− NET PAYABLE'}
              </Text>
            </View>
          </View>

          <View style={styles.heroAmountRow}>
            <Text
              style={[
                styles.heroCurrency,
                { color: summary.net_balance >= 0 ? Colors.income : Colors.expense },
              ]}
            >
              {summary.net_balance >= 0 ? '+' : '−'}₹
            </Text>
            <Text
              style={[
                styles.heroAmount,
                { color: summary.net_balance >= 0 ? Colors.income : Colors.expense },
              ]}
            >
              {Math.abs(summary.net_balance).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* 2-Column Breakdown: They Owe vs I Owe */}
          <View style={styles.heroGrid}>
            <View style={styles.heroGridCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ArrowDownLeft size={12} color={Colors.income} />
                <Text style={styles.heroGridLabel}>THEY OWE YOU</Text>
              </View>
              <Text style={[styles.heroGridVal, { color: Colors.income }]}>
                ₹{summary.total_they_owe.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.heroGridDivider} />

            <View style={styles.heroGridCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ArrowUpRight size={12} color={Colors.expense} />
                <Text style={styles.heroGridLabel}>YOU OWE THEM</Text>
              </View>
              <Text style={[styles.heroGridVal, { color: Colors.expense }]}>
                ₹{summary.total_i_owe.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════
            DEBTS LIST
            ═══════════════════════════════════════════════════════════ */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {activeFilter === 'all_pending'
                ? 'PENDING BALANCES'
                : activeFilter === 'they_owe'
                  ? 'PEOPLE WHO OWE YOU'
                  : activeFilter === 'i_owe'
                    ? 'PEOPLE YOU OWE'
                    : 'SETTLED TRANSACTIONS'}
            </Text>
            <Text style={styles.sectionCount}>{filteredDebts.length} Records</Text>
          </View>

          {filteredDebts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Users size={32} color={Colors.onSurfaceVariant} />
              <Text style={styles.emptyTitle}>No Debts Found</Text>
              <Text style={styles.emptyDesc}>
                {activeFilter === 'settled'
                  ? 'No settled debt transactions logged yet.'
                  : 'Track dinner splits, cab shares, or friend loans with partial repayment logs.'}
              </Text>

              {activeFilter !== 'settled' && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => handleOpenAdd()}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#000" />
                  <Text style={styles.emptyBtnText}>Log New Debt</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredDebts.map((debt, idx) => (
              <Animated.View
                key={debt.id}
                entering={FadeInDown.duration(400).delay(100 + idx * 30)}
              >
                <DebtCard
                  debt={debt}
                  onEdit={handleOpenEdit}
                  onRecordRepayment={handleOpenRepayment}
                  onSettle={settleDebt}
                  onUnsettle={unsettleDebt}
                />
              </Animated.View>
            ))
          )}
        </View>

        {/* ─── Zero-Telemetry Privacy Notice ─── */}
        <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.vaultNotice}>
          <ShieldCheck size={18} color={Colors.chartreuse} />
          <View style={styles.vaultContent}>
            <Text style={styles.vaultTitle}>SOVEREIGN PEER LEDGER</Text>
            <Text style={styles.vaultSub}>
              All contacts, loan amounts, and repayment logs are encrypted in your local SQLite vault. Zero sync with external services.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ─── Modals ─── */}
      <AddEditDebtModal
        visible={addModalVisible}
        debtToEdit={debtToEdit}
        presetDirection={presetDirection}
        onClose={() => setAddModalVisible(false)}
        onSuccess={() => {
          setAddModalVisible(false);
          refreshDebts();
          refreshFinancials();
        }}
      />

      <RecordRepaymentModal
        visible={repayModalVisible}
        debt={debtForRepayment}
        onClose={() => setRepayModalVisible(false)}
        onSuccess={() => {
          setRepayModalVisible(false);
          refreshDebts();
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

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primaryFixed,
  },
  filterPillText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  filterPillTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xxl,
    padding: Spacing.cardPaddingLg,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.20)',
    ...Elevation.medium,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroEyebrow: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  heroBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  heroBadgeGreen: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  heroBadgeRed: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  heroBadgeText: {
    ...Typography.labelCaps,
    fontSize: 8.5,
    fontWeight: '800',
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 14,
  },
  heroCurrency: {
    fontFamily: FontFamily.numericBold,
    fontSize: 22,
  },
  heroAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  heroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Shapes.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  heroGridCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  heroGridDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.strokeSubtle,
  },
  heroGridLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  heroGridVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 14,
  },

  // List Section
  listSection: {
    gap: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  sectionTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurface,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  sectionCount: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9.5,
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
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Shapes.pill,
    marginTop: 6,
  },
  emptyBtnText: {
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
