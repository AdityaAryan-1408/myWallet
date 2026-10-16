/**
 * MyWallet — AI Co-Pilot Service Layer
 *
 * Implements native Google Gemini 2.5 Flash Tool Use (Function Calling)
 * with multi-turn tool loops, fallback support, and offline resilience.
 */

import { SettingsRepository } from '@/repositories/settingsRepository';
import { GEMINI_TOOL_DECLARATIONS, executeAiTool } from './aiTools';
import { useFinancialStore } from '@/stores/financialStore';

const SYSTEM_INSTRUCTION = `You are MyWallet Co-Pilot, an elite, highly precise personal financial advisor built into the MyWallet app.
CRITICAL RULES:
1. NEVER guess, make up, or hallucinate financial numbers, account balances, or budgets.
2. ALWAYS call the provided tools (such as get_available_to_spend, get_budget_status, get_daily_safe_pace, simulate_purchase) to fetch real local numbers before answering.
3. Always format currency in Indian Rupees with ₹ (e.g., ₹500, ₹4,200).
4. If the user asks a quick simple factual question (e.g., "What is my balance?"), keep the response crisp and direct.
5. If the user asks a strategic or situational decision question (e.g., "Should I buy ₹500 food considering I have 3 tight days..."), provide structured reasoning:
   - Give the exact 3-day or remaining daily pace impact.
   - Contrast budget remaining vs total cash.
   - Give a clear, actionable verdict.
6. If the user commands to log/record a transaction (e.g. "Log ₹20 on SBI tagged Chai"), call the prefill_transaction tool with the parsed fields.
7. Do not include markdown code block backticks around your financial explanations. Keep it clean and readable.`;

export interface FinancialCardData {
  title: string;
  mainAmount: number;
  progressBarPercent?: number;
  remainingPool?: number;
  safeDailyPace?: number;
  cushionText?: string;
  prefillAmount?: number;
  prefillNote?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  telemetry?: string;
  financialCard?: FinancialCardData;
  prefillData?: {
    amount: number;
    type?: string;
    account?: string;
    category?: string;
    note?: string;
  };
}

export interface AiResponseResult {
  text: string;
  telemetry?: string;
  financialCard?: FinancialCardData;
  prefillData?: {
    amount: number;
    type?: string;
    account?: string;
    category?: string;
    note?: string;
  };
}

export const DEFAULT_CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

/**
 * Safe fetch wrapper with timeout (35s for mobile networks)
 */
async function fetchWithTimeout(url: string, options: any, timeoutMs = 35000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Queries Google's /models endpoint to discover the best active Flash model
 * supported by this specific API key.
 */
export async function detectBestGeminiModel(apiKey: string): Promise<string> {
  const cleanKey = apiKey.trim();
  try {
    const listRes = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`,
      { method: 'GET' },
      6000
    );
    if (listRes.ok) {
      const data = await listRes.json();
      const modelsList: Array<{ name: string; supportedGenerationMethods?: string[] }> =
        data?.models || [];

      for (const pref of DEFAULT_CANDIDATE_MODELS) {
        const found = modelsList.find(
          (m) =>
            m.name.includes(pref) &&
            (!m.supportedGenerationMethods ||
              m.supportedGenerationMethods.includes('generateContent'))
        );
        if (found) {
          const modelId = found.name.replace(/^models\//, '');
          SettingsRepository.set('ai_active_model_name', modelId);
          return modelId;
        }
      }

      // Any flash model supporting generateContent
      const anyFlash = modelsList.find(
        (m) =>
          m.name.toLowerCase().includes('flash') &&
          (!m.supportedGenerationMethods ||
            m.supportedGenerationMethods.includes('generateContent'))
      );
      if (anyFlash) {
        const modelId = anyFlash.name.replace(/^models\//, '');
        SettingsRepository.set('ai_active_model_name', modelId);
        return modelId;
      }
    }
  } catch (e) {
    // network or parse issue — gracefully proceed to defaults
  }

  return SettingsRepository.get('ai_active_model_name', 'gemini-3.8-flash');
}

// ─── Test Gemini API Key ────────────────────────────────────────────────────────

export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; latencyMs?: number; modelUsed?: string; error?: string }> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { success: false, error: 'API key is too short or invalid.' };
  }

  const cleanKey = apiKey.trim();
  const start = Date.now();

  try {
    // 1. Discover best available model or prioritize gemini-3.8-flash
    const candidateList = ['gemini-3.8-flash', 'gemini-3.5-flash', ...DEFAULT_CANDIDATE_MODELS];
    const uniqueCandidates = Array.from(new Set(candidateList));

    let lastError = '';

    for (const modelToTest of uniqueCandidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}:generateContent?key=${cleanKey}`;
        const response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Respond with exactly: OK' }] }],
          }),
        }, 8000);

        const latencyMs = Date.now() - start;

        if (response.ok) {
          SettingsRepository.set('ai_active_model_name', modelToTest);
          return { success: true, latencyMs, modelUsed: modelToTest };
        } else {
          const errJson = await response.json().catch(() => ({}));
          lastError = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

          // If the key itself is invalid or suspended, exit early
          if (
            lastError.toLowerCase().includes('api_key_invalid') ||
            lastError.toLowerCase().includes('api key not valid') ||
            (response.status === 400 && lastError.toLowerCase().includes('key'))
          ) {
            return { success: false, error: lastError };
          }
        }
      } catch (reqErr: any) {
        lastError = reqErr?.message || 'Network error';
      }
    }

    return { success: false, error: lastError || 'Could not connect to Gemini models.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network request failed' };
  }
}

