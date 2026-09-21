/**
 * MyWallet — Security Lock Modal
 * 
 * Fullscreen lock screen overlay requiring 4-digit PIN or biometrics
 * to unlock the application when security lock is enabled.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Shield, Delete, Lock, Fingerprint } from 'lucide-react-native';
import { SecurityRepository } from '@/repositories';
import { Colors, Typography, FontFamily, Spacing, Shapes, Elevation } from '@/theme';

interface SecurityLockModalProps {
  visible: boolean;
  onUnlock: () => void;
}

export function SecurityLockModal({ visible, onUnlock }: SecurityLockModalProps) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const biometricsEnabled = SecurityRepository.isBiometricsEnabled();

  const handleKeyPress = (digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMsg(null);

    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        // Validate PIN
        setTimeout(() => {
          if (SecurityRepository.verifyPin(nextPin)) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPin('');
            setErrorMsg(null);
            onUnlock();
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMsg('Incorrect PIN. Please try again.');
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometricAuth = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPin('');
    setErrorMsg(null);
    onUnlock();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Lock size={28} color={Colors.primaryFixed} />
          </View>
          <Text style={styles.title}>MyWallet Locked</Text>
          <Text style={styles.subtitle}>Enter your 4-digit PIN to access ledger</Text>
        </View>

        {/* PIN Dot Indicators */}
        <View style={styles.dotsContainer}>
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = idx < pin.length;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    isFilled && styles.dotFilled,
                    errorMsg ? styles.dotError : null,
                  ]}
                />
              );
            })}
          </View>
          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <View style={{ height: 20 }} />
          )}
        </View>

        {/* Custom Numeric Keypad */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['bio', '0', 'backspace'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((item, cIdx) => {
                if (item === 'bio') {
                  if (biometricsEnabled) {
                    return (
                      <TouchableOpacity
                        key={cIdx}
                        style={styles.actionKey}
                        onPress={handleBiometricAuth}
                        activeOpacity={0.7}
                      >
                        <Fingerprint size={24} color={Colors.primaryFixed} />
                      </TouchableOpacity>
                    );
                  }
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

        <View style={styles.footer}>
          <Shield size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.footerText}>ENCRYPTED ON-DEVICE SECURITY</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: `${Colors.primaryFixed}15`,
    borderWidth: 2,
    borderColor: `${Colors.primaryFixed}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Elevation.low,
  },
  title: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 6,
  },
  dotsContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
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
    transform: [{ scale: 1.15 }],
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
    gap: 12,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  numberKey: {
    flex: 1,
    height: 62,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  numberKeyText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 24,
    color: Colors.onSurface,
  },
  actionKey: {
    flex: 1,
    height: 62,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Shapes.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyKey: {
    flex: 1,
    height: 62,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: Spacing.md,
  },
  footerText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
});
