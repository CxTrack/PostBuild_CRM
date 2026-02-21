import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';
import toast from 'react-hot-toast';
import { usePipelineConfigStore } from './pipelineConfigStore';

interface DealProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface DealCustomer {
  id: string;
  name: string;
  email?: string;
}

interface DealUserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export interface Deal {
  id: string;
  organization_id: string;
  customer_id: string;
  quote_id?: string;
  assigned_to?: string;
  stage: string; // Dynamic based on industry template
  title: string;
  description?: string;
  value: number;
  currency: string;
  probability: number;
  weighted_value: number;
  expected_close_date?: string;
  actual_close_date?: string;
  source: string;
  revenue_type: 'one_time' | 'recurring';
  recurring_interval?: 'monthly' | 'quarterly' | 'annual';
  products?: DealProduct[];
  tags?: string[];
  metadata?: Record<string, any>;
  product_id?: string;
  lender_id?: string;
  commission_percentage?: number;
  volume_commission_percentage?: number;
  commission_amount?: number;
  volume_commission_amount?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customers?: DealCustomer;
  user_profiles?: DealUserProfile;
  lenders?: { id: string; name: string; default_commission_pct: number; default_volume_commission_pct: number } | null;
  loan_product?: { id: string; name: string; loan_type: string; interest_rate_type: string; min_rate: number; max_rate: number } | null;
}

export interface PipelineStats {
  total_pipeline: number;
  weighted_pipeline: number;
  open_deals_count: number;
  won_deals_count: number;
  lost_deals_count: number;
  total_won_value: number;
  by_stage: {
    lead: { count: number; value: number; weighted: number };
    qualified: { count: number; value: number; weighted: number };
    proposal: { count: number; value: number; weighted: number };
    negotiation: { count: number; value: number; weighted: number };
  };
}

interface DealStore {
  deals: Deal[];
  pipelineStats: PipelineStats | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
  fetchDeals: () => Promise<void>;
  fetchDealById: (id: string) => Promise<Deal | null>;
  fetchPipelineStats: () => Promise<void>;
  createDeal: (deal: Partial<Deal>) => Promise<Deal>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  moveDealToStage: (id: string, stage: string) => Promise<void>;
  convertQuoteToDeal: (quoteId: string, dealData: Partial<Deal>) => Promise<Deal>;
  closeDealAsWon: (id: string) => Promise<void>;
  closeDealAsLost: (id: string, reason?: string) => Promise<void>;
}

const initialDealState = {
  deals: [] as Deal[],
  pipelineStats: null as PipelineStats | null,
  loading: false,
  error: null as string | null,
};

