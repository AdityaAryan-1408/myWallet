/**
 * MyWallet — Database Seeder
 * 
 * Populates initial default categories, sample accounts, credit cards,
 * reservations, and sample transaction history.
 */

export interface SeedData {
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'income';
    display_order: number;
    parent_id?: string | null;
  }>;
  accounts: Array<{
    id: string;
    name: string;
    type: 'bank' | 'cash';
    balance: number;
    institution: string;
    currency: string;
    is_primary: number;
    display_order: number;
  }>;
  creditCards: Array<{
    id: string;
    name: string;
    issuer: string;
    credit_limit: number;
    cycle_reset_day: number;
    payment_due_day?: number;
    last4: string;
    color: string;
  }>;
  reservations: Array<{
    id: string;
    name: string;
    amount: number;
    target_amount: number;
    affects_available: number;
    note: string;
  }>;
  transactions: Array<{
    id: string;
    type: 'income' | 'expense' | 'transfer';
    amount: number;
    account_id?: string | null;
    credit_card_id?: string | null;
    category_id?: string | null;
    date: string;
    time: string;
    note: string;
  }>;
  debts: Array<{
    id: string;
    person_name: string;
    amount: number;
    direction: 'i_owe' | 'they_owe';
    reason: string;
  }>;
  budgets: Array<{
    id: string;
    category_id: string;
    amount: number;
    period: 'monthly';
  }>;
}

