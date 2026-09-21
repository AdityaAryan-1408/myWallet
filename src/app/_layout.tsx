/**
 * MyWallet — Root Layout
 * 
 * Sets up font loading, splash screen, SQLite initialization, and Stack navigation.
 * Forces dark mode and applies the Zenith Obsidian theme throughout.
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

import { Colors, PaperTheme } from '@/theme';
import { useFinancialStore } from '@/stores';

// Prevent splash screen from auto-hiding before fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Plus Jakarta Sans
    PlusJakartaSans: PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
    // JetBrains Mono
    JetBrainsMono: JetBrainsMono_400Regular,
    'JetBrainsMono-Medium': JetBrainsMono_500Medium,
    'JetBrainsMono-SemiBold': JetBrainsMono_600SemiBold,
    'JetBrainsMono-Bold': JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      try {
        useFinancialStore.getState().initialize();
      } catch (e) {
        console.warn('Database initialization deferred:', e);
      }
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const { themeMode } = useFinancialStore();
  const isLight = themeMode === 'light';

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: Colors.surface }]}>
      <SafeAreaProvider>
        <PaperProvider theme={PaperTheme}>
          <StatusBar
            barStyle={isLight ? 'dark-content' : 'light-content'}
            backgroundColor={Colors.surface}
          />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.surface },
              animation: 'fade',
            }}
          >
            {/* Main Tabs Pager Screen */}
            <Stack.Screen name="index" />

            {/* Add Transaction Modal Screen */}
            <Stack.Screen
              name="add-transaction"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />

            {/* Available to Spend Breakdown (Phase 8) */}
            <Stack.Screen
              name="breakdown"
              options={{
                animation: 'slide_from_right',
              }}
            />

            {/* Accounts & Reserved Money (Phase 9) */}
            <Stack.Screen
              name="accounts"
              options={{
                animation: 'slide_from_right',
              }}
            />

            {/* Categories & Intelligence (Phase 10) */}
            <Stack.Screen
              name="categories"
              options={{
                animation: 'slide_from_right',
              }}
            />

            {/* People & Debts (Phase 11) */}
            <Stack.Screen
              name="debts"
              options={{
                animation: 'slide_from_right',
              }}
            />

            {/* Analytics & Resilience (Phase 12) */}
            <Stack.Screen
              name="analytics"
              options={{
                animation: 'slide_from_right',
              }}
            />

            {/* Settings, Profile, Security & Backup (Phase 13) */}
            <Stack.Screen
              name="settings"
              options={{
                animation: 'slide_from_right',
              }}
            />

            {/* Hidden redirect routes */}
            <Stack.Screen name="activity" />
            <Stack.Screen name="budgets" />
            <Stack.Screen name="cards" />
            <Stack.Screen name="more" />
            <Stack.Screen name="explore" />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
});
