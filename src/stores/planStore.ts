import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price_monthly: number;      // in cents
    price_yearly?: number;      // in cents
    included_minutes: number;
    overage_rate_cents: number; // cents per minute over limit
    features: string[];
    is_active: boolean;
    is_default: boolean;
    is_popular?: boolean;
    stripe_price_id_monthly?: string;
    stripe_price_id_yearly?: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface PlanStore {
    plans: SubscriptionPlan[];
    loading: boolean;
    error: string | null;

    fetchPlans: () => Promise<void>;
    createPlan: (data: Partial<SubscriptionPlan>) => Promise<SubscriptionPlan>;
    updatePlan: (id: string, data: Partial<SubscriptionPlan>) => Promise<SubscriptionPlan>;
    deletePlan: (id: string) => Promise<void>;
    reorderPlans: (planIds: string[]) => Promise<void>;

    getActivePlans: () => SubscriptionPlan[];
    getDefaultPlan: () => SubscriptionPlan | undefined;
    getPlanById: (id: string) => SubscriptionPlan | undefined;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
    plans: [],
    loading: false,
    error: null,

    fetchPlans: async () => {
        set({ loading: true, error: null });

        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            set({ plans: data || [] });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ loading: false });
        }
    },

    createPlan: async (data) => {
        set({ loading: true, error: null });

        try {
            const { data: planData, error } = await supabase
                .from('subscription_plans')
                .insert({
                    ...data,
                    slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-'),
                })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                plans: [...state.plans, planData],
            }));

            return planData;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    updatePlan: async (id, data) => {
        try {
            const { data: planData, error } = await supabase
                .from('subscription_plans')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                plans: state.plans.map(p => p.id === id ? planData : p),
            }));

            return planData;
        } catch (error: any) {
            throw error;
        }
    },

    deletePlan: async (id) => {
        try {
            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                plans: state.plans.filter(p => p.id !== id),
            }));
        } catch (error: any) {
            throw error;
        }
    },

    reorderPlans: async (planIds) => {
        try {
            const updatedPlans = planIds.map((id, index) => {
                const plan = get().plans.find(p => p.id === id);
                return plan ? { ...plan, sort_order: index } : null;
            }).filter(Boolean) as SubscriptionPlan[];

            for (const plan of updatedPlans) {
                await supabase
                    .from('subscription_plans')
                    .update({ sort_order: plan.sort_order })
                    .eq('id', plan.id);
            }

            set({ plans: updatedPlans });
        } catch (error: any) {
            throw error;
        }
    },

    getActivePlans: () => {
        return get().plans.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
    },

    getDefaultPlan: () => {
        return get().plans.find(p => p.is_default);
    },

    getPlanById: (id) => {
        return get().plans.find(p => p.id === id);
    },
}));
