import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { RecentActivityType } from '../types/recent.activity.type';
import { convertActivitiesToLocalTime } from '../utils/general';

interface ActivitiesState {
  activities: any[] | null;
  loading: boolean;

  // Actions
  getActivitiesByType: (user_id?: string, types?: RecentActivityType[]) => Promise<void>;
  getCustomerActivities: (customer_id: string) => Promise<void>;
  addActivity: (activity: string, activity_type: RecentActivityType, customer_id: string | null) => Promise<void>;
}

export const useActivityStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  loading: false,

  getActivitiesByType: async (user_id?: string, types?: RecentActivityType[]) => {
    if (!user_id) return; // nothing to fetch
    if (!types || types.length === 0) types = ['system']; // default type

    set({ activities: [], loading: true });

    const { data: recentActivities, error } = await supabase
      .from('recent_activities')
      .select('*')
      .eq('user_id', user_id)
      .in('activity_type', types)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const activitiesWithLocalTime = convertActivitiesToLocalTime(recentActivities);

    set({ activities: activitiesWithLocalTime || [], loading: false });
  },

  getCustomerActivities: async (customer_id: string) => {
    set({ activities: [], loading: true });
    let { data: recentActivities, error: activitiesError } = await supabase
      .from('recent_activities')
      .select('*')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false })
    //.limit(50);

    if (activitiesError) throw activitiesError;

    if (!recentActivities) {
      recentActivities = [];
    }

    const activitiesWithLocalTime = convertActivitiesToLocalTime(recentActivities);
    
    set({ activities: activitiesWithLocalTime, loading: false });
  },

  addActivity: async (activity: string, activity_type: RecentActivityType, customer_id: string | null) => {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    await supabase
      .from('recent_activities')
      .insert([{
        user_id: user.id,
        customer_id: customer_id,
        activity_type: activity_type,
        activity: activity,
      }])
      .select()
      .single();
  }
}));