/**
 * MyWallet — Backup & Cloud Management Modal
 * 
 * Provides full local SQLite JSON export to physical .json files,
 * Android Google Drive / Filesystem sharing, and direct .json file import.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  X,
  Share2,
  Cloud,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Shield,
  FileJson,
  FolderOpen,
  Download,
} from 'lucide-react-native';
import { BackupRepository, CloudSyncStatus } from '@/repositories';
import { useFinancialStore } from '@/stores';
import { Colors, Typography, FontFamily, Spacing, Shapes, Elevation } from '@/theme';

interface BackupExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BackupExportModal({ visible, onClose }: BackupExportModalProps) {
  const { refreshFinancials } = useFinancialStore();
  const [activeTab, setActiveTab] = useState<'export' | 'restore'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastExportedPath, setLastExportedPath] = useState<string | null>(null);
  const [restoreJson, setRestoreJson] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() =>
    BackupRepository.getGoogleDriveStatus()
  );

  // Storage and table metrics
  const storageStats = useMemo(() => BackupRepository.getStorageStats(), [visible]);

  // Export JSON string to physical file and share
  const handleExportFile = async (isDriveAction: boolean = false) => {
    setIsExporting(true);
    try {
      Haptics.selectionAsync();
      const payload = BackupRepository.exportAllData();
      const jsonStr = JSON.stringify(payload, null, 2);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `MyWallet_Backup_${timestamp.slice(0, 19)}.json`;
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
      const fileUri = `${baseDir}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonStr, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setLastExportedPath(fileName);

      const isShareAvailable = await Sharing.isAvailableAsync();
      if (isShareAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: isDriveAction
            ? 'Save / Upload Backup to Google Drive'
            : 'Save MyWallet Backup File',
          UTI: 'public.json',
        });

        if (isDriveAction) {
          BackupRepository.setGoogleDriveStatus('aditya.aryan@gmail.com', true);
          setCloudStatus(BackupRepository.getGoogleDriveStatus());
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(
          'Backup File Created',
          `Saved locally to device storage:\n${fileName}`
        );
      }
    } catch (e: any) {
      console.warn('Export error:', e);
      Alert.alert('Export Failed', e?.message || 'Could not export backup file.');
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON from .json file
  const handlePickFileToRestore = async () => {
    try {
      Haptics.selectionAsync();
      setIsImporting(true);
      setRestoreError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];
      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Validate parsed JSON
      let parsed: any;
      try {
        parsed = JSON.parse(fileContent);
      } catch {
        setRestoreError('The selected file is not a valid JSON document.');
        setIsImporting(false);
        return;
      }

      if (!parsed || parsed.app !== 'MyWallet' || !parsed.tables) {
        setRestoreError('Invalid backup file: Must be a genuine MyWallet backup with tables.');
        setIsImporting(false);
        return;
      }

      const txCount = parsed.tables?.transactions?.length ?? 0;
      const accCount = parsed.tables?.accounts?.length ?? 0;
      const cardCount = parsed.tables?.creditCards?.length ?? 0;
      const debtCount = parsed.tables?.peopleDebts?.length ?? 0;

      Alert.alert(
        'Confirm Restore',
        `File: ${file.name}\n\nContents:\n• ${txCount} Transactions\n• ${accCount} Accounts\n• ${cardCount} Credit Cards\n• ${debtCount} Debts\n\nRestoring will replace current ledger records with this file. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore Now',
            style: 'destructive',
            onPress: () => {
              const res = BackupRepository.importAllData(fileContent);
              if (res.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                refreshFinancials();
                Alert.alert('Restore Complete', res.message);
                onClose();
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setRestoreError(res.message);
              }
            },
          },
        ]
      );
    } catch (e: any) {
      console.warn('Pick file error:', e);
      setRestoreError(e?.message || 'Failed to read selected file.');
    } finally {
      setIsImporting(false);
    }
  };

  // Restore Database from pasted text
  const handleRestoreFromText = () => {
    if (!restoreJson.trim()) {
      setRestoreError('Please paste your backup JSON code or pick a file above.');
      return;
    }

    Alert.alert(
      'Overwrite Database?',
      'Restoring from this backup will replace current records with the backup data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now',
          style: 'destructive',
          onPress: () => {
            const res = BackupRepository.importAllData(restoreJson.trim());
            if (res.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              refreshFinancials();
              Alert.alert('Restore Complete', res.message);
              setRestoreJson('');
              setRestoreError(null);
              onClose();
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              setRestoreError(res.message);
            }
          },
        },
      ]
    );
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
              <Text style={styles.headerTitle}>Data & Backup</Text>
              <Text style={styles.headerSubtitle}>Full SQLite file export & device migration</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={18} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab */}
          <View style={styles.segmentedRow}>
            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'export' && styles.segmentBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('export');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  activeTab === 'export' && styles.segmentBtnTextActive,
                ]}
              >
                EXPORT .JSON FILE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'restore' && styles.segmentBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('restore');
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  activeTab === 'restore' && styles.segmentBtnTextActive,
                ]}
              >
                RESTORE BACKUP
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {activeTab === 'export' ? (
              <>
                {/* Metrics Summary */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <FileJson size={16} color={Colors.primaryFixed} />
                    <Text style={styles.summaryTitle}>LOCAL DATABASE ARCHIVE</Text>
                  </View>
                  <View style={styles.grid}>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridVal}>{storageStats.totalTransactions}</Text>
                      <Text style={styles.gridLbl}>Transactions</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridVal}>{storageStats.totalAccounts}</Text>
                      <Text style={styles.gridLbl}>Accounts</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridVal}>{storageStats.totalCards}</Text>
                      <Text style={styles.gridLbl}>Cards</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridVal}>{storageStats.totalCategories}</Text>
                      <Text style={styles.gridLbl}>Categories</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridVal}>{storageStats.totalDebts}</Text>
                      <Text style={styles.gridLbl}>Debts</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridVal}>~{storageStats.estimatedSizeKb} KB</Text>
                      <Text style={styles.gridLbl}>Est. Size</Text>
                    </View>
                  </View>
                </View>

                {/* Primary Export Button */}
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => handleExportFile(false)}
                  disabled={isExporting}
                  activeOpacity={0.7}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color={Colors.surface} />
                  ) : (
                    <>
                      <Download size={18} color={Colors.surface} />
                      <Text style={styles.actionBtnPrimaryText}>
                        Export & Save .JSON File
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {lastExportedPath && (
                  <View style={styles.successBanner}>
                    <CheckCircle size={15} color={Colors.chartreuse} />
                    <Text style={styles.successBannerText} numberOfLines={1}>
                      Created: {lastExportedPath}
                    </Text>
                  </View>
                )}

                {/* Google Drive Card */}
                <View style={styles.cloudCard}>
                  <View style={styles.cloudHeader}>
                    <View style={styles.cloudIconBox}>
                      <Cloud size={20} color={Colors.transfer} />
                    </View>
                    <View style={styles.cloudMeta}>
                      <Text style={styles.cloudTitle}>Google Drive Cloud Backup</Text>
                      <Text style={styles.cloudSub}>
                        {cloudStatus.lastSyncDate
                          ? `Last saved: ${new Date(cloudStatus.lastSyncDate).toLocaleDateString()}`
                          : 'Creates .JSON file & opens Drive to save'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.syncBtn}
                    onPress={() => handleExportFile(true)}
                    disabled={isExporting}
                    activeOpacity={0.8}
                  >
                    <Cloud size={16} color={Colors.primaryFixed} />
                    <Text style={styles.syncBtnText}>
                      Save / Upload to Google Drive
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sovereignty Note */}
                <View style={styles.noteBox}>
                  <Shield size={14} color={Colors.primaryFixed} />
                  <Text style={styles.noteText}>
                    100% on-device data sovereignty. Your entire ledger is exported as a complete, untruncated JSON file without any character limits.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Pick JSON File Button */}
                <View style={styles.filePickerBox}>
                  <Text style={styles.restorePrompt}>
                    Select a previously exported <Text style={{ fontWeight: '700', color: Colors.primaryFixed }}>.json</Text> backup file from Google Drive, Downloads, or device storage:
                  </Text>

                  <TouchableOpacity
                    style={styles.pickFileBtn}
                    onPress={handlePickFileToRestore}
                    disabled={isImporting}
                    activeOpacity={0.8}
                  >
                    {isImporting ? (
                      <ActivityIndicator size="small" color={Colors.surface} />
                    ) : (
                      <>
                        <FolderOpen size={18} color={Colors.surface} />
                        <Text style={styles.pickFileBtnText}>Pick .JSON Backup File</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR PASTE JSON CODE</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TextInput
                  style={styles.jsonInput}
                  multiline
                  numberOfLines={6}
                  value={restoreJson}
                  onChangeText={(txt) => {
                    setRestoreJson(txt);
                    setRestoreError(null);
                  }}
                  placeholder="Paste JSON here (starts with { 'app': 'MyWallet' ... })..."
                  placeholderTextColor={Colors.onSurfaceVariant}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {restoreError && (
                  <View style={styles.errorBanner}>
                    <AlertTriangle size={16} color={Colors.error} />
                    <Text style={styles.errorBannerText}>{restoreError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.restoreBtn}
                  onPress={handleRestoreFromText}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={16} color={Colors.surface} />
                  <Text style={styles.restoreBtnText}>Restore From Pasted JSON</Text>
                </TouchableOpacity>

                <View style={styles.warningBox}>
                  <AlertTriangle size={14} color={Colors.secondaryFixed} />
                  <Text style={styles.warningText}>
                    Warning: Restoring will overwrite existing ledger records with the contents of the chosen backup file.
                  </Text>
                </View>
              </>
            )}

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
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    maxHeight: '90%',
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
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: 4,
    marginTop: Spacing.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Shapes.md,
  },
  segmentBtnActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  segmentBtnText: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  segmentBtnTextActive: {
    color: Colors.primaryFixed,
  },
  scrollList: {
    marginTop: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  gridItem: {
    width: '33.3%',
    alignItems: 'center',
  },
  gridVal: {
    fontFamily: FontFamily.numericBold,
    fontSize: 16,
    color: Colors.onSurface,
  },
  gridLbl: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: Colors.primaryFixed,
    borderRadius: Shapes.lg,
    marginTop: Spacing.md,
    ...Elevation.low,
  },
  actionBtnPrimaryText: {
    ...Typography.bodySmMedium,
    fontWeight: '700',
    color: Colors.surface,
    fontSize: 14,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.chartreuse}15`,
    borderRadius: Shapes.md,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: `${Colors.chartreuse}30`,
  },
  successBannerText: {
    ...Typography.bodySm,
    color: Colors.chartreuse,
    fontSize: 12,
    flex: 1,
  },
  cloudCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  cloudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  cloudIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${Colors.transfer}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudMeta: {
    flex: 1,
  },
  cloudTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  cloudSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Shapes.lg,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  syncBtnText: {
    ...Typography.bodySmMedium,
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.primaryFixed}10`,
    borderRadius: Shapes.lg,
    padding: 12,
    marginTop: Spacing.md,
  },
  noteText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.primaryFixed,
    flex: 1,
    lineHeight: 16,
  },
  filePickerBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  restorePrompt: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  pickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryFixed,
    borderRadius: Shapes.lg,
    height: 48,
  },
  pickFileBtnText: {
    ...Typography.bodyMdMedium,
    fontWeight: '700',
    color: Colors.surface,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.strokeSubtle,
  },
  dividerText: {
    ...Typography.labelCaps,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  jsonInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.lg,
    padding: 12,
    minHeight: 100,
    maxHeight: 160,
    color: Colors.onSurface,
    fontFamily: FontFamily.numericMedium,
    fontSize: 12,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    textAlignVertical: 'top',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.error}15`,
    padding: 10,
    borderRadius: Shapes.md,
    marginTop: 8,
  },
  errorBannerText: {
    ...Typography.bodySm,
    color: Colors.error,
    fontSize: 11,
    flex: 1,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    height: 44,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  restoreBtnText: {
    ...Typography.bodySmMedium,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.secondaryFixed}10`,
    borderRadius: Shapes.lg,
    padding: 12,
    marginTop: Spacing.md,
  },
  warningText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.secondaryFixed,
    flex: 1,
    lineHeight: 16,
  },
});
