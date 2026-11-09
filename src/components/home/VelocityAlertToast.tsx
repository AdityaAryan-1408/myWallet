/**
 * MyWallet — Spending Velocity Alert Popup Toast (Feature B2)
 * 
 * Elegant, non-intrusive floating alert card rendered on the Dashboard:
 * - Alerts when spending velocity surges (window burst, weekend surge, budget exhaustion)
 * - Compact, sleek HUD design that does not obstruct the screen
 * - Fully dismissible with animated exit and haptic response
 * - Zero pulse on hero card to strictly preserve Feature A3 dynamic health color
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Flame, Zap, AlertTriangle, X } from 'lucide-react-native';
import { VelocityAlert } from '@/services/velocityAlertService';
import { Colors, FontFamily, Typography } from '@/theme';
import { useFinancialStore } from '@/stores';

interface VelocityAlertToastProps {
  alert: VelocityAlert | null;
  onDismiss: (id: string) => void;
}

export function VelocityAlertToast({ alert, onDismiss }: VelocityAlertToastProps) {
  const themeMode = useFinancialStore((s) => s.themeMode);
  const isLight = themeMode === 'light' || themeMode === 'mono_light';

  if (!alert) return null;

  const handleDismiss = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onDismiss(alert.id);
  };

  const getBadgeMeta = () => {
    switch (alert.type) {
      case 'weekend_surge':
        return {
          label: 'WEEKEND SURGE',
          icon: Flame,
          color: '#F97316',
          bg: isLight ? '#FFF7ED' : 'rgba(249, 115, 22, 0.12)',
          border: isLight ? 'rgba(249, 115, 22, 0.4)' : 'rgba(249, 115, 22, 0.35)',
        };
      case 'budget_exhaustion':
        return {
          label: 'BUDGET PACE WARNING',
          icon: AlertTriangle,
          color: '#EAB308',
          bg: isLight ? '#FEFCE8' : 'rgba(234, 179, 8, 0.12)',
          border: isLight ? 'rgba(234, 179, 8, 0.4)' : 'rgba(234, 179, 8, 0.35)',
        };
      case 'window_burst':
      default:
        return {
          label: 'SPENDING VELOCITY ALERT',
          icon: Zap,
          color: '#F59E0B',
          bg: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.12)',
          border: isLight ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.35)',
        };
    }
  };

  const meta = getBadgeMeta();
  const IconComponent = meta.icon;

  return (
    <Animated.View
      entering={FadeInDown.duration(350).springify().damping(18)}
      exiting={FadeOutUp.duration(220)}
      layout={Layout.springify()}
      style={[
        styles.container,
        {
          backgroundColor: isLight ? '#FFFFFF' : '#171922',
          borderColor: meta.border,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Glowing Icon Container */}
        <View style={[styles.iconBox, { backgroundColor: meta.bg, borderColor: meta.border }]}>
          <IconComponent size={16} color={meta.color} />
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <View style={styles.eyebrowRow}>
            <View style={[styles.livePulseDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.eyebrowText, { color: meta.color }]}>{meta.label}</Text>
            {alert.multiplier && (
              <View style={[styles.multiplierPill, { backgroundColor: meta.bg }]}>
                <Text style={[styles.multiplierText, { color: meta.color }]}>
                  {alert.multiplier}× PACE
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.messageText,
              { color: isLight ? '#1F2937' : '#F1F5F9' },
            ]}
            numberOfLines={3}
          >
            {alert.message}
          </Text>
        </View>

        {/* Dismiss Button */}
        <TouchableOpacity
          style={[styles.dismissBtn, { backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)' }]}
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <X size={14} color={isLight ? '#64748B' : '#94A3B8'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  eyebrowText: {
    fontSize: 10,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  multiplierPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 6,
  },
  multiplierText: {
    fontSize: 9,
    fontFamily: FontFamily.mono,
    fontWeight: '700',
  },
  messageText: {
    fontSize: 12.5,
    fontFamily: FontFamily.body,
    lineHeight: 17,
  },
  dismissBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
