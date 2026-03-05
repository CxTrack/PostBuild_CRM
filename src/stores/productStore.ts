import { create } from 'zustand';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { Product } from '../types/app.types';
import { useOrganizationStore } from './organizationStore';

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

// Fields that should never be sent in create/update payloads
const READ_ONLY_FIELDS = ['id', 'created_at', 'updated_at', 'created_by'];

function stripReadOnly(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!READ_ONLY_FIELDS.includes(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (organizationId?: string) => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async (organizationId?: string) => {
    const orgId = organizationId || useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) {
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
      const res = await fetch(
        `${supabaseUrl}/rest/v1/products?organization_id=eq.${orgId}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
      const data = await res.json();
      set({ products: data || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  createProduct: async (product) => {
    const token = getAuthToken();
    if (!token) {
      set({ error: 'Not authenticated' });
      return null;
    }

    set({ loading: true, error: null });
    try {
      const payload = stripReadOnly(product as Record<string, any>);
      const res = await fetch(
        `${supabaseUrl}/rest/v1/products`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Failed to create product: ${res.status} ${errBody}`);
      }
      const data = await res.json();
      const created = Array.isArray(data) ? data[0] : data;
      set((state) => ({ products: [created, ...state.products] }));
      return created;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (id, updates) => {
    const token = getAuthToken();
    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const payload = stripReadOnly(updates as Record<string, any>);
      const res = await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Failed to update product: ${res.status} ${errBody}`);
      }
      const data = await res.json();
      const updated = Array.isArray(data) ? data[0] : data;
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      throw error; // Re-throw so the form can catch it
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (id) => {
    const token = getAuthToken();
    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Failed to delete product: ${res.status}`);
      set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  getProductById: (id) => get().products.find((p) => p.id === id),
}));
