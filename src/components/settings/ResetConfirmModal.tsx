/**
 * MyWallet — Database Reset & Double-Confirmation Modal
 * 
 * Safeguards against accidental data wipe with explicit "RESET" typing confirmation
 * and toggle between restoring seed baseline vs clean zero-state.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, AlertTriangle, Trash2, CheckCircle2, RotateCcw } from 'lucide-react-native';
import { BackupRepository } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, FontFamily, Spacing, Shapes, Elevation } from '@/theme';

interface ResetConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onResetComplete?: () => void;
}

export function ResetConfirmModal({
  visible,
  onClose,
  onResetComplete,
}: ResetConfirmModalProps) {
  const { refreshFinancials } = useFinancialStore();
  const [resetMode, setResetMode] = useState<'seed' | 'clean'>('seed');
  const [confirmInput, setConfirmInput] = useState('');

  const isConfirmed = confirmInput.trim().toUpperCase() === 'RESET';

  const handleExecuteReset = () => {
    if (!isConfirmed) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    BackupRepository.resetAllData(resetMode === 'seed');
    refreshFinancials();

    Alert.alert(
      'Database Reset Complete',
      resetMode === 'seed'
        ? 'Ledger reset and restored with default sample accounts and categories.'
        : 'Database completely cleared: all accounts, cards, debts, and transactions have been removed.'
    );

    setConfirmInput('');
    onResetComplete?.();
    onClose();
  };

  const handleClose = () => {
    setConfirmInput('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.alertIconBox}>
                <AlertTriangle size={20} color={Colors.error} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Reset Database</Text>
                <Text style={styles.headerSubtitle}>Destructive ledger operation</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <X size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Reset Mode Options */}
          <Text style={styles.sectionLabel}>CHOOSE RESET TARGET</Text>

          <TouchableOpacity
            style={[styles.optionCard, resetMode === 'seed' && styles.optionCardActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setResetMode('seed');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.optionRadio}>
              {resetMode === 'seed' && <View style={styles.optionRadioInner} />}
            </View>
            <View style={styles.optionMeta}>
              <Text style={styles.optionTitle}>Wipe & Restore Sample Data</Text>
              <Text style={styles.optionSub}>
                Clears custom transactions and restores default SBI, HDFC, and Cash accounts with starter categories.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, resetMode === 'clean' && styles.optionCardActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setResetMode('clean');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.optionRadio}>
              {resetMode === 'clean' && <View style={styles.optionRadioInner} />}
            </View>
            <View style={styles.optionMeta}>
              <Text style={styles.optionTitle}>Completely Clean Database</Text>
              <Text style={styles.optionSub}>
                Wipes all accounts, credit cards, transactions, sinking funds, and debts for a fresh start.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Double Confirmation Input */}
          <View style={styles.confirmSection}>
            <Text style={styles.confirmPrompt}>
              To confirm this destructive action, type <Text style={styles.boldWord}>RESET</Text> below:
            </Text>
            <TextInput
              style={[styles.confirmInput, isConfirmed && styles.confirmInputValid]}
              value={confirmInput}
              onChangeText={setConfirmInput}
              placeholder="Type RESET"
              placeholderTextColor={Colors.onSurfaceVariant}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/* Wipe Button */}
          <TouchableOpacity
            style={[styles.wipeBtn, !isConfirmed && styles.wipeBtnDisabled]}
            disabled={!isConfirmed}
            onPress={handleExecuteReset}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color={isConfirmed ? Colors.surface : Colors.onSurfaceVariant} />
            <Text
              style={[
                styles.wipeBtnText,
                !isConfirmed && { color: Colors.onSurfaceVariant },
              ]}
            >
              Wipe Data Now
            </Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.lg }} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    ...Elevation.high,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.error}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.bodyLg,
    fontWeight: '700',
    color: Colors.error,
  },
  headerSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 12,
    borderRadius: Shapes.lg,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    marginBottom: 8,
  },
  optionCardActive: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}10`,
  },
  optionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.onSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
  },
  optionMeta: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  optionSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 15,
  },
  confirmSection: {
    marginTop: Spacing.md,
  },
  confirmPrompt: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  boldWord: {
    color: Colors.error,
    fontWeight: '700',
    fontFamily: FontFamily.numericBold,
  },
  confirmInput: {
    height: 46,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    paddingHorizontal: 14,
    color: Colors.onSurface,
    fontFamily: FontFamily.numericBold,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  confirmInputValid: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}15`,
  },
  wipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: Colors.error,
    borderRadius: Shapes.lg,
    marginTop: Spacing.lg,
    ...Elevation.low,
  },
  wipeBtnDisabled: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  wipeBtnText: {
    ...Typography.bodyMdMedium,
    fontWeight: '700',
    color: Colors.surface,
  },
});
