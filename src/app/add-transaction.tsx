/**
 * MyWallet — Add Transaction Screen
 * 
 * High-speed entry modal triggered by the FAB:
 * - Segmented Type Selector: Expense, Income, Transfer
 * - Live Evaluated Expression & Keypad
 * - Category & Subcategory Picker
 * - Account & Card Source Selector
 * - Note input & Date badge
 * - Instant SQLite persistence with reactive store refresh
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Calendar, Check, ArrowRightLeft, Sparkles, Handshake } from 'lucide-react-native';

import { QuickCalcKeypad } from '@/components/transaction/QuickCalcKeypad';
import { CategoryPicker } from '@/components/transaction/CategoryPicker';
import { PaymentSourceSelector } from '@/components/transaction/PaymentSourceSelector';
import { MoneyFlowConfirmationModal } from '@/components/transaction/MoneyFlowConfirmationModal';
import { CategoryEntryAtmosphere } from '@/components/transaction/CategoryEntryAtmosphere';
import { evaluateExpression } from '@/utils/mathEvaluator';
import {
  TransactionRepository,
  MerchantRepository,
  TemporaryTransactionRepository,
  BudgetRepository,
} from '@/repositories';
import { AiIntelligenceService, SoundService } from '@/services';
import { useFinancialStore, useTemporaryTransactionStore } from '@/stores';
import { TransactionType, CategoryType } from '@/db/schema';
import { Colors, Typography, Spacing, Shapes, FontFamily, Elevation } from '@/theme';

export default function AddTransactionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    prefillDate?: string;
    type?: string;
    amount?: string;
    note?: string;
    category?: string;
    account?: string;
  }>();
  const { accounts, creditCards, categories, refreshFinancials } = useFinancialStore();

  // Current Today String
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Transaction Form State (Supports deep-link from Android Home Screen Widget or AI Co-Pilot)
  const [type, setType] = useState<TransactionType>(() => {
    if (params.type === 'income' || params.type === 'transfer') {
      return params.type;
    }
    return 'expense';
  });
  const [expression, setExpression] = useState<string>(() => params.amount || '0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (params.category && categories?.length) {
      const match = categories.find((c) => c.name.toLowerCase().includes(params.category!.toLowerCase()));
      if (match) return match.id;
    }
    const firstExpense = categories?.find((c) => c.type === 'expense' && c.is_active === 1);
    return firstExpense?.id || 'cat_food';
  });
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'account' | 'credit_card'>('account');

  // Compute primary bank account
  const primaryAccount = useMemo(() => {
    return accounts.find((a) => a.is_primary === 1 && a.is_active === 1) || accounts[0] || null;
  }, [accounts]);

  const [sourceId, setSourceId] = useState<string>(() => {
    const primary = accounts.find((a) => a.is_primary === 1 && a.is_active === 1);
    return primary?.id || accounts[0]?.id || '';
  });
  const [destAccountId, setDestAccountId] = useState<string>(() => {
    const primary = accounts.find((a) => a.is_primary === 1 && a.is_active === 1);
    const secondary = accounts.find((a) => a.id !== (primary?.id || accounts[0]?.id));
    return secondary?.id || accounts[1]?.id || '';
  });
  const [note, setNote] = useState<string>(() => params.note || '');
  const [isTemporary, setIsTemporary] = useState<boolean>(false);
  const [personName, setPersonName] = useState<string>('');

  // A1: Animated "Money Flow" Transaction Confirmation State
  const [showMoneyFlow, setShowMoneyFlow] = useState<boolean>(false);
  const [confirmedTxData, setConfirmedTxData] = useState<{
    type: TransactionType;
    amount: number;
    sourceName: string;
    sourceType: 'account' | 'credit_card';
    destName?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryColor?: string;
    note?: string;
  } | null>(null);

  const handleFlowComplete = () => {
    setShowMoneyFlow(false);
    router.back();
  };

  // A5: Category-Specific Transaction Entry Atmosphere Color
  const activeMoodColor = useMemo(() => {
    if (type === 'transfer') return Colors.transfer;
    if (type === 'income') {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      return cat?.color || Colors.income;
    }
    // Expense
    const cat = categories.find((c) => c.id === selectedCategoryId);
    return cat?.color || '#FF6B6B';
  }, [type, selectedCategoryId, categories]);

  // Auto-sync default source to primary bank account if initialized before accounts loaded
  React.useEffect(() => {
    if (primaryAccount && !sourceId) {
      setSourceId(primaryAccount.id);
    }
  }, [primaryAccount, sourceId]);

  // Merchant suggestion presets & live reward tip
  const quickMerchants = useMemo(() => MerchantRepository.getQuickMerchantChips(), []);
  const rewardTip = useMemo(() => {
    if (!note.trim()) return null;
    return MerchantRepository.getRewardTipForMerchant(note, creditCards);
  }, [note, creditCards]);

  const handleSelectMerchant = (m: { name: string; brand: string }) => {
    Haptics.selectionAsync();
    setNote(m.name);
    const suggested = MerchantRepository.getSuggestedCategory(m.brand);
    if (suggested && type === 'expense') {
      setSelectedCategoryId(suggested.categoryId);
      if (suggested.subcategoryId) {
        setSelectedSubcategoryId(suggested.subcategoryId);
      }
    }
  };

  // Date selection state (supports custom/past dates & prefill from calendar)
  const [transactionDate, setTransactionDate] = useState<string>(
    params.prefillDate || todayStr
  );
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [customDateInput, setCustomDateInput] = useState(transactionDate);

  // Quick past dates generator
  const quickDates = useMemo(() => {
    const now = new Date();
    const dates = [];
    for (let i = 0; i <= 4; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      let label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${i} days ago`;
      dates.push({ label, dateStr: str });
    }
    return dates;
  }, []);

  // Display label for header date pill
  const datePillLabel = useMemo(() => {
    if (transactionDate === todayStr) return 'Today';
    const found = quickDates.find((q) => q.dateStr === transactionDate);
    if (found) return found.label;
    // Format YYYY-MM-DD to "DD Mon"
    try {
      const [y, m, d] = transactionDate.split('-').map(Number);
      const obj = new Date(y, m - 1, d);
      return obj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return transactionDate;
    }
  }, [transactionDate, todayStr, quickDates]);

  // Live evaluated amount
  const evaluatedAmount = useMemo(() => {
    return evaluateExpression(expression);
  }, [expression]);

  // Handle Keypad Inputs
  const handleKeyPress = (char: string) => {
    setExpression((prev) => {
      if (prev === '0' && !char.includes('.') && ![' + ', ' − ', ' × ', ' ÷ '].includes(char)) {
        return char;
      }
      return prev + char;
    });
  };

  const handleBackspace = () => {
    setExpression((prev) => {
      if (prev.length <= 1) return '0';
      if (prev.endsWith(' ')) {
        return prev.slice(0, -3) || '0';
      }
      return prev.slice(0, -1) || '0';
    });
  };

  const handleClear = () => {
    setExpression('0');
  };

  // Save Transaction to SQLite
  const handleSave = () => {
    if (evaluatedAmount <= 0) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Safe fallback
      }
    }

    const now = new Date();
    const time = now.toTimeString().split(' ')[0];

    // Branch: Paid on Behalf (Temporary Advance)
    // Does NOT alter bank balances or available to spend calculations
    if (isTemporary) {
      let paymentSourceName: string | null = null;
      if (sourceType === 'account') {
        const acc = accounts.find((a) => a.id === sourceId);
        paymentSourceName = acc ? acc.name : 'Bank Account';
      } else if (sourceType === 'credit_card') {
        const card = creditCards.find((c) => c.id === sourceId);
        paymentSourceName = card ? card.name : 'Credit Card';
      }

      const tempTxId = `temp_tx_${Date.now()}`;
      const fallbackTitle = personName.trim()
        ? `Paid for ${personName.trim()}`
        : 'Paid on Behalf';
      const tempTitle = note.trim() || fallbackTitle;

      TemporaryTransactionRepository.create({
        id: tempTxId,
        title: tempTitle,
        person_name: personName.trim() || null,
        amount: evaluatedAmount,
        payment_source_type: sourceType,
        payment_source_id: sourceId || null,
        payment_source_name: paymentSourceName,
        category_id: selectedCategoryId || null,
        date: transactionDate,
        time,
        is_returned: 0,
        returned_date: null,
        notes: note.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Reactive store update
      useTemporaryTransactionStore.getState().refresh();
      refreshFinancials();

      // A8: Ambient Sound Design trigger
      SoundService.play('expense');

      // Trigger cinematic Money Flow confirmation
      setConfirmedTxData({
        type: 'expense',
        amount: evaluatedAmount,
        sourceName: paymentSourceName || 'Bank Account',
        sourceType,
        destName: personName.trim() ? `Paid for ${personName.trim()}` : 'Paid on Behalf',
        categoryName: personName.trim() ? `For ${personName.trim()}` : 'Advance',
        categoryIcon: 'Handshake',
        categoryColor: Colors.chartreuse,
        note: note.trim() || undefined,
      });
      setShowMoneyFlow(true);
      return;
    }

    const txId = `tx_${Date.now()}`;

    const validAccountId =
      sourceType === 'account' && sourceId && accounts.some((a) => a.id === sourceId)
        ? sourceId
        : null;
    const validCardId =
      sourceType === 'credit_card' && sourceId && creditCards.some((c) => c.id === sourceId)
        ? sourceId
        : null;
    const validDestAccountId =
      type === 'transfer' && destAccountId && accounts.some((a) => a.id === destAccountId)
        ? destAccountId
        : null;

    const tx = {
      id: txId,
      type,
      amount: evaluatedAmount,
      account_id: validAccountId,
      dest_account_id: validDestAccountId,
      credit_card_id: validCardId,
      category_id: type !== 'transfer' ? selectedCategoryId : null,
      subcategory_id: type !== 'transfer' ? selectedSubcategoryId : null,
      date: transactionDate,
      time,
      note: note.trim() || (type === 'transfer' ? 'Transfer' : 'Quick Expense'),
      expression: expression !== `${evaluatedAmount}` ? expression : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    TransactionRepository.create(tx);

    // Reactive store update
    refreshFinancials();

    // A8: Ambient Sound Design trigger
    if (type === 'income') {
      SoundService.play('income');
    } else if (type === 'expense') {
      const budget = selectedCategoryId ? BudgetRepository.getByCategoryId(selectedCategoryId) : null;
      if (budget && budget.amount > 0) {
        const currentSpent = BudgetRepository.getCategorySpent(selectedCategoryId);
        if (currentSpent < budget.amount && (currentSpent + evaluatedAmount) >= budget.amount * 0.9) {
          SoundService.play('budget_warning');
        } else {
          SoundService.play('expense');
        }
      } else {
        SoundService.play('expense');
      }
    } else {
      SoundService.play('expense');
    }

    // Trigger cinematic Money Flow confirmation
    let srcName = 'Bank Account';
    if (sourceType === 'account') {
      const acc = accounts.find((a) => a.id === sourceId);
      srcName = acc?.name || 'Bank Account';
    } else {
      const card = creditCards.find((c) => c.id === sourceId);
      srcName = card?.name || 'Credit Card';
    }

    let dstName: string | undefined = undefined;
    if (type === 'transfer') {
      const destAcc = accounts.find((a) => a.id === destAccountId);
      dstName = destAcc?.name || 'Destination Account';
    }

    const cat = categories.find((c) => c.id === selectedCategoryId);
    const catName = cat?.name || (type === 'income' ? 'Income' : 'Expense');
    const catIcon = cat?.icon || (type === 'income' ? 'TrendingUp' : 'Utensils');
    const catColor = cat?.color || (type === 'income' ? Colors.income : Colors.expense);

    setConfirmedTxData({
      type,
      amount: evaluatedAmount,
      sourceName: srcName,
      sourceType,
      destName: dstName,
      categoryName: catName,
      categoryIcon: catIcon,
      categoryColor: catColor,
      note: note.trim() || undefined,
    });
    setShowMoneyFlow(true);
  };

  const categoryType: CategoryType = type === 'income' ? 'income' : 'expense';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      {/* A5: Category-Specific Transaction Entry Atmosphere */}
      <CategoryEntryAtmosphere color={activeMoodColor} />

      {/* ─── Top Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={20} color={Colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>LOG TRANSACTION</Text>

        <TouchableOpacity
          style={styles.datePill}
          activeOpacity={0.7}
          onPress={() => setDateModalVisible(true)}
        >
          <Calendar size={13} color={Colors.primaryFixed} />
          <Text style={[styles.dateText, { color: Colors.primaryFixed }]}>
            {datePillLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Type Selector: Expense / Income / Transfer ─── */}
      <View style={styles.typeSelectorRow}>
        {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => {
          const isSelected = type === t;
          let activeColor: string = Colors.primaryFixed;
          if (t === 'expense') activeColor = Colors.expense;
          if (t === 'income') activeColor = Colors.income;
          if (t === 'transfer') activeColor = Colors.transfer;

          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.typePill,
                isSelected && {
                  backgroundColor: `${activeColor}20`,
                  borderColor: activeColor,
                },
              ]}
              onPress={() => {
                setType(t);
                setSelectedSubcategoryId(null);
                if (t === 'income') {
                  setSelectedCategoryId('cat_salary');
                  setIsTemporary(false);
                } else if (t === 'expense') {
                  setSelectedCategoryId('cat_food');
                } else if (t === 'transfer') {
                  setIsTemporary(false);
                }
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.typePillText,
                  isSelected && { color: activeColor, fontWeight: '700' },
                ]}
              >
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Evaluated Expression Display ─── */}
        <View style={[styles.amountCard, { borderColor: `${activeMoodColor}45` }]}>
          {/* Running expression line */}
          <Text style={styles.expressionText}>
            {expression.includes('+') ||
            expression.includes('−') ||
            expression.includes('×') ||
            expression.includes('÷')
              ? expression
              : ''}
          </Text>

          {/* Main evaluated amount */}
          <View style={styles.amountDisplayRow}>
            <Text
              style={[
                styles.currencySymbol,
                { color: activeMoodColor },
              ]}
            >
              ₹
            </Text>
            <Text
              style={[
                styles.amountValue,
                { color: activeMoodColor },
              ]}
            >
              {evaluatedAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* ─── Category Picker (for Expense & Income) ─── */}
        {type !== 'transfer' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <CategoryPicker
              type={categoryType}
              selectedCategoryId={selectedCategoryId}
              selectedSubcategoryId={selectedSubcategoryId}
              onSelectCategory={setSelectedCategoryId}
              onSelectSubcategory={setSelectedSubcategoryId}
            />
          </View>
        )}

        {/* ─── Payment Source Selector ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {type === 'transfer' ? 'FROM ACCOUNT' : 'PAY FROM'}
          </Text>
          <PaymentSourceSelector
            accounts={accounts}
            creditCards={creditCards}
            selectedSourceType={sourceType}
            selectedSourceId={sourceId}
            onSelectSource={(t, id) => {
              setSourceType(t);
              setSourceId(id);
            }}
            isTransfer={type === 'transfer'}
          />
        </View>

        {/* ─── Destination Account (for Transfer only) ─── */}
        {type === 'transfer' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TO ACCOUNT</Text>
            <PaymentSourceSelector
              accounts={accounts.filter((a) => a.id !== sourceId)}
              creditCards={[]}
              selectedSourceType="account"
              selectedSourceId={destAccountId}
              onSelectSource={(_t, id) => setDestAccountId(id)}
              isTransfer={true}
            />
          </View>
        )}

        {/* ─── Note Input & Merchant Intelligence ─── */}
        <View style={styles.section}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add note or merchant (e.g. Swiggy, Uber, Chai)..."
            placeholderTextColor={Colors.onSurfaceVariant}
            value={note}
            onChangeText={setNote}
          />

          {/* Quick Merchant Suggestion Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.merchantChipsRow}
          >
            {quickMerchants.map((m) => {
              const isSelected = note.toLowerCase().includes(m.name.toLowerCase());
              return (
                <TouchableOpacity
                  key={m.name}
                  style={[styles.merchantChip, isSelected && styles.merchantChipActive]}
                  onPress={() => handleSelectMerchant(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.merchantChipText, isSelected && styles.merchantChipTextActive]}>
                    {m.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Credit Card Reward Tip Banner */}
          {rewardTip && (
            <View style={styles.rewardTipBanner}>
              <Sparkles size={13} color={Colors.chartreuse} />
              <Text style={styles.rewardTipText} numberOfLines={2}>
                {rewardTip.tip}
              </Text>
            </View>
          )}
        </View>

        {/* ─── Paid on Behalf (Temporary Advance) Toggle ─── */}
        {type === 'expense' && (
          <View style={[styles.tempAdvanceCard, isTemporary && styles.tempAdvanceCardActive]}>
            <View style={styles.tempAdvanceHeader}>
              <View style={[styles.tempAdvanceIconWrap, isTemporary && styles.tempAdvanceIconWrapActive]}>
                <Handshake size={18} color={isTemporary ? Colors.chartreuse : Colors.onSurfaceVariant} />
              </View>
              <View style={styles.tempAdvanceInfo}>
                <Text style={styles.tempAdvanceTitle}>Paid on Behalf (Temporary Advance)</Text>
                <Text style={styles.tempAdvanceSubtitle}>
                  {isTemporary
                    ? "Floating outlay • Won't affect Available to Spend"
                    : 'Turn on if paying for a friend or someone else'}
                </Text>
              </View>
              <Switch
                value={isTemporary}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setIsTemporary(val);
                }}
                trackColor={{ false: Colors.surfaceContainerHighest, true: Colors.chartreuse }}
                thumbColor={isTemporary ? '#000000' : Colors.onSurfaceVariant}
              />
            </View>

            {isTemporary && (
              <View style={styles.tempAdvanceBody}>
                <TextInput
                  style={styles.tempPersonInput}
                  placeholder="Who is this for? (e.g. Rahul, John, Team)"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={personName}
                  onChangeText={setPersonName}
                />
                <View style={styles.tempNoticeBox}>
                  <Text style={styles.tempNoticeText}>
                    Tracked separately in "Paid on Behalf" card. Bank balance & Available to Spend stay intact.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── Integrated Quick Calc Keypad ─── */}
        <View style={styles.keypadSection}>
          <QuickCalcKeypad
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onClear={handleClear}
          />
        </View>

        {/* ─── Save Action CTA ─── */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            isTemporary && styles.saveButtonTemporary,
            evaluatedAmount <= 0 && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={evaluatedAmount <= 0}
          activeOpacity={0.8}
        >
          <Check
            size={18}
            color={isTemporary ? '#000000' : Colors.onPrimary}
            strokeWidth={2.8}
          />
          <Text
            style={[
              styles.saveButtonText,
              isTemporary && styles.saveButtonTextTemporary,
            ]}
          >
            {isTemporary
              ? `Record Temporary Advance • ₹${evaluatedAmount.toLocaleString('en-IN')}`
              : `Save ${type.toUpperCase()} • ₹${evaluatedAmount.toLocaleString('en-IN')}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Date Picker Modal (Select Any Date) ─── */}
      <Modal
        visible={dateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDateModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDateModalVisible(false)}
        >
          <View style={styles.datePickerCard} onStartShouldSetResponder={() => true}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={() => setDateModalVisible(false)}
                style={styles.dateCloseBtn}
              >
                <X size={18} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <Text style={styles.dateSectionLabel}>RECENT DAYS</Text>
            <View style={styles.quickDatesGrid}>
              {quickDates.map((q) => {
                const isSelected = transactionDate === q.dateStr;
                return (
                  <TouchableOpacity
                    key={q.dateStr}
                    style={[
                      styles.quickDatePill,
                      isSelected && styles.quickDatePillActive,
                    ]}
                    onPress={() => {
                      setTransactionDate(q.dateStr);
                      setCustomDateInput(q.dateStr);
                      setDateModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        isSelected && styles.quickDateTextActive,
                      ]}
                    >
                      {q.label}
                    </Text>
                    <Text style={styles.quickDateSub}>{q.dateStr.slice(5)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Date Input */}
            <Text style={[styles.dateSectionLabel, { marginTop: 12 }]}>CUSTOM DATE (YYYY-MM-DD)</Text>
            <View style={styles.customDateRow}>
              <TextInput
                style={styles.customDateTextInput}
                value={customDateInput}
                onChangeText={setCustomDateInput}
                placeholder="2026-09-18"
                placeholderTextColor={Colors.onSurfaceVariant}
                maxLength={10}
              />
              <TouchableOpacity
                style={styles.applyDateBtn}
                onPress={() => {
                  if (customDateInput.trim().length === 10) {
                    setTransactionDate(customDateInput.trim());
                    setDateModalVisible(false);
                  }
                }}
                activeOpacity={0.8}
              >
                <Check size={16} color={Colors.surface} />
                <Text style={styles.applyDateText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── A1: Animated "Money Flow" Transaction Confirmation ─── */}
      <MoneyFlowConfirmationModal
        visible={showMoneyFlow}
        type={confirmedTxData?.type || 'expense'}
        amount={confirmedTxData?.amount || 0}
        sourceName={confirmedTxData?.sourceName || 'Account'}
        sourceType={confirmedTxData?.sourceType || 'account'}
        destName={confirmedTxData?.destName}
        categoryName={confirmedTxData?.categoryName}
        categoryIcon={confirmedTxData?.categoryIcon}
        categoryColor={confirmedTxData?.categoryColor}
        note={confirmedTxData?.note}
        onComplete={handleFlowComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurface,
    letterSpacing: 1.2,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  dateText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 8,
    gap: 8,
  },
  typePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  typePillText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 32,
    gap: 12,
  },
  amountCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 85,
  },
  expressionText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    minHeight: 18,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primaryFixed,
    marginRight: 4,
  },
  amountValue: {
    fontFamily: FontFamily.numericBold,
    fontSize: 42,
    fontWeight: '700',
    color: Colors.primaryFixed,
    fontVariant: ['tabular-nums'],
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 1,
  },
  noteInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.onSurface,
    fontFamily: FontFamily.body,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  keypadSection: {
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryContainer,
    borderRadius: Shapes.pill,
    paddingVertical: 14,
    marginTop: 6,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    ...Typography.bodyMdMedium,
    color: Colors.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.screenPadding,
  },
  datePickerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    padding: Spacing.lg,
    ...Elevation.high,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  datePickerTitle: {
    ...Typography.bodyLg,
    color: Colors.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  dateCloseBtn: {
    padding: 4,
  },
  dateSectionLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    marginBottom: 8,
  },
  quickDatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  quickDatePill: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  quickDatePillActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.15)',
    borderColor: Colors.primaryFixed,
  },
  quickDateText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 12,
  },
  quickDateTextActive: {
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  quickDateSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 2,
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customDateTextInput: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.onSurface,
    fontFamily: FontFamily.numeric,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  applyDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Shapes.md,
  },
  applyDateText: {
    ...Typography.bodySmMedium,
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  merchantChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 2,
  },
  merchantChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  merchantChipActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.15)',
    borderColor: Colors.chartreuse,
  },
  merchantChipText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  merchantChipTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },
  rewardTipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(200, 243, 34, 0.08)',
    borderRadius: Shapes.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.20)',
    marginTop: 6,
  },
  rewardTipText: {
    ...Typography.bodySm,
    color: Colors.chartreuse,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
  // Paid on Behalf (Temporary Advance) Styles
  tempAdvanceCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    marginBottom: Spacing.md,
  },
  tempAdvanceCardActive: {
    borderColor: 'rgba(200, 243, 34, 0.4)',
    backgroundColor: 'rgba(200, 243, 34, 0.04)',
  },
  tempAdvanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tempAdvanceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  tempAdvanceIconWrapActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.15)',
    borderColor: Colors.chartreuse,
  },
  tempAdvanceInfo: {
    flex: 1,
  },
  tempAdvanceTitle: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 13,
  },
  tempAdvanceSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  tempAdvanceBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.strokeSubtle,
    gap: 8,
  },
  tempPersonInput: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: Colors.onSurface,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  tempNoticeBox: {
    backgroundColor: 'rgba(200, 243, 34, 0.08)',
    borderRadius: Shapes.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.18)',
  },
  tempNoticeText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
  },
  saveButtonTemporary: {
    backgroundColor: Colors.chartreuse,
  },
  saveButtonTextTemporary: {
    color: '#000000',
    fontWeight: '800',
  },
});

