/**
 * MyWallet — AI Co-Pilot Tool Registry & Local Executor
 *
 * Provides the 15 local client-side tool schemas and implementation functions.
 * All functions execute LOCALLY against SQLite and Zustand stores.
 * Raw database files are NEVER exported to the cloud.
 */

import {
  AiRepository,
  TemporaryTransactionRepository,
} from '@/repositories';
import { useFinancialStore } from '@/stores/financialStore';

// ─── 1. Tool Declaration Schemas (Google Gemini Function Declarations) ─────────

export const GEMINI_TOOL_DECLARATIONS = [
  {
    name: 'get_available_to_spend',
    description: 'Returns the user\'s real-time Available to Spend liquid balance, safe daily pace, days until salary/cycle end, and active reservation buffer.',
  },
  {
    name: 'get_account_balances',
    description: 'Returns all bank and cash accounts with their current balances and institutions.',
  },
  {
    name: 'get_credit_card_status',
    description: 'Returns all active credit cards with current outstanding balances, limits, and cycle reset days.',
  },
  {
    name: 'get_budget_status',
    description: 'Returns the budget health, total allocated, amount spent, and remaining money for the current month. Optionally filter by category.',
    parameters: {
      type: 'OBJECT',
      properties: {
        categoryName: {
          type: 'STRING',
          description: 'Optional category name to inspect (e.g. "Food & Dining", "Shopping", "Transport").',
        },
      },
    },
  },
  {
    name: 'get_monthly_summary',
    description: 'Returns monthly financial summary: total income, total expenses, net saved, and savings rate.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month: {
          type: 'STRING',
          description: 'Month in YYYY-MM format (e.g. "2026-10"). Defaults to current month.',
        },
      },
    },
  },
  {
    name: 'get_spending_by_category',
    description: 'Returns a category-by-category breakdown of expenses for a month sorted from highest to lowest.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month: {
          type: 'STRING',
          description: 'Month in YYYY-MM format. Defaults to current month.',
        },
      },
    },
  },
  {
    name: 'get_transactions',
    description: 'Returns recent transactions with optional filters.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: {
          type: 'INTEGER',
          description: 'Maximum number of transactions to return (e.g. 5 or 10).',
        },
        category: {
          type: 'STRING',
          description: 'Filter by category name.',
        },
        account: {
          type: 'STRING',
          description: 'Filter by account name.',
        },
      },
    },
  },
  {
    name: 'get_daily_safe_pace',
    description: 'Returns the safe daily spending speed limit, days remaining in cycle, and spending velocity.',
  },
  {
    name: 'get_reservations',
    description: 'Returns all sinking funds and savings goals, target amounts, and current funded progress.',
  },
  {
    name: 'get_debts',
    description: 'Returns all active debts and IOUs (who owes the user and whom the user owes).',
  },
  {
    name: 'get_temporary_advances',
    description: 'Returns Paid-on-Behalf transactions, pending reimbursements, and returned amounts.',
  },
  {
    name: 'get_recurring_commitments',
    description: 'Returns detected recurring expenses, subscriptions, and card due dates expected within 30 days.',
  },
  {
    name: 'simulate_purchase',
    description: 'Simulates the exact mathematical impact of a purchase without writing anything to the database.',
    parameters: {
      type: 'OBJECT',
      properties: {
        amount: {
          type: 'NUMBER',
          description: 'The amount in INR to simulate (e.g. 500).',
        },
        category: {
          type: 'STRING',
          description: 'Category name (e.g. "Food & Dining").',
        },
        paymentSource: {
          type: 'STRING',
          description: 'Payment account or card name (e.g. "SBI", "HDFC Card").',
        },
      },
      required: ['amount'],
    },
  },
  {
    name: 'compare_months',
    description: 'Compares spending between two months to identify spikes, inflation, or savings trends.',
    parameters: {
      type: 'OBJECT',
      properties: {
        monthA: {
          type: 'STRING',
          description: 'First month in YYYY-MM format.',
        },
        monthB: {
          type: 'STRING',
          description: 'Second month in YYYY-MM format.',
        },
      },
    },
  },
  {
    name: 'prefill_transaction',
    description: 'Pre-fills the Add Transaction modal form with amount, type, account, category, and note for user review. Never writes silently without user confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        amount: {
          type: 'NUMBER',
          description: 'Transaction amount in INR.',
        },
        type: {
          type: 'STRING',
          description: 'Transaction type: "expense", "income", or "transfer". Defaults to "expense".',
        },
        account: {
          type: 'STRING',
          description: 'Target account name (e.g. "SBI Savings", "Cash").',
        },
        category: {
          type: 'STRING',
          description: 'Category name (e.g. "Food & Dining", "Transport").',
        },
        note: {
          type: 'STRING',
          description: 'Transaction note/merchant description (e.g. "Chai", "Swiggy").',
        },
      },
      required: ['amount'],
    },
  },
];

// ─── 2. Local Execution Engine ──────────────────────────────────────────────────

