/**
 * MyWallet — AI Chat State Store (Zustand)
 *
 * Manages conversation history, background generation state, telemetry labels,
 * and safe prefill actions independently from view lifecycles.
 */

import { create } from 'zustand';
import * as Haptics from 'expo-haptics';
import { AiChatMessage, askAiCoPilot } from '@/services/ai/aiService';
import { SettingsRepository } from '@/repositories/settingsRepository';

interface AiChatStoreState {
  messages: AiChatMessage[];
  isGenerating: boolean;
  telemetryStatus: string | null;
  pendingPrefill: {
    amount: number;
    type?: string;
    account?: string;
    category?: string;
    note?: string;
  } | null;
  isChatOpen: boolean;
  hasUnreadResponse: boolean;
  isAiEnabled: boolean;

  // Actions
  setIsChatOpen: (open: boolean) => void;
  markResponseRead: () => void;
  setAiEnabled: (enabled: boolean) => void;
  sendMessage: (prompt: string) => Promise<void>;
  clearChat: () => void;
  consumePendingPrefill: () => {
    amount: number;
    type?: string;
    account?: string;
    category?: string;
    note?: string;
  } | null;
}

const INITIAL_MESSAGES: AiChatMessage[] = [
  {
    id: 'welcome_1',
    sender: 'ai',
    text: 'Hello! I am your MyWallet Co-Pilot. Ask me anything about your available balance, budgets, whether a purchase is safe, or tell me to log transactions.',
    time: 'Now',
  },
];

export const useAiChatStore = create<AiChatStoreState>((set, get) => ({
  messages: INITIAL_MESSAGES,
  isGenerating: false,
  telemetryStatus: null,
  pendingPrefill: null,
  isChatOpen: false,
  hasUnreadResponse: false,
  isAiEnabled: SettingsRepository.getAiCopilotEnabled(),

  setIsChatOpen: (open: boolean) => {
    set({
      isChatOpen: open,
      hasUnreadResponse: open ? false : get().hasUnreadResponse,
    });
  },

  markResponseRead: () => {
    set({ hasUnreadResponse: false });
  },

  setAiEnabled: (enabled: boolean) => {
    SettingsRepository.setAiCopilotEnabled(enabled);
    set({
      isAiEnabled: enabled,
      isChatOpen: enabled ? get().isChatOpen : false,
      hasUnreadResponse: false,
    });
  },

  sendMessage: async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || get().isGenerating) return;

    const userMsg: AiChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isGenerating: true,
      telemetryStatus: 'Thinking...',
    }));

    try {
      const response = await askAiCoPilot(trimmed, (status) => {
        set({ telemetryStatus: status });
      });

      const aiMsg: AiChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        telemetry: response.telemetry,
        financialCard: response.financialCard,
        prefillData: response.prefillData,
      };

      const wasClosed = !get().isChatOpen;
      set((state) => ({
        messages: [...state.messages, aiMsg],
        isGenerating: false,
        telemetryStatus: null,
        pendingPrefill: response.prefillData || null,
        hasUnreadResponse: wasClosed,
      }));

      if (wasClosed) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: `Sorry, I encountered an error: ${err?.message || 'Could not complete request.'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const wasClosed = !get().isChatOpen;
      set((state) => ({
        messages: [...state.messages, errorMsg],
        isGenerating: false,
        telemetryStatus: null,
        hasUnreadResponse: wasClosed,
      }));

      if (wasClosed) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
      }
    }
  },

  clearChat: () => {
    set({
      messages: INITIAL_MESSAGES,
      isGenerating: false,
      telemetryStatus: null,
      pendingPrefill: null,
      hasUnreadResponse: false,
    });
  },

  consumePendingPrefill: () => {
    const current = get().pendingPrefill;
    set({ pendingPrefill: null });
    return current;
  },
}));
