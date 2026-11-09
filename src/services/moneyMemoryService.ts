/**
 * MyWallet — Money Memory Service (Feature B3: Contextual Timeline Journal)
 * 
 * Auto-generates narrative contextual annotations and moment clusters:
 * 1. Time-of-day & Day-of-week contextual labeling (e.g. "Sat Evening • 8:30 PM")
 * 2. Automated Moment Clustering (e.g. "Saturday Night Out — ₹2,840 across Uber, Zomato, PVR")
 * 3. Daily Storyline & Journal Integration ("First day of new job", "Sick day at home")
 * 4. High-level Memory timeline for reflective financial awareness
 */

import { TransactionWithDetails } from '@/repositories/transactionRepository';
import { DailyJournal } from '@/db/schema';

export interface FinancialMoment {
  id: string;
  date: string;
  title: string;
  emoji: string;
  totalAmount: number;
  transactionCount: number;
  merchants: string[];
  narrative: string;
  transactionIds: string[];
}

export type TimeOfDaySlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeOfDayInfo {
  slot: TimeOfDaySlot;
  label: string;
  iconName: string;
  formatted: string;
}

export interface MemoryDay {
  date: string;
  displayDate: string;
  dayOfWeek: string;
  journal?: DailyJournal | null;
  moments: FinancialMoment[];
  totalExpense: number;
  totalIncome: number;
  transactions: TransactionWithDetails[];
}

