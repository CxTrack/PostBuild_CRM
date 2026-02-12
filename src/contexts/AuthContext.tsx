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
      // 1️⃣ First check for tokens in URL (from marketing site redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('[CxTrack] Found tokens in URL, setting session...');

        // Clean URL immediately to prevent re-processing on re-render
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!isMounted) return;

        if (!error && data.session?.user) {
          console.log('[CxTrack] Session set from URL tokens successfully');
          previousUserIdRef.current = data.session.user.id;

          const { data: memberData } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', data.session.user.id)
            .maybeSingle();

          if (!isMounted) return;

          setUser({
            ...data.session.user,
            role: memberData?.role,
            organization_id: memberData?.organization_id
          });
          setLoading(false);
          return;
        } else {
          console.error('[CxTrack] Failed to set session from tokens:', error);
        }
      }

      // 2️⃣ No URL tokens, check for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session?.user) {
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

    // 3️⃣ Listen for auth state changes
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
          console.log('[CxTrack] Cleared cached data for new user sign-in');
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
