import create from 'zustand';
// import { supabase } from '../lib/supabase'; // Assuming your supabase client is here
// import { Database } from '../types/database.types'; // Assuming your types are generated here

// Define the Call type to match the structure used in the application (originally from Supabase)
interface Call {
  id: string;
  call_agent_id: string | null;
  start_time: string | null;
  end_time: string | null;
  recording_url: string | null;
  disconnection_reason: string | null;
  from_number: string | null;
  to_number: string | null;
  pagination_key: string | null;
}

interface RetellCall {
  call_id: string;
  agent_id: string | null;
  start_timestamp: number | null;
  end_timestamp: number | null;
  recording_url: string | null;
  end_reason: string | null;
  phone_number: string | null;
  pagination_key: string | 0;
}

interface CallStore {
  calls: Call[];
  agents: string[]; // Assuming agent IDs are strings
  totalCallsDuration: number; // Changed type to number as it's used in calculations
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
      // Fetch calls from Retell API
      // Ensure you have RETELL_API_KEY set as an environment variable
      const apiKey = "key_b8e3bfa4516f4064f59d0eb60b8f"; //process.env.RETELL_API_KEY;
      if (!apiKey) {
        throw new Error('RETELL_API_KEY is not set.');
      }

      let allCalls :RetellCall[] = [];
      let paginationKey = '1000';

      do {

        const response = await fetch('https://api.retellai.com/v2/list-calls', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            'limit': 1000,
            'call_type': ["phone_call"],
            'sort_order': "descending",
            //'user_sentiment': ["Positive", "Negative"],
            //'call_successful': [false]
        }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch calls from Retell API: ${response.status} - ${response.statusText}. Response body: ${errorText}`);
        }

        const data: RetellCall[] = await response.json();
        

        // Assuming the returned object has a 'calls' array and a 'pagination_key' for the next batch
        if (data && Array.isArray(data)) {
          allCalls = allCalls.concat(data);
          console.log(allCalls);
        }
    
        paginationKey = data[0].pagination_key || null; // If no pagination_key, we are done
        
      } while (paginationKey);

      
      const retellCalls: RetellCall[] = allCalls;
      console.log(retellCalls);

      // Map Retell API response to the expected Call type structure
      const mappedCalls: Call[] = retellCalls.map(retellCall => {
        const start = retellCall.start_timestamp ? new Date(retellCall.start_timestamp).toISOString() : null;
        const end = retellCall.end_timestamp ? new Date(retellCall.end_timestamp).toISOString() : null;

        return {
          id: retellCall.call_id,
          call_agent_id: retellCall.agent_id,
          start_time: start,
          end_time: end,
          recording_url: retellCall.recording_url,
          pagination_key: retellCall.pagination_key,
          disconnection_reason: retellCall.end_reason,
          from_number: retellCall.from_number || 'N/A',  
          to_number: retellCall.to_number || 'N/A', 
        };
      });

      const uniqueAgentIds = [...new Set(mappedCalls.map(call => call.call_agent_id).filter((id): id is string => id !== null && id !== 'N/A'))];

      // Calculate total duration in minutes from the mapped calls
      const totalDurationInMinutes = mappedCalls.reduce((acc, call) => {
        if (call.start_time && call.end_time) {
          const start = new Date(call.start_time).getTime();
          const end = new Date(call.end_time).getTime();
          const durationInSeconds = (end - start) / 1000;
          const durationInMinutes = durationInSeconds / 60;
          return acc + durationInMinutes;
        }
        return acc;
      }, 0);

      // Round total duration to 2 decimal places
      const roundedTotalDuration = parseFloat(totalDurationInMinutes.toFixed(2));


      set({ calls: mappedCalls, agents: uniqueAgentIds, totalCallsDuration: roundedTotalDuration, loading: false });
    } catch (error: any) {
      console.error('Error fetching calls:', error);
      set({ error: error.message, loading: false });
    }
  },
}));