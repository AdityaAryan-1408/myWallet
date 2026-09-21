/**
 * MyWallet — Main Screen with Instagram-Style Interactive Tab Pager
 * 
 * Delivers continuous 1:1 finger tracking between all 5 main tabs:
 * - Home (0), Activity (1), Budgets (2), Cards (3), More (4)
 * - Native momentum physics snapping
 * - Midpoint-synchronized frosted glass bottom tab indicator
 * - Floating Action Button for modal transaction entry
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { FAB } from '@/components/navigation/FAB';
import { Colors } from '@/theme';
import {
  HomeScreen,
  ActivityScreen,
  BudgetsScreen,
  CardsScreen,
  MoreScreen,
} from '@/screens';

export default function MainTabsPagerScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState(0);
  const activeTabRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Jump to specific tab if deep linked or query parameter provided
  useEffect(() => {
    if (tab !== undefined) {
      const parsed = parseInt(tab, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 4) {
        activeTabRef.current = parsed;
        setActiveTab(parsed);
        scrollViewRef.current?.scrollTo({
          x: parsed * windowWidth,
          animated: false,
        });
      }
    }
  }, [tab, windowWidth]);

  // Keep scroll position aligned on dimension or orientation changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: activeTabRef.current * windowWidth,
      animated: false,
    });
  }, [windowWidth]);

  // Handle tab press from bottom bar or internal screen shortcuts
  const handleTabPress = useCallback(
    (targetIndex: number) => {
      if (targetIndex === activeTabRef.current) return;
      isProgrammaticScrollRef.current = true;
      activeTabRef.current = targetIndex;
      setActiveTab(targetIndex);

      scrollViewRef.current?.scrollTo({
        x: targetIndex * windowWidth,
        animated: true,
      });

      // Release programmatic flag after native animation completes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 350);
    },
    [windowWidth]
  );

  // 1:1 real-time finger tracking: update activeTab when crossing 50% midpoint
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammaticScrollRef.current) return;
      const x = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(x / windowWidth);
      if (newIndex >= 0 && newIndex <= 4 && newIndex !== activeTabRef.current) {
        activeTabRef.current = newIndex;
        setActiveTab(newIndex);
      }
    },
    [windowWidth]
  );

  // Guarantee synchronization when native momentum scroll stops
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isProgrammaticScrollRef.current = false;
      const x = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(x / windowWidth);
      if (newIndex >= 0 && newIndex <= 4 && newIndex !== activeTabRef.current) {
        activeTabRef.current = newIndex;
        setActiveTab(newIndex);
      }
    },
    [windowWidth]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        directionalLockEnabled={true}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.pager}
        contentContainerStyle={{ width: windowWidth * 5 }}
      >
        <View style={{ width: windowWidth, flex: 1 }}>
          <HomeScreen onNavigateTab={handleTabPress} />
        </View>
        <View style={{ width: windowWidth, flex: 1 }}>
          <ActivityScreen />
        </View>
        <View style={{ width: windowWidth, flex: 1 }}>
          <BudgetsScreen />
        </View>
        <View style={{ width: windowWidth, flex: 1 }}>
          <CardsScreen />
        </View>
        <View style={{ width: windowWidth, flex: 1 }}>
          <MoreScreen />
        </View>
      </ScrollView>

      {/* Synchronized Frosted Glass Bottom Tab Bar */}
      <BottomTabBar
        activeIndex={activeTab}
        onTabPress={handleTabPress}
      />

      {/* Floating Action Button for Transaction Entry */}
      <FAB onPress={() => router.push('/add-transaction')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  pager: {
    flex: 1,
  },
});