// ─── Main Conversation Engine ───────────────────────────────────────────────────

export async function askAiCoPilot(
  prompt: string,
  onTelemetryUpdate?: (status: string) => void
): Promise<AiResponseResult> {
  const primaryKey = SettingsRepository.get('ai_gemini_api_key', '').trim();
  const fallbackKey = SettingsRepository.get('ai_fallback_api_key', '').trim();

  // If no API key configured, use local offline engine
  if (!primaryKey && !fallbackKey) {
    return runOfflineFallback(prompt);
  }

  const activeKey = primaryKey || fallbackKey;

  try {
    onTelemetryUpdate?.('Connecting to Gemini Flash...');
    return await executeGeminiTurn(activeKey, prompt, onTelemetryUpdate);
  } catch (err: any) {
    console.warn('[AI Co-Pilot] Primary failed:', err?.message);

    // Try fallback key if available and different
    if (fallbackKey && fallbackKey !== activeKey) {
      try {
        onTelemetryUpdate?.('Switching to fallback key...');
        return await executeGeminiTurn(fallbackKey, prompt, onTelemetryUpdate);
      } catch (fallbackErr: any) {
        console.warn('[AI Co-Pilot] Fallback also failed:', fallbackErr?.message);
      }
    }

    // Gracefully degrade to offline local engine
    onTelemetryUpdate?.('Falling back to local calculation engine...');
    const offlineResult = runOfflineFallback(prompt);
    const reason = err?.message?.toLowerCase().includes('cancel') || err?.message?.toLowerCase().includes('timeout')
      ? 'Cellular Latency Timeout'
      : 'Network Glitch';
    return {
      ...offlineResult,
      telemetry: `Offline Fallback (${reason}) ⚠️`,
    };
  }
}

