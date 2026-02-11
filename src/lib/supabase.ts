import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

console.log('🔗 Supabase client initialized');

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
};

export const getUserOrganizations = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`*, organization:organizations(*)`)
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get user organizations:', error);
    return [];
  }
};
