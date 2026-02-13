import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Expense, ExpenseCategory } from '../types/app.types';

interface ExpenseState {
    expenses: Expense[];
    categories: ExpenseCategory[];
    loading: boolean;
    error: string | null;
    fetchExpenses: (organizationId?: string) => Promise<void>;
    fetchCategories: (organizationId?: string) => Promise<void>;
    createExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<Expense | null>;
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    createCategory: (category: Omit<ExpenseCategory, 'id' | 'created_at'>) => Promise<ExpenseCategory | null>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
    expenses: [],
    categories: [],
    loading: false,
    error: null,

    fetchExpenses: async (organizationId?: string) => {
        set({ loading: true, error: null });
        try {
            if (!organizationId) {
                set({ expenses: [] });
                return;
            }
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('organization_id', organizationId)
                .order('expense_date', { ascending: false });
            if (error) throw error;
            set({ expenses: data || [] });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        } finally {
            set({ loading: false });
        }
    },

    fetchCategories: async (organizationId?: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('expense_categories')
                .select('*')
                .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
                .eq('is_active', true)
                .order('name', { ascending: true });
            if (error) throw error;
            set({ categories: data || [] });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        } finally {
            set({ loading: false });
        }
    },

    createExpense: async (expense) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase.from('expenses').insert([expense]).select().single();
            if (error) throw error;
            set((state) => ({ expenses: [data, ...state.expenses] }));
            return data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
            return null;
        } finally {
            set({ loading: false });
        }
    },

    updateExpense: async (id, updates) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase.from('expenses').update(updates).eq('id', id);
            if (error) throw error;
            set((state) => ({
                expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
            }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        } finally {
            set({ loading: false });
        }
    },

    deleteExpense: async (id) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        } finally {
            set({ loading: false });
        }
    },

    createCategory: async (category) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase.from('expense_categories').insert([category]).select().single();
            if (error) throw error;
            set((state) => ({ categories: [...state.categories, data].sort((a, b) => a.name.localeCompare(b.name)) }));
            return data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
            return null;
        } finally {
            set({ loading: false });
        }
    }
}));
