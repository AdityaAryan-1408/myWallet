/**
 * MyWallet — Smart Transaction Templates Card ("Quick Actions")
 * 
 * Tier 4, Feature 9: One-tap logging for daily recurring transactions.
 * - Auto-learns from SQLite frequency + recency.
 * - Time-aware: morning (coffee/commute), afternoon (lunch), evening (dinner/groceries).
 * - 1-tap instant transaction creation with haptic confirmation.
 * - Pin/favorite templates to persist at top.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Zap,
  Star,
  Plus,
  CheckCircle2,
  Sun,
  Sunset,
  Moon,
  Clock,
  ChevronRight,
  Coffee,
  Car,
  Utensils,
  ShoppingBag,
} from 'lucide-react-native';

import { Colors, Typography, FontFamily, Spacing, Shapes } from '@/theme';
import { TemplateRepository, TransactionTemplate, getCurrentTimeContext } from '@/repositories';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useFinancialStore } from '@/stores';

interface QuickActionTemplatesCardProps {
  onTransactionLogged?: () => void;
  onCustomAdd?: () => void;
}

export function QuickActionTemplatesCard({
  onTransactionLogged,
  onCustomAdd,
}: QuickActionTemplatesCardProps) {
  const setPagerScrollEnabled = useFinancialStore((s) => s.setPagerScrollEnabled);
  const [templates, setTemplates] = useState<TransactionTemplate[]>(() =>
    TemplateRepository.getSmartTemplates(8)
  );
  const [loggedToast, setLoggedToast] = useState<{ name: string; amount: number } | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    return () => {
      setPagerScrollEnabled(true);
    };
  }, [setPagerScrollEnabled]);

  const timeContext = getCurrentTimeContext();

  const getTimeBadge = () => {
    switch (timeContext) {
      case 'morning':
        return { label: 'Morning Quick Actions', icon: Sun, color: '#FFD93D' };
      case 'afternoon':
        return { label: 'Afternoon Quick Actions', icon: Sunset, color: '#FF8C32' };
      case 'evening':
      default:
        return { label: 'Evening Quick Actions', icon: Moon, color: Colors.secondaryFixed };
    }
  };

  const timeInfo = getTimeBadge();
  const TimeIcon = timeInfo.icon;

  const handleQuickLog = (tpl: TransactionTemplate) => {
    if (isLogging) return;
    setIsLogging(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      TemplateRepository.quickLog(tpl);
      setLoggedToast({ name: tpl.name, amount: tpl.amount });
      onTransactionLogged?.();

      setTimeout(() => {
        setLoggedToast(null);
        setIsLogging(false);
      }, 2500);
    } catch {
      setIsLogging(false);
      Alert.alert('Error', 'Unable to log quick transaction.');
    }
  };

  const handleTogglePin = (tplId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    TemplateRepository.togglePin(tplId);
    setTemplates(TemplateRepository.getSmartTemplates(8));
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: `${Colors.chartreuse}1A` }]}>
            <Zap size={16} color={Colors.chartreuse} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>QUICK ACTIONS</Text>
              <View style={[styles.timeBadge, { backgroundColor: `${timeInfo.color}1A` }]}>
                <TimeIcon size={10} color={timeInfo.color} />
                <Text style={[styles.timeBadgeText, { color: timeInfo.color }]}>
                  {timeContext.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>1-Tap Daily Expense Logging</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={onCustomAdd}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={14} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Success Feedback Toast */}
      {loggedToast && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.successToast}>
          <CheckCircle2 size={15} color={Colors.income} />
          <Text style={styles.toastText}>
            Logged <Text style={styles.boldText}>"{loggedToast.name}"</Text> (₹
            {loggedToast.amount.toLocaleString('en-IN')})
          </Text>
        </Animated.View>
      )}

      {/* Horizontal Templates Scroll — FlatList with pager scroll lock */}
      <View
        onTouchStart={() => setPagerScrollEnabled(false)}
        onTouchEnd={() => setPagerScrollEnabled(true)}
        onTouchCancel={() => setPagerScrollEnabled(true)}
      >
        <FlatList
          horizontal
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
          data={templates}
          keyExtractor={(item) => item.id}
          onTouchStart={() => setPagerScrollEnabled(false)}
          onTouchEnd={() => setPagerScrollEnabled(true)}
          onTouchCancel={() => setPagerScrollEnabled(true)}
          onScrollBeginDrag={() => setPagerScrollEnabled(false)}
          onScrollEndDrag={() => setPagerScrollEnabled(true)}
          onMomentumScrollEnd={() => setPagerScrollEnabled(true)}
          renderItem={({ item: tpl }) => (
            <TouchableOpacity
              style={[
                styles.templateChip,
                tpl.isFavorite && styles.templateChipFavorite,
              ]}
              onPress={() => handleQuickLog(tpl)}
              activeOpacity={0.75}
            >
              <View style={styles.chipTop}>
                <View
                  style={[
                    styles.catIconBox,
                    { backgroundColor: `${tpl.categoryColor}1A` },
                  ]}
                >
                  <CategoryIcon icon={tpl.categoryIcon} color={tpl.categoryColor} size={14} />
                </View>

                <TouchableOpacity
                  onPress={() => handleTogglePin(tpl.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Star
                    size={12}
                    color={tpl.isFavorite ? Colors.chartreuse : Colors.onSurfaceVariant}
                    fill={tpl.isFavorite ? Colors.chartreuse : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.templateName} numberOfLines={1}>
                {tpl.name}
              </Text>

              <View style={styles.chipBottom}>
                <Text style={styles.templateAmount}>
                  ₹{tpl.amount.toLocaleString('en-IN')}
                </Text>
                <View style={styles.quickTapPill}>
                  <Text style={styles.quickTapText}>1-TAP</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: Shapes.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: Spacing.sm + 2,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: Shapes.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontFamily: FontFamily.mono,
    fontSize: 8.5,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.income}1A`,
    borderWidth: 1,
    borderColor: `${Colors.income}40`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Shapes.md,
  },
  toastText: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Colors.onSurface,
  },
  boldText: {
    fontWeight: '700',
  },
  scrollList: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  templateChip: {
    width: 128,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shapes.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.strokeSubtle,
    gap: 6,
  },
  templateChipFavorite: {
    borderColor: `${Colors.chartreuse}4D`,
    backgroundColor: `${Colors.chartreuse}08`,
  },
  chipTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateName: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  chipBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  templateAmount: {
    fontFamily: FontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  quickTapPill: {
    backgroundColor: `${Colors.chartreuse}1A`,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  quickTapText: {
    fontFamily: FontFamily.mono,
    fontSize: 7.5,
    fontWeight: '700',
    color: Colors.chartreuse,
  },
});
