import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';

// Re-export shared types from voiceAgentStore
export type { AgentTone } from './voiceAgentStore';
export { TONE_DESCRIPTIONS } from './voiceAgentStore';

export interface SmsAgentConfig {
  id: string;
  organization_id: string;
  agent_name: string;
  agent_tone: 'professional' | 'friendly' | 'casual' | 'formal';
  business_name: string;
  industry: string;
  business_description: string;
  common_inquiry_types: string[];
  suggestions_enabled: boolean;
  auto_draft_enabled: boolean;
  call_summary_sms_enabled: boolean;
  max_response_length: number;
  custom_instructions: string;
  signature: string;
  is_active: boolean;
  setup_completed: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CONFIG: Omit<SmsAgentConfig, 'id' | 'organization_id' | 'created_at' | 'updated_at'> = {
  agent_name: 'SMS Assistant',
  agent_tone: 'professional',
  business_name: '',
  industry: '',
  business_description: '',
  common_inquiry_types: [],
  suggestions_enabled: true,
  auto_draft_enabled: false,
  call_summary_sms_enabled: false,
  max_response_length: 320,
  custom_instructions: '',
  signature: '',
  is_active: false,
  setup_completed: false,
};

interface SmsAgentStore {
  config: SmsAgentConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  saveConfig: (data: Partial<SmsAgentConfig>) => Promise<SmsAgentConfig>;
  activateAgent: () => Promise<void>;
  deactivateAgent: () => Promise<void>;
}

export const useSmsAgentStore = create<SmsAgentStore>((set, get) => ({
  config: null,
  loading: false,
  saving: false,
  error: null,

  fetchConfig: async () => {
    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ loading: false, error: 'No organization' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('sms_agent_configs')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      set({ config: data || null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  saveConfig: async (data) => {
    set({ saving: true, error: null });
    try {
      const currentConfig = get().config;

      if (currentConfig) {
        const { data: updated, error } = await supabase
          .from('sms_agent_configs')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', currentConfig.id)
          .select()
          .single();
        if (error) throw error;
        set({ config: updated });
        return updated;
      } else {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) throw new Error('No organization');

        // Pull business context from org if available
        const org = useOrganizationStore.getState().currentOrganization;

        const { data: inserted, error } = await supabase
          .from('sms_agent_configs')
          .insert({
            ...DEFAULT_CONFIG,
            ...data,
            organization_id: organizationId,
            business_name: data.business_name || org?.name || '',
            industry: data.industry || (org as any)?.industry_template || '',
          })
          .select()
          .single();
        if (error) throw error;
        set({ config: inserted });
        return inserted;
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  activateAgent: async () => {
    await get().saveConfig({ is_active: true, setup_completed: true });
  },

  deactivateAgent: async () => {
    await get().saveConfig({ is_active: false });
  },
}));
