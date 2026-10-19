/**
 * MyWallet — Dynamic App Icon Service (Feature A9: Financial Health Badge)
 * 
 * Dynamically switches the Android launcher icon based on real-time financial health:
 * - 🟢 healthy: Safe-to-Spend is comfortable (>50%), default Obsidian + Neon Chartreuse.
 * - 🟡 caution: Safe-to-Spend pacing warning (15% - 50%), Neon Amber-Gold shift.
 * - 🔴 critical: Budget exhausted / deficit (<15%), Laser Crimson + Alert Pulse Badge.
 * - 🎯 goal: Savings target achieved within past 24 hours, 24k Imperial Gold + Sparkles.
 */

import { NativeModules, Platform } from 'react-native';
import { SettingsRepository } from '@/repositories/settingsRepository';
import { calculateFinancialHealth } from '@/domain/financialCalculations';
import { AccountRepository } from '@/repositories/accountRepository';
import { CreditCardRepository } from '@/repositories/creditCardRepository';
import { ReservationRepository } from '@/repositories/reservationRepository';
import { BudgetRepository } from '@/repositories/budgetRepository';
import { calculateAvailableToSpend } from '@/domain/financialCalculations';

export type AppIconVariant = 'healthy' | 'caution' | 'critical' | 'goal';

const { DynamicIcon } = NativeModules;

class DynamicIconServiceClass {
  /**
   * Sets the launcher icon variant explicitly via Android PackageManager.
   */
  async setIcon(variant: AppIconVariant): Promise<AppIconVariant> {
    if (Platform.OS !== 'android' || !DynamicIcon) {
      SettingsRepository.setActiveIconVariant(variant);
      return variant;
    }

    try {
      const activeVariant = await DynamicIcon.setIcon(variant);
      SettingsRepository.setActiveIconVariant(activeVariant as AppIconVariant);
      return activeVariant as AppIconVariant;
    } catch (e) {
      console.warn('[DynamicIconService] Failed to set launcher icon:', e);
      return variant;
    }
  }

  /**
   * Returns the currently active launcher icon variant.
   */
  async getCurrentIcon(): Promise<AppIconVariant> {
    if (Platform.OS !== 'android' || !DynamicIcon) {
      return (SettingsRepository.getActiveIconVariant() as AppIconVariant) || 'healthy';
    }

    try {
      const active = await DynamicIcon.getCurrentIcon();
      return (active as AppIconVariant) || 'healthy';
    } catch {
      return (SettingsRepository.getActiveIconVariant() as AppIconVariant) || 'healthy';
    }
  }

  /**
   * Evaluates current financial health and syncs the appropriate launcher icon variant.
   */
  async syncIcon(forceVariant?: AppIconVariant): Promise<AppIconVariant> {
    if (forceVariant) {
      return this.setIcon(forceVariant);
    }

    // Check if dynamic launcher icon is enabled
    const isEnabled = SettingsRepository.getDynamicIconEnabled();
    if (!isEnabled) {
      return this.setIcon('healthy');
    }

    // 1. Check for 24h Goal Achievement Celebration Trophy
    const lastGoalTime = SettingsRepository.getLastGoalAchievedTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    if (lastGoalTime > 0 && Date.now() - lastGoalTime < twentyFourHoursMs) {
      return this.setIcon('goal');
    }

    // 2. Evaluate Financial Health Tier
    try {
      const totalAvailableBankCashBalance = AccountRepository.getTotalAvailableBankCashBalance();
      const totalBankCashBalance = AccountRepository.getTotalBankCashBalance();
      const totalCreditObligations = CreditCardRepository.getTotalCreditObligations();
      const totalReservedMoney = ReservationRepository.getTotalReservedAffectingAvailable();

      const { availableToSpend } = calculateAvailableToSpend({
        totalBankCashBalance: totalAvailableBankCashBalance,
        totalCreditObligations,
        totalReservedMoney,
      });

      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const overallBudget = BudgetRepository.getOverallBudgetProgress(currentYearMonth);

      const health = calculateFinancialHealth({
        availableToSpend,
        overallBudget,
        totalBankCashBalance: totalAvailableBankCashBalance ?? totalBankCashBalance,
      });

      let targetVariant: AppIconVariant = 'healthy';
      if (health.tier === 'critical') {
        targetVariant = 'critical';
      } else if (health.tier === 'caution') {
        targetVariant = 'caution';
      } else {
        targetVariant = 'healthy';
      }

      return this.setIcon(targetVariant);
    } catch (e) {
      console.warn('[DynamicIconService] Error calculating health for icon:', e);
      return this.setIcon('healthy');
    }
  }
}

export const DynamicIconService = new DynamicIconServiceClass();
