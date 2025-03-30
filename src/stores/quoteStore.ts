import { create } from 'zustand';
import { quoteService } from '../services/quoteService';
import { Quote, QuoteFormData, QuoteStatus } from '../types/database.types';

interface QuoteState {
  quotes: Quote[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchQuotes: () => Promise<void>;
  getQuoteById: (id: string) => Promise<Quote | null>;
  createQuote: (data: QuoteFormData) => Promise<Quote>;
  updateQuoteStatus: (id: string, status: QuoteStatus) => Promise<Quote>;
  deleteQuote: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  quotes: [],
  loading: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  fetchQuotes: async () => {
    set({ loading: true, error: null });
    try {
      const quotes = await quoteService.getQuotes();
      set({ quotes, loading: false });
    } catch (error: any) {
      console.error('Error in fetchQuotes:', error);
      set({ 
        error: error.message || 'Failed to fetch quotes', 
        loading: false 
      });
    }
  },
  
  getQuoteById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const quote = await quoteService.getQuoteById(id);
      set({ loading: false });
      return quote;
    } catch (error: any) {
      console.error('Error in getQuoteById:', error);
      set({ 
        error: error.message || 'Failed to fetch quote details', 
        loading: false 
      });
      return null;
    }
  },
  
  createQuote: async (data: QuoteFormData) => {
    set({ loading: true, error: null });
    try {
      const newQuote = await quoteService.createQuote(data);
      
      const quotes = [...get().quotes, newQuote];
      set({ quotes, loading: false });
      
      return newQuote;
    } catch (error: any) {
      console.error('Error in createQuote:', error);
      set({ 
        error: error.message || 'Failed to create quote', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateQuoteStatus: async (id: string, status: QuoteStatus) => {
    set({ loading: true, error: null });
    try {
      const updatedQuote = await quoteService.updateQuoteStatus(id, status);
      
      const quotes = get().quotes.map(quote => 
        quote.id === id ? updatedQuote : quote
      );
      
      set({ quotes, loading: false });
      return updatedQuote;
    } catch (error: any) {
      console.error('Error in updateQuoteStatus:', error);
      set({ 
        error: error.message || 'Failed to update quote status', 
        loading: false 
      });
      throw error;
    }
  },
  
  deleteQuote: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await quoteService.deleteQuote(id);
      
      const quotes = get().quotes.filter(quote => quote.id !== id);
      set({ quotes, loading: false });
    } catch (error: any) {
      console.error('Error in deleteQuote:', error);
      set({ 
        error: error.message || 'Failed to delete quote', 
        loading: false 
      });
      throw error;
    }
  }
}));