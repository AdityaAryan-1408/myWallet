/**
 * MyWallet — Dashboard Layout Store (Feature 15: Modular Dashboard)
 * 
 * Manages dashboard card arrangement, visibility, pinning, and drag-and-drop state.
 * Fully persists user customized layouts to SQLite user_settings and localStorage.
 */

import { create } from 'zustand';
import { SettingsRepository } from '@/repositories/settingsRepository';

export interface DashboardCardConfig {
  cardId: string;
  visible: boolean;
  pinned: boolean;
  order: number;
}

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  { cardId: 'monthly_summary', visible: true, pinned: false, order: 0 },
  { cardId: 'quick_actions', visible: true, pinned: false, order: 1 },
  { cardId: 'budget_alerts', visible: true, pinned: false, order: 2 },
  { cardId: 'category_burn', visible: true, pinned: false, order: 3 },
  { cardId: 'notes', visible: true, pinned: false, order: 4 },
  { cardId: 'cards_snapshot', visible: true, pinned: false, order: 5 },
  { cardId: 'recent_activity', visible: true, pinned: false, order: 6 },
  // Opt-in analytics cards
  { cardId: 'resilience_gauge', visible: false, pinned: false, order: 7 },
  { cardId: 'no_spend_heatmap', visible: false, pinned: false, order: 8 },
  { cardId: 'velocity_audit', visible: false, pinned: false, order: 9 },
  { cardId: 'day_of_week', visible: false, pinned: false, order: 10 },
  { cardId: 'time_distribution', visible: false, pinned: false, order: 11 },
  { cardId: 'month_comparison', visible: false, pinned: false, order: 12 },
  { cardId: 'merchant_intelligence', visible: false, pinned: false, order: 13 },
  { cardId: 'income_expense_ratio', visible: false, pinned: false, order: 14 },
  { cardId: 'category_sparklines', visible: false, pinned: false, order: 15 },
  { cardId: 'monthly_digest', visible: false, pinned: false, order: 16 },
];

const STORAGE_KEY = 'dashboard_layout_config_v1';

function loadInitialCards(): DashboardCardConfig[] {
  try {
    let raw = SettingsRepository.get(STORAGE_KEY, '');
    if (!raw && typeof window !== 'undefined' && window.localStorage) {
      raw = window.localStorage.getItem(STORAGE_KEY) || '';
    }
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardCardConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingMap = new Map(parsed.map((c) => [c.cardId, c]));
        const merged: DashboardCardConfig[] = [];

        // Add saved cards in preserved order
        for (const item of parsed) {
          merged.push(item);
        }
        // Add any missing cards from code defaults (e.g. newly introduced cards)
        for (const def of DEFAULT_DASHBOARD_CARDS) {
          if (!existingMap.has(def.cardId)) {
            merged.push({ ...def, order: merged.length });
          }
        }
        return merged;
      }
    }
  } catch (e) {
    console.warn('Failed to load dashboard layout, using defaults:', e);
  }
  return DEFAULT_DASHBOARD_CARDS.map((c) => ({ ...c }));
}

function persistCards(cards: DashboardCardConfig[]) {
  try {
    const raw = JSON.stringify(cards);
    SettingsRepository.set(STORAGE_KEY, raw);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, raw);
    }
  } catch (e) {
    console.warn('Failed to persist dashboard layout:', e);
  }
}

interface DashboardState {
  cards: DashboardCardConfig[];
  isEditMode: boolean;
  isPickerOpen: boolean;

  // Actions
  setEditMode: (on: boolean) => void;
  toggleEditMode: () => void;
  setPickerOpen: (open: boolean) => void;
  toggleCardVisibility: (cardId: string) => void;
  setCardVisibility: (cardId: string, visible: boolean) => void;
  toggleCardPinned: (cardId: string) => void;
  reorderCards: (newCards: DashboardCardConfig[]) => void;
  moveCard: (fromIndex: number, toIndex: number) => void;
  moveCardStep: (cardId: string, direction: 'up' | 'down') => void;
  resetToDefault: () => void;
  loadStoredLayout: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  cards: loadInitialCards(),
  isEditMode: false,
  isPickerOpen: false,

  setEditMode: (on: boolean) => set({ isEditMode: on }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setPickerOpen: (open: boolean) => set({ isPickerOpen: open }),

  loadStoredLayout: () => {
    const loaded = loadInitialCards();
    set({ cards: loaded });
  },

  toggleCardVisibility: (cardId: string) => {
    const { cards } = get();
    const updated = cards.map((c) => {
      if (c.cardId === cardId) {
        return { ...c, visible: !c.visible };
      }
      return c;
    });
    set({ cards: updated });
    persistCards(updated);
  },

  setCardVisibility: (cardId: string, visible: boolean) => {
    const { cards } = get();
    const updated = cards.map((c) => {
      if (c.cardId === cardId) {
        return { ...c, visible };
      }
      return c;
    });
    set({ cards: updated });
    persistCards(updated);
  },

  toggleCardPinned: (cardId: string) => {
    const { cards } = get();
    const updated = cards.map((c) => {
      if (c.cardId === cardId) {
        return { ...c, pinned: !c.pinned };
      }
      return c;
    });
    set({ cards: updated });
    persistCards(updated);
  },

  reorderCards: (newCards: DashboardCardConfig[]) => {
    // Re-assign order based on array indices
    const updated = newCards.map((c, idx) => ({ ...c, order: idx }));
    set({ cards: updated });
    persistCards(updated);
  },

  moveCard: (fromIndex: number, toIndex: number) => {
    const { cards } = get();
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= cards.length || toIndex >= cards.length) return;

    const list = [...cards];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);

    const updated = list.map((c, idx) => ({ ...c, order: idx }));
    set({ cards: updated });
    persistCards(updated);
  },

  moveCardStep: (cardId: string, direction: 'up' | 'down') => {
    const { cards } = get();
    // Get visible cards in current display sort order: pinned first (by order), then unpinned (by order)
    const sortedVisible = [...cards]
      .filter((c) => c.visible)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return a.order - b.order;
      });

    const currIdx = sortedVisible.findIndex((c) => c.cardId === cardId);
    if (currIdx === -1) return;

    const targetIdx = direction === 'up' ? currIdx - 1 : currIdx + 1;
    if (targetIdx < 0 || targetIdx >= sortedVisible.length) return;

    const currentCard = sortedVisible[currIdx];
    const targetCard = sortedVisible[targetIdx];

    // If swapping across pinned boundary, sync pinned status or swap orders
    let newPinned = currentCard.pinned;
    if (currentCard.pinned !== targetCard.pinned) {
      newPinned = targetCard.pinned;
    }

    // Swap their order values in the global cards list
    const updated = cards.map((c) => {
      if (c.cardId === currentCard.cardId) {
        return { ...c, order: targetCard.order, pinned: newPinned };
      }
      if (c.cardId === targetCard.cardId) {
        return { ...c, order: currentCard.order };
      }
      return c;
    });

    set({ cards: updated });
    persistCards(updated);
  },

  resetToDefault: () => {
    const defaults = DEFAULT_DASHBOARD_CARDS.map((c) => ({ ...c }));
    set({ cards: defaults });
    persistCards(defaults);
  },
}));
