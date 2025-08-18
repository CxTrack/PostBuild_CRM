import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DashboardSettings } from '../types/dashboard.settings';

interface TemplateState {
  activeTemplateSettings: DashboardSettings;
  loading: boolean;
  error: string | null;
  
  // Actions
  setActiveTemplate: (dashboardSettings: DashboardSettings) => Promise<void>;
  getActiveTemplate: () => Promise<void>;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  loading: false,
  error: null,
  activeTemplateSettings: {
    activeTemplate: '',
    showInventoryStatus: false,
    showLowStockItems: false,
    showPipelineOverview: false,
    showPurchasesChart: false,
    showRecentActivity: false,
    showRecentExpenses: false,
    showSalesChart: false,
    showTodayEvents: false
  },
  
  clearError: () => set({ error: null }),
  
  getActiveTemplate: async () => {
    set({ loading: true, error: null });
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('dashboard_settings')
        .single();
      
      if (settings?.dashboard_settings?.activeTemplate) {
        set({ activeTemplateSettings: settings.dashboard_settings });
      }

      set({ loading: false });
    } catch (error: any) {
      console.error('Error getting active template:', error);
      set({ 
        error: error.message || 'Failed to get active template', 
        loading: false 
      });
    }
  },
  
  setActiveTemplate: async (dashboardSettings: DashboardSettings) => {
    set({ loading: true, error: null });
    try {

      // Save to database
      const { error } = await supabase
        .from('user_settings')
        .update({ dashboard_settings: dashboardSettings })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      
      set({ activeTemplateSettings: dashboardSettings, loading: false });
    } catch (error: any) {
      console.error('Error setting active template:', error);
      set({ 
        error: error.message || 'Failed to set active template', 
        loading: false 
      });
      throw error;
    }
  }
}));