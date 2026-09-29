/**
 * MyWallet — Dashboard Card Picker Modal (Feature 15: Modular Dashboard)
 * 
 * Bottom sheet menu allowing users to toggle any of the 17 available cards
 * on or off, view descriptions, and reset to defaults.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Switch,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  RotateCcw,
  Check,
  TrendingUp,
  Zap,
  AlertTriangle,
  PieChart,
  FileText,
  CreditCard,
  Clock,
  ShieldCheck,
  Flame,
  Activity,
  Calendar,
  Sun,
  ArrowUpDown,
  Store,
  Target,
  Sparkles,
  Sliders,
  Pin,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Shapes, Elevation, FontFamily } from '@/theme';
import { useDashboardStore } from '@/stores';
import { DASHBOARD_CARD_REGISTRY, DashboardCardDefinition } from './DashboardCardRegistry';

interface DashboardCardPickerProps {
  visible: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  TrendingUp,
  Zap,
  AlertTriangle,
  PieChart,
  FileText,
  CreditCard,
  Clock,
  ShieldCheck,
  Flame,
  Activity,
  Calendar,
  Sun,
  ArrowUpDown,
  Store,
  Target,
  Sparkles,
};

type CategoryFilter = 'all' | 'core' | 'insights' | 'habits' | 'tools';

export function DashboardCardPicker({ visible, onClose }: DashboardCardPickerProps) {
  const insets = useSafeAreaInsets();
  const cards = useDashboardStore((s) => s.cards);
  const toggleCardVisibility = useDashboardStore((s) => s.toggleCardVisibility);
  const toggleCardPinned = useDashboardStore((s) => s.toggleCardPinned);
  const resetToDefault = useDashboardStore((s) => s.resetToDefault);

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const visibleCount = cards.filter((c) => c.visible).length;

  const handleToggle = (cardId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleCardVisibility(cardId);
  };

  const handlePin = (cardId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleCardPinned(cardId);
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetToDefault();
  };

  const filteredCards = DASHBOARD_CARD_REGISTRY.filter((def) => {
    if (activeCategory === 'all') return true;
    return def.category === activeCategory;
  });

  const getCardConfig = (cardId: string) => {
    return cards.find((c) => c.cardId === cardId);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet Content */}
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Grab Handle */}
          <View style={styles.grabHandleBox}>
            <View style={styles.grabHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Customize Dashboard</Text>
              <Text style={styles.subtitle}>
                {visibleCount} of {DASHBOARD_CARD_REGISTRY.length} cards active
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Category Filter Pills */}
          <View style={styles.filterRow}>
            {(['all', 'core', 'insights', 'habits', 'tools'] as CategoryFilter[]).map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveCategory(cat);
                  }}
                  style={[styles.filterPill, isSelected && styles.filterPillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cards List */}
          <ScrollView
            style={styles.cardList}
            contentContainerStyle={styles.cardListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredCards.map((def) => {
              const config = getCardConfig(def.id);
              const isCardVisible = config?.visible ?? false;
              const isPinned = config?.pinned ?? false;
              const IconComp = ICON_MAP[def.iconName] || Sliders;

              return (
                <View
                  key={def.id}
                  style={[
                    styles.cardRow,
                    isCardVisible && styles.cardRowActive,
                  ]}
                >
                  {/* Icon */}
                  <View
                    style={[
                      styles.iconCircle,
                      isCardVisible && styles.iconCircleActive,
                    ]}
                  >
                    <IconComp
                      size={18}
                      color={isCardVisible ? Colors.chartreuse : Colors.onSurfaceVariant}
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardName}>{def.displayName}</Text>
                      {isPinned && isCardVisible && (
                        <View style={styles.pinnedTag}>
                          <Pin size={10} color={Colors.chartreuse} fill={Colors.chartreuse} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {def.description}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.rowActions}>
                    {isCardVisible && (
                      <TouchableOpacity
                        onPress={() => handlePin(def.id)}
                        style={[styles.pinToggleBtn, isPinned && styles.pinToggleBtnActive]}
                        activeOpacity={0.7}
                      >
                        <Pin
                          size={13}
                          color={isPinned ? Colors.chartreuse : Colors.onSurfaceVariant}
                          fill={isPinned ? Colors.chartreuse : 'none'}
                        />
                      </TouchableOpacity>
                    )}

                    <Switch
                      value={isCardVisible}
                      onValueChange={() => handleToggle(def.id)}
                      trackColor={{
                        false: Colors.surfaceContainerHigh,
                        true: Colors.chartreuse,
                      }}
                      thumbColor={isCardVisible ? Colors.surface : Colors.onSurfaceVariant}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleReset}
              style={styles.resetBtn}
              activeOpacity={0.7}
            >
              <RotateCcw size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.resetText}>Reset to Default</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={styles.doneBtn}
              activeOpacity={0.8}
            >
              <Check size={16} color={Colors.surface} />
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Shapes.xxl,
    borderTopRightRadius: Shapes.xxl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    maxHeight: '85%',
    width: '100%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.strokeMedium,
  },
  grabHandleBox: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.strokeMedium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  filterPillActive: {
    backgroundColor: 'rgba(212, 255, 50, 0.15)',
    borderColor: Colors.chartreuse,
  },
  filterText: {
    ...Typography.labelCaps,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: Colors.chartreuse,
    fontWeight: '700',
  },
  cardList: {
    maxHeight: 380,
  },
  cardListContent: {
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.sm,
  },
  cardRowActive: {
    borderColor: 'rgba(212, 255, 50, 0.25)',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(212, 255, 50, 0.12)',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardName: {
    ...Typography.bodyMdMedium,
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 13,
  },
  pinnedTag: {
    padding: 2,
  },
  cardDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  pinToggleBtnActive: {
    borderColor: Colors.chartreuse,
    backgroundColor: 'rgba(212, 255, 50, 0.15)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.strokeMedium,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resetText: {
    ...Typography.bodySmMedium,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.chartreuse,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Shapes.pill,
  },
  doneText: {
    ...Typography.bodyMdMedium,
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
});
