/**
 * MyWallet — Quick Calc Keypad
 * 
 * Custom in-app 4x4 arithmetic matrix for rapid expense entry.
 * Features:
 * - Direct tactile haptic feedback
 * - Monospaced JetBrains Mono keys on elevated #181C24 surfaces
 * - Arithmetic operators (+, −, ×, ÷)
 * - Backspace with long-press clear
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Delete } from 'lucide-react-native';
import { Colors, FontFamily, Shapes } from '@/theme';

interface QuickCalcKeypadProps {
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

export function QuickCalcKeypad({
  onKeyPress,
  onBackspace,
  onClear,
}: QuickCalcKeypadProps) {
  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Safe fallback if device doesn't support haptics
      }
    }
  };

  const handlePress = (char: string) => {
    triggerHaptic();
    onKeyPress(char);
  };

  const handleBackspacePress = () => {
    triggerHaptic();
    onBackspace();
  };

  const handleClear = () => {
    triggerHaptic();
    onClear();
  };

  return (
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.row}>
        <KeyButton label="7" onPress={() => handlePress('7')} />
        <KeyButton label="8" onPress={() => handlePress('8')} />
        <KeyButton label="9" onPress={() => handlePress('9')} />
        <KeyButton
          label="÷"
          isOperator
          onPress={() => handlePress(' ÷ ')}
        />
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        <KeyButton label="4" onPress={() => handlePress('4')} />
        <KeyButton label="5" onPress={() => handlePress('5')} />
        <KeyButton label="6" onPress={() => handlePress('6')} />
        <KeyButton
          label="×"
          isOperator
          onPress={() => handlePress(' × ')}
        />
      </View>

      {/* Row 3 */}
      <View style={styles.row}>
        <KeyButton label="1" onPress={() => handlePress('1')} />
        <KeyButton label="2" onPress={() => handlePress('2')} />
        <KeyButton label="3" onPress={() => handlePress('3')} />
        <KeyButton
          label="−"
          isOperator
          onPress={() => handlePress(' − ')}
        />
      </View>

      {/* Row 4 */}
      <View style={styles.row}>
        <KeyButton label="." onPress={() => handlePress('.')} />
        <KeyButton label="0" onPress={() => handlePress('0')} />
        <TouchableOpacity
          style={[styles.key, styles.specialKey]}
          onPress={handleBackspacePress}
          onLongPress={handleClear}
          activeOpacity={0.7}
        >
          <Delete size={20} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
        <KeyButton
          label="+"
          isOperator
          onPress={() => handlePress(' + ')}
        />
      </View>
    </View>
  );
}

interface KeyButtonProps {
  label: string;
  isOperator?: boolean;
  onPress: () => void;
}

function KeyButton({ label, isOperator, onPress }: KeyButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.key,
        isOperator && styles.operatorKey,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.keyText,
          isOperator && styles.operatorText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  key: {
    flex: 1,
    height: 52,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  operatorKey: {
    backgroundColor: 'rgba(212, 255, 50, 0.08)',
    borderColor: 'rgba(212, 255, 50, 0.20)',
  },
  specialKey: {
    backgroundColor: Colors.surfaceContainer,
  },
  keyText: {
    fontFamily: FontFamily.numericSemiBold,
    fontSize: 22,
    color: Colors.onSurface,
  },
  operatorText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.primaryFixed,
  },
});
