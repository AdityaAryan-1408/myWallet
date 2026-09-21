/**
 * MyWallet — Debt Card Component
 * 
 * Displays:
 * - Peer avatar initial and name
 * - Direction pill: OWES YOU (emerald) vs YOU OWE (coral)
 * - Remaining balance, original amount, and visual repayment progress bar
 * - One-tap Settle / Unsettle and Record Repayment actions
 * - Expandable historical repayment timeline
 * - Edit trigger on card tap
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  RotateCcw,
  Plus,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Edit2,
  Trash2,
} from 'lucide-react-native';

import { DebtWithRepayments } from '@/repositories';
import { Colors, Typography, Spacing, Shapes, FontFamily, Elevation } from '@/theme';

interface DebtCardProps {
  debt: DebtWithRepayments;
  onEdit: (debt: DebtWithRepayments) => void;
  onRecordRepayment: (debt: DebtWithRepayments) => void;
  onSettle: (debtId: string) => void;
  onUnsettle: (debtId: string) => void;
}

// Deterministic pastel color for avatars based on person name
function getAvatarColor(name: string): string {
  const colors = [
    '#FF6B6B',
    '#4D96FF',
    '#6BCB77',
    '#FFD93D',
    '#FF8C32',
    '#00C9A7',
    '#845EC2',
    '#FF6F91',
    '#00E676',
    '#00F0FF',
    '#A855F7',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function DebtCard({
  debt,
  onEdit,
  onRecordRepayment,
  onSettle,
  onUnsettle,
}: DebtCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isTheyOwe = debt.direction === 'they_owe';
  const isSettled = debt.is_settled === 1;
  const hasRepayments = debt.repayments && debt.repayments.length > 0;
  const avatarBg = getAvatarColor(debt.person_name);

  const pctRepaid = debt.amount > 0 ? Math.min((debt.paid_amount / debt.amount) * 100, 100) : 0;
  const initial = debt.person_name.trim()[0]?.toUpperCase() || '?';

  const directionColor = isTheyOwe ? Colors.income : Colors.expense;

  const toggleExpand = () => {
    Haptics.selectionAsync();
    setExpanded(!expanded);
  };

  return (
    <View style={[styles.card, isSettled && styles.settledCard]}>
      {/* ─── Top Info Row ─── */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => onEdit(debt)}
        activeOpacity={0.75}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.avatarBox, { backgroundColor: `${avatarBg}25` }]}>
            <Text style={[styles.avatarInitial, { color: avatarBg }]}>{initial}</Text>
          </View>

          <View style={styles.personInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.personName} numberOfLines={1}>
                {debt.person_name}
              </Text>
              <View
                style={[
                  styles.directionPill,
                  isTheyOwe ? styles.theyOwePill : styles.iOwePill,
                ]}
              >
                {isTheyOwe ? (
                  <ArrowDownLeft size={10} color={Colors.income} />
                ) : (
                  <ArrowUpRight size={10} color={Colors.expense} />
                )}
                <Text
                  style={[
                    styles.directionPillText,
                    { color: isTheyOwe ? Colors.income : Colors.expense },
                  ]}
                >
                  {isTheyOwe ? 'OWES YOU' : 'YOU OWE'}
                </Text>
              </View>
            </View>

            {debt.reason ? (
              <Text style={styles.reasonText} numberOfLines={1}>
                {debt.reason}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Balance Display */}
        <View style={styles.headerRight}>
          <Text
            style={[
              styles.amountText,
              { color: isSettled ? Colors.onSurfaceVariant : directionColor },
              isSettled && styles.amountSettled,
            ]}
          >
            ₹{(isSettled ? debt.amount : debt.remaining_amount).toLocaleString('en-IN')}
          </Text>

          {isSettled ? (
            <View style={styles.settledBadge}>
              <Check size={10} color={Colors.income} />
              <Text style={styles.settledBadgeText}>SETTLED</Text>
            </View>
          ) : debt.paid_amount > 0 ? (
            <Text style={styles.principalSub}>
              ₹{debt.paid_amount.toLocaleString('en-IN')} paid of ₹{debt.amount.toLocaleString('en-IN')}
            </Text>
          ) : (
            <Text style={styles.principalSub}>Total principal</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* ─── Partial Repayment Progress Bar ─── */}
      {!isSettled && debt.paid_amount > 0 && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${pctRepaid}%`, backgroundColor: directionColor },
            ]}
          />
        </View>
      )}

      {/* ─── Action Buttons ─── */}
      <View style={styles.actionsRow}>
        {!isSettled ? (
          <>
            <TouchableOpacity
              style={styles.repayBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRecordRepayment(debt);
              }}
              activeOpacity={0.75}
            >
              <Plus size={13} color="#000" />
              <Text style={styles.repayBtnText}>Record Repayment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settleBtn}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onSettle(debt.id);
              }}
              activeOpacity={0.75}
            >
              <Check size={14} color={Colors.income} />
              <Text style={styles.settleBtnText}>Settle Full</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.reopenBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onUnsettle(debt.id);
            }}
            activeOpacity={0.75}
          >
            <RotateCcw size={13} color={Colors.onSurfaceVariant} />
            <Text style={styles.reopenBtnText}>Reopen Debt</Text>
          </TouchableOpacity>
        )}

        {/* Repayments History Toggle */}
        {hasRepayments && (
          <TouchableOpacity
            style={styles.historyToggle}
            onPress={toggleExpand}
            activeOpacity={0.7}
          >
            <Text style={styles.historyToggleText}>
              {debt.repayments.length} {debt.repayments.length === 1 ? 'payment' : 'payments'}
            </Text>
            {expanded ? (
              <ChevronUp size={14} color={Colors.onSurfaceVariant} />
            ) : (
              <ChevronDown size={14} color={Colors.onSurfaceVariant} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Expanded Repayments Timeline ─── */}
      {expanded && hasRepayments && (
        <View style={styles.timelineContainer}>
          <Text style={styles.timelineHeading}>REPAYMENT LEDGER</Text>
          {debt.repayments.map((rep, idx) => (
            <View key={rep.id} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineAmount}>
                    +₹{rep.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.timelineDate}>{rep.date}</Text>
                </View>
                {rep.note ? <Text style={styles.timelineNote}>{rep.note}</Text> : null}
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
    gap: 10,
    ...Elevation.low,
  },
  settledCard: {
    opacity: 0.8,
    borderColor: Colors.strokeSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  avatarInitial: {
    fontFamily: FontFamily.numericBold,
    fontSize: 18,
  },
  personInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  personName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 15,
  },
  directionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Shapes.pill,
  },
  theyOwePill: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
  },
  iOwePill: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
  },
  directionPillText: {
    ...Typography.labelCaps,
    fontSize: 8.5,
    fontWeight: '800',
  },
  reasonText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amountText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 17,
  },
  amountSettled: {
    textDecorationLine: 'line-through',
  },
  principalSub: {
    fontFamily: FontFamily.numeric,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Shapes.pill,
  },
  settledBadgeText: {
    ...Typography.labelCaps,
    color: Colors.income,
    fontSize: 8.5,
    fontWeight: '700',
  },

  // Progress Bar
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  repayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.chartreuse,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
  },
  repayBtnText: {
    ...Typography.labelCaps,
    color: '#000',
    fontWeight: '700',
    fontSize: 10,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  settleBtnText: {
    ...Typography.labelCaps,
    color: Colors.income,
    fontWeight: '700',
    fontSize: 10,
  },
  reopenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  reopenBtnText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9.5,
  },
  historyToggle: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  historyToggleText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 9.5,
  },

  // Timeline
  timelineContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
    borderRadius: Shapes.md,
    padding: Spacing.md,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.strokeSubtle,
  },
  timelineHeading: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.income,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    gap: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineAmount: {
    fontFamily: FontFamily.numericBold,
    fontSize: 12,
    color: Colors.income,
  },
  timelineDate: {
    fontFamily: FontFamily.numeric,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  timelineNote: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
});
