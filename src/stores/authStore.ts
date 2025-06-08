import { create } from 'zustand';
import { supabase, checkSession, refreshSession, clearAuthStorage } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthState {
  user: User | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  loading: false,
  error: null,

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const redirectTo = `${baseUrl}/reset-password#`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      set({ loading: false });
    } catch (error: any) {
      console.error('Password reset error:', error);
      set({ error: error.message || 'Failed to send reset instructions', loading: false });
      throw error;
    }
  },

  updatePassword: async (token, newPassword) => {
    set({ loading: true, error: null });
    try {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      });

      if (setSessionError) throw new Error('Invalid or expired reset link');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      clearAuthStorage();

      set({ loading: false });
    } catch (error: any) {
      console.error('Password update error:', error);
      set({
        error: error.message?.includes('Invalid') || error.message?.includes('expired')
          ? 'Invalid or expired reset link. Please request a new password reset.'
          : error.message || 'Failed to update password',
        loading: false
      });
      throw error;
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });

    try {
      await supabase.auth.signOut();
      clearAuthStorage();
      await new Promise(r => setTimeout(r, 300));

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Wait for session/user to propagate
      let user = null;
      let attempts = 0;
      const maxAttempts = 10;

      while (!user && attempts < maxAttempts) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) console.warn('Retrying getUser():', userError.message);

        user = userData?.user ?? null;
        if (!user) await new Promise(res => setTimeout(res, 200));
        attempts++;
      }

      if (!user) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      set({ user, loading: false });
    } catch (error: any) {
      console.error('Sign in error:', error);
      set({ error: error.message || 'Unable to sign in. Please try again.', loading: false });
      throw error;
    }
  },


  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      await supabase.auth.signOut();
      clearAuthStorage();
      await new Promise(r => setTimeout(r, 300));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;

      set({ loading: false });
    } catch (error: any) {
      console.error('Google sign in error:', error);
      set({
        error: error.message?.includes('refused to connect')
          ? 'Please check your Google authentication settings in Supabase'
          : error.message || 'Unable to sign in with Google',
        loading: false
      });
      throw error;
    }
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true, error: null });
    try {
      await supabase.auth.signOut();
      clearAuthStorage();
      await new Promise(r => setTimeout(r, 300));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists');
        } else if (error.message.includes('rate limit')) {
          throw new Error('Too many attempts. Please try again in a few minutes.');
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data returned from signup');
      }

      set({ loading: false });
    } catch (error: any) {
      console.error('Sign up error:', error);

      let errorMessage = 'Unable to create account. Please try again.';
      if (error.message.includes('already exists') || error.message.includes('already registered')) {
        errorMessage = error.message;
      } else if (error.message.includes('password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please try again later.';
      }

      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      clearAuthStorage();
      await new Promise(r => setTimeout(r, 300));

      await supabase.auth.signOut();

      set({
        user: null,
        loading: false,
        error: null,
        initialized: true
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      clearAuthStorage();
      set({
        user: null,
        loading: false,
        error: 'Failed to sign out properly, but you have been logged out.',
        initialized: true
      });
    }
  },

  initialize: async () => {
    set({ loading: true });

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('[AUTH INIT] Session:', session);

      if (error) throw error;

      if (session) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        set({ user, initialized: true, loading: false });
      } else {
        set({ user: null, initialized: true, loading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, initialized: true, loading: false });
    }
  },

  clearError: () => set({ error: null }),

  checkAuthStatus: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (!session) return false;

      const sessionExpiry = new Date(session.expires_at * 1000);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      if (sessionExpiry > fiveMinutesAgo) return true;

      const { success } = await refreshSession();
      return success;
    } catch (error) {
      console.error('Auth status check error:', error);
      return false;
    }
  }
}));

// 👇 Subscribe to Supabase auth state changes (optional, but robust)
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    useAuthStore.setState({ user: session.user, initialized: true });
  } else {
    useAuthStore.setState({ user: null, initialized: true });
  }
});

// Initialize once on load
useAuthStore.getState().initialize();
