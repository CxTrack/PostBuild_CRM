import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User extends SupabaseUser {
  role?: string;
  organization_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let accessToken = urlParams.get('access_token');
      let refreshToken = urlParams.get('refresh_token');

      if (accessToken && refreshToken) {
        sessionStorage.setItem('pending_access_token', accessToken);
        sessionStorage.setItem('pending_refresh_token', refreshToken);
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      } else {
        accessToken = sessionStorage.getItem('pending_access_token');
        refreshToken = sessionStorage.getItem('pending_refresh_token');
      }

      if (accessToken && refreshToken) {
        const isProcessing = sessionStorage.getItem('auth_processing');
        if (isProcessing === 'true') {
          console.log('[CxTrack] Already processing, waiting...');
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          sessionStorage.setItem('auth_processing', 'true');
          console.log('[CxTrack] Processing tokens...');

          try {
            // Add timeout to prevent hanging
            const setSessionPromise = supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('setSession timeout after 10s')), 10000)
            );

            await Promise.race([setSessionPromise, timeoutPromise]);
            console.log('[CxTrack] setSession completed successfully');
          } catch (err) {
            console.error('[CxTrack] setSession failed:', err);
            // Clear tokens on failure so we don't keep retrying bad tokens
            sessionStorage.removeItem('pending_access_token');
            sessionStorage.removeItem('pending_refresh_token');
          }

          sessionStorage.removeItem('pending_access_token');
          sessionStorage.removeItem('pending_refresh_token');
          sessionStorage.removeItem('auth_processing');
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check for session (works for both token flow and regular login)
      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session?.user) {
        console.log('[CxTrack] Session found:', session.user.email);
        previousUserIdRef.current = session.user.id;

        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!isMounted) return;

        setUser({
          ...session.user,
          role: memberData?.role,
          organization_id: memberData?.organization_id
        });
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const currentUserId = session.user.id;
        const previousUserId = previousUserIdRef.current;

        if (previousUserId && previousUserId !== currentUserId) {
          localStorage.removeItem('organization-storage');
          localStorage.removeItem('cxtrack_organization');
          localStorage.removeItem('cxtrack_user_profile');
          localStorage.removeItem('current_organization_id');
          console.log('[CxTrack] Cleared cached data for new user');
        }
        previousUserIdRef.current = currentUserId;
      }

      if (session?.user) {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!isMounted) return;

        setUser({
          ...session.user,
          role: memberData?.role,
          organization_id: memberData?.organization_id
        });
      } else {
        setUser(null);
        previousUserIdRef.current = null;
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async () => {
    window.location.href = `${import.meta.env.VITE_MARKETING_URL || 'https://easyaicrm.com/access'}`;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem('organization-storage');
    localStorage.removeItem('cxtrack_organization');
    localStorage.removeItem('cxtrack_user_profile');
    localStorage.removeItem('current_organization_id');
    localStorage.clear();
    setUser(null);
    setLoading(false);
    console.log('[CxTrack] Logged out, all data cleared');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
