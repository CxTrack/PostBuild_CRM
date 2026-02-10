import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { industryService } from '../services/industryService';

interface ProfileData {
  id?: string;
  user_id?: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phone: string;
  industry_id: number;
  created_at?: string;
  updated_at?: string;
  // New fields
  onboarding_completed?: boolean;
  onboarding_step?: string;
  organization_id?: string;
  industry_template?: string;
  subscription_tier?: string;
}

interface ProfileState {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  clearError: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      // Get the current user's ID
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        console.log('No authenticated user found when fetching profile');
        set({
          profile: {
            company: 'CxTrack',
            address: '',
            city: '',
            state: '',
            zipcode: '',
            country: '',
            phone: '',
            industry_id: 0
          },
          loading: false
        });
        return;
      }

      // Fetch user_profiles WITH organization data
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organizations (
            id,
            name,
            industry_template,
            subscription_tier
          )
        `)
        .eq('id', userData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user_profile:', profileError);
        throw profileError;
      }

      // Also fetch legacy profile
      const { data: legacyProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (userProfile) {
        const orgData = (userProfile as any).organizations;
        const mappedProfile: ProfileData = {
          id: userProfile.id,
          user_id: userProfile.id,
          company: userProfile.business_name || legacyProfile?.company || 'CxTrack',
          address: legacyProfile?.address || '',
          city: legacyProfile?.city || '',
          state: legacyProfile?.state || '',
          zipcode: legacyProfile?.zipcode || '',
          country: legacyProfile?.country || '',
          phone: legacyProfile?.phone || '',
          industry_id: legacyProfile?.industry_id || 0,
          onboarding_completed: userProfile.onboarding_completed,
          onboarding_step: userProfile.onboarding_step,
          organization_id: userProfile.organization_id,
          industry_template: orgData?.industry_template || 'general_business',
          subscription_tier: orgData?.subscription_tier || 'free'
        };

        set({ profile: mappedProfile, loading: false });
        return;
      }

      // Fallback
      const defaultProfile: ProfileData = {
        user_id: userData.user.id,
        company: legacyProfile?.company || 'CxTrack',
        address: legacyProfile?.address || '',
        city: legacyProfile?.city || '',
        state: legacyProfile?.state || '',
        zipcode: legacyProfile?.zipcode || '',
        country: legacyProfile?.country || '',
        phone: legacyProfile?.phone || '',
        industry_id: legacyProfile?.industry_id || 0,
        industry_template: 'general_business',
        subscription_tier: 'free'
      };

      set({ profile: defaultProfile, loading: false });

    } catch (error: any) {
      console.error('Error in fetchProfile:', error);
      set({ error: error.message || 'Failed to fetch profile', loading: false });
    }
  },

  updateProfile: async (profileData: Partial<ProfileData>) => {
    // Don't update if there's no actual change
    const currentProfile = get().profile;
    if (!currentProfile) {
      throw new Error('No profile to update');
    }

    // Check if any values have actually changed
    let hasChanges = false;
    for (const [key, value] of Object.entries(profileData)) {
      if (currentProfile[key as keyof ProfileData] !== value) {
        hasChanges = true;
        break;
      }
    }

    // If nothing changed, just return without doing anything
    if (!hasChanges) {
      console.log('No profile changes detected, skipping update');
      return;
    }

    set({ loading: true, error: null });
    try {
      // Get the current user's ID
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const userId = userData.user.id;

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let result;

      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();
      } else {
        // Create new profile
        result = await supabase
          .from('profiles')
          .insert([{
            user_id: userId,
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error updating profile:', result.error);
        throw result.error;
      }

      // Update the profile in the store
      set({
        profile: {
          ...currentProfile,
          ...profileData,
          user_id: userId
        },
        loading: false
      });
    } catch (error: any) {
      console.error('Error in updateProfile:', error);
      set({
        error: error.message || 'Failed to update profile',
        loading: false
      });
      throw error;
    }
  },

  // updateProfileIndustry: async (industryId: string | null) => {
  //   const currentProfile = get().profile;
  //   if (!currentProfile) throw new Error('No profile to update');

  //   // Only update if industry actually changed
  //   if (currentProfile.industry === industryId) {
  //     console.log('Industry not changed, skipping update');
  //     return;
  //   }

  //   set({ loading: true, error: null });
  //   try {
  //     // Get the current user's ID
  //     const { data: userData } = await supabase.auth.getUser();
  //     if (!userData?.user) throw new Error('User not authenticated');

  //     const userId = userData.user.id;


  //     // Update only the industry_id column in DB
  //     const { data, error } = await supabase
  //       .from('profiles')
  //       .update({ industry_id: industryId, updated_at: new Date().toISOString() })
  //       .eq('user_id', userId)
  //       .select()
  //       .single();

  //     if (error) {
  //       console.error('Error updating industry:', error);
  //       throw error;
  //     }

  //     // Update store
  //     set({
  //       profile: {
  //         ...currentProfile,
  //         industry: industryId
  //       },
  //       loading: false
  //     });
  //   } catch (err: any) {
  //     console.error('Error in updateProfileIndustry:', err);
  //     set({ error: err.message || 'Failed to update industry', loading: false });
  //     throw err;
  //   }
  // }

}));