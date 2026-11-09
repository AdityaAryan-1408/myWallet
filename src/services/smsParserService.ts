/**
 * MyWallet — Universal Bank SMS Parser & Staging Service
 * 
 * Accurately parses incoming SMS from Indian Banks (SBI, Indian Bank, Slice,
 * SBI Credit Card, HDFC, ICICI, etc.) into structured transaction drafts.
 * 
 * Features:
 * - Real-time debit (expense) and credit (income) detection
 * - Amount, Bank/Card matching, and Merchant extraction
 * - Staged multi-notification dispatch (each SMS gets its own OS notification)
 * - Tapping one notification dismisses ONLY that notification and pre-fills Add Transaction.
 */

import { SmsStagingRepository } from '@/repositories/smsStagingRepository';
import { AccountRepository } from '@/repositories/accountRepository';
import { CreditCardRepository } from '@/repositories/creditCardRepository';
import { CategoryRepository } from '@/repositories/categoryRepository';
import { NotificationService } from '@/services/notificationService';
import { SmsStagedTransaction, Account, CreditCard } from '@/db/schema';
import { Platform } from 'react-native';

export interface ParsedSmsResult {
  isValid: boolean;
  amount: number;
  type: 'expense' | 'income';
  bankOrCardName: string;
  accountId: string | null;
  creditCardId: string | null;
  categoryId: string | null;
  merchantName: string;
  closingBalance?: number;
}

