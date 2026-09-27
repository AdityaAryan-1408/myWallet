/**
 * MyWallet — Android Home Screen Widget Service (Phase 18)
 * 
 * Synchronizes financial calculation engine metrics with native Android AppWidget
 * via MyWalletWidget native module and SharedPreferences.
 * 
 * Provides:
 * - Real-time "Safe to Spend" and daily pacing push
 * - Seamless fallback in Expo Go / Web previews without crashes
 * - Local caching in SettingsRepository for instant restore & in-app widget preview
 */

import { NativeModules, Platform } from 'react-native';
import { SettingsRepository } from '@/repositories/settingsRepository';

const { MyWalletWidget } = NativeModules;

export interface WidgetData {
  availableToSpend: number;
  dailySpendLimit: number;
  currency: string;
  statusText: string;
  lastUpdated: string;
}

export const WidgetService = {
  /**
   * Pushes updated financial metrics to the native Android widget.
   * Updates SharedPreferences and dispatches ACTION_APPWIDGET_UPDATE broadcast
   * so all active home screen widgets redraw immediately without reload.
   */
  async syncWidget(
    availableToSpend: number,
    dailySpendLimit: number,
    currency = '₹',
    statusText = 'HEALTHY'
  ): Promise<boolean> {
    const nowIso = new Date().toISOString();

    // 1. Cache values in SettingsRepository for persistence and in-app preview
    try {
      SettingsRepository.set('widget_available_to_spend', String(availableToSpend));
      SettingsRepository.set('widget_daily_spend_limit', String(dailySpendLimit));
      SettingsRepository.set('widget_currency', currency);
      SettingsRepository.set('widget_status_text', statusText);
      SettingsRepository.set('widget_last_updated', nowIso);
    } catch (e) {
      console.warn('WidgetService: Error caching widget data:', e);
    }

    // 2. Dispatch to native Android widget module if running in standalone / APK build
    if (Platform.OS === 'android' && MyWalletWidget?.updateWidgetData) {
      try {
        await MyWalletWidget.updateWidgetData(
          availableToSpend,
          dailySpendLimit,
          currency,
          statusText
        );
        return true;
      } catch (err) {
        console.warn('WidgetService: Native widget update failed:', err);
        return false;
      }
    }

    return true;
  },

  /**
   * Reads cached widget state from SettingsRepository or native module.
   */
  getWidgetData(): WidgetData {
    try {
      const available = parseFloat(SettingsRepository.get('widget_available_to_spend', '0')) || 0;
      const daily = parseFloat(SettingsRepository.get('widget_daily_spend_limit', '0')) || 0;
      const currency = SettingsRepository.get('widget_currency', '₹') || '₹';
      const statusText = SettingsRepository.get('widget_status_text', 'HEALTHY') || 'HEALTHY';
      const lastUpdated = SettingsRepository.get('widget_last_updated', '') || new Date().toISOString();

      return {
        availableToSpend: available,
        dailySpendLimit: daily,
        currency,
        statusText,
        lastUpdated,
      };
    } catch {
      return {
        availableToSpend: 0,
        dailySpendLimit: 0,
        currency: '₹',
        statusText: 'HEALTHY',
        lastUpdated: new Date().toISOString(),
      };
    }
  },
};
