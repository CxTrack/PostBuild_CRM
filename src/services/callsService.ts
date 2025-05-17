import { supabase } from '../lib/supabase';
import { useCallStore } from '../stores/callStore';
import { Customer, RetellCall } from '../types/database.types';

export const callsService = {
  async fetchCalls(): Promise<void> {
    await useCallStore.getState().fetchCalls();
  },

  async fetchCustomerCalls(customer: Customer): Promise<RetellCall[]> {
    try {
      const strippedPhone = customer.phone;
      const phone1 = customer.phone;
      const phone2 = strippedPhone;

      // console.log(phone1);
      // console.log(phone2);

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
  }
};
