import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';
import { retellService, type ProvisionVoiceAgentParams, type UpdateAgentParams, type KnowledgeBase, type ManageKBParams, type RetellVoice } from '@/services/retell.service';

export type AgentTone = 'professional' | 'friendly' | 'casual' | 'formal';
export type HandlingPreference = 'handle_automatically' | 'notify_team' | 'transfer_immediately';
export type FallbackBehavior = 'transfer_to_voicemail' | 'take_message' | 'schedule_callback' | 'transfer_to_human';
export type ProvisioningStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

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
    retell_agent_id?: string;
    retell_phone_number?: string;
    provisioning_status?: ProvisioningStatus;
    provisioning_error?: string;
    broker_phone?: string;
    broker_name?: string;
    general_prompt?: string;
    begin_message?: string;
    // Memory/RAG settings
    memory_enabled?: boolean;
    memory_call_history?: boolean;
    memory_customer_notes?: boolean;
    memory_calendar_tasks?: boolean;
    retell_llm_id?: string;
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
    provisioning: boolean;
    error: string | null;
    fetchConfig: () => Promise<void>;
    saveConfig: (data: Partial<VoiceAgentConfig>) => Promise<VoiceAgentConfig>;
    updateSetupStep: (step: number) => Promise<void>;
    activateAgent: () => Promise<void>;
    deactivateAgent: () => Promise<void>;
    fetchUsage: () => Promise<void>;
    getSetupProgress: () => number;
    isSetupComplete: () => boolean;
    isProvisioned: () => boolean;
    getPhoneNumber: () => string | null;
    provisionAgent: (params: Omit<ProvisionVoiceAgentParams, 'organizationId'>) => Promise<{ success: boolean; phoneNumber?: string; error?: string }>;
    updateRetellAgent: (params: Omit<UpdateAgentParams, 'organizationId'>) => Promise<{ success: boolean; error?: string }>;
    fetchRetellPrompt: () => Promise<{ general_prompt?: string; begin_message?: string } | null>;
    // Knowledge base actions
    knowledgeBases: KnowledgeBase[];
    kbLoading: boolean;
    fetchKnowledgeBases: () => Promise<void>;
    createKnowledgeBase: (name: string, texts?: Array<{ title: string; text: string }>, urls?: string[]) => Promise<{ success: boolean; knowledgeBaseId?: string; error?: string }>;
    addTextToKB: (knowledgeBaseId: string, title: string, text: string) => Promise<{ success: boolean; error?: string }>;
    addUrlToKB: (knowledgeBaseId: string, url: string) => Promise<{ success: boolean; error?: string }>;
    deleteKnowledgeBase: (knowledgeBaseId: string) => Promise<{ success: boolean; error?: string }>;
    attachKBsToAgent: (knowledgeBaseIds: string[]) => Promise<{ success: boolean; error?: string }>;
    // Voice selection
    voices: RetellVoice[];
    voicesLoading: boolean;
    currentVoiceId: string | null;
    fetchVoices: () => Promise<void>;
    setVoice: (voiceId: string) => Promise<{ success: boolean; error?: string }>;
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
    provisioning: false,
    error: null,
    knowledgeBases: [],
    kbLoading: false,
    voices: [],
    voicesLoading: false,
    currentVoiceId: null,

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
            // Use RPC to auto-create usage record if none exists for current billing period
            const { data, error } = await supabase
                .rpc('get_or_create_voice_usage', { p_organization_id: organizationId })
                .single();

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

    isProvisioned: () => {
        const config = get().config;
        return config?.provisioning_status === 'completed' && !!config?.retell_agent_id;
    },

    getPhoneNumber: () => {
        const config = get().config;
        return config?.retell_phone_number || null;
    },

    provisionAgent: async (params) => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            return { success: false, error: 'No organization selected' };
        }

        set({ provisioning: true, error: null });
        try {
            const result = await retellService.provisionVoiceAgent({
                ...params,
                organizationId,
            });

            if (result.success) {
                // Refresh config to get updated provisioning status
                await get().fetchConfig();
            }

            return {
                success: result.success,
                phoneNumber: result.phoneNumberPretty || result.phoneNumber,
                error: result.error,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Provisioning failed';
            set({ error: message });
            return { success: false, error: message };
        } finally {
            set({ provisioning: false });
        }
    },

    updateRetellAgent: async (params) => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            return { success: false, error: 'No organization selected' };
        }

        set({ loading: true, error: null });
        try {
            const result = await retellService.updateAgent({
                organizationId,
                ...params,
            });

            if (result.success) {
                await get().fetchConfig();
            }

            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Update failed';
            set({ error: message });
            return { success: false, error: message };
        } finally {
            set({ loading: false });
        }
    },

    fetchRetellPrompt: async () => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) return null;

        try {
            const result = await retellService.fetchAgentPrompt(organizationId);
            if (result.success && (result.general_prompt || result.begin_message)) {
                // Merge into current config
                const currentConfig = get().config;
                if (currentConfig) {
                    set({
                        config: {
                            ...currentConfig,
                            general_prompt: result.general_prompt || currentConfig.general_prompt,
                            begin_message: result.begin_message || currentConfig.begin_message,
                        },
                    });
                }
                return { general_prompt: result.general_prompt, begin_message: result.begin_message };
            }
            return null;
        } catch {
            return null;
        }
    },

    // Knowledge Base methods
    fetchKnowledgeBases: async () => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) return;

        set({ kbLoading: true });
        try {
            const result = await retellService.manageKnowledgeBase({
                organizationId,
                action: 'list',
            });

            if (result.success && result.knowledgeBases) {
                set({ knowledgeBases: result.knowledgeBases });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch knowledge bases';
            set({ error: message });
        } finally {
            set({ kbLoading: false });
        }
    },

    createKnowledgeBase: async (name, texts, urls) => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            return { success: false, error: 'No organization selected' };
        }

        set({ kbLoading: true });
        try {
            const result = await retellService.manageKnowledgeBase({
                organizationId,
                action: 'create',
                knowledgeBaseName: name,
                texts,
                urls,
            });

            if (result.success) {
                await get().fetchKnowledgeBases();
            }

            return {
                success: result.success,
                knowledgeBaseId: result.knowledgeBaseId,
                error: result.error,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create knowledge base';
            return { success: false, error: message };
        } finally {
            set({ kbLoading: false });
        }
    },

    addTextToKB: async (knowledgeBaseId, title, text) => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            return { success: false, error: 'No organization selected' };
        }

        try {
            const result = await retellService.manageKnowledgeBase({
                organizationId,
                action: 'add_text',
                knowledgeBaseId,
                title,
                text,
            });

            if (result.success) {
                await get().fetchKnowledgeBases();
            }

            return { success: result.success, error: result.error };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to add text';
            return { success: false, error: message };
        }
    },

    addUrlToKB: async (knowledgeBaseId, url) => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            return { success: false, error: 'No organization selected' };
        }

        try {
            const result = await retellService.manageKnowledgeBase({
                organizationId,
                action: 'add_url',
                knowledgeBaseId,
                url,
            });

            if (result.success) {
                await get().fetchKnowledgeBases();
            }

            return { success: result.success, error: result.error };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to add URL';
            return { success: false, error: message };
        }
    },

    deleteKnowledgeBase: async (knowledgeBaseId) => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            return { success: false, error: 'No organization selected' };
        }

        set({ kbLoading: true });
        try {
            const result = await retellService.manageKnowledgeBase({
                organizationId,
                action: 'delete',
                knowledgeBaseId,
            });

            if (result.success) {
                set((state) => ({
                    knowledgeBases: state.knowledgeBases.filter(
                        (kb) => kb.knowledge_base_id !== knowledgeBaseId
                    ),
                }));
            }

            return { success: result.success, error: result.error };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete knowledge base';
            return { success: false, error: message };
        } finally {
            set({ kbLoading: false });
        }
    },

    attachKBsToAgent: async (knowledgeBaseIds) => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            return { success: false, error: 'No organization selected' };
        }

        try {
            const result = await retellService.manageKnowledgeBase({
                organizationId,
                action: 'attach_to_agent',
                knowledgeBaseIds,
            });

            return { success: result.success, error: result.error };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to attach knowledge bases';
            return { success: false, error: message };
        }
    },

    // Voice selection methods
    fetchVoices: async () => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;

        set({ voicesLoading: true, error: null });
        try {
            const result = await retellService.listVoices(organizationId || undefined);

            if (result.success && result.voices) {
                set({
                    voices: result.voices,
                    currentVoiceId: result.currentVoiceId || null,
                });
            } else if (result.error) {
                console.error('Failed to fetch voices:', result.error);
                set({ error: result.error });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch voices';
            console.error('fetchVoices error:', message);
            set({ error: message });
        } finally {
            set({ voicesLoading: false });
        }
    },

    setVoice: async (voiceId) => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            return { success: false, error: 'No organization selected' };
        }

        set({ voicesLoading: true });
        try {
            const result = await retellService.updateAgent({
                organizationId,
                voiceId,
            });

            if (result.success) {
                set({ currentVoiceId: voiceId });
            }

            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to set voice';
            return { success: false, error: message };
        } finally {
            set({ voicesLoading: false });
        }
    },
}));
