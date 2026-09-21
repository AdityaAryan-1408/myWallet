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
