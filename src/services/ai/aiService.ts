/**
 * MyWallet — AI Co-Pilot Service Layer
 *
 * Implements native Google Gemini Flash Tool Use (Function Calling)
 * with robust model auto-discovery, quota-safe connection testing,
 * Groq API dual-engine support, and local offline resilience.
 */

import { SettingsRepository } from '@/repositories/settingsRepository';
import { GEMINI_TOOL_DECLARATIONS, executeAiTool } from './aiTools';
import { useFinancialStore } from '@/stores/financialStore';

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

/**
 * Curated list of high-performance Flash models.
 * Strictly excludes deprecated/legacy models (like gemini-1.5-flash)
 * and non-existent model tags.
 */
export const DEFAULT_CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

export const GROQ_CANDIDATE_MODELS = [
  'qwen/qwen3.6-27b',
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

/**
 * Safe fetch wrapper with timeout
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
 * Helper to transform Gemini tool declarations to OpenAI/Groq JSON schema format
 */
function getGroqTools() {
  return GEMINI_TOOL_DECLARATIONS.map((tool) => {
    const params = tool.parameters
      ? {
          type: 'object',
          properties: Object.entries(tool.parameters.properties || {}).reduce(
            (acc: any, [key, val]: [string, any]) => {
              acc[key] = {
                type: (val.type || 'string').toLowerCase(),
                description: val.description,
              };
              return acc;
            },
            {}
          ),
          required: (tool.parameters as any).required || [],
        }
      : { type: 'object', properties: {} };

    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: params,
      },
    };
  });
}

/**
 * Queries Google's /models endpoint to discover the best active Flash model
 * supported by this specific API key without burning generation quota.
 */
export async function detectBestGeminiModel(apiKey: string): Promise<string> {
  const cleanKey = apiKey.trim();
  const currentSaved = SettingsRepository.get('ai_active_model_name', '');

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

      // If user currently has a valid saved model (non-1.5) that exists, retain it
      if (
        currentSaved &&
        !currentSaved.includes('1.5') &&
        modelsList.some(
          (m) =>
            m.name.replace(/^models\//, '') === currentSaved &&
            (!m.supportedGenerationMethods ||
              m.supportedGenerationMethods.includes('generateContent'))
        )
      ) {
        return currentSaved;
      }

      // Check candidate models in order of priority (excluding 1.5)
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

      // Any flash model supporting generateContent (STRICTLY EXCLUDING gemini-1.5)
      const anyFlash = modelsList.find(
        (m) =>
          m.name.toLowerCase().includes('flash') &&
          !m.name.includes('1.5') &&
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

  // If saved model was 1.5-flash or invalid, reset to gemini-3.5-flash
  if (
    !currentSaved ||
    currentSaved.includes('1.5') ||
    !DEFAULT_CANDIDATE_MODELS.includes(currentSaved)
  ) {
    SettingsRepository.set('ai_active_model_name', 'gemini-3.5-flash');
    return 'gemini-3.5-flash';
  }

  return currentSaved;
}

// ─── Test Groq API Key ──────────────────────────────────────────────────────────

export async function testGroqApiKey(
  apiKey: string
): Promise<{ success: boolean; latencyMs?: number; modelUsed?: string; error?: string }> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { success: false, error: 'Groq API key is too short or invalid.' };
  }

  const cleanKey = apiKey.trim();
  const start = Date.now();

  let lastError = '';
  for (const model of GROQ_CANDIDATE_MODELS) {
    try {
      const response = await fetchWithTimeout(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Respond with exactly: OK' }],
            max_tokens: 10,
          }),
        },
        8000
      );

      const latencyMs = Date.now() - start;

      if (response.ok) {
        SettingsRepository.set('ai_groq_active_model', model);
        return { success: true, latencyMs, modelUsed: `Groq (${model})` };
      }

      const errJson = await response.json().catch(() => ({}));
      const msg = errJson?.error?.message || `HTTP ${response.status}`;

      if (response.status === 401 || msg.toLowerCase().includes('invalid api key')) {
        return { success: false, error: 'Invalid Groq API key.' };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: `Groq rate limit reached for ${model}. Please wait a moment before testing.`,
        };
      }

      lastError = msg;
    } catch (e: any) {
      lastError = e?.message || 'Network timeout';
    }
  }

  return { success: false, error: lastError || 'Could not connect to Groq API.' };
}