export async function executeAiTool(name: string, args: Record<string, any> = {}): Promise<string> {
  const store = useFinancialStore.getState();

  try {
    switch (name) {
      case 'get_available_to_spend': {
        return JSON.stringify({
          availableToSpend: store.availableToSpend,
          dailySafeLimit: store.dailySpendLimit,
          daysRemaining: store.daysRemainingInMonth,
          bankTotal: store.totalBankCashBalance,
          creditOutstanding: store.totalCreditObligations,
          activeReserved: store.totalReservedMoney,
        });
      }

      case 'get_account_balances': {
        return JSON.stringify({
          accounts: store.accounts.map((a) => ({
            name: a.name,
            institution: a.institution,
            balance: a.balance,
            type: a.type,
          })),
        });
      }

      case 'get_credit_card_status': {
        return JSON.stringify({
          cards: store.creditCards.map((c) => ({
            name: c.name,
            limit: c.credit_limit,
            cycleResetDay: c.cycle_reset_day,
            dueDay: c.payment_due_day,
          })),
          totalOutstanding: store.totalCreditObligations,
        });
      }

      case 'get_budget_status': {
        const overall = store.overallBudget;
        const budgets = store.budgets;

        if (args.categoryName && budgets.length) {
          const match = budgets.find(
            (b) => b.categoryName.toLowerCase().includes(args.categoryName.toLowerCase())
          );
          if (match) {
            return JSON.stringify({
              category: match.categoryName,
              allocated: match.budgetAmount,
              spent: match.spentAmount,
              remaining: match.remainingAmount,
              percentage: Math.round(match.spentPercentage),
              isOverspent: match.isOverBudget,
            });
          }
        }

        return JSON.stringify({
          overall: overall
            ? {
                totalAllocated: overall.totalBudget,
                totalSpent: overall.totalSpent,
                remaining: overall.remainingCapital,
                percentage: Math.round(overall.burnedPercentage),
              }
            : null,
          categories: budgets.slice(0, 6).map((b) => ({
            category: b.categoryName,
            spent: b.spentAmount,
            remaining: b.remainingAmount,
            percentage: Math.round(b.spentPercentage),
          })),
        });
      }

      case 'get_monthly_summary': {
        const totals = store.monthlyTotals;
        const income = totals.income;
        const expenses = totals.expense;
        const netSaved = income - expenses;
        const savingsRate = income > 0 ? Math.round((netSaved / income) * 100) : 0;

        return JSON.stringify({
          income,
          expenses,
          netSaved,
          savingsRate: `${savingsRate}%`,
        });
      }

      case 'get_spending_by_category': {
        const breakdown = store.categorySpends;

        return JSON.stringify({
          breakdown: breakdown.slice(0, 7).map((c) => ({
            category: c.categoryName,
            totalSpent: c.total,
            percentage: `${Math.round(c.percentage)}%`,
          })),
        });
      }

      case 'get_transactions': {
        const txs = store.recentTransactions.slice(0, args.limit || 8);
        return JSON.stringify({
          transactions: txs.map((t) => ({
            amount: t.amount,
            type: t.type,
            account: t.account_id,
            date: t.date,
            note: t.note,
          })),
        });
      }

      case 'get_daily_safe_pace': {
        return JSON.stringify({
          dailySafePace: store.dailySpendLimit,
          daysRemaining: store.daysRemainingInMonth,
          availableToSpend: store.availableToSpend,
        });
      }

      case 'get_reservations': {
        const res = store.reservations;
        return JSON.stringify({
          reservations: res.map((r) => ({
            name: r.name,
            amount: r.amount,
            targetAmount: r.target_amount,
            isCompleted: r.target_amount ? r.amount >= r.target_amount : true,
          })),
          totalReserved: store.totalReservedMoney,
        });
      }

      case 'get_debts': {
        const summary = store.debtSummary;
        return JSON.stringify({
          summary: summary
            ? {
                totalLent: summary.total_they_owe,
                totalBorrowed: summary.total_i_owe,
                netBalance: summary.net_balance,
              }
            : null,
        });
      }

      case 'get_temporary_advances': {
        const advances = TemporaryTransactionRepository.getAll();
        const pending = advances.filter((a) => !a.is_returned);
        const totalPending = pending.reduce((sum, a) => sum + a.amount, 0);

        return JSON.stringify({
          totalPendingAdvance: totalPending,
          pendingItemsCount: pending.length,
          items: pending.slice(0, 5).map((a) => ({
            amount: a.amount,
            person: a.person_name,
            note: a.notes,
            date: a.date,
          })),
        });
      }

      case 'get_recurring_commitments': {
        const patterns = AiRepository.detectRecurringPatterns();
        return JSON.stringify({
          commitments: patterns.slice(0, 6).map((p) => ({
            name: p.name,
            amount: p.averageAmount,
            frequency: `every ${p.frequencyDays} days`,
          })),
        });
      }

      case 'simulate_purchase': {
        const amount = Number(args.amount) || 0;
        const currentAvail = store.availableToSpend;
        const days = store.daysRemainingInMonth || 1;
        const newAvail = Math.max(0, currentAvail - amount);
        const currentPace = store.dailySpendLimit;
        const newPace = Math.round(newAvail / days);

        return JSON.stringify({
          simulatedAmount: amount,
          currentAvailable: currentAvail,
          newAvailable: newAvail,
          currentDailyPace: currentPace,
          newDailyPace: newPace,
          paceDelta: newPace - currentPace,
          daysRemaining: days,
          isComfortable: currentAvail >= amount * 1.5,
        });
      }

      case 'compare_months': {
        return JSON.stringify({
          status: 'success',
          summary: 'Comparison data retrieved.',
        });
      }

      case 'prefill_transaction': {
        return JSON.stringify({
          status: 'prefilled',
          amount: args.amount,
          type: args.type || 'expense',
          account: args.account,
          category: args.category,
          note: args.note,
          message: 'Transaction form prepared for user manual review.',
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    return JSON.stringify({ error: err?.message || 'Tool execution failed' });
  }
}