export const MoneyMemoryService = {
  /**
   * Resolves time-of-day contextual info from transaction time and date.
   */
  getTimeOfDayContext(timeStr?: string | null, dateStr?: string): TimeOfDayInfo {
    let hour = 12;
    let minute = 0;

    if (timeStr) {
      const parts = timeStr.split(':').map(Number);
      if (!isNaN(parts[0])) hour = parts[0];
      if (!isNaN(parts[1])) minute = parts[1];
    } else if (dateStr) {
      hour = 12;
    }

    let slot: TimeOfDaySlot = 'afternoon';
    let label = 'Afternoon';
    let iconName = 'Sun';

    if (hour >= 5 && hour < 12) {
      slot = 'morning';
      label = 'Morning';
      iconName = 'Sunrise';
    } else if (hour >= 12 && hour < 17) {
      slot = 'afternoon';
      label = 'Afternoon';
      iconName = 'Sun';
    } else if (hour >= 17 && hour < 22) {
      slot = 'evening';
      label = 'Evening';
      iconName = 'Sunset';
    } else {
      slot = 'night';
      label = 'Late Night';
      iconName = 'Moon';
    }

    // Format 12-hour clock (e.g. "8:45 PM")
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMin = String(minute).padStart(2, '0');
    const formatted = `${label} • ${displayHour}:${displayMin} ${ampm}`;

    return {
      slot,
      label,
      iconName,
      formatted,
    };
  },

  /**
   * Detects automated moments for a single date by clustering expenses.
   */
  detectMomentsForDate(dateStr: string, transactions: TransactionWithDetails[]): FinancialMoment[] {
    const expenses = transactions.filter((t) => t.type === 'expense');
    if (expenses.length < 2) return [];

    const moments: FinancialMoment[] = [];
    const usedTxIds = new Set<string>();

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    // Helper to parse time to minutes from midnight
    const getMinutes = (t: TransactionWithDetails) => {
      if (!t.time) return 12 * 60;
      const [h, min] = t.time.split(':').map(Number);
      return (h || 0) * 60 + (min || 0);
    };

    // Category keyword matches
    const isDining = (t: TransactionWithDetails) => {
      const text = `${t.category_name || ''} ${t.subcategory_name || ''} ${t.note || ''}`.toLowerCase();
      return text.includes('food') || text.includes('dining') || text.includes('restaurant') ||
             text.includes('zomato') || text.includes('swiggy') || text.includes('cafe') ||
             text.includes('coffee') || text.includes('drink') || text.includes('bar');
    };

    const isEntertainment = (t: TransactionWithDetails) => {
      const text = `${t.category_name || ''} ${t.subcategory_name || ''} ${t.note || ''}`.toLowerCase();
      return text.includes('entertainment') || text.includes('movie') || text.includes('pvr') ||
             text.includes('inox') || text.includes('game') || text.includes('show');
    };

    const isTransit = (t: TransactionWithDetails) => {
      const text = `${t.category_name || ''} ${t.subcategory_name || ''} ${t.note || ''}`.toLowerCase();
      return text.includes('uber') || text.includes('ola') || text.includes('cab') ||
             text.includes('auto') || text.includes('metro') || text.includes('travel') ||
             text.includes('transport');
    };

    const isShopping = (t: TransactionWithDetails) => {
      const text = `${t.category_name || ''} ${t.subcategory_name || ''} ${t.note || ''}`.toLowerCase();
      return text.includes('shop') || text.includes('grocery') || text.includes('store') ||
             text.includes('amazon') || text.includes('blinkit') || text.includes('zepto') ||
             text.includes('clothes') || text.includes('mall');
    };

    // ─────────────────────────────────────────────────────────────
    // CLUSTER 1: Evening Outing / Night Out
    // (Expenses after 5:30 PM with dining, entertainment, or transit)
    // ─────────────────────────────────────────────────────────────
    const eveningOutingTxs = expenses.filter((t) => {
      const mins = getMinutes(t);
      const isEveningTime = mins >= 17 * 60 + 30 || mins <= 3 * 60; // 5:30 PM to 3:00 AM
      return isEveningTime && (isDining(t) || isEntertainment(t) || isTransit(t));
    });

    if (eveningOutingTxs.length >= 2) {
      eveningOutingTxs.forEach((t) => usedTxIds.add(t.id));
      const totalAmount = eveningOutingTxs.reduce((sum, t) => sum + t.amount, 0);
      const merchants = eveningOutingTxs
        .map((t) => t.note?.trim() || t.category_name || 'Outing')
        .slice(0, 3);

      const isWeekendEvening = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
      const title = isWeekendEvening
        ? `${dayName} Night Out`
        : `Evening Dinner & Outing`;

      const emoji = isEntertainment(eveningOutingTxs[0]) ? '🎬' : '🍸';
      const narrative = `₹${Math.round(totalAmount).toLocaleString('en-IN')} across ${merchants.join(', ')}`;

      moments.push({
        id: `moment_outing_${dateStr}`,
        date: dateStr,
        title,
        emoji,
        totalAmount,
        transactionCount: eveningOutingTxs.length,
        merchants,
        narrative,
        transactionIds: eveningOutingTxs.map((t) => t.id),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CLUSTER 2: Morning Routine & Commute
    // ─────────────────────────────────────────────────────────────
    const morningTxs = expenses.filter((t) => {
      if (usedTxIds.has(t.id)) return false;
      const mins = getMinutes(t);
      return mins >= 6 * 60 && mins < 11 * 60 + 30 && (isTransit(t) || isDining(t));
    });

    if (morningTxs.length >= 2) {
      morningTxs.forEach((t) => usedTxIds.add(t.id));
      const totalAmount = morningTxs.reduce((sum, t) => sum + t.amount, 0);
      const merchants = morningTxs
        .map((t) => t.note?.trim() || t.category_name || 'Item')
        .slice(0, 3);

      moments.push({
        id: `moment_morning_${dateStr}`,
        date: dateStr,
        title: 'Morning Commute & Breakfast',
        emoji: '☕',
        totalAmount,
        transactionCount: morningTxs.length,
        merchants,
        narrative: `₹${Math.round(totalAmount).toLocaleString('en-IN')} across ${merchants.join(', ')}`,
        transactionIds: morningTxs.map((t) => t.id),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CLUSTER 3: Shopping & Errands Run
    // ─────────────────────────────────────────────────────────────
    const shoppingTxs = expenses.filter((t) => {
      if (usedTxIds.has(t.id)) return false;
      return isShopping(t);
    });

    if (shoppingTxs.length >= 2) {
      shoppingTxs.forEach((t) => usedTxIds.add(t.id));
      const totalAmount = shoppingTxs.reduce((sum, t) => sum + t.amount, 0);
      const merchants = shoppingTxs
        .map((t) => t.note?.trim() || t.category_name || 'Store')
        .slice(0, 3);

      moments.push({
        id: `moment_shopping_${dateStr}`,
        date: dateStr,
        title: 'Shopping & Essentials Run',
        emoji: '🛍️',
        totalAmount,
        transactionCount: shoppingTxs.length,
        merchants,
        narrative: `₹${Math.round(totalAmount).toLocaleString('en-IN')} across ${merchants.join(', ')}`,
        transactionIds: shoppingTxs.map((t) => t.id),
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CLUSTER 4: Generic Temporal Proximity Cluster (Within 90 mins)
    // ─────────────────────────────────────────────────────────────
    const remainingExpenses = expenses.filter((t) => !usedTxIds.has(t.id));
    if (remainingExpenses.length >= 2) {
      // Sort remaining by time
      remainingExpenses.sort((a, b) => getMinutes(a) - getMinutes(b));

      for (let i = 0; i < remainingExpenses.length - 1; i++) {
        const t1 = remainingExpenses[i];
        const t2 = remainingExpenses[i + 1];
        if (usedTxIds.has(t1.id) || usedTxIds.has(t2.id)) continue;

        const diff = Math.abs(getMinutes(t2) - getMinutes(t1));
        if (diff <= 90) {
          const cluster = [t1, t2];
          usedTxIds.add(t1.id);
          usedTxIds.add(t2.id);

          const timeContext = this.getTimeOfDayContext(t1.time, dateStr);
          const totalAmount = cluster.reduce((sum, t) => sum + t.amount, 0);
          const merchants = cluster.map((t) => t.note?.trim() || t.category_name || 'Expense');

          moments.push({
            id: `moment_temp_${t1.id}`,
            date: dateStr,
            title: `${timeContext.label} Outing`,
            emoji: '✨',
            totalAmount,
            transactionCount: cluster.length,
            merchants,
            narrative: `₹${Math.round(totalAmount).toLocaleString('en-IN')} across ${merchants.join(', ')}`,
            transactionIds: cluster.map((t) => t.id),
          });
        }
      }
    }

    return moments;
  },

  /**
   * Generates a full chronological timeline with automated moments and daily journals.
   */
  generateTimeline(
    transactions: TransactionWithDetails[],
    journals: Record<string, DailyJournal> = {}
  ): MemoryDay[] {
    const groupsMap = new Map<string, TransactionWithDetails[]>();

    for (const tx of transactions) {
      if (!groupsMap.has(tx.date)) {
        groupsMap.set(tx.date, []);
      }
      groupsMap.get(tx.date)!.push(tx);
    }

    // Also include any dates that have a journal entry even if no transactions
    for (const dateKey of Object.keys(journals)) {
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, []);
      }
    }

    const sortedDates = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return sortedDates.map((dateStr) => {
      const txList = groupsMap.get(dateStr) || [];
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

      let displayDate = dateStr;
      if (dateStr === todayStr) {
        displayDate = `TODAY • ${d} ${dateObj.toLocaleString('en-US', { month: 'short' })}`;
      } else if (dateStr === yesterdayStr) {
        displayDate = `YESTERDAY • ${d} ${dateObj.toLocaleString('en-US', { month: 'short' })}`;
      } else {
        const monthShort = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        displayDate = `${d} ${monthShort} • ${dayOfWeek}`;
      }

      let totalExpense = 0;
      let totalIncome = 0;

      for (const t of txList) {
        if (t.is_temporary) continue;
        if (t.type === 'expense') totalExpense += t.amount;
        if (t.type === 'income') totalIncome += t.amount;
      }

      const moments = this.detectMomentsForDate(dateStr, txList);
      const journal = journals[dateStr] || null;

      return {
        date: dateStr,
        displayDate,
        dayOfWeek,
        journal,
        moments,
        totalExpense,
        totalIncome,
        transactions: txList,
      };
    });
  },
};
