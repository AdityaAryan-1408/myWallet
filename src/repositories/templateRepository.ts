/**
 * MyWallet — Smart Transaction Templates Repository ("Quick Actions")
 * 
 * Tier 4, Feature 9: One-tap logging for daily recurring transactions.
 * - Auto-learns from SQLite frequency + recency.
 * - Time-aware: morning (coffee/commute), afternoon (lunch), evening (dinner/groceries).
 * - 1-tap instant transaction creation with account balance updates.
 * - Pin/favorite templates to persist on Home Screen.
 */

import { getDatabase } from '@/db/client';
import { TransactionRepository } from './transactionRepository';
import { SettingsRepository } from './settingsRepository';
import { Colors } from '@/theme';

export interface TransactionTemplate {
  id: string;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId?: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  accountId?: string;
  accountName?: string;
  creditCardId?: string;
  creditCardName?: string;
  timeContext: 'morning' | 'afternoon' | 'evening' | 'any';
  frequencyCount: number;
  isFavorite: boolean;
}

export function getCurrentTimeContext(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

export const TemplateRepository = {
  /**
   * Retrieves smart dynamic templates + pinned favorites.
   */
  getSmartTemplates(limit: number = 6): TransactionTemplate[] {
    const db = getDatabase();
    const currentContext = getCurrentTimeContext();

    // 1. Fetch user-pinned favorites from settings
    const pinnedJson = SettingsRepository.get('pinned_templates', '[]');
    let pinnedIds: string[] = [];
    try {
      pinnedIds = JSON.parse(pinnedJson);
    } catch {
      pinnedIds = [];
    }

    // 2. Query top recurring transactions from SQLite
    interface FrequentTxRow {
      note: string;
      amount: number;
      type: string;
      category_id: string | null;
      cat_name: string | null;
      cat_color: string | null;
      cat_icon: string | null;
      account_id: string | null;
      acc_name: string | null;
      credit_card_id: string | null;
      card_name: string | null;
      time: string | null;
      cnt: number;
    }

    let rows: FrequentTxRow[] = [];
    try {
      rows = db.getAllSync<FrequentTxRow>(`
        SELECT 
          TRIM(t.note) as note,
          t.amount,
          t.type,
          t.category_id,
          c.name as cat_name,
          c.color as cat_color,
          c.icon as cat_icon,
          t.account_id,
          a.name as acc_name,
          t.credit_card_id,
          cc.name as card_name,
          t.time,
          COUNT(*) as cnt
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN credit_cards cc ON t.credit_card_id = cc.id
        WHERE t.note IS NOT NULL AND TRIM(t.note) != '' AND t.amount > 0
        GROUP BY LOWER(TRIM(t.note)), t.amount, t.category_id, t.type
        ORDER BY cnt DESC
        LIMIT 25;
      `);
    } catch {
      rows = [];
    }

    const templates: TransactionTemplate[] = [];
    const seenKeys = new Set<string>();

    rows.forEach((r) => {
      const key = `${r.note.toLowerCase()}_${r.amount}_${r.category_id}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      // Determine time context of transaction
      let ctx: 'morning' | 'afternoon' | 'evening' | 'any' = 'any';
      if (r.time) {
        const [h] = r.time.split(':').map(Number);
        if (h >= 5 && h < 12) ctx = 'morning';
        else if (h >= 12 && h < 17) ctx = 'afternoon';
        else ctx = 'evening';
      }

      const id = `tpl_${key.replace(/[^a-zA-Z0-9_]/g, '')}`;
      templates.push({
        id,
        name: r.note,
        amount: r.amount,
        type: (r.type as 'expense' | 'income') || 'expense',
        categoryId: r.category_id || undefined,
        categoryName: r.cat_name || 'General Expense',
        categoryColor: r.cat_color || Colors.primaryFixed,
        categoryIcon: r.cat_icon || 'ShoppingBag',
        accountId: r.account_id || undefined,
        accountName: r.acc_name || undefined,
        creditCardId: r.credit_card_id || undefined,
        creditCardName: r.card_name || undefined,
        timeContext: ctx,
        frequencyCount: r.cnt,
        isFavorite: pinnedIds.includes(id),
      });
    });

    // 3. Fallback smart presets if user has few transactions
    if (templates.length < 4) {
      const defaults: Array<{
        name: string;
        amount: number;
        catName: string;
        catColor: string;
        catIcon: string;
        context: 'morning' | 'afternoon' | 'evening';
      }> = [
        { name: 'Morning Chai / Coffee', amount: 30, catName: 'Food & Dining', catColor: '#FF6B6B', catIcon: 'Coffee', context: 'morning' },
        { name: 'Metro / Auto Ride', amount: 80, catName: 'Transportation', catColor: '#6BCB77', catIcon: 'Car', context: 'morning' },
        { name: 'Daily Thali / Lunch', amount: 140, catName: 'Food & Dining', catColor: '#FF6B6B', catIcon: 'Utensils', context: 'afternoon' },
        { name: 'Quick Snacks', amount: 60, catName: 'Food & Dining', catColor: '#FFD93D', catIcon: 'Coffee', context: 'afternoon' },
        { name: 'Evening Grocery Milk', amount: 70, catName: 'Groceries', catColor: '#FF8C32', catIcon: 'ShoppingBag', context: 'evening' },
        { name: 'Dinner Takeaway', amount: 250, catName: 'Food & Dining', catColor: '#FF6B6B', catIcon: 'Utensils', context: 'evening' },
      ];

      defaults.forEach((d) => {
        const id = `tpl_def_${d.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')}`;
        if (!templates.some((t) => t.name.toLowerCase() === d.name.toLowerCase())) {
          templates.push({
            id,
            name: d.name,
            amount: d.amount,
            type: 'expense',
            categoryName: d.catName,
            categoryColor: d.catColor,
            categoryIcon: d.catIcon,
            timeContext: d.context,
            frequencyCount: 1,
            isFavorite: pinnedIds.includes(id),
          });
        }
      });
    }

    // 4. Sort: Favorites first, then matching current time context, then highest frequency
    templates.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      const aMatches = a.timeContext === currentContext || a.timeContext === 'any';
      const bMatches = b.timeContext === currentContext || b.timeContext === 'any';
      if (aMatches !== bMatches) return aMatches ? -1 : 1;
      return b.frequencyCount - a.frequencyCount;
    });

    return templates.slice(0, limit);
  },

  /**
   * Toggles pin status for a template.
   */
  togglePin(templateId: string): boolean {
    const pinnedJson = SettingsRepository.get('pinned_templates', '[]');
    let pinnedIds: string[] = [];
    try {
      pinnedIds = JSON.parse(pinnedJson);
    } catch {
      pinnedIds = [];
    }

    const isAlreadyPinned = pinnedIds.includes(templateId);
    let newPinned: string[];
    if (isAlreadyPinned) {
      newPinned = pinnedIds.filter((id) => id !== templateId);
    } else {
      newPinned = [...pinnedIds, templateId];
    }

    SettingsRepository.set('pinned_templates', JSON.stringify(newPinned));
    return !isAlreadyPinned;
  },

  /**
   * One-tap log: instantly logs the template as a real transaction!
   */
  quickLog(template: TransactionTemplate): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Get primary account if none specified
    let targetAccountId = template.accountId;
    if (!targetAccountId && !template.creditCardId) {
      const db = getDatabase();
      const primaryAcc = db.getFirstSync<{ id: string }>(
        'SELECT id FROM accounts WHERE is_active = 1 ORDER BY is_primary DESC LIMIT 1;'
      );
      targetAccountId = primaryAcc?.id || 'acc_cash';
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    TransactionRepository.create({
      id: txId,
      type: template.type,
      amount: template.amount,
      account_id: targetAccountId || null,
      dest_account_id: null,
      credit_card_id: template.creditCardId || null,
      category_id: template.categoryId || null,
      subcategory_id: null,
      date: dateStr,
      time: timeStr,
      note: template.name,
      expression: `${template.amount}`,
    });

    return txId;
  },
};
