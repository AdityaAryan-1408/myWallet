/**
 * MyWallet — Merchant & Payee Intelligence Repository
 * 
 * 100% offline heuristic engine that:
 * 1. Analyzes transaction payees/notes to compute top merchant spend, frequency, and categories.
 * 2. Matches merchants against popular Indian merchant perk rules and the user's active credit cards
 *    to surface actionable reward tips (e.g. 5% cashback on Amazon Pay ICICI or HDFC Millennia).
 * 3. Provides quick merchant chips and auto-categorization for high-speed transaction logging.
 */

import { getDatabase } from '@/db/client';
import { CreditCardRepository } from './creditCardRepository';

export interface MerchantRule {
  brand: string;
  aliases: string[];
  defaultCategoryId: string;
  defaultSubcategoryId?: string;
  rewardRules: Array<{
    cardKeywords: string[]; // Card name or issuer keywords that qualify
    tip: string;
    rate: string; // e.g. "5%", "10%"
  }>;
  generalTip: string;
}

export interface PriceDeviationAlert {
  latestAmount: number;
  typicalAmount: number;
  minAmount: number;
  maxAmount: number;
  percentDiff: number;
  message: string;
  isHigher: boolean;
}

export interface MerchantIntelligenceItem {
  name: string;
  brand?: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  transactionCount: number;
  totalSpend: number;
  averageSpend: number;
  medianSpend: number;
  minSpend: number;
  maxSpend: number;
  visitsPerWeek: number;
  lastVisitDate: string | null;
  trend: 'increasing' | 'stable' | 'decreasing';
  deviationAlert?: PriceDeviationAlert | null;
  rewardTip?: string | null;
  recommendedCard?: string | null;
}

export interface MerchantIntelligenceReport {
  merchants: MerchantIntelligenceItem[];
  totalTrackedMerchants: number;
  totalSpendOnMerchants: number;
  topMerchantBySpend: MerchantIntelligenceItem | null;
  mostFrequentMerchant: MerchantIntelligenceItem | null;
  deviationAlerts: MerchantIntelligenceItem[];
}

export interface MerchantSummary {
  name: string;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  transaction_count: number;
  total_spend: number;
  reward_tip?: string | null;
  recommended_card?: string | null;
}

