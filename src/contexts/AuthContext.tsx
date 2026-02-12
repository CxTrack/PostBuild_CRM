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

        // Decode the JWT to get user data and expiry
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
        if (!decoded) {
          console.error('[CxTrack] Failed to decode JWT');
          sessionStorage.removeItem('pending_access_token');
          sessionStorage.removeItem('pending_refresh_token');
          setLoading(false);
          return;
        }

        const expiresAt = decoded.exp || Math.floor(Date.now() / 1000) + 3600;

        // Build the user object from the JWT payload (Supabase JWT structure)
        const user = {
          id: decoded.sub,
          aud: decoded.aud || 'authenticated',
          role: decoded.role || 'authenticated',
          email: decoded.email,
          email_confirmed_at: decoded.email_confirmed_at,
          phone: decoded.phone || '',
          confirmed_at: decoded.confirmed_at || decoded.email_confirmed_at,
          last_sign_in_at: decoded.last_sign_in_at || new Date().toISOString(),
          app_metadata: decoded.app_metadata || { provider: 'email', providers: ['email'] },
          user_metadata: decoded.user_metadata || {},
          identities: decoded.identities || [],
          created_at: decoded.created_at || new Date().toISOString(),
          updated_at: decoded.updated_at || new Date().toISOString(),
        };

        // Store in localStorage in Supabase's COMPLETE expected format
        const storageKey = `sb-zkpfzrbbupgiqkzqydji-auth-token`;
        const sessionData = {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          expires_in: expiresAt - Math.floor(Date.now() / 1000),
          token_type: 'bearer',
          user: user,
        };

        localStorage.setItem(storageKey, JSON.stringify(sessionData));
        console.log('[CxTrack] Complete session stored in localStorage, reloading...');

        // Clear the pending tokens
        sessionStorage.removeItem('pending_access_token');
        sessionStorage.removeItem('pending_refresh_token');

        // Reload so Supabase picks up the tokens from localStorage
        window.location.reload();
        return;
      }

      // Check for session (works for both token flow and regular login)
      console.log('[CxTrack] Calling getSession()...');

      try {
        let session = null;
        const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession();

        console.log('[CxTrack] getSession() completed');
        console.log('[CxTrack] Session exists:', !!supabaseSession);
        if (sessionError) console.error('[CxTrack] Session error:', sessionError.message);

        session = supabaseSession;

        // If no session from getSession(), try to restore from localStorage
        if (!session) {
          console.log('[CxTrack] No session from getSession, checking localStorage...');
          const storageKey = 'sb-zkpfzrbbupgiqkzqydji-auth-token';
          const storedSession = localStorage.getItem(storageKey);

          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession);
              if (parsed.access_token && parsed.refresh_token) {
                console.log('[CxTrack] Found stored tokens, trying setSession...');
                const { data: restoredData, error: setError } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token,
                });

                if (setError) {
                  console.error('[CxTrack] setSession failed:', setError.message);
                  // Token might be expired, clear it
                  localStorage.removeItem(storageKey);
                } else if (restoredData.session) {
                  console.log('[CxTrack] Session restored via setSession:', restoredData.session.user?.email);
                  session = restoredData.session;
                }
              }
            } catch (parseErr) {
              console.error('[CxTrack] Failed to parse stored session:', parseErr);
            }
          }
        }

        if (!isMounted) return;

        if (session?.user) {
          console.log('[CxTrack] Session found:', session.user.email);
          previousUserIdRef.current = session.user.id;

          console.log('[CxTrack] Fetching organization_members...');
          const { data: memberData, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          console.log('[CxTrack] organization_members result:', memberData ? 'found' : 'not found');
          if (memberError) console.error('[CxTrack] organization_members error:', memberError.message);

          if (!isMounted) return;

          setUser({
            ...session.user,
            role: memberData?.role,
            organization_id: memberData?.organization_id
          });
          console.log('[CxTrack] User set successfully');
        } else {
          console.log('[CxTrack] No session found - user will be redirected to login');
        }
      } catch (err) {
        console.error('[CxTrack] Error in getSession flow:', err);
      }

      console.log('[CxTrack] Setting loading to false');
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
