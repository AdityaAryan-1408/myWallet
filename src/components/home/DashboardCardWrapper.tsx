/**
 * MyWallet — Dashboard Card Wrapper (Feature 15: Modular Dashboard)
 * 
 * Provides edit-mode chrome:
 * - Drag handle & Up/Down reorder controls
 * - Pin/Unpin toggle (Pinned cards stick directly below hero card)
 * - Remove button (×) to hide card
 * - iOS-style subtle wiggle animation when in edit mode
 * - Long-press to activate edit mode
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  GripVertical,
  Pin,
  PinOff,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';
import { useDashboardStore } from '@/stores';
import { getCardDefinition } from './DashboardCardRegistry';

interface DashboardCardWrapperProps {
  cardId: string;
  pinned: boolean;
  order: number;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
}

export function DashboardCardWrapper({
  cardId,
  pinned,
  isFirst,
  isLast,
  children,
}: DashboardCardWrapperProps) {
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  const toggleCardPinned = useDashboardStore((s) => s.toggleCardPinned);
  const toggleCardVisibility = useDashboardStore((s) => s.toggleCardVisibility);
  const moveCardStep = useDashboardStore((s) => s.moveCardStep);

  const cardDef = getCardDefinition(cardId);
  const cardTitle = cardDef?.displayName || cardId;

  // Gentle wiggle animation in edit mode (iOS style)
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isEditMode) {
      // Alternate wobble phase slightly based on cardId hash
      const hash = cardId.charCodeAt(0) % 2 === 0 ? 0.7 : -0.7;
      rotation.value = withRepeat(
        withSequence(
          withTiming(-hash, { duration: 150, easing: Easing.inOut(Easing.sin) }),
          withTiming(hash, { duration: 150, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      rotation.value = withTiming(0, { duration: 150 });
    }
  }, [isEditMode, cardId]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  const handleLongPress = () => {
    if (!isEditMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      toggleEditMode();
    }
  };

  const handlePin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleCardPinned(cardId);
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleCardVisibility(cardId);
  };

  const handleMoveUp = () => {
    if (isFirst) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    moveCardStep(cardId, 'up');
  };

  const handleMoveDown = () => {
    if (isLast) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    moveCardStep(cardId, 'down');
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        isEditMode && styles.wrapperEditMode,
        pinned && !isEditMode && styles.wrapperPinnedNormal,
        animatedStyle,
      ]}
    >
      {/* ── Edit Mode Control Bar ── */}
      {isEditMode && (
        <View style={styles.editBar}>
          <View style={styles.editBarLeft}>
            <View style={styles.dragHandle}>
              <GripVertical size={16} color={Colors.chartreuse} />
            </View>
            <Text style={styles.editBarTitle} numberOfLines={1}>
              {cardTitle}
            </Text>
          </View>

          <View style={styles.editBarRight}>
            {/* Quick Up/Down Reorder Arrows */}
            <TouchableOpacity
              onPress={handleMoveUp}
              disabled={isFirst}
              style={[styles.stepBtn, isFirst && styles.stepBtnDisabled]}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <ChevronUp size={16} color={isFirst ? Colors.strokeMedium : Colors.onSurface} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMoveDown}
              disabled={isLast}
              style={[styles.stepBtn, isLast && styles.stepBtnDisabled]}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <ChevronDown size={16} color={isLast ? Colors.strokeMedium : Colors.onSurface} />
            </TouchableOpacity>

            {/* Pin Toggle */}
            <TouchableOpacity
              onPress={handlePin}
              style={[styles.pinBtn, pinned && styles.pinBtnActive]}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              {pinned ? (
                <Pin size={14} color={Colors.surface} fill={Colors.surface} />
              ) : (
                <PinOff size={14} color={Colors.onSurfaceVariant} />
              )}
            </TouchableOpacity>

            {/* Remove / Hide Button */}
            <TouchableOpacity
              onPress={handleRemove}
              style={styles.removeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <X size={14} color={Colors.expense} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Normal Mode Pinned Badge (Subtle top indicator) ── */}
      {!isEditMode && pinned && (
        <View style={styles.pinnedBadge}>
          <Pin size={10} color={Colors.chartreuse} fill={Colors.chartreuse} />
          <Text style={styles.pinnedBadgeText}>PINNED</Text>
        </View>
      )}

      {/* ── Actual Card Content ── */}
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        delayLongPress={350}
        style={styles.cardContentContainer}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Shapes.xl,
    overflow: 'visible',
    position: 'relative',
  },
  wrapperPinnedNormal: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.chartreuse,
    paddingLeft: 3,
  },
  wrapperEditMode: {
    borderWidth: 1.5,
    borderColor: 'rgba(212, 255, 50, 0.4)',
    borderStyle: 'dashed',
    borderRadius: Shapes.xxl,
    padding: Spacing.xs,
    backgroundColor: 'rgba(212, 255, 50, 0.03)',
    ...Elevation.medium,
  },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Shapes.lg,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
  },
  editBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dragHandle: {
    padding: 2,
  },
  editBarTitle: {
    ...Typography.bodySmMedium,
    color: Colors.onSurface,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  editBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  pinBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  pinBtnActive: {
    backgroundColor: Colors.chartreuse,
    borderColor: Colors.chartreuse,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.25)',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    marginLeft: 4,
  },
  pinnedBadgeText: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.chartreuse,
    letterSpacing: 1,
    fontWeight: '700',
  },
  cardContentContainer: {
    width: '100%',
  },
});
