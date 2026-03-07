/**
 * Ticket Store
 * Zustand store for user-side support ticket operations.
 * Uses direct fetch() to Supabase REST API to avoid AbortController issues.
 */

import { create } from 'zustand';
import { getAuthToken } from '@/utils/auth.utils';
import { useOrganizationStore } from './organizationStore';
import type { AttachmentMeta } from '@/utils/ticketAttachments';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

export type TicketPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'bug' | 'bug_report' | 'general' | 'copilot_feedback' | 'data_request' | 'account_issue' | 'sms_reenable';

export interface Ticket {
    id: string;
    subject: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    category: TicketCategory;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
    organization_name?: string;
    assigned_to?: string;
    assigned_to_name?: string;
    labels?: string[];
    due_date?: string;
    resolved_at?: string;
    source?: string;
    created_at: string;
    updated_at: string;
    organization_id: string;
    user_id?: string;
    metadata?: Record<string, any>;
    ai_intake_log?: Array<{ role: string; content: string; timestamp: string }>;
    submission_method?: 'form' | 'sparky_ai' | 'api';
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    user_id: string;
    user_name?: string;
    user_avatar?: string;
    message: string;
    is_internal: boolean;
    attachments: AttachmentMeta[];
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

export interface CreateTicketFromSparkyData {
    subject: string;
    description: string;
    category: string;
    priority: string;
    attachments: AttachmentMeta[];
    aiIntakeLog: Array<{ role: string; content: string; timestamp: string }>;
    customer_id?: string;
    customer_name?: string;
    customer_email?: string;
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
    createTicketFromSparky: (data: CreateTicketFromSparkyData) => Promise<Ticket>;
    updateTicket: (id: string, data: Partial<Ticket>) => Promise<Ticket>;
    deleteTicket: (id: string) => Promise<void>;
    updateStatus: (id: string, status: TicketStatus) => Promise<Ticket>;
    assignTicket: (id: string, userId: string, userName: string) => Promise<Ticket>;

    // Messages
    fetchMessages: (ticketId: string) => Promise<TicketMessage[]>;
    addMessage: (ticketId: string, message: string, isInternal?: boolean, attachments?: AttachmentMeta[]) => Promise<TicketMessage>;
    userReplyToTicket: (ticketId: string, message: string, attachments?: AttachmentMeta[]) => Promise<TicketMessage>;

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

// Helper: build headers for Supabase REST API
async function buildHeaders(): Promise<Record<string, string>> {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');
    return {
        'Authorization': `Bearer ${token}`,
        'apikey': token,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    };
}

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
            if (!organizationId) { set({ loading: false }); return; }

