import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AdminState {
  isAdmin: boolean,

  // Actions
  isUserAdmin: () => Promise<void>;
}

export const adminStore = create<AdminState>((set, get) => ({
  isAdmin: false,
  loading: false,

  isUserAdmin: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    const { data, error: userRoleError } = await supabase
      .from('admin_settings')
      .select('is_admin')
      .eq('user_id', user?.id)
      .maybeSingle(); // ensures you get a single object, not an array

    if (userRoleError) throw userRoleError;

    const isAdmin =  Boolean(data?.is_admin);

    set({ isAdmin: isAdmin || false });
  },

}));