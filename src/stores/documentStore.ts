import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';
import toast from 'react-hot-toast';

export interface CustomerDocument {
  id: string;
  organization_id: string;
  customer_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  category: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentStore {
  documents: CustomerDocument[];
  loading: boolean;
  fetchDocuments: (customerId: string) => Promise<void>;
  uploadDocument: (customerId: string, file: File, category: string) => Promise<CustomerDocument>;
  deleteDocument: (id: string, filePath: string) => Promise<void>;
  getDownloadUrl: (filePath: string) => Promise<string | null>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  loading: false,

  fetchDocuments: async (customerId: string) => {
    const org = useOrganizationStore.getState().currentOrganization;
    if (!org) return;
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('customer_documents')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      set({ documents: (data || []) as CustomerDocument[] });
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      set({ loading: false });
    }
  },

  uploadDocument: async (customerId: string, file: File, category: string) => {
    const org = useOrganizationStore.getState().currentOrganization;
    if (!org) throw new Error('No organization');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const filePath = `${org.id}/${customerId}/${Date.now()}_${file.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('customer-documents')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    // Insert record
    const { data, error } = await supabase
      .from('customer_documents')
      .insert({
        organization_id: org.id,
        customer_id: customerId,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || null,
        category,
      })
      .select()
      .single();
    if (error) throw error;

    await get().fetchDocuments(customerId);
    toast.success('Document uploaded');
    return data as CustomerDocument;
  },

  deleteDocument: async (id: string, filePath: string) => {
    // Delete from storage
    await supabase.storage.from('customer-documents').remove([filePath]);
    // Delete record
    const { error } = await supabase.from('customer_documents').delete().eq('id', id);
    if (error) throw error;
    set({ documents: get().documents.filter(d => d.id !== id) });
    toast.success('Document deleted');
  },

  getDownloadUrl: async (filePath: string) => {
    const { data } = await supabase.storage
      .from('customer-documents')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  },
}));
