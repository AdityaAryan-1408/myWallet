/**
 * MyWallet — Interactive Month Calendar Modal
 * 
 * Phase 3.10 Deliverable:
 * - Opened by tapping the month selector pill in ScreenHeader
 * - Full month calendar grid with navigation (prev/next month)
 * - Color-coded activity dots for logged expenses, income, transfers
 * - Clickable day cells revealing that date's detailed transaction ledger
 * - Delete action per transaction with automatic financial balance restoration
 *   (deleting an expense increases Available to Spend and refunds account)
 * - "+ Log for this Date" shortcut
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';
import { TransactionRepository } from '@/repositories';
import { Transaction } from '@/db/schema';
import { useFinancialStore } from '@/stores';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface MonthCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export function MonthCalendarModal({
  visible,
  onClose,
  initialDate = new Date(),
}: MonthCalendarModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deleteTransaction, accounts } = useFinancialStore();

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return initialDate.toISOString().split('T')[0];
  });

  // Days with transactions for the active month
  const [activityMap, setActivityMap] = useState<
    Record<string, { hasExpense: boolean; hasIncome: boolean; hasTransfer: boolean; totalSpend: number; count: number }>
  >({});

  // Transactions for the currently clicked date
  const [dayTransactions, setDayTransactions] = useState<Transaction[]>([]);

  const yearMonthStr = useMemo(() => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  }, [currentYear, currentMonth]);

  // Refresh calendar data whenever month changes or visibility toggles
  const refreshMonthData = () => {
    try {
      const map = TransactionRepository.getDaysWithActivity(yearMonthStr);
      setActivityMap(map);
    } catch (e) {
      console.warn('Failed to load month activity:', e);
    }
  };

  // Refresh selected day's transactions
  const refreshDayTransactions = (dateStr: string) => {
    try {
      const txs = TransactionRepository.getByDate(dateStr);
      setDayTransactions(txs);
    } catch (e) {
      console.warn('Failed to load day transactions:', e);
    }
  };

  useEffect(() => {
    if (visible) {
      refreshMonthData();
      refreshDayTransactions(selectedDateStr);
    }
  }, [visible, yearMonthStr, selectedDateStr]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Select a day cell
  const handleSelectDay = (dayNum: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
    refreshDayTransactions(dateStr);
  };

  // Delete a transaction from the selected day
  const handleDeleteTransaction = (tx: Transaction) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    const isExpense = tx.type === 'expense';
    const amountStr = `₹${tx.amount.toLocaleString('en-IN')}`;

    Alert.alert(
      'Delete Record?',
      isExpense
        ? `Remove this ${amountStr} expense? This will refund ${amountStr} and increase your Available to Spend balance.`
        : `Remove this ${amountStr} ${tx.type}? Account balances will readjust automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(tx.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Refresh local inspector views
            refreshMonthData();
            refreshDayTransactions(selectedDateStr);
          },
        },
      ]
    );
  };

  // Shortcut: Add transaction on this date
  const handleAddForDate = () => {
    onClose();
    router.push({
      pathname: '/add-transaction',
      params: { prefillDate: selectedDateStr },
    });
  };

  // ─── Calendar Grid Calculation ────────────────────────────────────

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
    // Convert so Monday = 0, Sunday = 6
    const offset = (firstDayIndex + 6) % 7;
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const cells: Array<{ dayNum: number | null; dateStr: string }> = [];

    // Empty leading padding cells
    for (let i = 0; i < offset; i++) {
      cells.push({ dayNum: null, dateStr: '' });
    }

    // Actual day cells
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dayNum: d, dateStr });
    }

    return cells;
  }, [currentYear, currentMonth]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Daily totals for currently inspected day
  const daySummary = useMemo(() => {
    let spent = 0;
    let income = 0;
    dayTransactions.forEach((tx) => {
      if (tx.type === 'expense') spent += tx.amount;
      if (tx.type === 'income') income += tx.amount;
    });
    return { spent, income, net: income - spent };
  }, [dayTransactions]);

  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* ─── Drag Handle & Close ─── */}
          <View style={styles.topBar}>
            <View style={styles.dragHandle} />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* ─── Month Navigation Header ─── */}
          <View style={styles.monthHeader}>
            <TouchableOpacity style={styles.navArrow} onPress={handlePrevMonth} activeOpacity={0.7}>
              <ChevronLeft size={20} color={Colors.onSurface} />
            </TouchableOpacity>

            <View style={styles.monthTitleBox}>
              <CalendarIcon size={16} color={Colors.primaryFixed} style={{ marginRight: 6 }} />
              <Text style={styles.monthTitleText}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
            </View>

            <TouchableOpacity style={styles.navArrow} onPress={handleNextMonth} activeOpacity={0.7}>
              <ChevronRight size={20} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* ─── Days of Week Row ─── */}
          <View style={styles.daysRow}>
            {DAYS_OF_WEEK.map((d, i) => (
              <Text key={i} style={styles.dayOfWeekText}>
                {d}
              </Text>
            ))}
          </View>

          {/* ─── Calendar Grid ─── */}
          <View style={styles.gridContainer}>
            {calendarDays.map((cell, idx) => {
              if (!cell.dayNum) {
                return <View key={`pad_${idx}`} style={styles.dayCellEmpty} />;
              }

              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;
              const activity = activityMap[cell.dateStr];

              return (
                <TouchableOpacity
                  key={cell.dateStr}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => handleSelectDay(cell.dayNum!)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumText,
                      isSelected && styles.dayNumTextSelected,
                      isToday && !isSelected && styles.dayNumTextToday,
                    ]}
                  >
                    {cell.dayNum}
                  </Text>

                  {/* Activity dots */}
                  <View style={styles.dotsRow}>
                    {activity?.hasExpense && (
                      <View style={[styles.dot, { backgroundColor: Colors.expense }]} />
                    )}
                    {activity?.hasIncome && (
                      <View style={[styles.dot, { backgroundColor: Colors.income }]} />
                    )}
                    {activity?.hasTransfer && (
                      <View style={[styles.dot, { backgroundColor: Colors.secondaryFixed }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ─── Selected Date Inspector ─── */}
          <View style={styles.inspectorHeader}>
            <View style={styles.inspectorTitleContainer}>
              <Text style={styles.inspectorDate}>{formattedSelectedDate}</Text>
              <Text style={styles.inspectorSub}>
                {dayTransactions.length}{' '}
                {dayTransactions.length === 1 ? 'transaction' : 'transactions'}
                {daySummary.spent > 0 && ` • Spent ₹${daySummary.spent.toLocaleString('en-IN')}`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addDateBtn}
              onPress={handleAddForDate}
              activeOpacity={0.8}
            >
              <Plus size={14} color={Colors.surface} />
              <Text style={styles.addDateBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Transaction List for Date ─── */}
          <ScrollView
            style={styles.transactionList}
            contentContainerStyle={styles.transactionListContent}
            showsVerticalScrollIndicator={false}
          >
            {dayTransactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No activity on this date</Text>
                <Text style={styles.emptySub}>
                  Tap the Add button above to log an expense or income for {formattedSelectedDate}.
                </Text>
              </View>
            ) : (
              dayTransactions.map((tx) => {
                const isExpense = tx.type === 'expense';
                const isIncome = tx.type === 'income';
                const account = accounts.find((a) => a.id === tx.account_id);

                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <View
                        style={[
                          styles.txIconBox,
                          {
                            backgroundColor: isExpense
                              ? 'rgba(255, 82, 82, 0.12)'
                              : isIncome
                              ? 'rgba(0, 230, 118, 0.12)'
                              : 'rgba(0, 240, 255, 0.12)',
                          },
                        ]}
                      >
                        <CategoryIcon
                          name={isExpense ? 'ShoppingBag' : isIncome ? 'Wallet' : 'ArrowRightLeft'}
                          color={
                            isExpense
                              ? Colors.expense
                              : isIncome
                              ? Colors.income
                              : Colors.secondaryFixed
                          }
                          size={16}
                        />
                      </View>

                      <View style={styles.txInfo}>
                        <Text style={styles.txTitle} numberOfLines={1}>
                          {tx.note?.trim() || (isExpense ? 'Expense' : isIncome ? 'Income' : 'Transfer')}
                        </Text>
                        <Text style={styles.txMeta}>
                          {account?.name || (tx.credit_card_id ? 'Credit Card' : 'Primary Account')}{' '}
                          • {tx.time.slice(0, 5)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          {
                            color: isExpense
                              ? Colors.expense
                              : isIncome
                              ? Colors.income
                              : Colors.secondaryFixed,
                          },
                        ]}
                      >
                        {isExpense ? '−₹' : isIncome ? '+₹' : '₹'}
                        {tx.amount.toLocaleString('en-IN')}
                      </Text>

                      <TouchableOpacity
                        style={styles.deleteTxBtn}
                        onPress={() => handleDeleteTransaction(tx)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={15} color={Colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    maxHeight: '90%',
    paddingTop: 8,
    ...Elevation.high,
  },
  topBar: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.md,
    top: 4,
    padding: 6,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  monthTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitleText: {
    ...Typography.bodyLg,
    color: Colors.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  daysRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingBottom: 6,
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 40,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Shapes.sm,
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(200, 243, 34, 0.15)',
    borderWidth: 1.5,
    borderColor: Colors.primaryFixed,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dayNumText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 13,
    fontFamily: FontFamily.numeric,
  },
  dayNumTextSelected: {
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  dayNumTextToday: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    height: 4,
    marginTop: 2,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  inspectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  inspectorTitleContainer: {
    flex: 1,
  },
  inspectorDate: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  inspectorSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  addDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
  },
  addDateBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  transactionList: {
    maxHeight: 220,
  },
  transactionListContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
  },
  emptySub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '500',
  },
  txMeta: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  txAmount: {
    ...Typography.bodyMdMedium,
    fontFamily: FontFamily.numeric,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteTxBtn: {
    padding: 6,
    borderRadius: Shapes.pill,
  },
});
