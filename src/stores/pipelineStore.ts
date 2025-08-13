import { create } from 'zustand';
import { PipelineItem } from '../types/database.types';
import { piplelineService } from '../services/pipelineService';

interface PipelineItemState {
  pipelines: PipelineItem[];
  leads: PipelineItem[];
  probabilities: string[];
  opportunities: PipelineItem[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPipelineItems: () => Promise<void>;
  createPipelineItem: (data: PipelineItem) => Promise<PipelineItem>;
  updatePipelineItem: (item: PipelineItem) => Promise<PipelineItem>;
  deletePipelineItem: (id: string) => Promise<void>;
  // clearError: () => void;
}

export const usePipelineStore = create<PipelineItemState>((set, get) => ({
  pipelines: [], // leads & opportunities combined
  leads: [],
  opportunities: [],
  probabilities: ["Preapproval - 20%", "Approved Preapproval - 40%", "Live Deal - 60%", "Approved Live Deal - 80%",],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchPipelineItems: async () => {
    set({ loading: true, error: null });
    try {
      const pipelines = await piplelineService.getPipelines();
      const filteredLeads = pipelines.filter(item => item.stage === 'lead')
      const filteredOpportunity = pipelines.filter(item => item.stage === 'opportunity')

      set({ pipelines: pipelines, leads: filteredLeads, opportunities: filteredOpportunity, loading: false });
    } catch (error: any) {
      console.error('Error in fetchLeads:', error);
      set({
        error: error.message || 'Failed to fetch leads',
        loading: false
      });
    }
  },

  createPipelineItem: async (data: PipelineItem) => {
    set({ loading: true, error: null });
    try {
      const newItem = await piplelineService.createPipeline(data);

      await get().fetchPipelineItems();

      return newItem;
    } catch (error: any) {
      console.error('Error in createPipelineItem:', error);
      set({
        error: error.message || 'Failed to create pipline item',
        loading: false
      });
      throw error;
    }
  },


  updatePipelineItem: async (item: PipelineItem) => {
    set({ loading: true, error: null });
    try {
      const updatedPipeline = await piplelineService.updatePipelineItem(item);

      await get().fetchPipelineItems();

      return updatedPipeline;
    } catch (error: any) {
      console.error('Error in updatePipelineItem:', error);
      set({
        error: error.message || 'Failed to update task pipline item',
        loading: false
      });
      throw error;
    }
  },

  deletePipelineItem: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await piplelineService.deletePipelineItems(id);

      await get().fetchPipelineItems();
    } catch (error: any) {
      console.error('Error in deletePipelineItem:', error);
      set({
        error: error.message || 'Failed to delete pipeline',
        loading: false
      });
      throw error;
    }
  }
}));