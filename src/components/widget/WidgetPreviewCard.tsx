/**
 * MyWallet — Android Home Screen Widget Preview & Simulator (Phase 18)
 * 
 * Provides:
 * - 1:1 visual fidelity representation of the native 4x2 / 3x2 Android widget
 * - Live real-time connection to availableToSpend and dailySpendLimit
 * - Interactive (+) button testing the deep-link into Add Expense modal
 * - Setup instructions for placing the widget on the Android launcher
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Smartphone,
  Plus,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react-native';

import { useFinancialStore } from '@/stores';
import { formatINR } from '@/domain/financialCalculations';
import { Colors, Typography, Spacing, Shapes, FontFamily, Elevation } from '@/theme';

export function WidgetPreviewCard() {
  const router = useRouter();
  const { availableToSpend, dailySpendLimit, currency } = useFinancialStore();

  const isHealthy = availableToSpend > 0 && dailySpendLimit >= 300;
  const isCaution = availableToSpend > 0 && dailySpendLimit < 300;
  const statusColor = isHealthy ? Colors.income : isCaution ? Colors.warning : Colors.expense;
  const statusLabel = isHealthy ? 'HEALTHY' : isCaution ? 'CAUTION' : 'EXCEEDED';

  const handleLaunchAddExpense = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/add-transaction',
      params: { type: 'expense' },
    });
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.headerLeft}>
          <Smartphone size={16} color={Colors.chartreuse} />
          <Text style={styles.sectionTitle}>GLANCEABLE ANDROID WIDGET</Text>
        </View>
        <View style={styles.liveSyncBadge}>
          <View style={[styles.pulseDot, { backgroundColor: statusColor }]} />
          <Text style={styles.liveSyncText}>AUTO-SYNC ACTIVE</Text>
        </View>
      </View>

      <Text style={styles.descriptionText}>
        Mid-sized (4x2 / 3x2) dynamic widget. Shows Safe-to-Spend balance in real time without needing to open the app, with 1-tap instant expense entry.
      </Text>

      {/* ─── 1:1 Zenith Obsidian Widget Mockup Frame ─── */}
      <View style={styles.widgetFrameWrapper}>
        <View style={styles.widgetCard}>
          {/* Left Column: Info & Metrics */}
          <View style={styles.widgetInfoCol}>
            {/* Top Eyebrow */}
            <View style={styles.eyebrowRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.brandText}>MYWALLET</Text>
              <Text style={styles.separatorText}>•</Text>
              <Text style={styles.eyebrowText}>SAFE TO SPEND</Text>
            </View>

            {/* Big Amount */}
            <Text style={styles.balanceText} numberOfLines={1}>
              {formatINR(availableToSpend)}
            </Text>

            {/* Sub-label: Daily Pace */}
            <Text style={styles.dailyPaceText}>
              {formatINR(dailySpendLimit)}/day safe pace
            </Text>
          </View>

          {/* Right Column: 1-Tap (+) Action Button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleLaunchAddExpense}
            activeOpacity={0.8}
          >
            <Plus size={22} color="#000" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── How to Place on Android Launcher ─── */}
      <View style={styles.footerInfoBox}>
        <Sparkles size={14} color={Colors.chartreuse} />
        <Text style={styles.footerInfoText}>
          {Platform.OS === 'android'
            ? 'In Standalone APK: Long-press home screen > Widgets > MyWallet > Drag to place. In Expo Go: Tap (+) above to test instant entry!'
            : 'Configured natively via AppWidgetProvider with zero-reload ACTION_APPWIDGET_UPDATE broadcasts.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurface,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Shapes.pill,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveSyncText: {
    ...Typography.labelCaps,
    color: Colors.chartreuse,
    fontSize: 8.5,
    fontWeight: '800',
  },
  descriptionText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 17,
  },

  // 1:1 Widget Frame
  widgetFrameWrapper: {
    paddingVertical: 4,
  },
  widgetCard: {
    backgroundColor: '#101319',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#202531',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.medium,
  },
  widgetInfoCol: {
    flex: 1,
    gap: 2,
    marginRight: 10,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  brandText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9,
    fontWeight: '800',
    color: '#C8F322',
    letterSpacing: 0.8,
  },
  separatorText: {
    color: '#4B5563',
    fontSize: 9,
  },
  eyebrowText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 9,
    fontWeight: '700',
    color: '#9BA3AF',
    letterSpacing: 0.6,
  },
  balanceText: {
    fontFamily: FontFamily.numericBold,
    fontSize: 26,
    color: '#FFFFFF',
    paddingVertical: 2,
  },
  dailyPaceText: {
    fontFamily: FontFamily.numeric,
    fontSize: 11,
    color: '#8B949E',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C8F322',
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.low,
  },

  // Footer Info Box
  footerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
    borderRadius: Shapes.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  footerInfoText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
});
