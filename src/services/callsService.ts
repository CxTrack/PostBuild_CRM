import { log } from 'console';
import { supabase } from '../lib/supabase';
//import { useAuthStore } from '../stores/authStore';
import { useCallStore } from '../stores/callStore';
import { Call, Customer } from '../types/database.types';
import { CallResponse } from 'retell-sdk/resources.mjs';
//import { useNavigate } from 'react-router-dom';

export const callsService = {

  async fetchCalls(): Promise<void> {
    await useCallStore.getState().fetchCalls();
  },

  async fetchCustomerCalls(customer: Customer): Promise<Call[]> {
    try {
      const strippedPhone = customer.phone;
      const phone1 = customer.phone;
      const phone2 = strippedPhone;

      const { data: calls, error } = await supabase
        .from('calls')
        .select('*')
        .or(`from_number.eq.${phone1},from_number.eq.+1${phone2}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching calls:', error);
        throw error;
      }

      return calls || [];
    } catch (err) {
      console.error('Unhandled error in fetchCustomerCalls:', err);
      return [];
    }
  },

  async fetchAccountCalls(): Promise<Call[]> {
    try {
      const { user } = (await supabase.auth.getUser()).data;

      const { data: calls, error } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', user!.id);

      if (error) {
        console.error('Error fetching calls:', error);
        throw error;
      }

      return calls || [];
    } catch (err) {
      console.error('Unhandled error in fetchCustomerCalls:', err);
      return [];
    }
  },

  
  async getCallRecording(callId: string): Promise<CallResponse | undefined> {
    try {
      var call = await useCallStore.getState().fetchCallViaAPI(callId)
      console.log(call);

      return call;
      
    } catch (err) {
      console.error('Unhandled error in fetchCustomerCalls:', err);
      return undefined;
    }
  },
};
