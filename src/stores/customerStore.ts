import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Customer, CustomerNote, CustomerContact, CustomerFile } from '@/types/database.types';
import { useOrganizationStore } from './organizationStore';

interface CustomerStore {
  customers: Customer[];
  currentCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  notes: CustomerNote[];
  contacts: CustomerContact[];
  files: CustomerFile[];

  // Reset store to initial state (for logout/org switch)
  reset: () => void;

  fetchCustomers: () => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  createCustomer: (customer: Partial<Customer>) => Promise<Customer | null>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  deleteCustomers: (ids: string[]) => Promise<{ succeeded: number; failed: number }>;
  bulkReassignCustomers: (ids: string[], newAssignedTo: string) => Promise<{ succeeded: number; failed: number }>;

  fetchNotes: (customerId: string) => Promise<void>;
  addNote: (note: Partial<CustomerNote>) => Promise<void>;
  updateNote: (id: string, updates: Partial<CustomerNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  fetchContacts: (customerId: string) => Promise<void>;
  addContact: (contact: Partial<CustomerContact>) => Promise<void>;
  updateContact: (id: string, updates: Partial<CustomerContact>) => Promise<void>;
  deleteContact: (id: string, customerId: string) => Promise<void>;

  fetchFiles: (customerId: string) => Promise<void>;
}

// Initial state for reset
const initialCustomerState = {
  customers: [] as Customer[],
  currentCustomer: null as Customer | null,
  loading: false,
  error: null as string | null,
  notes: [] as CustomerNote[],
  contacts: [] as CustomerContact[],
  files: [] as CustomerFile[],
};

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  ...initialCustomerState,

  // Reset store to initial state (for logout/org switch)
  reset: () => set(initialCustomerState),

