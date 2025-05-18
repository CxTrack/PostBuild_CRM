import { supabase } from '../lib/supabase';
import { Customer, CustomerFormData } from '../types/database.types';

export const customerService = {
  // Get all customers for the current user
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }

      return customers || [];
    } catch (error) {
      console.error('Customer service error:', error);
      throw error;
    }
  },

  // Get a single customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching customer:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Customer service error:', error);
      throw error;
    }
  },

  // Create a new customer
  async createCustomer(customerData: CustomerFormData): Promise<Customer> {
    try {
      // Get the current user's ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Add default values for required fields
      const newCustomer = {
        ...customerData,
        user_id: userData.user.id,
        status: 'Active',
        total_spent: 0
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomer])
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Customer service error:', error);
      throw error;
    }
  },

  // Update an existing customer
  async updateCustomer(id: string, customerData: Partial<CustomerFormData>): Promise<Customer> {
    try {
      // Combine address fields into single address field
      const { street, city, state, postalCode, country, ...otherData } = customerData;
      const address = street ? [street, city, state, postalCode].filter(Boolean).join(', ') : null;

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
        console.error('Error updating customer:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Customer service error:', error);
      throw error;
    }
  },

  async getCustomerByPhone(phoneNum: string):Promise<Customer | null> {
    try {
      console.log(phoneNum);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phoneNum)
        .single();

      if (error) {
        console.error('Error fetching customer:', error);
        throw error;
      }

      console.log(data);

      return data;
    } catch (error) {
      console.error('Customer service error:', error);
      throw error;
    }
  },

  // Delete a customer
  async deleteCustomer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting customer:', error);
        throw error;
      }
    } catch (error) {
      console.error('Customer service error:', error);
      throw error;
    }
  }
};