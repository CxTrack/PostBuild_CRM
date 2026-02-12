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
      // Debug: Log full URL to see what we're receiving
      console.log('[CxTrack] Full URL:', window.location.href);
      console.log('[CxTrack] Search params:', window.location.search);

      const urlParams = new URLSearchParams(window.location.search);
      let accessToken = urlParams.get('access_token');
      let refreshToken = urlParams.get('refresh_token');

      console.log('[CxTrack] Token in URL:', accessToken ? 'YES' : 'NO');
      console.log('[CxTrack] localStorage token:', localStorage.getItem('sb-zkpfzrbbupgiqkzqydji-auth-token') ? 'EXISTS' : 'NONE');

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
        console.log('[CxTrack] Processing tokens directly...');

        // Decode the JWT to get expiry (without verification)
        const parseJwt = (token: string) => {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
          } catch {
            return null;
          }
        };

        const decoded = parseJwt(accessToken);
        const expiresAt = decoded?.exp || Math.floor(Date.now() / 1000) + 3600;

        // Store directly in localStorage in Supabase's expected format
        const storageKey = `sb-zkpfzrbbupgiqkzqydji-auth-token`;
        const sessionData = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          expires_in: expiresAt - Math.floor(Date.now() / 1000),
          token_type: 'bearer',
        };

        localStorage.setItem(storageKey, JSON.stringify(sessionData));
        console.log('[CxTrack] Tokens stored in localStorage, reloading...');

        // Clear the pending tokens
        sessionStorage.removeItem('pending_access_token');
        sessionStorage.removeItem('pending_refresh_token');

        // Reload so Supabase picks up the tokens from localStorage
        window.location.reload();
        return;
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