function buildDynamicSystemInstruction(): string {
  const store = useFinancialStore.getState();
  const cats = store.categorySpends
    .slice(0, 6)
    .map((c) => `${c.categoryName}: ₹${c.total.toLocaleString('en-IN')}`)
    .join(', ');

  return `You are MyWallet Co-Pilot, an elite, highly intelligent personal financial advisor and spending strategist built into MyWallet.

CURRENT REAL-TIME FINANCIAL STATE (verified from local on-device SQLite):
- Available to Spend (Liquid Buffer): ₹${store.availableToSpend.toLocaleString('en-IN')}
- Safe Daily Pacing Limit: ₹${store.dailySpendLimit.toLocaleString('en-IN')}/day
- Days Remaining in Current Cycle: ${store.daysRemainingInMonth} days
- Total Bank & Cash Balances: ₹${store.totalBankCashBalance.toLocaleString('en-IN')}
- Total Outstanding Credit Dues: ₹${store.totalCreditObligations.toLocaleString('en-IN')}
- Total Reserved Money: ₹${store.totalReservedMoney.toLocaleString('en-IN')}
- Monthly Income: ₹${store.monthlyTotals.income.toLocaleString('en-IN')}
- Monthly Expenses: ₹${store.monthlyTotals.expense.toLocaleString('en-IN')}
- Top Spending Categories: ${cats || 'None recorded yet'}

RESPONSE PERSONA & CORE MANDATES:
1. DEPTH, SUBSTANCE & OPINION (CRITICAL):
   - You are a proactive, insightful personal financial partner, NOT an abrupt calculator.
   - You MUST share a strong, clear OPINION and financial judgment. Weigh short-term gratification vs short-term stress, vulnerability, and necessity.
   - When the user asks a situational spending question (e.g., buying food today vs going home in 3 days):
     * Take a decisive, empathetic STAND (e.g., **Proceed with caution — it's a tight squeeze.** or **Hold off — avoid the 72-hour stress trap.**).
     * Calculate and present the exact numbers for their specific timeframe (e.g. ₹500 across 3 days leaves ₹166/day, cutting their liquid balance from ₹1,000 to ₹500).
     * Analyze the vulnerability and risks of having only ₹500 left in liquid cash if any minor emergency occurs before they reach home.
     * Offer smart, actionable compromises (e.g. Option A: A satisfying comfort meal for ₹200 preserving ₹800; Option B: Hold off and celebrate once home; Option C: How to strictly manage the remaining ₹500).
2. STRUCTURE & TYPOGRAPHY:
   - Begin with a bold verdict statement.
   - Use descriptive Markdown section headings like "### The 3-Day Runway Math", "### Vulnerability & Risk Assessment", "### Smart Strategic Alternatives".
   - ALWAYS write full explanatory paragraphs and bullet points under each heading. NEVER leave an empty heading.
   - Do NOT output raw horizontal rules ("---").
   - Always format currency in Indian Rupees with ₹ (e.g., ₹500, ₹1,000).
3. TRANSACTION LOGS: If the user commands to record or log a transaction (e.g. "Log ₹20 on Chai"), call prefill_transaction.`;
}