// ─── Test Gemini API Key (Quota-Safe) ───────────────────────────────────────────

export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; latencyMs?: number; modelUsed?: string; error?: string }> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { success: false, error: 'API key is too short or invalid.' };
  }

  const cleanKey = apiKey.trim();

  // If user provided a Groq key (starts with 'gsk_'), route to Groq tester
  if (cleanKey.startsWith('gsk_')) {
    return testGroqApiKey(cleanKey);
  }

  const start = Date.now();

  try {
    // Step 1: Use GET /models to validate key and check available models WITHOUT burning generation quota
    let targetModel = SettingsRepository.get('ai_active_model_name', '');
    let availableModels: string[] = [];

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

        availableModels = modelsList
          .filter(
            (m) =>
              !m.name.includes('1.5') && // STRICTLY EXCLUDE 1.5
              (!m.supportedGenerationMethods ||
                m.supportedGenerationMethods.includes('generateContent'))
          )
          .map((m) => m.name.replace(/^models\//, ''));

        // If targetModel is already valid and present in availableModels, keep it
        if (targetModel && !targetModel.includes('1.5') && availableModels.includes(targetModel)) {
          // targetModel is good
        } else {
          // Pick best from DEFAULT_CANDIDATE_MODELS
          const best = DEFAULT_CANDIDATE_MODELS.find((cand) => availableModels.includes(cand));
          targetModel =
            best ||
            availableModels.find((m) => m.includes('flash')) ||
            'gemini-3.5-flash';
        }
      } else {
        const errJson = await listRes.json().catch(() => ({}));
        const errStr = (errJson?.error?.message || '').toLowerCase();
        if (
          errStr.includes('api_key_invalid') ||
          errStr.includes('api key not valid') ||
          listRes.status === 400
        ) {
          return {
            success: false,
            error: 'Invalid Google Gemini API key. Please check your key in Google AI Studio.',
          };
        }
        if (listRes.status === 429) {
          return {
            success: false,
            error: 'Rate limit reached (15 RPM). Please wait 15–20 seconds before testing again.',
          };
        }
      }
    } catch {
      // GET /models failed or timed out; fall back to candidate list
    }

    if (!targetModel || targetModel.includes('1.5')) {
      targetModel = 'gemini-3.5-flash';
    }

    // Step 2: Perform ONE lightweight generation ping to verify the chosen model
    // Ping queue prioritizes targetModel, followed by gemini-2.5-flash
    const pingQueue = [targetModel];
    if (targetModel !== 'gemini-2.5-flash') {
      pingQueue.push('gemini-2.5-flash');
    }

    let lastError = '';

    for (const modelToPing of pingQueue) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToPing}:generateContent?key=${cleanKey}`;
        const response = await fetchWithTimeout(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Respond with exactly: OK' }] }],
            }),
          },
          8000
        );

        const latencyMs = Date.now() - start;

        if (response.ok) {
          SettingsRepository.set('ai_active_model_name', modelToPing);
          return { success: true, latencyMs, modelUsed: modelToPing };
        }

        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;

        // If rate limit (429), STOP immediately! Do not cycle more!
        if (response.status === 429 || errMsg.toLowerCase().includes('resource_exhausted')) {
          SettingsRepository.set('ai_active_model_name', modelToPing);
          return {
            success: false,
            error: `Rate limit reached (15 RPM on Google free tier). Please wait 15–20 seconds before testing again. (Target: ${modelToPing})`,
          };
        }

        if (
          errMsg.toLowerCase().includes('api_key_invalid') ||
          errMsg.toLowerCase().includes('api key not valid')
        ) {
          return { success: false, error: 'Invalid Google Gemini API key.' };
        }

        lastError = errMsg;
      } catch (reqErr: any) {
        lastError = reqErr?.message || 'Network timeout';
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

  // Dispatch based on provider
  const runProvider = async (key: string): Promise<AiResponseResult> => {
    if (key.startsWith('gsk_')) {
      return executeGroqTurn(key, prompt, onTelemetryUpdate);
    }
    return executeGeminiTurn(key, prompt, onTelemetryUpdate);
  };

  try {
    const isGroq = activeKey.startsWith('gsk_');
    onTelemetryUpdate?.(isGroq ? 'Connecting to Groq...' : 'Connecting to Gemini Flash...');
    return await runProvider(activeKey);
  } catch (err: any) {
    console.warn('[AI Co-Pilot] Primary failed:', err?.message);

    // Try fallback key if available and different
    if (fallbackKey && fallbackKey !== activeKey) {
      try {
        const isFallbackGroq = fallbackKey.startsWith('gsk_');
        onTelemetryUpdate?.(
          isFallbackGroq ? 'Switching to Groq fallback...' : 'Switching to secondary key...'
        );
        return await runProvider(fallbackKey);
      } catch (fallbackErr: any) {
        console.warn('[AI Co-Pilot] Fallback also failed:', fallbackErr?.message);
      }
    }

    // Gracefully degrade to offline local engine
    onTelemetryUpdate?.('Falling back to local calculation engine...');
    const offlineResult = runOfflineFallback(prompt);
    const isRateLimit =
      err?.message?.toLowerCase().includes('rate') ||
      err?.message?.toLowerCase().includes('429') ||
      err?.message?.toLowerCase().includes('resource_exhausted');
    const reason = isRateLimit
      ? '15 RPM Rate Limit'
      : err?.message?.toLowerCase().includes('timeout')
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
  const matchAmount =
    prompt.match(/(?:spend|buy|afford|order|pay)\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
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
      cushionText =
        amount <= store.availableToSpend * 0.5
          ? `Safe buffer of ₹${safeDailyPace}/day preserved for remaining ${store.daysRemainingInMonth} days`
          : `Tight budget: Safe daily pace drops by ₹${Math.max(
              0,
              store.dailySpendLimit - safeDailyPace
            )}/day`;
    }

    const percent =
      store.availableToSpend > 0
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
  let modelName = SettingsRepository.get('ai_active_model_name', 'gemini-3.5-flash');

  // Sanitize: ensure valid candidate model (and strictly avoid 1.5)
  if (!modelName || modelName.includes('1.5') || !DEFAULT_CANDIDATE_MODELS.includes(modelName)) {
    modelName = 'gemini-3.5-flash';
    SettingsRepository.set('ai_active_model_name', 'gemini-3.5-flash');
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
    res1 = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
      35000
    );
  } catch (initialErr: any) {
    try {
      onTelemetryUpdate?.('Re-connecting to Gemini Flash...');
      res1 = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        },
        35000
      );
    } catch (retryErr: any) {
      throw new Error(retryErr?.message || initialErr?.message || 'Network timeout');
    }
  }

  // If selected model is not available or 404, fallback to other candidate models (excluding 1.5)
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
          const candidateRes = await fetchWithTimeout(
            candidateUrl,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            },
            20000
          );
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
  const telemetryLabels: string[] = [];

  if (functionCalls.length > 0) {
    // Model requested local tool calls
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
    // In Gemini REST API v1beta, function responses must use role: 'function'
    contents.push({
      role: 'function',
      parts: responseParts,
    });

    onTelemetryUpdate?.('Synthesizing financial advice...');

    const res2 = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      },
      35000
    );

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
      telemetry:
        telemetryLabels.length > 0 ? `Checked ${telemetryLabels.join(' • ')} ✓` : undefined,
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

// ─── Groq API Engine (OpenAI-Compatible Tool Calling) ───────────────────────────

async function executeGroqTurn(
  apiKey: string,
  userPrompt: string,
  onTelemetryUpdate?: (status: string) => void
): Promise<AiResponseResult> {
  const modelName = SettingsRepository.get('ai_groq_active_model', 'qwen/qwen3.6-27b');
  const systemInstructionText = buildDynamicSystemInstruction();
  const groqTools = getGroqTools();

  const messages: any[] = [
    { role: 'system', content: systemInstructionText },
    { role: 'user', content: userPrompt },
  ];

  onTelemetryUpdate?.(`Connecting to Groq (${modelName})...`);

  const res1 = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        tools: groqTools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 2048,
      }),
    },
    25000
  );

  if (!res1.ok) {
    const errData = await res1.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Groq HTTP ${res1.status}`);
  }

  const data1 = await res1.json();
  const choice = data1?.choices?.[0];
  const msg = choice?.message;

  if (msg?.tool_calls && msg.tool_calls.length > 0) {
    messages.push(msg);
    let prefillData: any = null;
    const telemetryLabels: string[] = [];

    for (const tc of msg.tool_calls) {
      const toolName = tc.function.name;
      let toolArgs: any = {};
      try {
        toolArgs = JSON.parse(tc.function.arguments || '{}');
      } catch {}

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

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: toolResultJson,
      });
    }

    onTelemetryUpdate?.('Synthesizing financial advice via Groq...');

    const res2 = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      },
      25000
    );

    if (!res2.ok) {
      const err2 = await res2.json().catch(() => ({}));
      throw new Error(err2?.error?.message || `Groq Turn 2 HTTP ${res2.status}`);
    }

    const data2 = await res2.json();
    const replyText = data2?.choices?.[0]?.message?.content || '';
    const card = extractFinancialCard(userPrompt, replyText, prefillData);

    return {
      text: replyText.trim() || 'Calculations complete.',
      telemetry:
        telemetryLabels.length > 0
          ? `Groq (${modelName}) • Checked ${telemetryLabels.join(' • ')} ✓`
          : `Groq (${modelName})`,
      financialCard: card,
      prefillData,
    };
  }

  // Direct response
  const replyText = msg?.content || '';
  const card = extractFinancialCard(userPrompt, replyText);
  return {
    text: replyText.trim() || 'I am ready to help you with your finances.',
    telemetry: `Groq (${modelName})`,
    financialCard: card,
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
      text:
        `**Here is your current status:**\n\n` +
        `• **Available to Spend:** ₹${store.availableToSpend.toLocaleString('en-IN')}\n` +
        `• **Safe Daily Limit:** ₹${store.dailySpendLimit.toLocaleString(
          'en-IN'
        )}/day (for the remaining ${store.daysRemainingInMonth} days of your cycle)\n` +
        `• **Total Liquid Bank:** ₹${store.totalBankCashBalance.toLocaleString('en-IN')}`,
      telemetry: 'Offline Mode: Local Store Read ✓',
      financialCard: card,
    };
  }

  // Pattern 2: Afford / Spend simulation (e.g. "spend 500", "afford 850")
  const matchAmount =
    prompt.match(/(?:spend|buy|afford|order|pay)\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
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
          `• New daily safe pace: ₹${newPace.toLocaleString('en-IN')}/day (drops from ₹${
            store.dailySpendLimit
          }/day)`
        : `**Tight squeeze.** Spending ₹${amount.toLocaleString(
            'en-IN'
          )} leaves you with ₹${newAvail.toLocaleString('en-IN')} ` +
          `across your remaining ${store.daysRemainingInMonth} days (₹${newPace}/day). Proceed with caution.`,
      telemetry: 'Offline Mode: Local Math Simulation ✓',
      financialCard: card,
    };
  }

  // Pattern 3: Log Chai / Transaction
  const logMatch = prompt.match(
    /log\s*(?:rs\.?|₹)?\s*(\d+)(?:\s*(?:on|for)\s*(\w+))?(?:\s*(?:tag|tagged|note)\s*(.+))?/i
  );
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
    text: `Offline Mode Active.\n\nI can calculate your balance, simulate a purchase (e.g. "Can I spend ₹500?"), or prefill transactions (e.g. "Log ₹20 Chai"). Configure your Gemini or Groq API Key in Settings for deep financial reasoning!`,
    telemetry: 'Offline Mode Active',
  };
}