export const SmsParserService = {
  /**
   * Parse an incoming SMS message text and sender header into structured financial data.
   */
  parseSms(body: string, sender: string = ''): ParsedSmsResult | null {
    if (!body || body.trim().length === 0) return null;

    const lower = body.toLowerCase();
    const upper = body.toUpperCase();

    // ─────────────────────────────────────────────────────────────
    // 1. DETECT TRANSACTION TYPE (Expense vs Income)
    // ─────────────────────────────────────────────────────────────
    const isDebit =
      /\b(debited|debited by|spent|paid|withdrawn|sent|charged|deducted|txn of|purchase of)\b/i.test(body) ||
      body.includes('used for') ||
      body.includes('transfer to');

    const isCredit =
      /\b(credited|credited with|received|deposited|refunded|cashback|added to)\b/i.test(body);

    // If neither or both, try to deduce from context
    let type: 'expense' | 'income' = 'expense';
    if (isCredit && !isDebit) {
      type = 'income';
    } else if (isDebit && !isCredit) {
      type = 'expense';
    } else if (isCredit && isDebit) {
      // Prioritize whichever appears earliest in the text
      const debitIdx = lower.search(/\b(debited|spent|paid|withdrawn)\b/);
      const creditIdx = lower.search(/\b(credited|received|refunded|cashback)\b/);
      type = (creditIdx !== -1 && creditIdx < debitIdx) ? 'income' : 'expense';
    } else {
      // Neither debit nor credit keywords found — likely OTP or marketing SMS
      return null;
    }

    // Filter out OTPs or informational balance inquiries that aren't transactions
    if (/\b(otp|one time password|verification code)\b/i.test(body)) {
      return null;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. EXTRACT AMOUNT
    // ─────────────────────────────────────────────────────────────
    // Formats: Rs 500, Rs. 1,450.50, INR 320.00, ₹ 100, 500.00 INR
    const amountRegexes = [
      /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
      /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr|₹)/i,
    ];

    let amount: number | null = null;
    for (const regex of amountRegexes) {
      const match = body.match(regex);
      if (match && match[1]) {
        const cleaned = match[1].replace(/,/g, '');
        const val = parseFloat(cleaned);
        if (!isNaN(val) && val > 0) {
          amount = val;
          break;
        }
      }
    }

    if (!amount || amount <= 0) {
      return null; // No valid financial amount found
    }

    // ─────────────────────────────────────────────────────────────
    // 3. EXTRACT CLOSING / AVAILABLE BALANCE (if present)
    // ─────────────────────────────────────────────────────────────
    let closingBalance: number | undefined;
    const balMatch = body.match(/(?:bal|balance|avl bal|avail bal|avl lmt)[\s:]*(?:rs\.?|inr|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
    if (balMatch && balMatch[1]) {
      const balVal = parseFloat(balMatch[1].replace(/,/g, ''));
      if (!isNaN(balVal)) {
        closingBalance = balVal;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. MATCH BANK ACCOUNT OR CREDIT CARD
    // ─────────────────────────────────────────────────────────────
    const accounts: Account[] = AccountRepository.getAllActive();
    const creditCards: CreditCard[] = CreditCardRepository.getAllActive();

    let matchedAccountId: string | null = null;
    let matchedCardId: string | null = null;
    let bankOrCardName = 'Bank Account';

    // Check for last4 digits in SMS (e.g. "A/c ending 1234", "Card ending 5678", "A/C *4321")
    const last4Match = body.match(/(?:ending|a\/c|card|acct|no\.?)[\s*xX-]*([0-9]{4})\b/i);
    const last4 = last4Match ? last4Match[1] : null;

    // Check Credit Cards first
    const isCreditCardSms =
      /\b(card|credit card|sbi card|sbicrd|slice card)\b/i.test(body) ||
      sender.toUpperCase().includes('CRD') ||
      sender.toUpperCase().includes('SLICE');

    if (isCreditCardSms && creditCards.length > 0) {
      // 1. Try last4 match
      if (last4) {
        const found = creditCards.find((c) => c.last4 === last4);
        if (found) {
          matchedCardId = found.id;
          bankOrCardName = found.name;
        }
      }

      // 2. Try Slice
      if (!matchedCardId && (upper.includes('SLICE') || sender.toUpperCase().includes('SLICE'))) {
        const sliceCard = creditCards.find((c) =>
          c.name.toLowerCase().includes('slice') || c.issuer.toLowerCase().includes('slice')
        );
        if (sliceCard) {
          matchedCardId = sliceCard.id;
          bankOrCardName = sliceCard.name;
        }
      }

      // 3. Try SBI Card
      if (!matchedCardId && (upper.includes('SBI CARD') || sender.toUpperCase().includes('SBICRD'))) {
        const sbiCard = creditCards.find((c) =>
          c.name.toLowerCase().includes('sbi') || c.issuer.toLowerCase().includes('sbi')
        );
        if (sbiCard) {
          matchedCardId = sbiCard.id;
          bankOrCardName = sbiCard.name;
        }
      }

      // 4. General card name match
      if (!matchedCardId) {
        for (const card of creditCards) {
          if (upper.includes(card.name.toUpperCase()) || upper.includes(card.issuer.toUpperCase())) {
            matchedCardId = card.id;
            bankOrCardName = card.name;
            break;
          }
        }
      }
    }

    // If not matched to a credit card, check bank accounts
    if (!matchedCardId && accounts.length > 0) {
      // 1. Try SBI Account
      if (
        upper.includes('SBI') ||
        upper.includes('STATE BANK') ||
        sender.toUpperCase().includes('SBI') ||
        sender.toUpperCase().includes('SBIN')
      ) {
        const sbiAcc = accounts.find((a) =>
          a.name.toLowerCase().includes('sbi') ||
          (a.institution && a.institution.toLowerCase().includes('sbi'))
        );
        if (sbiAcc) {
          matchedAccountId = sbiAcc.id;
          bankOrCardName = sbiAcc.name;
        } else {
          bankOrCardName = 'SBI Bank';
        }
      }

      // 2. Try Indian Bank
      if (
        !matchedAccountId &&
        (upper.includes('IND BANK') ||
          upper.includes('INDIAN BANK') ||
          upper.includes('INDBNK') ||
          sender.toUpperCase().includes('IND') ||
          sender.toUpperCase().includes('INDIANB'))
      ) {
        const indAcc = accounts.find((a) =>
          a.name.toLowerCase().includes('indian') ||
          a.name.toLowerCase().includes('ind bank') ||
          (a.institution && a.institution.toLowerCase().includes('indian'))
        );
        if (indAcc) {
          matchedAccountId = indAcc.id;
          bankOrCardName = indAcc.name;
        } else {
          bankOrCardName = 'Indian Bank';
        }
      }

      // 3. Try Slice (if used as bank/wallet)
      if (
        !matchedAccountId &&
        (upper.includes('SLICE') || sender.toUpperCase().includes('SLICE'))
      ) {
        const sliceAcc = accounts.find((a) =>
          a.name.toLowerCase().includes('slice') ||
          (a.institution && a.institution.toLowerCase().includes('slice'))
        );
        if (sliceAcc) {
          matchedAccountId = sliceAcc.id;
          bankOrCardName = sliceAcc.name;
        } else {
          bankOrCardName = 'Slice';
        }
      }

      // 4. General account name matching
      if (!matchedAccountId) {
        for (const acc of accounts) {
          if (
            upper.includes(acc.name.toUpperCase()) ||
            (acc.institution && upper.includes(acc.institution.toUpperCase()))
          ) {
            matchedAccountId = acc.id;
            bankOrCardName = acc.name;
            break;
          }
        }
      }

      // Fallback: Primary account
      if (!matchedAccountId) {
        const primary = accounts.find((a) => a.is_primary === 1) || accounts[0];
        if (primary) {
          matchedAccountId = primary.id;
          bankOrCardName = primary.name;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. EXTRACT MERCHANT / COUNTERPARTY
    // ─────────────────────────────────────────────────────────────
    let merchantName = '';
    const merchantPatterns = [
      /(?:transfer to|transferred to|paid to|to vpa|to)\s+([A-Za-z0-9\s&._-]{2,28}?)(?:\s+(?:on|ref|ref no|bal|avl|avail|\.|\n|$))/i,
      /(?:at|towards|info:?)\s+([A-Za-z0-9\s&._-]{2,28}?)(?:\s+(?:on|ref|bal|avl|avail|\.|\n|$))/i,
      /upi\/[0-9]+\/([A-Za-z0-9\s&._-]{2,25})/i,
    ];

    for (const pattern of merchantPatterns) {
      const match = body.match(pattern);
      if (match && match[1]) {
        const m = match[1].trim();
        // Ignore generic words
        if (!['the', 'your', 'account', 'a/c', 'card', 'bank'].includes(m.toLowerCase())) {
          merchantName = m;
          break;
        }
      }
    }

    if (!merchantName) {
      merchantName = type === 'expense' ? `Spent on ${bankOrCardName}` : `Received in ${bankOrCardName}`;
    }

    // ─────────────────────────────────────────────────────────────
    // 6. SUGGEST CATEGORY
    // ─────────────────────────────────────────────────────────────
    const categories = CategoryRepository.getAll();
    let suggestedCategoryId: string | null = null;

    const lowerMerchant = merchantName.toLowerCase();
    if (/swiggy|zomato|starbucks|mcdonald|food|dining|restaurant|domino|cafe|burger/i.test(lowerMerchant)) {
      suggestedCategoryId = categories.find((c) => c.name.toLowerCase().includes('food'))?.id || null;
    } else if (/uber|ola|rapido|metro|petrol|fuel|shell|hpcl|bpcl|transport/i.test(lowerMerchant)) {
      suggestedCategoryId = categories.find((c) => c.name.toLowerCase().includes('transport') || c.name.toLowerCase().includes('fuel'))?.id || null;
    } else if (/amazon|flipkart|myntra|zara|h&m|shopping|retail|store|mart/i.test(lowerMerchant)) {
      suggestedCategoryId = categories.find((c) => c.name.toLowerCase().includes('shopping'))?.id || null;
    } else if (/bescom|electricity|airtel|jio|vi|broadband|water|gas|bill/i.test(lowerMerchant)) {
      suggestedCategoryId = categories.find((c) => c.name.toLowerCase().includes('bills') || c.name.toLowerCase().includes('utility'))?.id || null;
    } else if (type === 'income') {
      suggestedCategoryId = categories.find((c) => c.type === 'income')?.id || null;
    }

    if (!suggestedCategoryId) {
      const defaultExpense = categories.find((c) => c.type === 'expense' && c.is_active === 1);
      suggestedCategoryId = defaultExpense?.id || null;
    }

    return {
      isValid: true,
      amount,
      type,
      bankOrCardName,
      accountId: matchedAccountId,
      creditCardId: matchedCardId,
      categoryId: suggestedCategoryId,
      merchantName,
      closingBalance,
    };
  },

  /**
   * Processes an incoming SMS:
   * 1. Parses SMS
   * 2. Stages into SQLite database
   * 3. Dispatches a distinct OS push notification with its own ID (preserving multiple notifications!)
   */
  async processIncomingSms(body: string, sender: string = 'BANK'): Promise<SmsStagedTransaction | null> {
    const parsed = this.parseSms(body, sender);
    if (!parsed) return null;

    const stagedId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notificationId = `sms_notif_${stagedId}`;
    const now = new Date().toISOString();

    const staged: SmsStagedTransaction = {
      id: stagedId,
      sender,
      raw_body: body,
      amount: parsed.amount,
      type: parsed.type,
      account_id: parsed.accountId,
      credit_card_id: parsed.creditCardId,
      category_id: parsed.categoryId,
      merchant_name: parsed.merchantName,
      notification_id: notificationId,
      status: 'pending',
      received_at: now,
    };

    // Stage in SQLite
    SmsStagingRepository.create(staged);

    // Dispatch distinct OS notification
    try {
      if (Platform.OS !== 'web') {
        const title = `₹${parsed.amount.toLocaleString('en-IN')} ${
          parsed.type === 'expense' ? 'spent' : 'received'
        } on ${parsed.bankOrCardName}`;

        const bodyText = `${parsed.merchantName ? `${parsed.merchantName} • ` : ''}Tap to review & add to ledger`;

        await NotificationService.scheduleCustomNotification({
          identifier: notificationId, // Explicit unique identifier so multiple SMS notifications coexist!
          title,
          body: bodyText,
          data: {
            type: 'staged_sms',
            stagedId: staged.id,
            txType: staged.type,
            amount: staged.amount,
            accountId: staged.account_id,
            creditCardId: staged.credit_card_id,
            categoryId: staged.category_id,
            note: parsed.merchantName,
            notificationId,
          },
        });
      }
    } catch (notifErr) {
      console.warn('Failed to schedule SMS notification:', notifErr);
    }

    return staged;
  },
};
