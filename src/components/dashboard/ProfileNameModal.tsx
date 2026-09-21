/**
 * MyWallet — Profile Quick Edit Modal
 * 
 * Allows the user to view and edit their display name, which updates
 * the header avatar initial and the personalized "Hi, <Name>" greeting.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Check, User } from 'lucide-react-native';
import { Colors, Typography, Spacing, Shapes, Elevation } from '@/theme';
import { useFinancialStore } from '@/stores';

interface ProfileNameModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileNameModal({ visible, onClose }: ProfileNameModalProps) {
  const { userName, setUserName } = useFinancialStore();
  const [nameInput, setNameInput] = useState(userName);

  useEffect(() => {
    if (visible) {
      setNameInput(userName);
    }
  }, [visible, userName]);

  const handleSave = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
    }
    onClose();
  };

  const initial = (nameInput.trim()[0] || userName[0] || 'A').toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.dialogCard}>
          {/* Header */}
          <View style={styles.dialogHeader}>
            <Text style={styles.dialogTitle}>Your Profile</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Avatar Preview */}
          <View style={styles.avatarPreviewBox}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <Text style={styles.avatarSub}>Personalized Greeting & Avatar</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>YOUR NAME / NICKNAME</Text>
            <View style={styles.inputWrapper}>
              <User size={16} color={Colors.onSurfaceVariant} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.nameTextInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="e.g. Aditya"
                placeholderTextColor={Colors.onSurfaceVariant}
                maxLength={25}
                autoFocus={true}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Check size={16} color={Colors.surface} style={{ marginRight: 4 }} />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.screenPadding,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    padding: Spacing.lg,
    ...Elevation.high,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dialogTitle: {
    ...Typography.bodyLg,
    color: Colors.onSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  avatarPreviewBox: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryFixed,
    marginBottom: 8,
  },
  avatarInitial: {
    ...Typography.headlineSm,
    color: Colors.primaryFixed,
    fontWeight: '700',
    fontSize: 26,
  },
  avatarSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    paddingHorizontal: 12,
    height: 46,
  },
  nameTextInput: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurfaceVariant,
    fontSize: 13,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Shapes.pill,
  },
  saveBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});