function extractFinancialCard(
  prompt: string,
  replyText: string,
  prefillData?: any
): FinancialCardData | undefined {
  const store = useFinancialStore.getState();
  const lowerPrompt = prompt.toLowerCase();
  const lowerReply = replyText.toLowerCase();

  // Afford / spend simulation (e.g. "spend 500", "afford 850", "buy 500 rs", "500 rs food")
  const matchAmount = prompt.match(/(?:spend|buy|afford|order|pay)\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
    prompt.match(/(\d+)\s*(?:rs|rupees)/i) ||
    prompt.match(/(?:rs\.?|₹)\s*(\d+)/i);

  if (matchAmount) {
    const amount = parseInt(matchAmount[1], 10);
    const newAvail = Math.max(0, store.availableToSpend - amount);

    // Check if user specified a timeframe like "in 3 days", "for 3 days", "next 5 days"
    const matchDays = prompt.match(/(?:in|for|next)\s*(\d+)\s*days?/i);
    const timeframeDays = matchDays ? parseInt(matchDays[1], 10) : undefined;

    let title = 'SAFE OUTFLOW POOL';
    let safeDailyPace = Math.round(newAvail / (store.daysRemainingInMonth || 1));
    let cushionText = '';

    if (timeframeDays && timeframeDays > 0 && timeframeDays <= 31) {
      title = `${timeframeDays}-DAY RUNWAY IMPACT`;
      safeDailyPace = Math.round(newAvail / timeframeDays);
      const originalWindowPace = Math.round(store.availableToSpend / timeframeDays);
      cushionText = `Leaves ₹${safeDailyPace}/day for next ${timeframeDays} days (vs ₹${originalWindowPace}/day without spend)`;
    } else {
      cushionText = amount <= store.availableToSpend * 0.5
        ? `Safe buffer of ₹${safeDailyPace}/day preserved for remaining ${store.daysRemainingInMonth} days`
        : `Tight budget: Safe daily pace drops by ₹${Math.max(0, store.dailySpendLimit - safeDailyPace)}/day`;
    }

    const percent = store.availableToSpend > 0
      ? Math.max(10, Math.min(100, Math.round((newAvail / store.availableToSpend) * 100)))
      : 0;

    return {
      title,
      mainAmount: store.availableToSpend,
      progressBarPercent: percent,
      remainingPool: newAvail,
      safeDailyPace,
      cushionText,
      prefillAmount: amount,
      prefillNote: prompt.slice(0, 30),
    };
  }

  // Balance / safe pace inquiry
  if (
    lowerPrompt.includes('balance') ||
    lowerPrompt.includes('available') ||
    lowerPrompt.includes('limit') ||
    lowerPrompt.includes('pace') ||
    lowerReply.includes('available to spend') ||
    lowerReply.includes('safe daily')
  ) {
    const totalLiquid = store.totalBankCashBalance || store.availableToSpend || 1;
    const percent = Math.min(100, Math.round((store.availableToSpend / totalLiquid) * 100));

    return {
      title: 'AVAILABLE TO SPEND',
      mainAmount: store.availableToSpend,
      progressBarPercent: percent > 0 ? percent : 75,
      remainingPool: store.availableToSpend,
      safeDailyPace: store.dailySpendLimit,
      cushionText: `Safe pace of ₹${store.dailySpendLimit}/day across remaining ${store.daysRemainingInMonth} days`,
      prefillAmount: undefined,
    };
  }

  return undefined;
}

// ─── Gemini Function Calling Turn Loop ──────────────────────────────────────────

async function executeGeminiTurn(
  apiKey: string,
  userPrompt: string,
  onTelemetryUpdate?: (status: string) => void
): Promise<AiResponseResult> {
  let modelName = SettingsRepository.get('ai_active_model_name', 'gemini-3.8-flash');
  // Sanitize: ensure valid candidate model
  if (!modelName || !DEFAULT_CANDIDATE_MODELS.includes(modelName)) {
    modelName = 'gemini-3.8-flash';
    SettingsRepository.set('ai_active_model_name', 'gemini-3.8-flash');
  }

  let url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // Turn 1 payload
  const contents: any[] = [
    {
      role: 'user',
      parts: [{ text: userPrompt }],
    },
  ];

  const systemInstructionText = buildDynamicSystemInstruction();

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstructionText }],
    },
    contents,
    tools: [
      {
        function_declarations: GEMINI_TOOL_DECLARATIONS,
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  let res1: Response;
  try {
    res1 = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }, 35000);
  } catch (initialErr: any) {
    // Retry once if cellular data had a temporary hiccup
    try {
      onTelemetryUpdate?.('Re-connecting to Gemini Flash...');
      res1 = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, 35000);
    } catch (retryErr: any) {
      throw new Error(retryErr?.message || initialErr?.message || 'Network timeout');
    }
  }

  // If selected model is not available or 404, try other candidate models
  if (!res1.ok) {
    const errData = await res1.json().catch(() => ({}));
    const errMsg = (errData?.error?.message || '').toLowerCase();
    if (
      errMsg.includes('not available') ||
      errMsg.includes('not supported') ||
      errMsg.includes('not found') ||
      res1.status === 404
    ) {
      for (const candidate of DEFAULT_CANDIDATE_MODELS) {
        if (candidate === modelName) continue;
        const candidateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`;
        try {
          const candidateRes = await fetchWithTimeout(candidateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }, 20000);
          if (candidateRes.ok) {
            modelName = candidate;
            SettingsRepository.set('ai_active_model_name', candidate);
            url = candidateUrl;
            res1 = candidateRes;
            break;
          }
        } catch {}
      }
    }
  }

  if (!res1.ok) {
    const errData = await res1.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${res1.status}`);
  }

  const data1 = await res1.json();
  const candidate = data1?.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  // Check for function calls
  const functionCalls = parts.filter((p: any) => p.functionCall);

  let prefillData: any = null;
  let telemetryLabels: string[] = [];

  if (functionCalls.length > 0) {
    // Model requested local tool calls!
    contents.push({
      role: 'model',
      parts,
    });

    const responseParts: any[] = [];

    for (const fc of functionCalls) {
      const toolName = fc.functionCall.name;
      const toolArgs = fc.functionCall.args || {};

      onTelemetryUpdate?.(`Consulting local ${toolName.replace(/_/g, ' ')}...`);
      telemetryLabels.push(toolName.replace(/^get_/, '').replace(/_/g, ' '));

      if (toolName === 'prefill_transaction') {
        prefillData = {
          amount: toolArgs.amount,
          type: toolArgs.type || 'expense',
          account: toolArgs.account,
          category: toolArgs.category,
          note: toolArgs.note,
        };
      }

      const toolResultJson = await executeAiTool(toolName, toolArgs);
      let parsedObj: any = {};
      try {
        parsedObj = JSON.parse(toolResultJson);
      } catch {
        parsedObj = { content: toolResultJson };
      }

      responseParts.push({
        functionResponse: {
          name: toolName,
          response: parsedObj,
        },
      });
    }

    // Turn 2: Send tool results back to Gemini for final synthesis
    contents.push({
      role: 'user',
      parts: responseParts,
    });

    onTelemetryUpdate?.('Synthesizing financial advice...');

    const res2 = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstructionText }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }, 35000);

    if (!res2.ok) {
      const err2 = await res2.json().catch(() => ({}));
      throw new Error(err2?.error?.message || `Turn 2 HTTP ${res2.status}`);
    }

    const data2 = await res2.json();
    const finalParts = data2?.candidates?.[0]?.content?.parts || [];
    const finalText = finalParts.map((p: any) => p.text || '').join('\n');

    const card = extractFinancialCard(userPrompt, finalText, prefillData);

    return {
      text: finalText.trim() || 'Calculations complete.',
      telemetry: telemetryLabels.length > 0 ? `Checked ${telemetryLabels.join(' • ')} ✓` : undefined,
      financialCard: card,
      prefillData,
    };
  }

  // Model answered directly without tool calls
  const directText = parts.map((p: any) => p.text || '').join('\n');
  const card = extractFinancialCard(userPrompt, directText, prefillData);

  return {
    text: directText.trim() || 'I am ready to help you with your finances.',
    financialCard: card,
    prefillData,
  };
}

