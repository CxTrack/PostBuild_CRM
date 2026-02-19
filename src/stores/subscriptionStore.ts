import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { CustomerSubscription, ChurnMetrics, CustomerLTV } from '../types/app.types';
import { useOrganizationStore } from './organizationStore';

interface SubscriptionState {
  subscriptions: CustomerSubscription[];
  loading: boolean;
  error: string | null;
  mrr: number;
  churnMetrics: ChurnMetrics | null;

  fetchSubscriptions: (organizationId?: string) => Promise<void>;
  createSubscription: (subscription: Omit<CustomerSubscription, 'id' | 'created_at' | 'updated_at'>) => Promise<CustomerSubscription | null>;
  updateSubscription: (id: string, updates: Partial<CustomerSubscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  cancelSubscription: (id: string, reason?: string) => Promise<void>;
  pauseSubscription: (id: string) => Promise<void>;
  resumeSubscription: (id: string) => Promise<void>;
  fetchMRR: (organizationId?: string) => Promise<number>;
  fetchChurnRate: (organizationId?: string, startDate?: string, endDate?: string) => Promise<ChurnMetrics | null>;
  fetchCustomerLTV: (organizationId?: string, customerId?: string) => Promise<CustomerLTV[]>;
  getSubscriptionById: (id: string) => CustomerSubscription | undefined;
  getSubscriptionsByCustomer: (customerId: string) => CustomerSubscription[];
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  loading: false,
  error: null,
  mrr: 0,
  churnMetrics: null,

  fetchSubscriptions: async (organizationId?: string) => {
    const orgId = organizationId || useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) {
      set({ loading: false, error: 'No organization selected' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('customer_subscriptions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ subscriptions: data || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  createSubscription: async (subscription) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('customer_subscriptions')
        .insert([subscription])
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('subscription_events').insert([{
        organization_id: subscription.organization_id,
        subscription_id: data.id,
        event_type: 'created',
        new_amount: subscription.amount,
        new_status: subscription.status,
        created_by: subscription.created_by,
      }]);

      set((state) => ({ subscriptions: [data, ...state.subscriptions] }));
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateSubscription: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const current = get().subscriptions.find(s => s.id === id);
      const { error } = await supabase
        .from('customer_subscriptions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Log amount change event if amount changed
      if (current && updates.amount !== undefined && updates.amount !== current.amount) {
        await supabase.from('subscription_events').insert([{
          organization_id: current.organization_id,
          subscription_id: id,
          event_type: updates.amount > current.amount ? 'upgraded' : 'downgraded',
          previous_amount: current.amount,
          new_amount: updates.amount,
        }]);
      }

      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  deleteSubscription: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.from('customer_subscriptions').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ subscriptions: state.subscriptions.filter((s) => s.id !== id) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  cancelSubscription: async (id, reason) => {
    const current = get().subscriptions.find(s => s.id === id);
    if (!current) return;

    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('customer_subscriptions')
        .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('subscription_events').insert([{
        organization_id: current.organization_id,
        subscription_id: id,
        event_type: 'cancelled',
        previous_status: current.status,
        new_status: 'cancelled',
        previous_amount: current.amount,
        reason: reason || undefined,
      }]);

      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === id ? { ...s, status: 'cancelled' as const, cancelled_at: now, updated_at: now } : s
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  pauseSubscription: async (id) => {
    const current = get().subscriptions.find(s => s.id === id);
    if (!current) return;

    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('customer_subscriptions')
        .update({ status: 'paused', paused_at: now, updated_at: now })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('subscription_events').insert([{
        organization_id: current.organization_id,
        subscription_id: id,
        event_type: 'paused',
        previous_status: current.status,
        new_status: 'paused',
      }]);

      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === id ? { ...s, status: 'paused' as const, paused_at: now, updated_at: now } : s
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  resumeSubscription: async (id) => {
    const current = get().subscriptions.find(s => s.id === id);
    if (!current) return;

    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('customer_subscriptions')
        .update({ status: 'active', paused_at: null, updated_at: now })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('subscription_events').insert([{
        organization_id: current.organization_id,
        subscription_id: id,
        event_type: 'resumed',
        previous_status: 'paused',
        new_status: 'active',
      }]);

      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === id ? { ...s, status: 'active' as const, paused_at: undefined, updated_at: now } : s
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  fetchMRR: async (organizationId?: string) => {
    const orgId = organizationId || useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) return 0;

    try {
      const { data, error } = await supabase.rpc('calculate_mrr', { p_organization_id: orgId });
      if (error) throw error;
      const mrr = Number(data) || 0;
      set({ mrr });
      return mrr;
    } catch (error) {
      console.error('fetchMRR error:', error);
      return 0;
    }
  },

  fetchChurnRate: async (organizationId?: string, startDate?: string, endDate?: string) => {
    const orgId = organizationId || useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) return null;

    try {
      const params: Record<string, any> = { p_organization_id: orgId };
      if (startDate) params.p_start_date = startDate;
      if (endDate) params.p_end_date = endDate;

      const { data, error } = await supabase.rpc('calculate_churn_rate', params);
      if (error) throw error;
      const metrics = data as ChurnMetrics;
      set({ churnMetrics: metrics });
      return metrics;
    } catch (error) {
      console.error('fetchChurnRate error:', error);
      return null;
    }
  },

  fetchCustomerLTV: async (organizationId?: string, customerId?: string) => {
    const orgId = organizationId || useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) return [];

    try {
      const params: Record<string, any> = { p_organization_id: orgId };
      if (customerId) params.p_customer_id = customerId;

      const { data, error } = await supabase.rpc('calculate_customer_ltv', params);
      if (error) throw error;
      return (data as CustomerLTV[]) || [];
    } catch (error) {
      console.error('fetchCustomerLTV error:', error);
      return [];
    }
  },

  getSubscriptionById: (id) => get().subscriptions.find((s) => s.id === id),

  getSubscriptionsByCustomer: (customerId) =>
    get().subscriptions.filter((s) => s.customer_id === customerId),
}));
