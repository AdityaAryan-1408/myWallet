/**
 * MyWallet — Repositories Barrel Export
 */

export { AccountRepository } from './accountRepository';
export { CategoryRepository } from './categoryRepository';
export type { CategoryWithStats } from './categoryRepository';
export { CreditCardRepository } from './creditCardRepository';
export { TransactionRepository } from './transactionRepository';
export type { MonthlyTotals, CategorySpend, TransactionWithDetails } from './transactionRepository';
export { ReservationRepository } from './reservationRepository';
export { DebtRepository } from './debtRepository';
export type { DebtWithRepayments, DebtSummary } from './debtRepository';
export { NoteRepository } from './noteRepository';
export { SettingsRepository } from './settingsRepository';
export { BudgetRepository } from './budgetRepository';
export type { BudgetWithProgress, OverallBudgetProgress } from './budgetRepository';
export { MerchantRepository } from './merchantRepository';
export type {
  MerchantSummary,
  MerchantRule,
  MerchantIntelligenceItem,
  MerchantIntelligenceReport,
  PriceDeviationAlert,
} from './merchantRepository';
export { AnalyticsRepository } from './analyticsRepository';
export type {
  MonthComparisonData,
  CategoryComparison,
  VelocityAuditData,
  DayOfWeekData,
  DayOfWeekItem,
  TimeDistributionData,
  TimeSlotItem,
  NoSpendHeatmapData,
  HeatmapDay,
  FinancialResilienceData,
  ResiliencePillar,
  PaymentMethodSpend,
  HealthScoreFactorId,
  HealthScoreFactor,
  TransparentHealthScoreData,
  FinancialWrappedData,
  FinancialWrappedCategory,
  FinancialWrappedPersonality,
  MonthlyFinancialDigestData,
  MonthlyDigestTopCategory,
} from './analyticsRepository';
export { BackupRepository } from './backupRepository';
export type { BackupPayload, StorageStats, CloudSyncStatus } from './backupRepository';
export { NotificationRepository } from './notificationRepository';
export { AiRepository } from './aiRepository';
export type {
  SpendingAnomaly,
  MonthlyReportCard,
  CashFlowPrediction,
  RecurringPattern,
  SavingsAutopilot,
  VelocityRadar,
} from './aiRepository';
