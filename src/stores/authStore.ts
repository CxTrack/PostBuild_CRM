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
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
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
       * NO onAuthStateChange subscription here —
       * AuthContext.tsx is the single auth listener.
       * This store is only for profile data.
       * ---------------------------------------- */
      initialize: async () => {
        set({ loading: true });

        // Check for tokens in URL query params or hash fragment (OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
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
          }
        }

        // Load existing session
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await getUserProfile(session.user.id);
            set({ user: session.user, profile });
          } else {
            set({ user: null, profile: null });
          }
        } catch {
          set({ user: null, profile: null });
        }

        set({ initialized: true, loading: false });
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
       * SIGN IN WITH GOOGLE (OAuth)
       * ---------------------------------------- */
      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/onboarding/profile`,
          },
        });
        if (error) throw error;
      },

      /* ----------------------------------------
       * SIGN IN WITH MICROSOFT (OAuth)
       * ---------------------------------------- */
      signInWithMicrosoft: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'azure',
          options: {
            redirectTo: `${window.location.origin}/onboarding/profile`,
            scopes: 'email profile openid',
          },
        });
        if (error) throw error;
      },

      /* ----------------------------------------
       * SIGN OUT
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
