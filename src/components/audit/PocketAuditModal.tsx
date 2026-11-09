/**
 * MyWallet — Pocket Audit Modal (Feature B7)
 * 
 * 60-Second Tinder-style Daily Review Flow:
 * - Swipeable card interface to verify recent unreviewed transactions
 * - Green Check (Swipe Right): Confirms transaction is correct ✓
 * - Yellow Pencil (Swipe Left): Opens edit screen
 * - Red Trash (Swipe Up/Tap): Removes transaction with undo snackbar
 * - Rewarding completion state with ledger accuracy affirmation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  Check,
  Edit3,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  CheckCheck,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { PocketAuditService } from '@/services/pocketAuditService';
import { TransactionWithDetails } from '@/repositories/transactionRepository';
import { Transaction } from '@/db/schema';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Shapes, Elevation, FontFamily } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;

interface PocketAuditModalProps {
  visible: boolean;
  onClose: () => void;
  onEditTransaction?: (tx: TransactionWithDetails) => void;
}

export function PocketAuditModal({
  visible,
  onClose,
  onEditTransaction,
}: PocketAuditModalProps) {
  const router = useRouter();
  const { refreshFinancials, themeMode } = useFinancialStore();
  const isLight = themeMode === 'light' || themeMode === 'mono_light';

  const [queue, setQueue] = useState<TransactionWithDetails[]>([]);
  const [initialCount, setInitialCount] = useState<number>(0);
  const [deletedTx, setDeletedTx] = useState<Transaction | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Load unreviewed transactions whenever modal opens
  useEffect(() => {
    if (visible) {
      const state = PocketAuditService.getAuditQueue(100);
      setQueue(state.queue);
      setInitialCount(state.totalCount || state.queue.length);
      setDeletedTx(null);
    }
  }, [visible]);

  const currentCard = queue[0] || null;
  const reviewedCount = initialCount - queue.length;
  const progressRatio = initialCount > 0 ? reviewedCount / initialCount : 1;

  // Gesture values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0, { damping: 15 });
    translateY.value = withSpring(0, { damping: 15 });
  }, [translateX, translateY]);

  const handleVerify = useCallback(() => {
    if (!currentCard) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    PocketAuditService.verify(currentCard.id);
    setQueue((prev) => prev.slice(1));
    resetPosition();
    refreshFinancials();
  }, [currentCard, resetPosition, refreshFinancials]);

  const handleEdit = useCallback(() => {
    if (!currentCard) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onEditTransaction) {
      onEditTransaction(currentCard);
    } else {
      onClose();
      router.push({
        pathname: '/add-transaction',
        params: {
          editId: currentCard.id,
          type: currentCard.type,
          amount: String(currentCard.amount),
          note: currentCard.note || '',
          categoryId: currentCard.category_id || undefined,
          category: currentCard.category_name || undefined,
          accountId: currentCard.account_id || undefined,
          destAccountId: currentCard.dest_account_id || undefined,
          creditCardId: currentCard.credit_card_id || undefined,
          date: currentCard.date,
          time: currentCard.time,
        },
      });
    }
  }, [currentCard, onEditTransaction, onClose, router]);

  const handleDelete = useCallback(() => {
    if (!currentCard) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const backup = PocketAuditService.deleteWithBackup(currentCard.id);
    setDeletedTx(backup);
    setQueue((prev) => prev.slice(1));
    resetPosition();
    refreshFinancials();

    if (undoTimer) clearTimeout(undoTimer);
    const timer = setTimeout(() => {
      setDeletedTx(null);
    }, 5000);
    setUndoTimer(timer);
  }, [currentCard, resetPosition, refreshFinancials, undoTimer]);

  const handleUndo = useCallback(() => {
    if (!deletedTx) return;
    PocketAuditService.restore(deletedTx);
    setDeletedTx(null);
    if (undoTimer) clearTimeout(undoTimer);
    // Reload queue
    const state = PocketAuditService.getAuditQueue(100);
    setQueue(state.queue);
    refreshFinancials();
  }, [deletedTx, undoTimer, refreshFinancials]);

  const handleVerifyAll = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    PocketAuditService.verifyAll(queue.map((t) => t.id));
    setQueue([]);
    refreshFinancials();
  }, [queue, refreshFinancials]);

  // Swiping Gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swiped Right -> Verify
        translateX.value = withTiming(SCREEN_WIDTH * 1.2, { duration: 250 }, () => {
          runOnJS(handleVerify)();
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swiped Left -> Edit
        translateX.value = withTiming(-SCREEN_WIDTH * 1.2, { duration: 250 }, () => {
          runOnJS(handleEdit)();
        });
      } else if (event.translationY < -120) {
        // Swiped Up -> Delete
        translateY.value = withTiming(-400, { duration: 250 }, () => {
          runOnJS(handleDelete)();
        });
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = (translateX.value / SCREEN_WIDTH) * 15;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.overlay}>
        <View style={styles.backdrop} />

        <View style={[styles.container, isLight && styles.containerLight]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badgePill}>
                <Sparkles size={12} color={Colors.primaryFixed} />
                <Text style={styles.badgeText}>60-SEC POCKET AUDIT</Text>
              </View>
              <Text style={styles.headerTitle}>Daily Ledger Review</Text>
            </View>

            <View style={styles.headerRight}>
              {queue.length > 0 && (
                <TouchableOpacity
                  style={styles.verifyAllBtn}
                  onPress={handleVerifyAll}
                  activeOpacity={0.7}
                >
                  <CheckCheck size={14} color={Colors.primaryFixed} />
                  <Text style={styles.verifyAllText}>Verify All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Indicator */}
          {initialCount > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.round(progressRatio * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {reviewedCount} of {initialCount} verified
              </Text>
            </View>
          )}

          {/* Card Deck Area */}
          <View style={styles.deckArea}>
            {queue.length > 0 && currentCard ? (
              <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.card, animatedCardStyle]}>
                  {/* Card Header: Date & Time */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.datePill}>
                      <Calendar size={12} color={Colors.onSurfaceVariant} />
                      <Text style={styles.dateText}>
                        {currentCard.date} • {currentCard.time || '12:00'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor:
                            currentCard.type === 'expense'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          {
                            color:
                              currentCard.type === 'expense'
                                ? '#EF4444'
                                : '#10B981',
                          },
                        ]}
                      >
                        {currentCard.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Card Amount */}
                  <View style={styles.amountBox}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text
                      style={[
                        styles.amountValue,
                        {
                          color:
                            currentCard.type === 'expense'
                              ? Colors.onSurface
                              : Colors.income,
                        },
                      ]}
                    >
                      {currentCard.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Category Chip */}
                  <View style={styles.categoryChip}>
                    <View
                      style={[
                        styles.categoryDot,
                        {
                          backgroundColor:
                            currentCard.category_color || Colors.primaryFixed,
                        },
                      ]}
                    />
                    <Text style={styles.categoryName}>
                      {currentCard.category_name || 'Uncategorized'}
                    </Text>
                    {currentCard.subcategory_name && (
                      <Text style={styles.subcategoryName}>
                        • {currentCard.subcategory_name}
                      </Text>
                    )}
                  </View>

                  {/* Payment Source */}
                  <View style={styles.sourceRow}>
                    {currentCard.credit_card_id ? (
                      <>
                        <CreditCard size={15} color={Colors.secondaryFixed} />
                        <Text style={styles.sourceText}>
                          {currentCard.credit_card_name || 'Credit Card'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Building2 size={15} color={Colors.primaryFixed} />
                        <Text style={styles.sourceText}>
                          {currentCard.account_name || 'Bank Account'}
                        </Text>
                      </>
                    )}
                  </View>

                  {/* Note / Merchant */}
                  {currentCard.note && (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText} numberOfLines={2}>
                        "{currentCard.note}"
                      </Text>
                    </View>
                  )}

                  {/* Swipe Help Guide */}
                  <View style={styles.swipeGuide}>
                    <Text style={styles.guideText}>
                      👈 Left to Edit • 👉 Right to Verify
                    </Text>
                  </View>
                </Animated.View>
              </GestureDetector>
            ) : (
              /* All Caught Up Celebration */
              <View style={styles.emptyCard}>
                <View style={styles.celebrationCircle}>
                  <ShieldCheck size={44} color={Colors.primaryFixed} />
                </View>
                <Text style={styles.emptyTitle}>All Caught Up! ✨</Text>
                <Text style={styles.emptySub}>
                  Zero unreviewed transactions. Your financial balance is verified and 100% accurate.
                </Text>
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.doneBtnText}>Return to Dashboard</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Action Button Bar */}
          {queue.length > 0 && currentCard && (
            <View style={styles.actionsBar}>
              {/* Delete Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Trash2 size={20} color="#EF4444" />
                <Text style={styles.deleteBtnLabel}>Delete</Text>
              </TouchableOpacity>

              {/* Edit Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <Edit3 size={20} color="#F59E0B" />
                <Text style={styles.editBtnLabel}>Edit</Text>
              </TouchableOpacity>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.verifyBtn]}
                onPress={handleVerify}
                activeOpacity={0.7}
              >
                <Check size={22} color="#000000" />
                <Text style={styles.verifyBtnLabel}>Verify ✓</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Undo Banner */}
          {deletedTx && (
            <Animated.View style={styles.undoBanner}>
              <Text style={styles.undoText}>
                Removed transaction of ₹{deletedTx.amount.toLocaleString('en-IN')}
              </Text>
              <TouchableOpacity
                style={styles.undoBtn}
                onPress={handleUndo}
                activeOpacity={0.7}
              >
                <RotateCcw size={14} color={Colors.primaryFixed} />
                <Text style={styles.undoBtnText}>Undo</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    minHeight: 520,
    ...Elevation.high,
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeft: {
    gap: 4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212, 255, 50, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    color: Colors.primaryFixed,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 255, 50, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.25)',
  },
  verifyAllText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: Colors.primaryFixed,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainer,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primaryFixed,
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  deckArea: {
    height: 290,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    padding: 20,
    justifyContent: 'space-between',
    ...Elevation.high,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  typeBadgeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 10,
  },
  currencySymbol: {
    fontSize: 26,
    fontFamily: FontFamily.headingBold,
    color: Colors.primaryFixed,
    marginRight: 4,
  },
  amountValue: {
    fontSize: 42,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -1,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    alignSelf: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: Colors.onSurface,
  },
  subcategoryName: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sourceText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  noteBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.sm,
    alignSelf: 'center',
  },
  noteText: {
    fontFamily: FontFamily.body,
    fontStyle: 'italic',
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  swipeGuide: {
    alignItems: 'center',
  },
  guideText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    opacity: 0.7,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  celebrationCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 255, 50, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  emptySub: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  doneBtn: {
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: Shapes.pill,
    marginTop: 8,
  },
  doneBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: '#000000',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: Shapes.pill,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnLabel: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#EF4444',
  },
  editBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  editBtnLabel: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#F59E0B',
  },
  verifyBtn: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primaryFixed,
    flex: 1.4,
  },
  verifyBtnLabel: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: '#000000',
  },
  undoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Shapes.md,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  undoText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 12,
    color: Colors.onSurface,
    flex: 1,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 255, 50, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
  },
  undoBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: Colors.primaryFixed,
  },
});
