import { supabase } from '../lib/supabase';
import { Supplier } from '../types/database.types';

export const supplierService = {
  
  // Get all suppliers for the current user
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const { data: customers, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching supplier:', error);
        throw error;
      }

      return customers || [];
    } catch (error) {
      console.error('Supplier service error:', error);
      throw error;
    }
  },

  // Get a single supplier by ID
  async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching supplier:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Supplier service error:', error);
      throw error;
    }
  },

  // Create a new supplier
  async createSupplier(supplierData: Supplier): Promise<Supplier> {
    try {
      // Get the supplier user's ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Add default values for required fields
      const newSupplier = {
        ...supplierData,
        user_id: userData.user.id,
        total_spent: 0
      };

      console.log(newSupplier);
      

      const { data, error } = await supabase
        .from('suppliers')
        .insert([newSupplier])
        .select()
        .single();

      if (error) {
        console.error('Error creating supplier:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Supplier service error:', error);
      throw error;
    }
  },

  // Update an existing supplier
  async updateSUpplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier> {
    try {
      // Combine address fields into single address field
      const { street, city, state, postal_code, country, ...otherData } = supplierData;
      const address = street ? [street, city, state, postal_code].filter(Boolean).join(', ') : null;

      const { data, error } = await supabase
        .from('customers')
        .update({
          ...otherData,
          address,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating supplier:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Supplier service error:', error);
      throw error;
    }
  },

  // Delete a supplier
  async deleteSupplier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting supplier:', error);
        throw error;
      }
    } catch (error) {
      console.error('Supplier service error:', error);
      throw error;
    }
  }
};