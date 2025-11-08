import { create } from 'zustand';
import { Industry } from '../types/database.types';
import { industryService } from '../services/industryService';

interface IndustryState {
  industries: Industry[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchIndustries: () => Promise<void>;
  //updateProfile: (data: Partial<IndustryData>) => Promise<void>;
  clearError: () => void;
}

export const useIndustriesStore = create<IndustryState>((set, get) => ({
  industries: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchIndustries: async () => {
    set({ loading: true, error: null });

     try {
      const industries = await industryService.fetchIndustries();
      set({ industries, loading: false });
      } catch (error: any) {
      }
    }
  }
));