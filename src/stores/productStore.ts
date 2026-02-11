import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Product } from '../types/app.types';

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
    set({ loading: true, error: null });
    try {
      let query = supabase.from('products').select('*');
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      set({ products: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createProduct: async (product) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.from('products').insert([product]).select().single();
      if (error) throw error;
      set((state) => ({ products: [data, ...state.products], loading: false }));
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateProduct: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('products').update(updates).eq('id', id);
      if (error) throw error;
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ products: state.products.filter((p) => p.id !== id), loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getProductById: (id) => get().products.find((p) => p.id === id),
}));
