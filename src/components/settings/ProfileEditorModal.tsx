/**
 * MyWallet — Profile Editor Modal
 * 
 * Allows users to personalize their display name, select curated avatar badges,
 * and review lifetime activity metrics.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Check, User, Sparkles, Activity, Shield } from 'lucide-react-native';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, FontFamily, Spacing, Shapes, Elevation } from '@/theme';

interface ProfileEditorModalProps {
  visible: boolean;
  onClose: () => void;
}

const EMOJI_BADGES = [
  '🚀', '👑', '💎', '🛡️', '⚡', '🦁',
  '🦉', '🦊', '☕', '💰', '🎯', '🔥',
  '🏆', '🌟', '⚓', '🛸', '🏎️', '🪐',
];

export function ProfileEditorModal({ visible, onClose }: ProfileEditorModalProps) {
  const {
    userName,
    avatarBadge,
    setUserName,
    setAvatarBadge,
    accounts,
    creditCards,
    recentTransactions,
  } = useFinancialStore();

  const [nameInput, setNameInput] = useState(userName);
  const [selectedBadge, setSelectedBadge] = useState(avatarBadge || '🚀');

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUserName(nameInput.trim() || 'Aditya');
    setAvatarBadge(selectedBadge);
    onClose();
  };

  const handleBadgePress = (badge: string) => {
    Haptics.selectionAsync();
    setSelectedBadge(badge);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <Text style={styles.headerSubtitle}>Personalize name & avatar identifier</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* Visual Avatar Preview */}
            <View style={styles.avatarPreviewSection}>
              <View style={styles.avatarPreviewBox}>
                <Text style={styles.avatarPreviewEmoji}>{selectedBadge}</Text>
              </View>
              <Text style={styles.avatarPreviewName}>
                {nameInput.trim() || 'Aditya'}
              </Text>
              <View style={styles.sovereigntyPill}>
                <Shield size={12} color={Colors.primaryFixed} />
                <Text style={styles.sovereigntyText}>LOCAL PROFILE • ENCRYPTED</Text>
              </View>
            </View>

            {/* Display Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>YOUR DISPLAY NAME</Text>
              <View style={styles.inputContainer}>
                <User size={16} color={Colors.primaryFixed} />
                <TextInput
                  style={styles.textInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  maxLength={24}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Curated Avatar Badges */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>AVATAR BADGE</Text>
                <Sparkles size={12} color={Colors.chartreuse} />
              </View>
              <View style={styles.badgesGrid}>
                {EMOJI_BADGES.map((badge) => {
                  const isSelected = selectedBadge === badge;
                  return (
                    <TouchableOpacity
                      key={badge}
                      style={[
                        styles.badgeOption,
                        isSelected && styles.badgeOptionSelected,
                      ]}
                      onPress={() => handleBadgePress(badge)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.badgeEmoji}>{badge}</Text>
                      {isSelected && (
                        <View style={styles.badgeCheck}>
                          <Check size={10} color={Colors.surface} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Lifetime Stats Summary */}
            <View style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <Activity size={14} color={Colors.primaryFixed} />
                <Text style={styles.statsTitle}>LIFETIME WALLET METRICS</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{accounts.length}</Text>
                  <Text style={styles.statLbl}>Accounts</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{creditCards.length}</Text>
                  <Text style={styles.statLbl}>Cards</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{recentTransactions.length}+</Text>
                  <Text style={styles.statLbl}>Logged Tx</Text>
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            </TouchableOpacity>

            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    maxHeight: '85%',
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
  scrollList: {
    marginTop: Spacing.md,
  },
  avatarPreviewSection: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  avatarPreviewBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: `${Colors.primaryFixed}60`,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.medium,
  },
  avatarPreviewEmoji: {
    fontSize: 34,
  },
  avatarPreviewName: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    marginTop: Spacing.sm,
    fontWeight: '700',
  },
  sovereigntyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.primaryFixed}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    marginTop: 6,
  },
  sovereigntyText: {
    fontFamily: FontFamily.numericMedium,
    fontSize: 10,
    color: Colors.primaryFixed,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginTop: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  textInput: {
    flex: 1,
    height: 48,
    ...Typography.bodyMd,
    color: Colors.onSurface,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeOption: {
    width: 48,
    height: 48,
    borderRadius: Shapes.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    position: 'relative',
  },
  badgeOptionSelected: {
    borderColor: Colors.primaryFixed,
    backgroundColor: `${Colors.primaryFixed}20`,
  },
  badgeEmoji: {
    fontSize: 22,
  },
  badgeCheck: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  statsTitle: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 20,
    color: Colors.onSurface,
  },
  statLbl: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.strokeSubtle,
  },
  saveBtn: {
    backgroundColor: Colors.primaryFixed,
    borderRadius: Shapes.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    ...Elevation.low,
  },
  saveBtnText: {
    ...Typography.bodyMdMedium,
    fontWeight: '700',
    color: Colors.surface,
  },
});
