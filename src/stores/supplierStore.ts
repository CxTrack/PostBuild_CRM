import { create } from 'zustand';
import { supplierService } from '../services/supplierService';
import { CustomerFormData, Supplier, SupplierFormData } from '../types/database.types';
import { supabase } from '../lib/supabase';

interface SupplierState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSuppliers: () => Promise<void>;
  getSupplierById: (id: string) => Promise<Supplier | null>;
  createSupplier: (data: SupplierFormData) => Promise<Supplier>;
  updateSupplier: (id: string, data: Partial<SupplierFormData>) => Promise<Supplier>;
  deleteSupplier: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  loading: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  fetchSuppliers: async () => {
    set({ loading: true, error: null });
    try {
      const suppliers = await supplierService.getSuppliers();
      set({ suppliers, loading: false });
    } catch (error: any) {
      console.error('Error in fetch suppliers:', error);
      set({ 
        error: error.message || 'Failed to fetch suppliers', 
        loading: false 
      });
    }
  },
  
  getSupplierById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const customer = await supplierService.getSupplierById(id);
      set({ loading: false });
      return customer;
    } catch (error: any) {
      console.error('Error in getSupplierById:', error);
      set({ 
        error: error.message || 'Failed to fetch customer details', 
        loading: false 
      });
      return null;
    }
  },
  
  createSupplier: async (data: SupplierFormData) => {
    set({ loading: true, error: null });
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newSupplier = await supplierService.createSupplier(data);
      
      // Log activity
      await supabase.rpc('add_activity', {
        p_user_id: user.id,
        p_type: 'customer',
        p_title: 'Customer Added',
        p_customer: data.name
      });

      // Update the customers list with the new customer
      const suppliers = [...get().suppliers, newSupplier];
      set({ suppliers, loading: false });
      
      return newSupplier;
    } catch (error: any) {
      console.error('Error in createCustomer:', error);
      set({ 
        error: error.message || 'Failed to create customer', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateSupplier: async (id: string, supplierData: Partial<SupplierFormData>) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...supplierData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating supplier:', error);
        throw error;
      }

      // Update local state
      const suppliers = get().suppliers.map(supplier => 
        supplier.id === id ? { ...supplier, ...data } : supplier
      );
      set({ suppliers, loading: false });

      return data;
    } catch (error) {
      console.error('Supplier service error:', error);
      throw error;
    }
  },
  
  deleteSupplier: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await supplierService.deleteSupplier(id);
      
      // Remove the deleted customer from the list
      const suppliers = get().suppliers.filter(supplier => supplier.id !== id);
      set({ suppliers, loading: false });
    } catch (error: any) {
      console.error('Error in delete supplier:', error);
      set({ 
        error: error.message || 'Failed to delete supplier', 
        loading: false 
      });
      throw error;
    }
  }
}));