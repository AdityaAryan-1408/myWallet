/**
 * MyWallet — AI Co-Pilot Settings Card
 *
 * Allows users to configure and test their Google Gemini API Key
 * and optional Groq/Secondary fallback key with live connection latency diagnostics
 * and active model selection.
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
  Zap,
} from 'lucide-react-native';
import { SettingsRepository } from '@/repositories/settingsRepository';
import { testGeminiApiKey, testGroqApiKey } from '@/services/ai/aiService';
import { useAiChatStore } from '@/stores/aiChatStore';

export function AiCoPilotSettingsCard() {
  const [apiKey, setApiKey] = useState<string>(() =>
    SettingsRepository.get('ai_gemini_api_key', '')
  );
  const [fallbackKey, setFallbackKey] = useState<string>(() =>
    SettingsRepository.get('ai_fallback_api_key', '')
  );
  const [activeModel, setActiveModel] = useState<string>(() => {
    const saved = SettingsRepository.get('ai_active_model_name', 'gemini-3.5-flash');
    return saved.includes('1.5') ? 'gemini-3.5-flash' : saved;
  });
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTestingPrimary, setIsTestingPrimary] = useState<boolean>(false);
  const [isTestingFallback, setIsTestingFallback] = useState<boolean>(false);
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
    SettingsRepository.set('ai_active_model_name', activeModel);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSelectModel = (model: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveModel(model);
    SettingsRepository.set('ai_active_model_name', model);
  };

  const handleTestKey = async (target: 'primary' | 'fallback') => {
    const keyToTest = target === 'primary' ? apiKey.trim() : fallbackKey.trim();
    if (!keyToTest) {
      setTestResult({
        success: false,
        error: `Please enter a ${target === 'primary' ? 'primary' : 'fallback'} API key first.`,
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (target === 'primary') {
      setIsTestingPrimary(true);
    } else {
      setIsTestingFallback(true);
    }
    setTestResult(null);

    // Persist active settings before testing
    SettingsRepository.set('ai_gemini_api_key', apiKey.trim());
    SettingsRepository.set('ai_fallback_api_key', fallbackKey.trim());
    SettingsRepository.set('ai_active_model_name', activeModel);

    let result;
    if (keyToTest.startsWith('gsk_')) {
      result = await testGroqApiKey(keyToTest);
    } else {
      result = await testGeminiApiKey(keyToTest);
    }

    if (target === 'primary') {
      setIsTestingPrimary(false);
    } else {
      setIsTestingFallback(false);
    }
    setTestResult(result);

    if (result.success) {
      if (result.modelUsed && !result.modelUsed.includes('Groq')) {
        setActiveModel(result.modelUsed);
      }
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
          <TouchableOpacity
            onPress={() => setShowKey(!showKey)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showKey ? <EyeOff size={15} color="#8F937A" /> : <Eye size={15} color="#8F937A" />}
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

      {/* Active Model Selector */}
      <View style={styles.modelGroup}>
        <Text style={styles.inputLabel}>PREFERRED GEMINI MODEL</Text>
        <View style={styles.modelPillsRow}>
          <TouchableOpacity
            style={[
              styles.modelPill,
              activeModel === 'gemini-3.5-flash' && styles.modelPillActive,
            ]}
            onPress={() => handleSelectModel('gemini-3.5-flash')}
            activeOpacity={0.7}
          >
            <Zap
              size={12}
              color={activeModel === 'gemini-3.5-flash' ? '#101319' : '#C8F322'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.modelPillText,
                activeModel === 'gemini-3.5-flash' && styles.modelPillTextActive,
              ]}
            >
              Gemini 3.5 Flash (Fast & Smart)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modelPill,
              activeModel === 'gemini-2.5-flash' && styles.modelPillActive,
            ]}
            onPress={() => handleSelectModel('gemini-2.5-flash')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.modelPillText,
                activeModel === 'gemini-2.5-flash' && styles.modelPillTextActive,
              ]}
            >
              Gemini 2.5 Flash (Stable)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Optional Fallback Key */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>FALLBACK API KEY (OPTIONAL - GROQ OR 2ND KEY)</Text>
        <View style={styles.inputWrapper}>
          <Key size={16} color="#8F937A" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            placeholder="gsk_... or AIzaSy..."
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
        {fallbackKey.trim().length > 0 && (
          <Text style={styles.fallbackHint}>
            {fallbackKey.trim().startsWith('gsk_')
              ? '⚡ Groq API key detected: Will provide ultra-fast failover if Gemini is busy.'
              : '✓ Secondary Gemini key configured for seamless quota rollover.'}
          </Text>
        )}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.75}
        >
          <Text style={styles.saveBtnText}>
            {isSaved ? 'Saved! ✓' : 'Save'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testBtn}
          onPress={() => handleTestKey('primary')}
          disabled={isTestingPrimary || isTestingFallback}
          activeOpacity={0.75}
        >
          {isTestingPrimary ? (
            <ActivityIndicator size="small" color="#C8F322" />
          ) : (
            <>
              <RefreshCw size={13} color="#C8F322" style={{ marginRight: 5 }} />
              <Text style={styles.testBtnText}>Test Primary</Text>
            </>
          )}
        </TouchableOpacity>

        {fallbackKey.trim().length > 0 && (
          <TouchableOpacity
            style={styles.testFallbackBtn}
            onPress={() => handleTestKey('fallback')}
            disabled={isTestingPrimary || isTestingFallback}
            activeOpacity={0.75}
          >
            {isTestingFallback ? (
              <ActivityIndicator size="small" color="#00F0FF" />
            ) : (
              <>
                <RefreshCw size={13} color="#00F0FF" style={{ marginRight: 5 }} />
                <Text style={styles.testFallbackBtnText}>Test Fallback</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
                Connected! ~{testResult.latencyMs}ms ({testResult.modelUsed || activeModel})
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
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.2)',
    marginBottom: 16,
  },
  bannerTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12.5,
    color: '#C8F322',
  },
  bannerDesc: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 10.5,
    color: '#A8AF90',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
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
  modelGroup: {
    marginBottom: 14,
  },
  modelPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  modelPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#101319',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modelPillActive: {
    backgroundColor: '#C8F322',
    borderColor: '#C8F322',
  },
  modelPillText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 11,
    color: '#A8AF90',
  },
  modelPillTextActive: {
    color: '#101319',
  },
  fallbackHint: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 10.5,
    color: '#00F0FF',
    marginTop: 5,
    paddingHorizontal: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  saveBtn: {
    flex: 0.8,
    backgroundColor: '#1D2026',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveBtnText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12.5,
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
    fontSize: 12.5,
    color: '#C8F322',
  },
  testFallbackBtn: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  testFallbackBtnText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12.5,
    color: '#00F0FF',
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
