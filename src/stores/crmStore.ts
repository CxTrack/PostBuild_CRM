import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';
import { Lead, Opportunity } from '@/types/database.types';
import toast from 'react-hot-toast';

interface CRMStore {
    leads: Lead[];
    opportunities: Opportunity[];
    loading: boolean;

    fetchLeads: () => Promise<void>;
    fetchOpportunities: () => Promise<void>;

    createLead: (lead: Partial<Lead>) => Promise<Lead | null>;
    updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;

    createOpportunity: (opp: Partial<Opportunity>) => Promise<Opportunity | null>;
    updateOpportunity: (id: string, updates: Partial<Opportunity>) => Promise<void>;
    deleteOpportunity: (id: string) => Promise<void>;

    convertLeadToOpportunity: (leadId: string, appointmentDate: Date) => Promise<void>;
    markOpportunityWon: (oppId: string) => Promise<void>;
    markOpportunityLost: (oppId: string, reason: string) => Promise<void>;
}

export const useCRMStore = create<CRMStore>((set, get) => ({
    leads: [],
    opportunities: [],
    loading: false,

    fetchLeads: async () => {
        const currentOrg = useOrganizationStore.getState().currentOrganization;
        if (!currentOrg) return;

        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ leads: data as Lead[], loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
            set({ loading: false });
        }
    },

    fetchOpportunities: async () => {
        const currentOrg = useOrganizationStore.getState().currentOrganization;
        if (!currentOrg) return;

        set({ loading: true });
        try {
            const { data, error } = await supabase
                .from('opportunities')
                .select(`
                  *,
                  leads (name, company),
                  customers (name, company)
                `)
                .eq('organization_id', currentOrg.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ opportunities: data as any[], loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
            set({ loading: false });
        }
    },

    createLead: async (leadData) => {
        const currentOrg = useOrganizationStore.getState().currentOrganization;
        if (!currentOrg) return null;

        try {
            // Set default probability based on status
            let probability = 0.1;
            if (leadData.status === 'contacted') probability = 0.15;
            if (leadData.status === 'nurturing') probability = 0.20;
            if (leadData.status === 'qualified') probability = 0.30;

            const { data, error } = await supabase
                .from('leads')
                .insert({
                    ...leadData,
                    organization_id: currentOrg.id,
                    probability
                })
                .select()
                .single();

            if (error) throw error;

            set(state => ({ leads: [data as Lead, ...state.leads] }));
            toast.success('Lead created successfully');
            return data as Lead;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
            return null;
        }
    },

    updateLead: async (id, updates) => {
        try {
            const currentOrg = useOrganizationStore.getState().currentOrganization;
            if (!currentOrg) {
                toast.error('No organization selected');
                return;
            }

            // Recalculate probability if status changes
            if (updates.status) {
                if (updates.status === 'new') updates.probability = 0.10;
                if (updates.status === 'contacted') updates.probability = 0.15;
                if (updates.status === 'nurturing') updates.probability = 0.20;
                if (updates.status === 'qualified') updates.probability = 0.30;
                if (updates.status === 'dead') updates.probability = 0.0;
            }

            const { error } = await supabase
                .from('leads')
                .update(updates)
                .eq('id', id)
                .eq('organization_id', currentOrg.id);

            if (error) throw error;

            set(state => ({
                leads: state.leads.map(l => l.id === id ? { ...l, ...updates } : l)
            }));
            toast.success('Lead updated');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
        }
    },

    deleteLead: async (id) => {
        try {
            const currentOrg = useOrganizationStore.getState().currentOrganization;
            if (!currentOrg) {
                toast.error('No organization selected');
                return;
            }

            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', id)
                .eq('organization_id', currentOrg.id);

            if (error) throw error;

            set(state => ({ leads: state.leads.filter(l => l.id !== id) }));
            toast.success('Lead deleted');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
        }
    },

    createOpportunity: async (oppData) => {
        const currentOrg = useOrganizationStore.getState().currentOrganization;
        if (!currentOrg) return null;

        try {
            // Set default probability based on stage
            let probability = 0.40;
            if (oppData.stage === 'demo_scheduled') probability = 0.50;
            if (oppData.stage === 'proposal') probability = 0.60;
            if (oppData.stage === 'negotiation') probability = 0.75;
            if (oppData.stage === 'won') probability = 1.0;
            if (oppData.stage === 'lost') probability = 0.0;

            const { data, error } = await supabase
                .from('opportunities')
                .insert({
                    ...oppData,
                    organization_id: currentOrg.id,
                    probability
                })
                .select()
                .single();

            if (error) throw error;

            set(state => ({ opportunities: [data as Opportunity, ...state.opportunities] }));
            toast.success('Opportunity created');
            return data as Opportunity;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
            return null;
        }
    },

    updateOpportunity: async (id, updates) => {
        try {
            const currentOrg = useOrganizationStore.getState().currentOrganization;
            if (!currentOrg) {
                toast.error('No organization selected');
                return;
            }

            // Recalculate probability if stage changes
            if (updates.stage) {
                if (updates.stage === 'discovery') updates.probability = 0.40;
                if (updates.stage === 'demo_scheduled') updates.probability = 0.50;
                if (updates.stage === 'proposal') updates.probability = 0.60;
                if (updates.stage === 'negotiation') updates.probability = 0.75;
                if (updates.stage === 'won') updates.probability = 1.0;
                if (updates.stage === 'lost') updates.probability = 0.0;
            }

            const { error } = await supabase
                .from('opportunities')
                .update(updates)
                .eq('id', id)
                .eq('organization_id', currentOrg.id);

            if (error) throw error;

            set(state => ({
                opportunities: state.opportunities.map(o => o.id === id ? { ...o, ...updates } : o)
            }));
            toast.success('Opportunity updated');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
        }
    },

    deleteOpportunity: async (id) => {
        try {
            const currentOrg = useOrganizationStore.getState().currentOrganization;
            if (!currentOrg) {
                toast.error('No organization selected');
                return;
            }

            const { error } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', id)
                .eq('organization_id', currentOrg.id);

            if (error) throw error;

            set(state => ({ opportunities: state.opportunities.filter(o => o.id !== id) }));
            toast.success('Opportunity deleted');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
        }
    },

    convertLeadToOpportunity: async (leadId, appointmentDate) => {
        try {
            const lead = get().leads.find(l => l.id === leadId);
            if (!lead) throw new Error('Lead not found');

            const currentOrg = useOrganizationStore.getState().currentOrganization;
            if (!currentOrg) return;

            // 1. Create Opportunity
            const { data: opp, error: oppError } = await supabase
                .from('opportunities')
                .insert({
                    organization_id: currentOrg.id,
                    lead_id: leadId,
                    name: `${lead.company ? lead.company + ' - ' : ''}${lead.name}`,
                    description: lead.notes,
                    stage: 'discovery',
                    value: lead.potential_value,
                    probability: 0.40,
                    appointment_date: appointmentDate.toISOString(),
                    expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    assigned_to: lead.assigned_to
                })
                .select()
                .single();

            if (oppError) throw oppError;

            // 2. Update Lead
            await get().updateLead(leadId, {
                status: 'qualified',
                converted_to_opportunity_id: opp.id
            });

            // 3. Add to store
            set(state => ({ opportunities: [opp as Opportunity, ...state.opportunities] }));

            toast.success('Lead converted to Opportunity!');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
        }
    },

    markOpportunityWon: async (oppId) => {
        try {
            const opp = get().opportunities.find(o => o.id === oppId);
            if (!opp) return;

            // 1. Create Invoice (Draft)
            const { data: invoice, error: invError } = await supabase
                .from('invoices')
                .insert({
                    organization_id: opp.organization_id,
                    customer_id: opp.customer_id,
                    opportunity_id: oppId,
                    total_amount: opp.value,
                    status: 'Draft',
                    date: new Date().toISOString(),
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .select()
                .single();

            if (invError) {
            }

            // 2. Update Opportunity
            await get().updateOpportunity(oppId, {
                stage: 'won',
                probability: 1.0,
                actual_close_date: new Date().toISOString(),
                invoice_id: invoice?.id
            });

            toast.success('Opportunity marked Won!');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            toast.error(message);
        }
    },

    markOpportunityLost: async (oppId, reason) => {
        await get().updateOpportunity(oppId, {
            stage: 'lost',
            probability: 0.0,
            actual_close_date: new Date().toISOString(),
            lost_reason: reason
        });
    }

}));
