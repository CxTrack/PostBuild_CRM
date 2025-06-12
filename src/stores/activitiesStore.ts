import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface ActivitiesState {
  activities: any[] | null;
  loading: boolean;

  // Actions
  //setActivity: (templateId: string) => Promise<void>;
  getActivities: () => Promise<void>;
}

export const useActivityStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  loading: false,

  getActivities: async () => {
    set({ activities: [], loading: true });
    let { data: recentActivities, error: activitiesError } = await supabase
      .from('recent_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (activitiesError) throw activitiesError;

    if (!recentActivities) {
      recentActivities = [];
    }

    set({ activities: recentActivities, loading: false });
  },

  // setActivity: async (title: string) => {
  //   // Get the current user's ID
  //   const { data: { user } } = await supabase.auth.getUser();

  //   if (!user) {
  //     throw new Error('User not authenticated');
  //   }

  //   // Log activity
  //   await supabase.rpc('add_activity', {
  //     p_user_id: user.id,
  //     p_type: 'customer',
  //     p_title: title,
  //   });
  // }
}));