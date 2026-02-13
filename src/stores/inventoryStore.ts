import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StockMovement, LowStockAlert } from '../types/app.types';
import { useOrganizationStore } from './organizationStore';

interface InventoryState {
    movements: Record<string, StockMovement[]>;
    alerts: LowStockAlert[];
    loading: boolean;
    error: string | null;
    fetchMovements: (productId: string) => Promise<void>;
    fetchAlerts: (organizationId: string) => Promise<void>;
    addMovement: (movement: Omit<StockMovement, 'id' | 'created_at'>) => Promise<StockMovement | null>;
    acknowledgeAlert: (alertId: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    movements: {},
    alerts: [],
    loading: false,
    error: null,

    fetchMovements: async (productId: string) => {
        const organizationId = useOrganizationStore.getState().currentOrganization?.id;
        if (!organizationId) {
            set({ loading: false, error: 'No organization selected' });
            return;
        }

        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('stock_movements')
                .select('*')
                .eq('product_id', productId)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            set((state) => ({
                movements: { ...state.movements, [productId]: data || [] },
                loading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchAlerts: async (organizationId: string) => {
        set({ loading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('low_stock_alerts')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            if (error) throw error;
            set({ alerts: data || [], loading: false });
        } catch (error: any) {
            console.error('Error fetching alerts:', error);
            set({ error: error.message, loading: false });
        }
    },

    addMovement: async (movement) => {
        set({ loading: true, error: null });
        try {
            // 1. Insert movement
            const { data: movementData, error: movementError } = await supabase
                .from('stock_movements')
                .insert([movement])
                .select()
                .single();
            if (movementError) throw movementError;

            // 2. Update product quantity
            const { error: productError } = await supabase
                .from('products')
                .update({ quantity_on_hand: movement.new_quantity })
                .eq('id', movement.product_id);

            if (productError) throw productError;

            set((state) => ({
                movements: {
                    ...state.movements,
                    [movement.product_id]: [movementData, ...(state.movements[movement.product_id] || [])]
                },
                loading: false,
            }));
            return movementData;
        } catch (error: any) {
            console.error('Error adding movement:', error);
            set({ error: error.message, loading: false });
            return null;
        }
    },

    acknowledgeAlert: async (alertId) => {
        set({ loading: true, error: null });
        try {
            const { error } = await supabase
                .from('low_stock_alerts')
                .update({ status: 'acknowledged' })
                .eq('id', alertId);
            if (error) throw error;
            set((state) => ({
                alerts: state.alerts.filter(a => a.id !== alertId),
                loading: false
            }));
        } catch (error: any) {
            console.error('Error acknowledging alert:', error);
            set({ error: error.message, loading: false });
        }
    }
}));
