import { create } from 'zustand';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
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
    // Get org from store if not provided
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
      // Use direct fetch to avoid Supabase AbortController issue
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
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.from('products').insert([product]).select().single();
      if (error) throw error;
      set((state) => ({ products: [data, ...state.products] }));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateProduct: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('products').update(updates).eq('id', id);
      if (error) throw error;
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
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
