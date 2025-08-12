import { create } from 'zustand';
import { customerService } from '../services/customerService';
import { Customer, CustomerFormData } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { piplelineService } from '../services/pipelineService';
import { callsService } from '../services/callsService';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCustomers: () => Promise<void>;
  getCustomerById: (id: string) => Promise<Customer | null>;
  createCustomer: (data: CustomerFormData) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<CustomerFormData>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  loading: false,
  error: null,

  
  
  clearError: () => set({ error: null }),
  
  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const customers = await customerService.getCustomers();
      set({ customers, loading: false });
    } catch (error: any) {
      console.error('Error in fetchCustomers:', error);
      set({ 
        error: error.message || 'Failed to fetch customers', 
        loading: false 
      });
    }
  },
  
  getCustomerById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const customer = await customerService.getCustomerById(id);
      set({ loading: false });
      return customer;
    } catch (error: any) {
      console.error('Error in getCustomerById:', error);
      set({ 
        error: error.message || 'Failed to fetch customer details', 
        loading: false 
      });
      return null;
    }
  },
  
  createCustomer: async (data: CustomerFormData) => {
    set({ loading: true, error: null });
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newCustomer = await customerService.createCustomer(data);
      
      // Log activity
      await supabase.rpc('add_activity', {
        p_user_id: user.id,
        p_type: 'customer',
        p_title: 'Customer Added',
        p_customer: data.name
      });

      // Update the customers list with the new customer
      const customers = [...get().customers, newCustomer];
      set({ customers, loading: false });
      
      return newCustomer;
    } catch (error: any) {
      console.error('Error in createCustomer:', error);
      set({ 
        error: error.message || 'Failed to create customer', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateCustomer: async (id: string, customerData: Partial<CustomerFormData>) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...customerData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }

      // Update local state
      const customers = get().customers.map(customer => 
        customer.id === id ? { ...customer, ...data } : customer
      );
      set({ customers, loading: false });

      return data;
    } catch (error) {
      console.error('Customer service error:', error);
      throw error;
    }
  },
  
  deleteCustomer: async (id: string) => {
    set({ loading: true, error: null });
    try {

      // Delete Leads (+ lead events), Opportunities
      await piplelineService.deleteCustomerPipelineItems(id)
      
      // Delete calls
      await callsService.deleteCustomerCallRecording(id);

      await customerService.deleteCustomer(id);
      
      // Remove the deleted customer from the list
      const customers = get().customers.filter(customer => customer.id !== id);
      set({ customers, loading: false });
    } catch (error: any) {
      console.error('Error in deleteCustomer:', error);
      set({ 
        error: error.message || 'Failed to delete customer', 
        loading: false 
      });
      throw error;
    }
  }
}));