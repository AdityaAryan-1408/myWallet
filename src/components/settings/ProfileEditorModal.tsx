/**
 * MyWallet — Profile Editor Modal
 * 
 * Allows users to personalize their display name, pick a custom photo avatar from gallery,
 * select curated emoji badges, and review lifetime activity metrics.
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
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Paths, File } from 'expo-file-system';
import { Image } from 'expo-image';
import {
  X,
  Check,
  User,
  Sparkles,
  Activity,
  Shield,
  Camera,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react-native';
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
    avatarPhotoUri,
    setUserName,
    setAvatarBadge,
    setAvatarPhotoUri,
    accounts,
    creditCards,
  } = useFinancialStore();

  const [nameInput, setNameInput] = useState(userName);
  const [selectedBadge, setSelectedBadge] = useState(avatarBadge || '🚀');
  const [tempPhotoUri, setTempPhotoUri] = useState<string | null>(avatarPhotoUri || null);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUserName(nameInput.trim() || 'Aditya');
    setAvatarBadge(selectedBadge);
    setAvatarPhotoUri(tempPhotoUri);
    onClose();
  };

  const handleBadgePress = (badge: string) => {
    Haptics.selectionAsync();
    setSelectedBadge(badge);
  };

  const handlePickFromGallery = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo gallery to select a profile avatar photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        let persistentUri = pickedUri;

        // Persist to local app storage
        try {
          if (Paths?.document) {
            const ext = pickedUri.split('.').pop() || 'jpg';
            const file = new File(pickedUri);
            const dest = new File(Paths.document, `avatar_${Date.now()}.${ext}`);
            file.copy(dest);
            persistentUri = dest.uri;
          }
        } catch (e) {
          console.warn('Could not copy image to app directory:', e);
        }

        setTempPhotoUri(persistentUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('Failed to pick avatar image:', err);
      Alert.alert('Error', 'Could not open image library.');
    }
  };

  const handleRemovePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTempPhotoUri(null);
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
              <Text style={styles.headerSubtitle}>Personalize name & avatar photo</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* Visual Avatar Preview */}
            <View style={styles.avatarPreviewSection}>
              <TouchableOpacity
                style={styles.avatarPreviewBox}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                {tempPhotoUri ? (
                  <Image
                    source={{ uri: tempPhotoUri }}
                    style={styles.avatarPhoto}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarPreviewEmoji}>{selectedBadge}</Text>
                )}
                <View style={styles.cameraIconBadge}>
                  <Camera size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <Text style={styles.avatarPreviewName}>
                {nameInput.trim() || 'Aditya'}
              </Text>

              {/* Photo Action Buttons */}
              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  style={styles.galleryBtn}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={14} color={Colors.primaryFixed} />
                  <Text style={styles.galleryBtnText}>
                    {tempPhotoUri ? 'Change Photo' : 'Choose Photo from Gallery'}
                  </Text>
                </TouchableOpacity>

                {tempPhotoUri && (
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={handleRemovePhoto}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={14} color={Colors.error} />
                    <Text style={styles.removePhotoText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

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

            {/* Curated Avatar Badges (fallback when photo is not used) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>FALLBACK EMOJI BADGE</Text>
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
                  <Text style={styles.statLbl}>Credit Cards</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Check size={16} color={Colors.surface} strokeWidth={2.5} />
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Shapes.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    ...Elevation.high,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.strokeSubtle,
  },
  headerTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    maxHeight: 480,
  },
  avatarPreviewSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  avatarPreviewBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryFixed,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
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
  photoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  galleryBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 12,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  removePhotoText: {
    ...Typography.bodySmMedium,
    color: Colors.error,
    fontSize: 12,
  },
  sovereigntyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${Colors.primaryFixed}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    marginTop: 8,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeSubtle,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.primaryFixed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.surface,
    fontWeight: '700',
  },
});