// ─── Offline Regex Intent Matcher ───────────────────────────────────────────────

function runOfflineFallback(prompt: string): AiResponseResult {
  const store = useFinancialStore.getState();
  const lower = prompt.toLowerCase();

  // Pattern 1: Balance query
  if (lower.includes('balance') || lower.includes('available') || lower.includes('how much money')) {
    const card = extractFinancialCard(prompt, 'available to spend');
    return {
      text: `**Here is your current status:**\n\n` +
        `• **Available to Spend:** ₹${store.availableToSpend.toLocaleString('en-IN')}\n` +
        `• **Safe Daily Limit:** ₹${store.dailySpendLimit.toLocaleString('en-IN')}/day (for the remaining ${store.daysRemainingInMonth} days of your cycle)\n` +
        `• **Total Liquid Bank:** ₹${store.totalBankCashBalance.toLocaleString('en-IN')}`,
      telemetry: 'Offline Mode: Local Store Read ✓',
      financialCard: card,
    };
  }

  // Pattern 2: Afford / Spend simulation (e.g. "spend 500", "afford 850")
  const matchAmount = prompt.match(/(?:spend|buy|afford|order|pay)\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
    prompt.match(/(\d+)\s*(?:rs|rupees)/i);

  if (matchAmount) {
    const amount = parseInt(matchAmount[1], 10);
    const newAvail = Math.max(0, store.availableToSpend - amount);
    const newPace = Math.round(newAvail / (store.daysRemainingInMonth || 1));
    const isSafe = store.availableToSpend >= amount * 1.5;
    const card = extractFinancialCard(prompt, 'simulation');

    return {
      text: isSafe
        ? `**Yes, comfortably.** Your current safe balance absorbs this without stretching your daily reserve.\n\n` +
          `• Remaining after spend: ₹${newAvail.toLocaleString('en-IN')}\n` +
          `• New daily safe pace: ₹${newPace.toLocaleString('en-IN')}/day (drops from ₹${store.dailySpendLimit}/day)`
        : `**Tight squeeze.** Spending ₹${amount.toLocaleString('en-IN')} leaves you with ₹${newAvail.toLocaleString('en-IN')} ` +
          `across your remaining ${store.daysRemainingInMonth} days (₹${newPace}/day). Proceed with caution.`,
      telemetry: 'Offline Mode: Local Math Simulation ✓',
      financialCard: card,
    };
  }

  // Pattern 3: Log Chai / Transaction
  const logMatch = prompt.match(/log\s*(?:rs\.?|₹)?\s*(\d+)(?:\s*(?:on|for)\s*(\w+))?(?:\s*(?:tag|tagged|note)\s*(.+))?/i);
  if (logMatch) {
    const amount = parseInt(logMatch[1], 10);
    const note = logMatch[3] || logMatch[2] || 'Manual Entry';
    return {
      text: `**Transaction Prepared:**\n\nI've prefilled ₹${amount} (${note}). Tap below to review and save.`,
      telemetry: 'Offline Mode: Form Pre-filler ✓',
      prefillData: {
        amount,
        type: 'expense',
        note,
      },
    };
  }

  return {
    text: `Offline Mode Active.\n\nI can calculate your balance, simulate a purchase (e.g. "Can I spend ₹500?"), or prefill transactions (e.g. "Log ₹20 Chai"). Configure your Gemini API Key in Settings for deep financial reasoning!`,
    telemetry: 'Offline Mode Active',
  };
}
