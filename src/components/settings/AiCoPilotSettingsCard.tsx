/**
 * MyWallet — AI Co-Pilot Settings Card
 *
 * Allows users to configure and test their Google Gemini API Key
 * (and optional fallback key) with live connection latency diagnostics.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  Switch,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import { SettingsRepository } from '@/repositories/settingsRepository';
import { testGeminiApiKey } from '@/services/ai/aiService';
import { useAiChatStore } from '@/stores/aiChatStore';
import { Colors } from '@/theme';

export function AiCoPilotSettingsCard() {
  const [apiKey, setApiKey] = useState<string>(() =>
    SettingsRepository.get('ai_gemini_api_key', '')
  );
  const [fallbackKey, setFallbackKey] = useState<string>(() =>
    SettingsRepository.get('ai_fallback_api_key', '')
  );
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    modelUsed?: string;
    error?: string;
  } | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isCleared, setIsCleared] = useState<boolean>(false);

  const isAiEnabled = useAiChatStore((s) => s.isAiEnabled);
  const setAiEnabled = useAiChatStore((s) => s.setAiEnabled);
  const clearChat = useAiChatStore((s) => s.clearChat);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    SettingsRepository.set('ai_gemini_api_key', apiKey.trim());
    SettingsRepository.set('ai_fallback_api_key', fallbackKey.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTestConnection = async () => {
    const keyToTest = apiKey.trim() || fallbackKey.trim();
    if (!keyToTest) {
      setTestResult({ success: false, error: 'Please enter an API key first.' });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTesting(true);
    setTestResult(null);

    // Save before testing
    SettingsRepository.set('ai_gemini_api_key', apiKey.trim());
    SettingsRepository.set('ai_fallback_api_key', fallbackKey.trim());

    const result = await testGeminiApiKey(keyToTest);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleOpenAiStudio = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Sparkles size={18} color="#C8F322" strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>AI Co-Pilot (Zenith Agent)</Text>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>100% FREE</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Powered by Google Gemini Flash • 1,500 queries/day
          </Text>
        </View>
      </View>

      {/* Floating Co-Pilot Master Kill Switch */}
      <View style={styles.toggleRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.toggleTitle}>Enable Floating Co-Pilot Handle</Text>
          <Text style={styles.toggleDesc}>
            Show interactive floating orb on screens for instant financial intelligence
          </Text>
        </View>
        <Switch
          value={isAiEnabled}
          onValueChange={(val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAiEnabled(val);
          }}
          trackColor={{ false: '#262A1E', true: 'rgba(200, 243, 34, 0.35)' }}
          thumbColor={isAiEnabled ? '#C8F322' : '#8F937A'}
        />
      </View>

      {/* Free Tier Info Banner */}
      <TouchableOpacity
        style={styles.infoBanner}
        onPress={handleOpenAiStudio}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Get your free Gemini API key in 30s</Text>
          <Text style={styles.bannerDesc}>
            Visit aistudio.google.com • No credit card required • Instant setup
          </Text>
        </View>
        <ExternalLink size={16} color="#C8F322" strokeWidth={2.2} />
      </TouchableOpacity>

      {/* Primary Gemini API Key Input */}
      <View style={styles.inputGroup}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>PRIMARY API KEY (GOOGLE GEMINI FLASH)</Text>
          <TouchableOpacity onPress={() => setShowKey(!showKey)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {showKey ? (
              <EyeOff size={15} color="#8F937A" />
            ) : (
              <Eye size={15} color="#8F937A" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <Key size={16} color="#8F937A" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            placeholder="AIzaSy..."
            placeholderTextColor="#686C56"
            value={apiKey}
            onChangeText={(t) => {
              setApiKey(t);
              setTestResult(null);
            }}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Optional Fallback Key */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>FALLBACK API KEY (OPTIONAL - GROQ OR 2ND KEY)</Text>
        <View style={styles.inputWrapper}>
          <Key size={16} color="#8F937A" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            placeholder="Optional secondary key for failover"
            placeholderTextColor="#686C56"
            value={fallbackKey}
            onChangeText={(t) => {
              setFallbackKey(t);
              setTestResult(null);
            }}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.75}
        >
          <Text style={styles.saveBtnText}>
            {isSaved ? 'Saved! ✓' : 'Save Key'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleTestConnection}
          disabled={isTesting}
          activeOpacity={0.75}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color="#C8F322" />
          ) : (
            <>
              <RefreshCw size={14} color="#C8F322" style={{ marginRight: 5 }} />
              <Text style={styles.testBtnText}>Test Connection</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Live Connection Diagnostics Badge */}
      {testResult && (
        <View
          style={[
            styles.resultBadge,
            testResult.success ? styles.resultSuccess : styles.resultError,
          ]}
        >
          {testResult.success ? (
            <>
              <CheckCircle2 size={16} color="#C8F322" style={{ marginRight: 6 }} />
              <Text style={styles.resultSuccessText}>
                Connected! ~{testResult.latencyMs}ms ({testResult.modelUsed || 'Gemini Flash'})
              </Text>
            </>
          ) : (
            <>
              <AlertCircle size={16} color="#FFB4AB" style={{ marginRight: 6 }} />
              <Text style={styles.resultErrorText} numberOfLines={4} selectable={true}>
                {testResult.error || 'Connection failed'}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Clear Conversation History */}
      <TouchableOpacity
        style={styles.clearBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          clearChat();
          setIsCleared(true);
          setTimeout(() => setIsCleared(false), 2000);
        }}
        activeOpacity={0.7}
      >
        <Trash2 size={14} color="#8F937A" style={{ marginRight: 6 }} />
        <Text style={styles.clearBtnText}>
          {isCleared ? 'Conversation Cleared! ✓' : 'Clear Co-Pilot Chat History'}
        </Text>
      </TouchableOpacity>

      {/* Privacy Guarantee Footer */}
      <View style={styles.privacyNote}>
        <ShieldCheck size={13} color="#8F937A" style={{ marginRight: 5 }} />
        <Text style={styles.privacyNoteText}>
          Your key stays on this device. Database is never uploaded.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#191C22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    marginTop: 16,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#101319',
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 11.5,
    color: '#A8AF90',
    marginTop: 1,
  },
  freeBadge: {
    backgroundColor: 'rgba(200, 243, 34, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.3)',
  },
  freeBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    color: '#C8F322',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#101319',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.2)',
    marginBottom: 14,
  },
  bannerTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12.5,
    color: '#C8F322',
  },
  bannerDesc: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 11,
    color: '#8F937A',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    color: '#8F937A',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101319',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textInput: {
    flex: 1,
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#1D2026',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveBtnText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: '#E1E2EB',
  },
  testBtn: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.35)',
  },
  testBtnText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: '#C8F322',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: 'rgba(200, 243, 34, 0.1)',
    borderColor: 'rgba(200, 243, 34, 0.3)',
  },
  resultSuccessText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#C8F322',
    flex: 1,
  },
  resultError: {
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
    borderColor: 'rgba(255, 180, 171, 0.3)',
  },
  resultErrorText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11.5,
    color: '#FFB4AB',
    flex: 1,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  privacyNoteText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 11,
    color: '#787C65',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#101319',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  toggleTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  toggleDesc: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 11,
    color: '#8F937A',
    marginTop: 2,
    lineHeight: 15,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 12,
    marginBottom: 4,
  },
  clearBtnText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#8F937A',
  },
});