export const KNOWN_MERCHANTS: MerchantRule[] = [
  {
    brand: 'Swiggy',
    aliases: ['swiggy', 'instamart', 'swiggy instamart', 'swiggy gourmet'],
    defaultCategoryId: 'cat_food',
    defaultSubcategoryId: 'cat_dining',
    rewardRules: [
      { cardKeywords: ['swiggy'], tip: '10% cashback on Swiggy HDFC Card', rate: '10%' },
      { cardKeywords: ['airtel', 'axis'], tip: '10% cashback with Airtel Axis Bank', rate: '10%' },
      { cardKeywords: ['millennia', 'hdfc'], tip: '5% cashback with HDFC Millennia', rate: '5%' },
    ],
    generalTip: 'Up to 10% cashback on food delivery cards',
  },
  {
    brand: 'Zomato',
    aliases: ['zomato', 'blinkit', 'zomato gold'],
    defaultCategoryId: 'cat_food',
    defaultSubcategoryId: 'cat_dining',
    rewardRules: [
      { cardKeywords: ['airtel', 'axis'], tip: '10% cashback with Airtel Axis Bank', rate: '10%' },
      { cardKeywords: ['millennia', 'hdfc'], tip: '5% cashback with HDFC Millennia', rate: '5%' },
      { cardKeywords: ['rbl'], tip: 'Edition points on Zomato spends', rate: '5%' },
    ],
    generalTip: 'Up to 10% cashback on food delivery cards',
  },
  {
    brand: 'Amazon',
    aliases: ['amazon', 'amazon.in', 'amazon pay', 'amzn', 'amazon prime'],
    defaultCategoryId: 'cat_shopping',
    rewardRules: [
      { cardKeywords: ['amazon', 'icici'], tip: '5% unlimited cashback with Amazon Pay ICICI', rate: '5%' },
      { cardKeywords: ['millennia', 'hdfc'], tip: '5% cashback with HDFC Millennia', rate: '5%' },
      { cardKeywords: ['simplyclick', 'sbi'], tip: '10X reward points on Amazon with SimplyCLICK', rate: '2.5%' },
    ],
    generalTip: '5% unlimited cashback with co-branded cards',
  },
  {
    brand: 'Flipkart',
    aliases: ['flipkart', 'flipkart internet', 'myntra', 'cleartrip'],
    defaultCategoryId: 'cat_shopping',
    rewardRules: [
      { cardKeywords: ['flipkart', 'axis'], tip: '5% unlimited cashback with Flipkart Axis Bank', rate: '5%' },
      { cardKeywords: ['millennia', 'hdfc'], tip: '5% cashback with HDFC Millennia', rate: '5%' },
    ],
    generalTip: '5% flat cashback with Flipkart Axis card',
  },
  {
    brand: 'Blinkit',
    aliases: ['blinkit', 'grofers'],
    defaultCategoryId: 'cat_food',
    defaultSubcategoryId: 'cat_groceries',
    rewardRules: [
      { cardKeywords: ['millennia', 'hdfc'], tip: '5% cashback with HDFC Millennia', rate: '5%' },
      { cardKeywords: ['airtel', 'axis'], tip: '10% on quick delivery with Airtel Axis', rate: '10%' },
    ],
    generalTip: 'Use quick-commerce cashback cards for 5–10% return',
  },
  {
    brand: 'Uber',
    aliases: ['uber', 'uber trip', 'uber rides', 'uber india'],
    defaultCategoryId: 'cat_transport',
    defaultSubcategoryId: 'cat_transit',
    rewardRules: [
      { cardKeywords: ['millennia', 'hdfc'], tip: '5% cashback with HDFC Millennia', rate: '5%' },
      { cardKeywords: ['axis'], tip: 'Reward points on cab rides', rate: '4%' },
    ],
    generalTip: '5% cashback with online cab transit cards',
  },
  {
    brand: 'Ola',
    aliases: ['ola', 'ola cabs', 'ani technologies'],
    defaultCategoryId: 'cat_transport',
    defaultSubcategoryId: 'cat_transit',
    rewardRules: [
      { cardKeywords: ['sbi', 'simplyclick'], tip: '10X rewards with SBI SimplyCLICK', rate: '2.5%' },
      { cardKeywords: ['ola', 'sbi'], tip: '7% reward points on Ola rides', rate: '7%' },
    ],
    generalTip: 'Bonus points on app rides',
  },
  {
    brand: 'BigBasket',
    aliases: ['bigbasket', 'bb daily', 'bbnow'],
    defaultCategoryId: 'cat_food',
    defaultSubcategoryId: 'cat_groceries',
    rewardRules: [
      { cardKeywords: ['airtel', 'axis'], tip: '10% cashback with Airtel Axis', rate: '10%' },
      { cardKeywords: ['tata', 'neu'], tip: '5% NeuCoins with Tata Neu Plus/Infinity', rate: '5%' },
      { cardKeywords: ['millennia', 'hdfc'], tip: '5% cashback with HDFC Millennia', rate: '5%' },
    ],
    generalTip: '10% off with grocery partnership cards',
  },
  {
    brand: 'Starbucks',
    aliases: ['starbucks', 'tata starbucks'],
    defaultCategoryId: 'cat_food',
    defaultSubcategoryId: 'cat_dining',
    rewardRules: [
      { cardKeywords: ['tata', 'neu'], tip: '5% NeuCoins on Tata Starbucks', rate: '5%' },
      { cardKeywords: ['axis', 'magnus'], tip: 'Bonus dining rewards', rate: '5%' },
    ],
    generalTip: 'Extra rewards on dining category cards',
  },
  {
    brand: 'Netflix',
    aliases: ['netflix', 'spotify', 'hotstar', 'disney'],
    defaultCategoryId: 'cat_subs',
    rewardRules: [
      { cardKeywords: ['millennia', 'hdfc'], tip: '5% cashback on digital subscriptions', rate: '5%' },
    ],
    generalTip: 'Automate via card mandate for reward multipliers',
  },
];