export const useDealStore = create<DealStore>((set, get) => ({
  ...initialDealState,

  reset: () => set(initialDealState),

  fetchDeals: async () => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) return;

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('pipeline_items')
        .select(`
          *,
          customers (
            id,
            name,
            first_name,
            last_name,
            company,
            email,
            phone
          ),
          user_profiles:assigned_to (
            id,
            full_name,
            email,
            avatar_url
          ),
          lenders:lender_id (
            id,
            name,
            default_commission_pct,
            default_volume_commission_pct
          ),
          loan_product:product_id (
            id,
            name,
            loan_type,
            interest_rate_type,
            min_rate,
            max_rate
          )
        `)
        .eq('organization_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ deals: data as Deal[] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      toast.error(message);
    } finally {
      set({ loading: false });
    }
  },

  fetchDealById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('pipeline_items')
        .select(`
          *,
          customers (
            id,
            name,
            first_name,
            last_name,
            company,
            email,
            phone,
            address,
            city,
            state,
            country
          ),
          user_profiles:assigned_to (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Deal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      return null;
    }
  },

  fetchPipelineStats: async () => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) return;

    try {
      const { data, error } = await supabase.rpc('calculate_pipeline_value', {
        p_organization_id: currentOrg.id,
      });

      if (error) throw error;

      set({ pipelineStats: data as PipelineStats });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    }
  },

  createDeal: async (dealData: Partial<Deal>) => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) throw new Error('No organization selected');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    try {
      const newDeal = {
        organization_id: currentOrg.id,
        created_by: user.id,
        assigned_to: dealData.assigned_to || user.id,
        customer_id: dealData.customer_id,
        title: dealData.title,
        description: dealData.description,
        value: dealData.value || 0,
        currency: dealData.currency || 'USD',
        stage: dealData.stage || 'lead',
        probability: Math.round(dealData.probability ?? getDefaultProbability(dealData.stage || 'lead')),
        expected_close_date: dealData.expected_close_date,
        source: dealData.source || 'other',
        revenue_type: dealData.revenue_type || 'one_time',
        recurring_interval: dealData.recurring_interval,
        products: dealData.products || [],
        tags: dealData.tags || [],
        metadata: dealData.metadata || {},
        quote_id: dealData.quote_id,
        product_id: dealData.product_id || null,
        lender_id: dealData.lender_id || null,
        commission_percentage: dealData.commission_percentage || 0,
        volume_commission_percentage: dealData.volume_commission_percentage || 0,
        commission_amount: dealData.commission_percentage
          ? (dealData.value || 0) * (dealData.commission_percentage / 100)
          : 0,
        volume_commission_amount: dealData.volume_commission_percentage
          ? (dealData.value || 0) * (dealData.volume_commission_percentage / 100)
          : 0,
      };

      const { data, error } = await supabase
        .from('pipeline_items')
        .insert([newDeal])
        .select()
        .single();

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Deal created successfully');

      return data as Deal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      throw error;
    }
  },

  updateDeal: async (id: string, updates: Partial<Deal>) => {
    try {
      const updateData: Partial<Deal> = { ...updates };

      if (updates.stage) {
        (updateData as any).probability = Math.round(updates.probability ?? getDefaultProbability(updates.stage));
      }

      const { error } = await supabase
        .from('pipeline_items')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      throw error;
    }
  },

  deleteDeal: async (id: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Deal deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      throw error;
    }
  },

  moveDealToStage: async (id: string, stage: Deal['stage']) => {
    try {
      const probability = Math.round(getDefaultProbability(stage));

      const updates: Partial<Deal> = {
        stage,
        probability,
      };

      if (stage === 'closed_won' || stage === 'closed_lost') {
        updates.actual_close_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('pipeline_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success(`Deal moved to ${formatStageName(stage)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      throw error;
    }
  },

  convertQuoteToDeal: async (quoteId: string, dealData: Partial<Deal>) => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) throw new Error('No organization selected');

    try {
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newDeal = {
        organization_id: currentOrg.id,
        created_by: user.id,
        assigned_to: dealData.assigned_to || user.id,
        customer_id: quote.customer_id,
        quote_id: quoteId,
        title: dealData.title || `Deal from Quote ${quote.quote_number}`,
        description: dealData.description,
        value: quote.total_amount,
        currency: quote.currency || 'USD',
        stage: 'proposal',
        probability: 50,
        expected_close_date: dealData.expected_close_date,
        source: 'quote',
        revenue_type: dealData.revenue_type || 'one_time',
        recurring_interval: dealData.recurring_interval,
        products: dealData.products || [],
        tags: dealData.tags || [],
      };

      const { data: deal, error: dealError } = await supabase
        .from('pipeline_items')
        .insert([newDeal])
        .select()
        .single();

      if (dealError) throw dealError;

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          deal_id: deal.id,
          converted_to_deal: true,
          converted_deal_date: new Date().toISOString(),
          status: 'converted',
        })
        .eq('id', quoteId);

      if (updateError) throw updateError;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Quote converted to deal successfully');

      return deal as Deal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      throw error;
    }
  },

  closeDealAsWon: async (id: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_items')
        .update({
          stage: 'closed_won',
          probability: 100,
          actual_close_date: new Date().toISOString().split('T')[0],
          final_status: 'Sale',
        })
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Deal closed as won!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      throw error;
    }
  },

  closeDealAsLost: async (id: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_items')
        .update({
          stage: 'closed_lost',
          probability: 0,
          actual_close_date: new Date().toISOString().split('T')[0],
          final_status: 'No Sale',
          lost_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;

      await get().fetchDeals();
      await get().fetchPipelineStats();
      toast.success('Deal closed as lost');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
      throw error;
    }
  },
}));

function getDefaultProbability(stage: string): number {
  const { getStageProbability } = usePipelineConfigStore.getState();
  return getStageProbability(stage);
}

function formatStageName(stage: string): string {
  const { getStageByKey } = usePipelineConfigStore.getState();
  const stageData = getStageByKey(stage);
  if (stageData) return stageData.stage_label;

  const names: Record<string, string> = {
    lead: 'Lead',
    qualified: 'Qualified',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    closed_won: 'Closed Won',
    closed_lost: 'Closed Lost',
  };
  return names[stage] || stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ');
}
