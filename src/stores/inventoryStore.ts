import { create } from 'zustand';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { StockMovement, LowStockAlert } from '../types/app.types';
import { useOrganizationStore } from './organizationStore';

/**
 * Read auth token from localStorage to avoid Supabase AbortController issue.
 * Same pattern used in productStore.ts.
 */
const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* skip */ }
    }
  }
  return null;
};

/** Build standard Supabase REST headers */
const buildHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'apikey': supabaseAnonKey,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
});

interface InventoryState {
  movements: Record<string, StockMovement[]>;
  allMovements: StockMovement[];
  alerts: LowStockAlert[];
  loading: boolean;
  movementsLoading: boolean;
  error: string | null;
  fetchMovements: (productId: string) => Promise<void>;
  fetchAllMovements: (organizationId: string) => Promise<void>;
  fetchAlerts: (organizationId: string) => Promise<void>;
  addMovement: (movement: Omit<StockMovement, 'id' | 'created_at'>) => Promise<StockMovement | null>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  movements: {},
  allMovements: [],
  alerts: [],
  loading: false,
  movementsLoading: false,
  error: null,

  fetchMovements: async (productId: string) => {
    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ loading: false, error: 'No organization selected' });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const url = `${supabaseUrl}/rest/v1/stock_movements?product_id=eq.${productId}&organization_id=eq.${organizationId}&order=created_at.desc`;
      const res = await fetch(url, { headers: buildHeaders(token) });
      if (!res.ok) throw new Error(`Failed to fetch movements: ${res.status}`);
      const data: StockMovement[] = await res.json();
      set((state) => ({
        movements: { ...state.movements, [productId]: data },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  fetchAllMovements: async (organizationId: string) => {
    const token = getAuthToken();
    if (!token) {
      set({ movementsLoading: false, error: 'Not authenticated' });
      return;
    }

    set({ movementsLoading: true, error: null });
    try {
      const url = `${supabaseUrl}/rest/v1/stock_movements?organization_id=eq.${organizationId}&order=created_at.desc&limit=500`;
      const res = await fetch(url, { headers: buildHeaders(token) });
      if (!res.ok) throw new Error(`Failed to fetch movements: ${res.status}`);
      const data: StockMovement[] = await res.json();
      set({ allMovements: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ movementsLoading: false });
    }
  },

  fetchAlerts: async (organizationId: string) => {
    const token = getAuthToken();
    if (!token) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const url = `${supabaseUrl}/rest/v1/low_stock_alerts?organization_id=eq.${organizationId}&status=eq.active&order=created_at.desc`;
      const res = await fetch(url, { headers: buildHeaders(token) });
      if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.status}`);
      const data: LowStockAlert[] = await res.json();
      set({ alerts: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  addMovement: async (movement) => {
    const token = getAuthToken();
    if (!token) {
      set({ loading: false, error: 'Not authenticated' });
      return null;
    }

    set({ loading: true, error: null });
    try {
      // 1. Insert movement
      const insertUrl = `${supabaseUrl}/rest/v1/stock_movements`;
      const insertRes = await fetch(insertUrl, {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(movement),
      });
      if (!insertRes.ok) {
        const errBody = await insertRes.text();
        throw new Error(`Failed to insert movement: ${insertRes.status} ${errBody}`);
      }
      const [movementData]: StockMovement[] = await insertRes.json();

      // 2. Update product quantity
      const updateUrl = `${supabaseUrl}/rest/v1/products?id=eq.${movement.product_id}`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify({ quantity_on_hand: movement.new_quantity }),
      });
      if (!updateRes.ok) {
        throw new Error(`Failed to update product quantity: ${updateRes.status}`);
      }

      set((state) => ({
        movements: {
          ...state.movements,
          [movement.product_id]: [movementData, ...(state.movements[movement.product_id] || [])],
        },
        allMovements: [movementData, ...state.allMovements],
      }));
      return movementData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  acknowledgeAlert: async (alertId) => {
    const token = getAuthToken();
    if (!token) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const url = `${supabaseUrl}/rest/v1/low_stock_alerts?id=eq.${alertId}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify({ status: 'acknowledged' }),
      });
      if (!res.ok) throw new Error(`Failed to acknowledge alert: ${res.status}`);
      set((state) => ({
        alerts: state.alerts.filter(a => a.id !== alertId),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },
}));