  fetchCustomers: async () => {
    set({ loading: true, error: null });

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*, assigned_user:assigned_to(id, full_name, email, avatar_url)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ customers: data || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  fetchCustomerById: async (id: string) => {
    set({ loading: true, error: null });

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ loading: false, error: 'No organization selected' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*, assigned_user:assigned_to(id, full_name, email, avatar_url)')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      set({ currentCustomer: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  getCustomerById: (id: string) => {
    const state = get();
    return state.customers.find(customer => customer.id === id);
  },

  createCustomer: async (customer: Partial<Customer>) => {
    set({ loading: true, error: null });

    try {
      const organizationId = customer.organization_id || useOrganizationStore.getState().getOrganizationId();
      const fullName = [
        customer.first_name,
        customer.middle_name,
        customer.last_name
      ].filter(Boolean).join(' ').trim() || 'New Customer';

      // Auto-assign to current user if not explicitly set
      let assignedTo = customer.assigned_to;
      if (assignedTo === undefined) {
        const { data: { user } } = await supabase.auth.getUser();
        assignedTo = user?.id || null;
      }

      const insertData: Omit<Customer, 'id' | 'created_at' | 'updated_at'> & { organization_id: string } = {
        ...customer,
        name: fullName,
        organization_id: organizationId,
        country: customer.country || 'CA',
        status: customer.status || 'Active',
        assigned_to: assignedTo,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        customers: [data, ...state.customers],
      }));

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateCustomer: async (id: string, updates: Partial<Customer>) => {
    set({ loading: true, error: null });

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ error: 'No organization selected', loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? data : c)),
        currentCustomer: state.currentCustomer?.id === id ? data : state.currentCustomer,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  deleteCustomer: async (id: string) => {
    set({ loading: true, error: null });

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ error: 'No organization selected', loading: false });
      throw new Error('No organization selected');
    }

    try {
      // Delete customer-owned tables (meaningless without customer)
      await supabase.from('customer_notes').delete().eq('customer_id', id);
      await supabase.from('customer_contacts').delete().eq('customer_id', id);
      await supabase.from('customer_documents').delete().eq('customer_id', id);
      await supabase.from('customer_files').delete().eq('customer_id', id);
      await supabase.from('customer_subscriptions').delete().eq('customer_id', id);
      await supabase.from('sms_consent').delete().eq('customer_id', id);
      await supabase.from('tasks').delete().eq('customer_id', id);
      await supabase.from('pipeline_items').delete().eq('customer_id', id);
      await supabase.from('calendar_events').delete().eq('customer_id', id);

      // Unlink reference tables (preserve records, set customer_id to null)
      await supabase.from('calls').update({ customer_id: null }).eq('customer_id', id);
      await supabase.from('conversations').update({ customer_id: null }).eq('customer_id', id);
      await supabase.from('email_log').update({ customer_id: null }).eq('customer_id', id);
      await supabase.from('invoices').update({ customer_id: null }).eq('customer_id', id);
      await supabase.from('payments').update({ customer_id: null }).eq('customer_id', id);
      await supabase.from('quotes').update({ customer_id: null }).eq('customer_id', id);
      await supabase.from('sms_log').update({ customer_id: null }).eq('customer_id', id);
      await supabase.from('support_tickets').update({ customer_id: null }).eq('customer_id', id);

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) throw error;

      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete customer. It may have associated quotes or invoices.';
      set({ error: message, loading: false });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  deleteCustomers: async (ids: string[]) => {
    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) throw new Error('No organization selected');

    const { data, error } = await supabase.rpc('bulk_delete_customers', {
      p_customer_ids: ids,
    });

    if (error) throw error;

    const result = data as { succeeded: number; failed: number };

    if (result.succeeded > 0) {
      const deletedSet = new Set(ids);
      set((state) => ({
        customers: state.customers.filter((c) => !deletedSet.has(c.id)),
      }));
    }

    return result;
  },

  bulkReassignCustomers: async (ids: string[], newAssignedTo: string) => {
    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) throw new Error('No organization selected');

    const { data, error } = await supabase.rpc('bulk_reassign_customers', {
      p_customer_ids: ids,
      p_new_assigned_to: newAssignedTo,
    });

    if (error) throw error;

    const result = data as { succeeded: number; failed: number };

    if (result.succeeded > 0) {
      // Update local state
      const idSet = new Set(ids);
      set((state) => ({
        customers: state.customers.map((c) =>
          idSet.has(c.id) ? { ...c, assigned_to: newAssignedTo } : c
        ),
      }));
      // Refetch to get updated assigned_user joins
      await get().fetchCustomers();
    }

    return result;
  },

  fetchNotes: async (customerId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ notes: data || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  addNote: async (note: Partial<CustomerNote>) => {
    set({ loading: true, error: null });

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ loading: false });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('customer_notes')
        .insert({ ...note, organization_id: organizationId, user_id: user?.id })
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ notes: [data, ...state.notes] }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  updateNote: async (id: string, updates: Partial<CustomerNote>) => {
    set({ loading: true, error: null });

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ error: 'No organization selected', loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ notes: state.notes.map(n => n.id === id ? data : n) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  deleteNote: async (id: string) => {
    set({ loading: true, error: null });

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ error: 'No organization selected', loading: false });
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_notes')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (error) throw error;
      set((state) => ({ notes: state.notes.filter(n => n.id !== id) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  fetchContacts: async (customerId: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      set({ contacts: data || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  addContact: async (contact: Partial<CustomerContact>) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.from('customer_contacts').insert(contact).select().single();
      if (error) throw error;
      set((state) => ({ contacts: [data, ...state.contacts] }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  updateContact: async (id: string, updates: Partial<CustomerContact>) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('customer_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ contacts: state.contacts.map(c => c.id === id ? data : c) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  deleteContact: async (id: string, customerId: string) => {
    set({ loading: true, error: null });

    const organizationId = useOrganizationStore.getState().currentOrganization?.id;
    if (!organizationId) {
      set({ error: 'No organization selected', loading: false });
      return;
    }

    try {
      // Verify contact belongs to a customer in this organization
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('organization_id', organizationId)
        .single();

      if (!customer) {
        set({ error: 'Access denied', loading: false });
        return;
      }

      const { error } = await supabase
        .from('customer_contacts')
        .delete()
        .eq('id', id)
        .eq('customer_id', customerId);

      if (error) throw error;
      set((state) => ({ contacts: state.contacts.filter(c => c.id !== id) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  fetchFiles: async (customerId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('customer_files')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ files: data || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },
}));