export const SEED_DATA: SeedData = {
  categories: [
    // Expense Categories
    { id: 'cat_food', name: 'Food & Dining', icon: 'Utensils', color: '#FF6B6B', type: 'expense', display_order: 1 },
    { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingBag', color: '#FF6B6B', type: 'expense', display_order: 2, parent_id: 'cat_food' },
    { id: 'cat_dining', name: 'Restaurants & Cafe', icon: 'Coffee', color: '#FF6B6B', type: 'expense', display_order: 3, parent_id: 'cat_food' },

    { id: 'cat_transport', name: 'Transportation', icon: 'Car', color: '#6BCB77', type: 'expense', display_order: 4 },
    { id: 'cat_fuel', name: 'Fuel', icon: 'Fuel', color: '#6BCB77', type: 'expense', display_order: 5, parent_id: 'cat_transport' },
    { id: 'cat_transit', name: 'Public Transit / Cab', icon: 'Bus', color: '#6BCB77', type: 'expense', display_order: 6, parent_id: 'cat_transport' },

    { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#FFD93D', type: 'expense', display_order: 7 },
    { id: 'cat_bills', name: 'Bills & Utilities', icon: 'Zap', color: '#FF8C32', type: 'expense', display_order: 8 },
    { id: 'cat_entertainment', name: 'Entertainment', icon: 'Film', color: '#4D96FF', type: 'expense', display_order: 9 },
    { id: 'cat_health', name: 'Health & Medical', icon: 'HeartPulse', color: '#00C9A7', type: 'expense', display_order: 10 },
    { id: 'cat_education', name: 'Education', icon: 'GraduationCap', color: '#845EC2', type: 'expense', display_order: 11 },
    { id: 'cat_travel', name: 'Travel', icon: 'Plane', color: '#00B8D4', type: 'expense', display_order: 12 },
    { id: 'cat_personal', name: 'Personal Care', icon: 'Sparkles', color: '#FF6F91', type: 'expense', display_order: 13 },
    { id: 'cat_subs', name: 'Subscriptions', icon: 'Repeat', color: '#C34A36', type: 'expense', display_order: 14 },
    { id: 'cat_gifts', name: 'Gifts & Donations', icon: 'Gift', color: '#FFC75F', type: 'expense', display_order: 15 },
    { id: 'cat_other_exp', name: 'Other Expense', icon: 'HelpCircle', color: '#8F937A', type: 'expense', display_order: 16 },

    // Income Categories
    { id: 'cat_salary', name: 'Salary', icon: 'Briefcase', color: '#00E676', type: 'income', display_order: 17 },
    { id: 'cat_freelance', name: 'Freelance / Projects', icon: 'Laptop', color: '#00F0FF', type: 'income', display_order: 18 },
    { id: 'cat_investments', name: 'Investments & Dividends', icon: 'TrendingUp', color: '#A855F7', type: 'income', display_order: 19 },
    { id: 'cat_gift_inc', name: 'Gift / Allowance', icon: 'Gift', color: '#FFD93D', type: 'income', display_order: 20 },
    { id: 'cat_refund', name: 'Refund & Cashback', icon: 'RotateCcw', color: '#7DF4FF', type: 'income', display_order: 21 },
    { id: 'cat_other_inc', name: 'Other Income', icon: 'PlusCircle', color: '#A8DADC', type: 'income', display_order: 22 },
  ],

  // Accounts totaling ₹31,114
  accounts: [
    { id: 'acc_sbi', name: 'SBI Savings', type: 'bank', balance: 23180, institution: 'State Bank of India', currency: 'INR', is_primary: 1, display_order: 1 },
    { id: 'acc_hdfc', name: 'HDFC Salary', type: 'bank', balance: 6500, institution: 'HDFC Bank', currency: 'INR', is_primary: 0, display_order: 2 },
    { id: 'acc_cash', name: 'Physical Cash', type: 'cash', balance: 1434, institution: 'Wallet', currency: 'INR', is_primary: 0, display_order: 3 },
  ],

  // Credit cards totaling ₹24,680 outstanding
  creditCards: [
    { id: 'card_hdfc', name: 'HDFC Millennia', issuer: 'HDFC Bank', credit_limit: 150000, cycle_reset_day: 20, payment_due_day: 10, last4: '4092', color: '#1E3A8A' },
    { id: 'card_icici', name: 'Amazon Pay ICICI', issuer: 'ICICI Bank', credit_limit: 100000, cycle_reset_day: 12, payment_due_day: 2, last4: '8821', color: '#7C2D12' },
  ],

  // Reservations totaling ₹4,500
  reservations: [
    { id: 'res_emergency', name: 'Emergency Reserve', amount: 4000, target_amount: 50000, affects_available: 1, note: 'Strict emergency buffer' },
    { id: 'res_bike', name: 'Bike Service', amount: 500, target_amount: 3000, affects_available: 1, note: 'Due next month' },
  ],

  // Initial recent transactions
  transactions: [
    { id: 'tx_1', type: 'income', amount: 12500, account_id: 'acc_hdfc', category_id: 'cat_salary', date: '2026-09-01', time: '10:00:00', note: 'Monthly Salary Credit' },
    { id: 'tx_2', type: 'expense', amount: 1420, account_id: 'acc_sbi', category_id: 'cat_food', date: '2026-09-18', time: '18:30:00', note: 'Weekly Grocery Restock' },
    { id: 'tx_3', type: 'expense', amount: 280, account_id: 'acc_cash', category_id: 'cat_transport', date: '2026-09-18', time: '21:15:00', note: 'Auto rickshaw to office' },
    { id: 'tx_4', type: 'expense', amount: 850, credit_card_id: 'card_icici', category_id: 'cat_shopping', date: '2026-09-17', time: '14:20:00', note: 'Amazon essentials' },
    { id: 'tx_5', type: 'expense', amount: 670, account_id: 'acc_sbi', category_id: 'cat_bills', date: '2026-09-15', time: '11:00:00', note: 'Broadband bill' },
  ],

  // Sample unsettled debts
  debts: [
    { id: 'debt_1', person_name: 'Rahul Sharma', amount: 450, direction: 'they_owe', reason: 'Split dinner bill at Dominoes' },
    { id: 'debt_2', person_name: 'Aman Verma', amount: 200, direction: 'i_owe', reason: 'Chai & snacks' },
  ],

  // Monthly category budgets
  budgets: [
    { id: 'bgt_food', category_id: 'cat_food', amount: 600, period: 'monthly' },
    { id: 'bgt_transport', category_id: 'cat_transport', amount: 400, period: 'monthly' },
    { id: 'bgt_entertainment', category_id: 'cat_entertainment', amount: 250, period: 'monthly' },
    { id: 'bgt_shopping', category_id: 'cat_shopping', amount: 800, period: 'monthly' },
    { id: 'bgt_bills', category_id: 'cat_bills', amount: 700, period: 'monthly' },
  ],
};
