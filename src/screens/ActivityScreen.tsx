/**
 * MyWallet — Activity / Transaction Ledger Screen
 * 
 * Phase 5: Full transaction history screen matching Zenith Obsidian design:
 * - Real-time search by notes, category names, subcategories, amounts, accounts
 * - Segmented filter tabs (ALL, EXPENSES, INCOME, TRANSFERS)
 * - Monthly spend overview hero card (e.g. "SEPTEMBER SPEND ₹8,420 · 42 Logs")
 * - Date-grouped transaction ledger with daily net cash flow calculations
 * - Interactive Transaction Detail Modal with Delete/Edit actions
 * - Pull-to-refresh connected to SQLite
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Search, X, Receipt, Filter } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { TransactionRow, TransactionDetailModal } from '@/components/activity';
import { TransactionWithDetails, TransactionRepository } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';

type FilterType = 'ALL' | 'EXPENSES' | 'INCOME' | 'TRANSFERS';

interface DateGroup {
  date: string;
  displayDate: string;
  netAmount: number;
  transactions: TransactionWithDetails[];
}

export default function ActivityScreen() {
  const { monthlyTotals, recentTransactions, refreshFinancials } = useFinancialStore();

  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionWithDetails | null>(null);

  // Load transactions from local SQLite database
  const loadTransactions = useCallback(() => {
    const list = TransactionRepository.getAllWithDetails();
    setTransactions(list);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, recentTransactions, monthlyTotals]);

  const onRefresh = async () => {
    setRefreshing(true);
    refreshFinancials();
    loadTransactions();
    setTimeout(() => setRefreshing(false), 400);
  };

  // Current Month Label (e.g. "SEPTEMBER SPEND")
  const currentMonthName = useMemo(() => {
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    return months[new Date().getMonth()];
  }, []);

  // Filter & Search
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return transactions.filter((tx) => {
      // Filter by Type
      if (activeFilter === 'EXPENSES' && tx.type !== 'expense') return false;
      if (activeFilter === 'INCOME' && tx.type !== 'income') return false;
      if (activeFilter === 'TRANSFERS' && tx.type !== 'transfer') return false;

      // Filter by Search Query
      if (q) {
        const noteMatch = tx.note?.toLowerCase().includes(q) ?? false;
        const catMatch = tx.category_name?.toLowerCase().includes(q) ?? false;
        const subMatch = tx.subcategory_name?.toLowerCase().includes(q) ?? false;
        const amountMatch = `${tx.amount}`.includes(q) || `₹${tx.amount}`.includes(q);
        const accountMatch = tx.account_name?.toLowerCase().includes(q) ?? false;
        const cardMatch = tx.credit_card_name?.toLowerCase().includes(q) ?? false;

        return noteMatch || catMatch || subMatch || amountMatch || accountMatch || cardMatch;
      }

      return true;
    });
  }, [transactions, activeFilter, searchQuery]);

  // Group filtered transactions by date
  const groupedTransactions = useMemo<DateGroup[]>(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const groupsMap = new Map<string, TransactionWithDetails[]>();

    for (const tx of filteredTransactions) {
      const dateKey = tx.date;
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, []);
      }
      groupsMap.get(dateKey)!.push(tx);
    }

    const result: DateGroup[] = [];

    groupsMap.forEach((txList, dateKey) => {
      // Calculate daily net
      let net = 0;
      for (const tx of txList) {
        if (tx.type === 'income') {
          net += tx.amount;
        } else if (tx.type === 'expense') {
          net -= tx.amount;
        }
      }

      // Format human-readable date header
      let displayDate = dateKey;
      try {
        const [y, m, d] = dateKey.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);

        if (dateKey === todayStr) {
          const monthShort = dateObj.toLocaleString('en-US', { month: 'short' });
          displayDate = `TODAY  •  ${d} ${monthShort}`;
        } else if (dateKey === yesterdayStr) {
          const monthShort = dateObj.toLocaleString('en-US', { month: 'short' });
          displayDate = `YESTERDAY  •  ${d} ${monthShort}`;
        } else {
          const dayName = dateObj.toLocaleString('en-US', { weekday: 'long' });
          const monthLong = dateObj.toLocaleString('en-US', { month: 'long' }).toUpperCase();
          displayDate = `${d} ${monthLong}  •  ${dayName}`;
        }
      } catch {
        displayDate = dateKey;
      }

      result.push({
        date: dateKey,
        displayDate,
        netAmount: net,
        transactions: txList,
      });
    });

    return result;
  }, [filteredTransactions]);

  // Count of transactions logged this month
  const monthlyLogsCount = useMemo(() => {
    const yearMonth = new Date().toISOString().slice(0, 7);
    return transactions.filter((t) => t.date.startsWith(yearMonth)).length;
  }, [transactions]);

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="ACTIVITY" />

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
        {/* ─── Search Bar ─── */}
        <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.searchBar}>
          <Search size={16} color={Colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search 'Coffee', 'Food', '₹120', 'Salary'..."
            placeholderTextColor={Colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearch}
              onPress={() => setSearchQuery('')}
              activeOpacity={0.7}
            >
              <X size={14} color={Colors.onSurface} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* ─── Filter Tabs ─── */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.filterRow}>
          {(['ALL', 'EXPENSES', 'INCOME', 'TRANSFERS'] as FilterType[]).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* ─── Monthly Summary Card ─── */}
        <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.monthCard}>
          <View style={styles.monthCardLeft}>
            <View style={styles.monthCardIconCircle}>
              <Receipt size={20} color={Colors.primaryFixed} />
            </View>
            <View>
              <Text style={styles.monthCardTitle}>{currentMonthName} SPEND</Text>
              <Text style={styles.monthCardAmount}>
                ₹{monthlyTotals.expense.toLocaleString('en-IN')}{' '}
                <Text style={styles.monthCardSub}>· {monthlyLogsCount} Logs</Text>
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── Date Groups Ledger ─── */}
        {groupedTransactions.length > 0 ? (
          groupedTransactions.map((group, groupIdx) => {
            const isNetPositive = group.netAmount > 0;
            const isNetZero = group.netAmount === 0;

            let netFormatted = `Net: ₹0`;
            if (isNetPositive) {
              netFormatted = `Net: +₹${group.netAmount.toLocaleString('en-IN')}`;
            } else if (!isNetZero) {
              netFormatted = `Net: −₹${Math.abs(group.netAmount).toLocaleString('en-IN')}`;
            }

            return (
              <Animated.View
                key={group.date}
                entering={FadeInDown.duration(500).delay(200 + groupIdx * 50)}
                style={styles.dateGroupContainer}
              >
                {/* Date Group Header */}
                <View style={styles.dateHeader}>
                  <Text style={styles.dateLabel}>{group.displayDate}</Text>
                  <Text
                    style={[
                      styles.dateNet,
                      isNetPositive && { color: Colors.income },
                      !isNetPositive && !isNetZero && { color: Colors.onSurfaceVariant },
                    ]}
                  >
                    {netFormatted}
                  </Text>
                </View>

                {/* Transactions Card */}
                <View style={styles.txCard}>
                  {group.transactions.map((tx, idx) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      isLast={idx === group.transactions.length - 1}
                      onPress={(clickedTx) => setSelectedTx(clickedTx)}
                    />
                  ))}
                </View>
              </Animated.View>
            );
          })
        ) : (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Filter size={24} color={Colors.onSurfaceVariant} />
            </View>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No results matching "${searchQuery}"`
                : `No transactions logged under ${activeFilter.toLowerCase()}`}
            </Text>
            {(searchQuery.length > 0 || activeFilter !== 'ALL') && (
              <TouchableOpacity
                style={styles.resetFiltersBtn}
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('ALL');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resetFiltersText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bottom padding for tab bar + FAB */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ─── Transaction Detail Modal ─── */}
      <TransactionDetailModal
        visible={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onUpdated={() => {
          loadTransactions();
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    gap: Spacing.cardGap,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearch: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeBright,
    backgroundColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primaryFixed,
  },
  filterText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  filterTextActive: {
    color: Colors.onPrimary,
  },
  monthCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    ...Elevation.low,
  },
  monthCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthCardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  monthCardTitle: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    fontSize: 10,
    letterSpacing: 1,
  },
  monthCardAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 19,
    color: Colors.onSurface,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  monthCardSub: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  dateGroupContainer: {
    gap: 6,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  dateLabel: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  dateNet: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
  txCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    ...Elevation.low,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  resetFiltersBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeBright,
  },
  resetFiltersText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontSize: 12,
  },
});
