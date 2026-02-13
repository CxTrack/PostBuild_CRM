import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Supplier } from '../types/app.types';

interface SupplierState {
    suppliers: Supplier[];
    loading: boolean;
    error: string | null;
    fetchSuppliers: (organizationId?: string) => Promise<void>;
    createSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<Supplier | null>;
    updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;
    getSupplierById: (id: string) => Supplier | undefined;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
    suppliers: [],
    loading: false,
    error: null,

    fetchSuppliers: async (organizationId?: string) => {
        set({ loading: true, error: null });
        try {
            if (!organizationId) {
                set({ suppliers: [] });
                return;
            }
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('organization_id', organizationId)
                .order('name', { ascending: true });
            if (error) throw error;
            set({ suppliers: data || [] });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    createSupplier: async (supplier) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase.from('suppliers').insert([supplier]).select().single();
            if (error) throw error;
            set((state) => ({ suppliers: [...state.suppliers, data].sort((a, b) => a.name.localeCompare(b.name)) }));
            return data;
        } catch (error: any) {
            set({ error: error.message });
            return null;
        } finally {
            set({ loading: false });
        }
    },

    updateSupplier: async (id, updates) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
            if (error) throw error;
            set((state) => ({
                suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
            }));
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    deleteSupplier: async (id) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    getSupplierById: (id) => get().suppliers.find((s) => s.id === id),
}));
