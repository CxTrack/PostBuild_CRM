import { create } from 'zustand';
import { Industry } from '../types/database.types';
import { industryService } from '../services/industryService';

interface IndustryState {
  industry: Industry | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchIndustries: () => Promise<void>;
  //updateProfile: (data: Partial<IndustryData>) => Promise<void>;
  clearError: () => void;
}

export const useIndustriesStore = create<IndustryState>((set, get) => ({
  industry : null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchIndustries: async () => {
    set({ loading: true, error: null });

     try {
      const industry = await industryService.fetchIndustries();
      set({ industry, loading: false });
      } catch (error: any) {
      }
    }
  }
));