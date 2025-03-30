import { supabase } from '../lib/supabase';
import { Invoice, InvoiceFormData, InvoiceStatus } from '../types/database.types';

export const invoiceService = {
  // Get all invoices for the current user
  async getInvoices(): Promise<Invoice[]> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      return invoices || [];
    } catch (error) {
      console.error('Invoice service error:', error);
      throw error;
    }
  },

  // Get a single invoice by ID
  async getInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching invoice:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Invoice service error:', error);
      throw error;
    }
  },

  // Generate next invoice number for a specific customer
  async generateInvoiceNumber(customerId: string): Promise<string> {
    try {
      // Get the current user's ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Get the highest invoice number for this user's business
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', userData.user.id)
        .order('invoice_number', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching invoice numbers:', error);
        throw error;
      }

      let nextNumber = 1; // Always start with 1 if no previous invoices

      if (data && data.length > 0) {
        const lastInvoiceNumber = data[0].invoice_number;
        const matches = lastInvoiceNumber.match(/INV-(\d+)/);
        
        if (matches && matches[1]) {
          // Parse the number and increment
          const currentNumber = parseInt(matches[1], 10);
          nextNumber = currentNumber + 1;
        }
      }

      // Format with 6 digits, padded with zeros
      const formattedNumber = nextNumber.toString().padStart(6, '0');
      return `INV-${formattedNumber}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Even in error case, maintain the format
      return `INV-000001`;
    }
  },

  // Create a new invoice
  async createInvoice(invoiceData: InvoiceFormData): Promise<Invoice> {
    try {
      // Generate invoice number first
      const invoiceNumber = await this.generateInvoiceNumber('');
      
      // Get the current user's ID
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Handle customer creation/lookup
      let customerId = invoiceData.customer || null;
      let customerName = '';
      let customerEmail = null;
      let customerAddress = null;

      if (invoiceData.newCustomer && !customerId) {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: invoiceData.newCustomer.name,
            email: invoiceData.newCustomer.email,
            phone: invoiceData.newCustomer.phone,
            address: invoiceData.newCustomer.address,
            type: 'Individual',
            status: 'Active',
            total_spent: 0,
            user_id: userData.user.id
          }])
          .select()
          .single();

        if (customerError) {
          console.error('Error creating customer:', customerError);
          throw new Error('Failed to create customer');
        }

        customerId = newCustomer.id;
        customerName = newCustomer.name;
        customerEmail = newCustomer.email;
        customerAddress = newCustomer.address;
      } else if (customerId) {
        // Fetch customer details
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

      // Calculate totals
      const items = invoiceData.items.map(item => ({
        product_id: item.product || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice
      }));

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = parseFloat(invoiceData.taxRate.toString()) / 100; // Convert percentage to decimal
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      const newInvoice = {
        invoice_number: invoiceNumber,
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_address: customerAddress,
        date: invoiceData.invoiceDate,
        due_date: invoiceData.dueDate,
        items: items,
        subtotal: subtotal,
        tax_rate: taxRate,
        tax: tax,
        total: total,
        notes: invoiceData.notes || null,
        status: 'Draft' as InvoiceStatus,
        user_id: userData.user.id
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select()
        .single();

      if (error) {
        console.error('Error creating invoice:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Invoice service error:', error);
      throw error;
    }
  },

  // Update an existing invoice
  async updateInvoice(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    try {
      // Add updated_at timestamp
      const updateData = {
        ...invoiceData,
        updated_at: new Date().toISOString()
      };

      // If customer email is being updated, include it
      if (invoiceData.customer_email !== undefined) {
        updateData.customer_email = invoiceData.customer_email;
      }

      // If customer address is being updated, include it  
      if (invoiceData.customer_address !== undefined) {
        updateData.customer_address = invoiceData.customer_address;
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Invoice service error:', error);
      throw error;
    }
  },

  // Update invoice status
  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    try {
      const updateData: any = { status };
      
      // If marking as paid, set the payment date
      if (status === 'Paid') {
        updateData.payment_date = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Invoice service error:', error);
      throw error;
    }
  },

  // Delete an invoice
  async deleteInvoice(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting invoice:', error);
        throw error;
      }
    } catch (error) {
      console.error('Invoice service error:', error);
      throw error;
    }
  },
  
  // Generate a public link for an invoice
  async generatePublicLink(id: string): Promise<string> {
    try {
      // In a real implementation, you would create a secure token in the database
      // For this demo, we'll just return a simulated link
      return `${window.location.origin}/public/invoice/${id}`;
    } catch (error) {
      console.error('Invoice service error:', error);
      throw error;
    }
  },
  
  // Generate a payment link for an invoice
  async generatePaymentLink(id: string): Promise<string> {
    try {
      // In a real implementation, you would create a secure payment token in the database
      // For this demo, we'll just return a simulated link
      return `${window.location.origin}/pay/invoice/${id}`;
    } catch (error) {
      console.error('Invoice service error:', error);
      throw error;
    }
  },
  
  // Duplicate an invoice
  async duplicateInvoice(id: string): Promise<Invoice> {
    try {
      // Get the original invoice
      const { data: originalInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching invoice to duplicate:', fetchError);
        throw fetchError;
      }
      
      if (!originalInvoice) {
        throw new Error('Invoice not found');
      }
      
      // Generate a new invoice number for the same customer
      const newInvoiceNumber = await this.generateInvoiceNumber(originalInvoice.customer_id || 'new');
      
      // Create a new invoice based on the original
      const newInvoice = {
        ...originalInvoice,
        id: undefined, // Let the database generate a new ID
        invoice_number: newInvoiceNumber,
        date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'Draft' as InvoiceStatus,
        payment_date: null,
        created_at: undefined, // Let the database set this
        updated_at: undefined // Let the database set this
      };
      
      // Insert the new invoice
      const { data: newInvoiceData, error: insertError } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select()
        .single();
        
      if (insertError) {
        console.error('Error duplicating invoice:', insertError);
        throw insertError;
      }
      
      return newInvoiceData;
    } catch (error) {
      console.error('Invoice service error:', error);
      throw error;
    }
  }
};