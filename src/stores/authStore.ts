import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

import { supabase, getUserProfile } from '../lib/supabase';
import type { UserProfile } from '../types/database.types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: false,
      initialized: false,

      /* ----------------------------------------
       * INITIALIZE (run once on app startup)
       * ---------------------------------------- */
      initialize: async () => {
        set({ loading: true });

        // 0️⃣ Check for tokens in URL (from marketing site OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[Auth] Found tokens in URL, setting session...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error && data.session) {
            const profile = await getUserProfile(data.session.user.id);
            set({
              user: data.session.user,
              profile,
              initialized: true,
              loading: false,
            });

            // Clean URL by removing tokens
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
            return;
          } else {
            console.error('[Auth] Failed to set session from tokens:', error);
          }
        }

        // 1️⃣ Load existing session (Supabase handles refresh automatically)
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          set({
            user: session.user,
            profile,
          });
        } else {
          set({
            user: null,
            profile: null,
          });
        }

        set({ initialized: true, loading: false });

        // 2️⃣ Subscribe to auth changes (CRITICAL)
        supabase.auth.onAuthStateChange(async (event: any, session: any) => {
          console.log('[Supabase auth event]', event);

          if (!session || event === 'SIGNED_OUT') {
            set({ user: null, profile: null });
            return;
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            const user = session.user;
            const profile = await getUserProfile(user.id);
            set({ user, profile });
          }
        });
      },

      /* ----------------------------------------
       * SIGN IN
       * ---------------------------------------- */
      signIn: async (email, password) => {
        set({ loading: true });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          set({ loading: false });
          throw error;
        }

        if (data.user) {
          const profile = await getUserProfile(data.user.id);
          set({ user: data.user, profile, loading: false });
        }
      },

      /* ----------------------------------------
       * SIGN UP
       * ---------------------------------------- */
      signUp: async (email, password, fullName) => {
        set({ loading: true });

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        console.log({ data, error });


        if (error) {
          set({ loading: false });
          throw error;
        }

        if (!data.user) {
          set({ loading: false });
          return;
        }

        // Create profile row
        // const { error: profileError } = await supabase
        //   .from('user_profiles')
        //   .insert({
        //     id: data.user.id,
        //     email,
        //     full_name: fullName,
        //   });

        // if (profileError) {
        //   set({ loading: false });
        //   throw profileError;
        // }

        const profile = await getUserProfile(data.user.id);
        set({ user: data.user, profile, loading: false });
      },

      /* ----------------------------------------
       * SIGN OUT (invalidates refresh token)
       * ---------------------------------------- */
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
      },

      /* ----------------------------------------
       * RESET PASSWORD
       * ---------------------------------------- */
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
      },

      /* ----------------------------------------
       * UPDATE PROFILE
       * ---------------------------------------- */
      updateProfile: async (data) => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('user_profiles')
          .update(data)
          .eq('id', user.id);

        if (error) throw error;

        const profile = await getUserProfile(user.id);
        set({ profile });
      },
    }),
    {
      name: 'auth-storage',

      // ⚠️ Persist ONLY profile (Supabase owns session + user)
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);
