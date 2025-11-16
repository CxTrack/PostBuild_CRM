import { supabase } from '../lib/supabase';
import { Industry } from '../types/database.types';

export const industryService = {

  // async getIndustriesById(id: string): Promise<Industry> {
  //   try {
  //     const { data: industries, error } = await supabase
  //       .from('industries')
  //       .select('*')
  //       .eq('id', id)
  //       .single();

  //     if (error) {
  //       console.error('Error fetching industries item:', error);
  //       throw error;
  //     }

  //     return industries;
  //   } catch (error) {
  //     console.error('Industries service error:', error);
  //     throw error;
  //   }
  // },

  async fetchIndustries(): Promise<Industry> {
    try {

      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data: industry, error } = await supabase
        .from('industries')
        .select(`*`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching industries:', error);
        throw error;
      }

      return industry;
    } catch (error) {
      console.error('Industries service error:', error);
      throw error;
    }
  },
};

