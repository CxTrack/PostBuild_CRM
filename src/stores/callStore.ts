import create from 'zustand';
import { callsService } from '../services/callsService';
import { customerService } from '../services/customerService';
import Retell from 'retell-sdk';
import { CallResponse } from 'retell-sdk/resources.mjs';
import { Call } from '../types/database.types';

interface CallStore {
  calls: Call[];
  //APIcalls: RetellCall[];
  loading: boolean;
  error: string | null;
  fetchCallViaAPI: (callId: string) => Promise<CallResponse | undefined>;
  //fetchCalls: () => Promise<void>;
  fetchCustomerCalls: (customerId: string) => Promise<void>;
}

export const useCallStore = create<CallStore>((set, get) => ({
  calls: [],
  //APIcalls: [],
  agents: [],
  loading: false,
  error: null,

  // fetchCalls: async () => {
  // },

  // fetchCallsViaAPI: async () => {
  //   set({ loading: true, error: null });
  //   try {
  //     // Fetch calls from Retell API
  //     // Ensure you have RETELL_API_KEY set as an environment variable
  //     const apiKey = "key_b8e3bfa4516f4064f59d0eb60b8f"; //process.env.RETELL_API_KEY;
  //     if (!apiKey) {
  //       throw new Error('RETELL_API_KEY is not set.');
  //     }

  //     let allCalls: RetellCall[] = [];
  //     let paginationKey = '1000';

  //     do {

  //       const response = await fetch('https://api.retellai.com/v2/list-calls', {
  //         method: 'POST',
  //         headers: {
  //           'Authorization': `Bearer ${apiKey}`,
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           'limit': 1000,
  //           'call_type': ["phone_call"],
  //           'sort_order': "descending",
  //           //'user_sentiment': ["Positive", "Negative"],
  //           //'call_successful': [false]
  //         }),
  //       });

  //       if (!response.ok) {
  //         const errorText = await response.text();
  //         throw new Error(`Failed to fetch calls from Retell API: ${response.status} - ${response.statusText}. Response body: ${errorText}`);
  //       }

  //       const data: RetellCall[] = await response.json();


  //       // Assuming the returned object has a 'calls' array and a 'pagination_key' for the next batch
  //       if (data && Array.isArray(data)) {
  //         allCalls = allCalls.concat(data);
  //         //console.log(allCalls);
  //       }

  //       paginationKey = data[0].pagination_key || null; // If no pagination_key, we are done

  //     } while (paginationKey);


  //     const retellCalls: RetellCall[] = allCalls;

  //     // Map Retell API response to the expected Call type structure
  //     const mappedCalls: Call[] = retellCalls.map(retellCall => {
  //       const start = retellCall.start_timestamp ? new Date(retellCall.start_timestamp).toISOString() : null;
  //       const end = retellCall.end_timestamp ? new Date(retellCall.end_timestamp).toISOString() : null;

  //       return {
  //         id: retellCall.call_id,
  //         call_agent_id: retellCall.agent_id,
  //         start_time: start,
  //         end_time: end,
  //         recording_url: retellCall.recording_url,
  //         pagination_key: retellCall.pagination_key,
  //         disconnection_reason: retellCall.end_reason,
  //         from_number: retellCall.from_number || 'N/A',
  //         to_number: retellCall.to_number || 'N/A',
  //       };
  //     });

  //     const uniqueAgentIds = [...new Set(mappedCalls.map(call => call.call_agent_id).filter((id): id is string => id !== null && id !== 'N/A'))];

  //     // Calculate total duration in minutes from the mapped calls
  //     const totalDurationInMinutes = mappedCalls.reduce((acc, call) => {
  //       if (call.start_time && call.end_time) {
  //         const start = new Date(call.start_time).getTime();
  //         const end = new Date(call.end_time).getTime();
  //         const durationInSeconds = (end - start) / 1000;
  //         const durationInMinutes = durationInSeconds / 60;
  //         return acc + durationInMinutes;
  //       }
  //       return acc;
  //     }, 0);

  //     // Round total duration to 2 decimal places
  //     const roundedTotalDuration = parseFloat(totalDurationInMinutes.toFixed(2));

  //     set({ calls: mappedCalls, agents: uniqueAgentIds, totalCallsDuration: roundedTotalDuration, loading: false });
  //   } catch (error: any) {
  //     console.error('Error fetching calls:', error);
  //     set({ error: error.message, loading: false });
  //   }
  // },

  fetchCustomerCalls: async (customerId: string) => {
    set({ loading: true, error: null });
    try {
      const customer = await customerService.getCustomerById(customerId);
      if (!customer?.phone) {
        return;
      }

      const customerCalls = await callsService.fetchCustomerCalls(customer);

      set({ calls: customerCalls, loading: false });
    }
    catch (error: any) {
      console.error('Error fetching calls:', error);
      set({ error: error.message, loading: false });
    }
  },

  fetchCallViaAPI: async (callId: string): Promise<CallResponse | undefined> => {
    set({ loading: true, error: null });
    try {
      const apiKey = "key_b8e3bfa4516f4064f59d0eb60b8f"; //process.env.RETELL_API_KEY;

      // if (!apiKey) {
      //   throw new Error('RETELL_API_KEY is not set.');
      // }

      console.log(callId);

      const client = new Retell({
        apiKey: apiKey,
      });

      const callResponse = await client.call.retrieve(callId, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      });
      console.log(callResponse);

      return callResponse;

      set({ loading: false, error: null });
    }
    catch (error: any) {
      console.error('Error fetching calls:', error);
      set({ error: error.message, loading: false });
    }
  },
}));