/**
 * MyWallet — Root Layout
 * 
 * Sets up font loading, splash screen, and the tab navigation structure.
 * Forces dark mode and applies the Zenith Obsidian theme.
 */

import React, { useEffect } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
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

import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { FAB } from '@/components/navigation/FAB';
import { Colors, PaperTheme } from '@/theme';
import { useFinancialStore } from '@/stores';

// Prevent the splash screen from auto-hiding before fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={PaperTheme}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />
          <View style={styles.root}>
            <Tabs
              tabBar={(props) => <BottomTabBar {...props} />}
              screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' },
              }}
            >
              <Tabs.Screen name="index" options={{ title: 'Home' }} />
              <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
              <Tabs.Screen name="budgets" options={{ title: 'Budgets' }} />
              <Tabs.Screen name="cards" options={{ title: 'Cards' }} />
              <Tabs.Screen name="more" options={{ title: 'More' }} />
              {/* Keep default explore route hidden from bottom tabs */}
              <Tabs.Screen name="explore" options={{ href: null }} />
              {/* Add transaction entry screen */}
              <Tabs.Screen name="add-transaction" options={{ href: null }} />
            </Tabs>
            <FAB onPress={() => router.push('/add-transaction')} />
          </View>
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