            const headers = await buildHeaders();
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/support_tickets?organization_id=eq.${organizationId}&order=created_at.desc`,
                { headers }
            );
            if (!res.ok) throw new Error('Failed to fetch tickets');
            const data = await res.json();
            set({ tickets: data || [] });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        } finally {
            set({ loading: false });
        }
    },

    createTicket: async (data) => {
        set({ loading: true, error: null });
        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            const headers = await buildHeaders();
            const res = await fetch(`${SUPABASE_URL}/rest/v1/support_tickets`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ...data,
                    organization_id: organizationId,
                    status: 'open',
                }),
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                throw new Error(errText || 'Failed to create ticket');
            }
            const [ticketData] = await res.json();
            set((state) => ({ tickets: [ticketData, ...state.tickets] }));
            return ticketData;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    createTicketFromSparky: async (data) => {
        set({ loading: true, error: null });
        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            const orgName = useOrganizationStore.getState().currentOrganization?.name;
            const headers = await buildHeaders();

            // 1. Create the ticket
            const ticketPayload: Record<string, any> = {
                subject: data.subject,
                description: data.description,
                category: data.category,
                priority: data.priority,
                organization_id: organizationId,
                organization_name: orgName,
                status: 'open',
                source: 'sparky_ai',
                submission_method: 'sparky_ai',
                ai_intake_log: data.aiIntakeLog,
            };
            if (data.customer_id) ticketPayload.customer_id = data.customer_id;
            if (data.customer_name) ticketPayload.customer_name = data.customer_name;
            if (data.customer_email) ticketPayload.customer_email = data.customer_email;

            const res = await fetch(`${SUPABASE_URL}/rest/v1/support_tickets`, {
                method: 'POST',
                headers,
                body: JSON.stringify(ticketPayload),
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                throw new Error(errText || 'Failed to create ticket');
            }
            const [ticket] = await res.json();

            // 2. Create the initial message with attachments
            if (data.description.trim()) {
                await fetch(`${SUPABASE_URL}/rest/v1/ticket_messages`, {
                    method: 'POST',
                    headers: { ...headers, 'Prefer': 'return=minimal' },
                    body: JSON.stringify({
                        ticket_id: ticket.id,
                        message: data.description,
                        is_internal: false,
                        attachments: data.attachments.length > 0 ? data.attachments : [],
                    }),
                });
            }

            set((state) => ({ tickets: [ticket, ...state.tickets] }));
            return ticket;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    updateTicket: async (id, data) => {
        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            if (!organizationId) throw new Error('No organization selected');

            const headers = await buildHeaders();
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/support_tickets?id=eq.${id}&organization_id=eq.${organizationId}`,
                {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
                }
            );
            if (!res.ok) throw new Error('Failed to update ticket');
            const [ticketData] = await res.json();
            set((state) => ({
                tickets: state.tickets.map(t => t.id === id ? ticketData : t),
            }));
            return ticketData;
        } catch (error) {
            throw error;
        }
    },

    deleteTicket: async (id) => {
        try {
            const organizationId = useOrganizationStore.getState().currentOrganization?.id;
            if (!organizationId) throw new Error('No organization selected');

            const headers = await buildHeaders();
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/support_tickets?id=eq.${id}&organization_id=eq.${organizationId}`,
                { method: 'DELETE', headers }
            );
            if (!res.ok) throw new Error('Failed to delete ticket');
            set((state) => ({
                tickets: state.tickets.filter(t => t.id !== id),
            }));
        } catch (error) {
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
            const headers = await buildHeaders();
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/ticket_messages?ticket_id=eq.${ticketId}&order=created_at.asc`,
                { headers }
            );
            if (!res.ok) return [];
            const data = await res.json();
            set((state) => ({
                messages: { ...state.messages, [ticketId]: data || [] },
            }));
            return data || [];
        } catch {
            return [];
        }
    },

    addMessage: async (ticketId, message, isInternal = false, attachments) => {
        try {
            const headers = await buildHeaders();
            const res = await fetch(`${SUPABASE_URL}/rest/v1/ticket_messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ticket_id: ticketId,
                    message,
                    is_internal: isInternal,
                    attachments: attachments || [],
                }),
            });
            if (!res.ok) throw new Error('Failed to add message');
            const [data] = await res.json();
            set((state) => ({
                messages: {
                    ...state.messages,
                    [ticketId]: [...(state.messages[ticketId] || []), data],
                },
            }));
            return data;
        } catch (error) {
            throw error;
        }
    },

    userReplyToTicket: async (ticketId, message, attachments) => {
        try {
            const headers = await buildHeaders();
            const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/user_reply_ticket`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    p_ticket_id: ticketId,
                    p_message: message,
                    p_attachments: attachments || [],
                }),
            });
            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                throw new Error(errText || 'Failed to reply to ticket');
            }
            const data = await res.json();
            // Refresh messages for this ticket
            get().fetchMessages(ticketId);
            return data;
        } catch (error) {
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
                const matchesSubject = ticket.subject?.toLowerCase().includes(search);
                const matchesDesc = ticket.description?.toLowerCase().includes(search);
                const matchesCustomer = ticket.customer_name?.toLowerCase().includes(search);
                const matchesId = ticket.id.toLowerCase().includes(search);
                if (!matchesSubject && !matchesDesc && !matchesCustomer && !matchesId) return false;
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
        const avgResponseTime = '0h';
        return { open, inProgress, urgent, avgResponseTime };
    },
}));
