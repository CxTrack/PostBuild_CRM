import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useOrganizationStore } from './organizationStore';

export interface PipelineStage {
    id?: string;
    stage_key: string;
    stage_label: string;
    stage_order: number;
    default_probability: number;
    color_bg: string;
    color_text: string;
    is_terminal: boolean;
}

interface PipelineConfigState {
    stages: PipelineStage[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchPipelineStages: () => Promise<void>;
    getStageByKey: (key: string) => PipelineStage | undefined;
    getStageColor: (key: string) => { bg: string; text: string };
    getStageProbability: (key: string) => number;
    getOrderedStages: () => PipelineStage[];
}

export const usePipelineConfigStore = create<PipelineConfigState>((set, get) => ({
    stages: [],
    isLoading: false,
    error: null,

    fetchPipelineStages: async () => {
        const { currentOrganization } = useOrganizationStore.getState();
        if (!currentOrganization) {
            set({ stages: getDefaultStages(), isLoading: false });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            // First, check if org has custom pipeline stages
            const { data: orgStages, error: orgError } = await supabase
                .from('organization_pipeline_stages')
                .select('*')
                .eq('organization_id', currentOrganization.id)
                .eq('is_active', true)
                .order('stage_order');

            if (!orgError && orgStages && orgStages.length > 0) {
                set({ stages: orgStages });
                return;
            }

            // Otherwise, fetch industry template stages
            const industryTemplate = currentOrganization.industry_template || 'general_business';

            const { data: industryStages, error: industryError } = await supabase
                .from('industry_pipeline_stages')
                .select('*')
                .eq('industry_template', industryTemplate)
                .order('stage_order');

            if (industryError) {
                set({ stages: getDefaultStages(), error: industryError.message });
                return;
            }

            if (industryStages && industryStages.length > 0) {
                set({ stages: industryStages });
            } else {
                // Fallback to default stages
                set({ stages: getDefaultStages() });
            }
        } catch (err) {
            set({ stages: getDefaultStages(), error: 'Failed to load pipeline configuration' });
        } finally {
            set({ isLoading: false });
        }
    },

    getStageByKey: (key: string) => {
        return get().stages.find(s => s.stage_key === key);
    },

    getStageColor: (key: string) => {
        const stage = get().getStageByKey(key);
        if (stage) {
            return { bg: stage.color_bg, text: stage.color_text };
        }
        return { bg: 'bg-slate-100', text: 'text-slate-700' };
    },

    getStageProbability: (key: string) => {
        const stage = get().getStageByKey(key);
        return stage?.default_probability ?? 0;
    },

    getOrderedStages: () => {
        return [...get().stages].sort((a, b) => a.stage_order - b.stage_order);
    },
}));

// Default stages fallback (matches current hardcoded behavior)
function getDefaultStages(): PipelineStage[] {
    return [
        { stage_key: 'lead', stage_label: 'Lead', stage_order: 1, default_probability: 10, color_bg: 'bg-slate-100', color_text: 'text-slate-700', is_terminal: false },
        { stage_key: 'qualified', stage_label: 'Qualified', stage_order: 2, default_probability: 25, color_bg: 'bg-blue-100', color_text: 'text-blue-700', is_terminal: false },
        { stage_key: 'proposal', stage_label: 'Proposal', stage_order: 3, default_probability: 50, color_bg: 'bg-purple-100', color_text: 'text-purple-700', is_terminal: false },
        { stage_key: 'negotiation', stage_label: 'Negotiation', stage_order: 4, default_probability: 75, color_bg: 'bg-amber-100', color_text: 'text-amber-700', is_terminal: false },
        { stage_key: 'closed_won', stage_label: 'Closed Won', stage_order: 5, default_probability: 100, color_bg: 'bg-green-100', color_text: 'text-green-700', is_terminal: true },
        { stage_key: 'closed_lost', stage_label: 'Closed Lost', stage_order: 6, default_probability: 0, color_bg: 'bg-red-100', color_text: 'text-red-700', is_terminal: true },
    ];
}
