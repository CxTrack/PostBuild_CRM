import { supabase } from '../lib/supabase';
//import { useAuthStore } from '../stores/authStore';
import { useCallStore } from '../stores/callStore';
import { Call, Customer } from '../types/database.types';
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

      //await supabase.auth.signOut();

      // if (!user) {
      //   console.log('Not authenticated');
      //   const navigate = useNavigate();

      //   const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      //   const redirectTo = `${baseUrl}/login`;

      //   navigate(redirectTo); // or whatever your login route is
      // }
      

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
};
