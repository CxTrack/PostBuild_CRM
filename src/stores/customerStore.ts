import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Customer, CustomerNote, CustomerContact, CustomerFile } from '@/types/database.types';
import { useOrganizationStore } from './organizationStore';

interface CustomerStore {
  customers: Customer[];
  currentCustomer: Customer | null;
  loading: boolean;
  error: string | null;

  fetchCustomers: () => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  createCustomer: (customer: Partial<Customer>) => Promise<Customer | null>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  notes: CustomerNote[];
  fetchNotes: (customerId: string) => Promise<void>;
  addNote: (note: Partial<CustomerNote>) => Promise<void>;
  updateNote: (id: string, updates: Partial<CustomerNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  contacts: CustomerContact[];
  fetchContacts: (customerId: string) => Promise<void>;
  addContact: (contact: Partial<CustomerContact>) => Promise<void>;
  updateContact: (id: string, updates: Partial<CustomerContact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  files: CustomerFile[];
  fetchFiles: (customerId: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],
  currentCustomer: null,
  loading: false,
  error: null,
  notes: [],
  contacts: [],
  files: [],

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
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ customers: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
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
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;
      set({ currentCustomer: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
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

      const insertData: any = {
        ...customer,
        name: fullName,
        organization_id: organizationId,
        country: customer.country || 'CA',
        status: customer.status || 'Active',
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        customers: [data, ...state.customers],
        loading: false,
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCustomer: async (id: string, updates: Partial<Customer>) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? data : c)),
        currentCustomer: state.currentCustomer?.id === id ? data : state.currentCustomer,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteCustomer: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        customers: state.customers.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
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
      set({ notes: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
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
      set((state) => ({ notes: [data, ...state.notes], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateNote: async (id: string, updates: Partial<CustomerNote>) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ notes: state.notes.map(n => n.id === id ? data : n), loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteNote: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase.from('customer_notes').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ notes: state.notes.filter(n => n.id !== id), loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
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
      set({ contacts: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addContact: async (contact: Partial<CustomerContact>) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.from('customer_contacts').insert(contact).select().single();
      if (error) throw error;
      set((state) => ({ contacts: [data, ...state.contacts], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
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
      set((state) => ({ contacts: state.contacts.map(c => c.id === id ? data : c), loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteContact: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase.from('customer_contacts').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({ contacts: state.contacts.filter(c => c.id !== id), loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
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
      set({ files: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
