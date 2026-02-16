import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';
import toast from 'react-hot-toast';

export interface Lender {
  id: string;
  organization_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  account_executive: string | null;
  ae_phone: string | null;
  ae_email: string | null;
  loan_types: string[];
  min_credit_score: number | null;
  is_preferred: boolean;
  avg_turn_time_days: number | null;
  rating: number | null;
  notes: string | null;
  default_commission_pct: number;
  default_volume_commission_pct: number;
  created_at: string;
  updated_at: string;
}

interface LenderStore {
  lenders: Lender[];
  loading: boolean;
  error: string | null;
  reset: () => void;
  fetchLenders: () => Promise<void>;
  createLender: (data: Partial<Lender>) => Promise<Lender>;
  updateLender: (id: string, data: Partial<Lender>) => Promise<void>;
  deleteLender: (id: string) => Promise<void>;
  getLenderById: (id: string) => Lender | undefined;
}

const initialState = {
  lenders: [] as Lender[],
  loading: false,
  error: null as string | null,
};

export const useLenderStore = create<LenderStore>((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  fetchLenders: async () => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) return;

    // Industry guard: lenders are only relevant for mortgage_broker
    if (currentOrg.industry_template !== 'mortgage_broker') return;

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('lenders')
        .select('*')
        .eq('organization_id', currentOrg.id)
        .order('is_preferred', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      set({ lenders: (data || []) as Lender[] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch lenders';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  createLender: async (data) => {
    const currentOrg = useOrganizationStore.getState().currentOrganization;
    if (!currentOrg) throw new Error('No organization selected');

    try {
      const newLender = {
        organization_id: currentOrg.id,
        name: data.name!,
        contact_name: data.contact_name || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        account_executive: data.account_executive || null,
        ae_phone: data.ae_phone || null,
        ae_email: data.ae_email || null,
        loan_types: data.loan_types || [],
        min_credit_score: data.min_credit_score || null,
        is_preferred: data.is_preferred || false,
        avg_turn_time_days: data.avg_turn_time_days || null,
        rating: data.rating || null,
        notes: data.notes || null,
        default_commission_pct: data.default_commission_pct || 0,
        default_volume_commission_pct: data.default_volume_commission_pct || 0,
      };

      const { data: created, error } = await supabase
        .from('lenders')
        .insert([newLender])
        .select()
        .single();

      if (error) throw error;

      const lender = created as Lender;
      set((state) => ({ lenders: [lender, ...state.lenders] }));
      toast.success('Lender added successfully');
      return lender;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create lender';
      toast.error(message);
      throw error;
    }
  },

  updateLender: async (id, data) => {
    try {
      const { error } = await supabase
        .from('lenders')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        lenders: state.lenders.map((l) =>
          l.id === id ? { ...l, ...data } as Lender : l
        ),
      }));
      toast.success('Lender updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update lender';
      toast.error(message);
      throw error;
    }
  },

  deleteLender: async (id) => {
    try {
      const { error } = await supabase
        .from('lenders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        lenders: state.lenders.filter((l) => l.id !== id),
      }));
      toast.success('Lender deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete lender';
      toast.error(message);
      throw error;
    }
  },

  getLenderById: (id) => {
    return get().lenders.find((l) => l.id === id);
  },
}));
