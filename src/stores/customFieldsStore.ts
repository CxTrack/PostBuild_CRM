/**
 * Custom Fields Store
 * Manages custom field definitions - Production Only (Supabase)
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';
import {
    CustomFieldDefinition,
    CustomFieldFormData,
    generateFieldKey
} from '@/types/customFields.types';

interface CustomFieldsStore {
    fields: CustomFieldDefinition[];
    loading: boolean;
    error: string | null;

    // CRUD operations
    fetchFields: (entityType?: string) => Promise<void>;
    createField: (data: CustomFieldFormData, entityType: string) => Promise<CustomFieldDefinition | null>;
    updateField: (id: string, updates: Partial<CustomFieldFormData>) => Promise<void>;
    deleteField: (id: string) => Promise<void>;
    reorderFields: (fieldIds: string[]) => Promise<void>;

    // Utilities
    getFieldsByEntity: (entityType: string) => CustomFieldDefinition[];
    getFieldByKey: (key: string) => CustomFieldDefinition | undefined;
}

export const useCustomFieldsStore = create<CustomFieldsStore>((set, get) => ({
    fields: [],
    loading: false,
    error: null,

    fetchFields: async (entityType?: string) => {
        set({ loading: true, error: null });

        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            set({ error: 'No organization selected', loading: false });
            return;
        }

        try {
            let query = supabase
                .from('custom_field_definitions')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .order('order', { ascending: true });

            if (entityType) {
                query = query.eq('entity_type', entityType);
            }

            const { data, error } = await query;
            if (error) throw error;
            set({ fields: data || [], loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message, loading: false });
        }
    },

    createField: async (data: CustomFieldFormData, entityType: string) => {
        set({ loading: true, error: null });

        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            set({ error: 'No organization selected', loading: false });
            return null;
        }

        const fieldKey = data.field_key || generateFieldKey(data.field_label);
        const existingKeys = get().fields.map(f => f.field_key);

        // Check for duplicate key
        if (existingKeys.includes(fieldKey)) {
            set({ error: 'A field with this key already exists', loading: false });
            return null;
        }

        try {
            const { data: createdField, error } = await supabase
                .from('custom_field_definitions')
                .insert({
                    ...data,
                    field_key: fieldKey,
                    entity_type: entityType,
                    organization_id: organizationId,
                    is_active: true,
                    order: get().fields.length + 1
                })
                .select()
                .single();

            if (error) throw error;
            set(state => ({ fields: [...state.fields, createdField], loading: false }));
            return createdField;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message, loading: false });
            return null;
        }
    },

    updateField: async (id: string, updates: Partial<CustomFieldFormData>) => {
        set({ loading: true, error: null });

        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            set({ error: 'No organization selected', loading: false });
            return;
        }

        try {
            const { error } = await supabase
                .from('custom_field_definitions')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) throw error;

            set(state => ({
                fields: state.fields.map(f =>
                    f.id === id ? { ...f, ...updates, updated_at: new Date().toISOString() } : f
                ),
                loading: false
            }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message, loading: false });
        }
    },

    deleteField: async (id: string) => {
        set({ loading: true, error: null });

        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            set({ error: 'No organization selected', loading: false });
            return;
        }

        try {
            // Soft delete
            const { error } = await supabase
                .from('custom_field_definitions')
                .update({ is_active: false })
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) throw error;
            set(state => ({
                fields: state.fields.filter(f => f.id !== id),
                loading: false
            }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message, loading: false });
        }
    },

    reorderFields: async (fieldIds: string[]) => {
        set({ loading: true, error: null });

        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            set({ error: 'No organization selected', loading: false });
            return;
        }

        try {
            // Batch update order
            const updates = fieldIds.map((id, index) => ({
                id,
                order: index + 1
            }));

            for (const update of updates) {
                await supabase
                    .from('custom_field_definitions')
                    .update({ order: update.order })
                    .eq('id', update.id)
                    .eq('organization_id', organizationId);
            }

            const currentFields = get().fields;
            const reorderedFields = fieldIds
                .map(id => currentFields.find(f => f.id === id))
                .filter(Boolean) as CustomFieldDefinition[];

            set({ fields: reorderedFields, loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
            set({ error: message, loading: false });
        }
    },

    getFieldsByEntity: (entityType: string) => {
        return get().fields.filter(f => f.entity_type === entityType);
    },

    getFieldByKey: (key: string) => {
        return get().fields.find(f => f.field_key === key);
    }
}));