export const MerchantRepository = {
  /**
   * Find brand rule for a given note or merchant text.
   */
  findMerchantRule(text: string): MerchantRule | null {
    if (!text) return null;
    const lower = text.toLowerCase().trim();

    for (const rule of KNOWN_MERCHANTS) {
      if (lower.includes(rule.brand.toLowerCase())) return rule;
      for (const alias of rule.aliases) {
        if (lower.includes(alias.toLowerCase())) return rule;
      }
    }
    return null;
  },

  /**
   * Auto-suggest category for a merchant.
   */
  getSuggestedCategory(merchantName: string): { categoryId: string; subcategoryId?: string } | null {
    const rule = this.findMerchantRule(merchantName);
    if (rule) {
      return {
        categoryId: rule.defaultCategoryId,
        subcategoryId: rule.defaultSubcategoryId,
      };
    }
    return null;
  },

  /**
   * Calculate personalized reward tip based on user's active credit cards.
   */
  getRewardTipForMerchant(
    merchantName: string,
    activeCards?: Array<{ name: string; issuer: string }>,
  ): { tip: string; cardName?: string } | null {
    const rule = this.findMerchantRule(merchantName);
    if (!rule) return null;

    const cards = activeCards || CreditCardRepository.getAllActive();

    // Check user's held cards against merchant rule
    for (const card of cards) {
      const cardText = `${card.name} ${card.issuer}`.toLowerCase();
      for (const reward of rule.rewardRules) {
        const matches = reward.cardKeywords.every((kw) => cardText.includes(kw.toLowerCase()));
        if (matches) {
          return {
            tip: `Use ${card.name} for ${reward.rate} cashback on ${rule.brand}!`,
            cardName: card.name,
          };
        }
      }
    }

    // Default general tip
    return {
      tip: `${rule.brand}: ${rule.generalTip}`,
    };
  },

  /**
   * Aggregates merchant stats by inspecting transaction notes.
   * Also populates known merchants with their historical spend or baseline data.
   */
  getTopMerchants(limit: number = 10): MerchantSummary[] {
    const db = getDatabase();
    const cards = CreditCardRepository.getAllActive();

    // Query distinct transaction notes with counts and sums
    interface TxGroup {
      note: string;
      category_id: string | null;
      cat_name: string | null;
      cat_color: string | null;
      cat_icon: string | null;
      tx_count: number;
      total_amount: number;
    }

    const rows = db.getAllSync<TxGroup>(`
      SELECT 
        t.note,
        t.category_id,
        c.name as cat_name,
        c.color as cat_color,
        c.icon as cat_icon,
        COUNT(t.id) as tx_count,
        SUM(t.amount) as total_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.note IS NOT NULL AND TRIM(t.note) != '' AND t.type = 'expense'
      GROUP BY t.note
      ORDER BY total_amount DESC, tx_count DESC;
    `);

    // Group rows by recognized brand or raw note
    const merchantMap = new Map<string, MerchantSummary>();

    rows.forEach((row) => {
      const rule = this.findMerchantRule(row.note);
      const brandName = rule ? rule.brand : row.note.trim();

      const existing = merchantMap.get(brandName);
      if (existing) {
        existing.transaction_count += row.tx_count;
        existing.total_spend += row.total_amount;
      } else {
        const tipObj = this.getRewardTipForMerchant(brandName, cards);
        merchantMap.set(brandName, {
          name: brandName,
          category_id: row.category_id,
          category_name: row.cat_name || 'General',
          category_color: row.cat_color || '#8F937A',
          category_icon: row.cat_icon || 'ShoppingBag',
          transaction_count: row.tx_count,
          total_spend: row.total_amount,
          reward_tip: tipObj?.tip,
          recommended_card: tipObj?.cardName,
        });
      }
    });

    // If fewer than 4 merchants discovered, fill in from known merchants catalogue with zero transactions
    if (merchantMap.size < 5) {
      for (const rule of KNOWN_MERCHANTS) {
        if (!merchantMap.has(rule.brand)) {
          const tipObj = this.getRewardTipForMerchant(rule.brand, cards);
          merchantMap.set(rule.brand, {
            name: rule.brand,
            category_id: rule.defaultCategoryId,
            category_name: rule.defaultCategoryId === 'cat_food' ? 'Food & Dining' : 'Shopping',
            category_color: rule.defaultCategoryId === 'cat_food' ? '#FF6B6B' : '#FFD93D',
            category_icon: rule.defaultCategoryId === 'cat_food' ? 'Utensils' : 'ShoppingBag',
            transaction_count: 0,
            total_spend: 0,
            reward_tip: tipObj?.tip,
            recommended_card: tipObj?.cardName,
          });
        }
        if (merchantMap.size >= limit) break;
      }
    }

    const list = Array.from(merchantMap.values());
    // Sort primarily by spend, then by transaction count
    list.sort((a, b) => b.total_spend - a.total_spend || b.transaction_count - a.transaction_count);

    return list.slice(0, limit);
  },

  /**
   * Comprehensive Merchant Intelligence & Price Memory Engine:
   * - Spend Leaderboard & visit frequency map
   * - Price deviation detection (compares latest spend to historical average/median)
   * - Credit card reward perk matching
   */
  getMerchantIntelligence(limit: number = 20): MerchantIntelligenceReport {
    const db = getDatabase();
    const cards = CreditCardRepository.getAllActive();

    interface RawTxRow {
      id: string;
      amount: number;
      date: string;
      note: string;
      category_id: string | null;
      cat_name: string | null;
      cat_color: string | null;
      cat_icon: string | null;
    }

    const rows = db.getAllSync<RawTxRow>(`
      SELECT 
        t.id,
        t.amount,
        t.date,
        t.note,
        t.category_id,
        c.name as cat_name,
        c.color as cat_color,
        c.icon as cat_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.note IS NOT NULL AND TRIM(t.note) != '' AND t.type = 'expense'
      ORDER BY t.date DESC, t.time DESC;
    `);

    // Group transactions by recognized brand or raw note
    interface GroupData {
      name: string;
      brand?: string;
      categoryId: string | null;
      categoryName: string;
      categoryColor: string;
      categoryIcon: string;
      amounts: number[];
      dates: string[];
    }

    const groupMap = new Map<string, GroupData>();

    rows.forEach((r) => {
      const cleanNote = r.note.trim();
      const rule = this.findMerchantRule(cleanNote);
      const brandKey = rule ? rule.brand : cleanNote;

      const existing = groupMap.get(brandKey);
      if (existing) {
        existing.amounts.push(r.amount);
        existing.dates.push(r.date);
      } else {
        groupMap.set(brandKey, {
          name: brandKey,
          brand: rule ? rule.brand : undefined,
          categoryId: r.category_id || rule?.defaultCategoryId || null,
          categoryName: r.cat_name || (rule?.defaultCategoryId === 'cat_food' ? 'Food & Dining' : 'Shopping'),
          categoryColor: r.cat_color || '#00F0FF',
          categoryIcon: r.cat_icon || 'ShoppingBag',
          amounts: [r.amount],
          dates: [r.date],
        });
      }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];

    const merchants: MerchantIntelligenceItem[] = [];

    groupMap.forEach((g) => {
      const count = g.amounts.length;
      const totalSpend = g.amounts.reduce((sum, a) => sum + a, 0);
      const averageSpend = Math.round(totalSpend / count);

      // Median spend
      const sorted = [...g.amounts].sort((a, b) => a - b);
      const medianSpend = Math.round(
        count % 2 === 0
          ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
          : sorted[Math.floor(count / 2)]
      );
      const minSpend = sorted[0];
      const maxSpend = sorted[sorted.length - 1];

      // Frequency (Visits per week over last 30 days or active span)
      let recentVisits = 0;
      let prevVisits = 0;
      let recentSpend = 0;
      let prevSpend = 0;

      g.dates.forEach((d, idx) => {
        const amt = g.amounts[idx];
        if (d >= thirtyDaysAgoStr) {
          recentVisits++;
          recentSpend += amt;
        } else if (d >= sixtyDaysAgoStr) {
          prevVisits++;
          prevSpend += amt;
        }
      });

      const visitsPerWeek = recentVisits > 0
        ? Number((recentVisits / 4.2).toFixed(1))
        : count > 0
        ? Number(Math.min(1.0, count / 4).toFixed(1))
        : 0;

      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (recentSpend > prevSpend * 1.15 && prevSpend > 0) {
        trend = 'increasing';
      } else if (recentSpend < prevSpend * 0.85 && prevSpend > 0) {
        trend = 'decreasing';
      }

      // Price Deviation Check:
      // If user has visited at least twice and latest transaction is >= 25% higher than typical
      let deviationAlert: PriceDeviationAlert | null = null;
      if (count >= 2) {
        const latestAmount = g.amounts[0]; // first since ordered by date DESC
        const typical = averageSpend;
        if (latestAmount >= typical * 1.25 && latestAmount - typical >= 50) {
          const percentDiff = Math.round(((latestAmount - typical) / typical) * 100);
          deviationAlert = {
            latestAmount,
            typicalAmount: typical,
            minAmount: minSpend,
            maxAmount: maxSpend,
            percentDiff,
            isHigher: true,
            message: `You usually spend ₹${minSpend.toLocaleString('en-IN')}–₹${maxSpend.toLocaleString('en-IN')} at ${g.name}. Latest ₹${latestAmount.toLocaleString('en-IN')} is ${percentDiff}% higher than average.`,
          };
        }
      }

      const perk = this.getRewardTipForMerchant(g.name, cards);

      merchants.push({
        name: g.name,
        brand: g.brand,
        categoryId: g.categoryId,
        categoryName: g.categoryName,
        categoryColor: g.categoryColor,
        categoryIcon: g.categoryIcon,
        transactionCount: count,
        totalSpend,
        averageSpend,
        medianSpend,
        minSpend,
        maxSpend,
        visitsPerWeek,
        lastVisitDate: g.dates[0] || null,
        trend,
        deviationAlert,
        rewardTip: perk?.tip,
        recommendedCard: perk?.cardName,
      });
    });

    // If fewer than 4 merchants, populate known catalogue
    if (merchants.length < 5) {
      for (const rule of KNOWN_MERCHANTS) {
        if (!groupMap.has(rule.brand)) {
          const perk = this.getRewardTipForMerchant(rule.brand, cards);
          merchants.push({
            name: rule.brand,
            brand: rule.brand,
            categoryId: rule.defaultCategoryId,
            categoryName: rule.defaultCategoryId === 'cat_food' ? 'Food & Dining' : 'Shopping',
            categoryColor: rule.defaultCategoryId === 'cat_food' ? '#FF6B6B' : '#FFD93D',
            categoryIcon: rule.defaultCategoryId === 'cat_food' ? 'Utensils' : 'ShoppingBag',
            transactionCount: 0,
            totalSpend: 0,
            averageSpend: 0,
            medianSpend: 0,
            minSpend: 0,
            maxSpend: 0,
            visitsPerWeek: 0,
            lastVisitDate: null,
            trend: 'stable',
            deviationAlert: null,
            rewardTip: perk?.tip,
            recommendedCard: perk?.cardName,
          });
        }
        if (merchants.length >= limit) break;
      }
    }

    // Sort by spend DESC, then count DESC
    merchants.sort((a, b) => b.totalSpend - a.totalSpend || b.transactionCount - a.transactionCount);

    const totalSpendOnMerchants = merchants.reduce((sum, m) => sum + m.totalSpend, 0);
    const deviationAlerts = merchants.filter((m) => m.deviationAlert !== null && m.deviationAlert !== undefined);
    const topMerchantBySpend = merchants.find((m) => m.totalSpend > 0) || merchants[0] || null;
    const mostFrequent = [...merchants].sort((a, b) => b.transactionCount - a.transactionCount);
    const mostFrequentMerchant = mostFrequent.find((m) => m.transactionCount > 0) || null;

    return {
      merchants: merchants.slice(0, limit),
      totalTrackedMerchants: groupMap.size,
      totalSpendOnMerchants,
      topMerchantBySpend,
      mostFrequentMerchant,
      deviationAlerts,
    };
  },

  /**
   * Quick merchant shortcut presets for Add Transaction chips.
   */
  getQuickMerchantChips(): Array<{ name: string; brand: string; icon: string }> {
    return [
      { name: 'Swiggy', brand: 'Swiggy', icon: 'Utensils' },
      { name: 'Amazon', brand: 'Amazon', icon: 'ShoppingBag' },
      { name: 'Blinkit', brand: 'Blinkit', icon: 'ShoppingBag' },
      { name: 'Zomato', brand: 'Zomato', icon: 'Coffee' },
      { name: 'Uber', brand: 'Uber', icon: 'Car' },
      { name: 'Chai / Tea', brand: 'Chai', icon: 'Coffee' },
      { name: 'Groceries', brand: 'Groceries', icon: 'ShoppingBag' },
      { name: 'Fuel / Petrol', brand: 'Fuel', icon: 'Fuel' },
    ];
  },
};
