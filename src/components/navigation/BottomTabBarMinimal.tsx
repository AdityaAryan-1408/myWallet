/**
 * MyWallet — Finans Warm Minimal Bottom Tab Bar
 * 
 * Implements the Finans design specification from DESIGN.md and UI2 mockups:
 * - Clean elevated dock surface with warm shadow
 * - 4 ergonomic tab items symmetrically positioned around a center action button
 * - Center prominent yellow squircle button for instant Add Transaction trigger
 * - Quick tap on '+' opens Add Expense screen directly
 * - Hold on '+' reveals a semi-circle radial wheel with background blur
 * - Completely locks page scrolling while wheel is open
 * - Pixel-perfect symmetry: exact equal distance from left edge to Income as right edge to Transfer
 * - Dual gesture support: continuous hold-and-slide OR slide on open wheel
 * - Instant haptic selection feedback while sliding
 * - High-legibility humanist typography (Plus Jakarta Sans)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Receipt,
  Wallet,
  CreditCard,
  MoreHorizontal,
  Home,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react-native';
import { Colors, Shapes, FontFamily } from '@/theme';
import { useFinancialStore } from '@/stores';

interface TabConfig {
  label: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: { label: 'Home', icon: Home },
  activity: { label: 'Activity', icon: Receipt },
  accounts: { label: 'Accounts', icon: Wallet },
  cards: { label: 'Cards', icon: CreditCard },
  more: { label: 'More', icon: MoreHorizontal },
};

export interface BottomTabBarMinimalProps {
  activeIndex?: number;
  onTabPress?: (index: number) => void;
  onTabLongPress?: (index: number) => void;
}

interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

function MinimalTabItem({ routeName, isFocused, onPress, onLongPress }: TabItemProps) {
  const config = TAB_CONFIGS[routeName];
  if (!config) return null;

  const IconComponent = config.icon;

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      isFocused ? Colors.chartreuseWash : 'transparent',
      { duration: 180 }
    ),
    transform: [
      {
        scale: withTiming(isFocused ? 1 : 0.94, { duration: 180 }),
      },
    ],
  }));

  const iconColor = isFocused ? Colors.primaryFixed : Colors.onSurfaceVariant;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.iconContainer, animatedContainerStyle]}>
        <IconComponent
          size={20}
          color={iconColor}
          strokeWidth={isFocused ? 2.4 : 1.8}
        />
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? Colors.onSurface : Colors.onSurfaceVariant,
            fontFamily: isFocused ? FontFamily.headingSemiBold : FontFamily.body,
            fontWeight: isFocused ? '600' : '400',
          },
        ]}
      >
        {config.label}
      </Text>
    </TouchableOpacity>
  );
}

type RadialActionType = 'income' | 'expense' | 'transfer';

export function BottomTabBarMinimal({
  activeIndex = 0,
  onTabPress,
  onTabLongPress,
}: BottomTabBarMinimalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Screen horizontal center and button vertical origin
  const screenCenterX = windowWidth / 2;
  const baseBottom = Math.max(insets.bottom, 10) + 30;

  const setPagerScrollEnabled = useFinancialStore((s) => s.setPagerScrollEnabled);
  const setIsWheelMenuOpen = useFinancialStore((s) => s.setIsWheelMenuOpen);

  // Radial menu state
  const [isWheelActive, setIsWheelActive] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<RadialActionType | null>(null);

  const isWheelActiveRef = useRef(false);
  isWheelActiveRef.current = isWheelActive;

  const hoveredOptionRef = useRef<RadialActionType | null>(null);
  hoveredOptionRef.current = hoveredOption;

  const isHoldingRef = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reanimated shared values
  const expandProgress = useSharedValue(0);

  // Close radial menu
  const closeWheel = useCallback(() => {
    setPagerScrollEnabled(true);
    setIsWheelMenuOpen(false);
    expandProgress.value = withTiming(0, { duration: 150 }, (finished) => {
      'worklet';
      if (finished) {
        runOnJS(setIsWheelActive)(false);
        runOnJS(setHoveredOption)(null);
      }
    });
    hoveredOptionRef.current = null;
    isHoldingRef.current = false;
  }, [expandProgress, setPagerScrollEnabled, setIsWheelMenuOpen]);

  // Open radial menu
  const openWheel = useCallback(() => {
    setIsWheelActive(true);
    setIsWheelMenuOpen(true);
    setPagerScrollEnabled(false);
    expandProgress.value = withSpring(1, {
      damping: 14,
      stiffness: 180,
      mass: 0.8,
    });
  }, [expandProgress, setPagerScrollEnabled, setIsWheelMenuOpen]);

  // Handle direct tap navigation from radial options
  const handleSelectAction = useCallback(
    (actionType: RadialActionType) => {
      setPagerScrollEnabled(true);
      setIsWheelMenuOpen(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      closeWheel();
      router.push({
        pathname: '/add-transaction',
        params: { type: actionType },
      } as any);
    },
    [closeWheel, router, setPagerScrollEnabled, setIsWheelMenuOpen]
  );

  // Clear timers and restore scroll on unmount
  useEffect(() => {
    return () => {
      setPagerScrollEnabled(true);
      setIsWheelMenuOpen(false);
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
      }
    };
  }, [setPagerScrollEnabled, setIsWheelMenuOpen]);

  // Determine hovered option from relative displacement (dx, dy) from center button
  const getHoveredOptionFromDelta = useCallback((dx: number, dy: number): RadialActionType | null => {
    const dist = Math.hypot(dx, dy);

    // Deadzone near center button or downward drag
    if (dist < 18 || dy > 30) {
      return null;
    }

    // Angle in degrees from horizontal right: 0° is right, 90° is straight up, 180° is left
    const angleDeg = (Math.atan2(-dy, dx) * 180) / Math.PI;

    if (angleDeg < -15) {
      return null;
    }

    // Left sector: Income
    if (angleDeg >= 115) {
      return 'income';
    }

    // Center-top sector: Expense
    if (angleDeg >= 65 && angleDeg < 115) {
      return 'expense';
    }

    // Right sector: Transfer
    if (angleDeg >= -15 && angleDeg < 65) {
      return 'transfer';
    }

    return null;
  }, []);

  // Determine hovered option from absolute page coordinates (used by overlay PanResponder)
  const getHoveredOptionFromPageCoords = useCallback(
    (pageX: number, pageY: number): RadialActionType | null => {
      const originX = screenCenterX;
      const originY = windowHeight - baseBottom;

      // 1. Direct proximity check to each button center (radius 60px)
      const dIncome = Math.hypot(pageX - (originX - 88), pageY - (originY - 80));
      const dExpense = Math.hypot(pageX - originX, pageY - (originY - 118));
      const dTransfer = Math.hypot(pageX - (originX + 88), pageY - (originY - 80));

      const minDist = Math.min(dIncome, dExpense, dTransfer);
      if (minDist <= 60) {
        if (minDist === dIncome) return 'income';
        if (minDist === dExpense) return 'expense';
        if (minDist === dTransfer) return 'transfer';
      }

      // 2. Angular sector check from origin
      const dx = pageX - originX;
      const dy = pageY - originY;
      return getHoveredOptionFromDelta(dx, dy);
    },
    [screenCenterX, windowHeight, baseBottom, getHoveredOptionFromDelta]
  );

  // 1. PanResponder on Center '+' Button (Continuous hold-and-slide gesture)
  const buttonPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (evt, gestureState) => {
        // Stop all scrolling immediately across the app
        setPagerScrollEnabled(false);
        setIsWheelMenuOpen(true);

        const startX = evt.nativeEvent.pageX ?? gestureState.x0;
        const startY = evt.nativeEvent.pageY ?? gestureState.y0;
        touchStartRef.current = { x: startX, y: startY };

        isHoldingRef.current = false;
        hoveredOptionRef.current = null;
        setHoveredOption(null);

        // Start 200ms hold timer
        holdTimer.current = setTimeout(() => {
          isHoldingRef.current = true;
          openWheel();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 200);
      },

      onPanResponderMove: (evt, gestureState) => {
        const curX = evt.nativeEvent.pageX ?? gestureState.moveX;
        const curY = evt.nativeEvent.pageY ?? gestureState.moveY;
        const dx = curX - touchStartRef.current.x;
        const dy = curY - touchStartRef.current.y;
        const dist = Math.hypot(dx, dy);

        // If user drags early (> 12px) before timer completes, trigger wheel immediately
        if (dist > 12 && holdTimer.current && !isHoldingRef.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
          isHoldingRef.current = true;
          openWheel();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        if (isHoldingRef.current || isWheelActiveRef.current) {
          const nextHovered = getHoveredOptionFromDelta(dx, dy);
          if (nextHovered !== hoveredOptionRef.current) {
            hoveredOptionRef.current = nextHovered;
            setHoveredOption(nextHovered);
            if (nextHovered !== null) {
              Haptics.selectionAsync();
            }
          }
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }

        // If wheel was already active before this press, tapping '+' closes it
        if (isWheelActiveRef.current && !isHoldingRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          closeWheel();
          return;
        }

        // Quick tap detected: duration < 200ms and minimal movement
        if (!isHoldingRef.current) {
          setPagerScrollEnabled(true);
          setIsWheelMenuOpen(false);

          const curX = evt.nativeEvent.pageX ?? gestureState.moveX;
          const curY = evt.nativeEvent.pageY ?? gestureState.moveY;
          const dx = curX - touchStartRef.current.x;
          const dy = curY - touchStartRef.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 15) {
            // Tap action: Open Add Expense screen directly
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: '/add-transaction',
              params: { type: 'expense' },
            } as any);
          }
          return;
        }

        // User was holding / sliding
        const target = hoveredOptionRef.current;
        if (target) {
          // Released over an action: open that screen straight up!
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          closeWheel();
          router.push({
            pathname: '/add-transaction',
            params: { type: target },
          } as any);
        } else {
          // Released not hovering any option
          const curX = evt.nativeEvent.pageX ?? gestureState.moveX;
          const curY = evt.nativeEvent.pageY ?? gestureState.moveY;
          const dx = curX - touchStartRef.current.x;
          const dy = curY - touchStartRef.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 30) {
            // Slid away or downward: cancel
            closeWheel();
          }
          // If dist <= 30, thumb was held and released in place:
          // Keep wheel open so user can slide or tap on the open wheel!
        }
      },

      onPanResponderTerminate: () => {
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }
        closeWheel();
      },
    })
  ).current;

  // 2. PanResponder on Full-Screen Overlay (Enables sliding when the wheel is ALREADY open)
  const overlayPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.pageX;
        const touchY = evt.nativeEvent.pageY;
        const opt = getHoveredOptionFromPageCoords(touchX, touchY);
        hoveredOptionRef.current = opt;
        setHoveredOption(opt);
        if (opt) {
          Haptics.selectionAsync();
        }
      },

      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.pageX;
        const touchY = evt.nativeEvent.pageY;
        const opt = getHoveredOptionFromPageCoords(touchX, touchY);
        if (opt !== hoveredOptionRef.current) {
          hoveredOptionRef.current = opt;
          setHoveredOption(opt);
          if (opt) {
            Haptics.selectionAsync();
          }
        }
      },

      onPanResponderRelease: (evt) => {
        const touchX = evt.nativeEvent.pageX;
        const touchY = evt.nativeEvent.pageY;
        const opt = getHoveredOptionFromPageCoords(touchX, touchY);
        if (opt) {
          // Finger lifted over an action!
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          closeWheel();
          router.push({
            pathname: '/add-transaction',
            params: { type: opt },
          } as any);
        } else {
          // Tapped outside or slid to empty space: dismiss wheel
          closeWheel();
        }
      },

      onPanResponderTerminate: () => {
        closeWheel();
      },
    })
  ).current;

  // Reanimated style animations
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
  }));

  const animatedCenterBtnStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${expandProgress.value * 45}deg` },
      { scale: 1 + expandProgress.value * 0.08 },
    ],
  }));

  const animatedIncomeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -80 * expandProgress.value },
      { scale: expandProgress.value },
    ],
    opacity: expandProgress.value,
  }));

  const animatedExpenseStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -118 * expandProgress.value },
      { scale: expandProgress.value },
    ],
    opacity: expandProgress.value,
  }));

  const animatedTransferStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -80 * expandProgress.value },
      { scale: expandProgress.value },
    ],
    opacity: expandProgress.value,
  }));

  return (
    <View
      style={[
        styles.rootContainer,
        isWheelActive && StyleSheet.absoluteFill,
      ]}
      pointerEvents={isWheelActive ? 'auto' : 'box-none'}
    >
      {/* ── Full Screen Blurred Scrim & Touch Capturer (Active during Wheel) ── */}
      {isWheelActive && (
        <Animated.View
          {...overlayPanResponder.panHandlers}
          style={[StyleSheet.absoluteFill, animatedBackdropStyle]}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 45 : 30}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(247, 246, 240, 0.70)' },
            ]}
          />
        </Animated.View>
      )}

      {/* ── 3 Radial Options: Pixel-Perfect Equal Distances from Screen Edges ── */}
      {isWheelActive && (
        <>
          {/* Option 1: Income (Top-Left) — Exact 88px left of screen center */}
          <Animated.View
            style={[
              styles.wheelItemWrapper,
              {
                left: screenCenterX - 88 - 30,
                bottom: baseBottom - 40,
              },
              animatedIncomeStyle,
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={[
                styles.wheelItemCircle,
                hoveredOption === 'income'
                  ? styles.wheelItemIncomeHovered
                  : styles.wheelItemDefault,
              ]}
              onPress={() => handleSelectAction('income')}
              activeOpacity={0.85}
            >
              <ArrowDownLeft
                size={24}
                color={hoveredOption === 'income' ? '#FFFFFF' : '#10B981'}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.wheelItemLabel,
                hoveredOption === 'income' && {
                  color: '#10B981',
                  fontWeight: '800',
                  transform: [{ scale: 1.1 }],
                },
              ]}
            >
              Income
            </Text>
          </Animated.View>

          {/* Option 2: Expense (Center-Top) — Exact screen center */}
          <Animated.View
            style={[
              styles.wheelItemWrapper,
              {
                left: screenCenterX - 30,
                bottom: baseBottom - 40,
              },
              animatedExpenseStyle,
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={[
                styles.wheelItemCircle,
                hoveredOption === 'expense'
                  ? styles.wheelItemExpenseHovered
                  : styles.wheelItemDefault,
              ]}
              onPress={() => handleSelectAction('expense')}
              activeOpacity={0.85}
            >
              <ArrowUpRight
                size={24}
                color={hoveredOption === 'expense' ? '#FFFFFF' : '#EF4444'}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.wheelItemLabel,
                hoveredOption === 'expense' && {
                  color: '#EF4444',
                  fontWeight: '800',
                  transform: [{ scale: 1.1 }],
                },
              ]}
            >
              Expense
            </Text>
          </Animated.View>

          {/* Option 3: Transfer (Top-Right) — Exact 88px right of screen center */}
          <Animated.View
            style={[
              styles.wheelItemWrapper,
              {
                left: screenCenterX + 88 - 30,
                bottom: baseBottom - 40,
              },
              animatedTransferStyle,
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={[
                styles.wheelItemCircle,
                hoveredOption === 'transfer'
                  ? styles.wheelItemTransferHovered
                  : styles.wheelItemDefault,
              ]}
              onPress={() => handleSelectAction('transfer')}
              activeOpacity={0.85}
            >
              <ArrowLeftRight
                size={24}
                color={hoveredOption === 'transfer' ? '#FFFFFF' : '#3B82F6'}
                strokeWidth={2.4}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.wheelItemLabel,
                hoveredOption === 'transfer' && {
                  color: '#3B82F6',
                  fontWeight: '800',
                  transform: [{ scale: 1.1 }],
                },
              ]}
            >
              Transfer
            </Text>
          </Animated.View>
        </>
      )}

      {/* ── The Bottom Tab Bar Dock ── */}
      <View
        style={[
          styles.dockContainer,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
        pointerEvents="auto"
      >
        <View style={styles.topBorder} />

        <View style={styles.tabsRow}>
          {/* Left Tab 1: Home */}
          <MinimalTabItem
            routeName="index"
            isFocused={activeIndex === 0}
            onPress={() => onTabPress?.(0)}
            onLongPress={() => onTabLongPress?.(0)}
          />

          {/* Left Tab 2: Activity */}
          <MinimalTabItem
            routeName="activity"
            isFocused={activeIndex === 1}
            onPress={() => onTabPress?.(1)}
            onLongPress={() => onTabLongPress?.(1)}
          />

          {/* ─── Center Yellow Add Transaction Button ─── */}
          <Animated.View
            {...buttonPanResponder.panHandlers}
            style={[
              styles.centerAddBtn,
              animatedCenterBtnStyle,
              isWheelActive && styles.centerAddBtnActive,
            ]}
            accessible={true}
            accessibilityLabel="Add Transaction"
            accessibilityRole="button"
          >
            <Plus size={24} color="#1C1B1B" strokeWidth={2.8} />
          </Animated.View>

          {/* Right Tab 3: Accounts */}
          <MinimalTabItem
            routeName="accounts"
            isFocused={activeIndex === 2}
            onPress={() => onTabPress?.(2)}
            onLongPress={() => onTabLongPress?.(2)}
          />

          {/* Right Tab 4: Cards */}
          <MinimalTabItem
            routeName="cards"
            isFocused={activeIndex === 3 || activeIndex === 4}
            onPress={() => onTabPress?.(3)}
            onLongPress={() => (onTabLongPress ? onTabLongPress(4) : onTabPress?.(4))}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 80,
    overflow: 'visible',
  },
  dockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    zIndex: 85,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  topBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.strokeSubtle,
    width: '100%',
  },
  tabsRow: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    overflow: 'visible',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  iconContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.1,
  },
  centerAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFDB2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#FFDB2F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  centerAddBtnActive: {
    backgroundColor: '#FFDB2F',
    borderWidth: 2,
    borderColor: '#1C1B1B',
    ...Platform.select({
      ios: {
        shadowColor: '#FFDB2F',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },

  // Wheel Semi-Circle Items
  wheelItemWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 80,
    zIndex: 1000,
    overflow: 'visible',
  },
  wheelItemCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemDefault: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E7DF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  wheelItemIncomeHovered: {
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#059669',
    transform: [{ scale: 1.25 }],
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  wheelItemExpenseHovered: {
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#DC2626',
    transform: [{ scale: 1.25 }],
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  wheelItemTransferHovered: {
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#2563EB',
    transform: [{ scale: 1.25 }],
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  wheelItemLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: FontFamily.headingSemiBold,
    fontWeight: '600',
    color: '#27272A',
    textAlign: 'center',
  },
});
