import { supabase } from '../lib/supabase';
import { useCallStore } from '../stores/callStore';
import { Call, Customer } from '../types/database.types';
import { CallResponse } from 'retell-sdk/resources.mjs';

export const callsService = {

  async fetchCustomerCalls(customer: Customer): Promise<Call[]> {
    try {
      const strippedPhone = customer.phone;
      const phone1 = customer.phone;
      const phone2 = strippedPhone;

      const { data: calls, error } = await supabase
        .from('calls')
        .select('*')
        .or(`from_number.eq.${phone1},from_number.eq.+1${phone2}`)
        .order('created_at', { ascending: false });

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
      const session = await supabase.auth.getSession()

      const { data: calls, error } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', session.data.session?.user!.id)
        .order('start_time', { ascending: false });

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
      return call;

    } catch (err) {
      console.error('Unhandled error in fetchCustomerCalls:', err);
      return undefined;
    }
  },
};
