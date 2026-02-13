import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';

export type AgentTone = 'professional' | 'friendly' | 'casual' | 'formal';
export type HandlingPreference = 'handle_automatically' | 'notify_team' | 'transfer_immediately';
export type FallbackBehavior = 'transfer_to_voicemail' | 'take_message' | 'schedule_callback' | 'transfer_to_human';

export interface VoiceAgentConfig {
    id: string;
    organization_id: string;
    agent_name: string;
    agent_tone: AgentTone;
    business_name: string;
    industry: string;
    business_description: string;
    common_call_reasons: string[];
    handling_preference: HandlingPreference;
    greeting_script: string;
    fallback_behavior: FallbackBehavior;
    languages: string[];
    working_hours?: {
        timezone: string;
        schedule: Record<string, { start: string; end: string; enabled: boolean }>;
    };
    is_active: boolean;
    setup_completed: boolean;
    setup_step: number;
    created_at: string;
    updated_at: string;
}

export interface VoiceUsage {
    id: string;
    organization_id: string;
    billing_period_start: string;
    billing_period_end: string;
    minutes_used: number;
    minutes_included: number;
    overage_minutes: number;
    overage_cost_cents: number;
}

interface VoiceAgentStore {
    config: VoiceAgentConfig | null;
    usage: VoiceUsage | null;
    loading: boolean;
    error: string | null;
    fetchConfig: () => Promise<void>;
    saveConfig: (data: Partial<VoiceAgentConfig>) => Promise<VoiceAgentConfig>;
    updateSetupStep: (step: number) => Promise<void>;
    activateAgent: () => Promise<void>;
    deactivateAgent: () => Promise<void>;
    fetchUsage: () => Promise<void>;
    getSetupProgress: () => number;
    isSetupComplete: () => boolean;
}

const DEFAULT_CONFIG: Omit<VoiceAgentConfig, 'id' | 'organization_id' | 'created_at' | 'updated_at'> = {
    agent_name: 'AI Assistant',
    agent_tone: 'professional',
    business_name: '',
    industry: '',
    business_description: '',
    common_call_reasons: [],
    handling_preference: 'handle_automatically',
    greeting_script: "Hello! Thank you for calling {business_name}. How can I help you today?",
    fallback_behavior: 'take_message',
    languages: ['English'],
    is_active: false,
    setup_completed: false,
    setup_step: 0,
};

const INDUSTRY_OPTIONS = [
    'Software / SaaS',
    'Real Estate',
    'Healthcare',
    'Legal Services',
    'Accounting / Finance',
    'Consulting',
    'Home Services',
    'Retail / E-commerce',
    'Non-Profit',
];

const TONE_DESCRIPTIONS: Record<AgentTone, string> = {
    professional: 'Polished and business-like, suitable for B2B and corporate clients',
    friendly: 'Warm and approachable, great for customer service',
    casual: 'Relaxed and conversational, ideal for younger demographics',
    formal: 'Traditional and respectful, appropriate for legal/financial services',
};

export { INDUSTRY_OPTIONS, TONE_DESCRIPTIONS };

export const useVoiceAgentStore = create<VoiceAgentStore>((set, get) => ({
    config: null,
    usage: null,
    loading: false,
    error: null,

    fetchConfig: async () => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            set({ loading: false, error: 'No organization selected' });
            return;
        }

        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('voice_agent_configs')
                .select('*')
                .eq('organization_id', organizationId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            set({ config: data || null });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        } finally {
            set({ loading: false });
        }
    },

    saveConfig: async (data) => {
        set({ loading: true, error: null });
        try {
            const currentConfig = get().config;

            if (currentConfig) {
                const { data: configData, error } = await supabase
                    .from('voice_agent_configs')
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('id', currentConfig.id)
                    .select()
                    .single();

                if (error) throw error;
                set({ config: configData });
                return configData;
            } else {
                const organizationId = useOrganizationStore.getState().currentOrganization?.id;
                if (!organizationId) {
                    throw new Error('No organization selected');
                }

                const { data: configData, error } = await supabase
                    .from('voice_agent_configs')
                    .insert({ ...DEFAULT_CONFIG, ...data, organization_id: organizationId })
                    .select()
                    .single();

                if (error) throw error;
                set({ config: configData });
                return configData;
            }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    updateSetupStep: async (step) => {
        await get().saveConfig({
            setup_step: step,
            setup_completed: step >= 3,
        });
    },

    activateAgent: async () => {
        await get().saveConfig({ is_active: true });
    },

    deactivateAgent: async () => {
        await get().saveConfig({ is_active: false });
    },

    fetchUsage: async () => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            return;
        }

        try {
            const { data, error } = await supabase
                .from('voice_usage')
                .select('*')
                .eq('organization_id', organizationId)
                .order('billing_period_start', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            set({ usage: data || null });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        }
    },

    getSetupProgress: () => {
        const config = get().config;
        if (!config) return 0;
        return Math.min((config.setup_step / 3) * 100, 100);
    },

    isSetupComplete: () => {
        const config = get().config;
        return config?.setup_completed ?? false;
    },
}));
