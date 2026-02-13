import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Quote, QuoteItem } from '../types/app.types';
import { useOrganizationStore } from './organizationStore';

const generateQuoteNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `Q-${timestamp}`;
};

interface QuoteState {
  quotes: Quote[];
  quoteItems: Record<string, QuoteItem[]>;
  loading: boolean;
  error: string | null;
  fetchQuotes: (organizationId?: string) => Promise<void>;
  fetchQuoteItems: (quoteId: string) => Promise<void>;
  createQuote: (quote: Omit<Quote, 'id' | 'created_at' | 'updated_at'>) => Promise<Quote | null>;
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  addQuoteItem: (item: Omit<QuoteItem, 'id' | 'created_at'>) => Promise<QuoteItem | null>;
  updateQuoteItem: (id: string, updates: Partial<QuoteItem>) => Promise<void>;
  deleteQuoteItem: (id: string, quoteId: string) => Promise<void>;
  getQuoteById: (id: string) => Quote | undefined;
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  quotes: [],
  quoteItems: {},
  loading: false,
  error: null,

  fetchQuotes: async (organizationId?: string) => {
    set({ loading: true, error: null });
    try {
      if (!organizationId) {
        set({ quotes: [] });
        return;
      }
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ quotes: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchQuoteItems: async (quoteId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      set((state) => ({
        quoteItems: { ...state.quoteItems, [quoteId]: data || [] },
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createQuote: async (quote) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert([quote])
        .select()
        .single();
      if (error) throw error;
      set((state) => ({ quotes: [data, ...state.quotes] }));
      return data;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateQuote: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('quotes').update(updates).eq('id', id);
      if (error) throw error;
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === id ? { ...q, ...updates } : q)),
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  deleteQuote: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ quotes: state.quotes.filter((q) => q.id !== id) }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addQuoteItem: async (item) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.from('quote_items').insert([item]).select().single();
      if (error) throw error;
      set((state) => ({
        quoteItems: {
          ...state.quoteItems,
          [item.quote_id]: [...(state.quoteItems[item.quote_id] || []), data],
        },
      }));
      return data;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateQuoteItem: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('quote_items').update(updates).eq('id', id);
      if (error) throw error;
      set((state) => {
        const newQuoteItems = { ...state.quoteItems };
        Object.keys(newQuoteItems).forEach((quoteId) => {
          newQuoteItems[quoteId] = newQuoteItems[quoteId].map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
        });
        return { quoteItems: newQuoteItems };
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  deleteQuoteItem: async (id, quoteId) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('quote_items').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        quoteItems: {
          ...state.quoteItems,
          [quoteId]: state.quoteItems[quoteId]?.filter((item) => item.id !== id) || [],
        },
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  getQuoteById: (id) => get().quotes.find((q) => q.id === id),
}));
