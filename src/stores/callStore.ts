import create from 'zustand';
import { supabase } from '../lib/supabase'; // Assuming your supabase client is here
import { Database } from '../types/database.types'; // Assuming your types are generated here

type Call = Database['public']['Tables']['calls']['Row'];

interface CallStore {
  calls: Call[];
  agents: any[];
  totalCallsDuration: 0;
  loading: boolean;
  error: string | null;
  fetchCalls: () => Promise<void>;
}

export const useCallStore = create<CallStore>((set, get) => ({
  calls: [],
  agents: [],
  totalCallsDuration: 0,
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

      const uniqueAgentIds = [...new Set(data.map(call => call.call_agent_id))];

          // Calculate total duration in seconds
    const totalDurationInSeconds = data.reduce((acc, call) => {
      const start = new Date(call.start_time).getTime();
      const end = new Date(call.end_time).getTime();

      if (!isNaN(start) && !isNaN(end)) {
        const duration = (end - start) / 1000 ; // seconds

        // Convert seconds to minutes (rounded to two decimal places)
        const averageInMinutes = (duration / 60).toFixed(2);
        return acc + parseFloat(averageInMinutes);
      }

      return acc;
    }, 0);

      set({ calls: data || [], agents: uniqueAgentIds || [], totalCallsDuration: totalDurationInSeconds || 0, loading: false });
    } catch (error: any) {
      console.error('Error fetching calls:', error);
      set({ error: error.message, loading: false });
    }
  },
}));