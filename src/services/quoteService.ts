import { supabase } from '../lib/supabase';
import { Quote, QuoteFormData, QuoteStatus } from '../types/database.types';

export const quoteService = {
  // Get all quotes for the current user
  async getQuotes(): Promise<Quote[]> {
    try {
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotes:', error);
        throw error;
      }

      return quotes || [];
    } catch (error) {
      console.error('Quote service error:', error);
      throw error;
    }
  },

  // Get a single quote by ID
  async getQuoteById(id: string): Promise<Quote | null> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching quote:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Quote service error:', error);
      throw error;
    }
  },

  // Generate next quote number
  async generateQuoteNumber(): Promise<string> {
    try {
      // Get the current user's ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }
      
      // Get the highest quote number for this user
      const { data, error } = await supabase
        .from('quotes')
        .select('quote_number')
        .eq('user_id', userData.user.id)
        .order('quote_number', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching quote numbers:', error);
        throw error;
      }

      let nextNumber = 1;

      if (data && data.length > 0) {
        const lastQuoteNumber = data[0].quote_number;
        const matches = lastQuoteNumber.match(/QUO-(\d+)/);
        
        if (matches && matches[1]) {
          // Parse the number and increment
          const currentNumber = parseInt(matches[1], 10);
          nextNumber = currentNumber + 1;
        }
      }

      // Format with 6 digits, padded with zeros
      const formattedNumber = nextNumber.toString().padStart(6, '0');
      return `QUO-${formattedNumber}`;
    } catch (error) {
      console.error('Error generating quote number:', error);
      // In case of error, generate a unique number based on timestamp and random suffix
      const timestamp = new Date().getTime();
      const randomSuffix = Math.floor(Math.random() * 1000);
      return `QUO-${timestamp.toString().slice(-6)}-${randomSuffix}`;
    }
  },

  // Create a new quote
  async createQuote(quoteData: QuoteFormData): Promise<Quote> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      let customerId = quoteData.customer || null;
      let customerName = '';
      let customerEmail = null;
      let customerAddress = null;

      if (quoteData.newCustomer && !customerId) {
        // Create new customer if provided
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: quoteData.newCustomer.name,
            email: quoteData.newCustomer.email,
            address: quoteData.newCustomer.address,
            user_id: userData.user.id,
            status: 'Active',
            total_spent: 0
          }])
          .select()
          .single();

        if (customerError) {
          throw customerError;
        }

        customerId = newCustomer.id;
        customerName = newCustomer.name;
        customerEmail = newCustomer.email;
        customerAddress = newCustomer.address;
      } else if (customerId) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('name, email, address')
          .eq('id', customerId)
          .single();
          
        if (customerData) {
          customerName = customerData.name;
          customerEmail = customerData.email;
          customerAddress = customerData.address;
        }
      }

      // Try to create the quote with a unique quote number, with retries
      let attempts = 0;
      const maxAttempts = 3;
      let error = null;
      let data = null;
      
      while (attempts < maxAttempts) {
        try {
          const quoteNumber = await this.generateQuoteNumber();
          
          const items = quoteData.items.map(item => ({
            product_id: item.product || null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price
          }));

          const subtotal = items.reduce((sum, item) => sum + item.total, 0);
          const taxRate = parseFloat(quoteData.tax_rate.toString()) / 100;
          const tax = subtotal * taxRate;
          const total = subtotal + tax;

          const newQuote = {
            quote_number: quoteNumber,
            customer_id: customerId,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_address: customerAddress,
            date: quoteData.date,
            expiry_date: quoteData.expiry_date,
            items: items,
            subtotal: subtotal,
            tax_rate: taxRate,
            tax: tax,
            total: total,
            notes: quoteData.notes || null,
            message: quoteData.message || null,
            status: 'Draft' as QuoteStatus,
            user_id: userData.user.id
          };

          const result = await supabase
            .from('quotes')
            .insert([newQuote])
            .select()
            .single();
            
          if (result.error) {
            // If it's a duplicate key error, try again
            if (result.error.code === '23505' && result.error.message.includes('quotes_quote_number_key')) {
              attempts++;
              error = result.error;
              continue;
            }
            // For other errors, throw immediately
            throw result.error;
          }
          
          data = result.data;
          break; // Success, exit the loop
        } catch (err) {
          if (attempts >= maxAttempts - 1) {
            throw err; // Rethrow on last attempt
          }
          attempts++;
          error = err;
        }
      }
      
      // If we've exhausted all attempts, throw the last error
      if (!data && error) {
        throw error;
      }
      
      return data!;
    } catch (error) {
      console.error('Quote service error:', error);
      throw error;
    }
  },


  // Update quote status
  async updateQuoteStatus(id: string, status: QuoteStatus): Promise<Quote> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating quote status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Quote service error:', error);
      throw error;
    }
  },

  // Delete a quote
  async deleteQuote(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting quote:', error);
        throw error;
      }
    } catch (error) {
      console.error('Quote service error:', error);
      throw error;
    }
  }
};