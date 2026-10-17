/**
 * MyWallet — Animated "Money Flow" Transaction Confirmation Modal (A1)
 *
 * Cinematic micro-animation when a transaction is saved:
 * - 14 luminous money particles tracing an upward parabolic arc from Source to Destination
 * - Radial evaporation sparkle burst into category icon for expenses
 * - Dynamic 60/120 FPS Reanimated worklets with isolated particle child components
 * - Strictly follows React & Reanimated hook rules with zero conditional hooks
 * - Tap anywhere to skip / dismiss immediately (~1150ms auto-close)
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  CreditCard,
  Building,
  Wallet,
  CheckCircle2,
} from 'lucide-react-native';

import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { TransactionType } from '@/db/schema';
import { Colors } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Arc geometry relative to inner animation canvas
const CANVAS_WIDTH = Math.min(330, SCREEN_WIDTH - 48);
const CANVAS_HEIGHT = 160;

const START_X = 46;
const START_Y = 105;
const END_X = CANVAS_WIDTH - 46;
const END_Y = 105;
const CTRL_X = CANVAS_WIDTH / 2;
const CTRL_Y = 22; // Upward parabolic arc

// 14 particle definitions with staggered delay, speed, and size
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  delay: i * 24,
  duration: 460 + (i % 3) * 35,
  size: 4 + (i % 4) * 1.5,
  colorOffset: i % 3,
}));

// 8 radial evaporation spark seeds for category absorption
const SPARKLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * Math.PI * 2) / 8 + 0.2;
  const distance = 24 + (i % 3) * 8;
  return {
    id: i,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    size: 3 + (i % 2) * 1.5,
  };
});

// ─── Single Flow Particle Component (Rules of Hooks Compliant) ─────────────────

interface FlowParticleProps {
  spec: (typeof PARTICLES)[0];
  color: string;
  active: boolean;
}

function FlowParticle({ spec, color, active }: FlowParticleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(
      spec.delay,
      withTiming(1, {
        duration: spec.duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
  }, [active, spec]);

  const animStyle = useAnimatedStyle(() => {
    'worklet';
    const t = progress.value;
    const oneMinusT = 1 - t;
    const x =
      oneMinusT * oneMinusT * START_X +
      2 * oneMinusT * t * CTRL_X +
      t * t * END_X;
    const y =
      oneMinusT * oneMinusT * START_Y +
      2 * oneMinusT * t * CTRL_Y +
      t * t * END_Y;

    const opacity =
      t < 0.08
        ? t * 12.5
        : t > 0.94
        ? Math.max(0, (1 - t) * 16)
        : 1;

    const scale = 0.8 + Math.sin(t * Math.PI) * 0.45;

    return {
      transform: [
        { translateX: x - spec.size / 2 },
        { translateY: y - spec.size / 2 },
        { scale },
      ],
      opacity: active ? opacity : 0,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
        animStyle,
      ]}
    />
  );
}

// ─── Single Evaporation Spark Component ────────────────────────────────────────

interface EvaporationSparkProps {
  spark: (typeof SPARKLES)[0];
  color: string;
  active: boolean;
}

function EvaporationSpark({ spark, color, active }: EvaporationSparkProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(
      480, // Triggers as particles arrive at category
      withTiming(1, {
        duration: 360,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [active]);

  const sparkAnimStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const x = END_X + spark.dx * p - spark.size / 2;
    const y = END_Y + spark.dy * p - spark.size / 2;
    const opacity = p > 0.05 ? Math.max(0, 1 - p) : 0;
    const scale = p > 0.1 ? 1 - p * 0.4 : p * 10;

    return {
      transform: [{ translateX: x }, { translateY: y }, { scale }],
      opacity: active ? opacity : 0,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: spark.size,
          height: spark.size,
          borderRadius: spark.size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
        sparkAnimStyle,
      ]}
    />
  );
}

// ─── Main Modal Component ──────────────────────────────────────────────────────

interface MoneyFlowConfirmationModalProps {
  visible: boolean;
  type: TransactionType;
  amount: number;
  currency?: string;
  sourceName: string;
  sourceType?: 'account' | 'credit_card';
  destName?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  note?: string;
  onComplete: () => void;
}

export function MoneyFlowConfirmationModal({
  visible,
  type,
  amount,
  currency = '₹',
  sourceName,
  sourceType = 'account',
  destName,
  categoryName = 'Expense',
  categoryIcon = 'Utensils',
  categoryColor = Colors.primaryFixed,
  note,
  onComplete,
}: MoneyFlowConfirmationModalProps) {
  // Modal container fade & scale
  const modalOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);

  // Destination node ripple & pulse
  const destScale = useSharedValue(1);
  const destRippleScale = useSharedValue(1);
  const destRippleOpacity = useSharedValue(0);

  // Checkmark pop-in
  const checkmarkScale = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);

  const triggerHaptic = (style: 'medium' | 'success') => {
    if (Platform.OS !== 'web') {
      try {
        if (style === 'medium') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {}
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  useEffect(() => {
    if (!visible) {
      modalOpacity.value = 0;
      cardScale.value = 0.9;
      destScale.value = 1;
      destRippleScale.value = 1;
      destRippleOpacity.value = 0;
      checkmarkScale.value = 0;
      checkmarkOpacity.value = 0;
      return;
    }

    // 1. Entrance animation (0ms)
    triggerHaptic('medium');
    modalOpacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
    cardScale.value = withSpring(1, { damping: 16, stiffness: 180 });

    // 2. Destination absorption / ripple (~480ms)
    const arrivalTime = 480;
    destScale.value = withDelay(
      arrivalTime,
      withSequence(
        withSpring(1.28, { damping: 10, stiffness: 220 }),
        withSpring(1, { damping: 14, stiffness: 160 })
      )
    );

    destRippleScale.value = withDelay(
      arrivalTime,
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.9, { duration: 340, easing: Easing.out(Easing.quad) })
      )
    );
    destRippleOpacity.value = withDelay(
      arrivalTime,
      withSequence(
        withTiming(0.85, { duration: 50 }),
        withTiming(0, { duration: 290, easing: Easing.out(Easing.quad) })
      )
    );

    // 3. Pop in checkmark badge and success haptic (~540ms)
    checkmarkOpacity.value = withDelay(
      arrivalTime + 60,
      withTiming(1, { duration: 160 })
    );
    checkmarkScale.value = withDelay(
      arrivalTime + 60,
      withSequence(
        withSpring(1.15, { damping: 12, stiffness: 240 }),
        withSpring(1, { damping: 16, stiffness: 180 })
      )
    );

    const timerHaptic = setTimeout(() => {
      triggerHaptic('success');
    }, arrivalTime + 60);

    // 4. Smooth auto-exit at 1150ms
    const timerDismiss = setTimeout(() => {
      modalOpacity.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(handleFinish)();
        }
      });
    }, 1150);

    return () => {
      clearTimeout(timerHaptic);
      clearTimeout(timerDismiss);
    };
  }, [visible]);

  // Color theme selection based on transaction type
  const themeAccent =
    type === 'expense'
      ? Colors.expense
      : type === 'income'
      ? Colors.income
      : Colors.secondary;

  const particleColors =
    type === 'expense'
      ? ['#FF5252', '#FF7A00', '#C8F322']
      : type === 'income'
      ? ['#00E676', '#10B981', '#00F0FF']
      : ['#00F0FF', '#A855F7', '#C8F322'];

  // Animated styles for top-level nodes
  const animatedModalOverlay = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const animatedCard = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const animatedDestNode = useAnimatedStyle(() => ({
    transform: [{ scale: destScale.value }],
  }));

  const animatedDestRipple = useAnimatedStyle(() => ({
    transform: [{ scale: destRippleScale.value }],
    opacity: destRippleOpacity.value,
  }));

  const animatedCheckmark = useAnimatedStyle(() => ({
    opacity: checkmarkOpacity.value,
    transform: [{ scale: checkmarkScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleFinish}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={handleFinish}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 45 : 30}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        <Animated.View style={[styles.centerContainer, animatedModalOverlay]}>
          <Animated.View style={[styles.dialogCard, animatedCard]}>
            {/* ─── Top Amount & Note ─── */}
            <View style={styles.amountHeader}>
              <Text
                style={[
                  styles.amountText,
                  {
                    color:
                      type === 'expense'
                        ? Colors.expense
                        : type === 'income'
                        ? Colors.income
                        : Colors.secondary,
                  },
                ]}
              >
                {type === 'expense' ? '−' : type === 'income' ? '+' : ''}
                {currency}
                {amount.toLocaleString('en-IN')}
              </Text>

              {note && note.trim().length > 0 && (
                <Text style={styles.noteText} numberOfLines={1}>
                  {note.trim()}
                </Text>
              )}
            </View>

            {/* ─── Kinetic Money Flow Canvas ─── */}
            <View style={[styles.canvas, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }]}>
              {/* SVG Glowing Arc Trajectory */}
              <Svg
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={StyleSheet.absoluteFill}
              >
                <Path
                  d={`M ${START_X} ${START_Y} Q ${CTRL_X} ${CTRL_Y} ${END_X} ${END_Y}`}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  fill="none"
                />
              </Svg>

              {/* 14 Flowing Money Particles */}
              {PARTICLES.map((spec) => (
                <FlowParticle
                  key={`flow_${spec.id}`}
                  spec={spec}
                  color={particleColors[spec.colorOffset]}
                  active={visible}
                />
              ))}

              {/* Radial Evaporation Sparkles around Destination */}
              {SPARKLES.map((spark) => (
                <EvaporationSpark
                  key={`spark_${spark.id}`}
                  spark={spark}
                  color={type === 'expense' ? '#C8F322' : '#00E676'}
                  active={visible}
                />
              ))}

              {/* ─── Source Node (Left) ─── */}
              <View style={[styles.nodeWrapper, { left: START_X - 28, top: START_Y - 28 }]}>
                <View style={styles.sourceCircle}>
                  {sourceType === 'credit_card' ? (
                    <CreditCard size={18} color="#C8F322" strokeWidth={2.2} />
                  ) : (
                    <Building size={18} color="#C8F322" strokeWidth={2.2} />
                  )}
                </View>
                <Text style={styles.nodeLabel} numberOfLines={1}>
                  {sourceName || 'Account'}
                </Text>
              </View>

              {/* ─── Destination Node (Right) ─── */}
              <View style={[styles.nodeWrapper, { left: END_X - 28, top: END_Y - 28 }]}>
                {/* Absorbing Ripple Ring */}
                <Animated.View
                  style={[
                    styles.rippleRing,
                    { borderColor: type === 'expense' ? categoryColor : themeAccent },
                    animatedDestRipple,
                  ]}
                />

                <Animated.View
                  style={[
                    styles.destCircle,
                    {
                      backgroundColor: 'rgba(25, 28, 34, 0.95)',
                      borderColor:
                        type === 'expense' ? categoryColor : themeAccent,
                    },
                    animatedDestNode,
                  ]}
                >
                  {type === 'expense' ? (
                    <CategoryIcon
                      name={categoryIcon}
                      size={20}
                      color={categoryColor}
                    />
                  ) : type === 'transfer' ? (
                    <Wallet size={18} color="#00F0FF" strokeWidth={2.2} />
                  ) : (
                    <Building size={18} color="#00E676" strokeWidth={2.2} />
                  )}
                </Animated.View>

                <Text style={styles.nodeLabel} numberOfLines={1}>
                  {type === 'expense'
                    ? categoryName
                    : type === 'transfer'
                    ? destName || 'Destination'
                    : sourceName}
                </Text>
              </View>
            </View>

            {/* ─── Success Confirmation Badge ─── */}
            <Animated.View style={[styles.confirmationBadge, animatedCheckmark]}>
              <CheckCircle2 size={16} color="#C8F322" strokeWidth={2.4} />
              <Text style={styles.confirmationText}>
                {type === 'expense'
                  ? `Logged to ${categoryName}`
                  : type === 'transfer'
                  ? `Transferred to ${destName || 'Account'}`
                  : `Credited to ${sourceName}`}
              </Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 12, 16, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#191C22',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
    }),
  },
  amountHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  amountText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  noteText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#A8AF90',
    marginTop: 4,
    maxWidth: 240,
    textAlign: 'center',
  },
  canvas: {
    position: 'relative',
    marginVertical: 4,
  },
  nodeWrapper: {
    position: 'absolute',
    width: 56,
    alignItems: 'center',
  },
  sourceCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#101319',
    borderWidth: 1.5,
    borderColor: 'rgba(200, 243, 34, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C8F322',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  destCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C8F322',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  rippleRing: {
    position: 'absolute',
    top: 0,
    left: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  nodeLabel: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 10.5,
    color: '#E1E2EB',
    marginTop: 8,
    maxWidth: 68,
    textAlign: 'center',
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 2,
  },
  confirmationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(200, 243, 34, 0.3)',
    marginTop: 14,
  },
  confirmationText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    color: '#C8F322',
  },
});
