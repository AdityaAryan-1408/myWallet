/**
 * MyWallet — Smart SMS Parser & Staging Modal
 * 
 * Interactive control center for Bank SMS Parsing:
 * - One-tap simulation presets for SBI, Indian Bank, Slice, SBI Credit Card, and Income
 * - "Simulate Multiple SMS" test (validates 2 notifications coexist in the Android tray)
 * - Custom SMS paste & live parser preview
 * - Staged queue view with 1-tap ledger conversion
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  CreditCard,
  Building2,
  CheckCircle2,
  Copy,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SmsParserService, ParsedSmsResult } from '@/services/smsParserService';
import { SmsStagingRepository } from '@/repositories/smsStagingRepository';
import { SmsStagedTransaction } from '@/db/schema';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, Shapes, Elevation, FontFamily } from '@/theme';

interface SmsParserModalProps {
  visible: boolean;
  onClose: () => void;
}

const PRESETS = [
  {
    id: 'sbi_debit',
    label: 'SBI Bank (Expense)',
    sender: 'SBIINB',
    body: 'Dear SBI User, your A/c ending 1234 debited by Rs 450.00 on 19Oct26 by transfer to SWIGGY. Ref No 891234. Bal: Rs 15,200.00',
  },
  {
    id: 'ind_bank',
    label: 'IND Bank (Expense)',
    sender: 'INDBNK',
    body: 'Dear Customer, A/c *4321 debited for Rs 850.00 on 19-10-2026 towards UPI/429402/Zomato. Avail Bal: Rs 4,200.00 - Indian Bank',
  },
  {
    id: 'slice',
    label: 'Slice Card (Expense)',
    sender: 'SLICEC',
    body: 'You spent Rs 320 at Starbucks using Slice. Available limit: Rs 14,000',
  },
  {
    id: 'sbi_cc',
    label: 'SBI Credit Card (Expense)',
    sender: 'SBICRD',
    body: 'Txn of Rs. 1,450.00 spent on your SBI Card ending 5678 at AMAZON on 19-Oct-26. Avl Lmt: Rs 45,000.00',
  },
  {
    id: 'income',
    label: 'SBI (Salary / Income)',
    sender: 'SBIINB',
    body: 'Your A/C XXXXX1234 is credited with Rs 25,000.00 on 19Oct26 by transfer from ACME TECH CORP. Bal: Rs 40,200.00',
  },
];

export function SmsParserModal({ visible, onClose }: SmsParserModalProps) {
  const router = useRouter();
  const { themeMode } = useFinancialStore();
  const isLight = themeMode === 'light' || themeMode === 'mono_light';

  const [inputSms, setInputSms] = useState('');
  const [senderHeader, setSenderHeader] = useState('SBIINB');
  const [preview, setPreview] = useState<ParsedSmsResult | null>(null);
  const [pendingQueue, setPendingQueue] = useState<SmsStagedTransaction[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const reloadQueue = useCallback(() => {
    try {
      setPendingQueue(SmsStagingRepository.getPending());
    } catch {
      setPendingQueue([]);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      reloadQueue();
      setStatusMessage(null);
    }
  }, [visible, reloadQueue]);

  // Live preview as user types or picks preset
  useEffect(() => {
    if (inputSms.trim().length > 5) {
      const res = SmsParserService.parseSms(inputSms, senderHeader);
      setPreview(res);
    } else {
      setPreview(null);
    }
  }, [inputSms, senderHeader]);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputSms(preset.body);
    setSenderHeader(preset.sender);
  };

  const handleDispatchNotification = async () => {
    if (!inputSms.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const staged = await SmsParserService.processIncomingSms(inputSms, senderHeader);
    if (staged) {
      setStatusMessage(`Dispatched OS notification for ₹${staged.amount.toLocaleString('en-IN')}`);
      reloadQueue();
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage('Could not parse valid transaction from this SMS.');
    }
  };

  const handleSimulateMultiple = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 1. First SMS: SBI Swiggy
    await SmsParserService.processIncomingSms(PRESETS[0].body, PRESETS[0].sender);
    // 2. Second SMS: Slice Starbucks
    await SmsParserService.processIncomingSms(PRESETS[2].body, PRESETS[2].sender);

    reloadQueue();
    setStatusMessage('Dispatched 2 separate OS notifications! Check your notification tray.');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleOpenStaged = (staged: SmsStagedTransaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push({
      pathname: '/add-transaction',
      params: {
        type: staged.type,
        amount: String(staged.amount),
        note: staged.merchant_name || '',
        account: staged.account_id || undefined,
        creditCardId: staged.credit_card_id || undefined,
        category: staged.category_id || undefined,
        stagedSmsId: staged.id,
      },
    });
  };

  const handleDismissStaged = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    SmsStagingRepository.markDismissed(id);
    reloadQueue();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.backdrop} />

        <View style={[styles.container, isLight && styles.containerLight]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badgePill}>
                <Sparkles size={12} color={Colors.primaryFixed} />
                <Text style={styles.badgeText}>SMART BANK SMS PARSER</Text>
              </View>
              <Text style={styles.headerTitle}>SMS Staging & Multi-Notification</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Status Feedback Toast */}
            {statusMessage && (
              <View style={styles.statusToast}>
                <CheckCircle2 size={16} color={Colors.primaryFixed} />
                <Text style={styles.statusToastText}>{statusMessage}</Text>
              </View>
            )}

            {/* Quick Test Presets */}
            <Text style={styles.sectionTitle}>1-TAP TEST PRESETS</Text>
            <View style={styles.presetsGrid}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(p)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.presetChipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Multiple SMS Test Action */}
            <TouchableOpacity
              style={styles.multiSimBtn}
              onPress={handleSimulateMultiple}
              activeOpacity={0.8}
            >
              <Layers size={16} color="#000000" />
              <Text style={styles.multiSimBtnText}>
                Simulate 2 Coexisting SMS Notifications
              </Text>
            </TouchableOpacity>
            <Text style={styles.multiSimSub}>
              Tests multi-SMS isolation: opening one notification does not dismiss the other in the tray.
            </Text>

            {/* Custom Input */}
            <Text style={styles.sectionTitle}>PASTE OR EDIT BANK SMS</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Paste incoming bank SMS here (e.g. from SBI, Indian Bank, Slice)..."
                placeholderTextColor={Colors.onSurfaceVariant}
                value={inputSms}
                onChangeText={setInputSms}
              />
            </View>

            {/* Live Parser Result Preview */}
            {preview && (
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewTypeRow}>
                    {preview.type === 'expense' ? (
                      <ArrowUpRight size={16} color="#EF4444" />
                    ) : (
                      <ArrowDownLeft size={16} color="#10B981" />
                    )}
                    <Text
                      style={[
                        styles.previewType,
                        { color: preview.type === 'expense' ? '#EF4444' : '#10B981' },
                      ]}
                    >
                      DETECTED {preview.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.previewAmount}>
                    ₹{preview.amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.previewDetailsRow}>
                  <Text style={styles.previewDetail}>
                    🏦 <Text style={styles.previewBold}>{preview.bankOrCardName}</Text>
                  </Text>
                  <Text style={styles.previewDetail}>
                    🏷️ <Text style={styles.previewBold}>{preview.merchantName}</Text>
                  </Text>
                </View>

                {preview.closingBalance !== undefined && (
                  <Text style={styles.previewBal}>
                    Closing Bal: ₹{preview.closingBalance.toLocaleString('en-IN')}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.dispatchBtn}
                  onPress={handleDispatchNotification}
                  activeOpacity={0.8}
                >
                  <Send size={15} color="#000000" />
                  <Text style={styles.dispatchBtnText}>Dispatch OS Push Notification</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Pending Staged Transactions */}
            <View style={styles.stagedSection}>
              <View style={styles.stagedHeader}>
                <Text style={styles.sectionTitle}>
                  STAGED PENDING NOTIFICATIONS ({pendingQueue.length})
                </Text>
              </View>

              {pendingQueue.length === 0 ? (
                <View style={styles.emptyStaged}>
                  <Text style={styles.emptyStagedText}>
                    No pending staged SMS. Pick a preset or simulate above to test!
                  </Text>
                </View>
              ) : (
                pendingQueue.map((item) => (
                  <View key={item.id} style={styles.stagedItem}>
                    <View style={styles.stagedLeft}>
                      <View style={styles.stagedAmountRow}>
                        <Text
                          style={[
                            styles.stagedAmount,
                            { color: item.type === 'expense' ? Colors.onSurface : Colors.income },
                          ]}
                        >
                          ₹{item.amount.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.stagedType}>{item.type.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.stagedMerchant} numberOfLines={1}>
                        {item.merchant_name || item.sender}
                      </Text>
                      <Text style={styles.stagedTime}>
                        {new Date(item.received_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <View style={styles.stagedActions}>
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => handleOpenStaged(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reviewBtnText}>Review & Add</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dismissBtn}
                        onPress={() => handleDismissStaged(item.id)}
                        activeOpacity={0.7}
                      >
                        <X size={14} color={Colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
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
    maxHeight: '90%',
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
    marginBottom: 16,
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
  closeBtn: {
    padding: 6,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainer,
  },
  scrollView: {
    flexGrow: 1,
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 255, 50, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.3)',
    borderRadius: Shapes.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  statusToastText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 12,
    color: Colors.onSurface,
    flex: 1,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
  },
  presetChipText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    color: Colors.onSurface,
  },
  multiSimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 11,
    borderRadius: Shapes.pill,
    marginTop: 4,
  },
  multiSimBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#000000',
  },
  multiSimSub: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    padding: 10,
    minHeight: 70,
    marginBottom: 12,
  },
  textInput: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    color: Colors.onSurface,
    lineHeight: 18,
  },
  previewCard: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewType: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  previewAmount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.primaryFixed,
  },
  previewDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  previewDetail: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  previewBold: {
    fontFamily: FontFamily.headingBold,
    color: Colors.onSurface,
  },
  previewBal: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryFixed,
    paddingVertical: 10,
    borderRadius: Shapes.pill,
    marginTop: 6,
  },
  dispatchBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    color: '#000000',
  },
  stagedSection: {
    marginTop: 8,
  },
  stagedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyStaged: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
  },
  emptyStagedText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  stagedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    padding: 12,
    marginBottom: 8,
  },
  stagedLeft: {
    flex: 1,
    gap: 2,
  },
  stagedAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  stagedAmount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
  },
  stagedType: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  stagedMerchant: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 12,
    color: Colors.onSurface,
  },
  stagedTime: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  stagedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewBtn: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
  },
  reviewBtnText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 11,
    color: '#000000',
  },
  dismissBtn: {
    padding: 6,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHighest,
  },
});
