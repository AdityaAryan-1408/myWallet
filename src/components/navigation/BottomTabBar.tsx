/**
 * MyWallet — Custom Bottom Tab Bar
 * 
 * Dark frosted glass navigation bar matching the Zenith Obsidian design:
 * - 80dp height
 * - Frosted dark surface (#0A0C10 at 85% opacity, blur 16px)
 * - Active tab: chartreuse icon + elongated pill highlight
 * - Inactive tab: 40% white opacity
 * - Razor-sharp Lucide vector icons
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  Home,
  Receipt,
  PieChart,
  CreditCard,
  LayoutGrid,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Shapes } from '@/theme';

interface TabConfig {
  label: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: { label: 'Home', icon: Home },
  activity: { label: 'Activity', icon: Receipt },
  budgets: { label: 'Budgets', icon: PieChart },
  cards: { label: 'Cards', icon: CreditCard },
  more: { label: 'More', icon: LayoutGrid },
};

interface RouteItem {
  key: string;
  name: string;
  params?: any;
}

export interface BottomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  insets?: any;
}

interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ routeName, isFocused, onPress, onLongPress }: TabItemProps) {
  const config = TAB_CONFIGS[routeName];
  if (!config) return null;

  const IconComponent = config.icon;

  const animatedPillStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      isFocused ? Colors.chartreuseWash : 'transparent',
      { duration: 180 }
    ),
    transform: [
      {
        scale: withTiming(isFocused ? 1 : 0.92, { duration: 180 }),
      },
    ],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0.4, { duration: 180 }),
    color: isFocused ? Colors.primaryFixed : 'rgba(255, 255, 255, 0.4)',
  }));

  const iconColor = isFocused ? Colors.primaryFixed : 'rgba(255, 255, 255, 0.4)';

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      {/* Elongated pill highlight behind icon */}
      <Animated.View style={[styles.iconPill, animatedPillStyle]}>
        <IconComponent
          size={20}
          color={iconColor}
          strokeWidth={isFocused ? 2.4 : 1.8}
        />
      </Animated.View>

      {/* Tab label */}
      <Animated.Text style={[styles.tabLabel, animatedLabelStyle]}>
        {config.label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Filter out any hidden routes like 'explore'
  const visibleRoutes = state.routes.filter(
    (route: RouteItem) => TAB_CONFIGS[route.name] !== undefined
  );

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {/* Hairline top border */}
      <View style={styles.topBorder} />

      <View style={styles.tabsRow}>
        {visibleRoutes.map((route: RouteItem) => {
          const isFocused = state.routes[state.index]?.name === route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 12, 16, 0.94)',
    borderTopWidth: 0,
  },
  topBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabsRow: {
    flexDirection: 'row',
    height: 62,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconPill: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: Shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    ...Typography.bodySm,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
});
