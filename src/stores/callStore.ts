import create from 'zustand';
import { supabase } from '../lib/supabase'; // Assuming your supabase client is here
import { Database } from '../types/database.types'; // Assuming your types are generated here

type Call = Database['public']['Tables']['calls']['Row'];

interface CallStore {
  calls: Call[];
  loading: boolean;
  error: string | null;
  fetchCalls: () => Promise<void>;
}

export const useCallStore = create<CallStore>((set, get) => ({
  calls: [],
  loading: false,
  error: null,

  fetchCalls: async () => {
    set({ loading: true, error: null });
    try {
      // Assuming Supabase RLS is set up to only allow users to see their own calls.
      // A simple select will automatically filter by the authenticated user's ID.
      const { data, error } = await supabase
        .from('calls')
        .select('*');

      if (error) {
        throw error;
      }

      set({ calls: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching calls:', error);
      set({ error: error.message, loading: false });
    }
  },
}));