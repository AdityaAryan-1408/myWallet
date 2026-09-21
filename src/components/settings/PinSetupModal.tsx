/**
 * MyWallet — PIN Setup & Management Modal
 * 
 * 4-digit numeric passcode setup with two-step confirmation flow,
 * custom obsidian keypad, and PIN removal option.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Delete, Shield, CheckCircle, Trash2 } from 'lucide-react-native';
import { SecurityRepository } from '@/repositories';
import { Colors, Typography, FontFamily, Spacing, Shapes, Elevation } from '@/theme';

interface PinSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PinSetupModal({ visible, onClose, onSuccess }: PinSetupModalProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasExistingPin = SecurityRepository.hasPin();

  const handleKeyPress = (num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMessage(null);

    if (step === 'create') {
      if (pin.length < 4) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === 4) {
          // Move to confirm step
          setTimeout(() => {
            setStep('confirm');
          }, 200);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const nextConfirm = confirmPin + num;
        setConfirmPin(nextConfirm);
        if (nextConfirm.length === 4) {
          // Evaluate match
          if (nextConfirm === pin) {
            SecurityRepository.setPin(pin);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('PIN Configured', 'Your 4-digit security PIN has been safely saved.');
            onSuccess?.();
            handleClose();
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMessage('PINs do not match. Please try again.');
            setConfirmPin('');
            setPin('');
            setStep('create');
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMessage(null);
    if (step === 'create') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (confirmPin.length === 0) {
        setStep('create');
        setPin((prev) => prev.slice(0, -1));
      } else {
        setConfirmPin((prev) => prev.slice(0, -1));
      }
    }
  };

  const handleClose = () => {
    setPin('');
    setConfirmPin('');
    setStep('create');
    setErrorMessage(null);
    onClose();
  };

  const handleRemovePin = () => {
    Alert.alert(
      'Remove PIN Lock?',
      'Disabling PIN lock will turn off app security protection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove PIN',
          style: 'destructive',
          onPress: () => {
            SecurityRepository.removePin();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSuccess?.();
            handleClose();
          },
        },
      ]
    );
  };

  const currentLength = step === 'create' ? pin.length : confirmPin.length;

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
            <View>
              <Text style={styles.headerTitle}>
                {step === 'create' ? 'Set Up 4-Digit PIN' : 'Confirm Your PIN'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {step === 'create'
                  ? 'Enter a memorable 4-digit code'
                  : 'Re-enter the same 4 digits to verify'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <X size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Stepper Dots */}
          <View style={styles.dotsSection}>
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < currentLength;
                return (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      isFilled && styles.dotFilled,
                      errorMessage ? styles.dotError : null,
                    ]}
                  />
                );
              })}
            </View>

            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
          </View>

          {/* Keypad */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['empty', '0', 'backspace'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((item, cIdx) => {
                  if (item === 'empty') {
                    return <View key={cIdx} style={styles.emptyKey} />;
                  }
                  if (item === 'backspace') {
                    return (
                      <TouchableOpacity
                        key={cIdx}
                        style={styles.actionKey}
                        onPress={handleBackspace}
                        activeOpacity={0.7}
                      >
                        <Delete size={22} color={Colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={cIdx}
                      style={styles.numberKey}
                      onPress={() => handleKeyPress(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.numberKeyText}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Remove Existing PIN Option */}
          {hasExistingPin && (
            <TouchableOpacity
              style={styles.removePinBtn}
              onPress={handleRemovePin}
              activeOpacity={0.7}
            >
              <Trash2 size={15} color={Colors.error} />
              <Text style={styles.removePinText}>Remove Existing PIN Lock</Text>
            </TouchableOpacity>
          )}

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
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.strokeSubtle,
  },
  headerTitle: {
    ...Typography.bodyLg,
    fontWeight: '700',
    color: Colors.onSurface,
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
  dotsSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.strokeMedium,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primaryFixed,
    borderColor: Colors.primaryFixed,
    transform: [{ scale: 1.1 }],
  },
  dotError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  errorText: {
    ...Typography.bodySm,
    color: Colors.error,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  keypad: {
    gap: 10,
    marginTop: Spacing.xs,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  numberKey: {
    flex: 1,
    height: 54,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  numberKeyText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 22,
    color: Colors.onSurface,
  },
  actionKey: {
    flex: 1,
    height: 54,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Shapes.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyKey: {
    flex: 1,
    height: 54,
  },
  removePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: Spacing.md,
  },
  removePinText: {
    ...Typography.bodySmMedium,
    color: Colors.error,
  },
});
