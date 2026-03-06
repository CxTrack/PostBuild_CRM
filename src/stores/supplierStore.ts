import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Supplier, SupplierContact, ProductSupplier } from '../types/app.types';

interface SupplierState {
    suppliers: Supplier[];
    currentSupplier: Supplier | null;
    contacts: SupplierContact[];
    relatedProducts: (ProductSupplier & { product_name?: string; product_sku?: string; product_price?: number })[];
    loading: boolean;
    error: string | null;
    fetchSuppliers: (organizationId?: string) => Promise<void>;
    fetchSupplierById: (id: string) => Promise<Supplier | null>;
    createSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<Supplier | null>;
    updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;
    getSupplierById: (id: string) => Supplier | undefined;
    // Contacts
    fetchSupplierContacts: (supplierId: string) => Promise<void>;
    addSupplierContact: (contact: Omit<SupplierContact, 'id' | 'created_at' | 'updated_at'>) => Promise<SupplierContact | null>;
    updateSupplierContact: (id: string, updates: Partial<SupplierContact>) => Promise<void>;
    deleteSupplierContact: (id: string) => Promise<void>;
    // Related products
    fetchRelatedProducts: (supplierId: string) => Promise<void>;
    // All contact titles for autocomplete
    fetchAllContactTitles: (organizationId: string) => Promise<string[]>;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
    suppliers: [],
    currentSupplier: null,
    contacts: [],
    relatedProducts: [],
    loading: false,
    error: null,

    fetchSuppliers: async (organizationId?: string) => {
        set({ loading: true, error: null });
        try {
            if (!organizationId) {
                set({ suppliers: [] });
                return;
            }
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('organization_id', organizationId)
                .order('name', { ascending: true });
            if (error) throw error;
            set({ suppliers: data || [] });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        } finally {
            set({ loading: false });
        }
    },

    fetchSupplierById: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            set({ currentSupplier: data });
            return data;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
            return null;
        } finally {
            set({ loading: false });
        }
    },

    createSupplier: async (supplier) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase.from('suppliers').insert([supplier]).select().single();
            if (error) throw error;
            set((state) => ({ suppliers: [...state.suppliers, data].sort((a, b) => a.name.localeCompare(b.name)) }));
            return data;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
            return null;
        } finally {
            set({ loading: false });
        }
    },

    updateSupplier: async (id, updates) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
            if (error) throw error;
            set((state) => ({
                suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
                currentSupplier: state.currentSupplier?.id === id ? { ...state.currentSupplier, ...updates } : state.currentSupplier,
            }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        } finally {
            set({ loading: false });
        }
    },

    deleteSupplier: async (id) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        } finally {
            set({ loading: false });
        }
    },

    getSupplierById: (id) => get().suppliers.find((s) => s.id === id),

    // ── Contacts ──────────────────────────────────────────────────────

    fetchSupplierContacts: async (supplierId: string) => {
        try {
            const { data, error } = await supabase
                .from('supplier_contacts')
                .select('*')
                .eq('supplier_id', supplierId)
                .order('is_primary', { ascending: false })
                .order('name', { ascending: true });
            if (error) throw error;
            set({ contacts: data || [] });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        }
    },

    addSupplierContact: async (contact) => {
        try {
            // If marking as primary, unset others first
            if (contact.is_primary) {
                await supabase
                    .from('supplier_contacts')
                    .update({ is_primary: false })
                    .eq('supplier_id', contact.supplier_id);
            }
            const { data, error } = await supabase
                .from('supplier_contacts')
                .insert([contact])
                .select()
                .single();
            if (error) throw error;
            set((state) => {
                let contacts = [...state.contacts, data];
                if (contact.is_primary) {
                    contacts = contacts.map(c => c.id === data.id ? c : { ...c, is_primary: false });
                }
                return { contacts };
            });
            return data;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
            return null;
        }
    },

    updateSupplierContact: async (id, updates) => {
        try {
            // If setting as primary, unset others first
            if (updates.is_primary) {
                const contact = get().contacts.find(c => c.id === id);
                if (contact) {
                    await supabase
                        .from('supplier_contacts')
                        .update({ is_primary: false })
                        .eq('supplier_id', contact.supplier_id);
                }
            }
            const { error } = await supabase
                .from('supplier_contacts')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
            set((state) => {
                let contacts = state.contacts.map(c => c.id === id ? { ...c, ...updates } : c);
                if (updates.is_primary) {
                    contacts = contacts.map(c => c.id === id ? c : { ...c, is_primary: false });
                }
                return { contacts };
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        }
    },

    deleteSupplierContact: async (id) => {
        try {
            const { error } = await supabase
                .from('supplier_contacts')
                .delete()
                .eq('id', id);
            if (error) throw error;
            set((state) => ({ contacts: state.contacts.filter(c => c.id !== id) }));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        }
    },

    // ── Related Products ──────────────────────────────────────────────

    fetchRelatedProducts: async (supplierId: string) => {
        try {
            const { data, error } = await supabase
                .from('product_suppliers')
                .select('*, products(name, sku, price)')
                .eq('supplier_id', supplierId)
                .order('is_preferred', { ascending: false });
            if (error) throw error;
            const mapped = (data || []).map((ps: any) => ({
                ...ps,
                product_name: ps.products?.name,
                product_sku: ps.products?.sku,
                product_price: ps.products?.price,
            }));
            set({ relatedProducts: mapped });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message });
        }
    },

    // ── Contact Titles Autocomplete ───────────────────────────────────

    fetchAllContactTitles: async (organizationId: string) => {
        try {
            const { data, error } = await supabase
                .from('supplier_contacts')
                .select('title')
                .eq('organization_id', organizationId)
                .not('title', 'is', null)
                .not('title', 'eq', '');
            if (error) throw error;
            const titles = new Set<string>();
            (data || []).forEach((c: { title: string | null }) => {
                if (c.title && c.title.trim()) titles.add(c.title.trim());
            });
            return Array.from(titles).sort((a, b) => a.localeCompare(b));
        } catch (error) {
            return [];
        }
    },
}));
