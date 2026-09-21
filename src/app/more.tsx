/**
 * MyWallet — More Screen (Grid Layout)
 * 
 * Phase 1: Static placeholder matching user specification:
 * "More can be a grid, use suitable icons. Ability to export and import data
 * even upload to drive in case I need to change my phone."
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Wallet,
  PiggyBank,
  Users,
  Layers,
  TrendingUp,
  Database,
  ShieldCheck,
  Settings,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Colors, Typography, Spacing, Shapes, Elevation } from '@/theme';

interface GridItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  accentColor: string;
  badge?: string;
}

const GRID_ITEMS: GridItem[] = [
  {
    id: 'accounts',
    title: 'Accounts & Cash',
    description: 'Bank balances & cash',
    icon: Wallet,
    accentColor: Colors.primaryFixed,
    badge: '3 Active',
  },
  {
    id: 'reservations',
    title: 'Reserved Money',
    description: 'Target funds & goals',
    icon: PiggyBank,
    accentColor: Colors.secondaryFixed,
    badge: '₹4,500',
  },
  {
    id: 'debts',
    title: 'People & Debts',
    description: 'Who owes whom',
    icon: Users,
    accentColor: Colors.tertiaryFixedDim,
    badge: '2 Pending',
  },
  {
    id: 'categories',
    title: 'Categories',
    description: 'Manage tags & icons',
    icon: Layers,
    accentColor: '#FFD93D',
  },
  {
    id: 'analytics',
    title: 'Analytics & Trends',
    description: 'Visual insights',
    icon: TrendingUp,
    accentColor: Colors.income,
  },
  {
    id: 'backup',
    title: 'Backup & Cloud',
    description: 'Export & Google Drive',
    icon: Database,
    accentColor: Colors.transfer,
    badge: 'Offline',
  },
  {
    id: 'security',
    title: 'Security & Lock',
    description: 'Biometrics & App PIN',
    icon: ShieldCheck,
    accentColor: Colors.primaryFixed,
  },
  {
    id: 'settings',
    title: 'Preferences',
    description: 'Currency, cycle reset',
    icon: Settings,
    accentColor: Colors.onSurfaceVariant,
  },
];

export default function MoreScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="MORE FEATURES" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline & Sovereignty Status Banner */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.statusBanner}
        >
          <View style={styles.statusIconBox}>
            <ShieldCheck size={20} color={Colors.primaryFixed} />
          </View>
          <View style={styles.statusContent}>
            <View style={styles.statusRow}>
              <Text style={styles.statusTitle}>100% OFFLINE & PRIVATE</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LOCAL DB</Text>
              </View>
            </View>
            <Text style={styles.statusSub}>
              Zero tracking, zero cloud telemetry. Your financial ledger stays strictly on this device.
            </Text>
          </View>
        </Animated.View>

        {/* Grid Title */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.sectionHeader}
        >
          <Text style={styles.sectionTitle}>CAPABILITIES</Text>
          <Text style={styles.sectionSub}>8 MODULES</Text>
        </Animated.View>

        {/* 2-Column Grid */}
        <View style={styles.gridContainer}>
          {GRID_ITEMS.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.duration(500).delay(250 + idx * 50)}
                style={styles.gridCardWrapper}
              >
                <TouchableOpacity style={styles.gridCard} activeOpacity={0.7}>
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: `${item.accentColor}1A` },
                      ]}
                    >
                      <IconComponent size={20} color={item.accentColor} />
                    </View>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardBottom}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* App Info Footer */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(700)}
          style={styles.footerInfo}
        >
          <Info size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.footerText}>
            MyWallet v1.0.0 • Zenith Obsidian Financial Engine
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    paddingBottom: 110,
    gap: Spacing.cardGap,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    ...Elevation.low,
  },
  statusIconBox: {
    width: 36,
    height: 36,
    borderRadius: Shapes.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statusContent: {
    flex: 1,
    gap: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitle: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    fontWeight: '700',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(200, 243, 34, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primaryFixed,
  },
  liveText: {
    ...Typography.labelCaps,
    color: Colors.primaryFixed,
    fontSize: 9,
  },
  statusSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  sectionSub: {
    ...Typography.labelCaps,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    opacity: 0.6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  gridCardWrapper: {
    width: '50%',
    padding: Spacing.xs,
  },
  gridCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shapes.xl,
    padding: Spacing.cardPadding,
    borderWidth: 1,
    borderColor: Colors.strokeMedium,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Shapes.pill,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  badgeText: {
    ...Typography.labelCaps,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  cardBottom: {
    marginTop: Spacing.md,
    gap: 2,
  },
  cardTitle: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  cardDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.lg,
  },
  footerText: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    opacity: 0.7,
  },
});
