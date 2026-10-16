/**
 * MyWallet — AI Co-Pilot Resizable Chat Overlay
 *
 * Zenith Obsidian Design System:
 * - Resizable height overlay with top drag handle (min 50%, max 95%, drag down to minimize)
 * - Hardware blurred frosted backdrop (expo-blur + dark scrim)
 * - Rich Markdown rendering with highlighted verdicts and bullet points (no raw asterisks)
 * - Financial Metric Cards matching design reference (Safe Outflow Pool, Progress bar, 2-Col Grid)
 * - Keyboard-adaptive input bar that rises smoothly above Android / iOS soft keyboards
 * - Clean dual controls: [—] Minimize to bubble and [✕] Close/Reset session
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  useWindowDimensions,
  Platform,
  Pressable,
  ActivityIndicator,
  PanResponder,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import {
  Sparkles,
  Minus,
  X,
  Plus,
  ArrowUp,
  Zap,
  CreditCard,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useAiChatStore } from '@/stores/aiChatStore';
import { useThemeStore } from '@/stores/themeStore';
import { getThemePalette } from '@/theme';
import { FinancialCardData, AiChatMessage } from '@/services/ai/aiService';
import { SettingsRepository } from '@/repositories/settingsRepository';

interface AiChatOverlayProps {
  isOpen: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

export function AiChatOverlay({ isOpen, onMinimize, onClose }: AiChatOverlayProps) {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();

  const themeMode = useThemeStore((s) => s.themeMode);
  const palette = React.useMemo(() => getThemePalette(themeMode), [themeMode]);
  const isDark = themeMode !== 'light' && themeMode !== 'mono_light';
  const styles = React.useMemo(() => createStyles(palette, isDark), [palette, isDark]);

  const minHeight = Math.round(windowHeight * 0.48);
  const defaultHeight = Math.round(windowHeight * 0.82);
  const maxHeight = Math.round(windowHeight * 0.95);

  const [currentHeight, setCurrentHeight] = useState(defaultHeight);
  const currentHeightRef = useRef(defaultHeight);
  currentHeightRef.current = currentHeight;

  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Live Zustand state
  const { messages, isGenerating, telemetryStatus, sendMessage, clearChat, markResponseRead } =
    useAiChatStore();

  const [isConfigured, setIsConfigured] = useState(false);
  useEffect(() => {
    if (isOpen) {
      markResponseRead();
      const primaryKey = SettingsRepository.get('ai_gemini_api_key', '').trim();
      const fallbackKey = SettingsRepository.get('ai_fallback_api_key', '').trim();
      setIsConfigured(Boolean(primaryKey || fallbackKey));
    }
  }, [isOpen, markResponseRead]);

  // Slide animation: 0 = hidden off bottom, 1 = fully visible
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Keyboard show/hide listener to lift input above keyboard
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Sync open/close animation
  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 1,
        damping: 22,
        stiffness: 140,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, slideAnim]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages, isGenerating, telemetryStatus]);

  // Top Handle PanResponder for Drag-to-Resize
  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,
      onPanResponderMove: (_, gesture) => {
        // Dragging UP (gesture.dy < 0) increases height; Dragging DOWN (gesture.dy > 0) decreases height
        const targetH = currentHeightRef.current - gesture.dy;
        if (targetH >= minHeight * 0.7 && targetH <= maxHeight) {
          setCurrentHeight(targetH);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const finalH = currentHeightRef.current - gesture.dy;
        if (finalH < minHeight * 0.95) {
          // Dragged down below ~46-48% -> minimize!
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          handleMinimize();
        } else {
          // Clamp and persist
          const clamped = Math.max(minHeight, Math.min(maxHeight, finalH));
          setCurrentHeight(clamped);
          currentHeightRef.current = clamped;
        }
      },
    })
  ).current;

  const handleMinimize = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onMinimize();
    });
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      clearChat();
      setInputText('');
      onClose();
    });
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isGenerating) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    await sendMessage(text);
  };

  const handleOpenPrefilledTransaction = (data: {
    amount: number;
    type?: string;
    account?: string;
    category?: string;
    note?: string;
  }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleMinimize();
    router.push({
      pathname: '/add-transaction',
      params: {
        amount: data.amount.toString(),
        type: data.type || 'expense',
        category: data.category || '',
        note: data.note || '',
      },
    });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [maxHeight + 100, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // ─── Markdown Renderer Helpers ───────────────────────────────────────────────

  const renderFormattedMarkdown = (rawText: string) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return lines.map((line, lineIndex) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <View key={`sp_${lineIndex}`} style={{ height: 6 }} />;
      }

      // 1. Horizontal divider / rule (--- or *** or ___)
      if (trimmed === '---' || trimmed === '***' || trimmed === '___' || /^[-*_]{3,}$/.test(trimmed)) {
        return <View key={`hr_${lineIndex}`} style={styles.markdownDivider} />;
      }

      // 2. Markdown headings (# Heading, ## Heading, ### Heading)
      if (trimmed.startsWith('#')) {
        const headingMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          return (
            <Text
              key={`h_${lineIndex}`}
              style={[
                styles.markdownHeading,
                level === 1 && styles.markdownH1,
                level === 2 && styles.markdownH2,
                level >= 3 && styles.markdownH3,
              ]}
            >
              {text}
            </Text>
          );
        }
      }

      // 3. Bullets (•, -, *, or numbered 1., 2.)
      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
      const isNumbered = /^\d+\.\s+/.test(trimmed);

      let cleanLine = trimmed;
      let bulletPrefix = '';

      if (isBullet) {
        cleanLine = trimmed.replace(/^[•\-\*]\s*/, '');
      } else if (isNumbered) {
        const numMatch = trimmed.match(/^(\d+\.)\s*(.*)$/);
        if (numMatch) {
          bulletPrefix = numMatch[1];
          cleanLine = numMatch[2];
        }
      }

      const isLeadingVerdict =
        cleanLine.startsWith('**') &&
        (cleanLine.toLowerCase().includes('yes') ||
          cleanLine.toLowerCase().includes('tight') ||
          cleanLine.toLowerCase().includes('status') ||
          cleanLine.toLowerCase().includes('comfortable') ||
          cleanLine.toLowerCase().includes('caution') ||
          cleanLine.toLowerCase().includes('squeeze') ||
          cleanLine.toLowerCase().includes('verdict') ||
          cleanLine.toLowerCase().includes('proceed') ||
          cleanLine.toLowerCase().includes('ready'));

      // Split by **bold** markdown tags
      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

      const renderedSpans = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2);
          return (
            <Text
              key={`b_${partIdx}`}
              style={[
                styles.boldSpan,
                isLeadingVerdict && (partIdx === 0 || partIdx === 1) && styles.verdictSpan,
              ]}
            >
              {inner}
            </Text>
          );
        }
        return (
          <Text key={`n_${partIdx}`} style={styles.normalSpan}>
            {part}
          </Text>
        );
      });

      if (isBullet) {
        return (
          <View key={`bl_${lineIndex}`} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{renderedSpans}</Text>
          </View>
        );
      }

      if (isNumbered) {
        return (
          <View key={`num_${lineIndex}`} style={styles.bulletRow}>
            <Text style={styles.numberedPrefix}>{bulletPrefix}</Text>
            <Text style={styles.bulletText}>{renderedSpans}</Text>
          </View>
        );
      }

      return (
        <Text key={`ln_${lineIndex}`} style={styles.paragraphLine}>
          {renderedSpans}
        </Text>
      );
    });
  };

  // ─── Embedded Financial Metric Card (screen.png) ─────────────────────────────

  const renderFinancialCard = (card: FinancialCardData) => {
    return (
      <View style={styles.metricCard}>
        {/* Card Header Row */}
        <View style={styles.metricCardHeader}>
          <Text style={styles.metricCardTitle}>{card.title}</Text>
          <Text style={styles.metricCardMainAmount}>
            ₹{card.mainAmount.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Micro Bar */}
        <View style={styles.microBarBg}>
          <View
            style={[
              styles.microBarFill,
              { width: `${Math.max(10, Math.min(100, card.progressBarPercent || 50))}%` },
            ]}
          />
        </View>

        {/* Impact Projection 2-Col Grid */}
        <View style={styles.metricCardGrid}>
          <View style={styles.metricGridCol}>
            <Text style={styles.metricGridLabel}>REMAINING POOL</Text>
            <Text style={styles.metricGridValue}>
              ₹{(card.remainingPool ?? card.mainAmount).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.metricGridCol}>
            <Text style={styles.metricGridLabel}>SAFE DAILY PACE</Text>
            <Text style={[styles.metricGridValue, { color: '#00EEFC' }]}>
              ₹{card.safeDailyPace ?? 45} / day
            </Text>
          </View>
        </View>

        {/* Cushion Status Badge */}
        {card.cushionText && (
          <View style={styles.cushionBadge}>
            <Check size={13} color={palette.primaryFixed} strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.cushionText} numberOfLines={2}>
              {card.cushionText}
            </Text>
          </View>
        )}

        {/* Quick Action Triggers */}
        {card.prefillAmount ? (
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.cardActionBtnPrimary}
              activeOpacity={0.8}
              onPress={() =>
                handleOpenPrefilledTransaction({
                  amount: card.prefillAmount!,
                  note: card.prefillNote || 'Quick Spend',
                  type: 'expense',
                })
              }
            >
              <Plus size={13} color={palette.primaryFixed} strokeWidth={2.5} style={{ marginRight: 4 }} />
              <Text style={styles.cardActionBtnPrimaryText}>
                Pre-log ₹{card.prefillAmount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardActionBtnSecondary}
              activeOpacity={0.8}
              onPress={() => {
                handleMinimize();
                router.push('/budgets');
              }}
            >
              <Text style={styles.cardActionBtnSecondaryText}>View Budgets</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Blurred & Dimmed Backdrop (Tap to Minimize) */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? (isDark ? 65 : 45) : (isDark ? 40 : 30)}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(8, 11, 16, 0.78)' : 'rgba(255, 255, 255, 0.70)' },
          ]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={handleMinimize} />
      </Animated.View>

      {/* Resizable Bottom Sheet Container */}
      <View style={styles.keyboardContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              height: currentHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Drag Handle Bar (Hold & Drag up/down to resize) */}
          <View
            style={styles.handleWrapper}
            hitSlop={{ top: 16, bottom: 16, left: 40, right: 40 }}
            {...handlePanResponder.panHandlers}
          >
            <View style={styles.dragHandle} />
          </View>

          {/* Clean Dynamic Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarBadge}>
                <Sparkles size={18} color={palette.primaryFixed} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Co-Pilot</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.onlineDot,
                      !isConfigured && styles.offlineDot,
                      isGenerating && styles.generatingDot,
                    ]}
                  />
                  <Text style={styles.statusText} numberOfLines={1}>
                    {isGenerating
                      ? telemetryStatus || 'Analyzing...'
                      : isConfigured
                      ? 'Online (Gemini 3.8 Flash)'
                      : 'Offline Mode (Local)'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Dual Controls: [—] Minimize vs [✕] Close */}
            <View style={styles.headerControls}>
              <TouchableOpacity
                onPress={handleMinimize}
                style={styles.controlButton}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Minus size={18} color={palette.onSurfaceVariant} strokeWidth={2.2} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                style={[styles.controlButton, styles.closeButton]}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={17} color={palette.error || palette.onSurface} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat Messages Scroll */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) =>
              msg.sender === 'user' ? (
                // ── User Message ──
                <View key={msg.id} style={styles.userBubbleWrapper}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.text}</Text>
                    <View style={styles.userMeta}>
                      <Text style={styles.metaTime}>{msg.time}</Text>
                      <Check size={12} color={palette.primaryFixed} strokeWidth={2.5} style={{ marginLeft: 3 }} />
                    </View>
                  </View>
                </View>
              ) : (
                // ── AI Message ──
                <View key={msg.id} style={styles.aiMessageWrapper}>
                  <View style={styles.aiAvatarSmall}>
                    <Sparkles size={14} color={palette.primaryFixed} strokeWidth={2.2} />
                  </View>

                  <View style={styles.aiContentContainer}>
                    {/* Tool Telemetry Tag */}
                    {msg.telemetry && (
                      <View style={styles.telemetryPill}>
                        <View style={styles.telemetryDot} />
                        <Text style={styles.telemetryText}>{msg.telemetry}</Text>
                      </View>
                    )}

                    {/* AI Message Bubble */}
                    <View style={styles.aiBubble}>
                      {renderFormattedMarkdown(msg.text)}

                      {/* Embedded Financial Metric Card (screen.png) */}
                      {msg.financialCard && renderFinancialCard(msg.financialCard)}
                    </View>

                    {/* Standalone Action Button if Prefill available */}
                    {msg.prefillData && !msg.financialCard?.prefillAmount && (
                      <TouchableOpacity
                        style={styles.prefillActionCard}
                        activeOpacity={0.8}
                        onPress={() => handleOpenPrefilledTransaction(msg.prefillData!)}
                      >
                        <View style={styles.prefillLeft}>
                          <Plus size={16} color={palette.primaryFixed} strokeWidth={2.5} />
                          <View>
                            <Text style={styles.prefillTitle}>
                              Log ₹{msg.prefillData.amount.toLocaleString('en-IN')}{' '}
                              {msg.prefillData.note ? `• ${msg.prefillData.note}` : ''}
                            </Text>
                            <Text style={styles.prefillSubtitle}>
                              Tap to review details in Add Transaction
                            </Text>
                          </View>
                        </View>
                        <ArrowRight size={16} color={palette.primaryFixed} strokeWidth={2.2} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            )}

            {/* Dynamic Generating / Telemetry Standby State */}
            {isGenerating && (
              <View style={styles.generatingState}>
                <View style={styles.aiAvatarSmall}>
                  <Sparkles size={14} color={palette.primaryFixed} strokeWidth={2.2} />
                </View>
                <View style={styles.thinkingPill}>
                  <ActivityIndicator size="small" color={palette.primaryFixed} style={{ marginRight: 8 }} />
                  <Text style={styles.thinkingText}>
                    {telemetryStatus || 'Thinking...'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Suggestion Chips Carousel */}
          <View style={styles.chipsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContent}
            >
              <TouchableOpacity
                style={styles.chipPill}
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setInputText('What is my current available balance?');
                }}
              >
                <Zap size={13} color={palette.primaryFixed} strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.chipText}>Available balance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chipPill}
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setInputText('Can I afford ₹500 food today?');
                }}
              >
                <Sparkles size={13} color={palette.secondaryContainer || palette.primaryFixed} strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.chipText}>Can I afford ₹500?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chipPill}
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setInputText('What are my credit card dues?');
                }}
              >
                <CreditCard size={13} color={palette.tertiaryContainer || palette.primaryFixed} strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.chipText}>Card dues</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chipPill}
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setInputText('Log ₹20 on SBI tagged Chai');
                }}
              >
                <Plus size={13} color={palette.income || palette.primaryFixed} strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.chipText}>Log ₹20 Chai</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Full-Width Typing Input Bar (Rises above keyboard) */}
          <View
            style={[
              styles.inputBarContainer,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 8 : (Platform.OS === 'ios' ? 24 : 14) },
            ]}
          >
            <View style={styles.inputInner}>
              <TouchableOpacity
                style={styles.attachBtn}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setInputText('How is my Food & Dining budget?');
                }}
              >
                <Plus size={19} color={palette.outline} strokeWidth={2.2} />
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                placeholder="Ask anything or command..."
                placeholderTextColor={palette.outline}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!isGenerating}
              />

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  inputText.trim().length > 0 && !isGenerating && styles.sendBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={handleSend}
                disabled={!inputText.trim() || isGenerating}
              >
                <ArrowUp
                  size={18}
                  color={
                    inputText.trim().length > 0 && !isGenerating
                      ? (isDark ? (palette.surfaceContainerLowest || '#101319') : '#FFFFFF')
                      : palette.onSurfaceVariant
                  }
                  strokeWidth={3}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getThemePalette>, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      overflow: 'hidden',
      zIndex: 9998,
    },
    keyboardContainer: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'flex-end',
      zIndex: 9999,
    },
    sheetContainer: {
      width: '100%',
      backgroundColor: palette.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: palette.strokeMedium,
      overflow: 'hidden',
      ...Platform.select({
        android: { elevation: 24 },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.5 : 0.15,
          shadowRadius: 16,
        },
      }),
    },
    handleWrapper: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 8,
      width: '100%',
    },
    dragHandle: {
      width: 44,
      height: 4.5,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.22)',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: palette.strokeSubtle,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarBadge: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: palette.surfaceContainerLow,
      borderWidth: 1,
      borderColor: `${palette.primaryFixed}40`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: 'PlusJakartaSans-Bold',
      fontSize: 17,
      color: palette.onSurface,
      letterSpacing: -0.2,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 1,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    offlineDot: {
      backgroundColor: '#F59E0B',
    },
    generatingDot: {
      backgroundColor: palette.primaryFixed,
    },
    statusText: {
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 11,
      color: palette.onSurfaceVariant,
    },
    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    controlButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: palette.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: palette.strokeMedium,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      backgroundColor: isDark ? 'rgba(255, 180, 171, 0.12)' : 'rgba(220, 38, 38, 0.10)',
      borderColor: isDark ? 'rgba(255, 180, 171, 0.25)' : 'rgba(220, 38, 38, 0.20)',
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 16,
    },
    userBubbleWrapper: {
      alignItems: 'flex-end',
      width: '100%',
    },
    userBubble: {
      maxWidth: '85%',
      backgroundColor: palette.surfaceContainerHigh,
      borderRadius: 18,
      borderTopRightRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: palette.strokeSubtle,
    },
    userText: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 14,
      color: palette.onSurface,
      lineHeight: 20,
    },
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 5,
    },
    metaTime: {
      fontFamily: 'JetBrainsMono-Regular',
      fontSize: 10,
      color: palette.onSurfaceVariant,
    },
    aiMessageWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      width: '100%',
    },
    aiAvatarSmall: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: palette.surfaceContainerLow,
      borderWidth: 1,
      borderColor: `${palette.primaryFixed}40`,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    aiContentContainer: {
      flex: 1,
      maxWidth: '90%',
      gap: 8,
    },
    telemetryPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${palette.primaryFixed}15`,
      borderWidth: 1,
      borderColor: `${palette.primaryFixed}40`,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    telemetryDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: palette.primaryFixed,
    },
    telemetryText: {
      fontFamily: 'JetBrainsMono-Medium',
      fontSize: 11,
      color: palette.primaryFixed,
      letterSpacing: 0.1,
    },
    aiBubble: {
      backgroundColor: palette.surfaceContainer,
      borderRadius: 18,
      borderTopLeftRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: palette.strokeMedium,
    },
    paragraphLine: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 14,
      color: palette.onSurface,
      lineHeight: 21,
      marginBottom: 4,
    },
    normalSpan: {
      color: palette.onSurface,
    },
    boldSpan: {
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: palette.onSurface,
    },
    verdictSpan: {
      color: palette.primaryFixed,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 3,
      marginBottom: 3,
      paddingLeft: 2,
    },
    bulletDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: palette.primaryFixed,
      marginTop: 8,
      marginRight: 8,
    },
    bulletText: {
      flex: 1,
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 13.5,
      color: palette.onSurface,
      lineHeight: 20,
    },
    numberedPrefix: {
      fontFamily: 'JetBrainsMono-Bold',
      fontSize: 12.5,
      color: palette.primaryFixed,
      marginRight: 6,
      marginTop: 1,
    },
    markdownDivider: {
      height: 1,
      backgroundColor: palette.strokeMedium,
      marginVertical: 10,
      width: '100%',
    },
    markdownHeading: {
      fontFamily: 'PlusJakartaSans-Bold',
      marginTop: 10,
      marginBottom: 4,
    },
    markdownH1: {
      fontSize: 16,
      color: palette.primaryFixed,
    },
    markdownH2: {
      fontSize: 15,
      color: palette.onSurface,
    },
    markdownH3: {
      fontSize: 12.5,
      fontFamily: 'PlusJakartaSans-Bold',
      color: palette.onSurfaceVariant,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    metricCard: {
      marginTop: 10,
      backgroundColor: palette.surfaceContainerLowest,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: palette.strokeMedium,
    },
    metricCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 6,
    },
    metricCardTitle: {
      fontFamily: 'PlusJakartaSans-Bold',
      fontSize: 11,
      color: palette.outline,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    metricCardMainAmount: {
      fontFamily: 'JetBrainsMono-Bold',
      fontSize: 17,
      fontWeight: '700',
      color: palette.primaryFixed,
    },
    microBarBg: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: palette.surfaceContainer,
      overflow: 'hidden',
      marginVertical: 4,
    },
    microBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: palette.primaryFixed,
    },
    metricCardGrid: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    metricGridCol: {
      flex: 1,
      backgroundColor: palette.surfaceContainerHigh,
      borderRadius: 8,
      padding: 8,
    },
    metricGridLabel: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontSize: 10,
      color: palette.outline,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    metricGridValue: {
      fontFamily: 'JetBrainsMono-SemiBold',
      fontSize: 13,
      fontWeight: '600',
      color: palette.onSurface,
      marginTop: 2,
    },
    cushionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surfaceContainerLow,
      borderWidth: 1,
      borderColor: `${palette.primaryFixed}25`,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
      marginTop: 8,
    },
    cushionText: {
      flex: 1,
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 11,
      color: palette.onSurfaceVariant,
    },
    cardActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
      paddingTop: 2,
    },
    cardActionBtnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${palette.primaryFixed}20`,
      borderWidth: 1,
      borderColor: `${palette.primaryFixed}50`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    cardActionBtnPrimaryText: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontSize: 12,
      color: palette.primaryFixed,
    },
    cardActionBtnSecondary: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: palette.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: palette.strokeMedium,
    },
    cardActionBtnSecondaryText: {
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 12,
      color: palette.onSurfaceVariant,
    },
    prefillActionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: palette.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: `${palette.primaryFixed}35`,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 2,
    },
    prefillLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    prefillTitle: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontSize: 13,
      color: palette.onSurface,
    },
    prefillSubtitle: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 11,
      color: palette.onSurfaceVariant,
      marginTop: 1,
    },
    generatingState: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    thinkingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surfaceContainerLow,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${palette.primaryFixed}30`,
    },
    thinkingText: {
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 12,
      color: palette.primaryFixed,
    },
    chipsSection: {
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: palette.strokeSubtle,
    },
    chipsContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    chipPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surfaceContainerLow,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.strokeMedium,
    },
    chipText: {
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 12,
      color: palette.onSurface,
    },
    inputBarContainer: {
      paddingHorizontal: 16,
      paddingTop: 4,
      backgroundColor: palette.surface,
    },
    inputInner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surfaceContainerLow,
      borderRadius: 26,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: palette.strokeMedium,
    },
    attachBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textInput: {
      flex: 1,
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 13.5,
      color: palette.onSurface,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: palette.surfaceContainerHigh,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnActive: {
      backgroundColor: palette.primaryFixed,
    },
  });
