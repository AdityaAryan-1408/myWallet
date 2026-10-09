/**
 * MyWallet — Temporary Transactions Dashboard Card
 * 
 * Displays floating outlays and payments made on behalf of friends or others.
 * These records intentionally DO NOT deduct from bank balances or affect
 * "Available to Spend". Users can track who owes them, mark advances as returned,
 * or delete them once settled.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Handshake, Check, Trash2, Clock, CheckCircle2, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Shapes, FontFamily } from '@/theme';
import { useTemporaryTransactionStore } from '@/stores';
import { TemporaryTransaction } from '@/db/schema';

export function TemporaryTransactionsCard() {
  const {
    pending,
    returned,
    totalPendingAmount,
    refresh,
    markAsReturned,
    markAsPending,
    deleteTransaction,
  } = useTemporaryTransactionStore();

  const [activeTab, setActiveTab] = useState<'pending' | 'returned'>('pending');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMarkReturned = (item: TemporaryTransaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Mark as Returned',
      `Have you received ₹${item.amount.toLocaleString('en-IN')} back${
        item.person_name ? ` from ${item.person_name}` : ''
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Returned',
          onPress: () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              // safe fallback
            }
            markAsReturned(item.id);
          },
        },
      ]
    );
  };

  const handleMarkPending = (item: TemporaryTransaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAsPending(item.id);
  };

  const handleDelete = (item: TemporaryTransaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Record',
      `Are you sure you want to delete this temporary advance of ₹${item.amount.toLocaleString(
        'en-IN'
      )}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch {
              // safe fallback
            }
            deleteTransaction(item.id);
          },
        },
      ]
    );
  };

  const displayList = activeTab === 'pending' ? pending : returned;

  return (
    <View style={styles.card}>
      {/* ─── Card Header ─── */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconBadge}>
            <Handshake size={16} color={Colors.chartreuse} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Paid on Behalf</Text>
            <Text style={styles.cardSubtitle}>Temporary Advances</Text>
          </View>
        </View>

        {totalPendingAmount > 0 && (
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>
              ₹{totalPendingAmount.toLocaleString('en-IN')} PENDING
            </Text>
          </View>
        )}
      </View>

      {/* ─── Tabs: Pending / Returned ─── */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('pending');
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'pending' && styles.tabButtonTextActive,
            ]}
          >
            Pending ({pending.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'returned' && styles.tabButtonActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('returned');
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'returned' && styles.tabButtonTextActive,
            ]}
          >
            Returned ({returned.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── List of Temporary Transactions ─── */}
      {displayList.length === 0 ? (
        <View style={styles.emptyBox}>
          <Handshake size={24} color={Colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>
            {activeTab === 'pending'
              ? 'No pending advances'
              : 'No returned advances yet'}
          </Text>
          <Text style={styles.emptySubText}>
            {activeTab === 'pending'
              ? 'When you pay on behalf of someone else, toggle "Paid on Behalf" on the Add screen.'
              : 'Transactions you mark as returned will appear here for your records.'}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {displayList.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.person_name ? `${item.person_name} • ${item.title}` : item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.date} • {item.payment_source_name || 'Direct'}
                  </Text>
                  {item.notes && item.notes !== item.title ? (
                    <Text style={styles.itemNotes} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.itemAmountCol}>
                  <Text style={styles.itemAmount}>
                    ₹{item.amount.toLocaleString('en-IN')}
                  </Text>
                  {item.is_returned === 1 ? (
                    <View style={styles.statusPillReturned}>
                      <CheckCircle2 size={10} color={Colors.income} />
                      <Text style={styles.statusTextReturned}>RETURNED</Text>
                    </View>
                  ) : (
                    <View style={styles.statusPillPending}>
                      <Clock size={10} color={Colors.warning} />
                      <Text style={styles.statusTextPending}>WAITING</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.itemActionsRow}>
                {item.is_returned === 0 ? (
                  <TouchableOpacity
                    style={styles.markReturnedBtn}
                    onPress={() => handleMarkReturned(item)}
                    activeOpacity={0.7}
                  >
                    <Check size={14} color="#000000" strokeWidth={2.5} />
                    <Text style={styles.markReturnedBtnText}>Mark as Returned</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.undoBtn}
                    onPress={() => handleMarkPending(item)}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={13} color={Colors.onSurfaceVariant} />
                    <Text style={styles.undoBtnText}>Reopen Pending</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={13} color={Colors.onSurfaceVariant} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: Shapes.sm,
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 15,
  },
  cardSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  totalBadge: {
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    borderRadius: Shapes.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.25)',
  },
  totalBadgeText: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FontFamily.numeric,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Shapes.sm,
  },
  tabButtonActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  tabButtonText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  tabButtonTextActive: {
    color: Colors.onSurface,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  emptySubText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  listContainer: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 13,
  },
  itemMeta: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  itemNotes: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
    opacity: 0.8,
  },
  itemAmountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemAmount: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FontFamily.numeric,
  },
  statusPillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  statusTextPending: {
    ...Typography.labelCaps,
    color: Colors.warning,
    fontSize: 9,
    fontWeight: '700',
  },
  statusPillReturned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  statusTextReturned: {
    ...Typography.labelCaps,
    color: Colors.income,
    fontSize: 9,
    fontWeight: '700',
  },
  itemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.strokeSubtle,
  },
  markReturnedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.chartreuse,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
  },
  markReturnedBtnText: {
    ...Typography.bodySmMedium,
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
  },
  undoBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
  },
  deleteBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
});
