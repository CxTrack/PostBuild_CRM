import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from './organizationStore';
import toast from 'react-hot-toast';

interface DashboardWidget {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

interface UserPreferences {
    sidebarOrder: string[];
    dashboardLayout: DashboardWidget[];
    quickActionsOrder: string[];
    mobileNavItems: string[];
}

interface PreferencesStore {
    preferences: UserPreferences;
    isLoading: boolean;
    reset: () => void;
    loadPreferences: () => Promise<void>;
    saveSidebarOrder: (order: string[]) => Promise<void>;
    saveDashboardLayout: (layout: DashboardWidget[]) => Promise<void>;
    saveQuickActionsOrder: (order: string[]) => Promise<void>;
    saveMobileNavItems: (items: string[]) => Promise<void>;
}

const initialPreferencesState = {
    preferences: {
        sidebarOrder: ['customers', 'calendar', 'products', 'quotes', 'invoices', 'calls', 'pipeline', 'tasks'],
        dashboardLayout: [] as DashboardWidget[],
        quickActionsOrder: ['add-customer', 'schedule', 'create-quote', 'new-invoice', 'create-task'],
        mobileNavItems: ['/customers', '/calendar', '/products'],
    },
    isLoading: false,
};

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
    ...initialPreferencesState,

    reset: () => set(initialPreferencesState),

    loadPreferences: async () => {
        try {
            set({ isLoading: true });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ isLoading: false });
                return;
            }

            const orgId = useOrganizationStore.getState().currentOrganization?.id;
            if (!orgId) {
                set({ isLoading: false });
                return;
            }

            const { data: prefs, error } = await supabase
                .from('user_preferences')
                .select('preference_type, preference_value')
                .eq('user_id', user.id)
                .eq('organization_id', orgId);

            if (error) throw error;

            if (prefs) {
                const newPreferences = { ...get().preferences };
                prefs.forEach((p: { preference_type: string; preference_value: any }) => {
                    if (p.preference_type === 'sidebar_order') newPreferences.sidebarOrder = p.preference_value;
                    if (p.preference_type === 'dashboard_layout') newPreferences.dashboardLayout = p.preference_value;
                    if (p.preference_type === 'quick_actions_order') newPreferences.quickActionsOrder = p.preference_value;
                    if (p.preference_type === 'mobile_nav_items') newPreferences.mobileNavItems = p.preference_value;
                });
                set({ preferences: newPreferences });
            }

            set({ isLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An error occurred';
            set({ isLoading: false });
        }
    },

    saveSidebarOrder: async (order: string[]) => {
        // Optimistically update Zustand state BEFORE async DB call
        // so the useEffect that rebuilds navItems sees the new order immediately
        // and doesn't snap the sidebar back to the old order while awaiting DB
        set(state => ({
            preferences: { ...state.preferences, sidebarOrder: order }
        }));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const orgId = useOrganizationStore.getState().currentOrganization?.id;
            if (!orgId) return;

            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: orgId,
                    preference_type: 'sidebar_order',
                    preference_value: order,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,organization_id,preference_type'
                });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save navigation order';
            toast.error(message);
        }
    },

    saveDashboardLayout: async (layout: DashboardWidget[]) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const orgId = useOrganizationStore.getState().currentOrganization?.id;
            if (!orgId) return;

            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: orgId,
                    preference_type: 'dashboard_layout',
                    preference_value: layout,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,organization_id,preference_type'
                });

            set(state => ({
                preferences: { ...state.preferences, dashboardLayout: layout }
            }));
            toast.success('Dashboard layout saved');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save dashboard layout';
            toast.error(message);
        }
    },

    saveQuickActionsOrder: async (order: string[]) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const orgId = useOrganizationStore.getState().currentOrganization?.id;
            if (!orgId) return;

            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: orgId,
                    preference_type: 'quick_actions_order',
                    preference_value: order,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,organization_id,preference_type'
                });

            set(state => ({
                preferences: { ...state.preferences, quickActionsOrder: order }
            }));
            toast.success('Quick actions updated');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save quick actions';
            toast.error(message);
        }
    },

    saveMobileNavItems: async (items: string[]) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const orgId = useOrganizationStore.getState().currentOrganization?.id;
            if (!orgId) return;

            await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    organization_id: orgId,
                    preference_type: 'mobile_nav_items',
                    preference_value: items,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,organization_id,preference_type'
                });

            set(state => ({
                preferences: { ...state.preferences, mobileNavItems: items }
            }));
            toast.success('Mobile navigation updated');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update mobile navigation';
            toast.error(message);
        }
    },
}));
