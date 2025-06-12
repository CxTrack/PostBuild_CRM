import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface TemplateState {
  activeTemplate: string;
  loading: boolean;
  error: string | null;
  
  // Actions
  setActiveTemplate: (templateId: string) => Promise<void>;
  getActiveTemplate: () => Promise<void>;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  activeTemplate: 'call-center',
  loading: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  getActiveTemplate: async () => {
    set({ loading: true, error: null });
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('dashboard_settings')
        .single();
      
      if (settings?.dashboard_settings?.activeTemplate) {
        set({ activeTemplate: settings.dashboard_settings.activeTemplate });
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
  
  setActiveTemplate: async (templateId: string) => {
    set({ loading: true, error: null });
    try {
      // Get current settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('dashboard_settings')
        .single();
      
      // Update settings with new template
      const updatedSettings = {
        ...settings?.dashboard_settings,
        activeTemplate: templateId
      };
      
      // Save to database
      const { error } = await supabase
        .from('user_settings')
        .update({ dashboard_settings: updatedSettings })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      
      set({ activeTemplate: templateId, loading: false });
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