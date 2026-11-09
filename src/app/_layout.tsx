/**
 * MyWallet — Root Layout
 * 
 * Sets up font loading, splash screen, SQLite initialization, and Stack navigation.
 * Forces dark mode and applies the Zenith Obsidian theme throughout.
 */

import React, { useEffect } from 'react';
import { AppState, StatusBar, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
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
import { AiIntelligenceService } from '@/services/aiIntelligenceService';
import { NotificationService } from '@/services/notificationService';
import { DynamicIconService } from '@/services';

// Prevent splash screen from auto-hiding before fonts load
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
    if (!fontsLoaded && !fontError) return;

    let isMounted = true;

    const reconcileNotifications = async (reason: 'launch' | 'foreground') => {
      const initialized = await NotificationService.initialize();
      if (!initialized) {
        NotificationService.recordDiagnostic('warning', 'reminder_reconciliation_not_run', {
          reason,
          cause: 'notification_system_unavailable',
        });
        return;
      }
      await NotificationService.syncAllReminders();
    };

    try {
      useFinancialStore.getState().initialize();
      // Purge any stale test anomaly notifications left from debug features.
      AiIntelligenceService.purgeTestNotifications();
      reconcileNotifications('launch').catch((error) => {
        console.warn('Notification launch reconciliation failed:', error);
      });
      DynamicIconService.syncIcon().catch(() => {});
    } catch (e) {
      console.warn('Database initialization deferred:', e);
    } finally {
      SplashScreen.hideAsync();
    }

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (isMounted) {
        if (nextState === 'active') {
          reconcileNotifications('foreground').catch((error) => {
            console.warn('Notification foreground reconciliation failed:', error);
          });
          DynamicIconService.syncIcon().catch(() => {});
        } else if (nextState === 'background') {
          DynamicIconService.syncIcon().catch(() => {});
        }
      }
    });

    // SMS Staging / Notification individual response listener
    const notifResponseSub = NotificationService.addResponseListener(async (response) => {
      const notifId = response?.notification?.request?.identifier;
      const data = response?.notification?.request?.content?.data;

      // Dismiss ONLY this notification, preserving other bank SMS notifications in the shade!
      if (notifId) {
        await NotificationService.dismissNotification(notifId);
      }

      if (data && data.type === 'staged_sms') {
        const payload = data as Record<string, string>;
        router.push({
          pathname: '/add-transaction',
          params: {
            type: payload.txType ? String(payload.txType) : 'expense',
            amount: payload.amount ? String(payload.amount) : '',
            note: payload.note ? String(payload.note) : '',
            account: payload.accountId ? String(payload.accountId) : undefined,
            creditCardId: payload.creditCardId ? String(payload.creditCardId) : undefined,
            category: payload.categoryId ? String(payload.categoryId) : undefined,
            stagedSmsId: payload.stagedId ? String(payload.stagedId) : undefined,
          },
        });
      }
    });

    // Cold start check (if opened from tapped notification while app was closed)
    NotificationService.getLastResponse().then(async (response) => {
      if (response?.notification) {
        const notifId = response.notification.request.identifier;
        const data = response.notification.request.content.data;
        if (notifId) {
          await NotificationService.dismissNotification(notifId);
        }
        if (data && data.type === 'staged_sms') {
          const payload = data as Record<string, string>;
          router.push({
            pathname: '/add-transaction',
            params: {
              type: payload.txType ? String(payload.txType) : 'expense',
              amount: payload.amount ? String(payload.amount) : '',
              note: payload.note ? String(payload.note) : '',
              account: payload.accountId ? String(payload.accountId) : undefined,
              creditCardId: payload.creditCardId ? String(payload.creditCardId) : undefined,
              category: payload.categoryId ? String(payload.categoryId) : undefined,
              stagedSmsId: payload.stagedId ? String(payload.stagedId) : undefined,
            },
          });
        }
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
      appStateSubscription.remove();
      notifResponseSub?.remove();
    };
  }, [fontsLoaded, fontError, router]);

  const { themeMode } = useFinancialStore();
  const isLight = themeMode === 'light' || themeMode === 'mono_light';

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

            {/* Zenith AI Intelligence Layer (Tier 1) */}
            <Stack.Screen
              name="intelligence"
              options={{
                animation: 'slide_from_right',
              }}
            />

            {/* Monthly Category Budgets */}
            <Stack.Screen
              name="budgets"
              options={{
                animation: 'slide_from_right',
              }}
            />

            {/* Hidden redirect routes */}
            <Stack.Screen name="activity" />
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
