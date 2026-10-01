/**
 * MyWallet — Add / Edit Debt Modal
 * 
 * Phase 11: Peer debt management modal for "I Owe" vs "They Owe Me" balances:
 * - Direction toggle: Receivable (They Owe Me) vs Payable (I Owe)
 * - Person name with previously logged people autocomplete chips
 * - Amount with numeric validation
 * - Reason / description with quick common presets (Dinner, Cab, Groceries, Loan)
 * - Safe deletion with confirmation (edit mode)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Check,
  Trash2,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Bell,
  AtSign,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';

import { PeopleDebt, DebtDirection, ReminderCadence } from '@/db/schema';
import { DebtRepository, SettingsRepository } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { COMMON_UPI_HANDLES, validateUpiId } from '@/utils/upi';
import { Colors, Typography, Spacing, Shapes, FontFamily, Elevation } from '@/theme';

const REASON_PRESETS = [
  'Dinner split',
  'Cab share',
  'Groceries',
  'Coffee & snacks',
  'Movie tickets',
  'Personal loan',
  'Rent share',
];

export interface AddEditDebtModalProps {
  visible: boolean;
  debtToEdit?: PeopleDebt | null;
  presetDirection?: DebtDirection;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddEditDebtModal({
  visible,
  debtToEdit,
  presetDirection = 'they_owe',
  onClose,
  onSuccess,
}: AddEditDebtModalProps) {
  const insets = useSafeAreaInsets();
  const { createDebt, updateDebt, deleteDebt } = useFinancialStore();

  const isEdit = !!debtToEdit;

  const [personName, setPersonName] = useState('');
  const [direction, setDirection] = useState<DebtDirection>(presetDirection);
  const [amountStr, setAmountStr] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [upiId, setUpiId] = useState('');
  const [reminderCadence, setReminderCadence] = useState<ReminderCadence>('none');
  const [reminderDateStr, setReminderDateStr] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [selectedWeekday, setSelectedWeekday] = useState<number>(new Date().getDay());

  const WEEKDAYS = [
    { day: 0, label: 'Sun', full: 'Sunday' },
    { day: 1, label: 'Mon', full: 'Monday' },
    { day: 2, label: 'Tue', full: 'Tuesday' },
    { day: 3, label: 'Wed', full: 'Wednesday' },
    { day: 4, label: 'Thu', full: 'Thursday' },
    { day: 5, label: 'Fri', full: 'Friday' },
    { day: 6, label: 'Sat', full: 'Saturday' },
  ];

  // Distinct people from repository for autocomplete
  const existingPeople = useMemo(() => {
    return DebtRepository.getDistinctPeople();
  }, [visible]);

  // Pre-fill fields on open
  useEffect(() => {
    if (visible) {
      const globalTime = SettingsRepository.getPreferredReminderTime() || '09:00';
      if (debtToEdit) {
        setPersonName(debtToEdit.person_name);
        setDirection(debtToEdit.direction);
        setAmountStr(debtToEdit.amount.toString());
        setReason(debtToEdit.reason || '');
        setNote(debtToEdit.note || '');
        setUpiId(debtToEdit.upi_id || '');
        setReminderCadence(debtToEdit.reminder_cadence || 'none');
        setReminderDateStr(debtToEdit.reminder_date || '');
        setReminderTime(debtToEdit.reminder_time || globalTime);
        if (debtToEdit.reminder_cadence === 'weekly' && debtToEdit.reminder_date) {
          const d = new Date(debtToEdit.reminder_date);
          if (!isNaN(d.getTime())) {
            setSelectedWeekday(d.getDay());
          }
        }
      } else {
        setPersonName('');
        setDirection(presetDirection);
        setAmountStr('');
        setReason('');
        setNote('');
        setUpiId('');
        setReminderCadence('none');
        setReminderDateStr('');
        setReminderTime(globalTime);
        setSelectedWeekday(new Date().getDay());
      }
    }
  }, [visible, debtToEdit, presetDirection]);

  // Live Next-Fire Calculation and Past-Date Validation
  const nextFireInfo = useMemo(() => {
    if (reminderCadence === 'none') {
      return { text: 'No automatic reminder scheduled.', isValid: true, isPast: false };
    }

    const [hStr, mStr] = (reminderTime || '09:00').split(':');
    const h = parseInt(hStr, 10) || 9;
    const m = parseInt(mStr, 10) || 0;
    const now = new Date();

    if (reminderCadence === 'daily') {
      const target = new Date();
      target.setHours(h, m, 0, 0);
      let isTomorrow = false;
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
        isTomorrow = true;
      }
      const formattedTime = target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        text: `Fires ${isTomorrow ? 'tomorrow' : 'today'} at ${formattedTime} (repeats daily)`,
        isValid: true,
        isPast: false,
      };
    }

    if (reminderCadence === 'weekly') {
      const target = new Date();
      target.setHours(h, m, 0, 0);
      let daysUntil = (selectedWeekday - now.getDay() + 7) % 7;
      if (daysUntil === 0 && target.getTime() <= now.getTime()) {
        daysUntil = 7;
      }
      target.setDate(now.getDate() + daysUntil);
      const weekdayName = WEEKDAYS.find((w) => w.day === selectedWeekday)?.full || 'Weekly';
      const formattedTime = target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nextDateStr = target.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      return {
        text: `Every ${weekdayName} at ${formattedTime} (next: ${nextDateStr})`,
        isValid: true,
        isPast: false,
      };
    }

    if (reminderCadence === 'custom_date') {
      if (!reminderDateStr || !reminderDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return { text: 'Choose or enter a valid date (YYYY-MM-DD)', isValid: false, isPast: false };
      }
      const target = new Date(`${reminderDateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      if (isNaN(target.getTime())) {
        return { text: 'Invalid date format (use YYYY-MM-DD)', isValid: false, isPast: false };
      }
      if (target.getTime() <= now.getTime()) {
        return {
          text: 'Selected date & time is in the past. Choose a future schedule.',
          isValid: false,
          isPast: true,
        };
      }
      const formatted = target.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const formattedTime = target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        text: `Fires on ${formatted} at ${formattedTime}`,
        isValid: true,
        isPast: false,
      };
    }

    return { text: '', isValid: true, isPast: false };
  }, [reminderCadence, reminderDateStr, reminderTime, selectedWeekday]);

  const amount = parseFloat(amountStr) || 0;
  const isFormBasicsValid = personName.trim().length > 0 && amount > 0;
  const isScheduleValid = reminderCadence === 'none' || nextFireInfo.isValid;
  const isValid = isFormBasicsValid && isScheduleValid;
  const isUpiValid = useMemo(() => validateUpiId(upiId), [upiId]);

  const handleAppendUpiSuffix = (suffix: string) => {
    Haptics.selectionAsync();
    const current = upiId.trim();
    const atIndex = current.indexOf('@');
    if (atIndex !== -1) {
      setUpiId(current.substring(0, atIndex) + suffix);
    } else if (current.length > 0) {
      setUpiId(current + suffix);
    } else {
      setUpiId(suffix);
    }
  };

  const handleSelectDatePreset = (daysAhead: number) => {
    Haptics.selectionAsync();
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setReminderDateStr(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  };

  const handleSelectEndOfMonth = () => {
    Haptics.selectionAsync();
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setReminderDateStr(
      `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    );
  };

  const handleSave = () => {
    if (!isFormBasicsValid) return;

    if (reminderCadence === 'custom_date' && !nextFireInfo.isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Future Date Required',
        nextFireInfo.isPast
          ? 'The selected reminder date and time have already passed. Please select a future date or adjust the time.'
          : 'Please provide a valid date in YYYY-MM-DD format.'
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const trimmedName = personName.trim();
    const trimmedReason = reason.trim() || null;
    const trimmedNote = note.trim() || null;
    const trimmedUpiId = upiId.trim() || null;

    let computedReminderDate: string | null = null;
    let computedReminderTime: string | null = null;

    if (reminderCadence === 'weekly') {
      const now = new Date();
      const [hStr, mStr] = (reminderTime || '09:00').split(':');
      const target = new Date();
      target.setHours(parseInt(hStr, 10) || 9, parseInt(mStr, 10) || 0, 0, 0);
      let daysUntil = (selectedWeekday - now.getDay() + 7) % 7;
      if (daysUntil === 0 && target.getTime() <= now.getTime()) {
        daysUntil = 7;
      }
      target.setDate(now.getDate() + daysUntil);
      computedReminderDate = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
      computedReminderTime = reminderTime || '09:00';
    } else if (reminderCadence === 'custom_date') {
      computedReminderDate = reminderDateStr.trim() || null;
      computedReminderTime = reminderTime || '09:00';
    } else if (reminderCadence === 'daily') {
      computedReminderDate = null;
      computedReminderTime = reminderTime || '09:00';
    } else {
      computedReminderDate = null;
      computedReminderTime = null;
    }

    if (isEdit && debtToEdit) {
      updateDebt(debtToEdit.id, {
        person_name: trimmedName,
        direction,
        amount,
        reason: trimmedReason,
        note: trimmedNote,
        upi_id: trimmedUpiId,
        reminder_cadence: reminderCadence,
        reminder_date: computedReminderDate,
        reminder_time: computedReminderTime,
      });
    } else {
      createDebt({
        id: `debt_${Date.now()}`,
        person_name: trimmedName,
        direction,
        amount,
        reason: trimmedReason,
        note: trimmedNote,
        upi_id: trimmedUpiId,
        is_settled: 0,
        reminder_cadence: reminderCadence,
        reminder_date: computedReminderDate,
        reminder_time: computedReminderTime,
      });
    }

    onSuccess?.();
    onClose();
  };

  const handleDelete = () => {
    if (!debtToEdit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Debt Record',
      `Delete debt record with "${debtToEdit.person_name}" for ₹${debtToEdit.amount.toLocaleString('en-IN')}? All repayment history for this debt will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDebt(debtToEdit.id);
            onClose();
          },
        },
      ]
    );
  };

  const activeColor = direction === 'they_owe' ? Colors.income : Colors.expense;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top || 16 }]}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            activeOpacity={0.7}
          >
            <X size={20} color={Colors.onSurface} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Debt Record' : 'Log New Debt / Loan'}
          </Text>

          <TouchableOpacity
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <Check size={18} color={isValid ? '#000' : Colors.onSurfaceVariant} />
            <Text style={[styles.saveBtnText, !isValid && styles.saveBtnTextDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Direction Segmented Selector ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DEBT DIRECTION</Text>
            <View style={styles.directionSelector}>
              <TouchableOpacity
                style={[
                  styles.directionPill,
                  direction === 'they_owe' && styles.theyOwePillActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDirection('they_owe');
                }}
                activeOpacity={0.7}
              >
                <ArrowDownLeft
                  size={16}
                  color={direction === 'they_owe' ? Colors.income : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.directionPillText,
                    direction === 'they_owe' && { color: Colors.income, fontWeight: '700' },
                  ]}
                >
                  THEY OWE ME
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.directionPill,
                  direction === 'i_owe' && styles.iOwePillActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDirection('i_owe');
                }}
                activeOpacity={0.7}
              >
                <ArrowUpRight
                  size={16}
                  color={direction === 'i_owe' ? Colors.expense : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.directionPillText,
                    direction === 'i_owe' && { color: Colors.expense, fontWeight: '700' },
                  ]}
                >
                  I OWE THEM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Person Name Input & Suggestions ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PERSON NAME</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={Colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.textInputWithIcon}
                placeholder="e.g. Rahul Sharma, Rohit, Mom..."
                placeholderTextColor={Colors.onSurfaceVariant}
                value={personName}
                onChangeText={setPersonName}
                autoFocus={!isEdit}
              />
            </View>

            {/* Quick Person Autocomplete Pills */}
            {existingPeople.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.peopleChipsRow}
              >
                {existingPeople.map((person) => {
                  const isSelected = personName.toLowerCase() === person.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={person}
                      style={[styles.personChip, isSelected && styles.personChipActive]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPersonName(person);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.personChipText,
                          isSelected && styles.personChipTextActive,
                        ]}
                      >
                        {person}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* ─── Amount Input ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AMOUNT</Text>
            <View style={styles.amountInputRow}>
              <Text style={[styles.currencyPrefix, { color: activeColor }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: activeColor }]}
                placeholder="0"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="numeric"
                value={amountStr}
                onChangeText={setAmountStr}
              />
            </View>
          </View>

          {/* ─── UPI ID / VPA (Phase 17 Quick Pay) ─── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>
                {direction === 'i_owe' ? 'RECIPIENT UPI ID / VPA (FOR QUICK PAY)' : 'CONTACT UPI ID / VPA (OPTIONAL)'}
              </Text>
              {isUpiValid ? (
                <View style={styles.validUpiBadge}>
                  <Check size={11} color={Colors.income} />
                  <Text style={styles.validUpiText}>VALID VPA</Text>
                </View>
              ) : upiId.length > 0 ? (
                <View style={styles.upiHintBadge}>
                  <Text style={styles.upiHintText}>e.g. name@bank</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputWrapper}>
              <AtSign
                size={18}
                color={isUpiValid ? Colors.income : Colors.onSurfaceVariant}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInputWithIcon}
                placeholder="e.g. rahul@okaxis, 9876543210@paytm"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Quick Handle Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetChipsRow}
            >
              {COMMON_UPI_HANDLES.map((handle) => (
                <TouchableOpacity
                  key={handle}
                  style={[styles.presetChip, upiId.includes(handle) && styles.presetChipActive]}
                  onPress={() => handleAppendUpiSuffix(handle)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      upiId.includes(handle) && styles.presetChipTextActive,
                    ]}
                  >
                    {handle}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldHelper}>
              Enables 1-tap deep linking to Google Pay, PhonePe, Paytm, or CRED to pay this debt.
            </Text>
          </View>

          {/* ─── Reason & Quick Presets ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>REASON / DESCRIPTION</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Dinner split, Cab share, Loan..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={reason}
              onChangeText={setReason}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetChipsRow}
            >
              {REASON_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetChip, reason === p && styles.presetChipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setReason(p);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      reason === p && styles.presetChipTextActive,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ─── Reminder Cadence (Phase 16 & Phase 3 UX) ─── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>REMINDER CADENCE</Text>
              <Bell size={13} color={Colors.primaryFixed} />
            </View>
            <View style={styles.cadenceRow}>
              {(
                [
                  { key: 'none', label: 'Off' },
                  { key: 'daily', label: 'Daily' },
                  { key: 'weekly', label: 'Weekly' },
                  { key: 'custom_date', label: 'Specific Date' },
                ] as const
              ).map((opt) => {
                const isSelected = reminderCadence === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.cadenceChip, isSelected && styles.cadenceChipActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setReminderCadence(opt.key);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.cadenceChipText,
                        isSelected && styles.cadenceChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Picker (Shown whenever reminders are active) */}
            {reminderCadence !== 'none' && (
              <View style={styles.subConfigSection}>
                <View style={styles.subConfigHeader}>
                  <Clock size={12} color={Colors.primaryFixed} />
                  <Text style={styles.subConfigTitle}>REMINDER TIME</Text>
                </View>
                <View style={styles.timeChipsRow}>
                  {[
                    { time: '08:00', label: '8:00 AM' },
                    { time: '09:00', label: '9:00 AM' },
                    { time: '12:00', label: '12:00 PM' },
                    { time: '18:00', label: '6:00 PM' },
                    { time: '20:00', label: '8:00 PM' },
                  ].map((item) => {
                    const isSelected = reminderTime === item.time;
                    return (
                      <TouchableOpacity
                        key={item.time}
                        style={[styles.timeChip, isSelected && styles.timeChipActive]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setReminderTime(item.time);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Weekday Picker for Weekly Cadence (Phase 3.2) */}
            {reminderCadence === 'weekly' && (
              <View style={styles.subConfigSection}>
                <View style={styles.subConfigHeader}>
                  <Calendar size={12} color={Colors.primaryFixed} />
                  <Text style={styles.subConfigTitle}>RECURRING WEEKDAY</Text>
                </View>
                <View style={styles.weekdaysRow}>
                  {WEEKDAYS.map((w) => {
                    const isSelected = selectedWeekday === w.day;
                    return (
                      <TouchableOpacity
                        key={w.day}
                        style={[styles.weekdayChip, isSelected && styles.weekdayChipActive]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedWeekday(w.day);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.weekdayChipText,
                            isSelected && styles.weekdayChipTextActive,
                          ]}
                        >
                          {w.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Validated Custom Date Controls (Phase 3.3) */}
            {reminderCadence === 'custom_date' && (
              <View style={styles.subConfigSection}>
                <View style={styles.subConfigHeader}>
                  <Calendar size={12} color={Colors.primaryFixed} />
                  <Text style={styles.subConfigTitle}>SPECIFIC FOLLOW-UP DATE</Text>
                </View>

                {/* Quick Date Presets */}
                <View style={styles.datePresetsRow}>
                  <TouchableOpacity
                    style={styles.datePresetChip}
                    onPress={() => handleSelectDatePreset(1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePresetChipText}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.datePresetChip}
                    onPress={() => handleSelectDatePreset(3)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePresetChipText}>In 3 Days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.datePresetChip}
                    onPress={() => handleSelectDatePreset(7)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePresetChipText}>In 1 Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.datePresetChip}
                    onPress={handleSelectEndOfMonth}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePresetChipText}>End of Month</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputWrapper}>
                  <Calendar size={18} color={Colors.onSurfaceVariant} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="YYYY-MM-DD (e.g. 2026-10-15)"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    value={reminderDateStr}
                    onChangeText={setReminderDateStr}
                  />
                </View>
              </View>
            )}

            {/* Live Next-Fire Preview Banner (Phase 3.4) */}
            {reminderCadence !== 'none' && (
              <View
                style={[
                  styles.nextFireBanner,
                  nextFireInfo.isPast && styles.nextFireBannerPast,
                ]}
              >
                {nextFireInfo.isPast ? (
                  <AlertTriangle size={15} color={Colors.warning} />
                ) : (
                  <CheckCircle2 size={15} color={Colors.chartreuse} />
                )}
                <Text
                  style={[
                    styles.nextFireText,
                    nextFireInfo.isPast && styles.nextFireTextPast,
                  ]}
                >
                  {nextFireInfo.text}
                </Text>
              </View>
            )}

            <Text style={styles.fieldHelper}>
              {reminderCadence === 'none'
                ? 'No automatic reminders will be sent.'
                : reminderCadence === 'daily'
                ? 'Sends a reminder notification every day until settled.'
                : reminderCadence === 'weekly'
                ? 'Sends a check-in alert every week on your selected weekday.'
                : 'Fires a high-priority system alert on your chosen date and time.'}
            </Text>
          </View>

          {/* ─── Optional Notes ─── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADDITIONAL NOTE (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Any details, payment link, or reminder date..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* ─── Delete Button (Edit Mode Only) ─── */}
          {isEdit && debtToEdit && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={Colors.expense} />
              <Text style={styles.deleteBtnText}>Delete Debt Record</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.chartreuse,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  saveBtnText: {
    ...Typography.labelCaps,
    color: '#000',
    fontWeight: '700',
    fontSize: 11,
  },
  saveBtnTextDisabled: {
    color: Colors.onSurfaceVariant,
  },
  scrollBody: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },

  // Sections
  section: {
    gap: 8,
  },
  sectionLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    letterSpacing: 1.0,
  },

  // Direction Selector
  directionSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  directionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  theyOwePillActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderColor: Colors.income,
  },
  iOwePillActive: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderColor: Colors.expense,
  },
  directionPillText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: 12,
    color: Colors.onSurface,
    fontSize: 15,
  },
  textInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    color: Colors.onSurface,
    fontSize: 15,
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
  },

  // Amount Input
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  currencyPrefix: {
    fontFamily: FontFamily.numericBold,
    fontSize: 26,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontFamily: FontFamily.numericBold,
    fontSize: 26,
    paddingVertical: 4,
  },

  // Chips
  peopleChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  personChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  personChipActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.15)',
    borderColor: Colors.chartreuse,
  },
  personChipText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  personChipTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },

  presetChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  presetChipActive: {
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    borderColor: Colors.chartreuse,
  },
  presetChipText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  presetChipTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },

  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.4)',
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    marginTop: Spacing.sm,
  },
  deleteBtnText: {
    ...Typography.labelCaps,
    color: Colors.expense,
    fontSize: 11,
    fontWeight: '700',
  },

  // Cadence (Phase 16)
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cadenceRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cadenceChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  cadenceChipActive: {
    backgroundColor: Colors.chartreuseWash,
    borderColor: Colors.primaryFixed,
  },
  cadenceChipText: {
    ...Typography.bodySmMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  cadenceChipTextActive: {
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  fieldHelper: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
    lineHeight: 16,
  },
  subConfigSection: {
    marginTop: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 8,
  },
  subConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subConfigTitle: {
    ...Typography.labelCaps,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  timeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  timeChipActive: {
    backgroundColor: Colors.chartreuseWash,
    borderColor: Colors.primaryFixed,
  },
  timeChipText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  timeChipTextActive: {
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    gap: 5,
  },
  weekdayChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Shapes.sm,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  weekdayChipActive: {
    backgroundColor: Colors.chartreuseWash,
    borderColor: Colors.primaryFixed,
  },
  weekdayChipText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  weekdayChipTextActive: {
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  datePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  datePresetChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  datePresetChipText: {
    fontFamily: FontFamily.body,
    fontSize: 10.5,
    color: Colors.onSurface,
  },
  nextFireBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 255, 50, 0.08)',
    borderRadius: Shapes.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 50, 0.25)',
    marginTop: 6,
  },
  nextFireBannerPast: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  nextFireText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: 11,
    color: Colors.chartreuse,
    flex: 1,
  },
  nextFireTextPast: {
    color: Colors.warning,
  },
  validUpiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  validUpiText: {
    ...Typography.labelCaps,
    color: Colors.income,
    fontSize: 8.5,
    fontWeight: '800',
  },
  upiHintBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  upiHintText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 8.5,
  },
});
