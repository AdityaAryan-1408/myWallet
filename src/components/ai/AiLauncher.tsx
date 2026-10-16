/**
 * MyWallet — AI Co-Pilot Floating Launcher
 *
 * 3-State Adaptive Floating Launcher:
 * 1. Standby: Sleek semi-circle docked on either left or right edge.
 * 2. Active: Morphs into a full circular floating orb + floating pill label.
 *    - Fully draggable in 2D (anywhere vertically and to either left or right side).
 *    - Snaps to the nearest edge (left or right) on drag release.
 *    - Auto-collapses back to semi-circle after 4 seconds of inactivity.
 * 3. Background Multi-Tasking & Notifications:
 *    - Animated pulsing glow & telemetry status when AI is thinking in the background.
 *    - Vibrant notification badge + "Answer Ready! ✨" indicator when generation finishes.
 *    - Instant 1-tap re-opening directly from docked state when answer is ready.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles, Check } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { getThemePalette } from '@/theme';
import { useAiChatStore } from '@/stores/aiChatStore';

interface AiLauncherProps {
  onOpen: () => void;
  isVisible?: boolean;
}

const COLLAPSE_TIMEOUT_MS = 4000;
const DOCKED_WIDTH = 34;
const DOCKED_HEIGHT = 56;
const FULL_DIAMETER = 54;

export function AiLauncher({ onOpen, isVisible = true }: AiLauncherProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const themeMode = useThemeStore((s) => s.themeMode);
  const palette = React.useMemo(() => getThemePalette(themeMode), [themeMode]);
  const isDark = themeMode !== 'light' && themeMode !== 'mono_light';
  const styles = React.useMemo(() => createLauncherStyles(palette, isDark), [palette, isDark]);

  // AI Store State
  const isGenerating = useAiChatStore((s) => s.isGenerating);
  const telemetryStatus = useAiChatStore((s) => s.telemetryStatus);
  const hasUnreadResponse = useAiChatStore((s) => s.hasUnreadResponse);
  const markResponseRead = useAiChatStore((s) => s.markResponseRead);

  // Launcher mode: 'docked' | 'active'
  const [mode, setMode] = useState<'docked' | 'active'>('docked');
  const modeRef = useRef<'docked' | 'active'>('docked');
  modeRef.current = mode;

  // Dock side: 'left' | 'right'
  const [dockSide, setDockSide] = useState<'left' | 'right'>('right');
  const dockSideRef = useRef<'left' | 'right'>('right');
  dockSideRef.current = dockSide;

  // Safe vertical bounds
  const minY = 80;
  const maxY = windowHeight - 160;
  const defaultY = Math.round(windowHeight * 0.42);

  // Position animated values (absolute X and Y coordinates of the orb)
  const defaultX = windowWidth - DOCKED_WIDTH;
  const translateX = useRef(new Animated.Value(defaultX)).current;
  const translateY = useRef(new Animated.Value(defaultY)).current;

  // Current coordinate references for drag tracking
  const currentXRef = useRef(defaultX);
  const currentYRef = useRef(defaultY);

  // Morph expansion animation: 0 = docked semi-circle, 1 = full active circle
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Background Generating Pulse Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isGenerating) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.92,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      animLoop?.stop();
    };
  }, [isGenerating, pulseAnim]);

  // Answer Ready Attention Animation
  const readyAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (hasUnreadResponse) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(readyAnim, {
            toValue: 1.22,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(readyAnim, {
            toValue: 1.0,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      readyAnim.setValue(1);
    }
    return () => {
      animLoop?.stop();
    };
  }, [hasUnreadResponse, readyAnim]);

  // Auto-collapse timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep onOpen fresh in ref to avoid stale closures
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  // Gesture tracking ref to distinguish tap vs drag
  const isDraggingRef = useRef(false);

  // Clear collapse timer
  const clearCollapseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Collapse back to docked semi-circle
  const collapseToDocked = useCallback(() => {
    clearCollapseTimer();
    const targetX = dockSideRef.current === 'left' ? 0 : windowWidth - DOCKED_WIDTH;

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        damping: 18,
        stiffness: 140,
        useNativeDriver: false,
      }),
      Animated.spring(expandAnim, {
        toValue: 0,
        damping: 18,
        stiffness: 140,
        useNativeDriver: false,
      }),
    ]).start(() => {
      currentXRef.current = targetX;
      setMode('docked');
      modeRef.current = 'docked';
    });
  }, [clearCollapseTimer, expandAnim, translateX, windowWidth]);

  // Start collapse timer
  const startCollapseTimer = useCallback(() => {
    clearCollapseTimer();
    timerRef.current = setTimeout(() => {
      collapseToDocked();
    }, COLLAPSE_TIMEOUT_MS);
  }, [clearCollapseTimer, collapseToDocked]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearCollapseTimer();
  }, [clearCollapseTimer]);

  // Expand to active full circle
  const expandToActive = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode('active');
    modeRef.current = 'active';

    const targetX =
      dockSideRef.current === 'left' ? 16 : windowWidth - FULL_DIAMETER - 16;
    currentXRef.current = targetX;

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetX,
        damping: 18,
        stiffness: 150,
        useNativeDriver: false,
      }),
      Animated.spring(expandAnim, {
        toValue: 1,
        damping: 18,
        stiffness: 150,
        useNativeDriver: false,
      }),
    ]).start();

    startCollapseTimer();
  }, [expandAnim, startCollapseTimer, translateX, windowWidth]);

  // Handle tap
  const handleTap = useCallback(() => {
    // 1. If an answer is ready, 1 single tap immediately opens the chat!
    if (hasUnreadResponse) {
      clearCollapseTimer();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      markResponseRead();

      const targetX = dockSideRef.current === 'left' ? 0 : windowWidth - DOCKED_WIDTH;
      expandAnim.setValue(0);
      translateX.setValue(targetX);
      currentXRef.current = targetX;
      setMode('docked');
      modeRef.current = 'docked';

      onOpenRef.current();
      return;
    }

    if (modeRef.current === 'docked') {
      // Tap 1: expand from semi-circle to full circle
      expandToActive();
    } else {
      // Tap 2 on full circle: open the chat overlay immediately!
      clearCollapseTimer();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const targetX = dockSideRef.current === 'left' ? 0 : windowWidth - DOCKED_WIDTH;
      expandAnim.setValue(0);
      translateX.setValue(targetX);
      currentXRef.current = targetX;
      setMode('docked');
      modeRef.current = 'docked';

      onOpenRef.current();
    }
  }, [clearCollapseTimer, expandAnim, expandToActive, hasUnreadResponse, markResponseRead, translateX, windowWidth]);

  // Handle drag finish & snapping
  const handleDragEnd = useCallback(
    (finalX: number, finalY: number) => {
      const isLeftSide = finalX < windowWidth / 2;
      const newSide: 'left' | 'right' = isLeftSide ? 'left' : 'right';
      setDockSide(newSide);
      dockSideRef.current = newSide;

      // In active mode, snap 16px from the chosen edge
      const snapX = isLeftSide ? 16 : windowWidth - FULL_DIAMETER - 16;
      currentXRef.current = snapX;
      currentYRef.current = finalY;

      Animated.parallel([
        Animated.spring(translateX, {
          toValue: snapX,
          damping: 18,
          stiffness: 150,
          useNativeDriver: false,
        }),
        Animated.spring(translateY, {
          toValue: finalY,
          damping: 18,
          stiffness: 150,
          useNativeDriver: false,
        }),
      ]).start();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startCollapseTimer();
    },
    [startCollapseTimer, translateX, translateY, windowWidth]
  );

  // PanResponder supporting full 2D movement
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4;
      },
      onPanResponderGrant: () => {
        clearCollapseTimer();
        isDraggingRef.current = false;
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
          isDraggingRef.current = true;
        }

        // Only allow free dragging once in active mode
        if (modeRef.current === 'active') {
          const nextX = Math.min(
            Math.max(currentXRef.current + gesture.dx, 0),
            windowWidth - FULL_DIAMETER
          );
          const nextY = Math.min(
            Math.max(currentYRef.current + gesture.dy, minY),
            maxY
          );
          translateX.setValue(nextX);
          translateY.setValue(nextY);

          // Update dock side dynamically if dragged across midpoint
          const isLeft = nextX < windowWidth / 2;
          if ((isLeft && dockSideRef.current !== 'left') || (!isLeft && dockSideRef.current !== 'right')) {
            const side = isLeft ? 'left' : 'right';
            setDockSide(side);
            dockSideRef.current = side;
          }
        } else {
          // If in docked state and dragged vertically
          const nextY = Math.min(
            Math.max(currentYRef.current + gesture.dy, minY),
            maxY
          );
          translateY.setValue(nextY);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const movedDistance = Math.sqrt(gesture.dx * gesture.dx + gesture.dy * gesture.dy);
        if (!isDraggingRef.current || movedDistance < 6) {
          // Clean tap
          handleTap();
        } else {
          // Drag release
          const finalX = Math.min(
            Math.max(currentXRef.current + gesture.dx, 0),
            windowWidth - FULL_DIAMETER
          );
          const finalY = Math.min(
            Math.max(currentYRef.current + gesture.dy, minY),
            maxY
          );
          handleDragEnd(finalX, finalY);
        }
      },
      onPanResponderTerminate: () => {
        startCollapseTimer();
      },
    })
  ).current;

  if (!isVisible) return null;

  // Size interpolations
  const width = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DOCKED_WIDTH, FULL_DIAMETER],
  });

  const height = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DOCKED_HEIGHT, FULL_DIAMETER],
  });

  // Corner radius interpolations according to dockSide
  const leftBorderRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [dockSide === 'left' ? 0 : 28, FULL_DIAMETER / 2],
  });

  const rightBorderRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [dockSide === 'right' ? 0 : 28, FULL_DIAMETER / 2],
  });

  // Floating label animations
  const labelOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const labelTranslateX = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [dockSide === 'left' ? -12 : 12, 0],
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          left: translateX,
          top: translateY,
        },
      ]}
    >
      {/* ── Docked Unread Answer Pill (When docked & answer ready) ── */}
      {hasUnreadResponse && mode === 'docked' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dockedNoticePill,
            styles.dockedNoticeReady,
            dockSide === 'right' ? styles.dockedNoticeLeft : styles.dockedNoticeRight,
            { transform: [{ scale: readyAnim }] },
          ]}
        >
          <View style={styles.unreadDot} />
          <Text style={styles.dockedNoticeReadyText}>Answer Ready! ✨</Text>
        </Animated.View>
      )}

      {/* ── Docked Thinking Status Pill (When docked & AI is generating) ── */}
      {isGenerating && mode === 'docked' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dockedNoticePill,
            styles.dockedNoticeThinking,
            dockSide === 'right' ? styles.dockedNoticeLeft : styles.dockedNoticeRight,
            { opacity: pulseAnim },
          ]}
        >
          <ActivityIndicator size={10} color={palette.primaryFixed} style={{ marginRight: 6 }} />
          <Text style={styles.dockedNoticeThinkingText} numberOfLines={1}>
            {telemetryStatus ? telemetryStatus.slice(0, 16) : 'Thinking...'}
          </Text>
        </Animated.View>
      )}

      {/* ── Label Pill on Left of orb (when docked on right & active) ── */}
      {dockSide === 'right' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.labelBadge,
            styles.labelLeft,
            hasUnreadResponse && styles.labelBadgeReady,
            {
              opacity: labelOpacity,
              transform: [{ translateX: labelTranslateX }],
            },
          ]}
        >
          <Text
            style={[
              styles.labelText,
              hasUnreadResponse && styles.labelTextReady,
            ]}
            numberOfLines={1}
          >
            {hasUnreadResponse
              ? '✨ Answer Ready!'
              : isGenerating
              ? telemetryStatus || 'Thinking...'
              : '✨ Co-Pilot'}
          </Text>
        </Animated.View>
      )}

      {/* ── Floating Orb Touch Target ── */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.orb,
          {
            width,
            height,
            borderTopLeftRadius: leftBorderRadius,
            borderBottomLeftRadius: leftBorderRadius,
            borderTopRightRadius: rightBorderRadius,
            borderBottomRightRadius: rightBorderRadius,
          },
          mode === 'active' && styles.orbActiveShadow,
          isGenerating && styles.orbGeneratingGlow,
          hasUnreadResponse && styles.orbReadyGlow,
        ]}
      >
        {/* Unread Answer Glowing Notification Badge Dot */}
        {hasUnreadResponse && (
          <Animated.View
            style={[
              styles.notificationDot,
              dockSide === 'right' ? styles.badgeDockedRight : styles.badgeDockedLeft,
              { transform: [{ scale: readyAnim }] },
            ]}
          >
            <Check size={8} color="#000" strokeWidth={3} />
          </Animated.View>
        )}

        {/* Background Thinking Dot */}
        {isGenerating && !hasUnreadResponse && (
          <Animated.View
            style={[
              styles.thinkingDot,
              dockSide === 'right' ? styles.badgeDockedRight : styles.badgeDockedLeft,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
        )}

        {/* Center Orb Icon */}
        {hasUnreadResponse ? (
          <Animated.View style={{ transform: [{ scale: readyAnim }] }}>
            <Sparkles size={mode === 'docked' ? 18 : 22} color="#10B981" strokeWidth={2.4} />
          </Animated.View>
        ) : isGenerating ? (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Sparkles size={mode === 'docked' ? 18 : 22} color={palette.primaryFixed} strokeWidth={2.4} />
          </Animated.View>
        ) : (
          <Sparkles size={mode === 'docked' ? 18 : 22} color={palette.primaryFixed} strokeWidth={2.2} />
        )}
      </Animated.View>

      {/* ── Label Pill on Right of orb (when docked on left & active) ── */}
      {dockSide === 'left' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.labelBadge,
            styles.labelRight,
            hasUnreadResponse && styles.labelBadgeReady,
            {
              opacity: labelOpacity,
              transform: [{ translateX: labelTranslateX }],
            },
          ]}
        >
          <Text
            style={[
              styles.labelText,
              hasUnreadResponse && styles.labelTextReady,
            ]}
            numberOfLines={1}
          >
            {hasUnreadResponse
              ? '✨ Answer Ready!'
              : isGenerating
              ? telemetryStatus || 'Thinking...'
              : '✨ Co-Pilot'}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const createLauncherStyles = (palette: ReturnType<typeof getThemePalette>, isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    },
    // Docked Notice Pill (Peeks out when docked to show standby state)
    dockedNoticePill: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 16,
      borderWidth: 1,
      ...Platform.select({
        android: { elevation: 8 },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.35,
          shadowRadius: 5,
        },
      }),
    },
    dockedNoticeLeft: {
      right: DOCKED_WIDTH + 8,
    },
    dockedNoticeRight: {
      left: DOCKED_WIDTH + 8,
    },
    dockedNoticeReady: {
      backgroundColor: '#064E3B',
      borderColor: '#10B981',
    },
    dockedNoticeReadyText: {
      fontFamily: 'PlusJakartaSans-Bold',
      fontSize: 11,
      color: '#A7F3D0',
      letterSpacing: 0.3,
    },
    dockedNoticeThinking: {
      backgroundColor: palette.surfaceContainerHigh,
      borderColor: `${palette.primaryFixed}60`,
    },
    dockedNoticeThinkingText: {
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 11,
      color: palette.onSurface,
      letterSpacing: 0.2,
      maxWidth: 110,
    },
    unreadDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#10B981',
      marginRight: 6,
    },

    // Active Mode Label Pill
    labelBadge: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 86,
      backgroundColor: palette.surfaceContainerHigh,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: `${palette.primaryFixed}40`,
      ...Platform.select({
        android: { elevation: 6 },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.35 : 0.15,
          shadowRadius: 5,
        },
      }),
    },
    labelBadgeReady: {
      backgroundColor: '#064E3B',
      borderColor: '#10B981',
    },
    labelLeft: {
      right: FULL_DIAMETER + 10,
    },
    labelRight: {
      left: FULL_DIAMETER + 10,
    },
    labelText: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontSize: 12,
      color: palette.onSurface,
      letterSpacing: 0.2,
      flexShrink: 0,
      includeFontPadding: false,
    },
    labelTextReady: {
      color: '#A7F3D0',
      fontFamily: 'PlusJakartaSans-Bold',
    },

    // Floating Orb Base
    orb: {
      backgroundColor: palette.surfaceContainerLow,
      borderWidth: 1.5,
      borderColor: `${palette.primaryFixed}60`,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'visible',
    },
    orbActiveShadow: {
      borderColor: palette.primaryFixed,
      ...Platform.select({
        android: { elevation: 10 },
        ios: {
          shadowColor: palette.primaryFixed,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 10,
        },
      }),
    },
    orbGeneratingGlow: {
      borderColor: palette.primaryFixed,
      ...Platform.select({
        android: { elevation: 12 },
        ios: {
          shadowColor: palette.primaryFixed,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.65,
          shadowRadius: 12,
        },
      }),
    },
    orbReadyGlow: {
      borderColor: '#10B981',
      ...Platform.select({
        android: { elevation: 14 },
        ios: {
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.75,
          shadowRadius: 14,
        },
      }),
    },

    // Status Dots on the Orb
    notificationDot: {
      position: 'absolute',
      top: -2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#10B981',
      borderWidth: 1.5,
      borderColor: palette.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    thinkingDot: {
      position: 'absolute',
      top: 1,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: palette.primaryFixed,
      borderWidth: 1.5,
      borderColor: palette.surfaceContainerLow,
      zIndex: 100,
    },
    badgeDockedRight: {
      left: 2,
    },
    badgeDockedLeft: {
      right: 2,
    },
  });
