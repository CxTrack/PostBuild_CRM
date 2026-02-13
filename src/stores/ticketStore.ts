import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'bug' | 'general';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    category: TicketCategory;
    customer_id?: string;
    customer_name: string;
    customer_email?: string;
    organization_name?: string;
    assigned_to?: string;
    assigned_to_name?: string;
    labels: string[];
    due_date?: string;
    resolved_at?: string;
    created_at: string;
    updated_at: string;
    organization_id: string;
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    message: string;
    is_internal: boolean;
    created_at: string;
}

export interface TicketActivity {
    id: string;
    ticket_id: string;
    user_name: string;
    action: string;
    field?: string;
    old_value?: string;
    new_value?: string;
    created_at: string;
}

interface TicketFilters {
    status: TicketStatus | 'all';
    priority: TicketPriority | 'all';
    category: TicketCategory | 'all';
    assignee: string | 'all';
    search: string;
}

interface TicketStore {
    tickets: Ticket[];
    messages: Record<string, TicketMessage[]>;
    activities: Record<string, TicketActivity[]>;
    loading: boolean;
    error: string | null;
    filters: TicketFilters;

    // Actions
    fetchTickets: () => Promise<void>;
    createTicket: (data: Partial<Ticket>) => Promise<Ticket>;
    updateTicket: (id: string, data: Partial<Ticket>) => Promise<Ticket>;
    deleteTicket: (id: string) => Promise<void>;
    updateStatus: (id: string, status: TicketStatus) => Promise<Ticket>;
    assignTicket: (id: string, userId: string, userName: string) => Promise<Ticket>;

    // Messages
    fetchMessages: (ticketId: string) => Promise<TicketMessage[]>;
    addMessage: (ticketId: string, message: string, isInternal?: boolean) => Promise<TicketMessage>;

    // Filters
    setFilter: (key: keyof TicketFilters, value: string) => void;
    resetFilters: () => void;

    // Getters
    getFilteredTickets: () => Ticket[];
    getTicketById: (id: string) => Ticket | undefined;
    getStats: () => { open: number; inProgress: number; urgent: number; avgResponseTime: string };
}

const DEFAULT_FILTERS: TicketFilters = {
    status: 'all',
    priority: 'all',
    category: 'all',
    assignee: 'all',
    search: '',
};

export const useTicketStore = create<TicketStore>((set, get) => ({
    tickets: [],
    messages: {},
    activities: {},
    loading: false,
    error: null,
    filters: DEFAULT_FILTERS,

    fetchTickets: async () => {
        set({ loading: true, error: null });

        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            if (!organizationId) {
                set({ loading: false });
                return;
            }

            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({ tickets: data || [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    createTicket: async (data) => {
        set({ loading: true, error: null });

        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            const { data: ticketData, error } = await supabase
                .from('support_tickets')
                .insert({
                    ...data,
                    organization_id: organizationId,
                    status: 'open',
                })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                tickets: [ticketData, ...state.tickets],
                loading: false,
            }));

            return ticketData;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateTicket: async (id, data) => {
        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            if (!organizationId) {
                throw new Error('No organization selected');
            }

            const { data: ticketData, error } = await supabase
                .from('support_tickets')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('organization_id', organizationId)
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                tickets: state.tickets.map(t => t.id === id ? ticketData : t),
            }));

            return ticketData;
        } catch (error: any) {
            throw error;
        }
    },

    deleteTicket: async (id) => {
        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            if (!organizationId) {
                throw new Error('No organization selected');
            }

            const { error } = await supabase
                .from('support_tickets')
                .delete()
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) throw error;

            set((state) => ({
                tickets: state.tickets.filter(t => t.id !== id),
            }));
        } catch (error: any) {
            throw error;
        }
    },

    updateStatus: async (id, status) => {
        const updates: Partial<Ticket> = { status };
        if (status === 'resolved' || status === 'closed') {
            updates.resolved_at = new Date().toISOString();
        }
        return get().updateTicket(id, updates);
    },

    assignTicket: async (id, userId, userName) => {
        return get().updateTicket(id, {
            assigned_to: userId,
            assigned_to_name: userName,
        });
    },

    fetchMessages: async (ticketId) => {
        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            if (!organizationId) {
                return [];
            }

            // First verify ticket belongs to this organization
            const { data: ticket } = await supabase
                .from('support_tickets')
                .select('id')
                .eq('id', ticketId)
                .eq('organization_id', organizationId)
                .single();

            if (!ticket) {
                return [];
            }

            const { data, error } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            set((state) => ({
                messages: { ...state.messages, [ticketId]: data || [] },
            }));

            return data || [];
        } catch (error: any) {
            return [];
        }
    },

    addMessage: async (ticketId, message, isInternal = false) => {
        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            if (!organizationId) {
                throw new Error('No organization selected');
            }

            // Verify ticket belongs to this organization before adding message
            const { data: ticket } = await supabase
                .from('support_tickets')
                .select('id')
                .eq('id', ticketId)
                .eq('organization_id', organizationId)
                .single();

            if (!ticket) {
                throw new Error('Ticket not found or access denied');
            }

            const { data, error } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticketId,
                    message,
                    is_internal: isInternal,
                })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                messages: {
                    ...state.messages,
                    [ticketId]: [...(state.messages[ticketId] || []), data],
                },
            }));

            return data;
        } catch (error: any) {
            throw error;
        }
    },

    setFilter: (key, value) => {
        set((state) => ({
            filters: { ...state.filters, [key]: value },
        }));
    },

    resetFilters: () => {
        set({ filters: DEFAULT_FILTERS });
    },

    getFilteredTickets: () => {
        const { tickets, filters } = get();

        return tickets.filter(ticket => {
            if (filters.status !== 'all' && ticket.status !== filters.status) return false;
            if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
            if (filters.category !== 'all' && ticket.category !== filters.category) return false;
            if (filters.assignee !== 'all' && ticket.assigned_to !== filters.assignee) return false;
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const matchesTitle = ticket.title.toLowerCase().includes(search);
                const matchesDesc = ticket.description.toLowerCase().includes(search);
                const matchesCustomer = ticket.customer_name.toLowerCase().includes(search);
                const matchesId = ticket.id.toLowerCase().includes(search);
                if (!matchesTitle && !matchesDesc && !matchesCustomer && !matchesId) return false;
            }
            return true;
        });
    },

    getTicketById: (id) => {
        return get().tickets.find(t => t.id === id);
    },

    getStats: () => {
        const tickets = get().tickets;
        const open = tickets.filter(t => t.status === 'open').length;
        const inProgress = tickets.filter(t => t.status === 'in_progress').length;
        const urgent = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;

        // Calculate average response time (simplified)
        const avgResponseTime = '0h';

        return { open, inProgress, urgent, avgResponseTime };
    },
}));
