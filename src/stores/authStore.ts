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
        redirectTo: redirectTo,
      });
      
      if (error) throw error;
      
      set({ loading: false });
    } catch (error: any) {
      console.error('Password reset error:', error);
      set({ 
        error: error.message || 'Failed to send reset instructions', 
        loading: false 
      });
      throw error;
    }
  },
  
  updatePassword: async (token: string, newPassword: string) => {
    set({ loading: true, error: null });
    try {
      // Set the session with the access token
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      });

      if (setSessionError) {
        throw new Error('Invalid or expired reset link');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (updateError) throw updateError;
      
      // Sign out after password change to force re-login
      await supabase.auth.signOut();
      clearAuthStorage();
      
      set({ loading: false });
    } catch (error: any) {
      console.error('Password update error:', error);
      set({ 
        error: error.message.includes('Invalid') || error.message.includes('expired')
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
      // Only allow specific email addresses to sign in
      const allowedEmails = [
        'maniksharmawork@gmail.com',
        'amanjotgrewal@hotmail.com',
        'vaneetverma@yahoo.com',
        'jviaches@gmail.com'
      ];
      
      if (!allowedEmails.includes(email)) {
        throw new Error('Access restricted. Please join our waitlist.');
      }

      // Clear any existing sessions first
      await supabase.auth.signOut();
      clearAuthStorage();
      
      // Add delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      // Add delay to ensure session is stored
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Failed to establish session. Please try again.');
      }

      set({ user: data.user, loading: false });
    } catch (error: any) {
      console.error('Sign in error:', error);
      set({ 
        error: error.message || 'Unable to sign in. Please try again.', 
        loading: false 
      });
      throw error;
    }
  },
  
  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      // Clear any existing sessions first
      await supabase.auth.signOut();
      clearAuthStorage();
      
      // Add delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
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
      
      // Add delay to ensure session is stored
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Failed to establish session. Please try again.');
      }
      
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
      // Only allow maniksharmawork@gmail.com to register
      if (email !== 'maniksharmawork@gmail.com') {
        throw new Error('Registration is currently restricted. Please join our waitlist.');
      }

      // Clear any existing sessions first
      await supabase.auth.signOut();
      clearAuthStorage();
      
      // Add delay to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Attempt signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          emailVerification: false
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

      // Add delay to ensure profile is created
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      
      set({ 
        error: errorMessage,
        loading: false 
      });
      
      throw error;
    }
  },
  
  signOut: async () => {
    set({ loading: true, error: null });
    try {
      // Clear all auth storage first
      clearAuthStorage();
      
      // Add delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await supabase.auth.signOut();
      
      set({ 
        user: null, 
        loading: false,
        error: null,
        initialized: true
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      // Clear storage anyway
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
    try {
      set({ loading: true });
      
      // Clear any stale data
      clearAuthStorage();
      
      // Add delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (session) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
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
      
      // If no session, return false
      if (!session) {
        return false;
      }
      
      // Check if session is within 5 minute window
      const sessionExpiry = new Date(session.expires_at * 1000);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Consider session valid if within 5 minute window
      if (sessionExpiry > fiveMinutesAgo) {
        return true;
      }
      
      // Try to refresh session
      const { success } = await refreshSession();
      if (success) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Auth status check error:', error);
      return false;
    }
  }
}));

// Initialize auth state
useAuthStore.getState().initialize();