import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types/database.types';

export const userService = {
  // Get all customers for the current user
  async getUsers(): Promise<User[]> {
    try {

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('admin_user_view')
        .select('*');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('User service error:', error);
      throw error;
    }
  },

  async getProfile(): Promise<UserProfile> {
    try {

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('User service error:', error);
      throw error;
    }
  },
  
};