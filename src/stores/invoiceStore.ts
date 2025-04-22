import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { invoiceService } from '../services/invoiceService';
import { Invoice, InvoiceFormData, InvoiceStatus } from '../types/database.types';

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchInvoices: () => Promise<void>;
  getInvoiceById: (id: string) => Promise<Invoice | null>;
  createInvoice: (data: InvoiceFormData) => Promise<Invoice>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  duplicateInvoice: (id: string) => Promise<Invoice>;
  generatePublicLink: (id: string) => Promise<string>;
  generatePaymentLink: (id: string) => Promise<string>;
  clearError: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  loading: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const invoices = await invoiceService.getInvoices();
      set({ invoices, loading: false });
    } catch (error: any) {
      console.error('Error in fetchInvoices:', error);
      set({ 
        error: error.message || 'Failed to fetch invoices', 
        loading: false 
      });
    }
  },
  
  getInvoiceById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const invoice = await invoiceService.getInvoiceById(id);
      set({ loading: false });
      return invoice;
    } catch (error: any) {
      console.error('Error in getInvoiceById:', error);
      set({ 
        error: error.message || 'Failed to fetch invoice details', 
        loading: false 
      });
      return null;
    }
  },
  
  createInvoice: async (data: InvoiceFormData) => {
    set({ loading: true, error: null });
    try {
      const newInvoice = await invoiceService.createInvoice(data);
      
      // Log activity
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.rpc('add_activity', {
            p_user_id: userData.user.id,
            p_type: 'invoice',
            p_title: 'Invoice Created',
            p_customer: newInvoice.customer_name,
            p_amount: newInvoice.total
          });
        }
      } catch (activityError) {
        console.error('Error logging activity:', activityError);
        // Continue even if activity logging fails
      }

      // Update the invoices list with the new invoice
      const invoices = [...get().invoices, newInvoice];
      set({ invoices, loading: false });
      
      return newInvoice;
    } catch (error: any) {
      console.error('Error in createInvoice:', error);
      set({ 
        error: error.message || 'Failed to create invoice', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateInvoice: async (id: string, data: Partial<Invoice>) => {
    set({ loading: true, error: null });
    try {
      const updatedInvoice = await invoiceService.updateInvoice(id, data);
      
      // Update the invoices list with the updated invoice
      const invoices = get().invoices.map(invoice => 
        invoice.id === id ? updatedInvoice : invoice
      );
      
      set({ invoices, loading: false });
      return updatedInvoice;
    } catch (error: any) {
      console.error('Error in updateInvoice:', error);
      set({ 
        error: error.message || 'Failed to update invoice', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateInvoiceStatus: async (id: string, status: InvoiceStatus) => {
    set({ loading: true, error: null });
    try {
      const updatedInvoice = await invoiceService.updateInvoiceStatus(id, status);
      
      // Update the invoices list with the updated invoice
      const invoices = get().invoices.map(invoice => 
        invoice.id === id ? updatedInvoice : invoice
      );
      
      set({ invoices, loading: false });
      return updatedInvoice;
    } catch (error: any) {
      console.error('Error in updateInvoiceStatus:', error);
      set({ 
        error: error.message || 'Failed to update invoice status', 
        loading: false 
      });
      throw error;
    }
  },
  
  deleteInvoice: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await invoiceService.deleteInvoice(id);
      
      // Remove the deleted invoice from the list
      const invoices = get().invoices.filter(invoice => invoice.id !== id);
      set({ invoices, loading: false });
    } catch (error: any) {
      console.error('Error in deleteInvoice:', error);
      set({ 
        error: error.message || 'Failed to delete invoice', 
        loading: false 
      });
      throw error;
    }
  },
  
  duplicateInvoice: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const duplicatedInvoice = await invoiceService.duplicateInvoice(id);
      
      // Add the duplicated invoice to the list
      const invoices = [...get().invoices, duplicatedInvoice];
      set({ invoices, loading: false });
      
      return duplicatedInvoice;
    } catch (error: any) {
      console.error('Error in duplicateInvoice:', error);
      set({ 
        error: error.message || 'Failed to duplicate invoice', 
        loading: false 
      });
      throw error;
    }
  },
  
  generatePublicLink: async (id: string) => {
    try {
      return await invoiceService.generatePublicLink(id);
    } catch (error: any) {
      console.error('Error generating public link:', error);
      throw error;
    }
  },
  
  generatePaymentLink: async (id: string) => {
    try {
      return await invoiceService.generatePaymentLink(id);
    } catch (error: any) {
      console.error('Error generating payment link:', error);
      throw error;
    }
  }
}));