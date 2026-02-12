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

      // Helper to get cookie value
      const getCookie = (name: string): string | null => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
      };

      // Helper to delete cookie
      const deleteCookie = (name: string) => {
        document.cookie = `${name}=; domain=.easyaicrm.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      };

      // Try to get tokens from transfer cookie first (set by marketing site)
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // Log all cookies for debugging
      console.log('[CxTrack] All cookies:', document.cookie);

      // Try main transfer cookie first, then backup
      let transferCookie = getCookie('cxtrack_auth_transfer') || getCookie('cxtrack_auth_transfer_backup');
      if (transferCookie) {
        try {
          const tokenData = JSON.parse(transferCookie);
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token;
          console.log('[CxTrack] Found tokens in transfer cookie!');
          // Delete both cookies after reading
          deleteCookie('cxtrack_auth_transfer');
          deleteCookie('cxtrack_auth_transfer_backup');
        } catch (e) {
          console.error('[CxTrack] Failed to parse transfer cookie:', e);
        }
      }

      // Fallback: check URL params and hash
      if (!accessToken) {
        const urlParams = new URLSearchParams(window.location.search);
        accessToken = urlParams.get('access_token');
        refreshToken = urlParams.get('refresh_token');

        if (!accessToken && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }
      }

      // Fallback: check sessionStorage
      if (!accessToken) {
        accessToken = sessionStorage.getItem('pending_access_token');
        refreshToken = sessionStorage.getItem('pending_refresh_token');
      }

      console.log('[CxTrack] Token found:', accessToken ? 'YES' : 'NO');
      console.log('[CxTrack] localStorage token:', localStorage.getItem('sb-zkpfzrbbupgiqkzqydji-auth-token') ? 'EXISTS' : 'NONE');

      if (accessToken && refreshToken) {
        // If tokens were in URL, clean the URL immediately
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('access_token')) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        }

        // Prevent double-processing (StrictMode)
        const isProcessing = sessionStorage.getItem('auth_processing');
        if (isProcessing === 'true') {
          console.log('[CxTrack] Already processing tokens, waiting...');
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          sessionStorage.setItem('auth_processing', 'true');
          console.log('[CxTrack] Setting session with tokens...');

          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            console.log('[CxTrack] setSession successful');
          } catch (err) {
            console.error('[CxTrack] setSession error:', err);
          } finally {
            sessionStorage.removeItem('pending_access_token');
            sessionStorage.removeItem('pending_refresh_token');
            sessionStorage.removeItem('auth_processing');
          }
        }
      }

      // 2️⃣ Check for session (works for both token flow and regular login)
      console.log('[CxTrack] Calling getSession() with 3s timeout...');

      try {
        // Race against a timeout to prevent hanging on corrupted storage
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 3000)
        );

        let session = null;
        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
          console.log('[CxTrack] getSession() responded');
          if (result.error) console.error('[CxTrack] Session error:', result.error.message);
          session = result.data?.session;
        } catch (raceErr: any) {
          if (raceErr.message === 'TIMEOUT') {
            console.warn('[CxTrack] getSession() HUNG - clearing corrupted auth storage');
            localStorage.removeItem('sb-zkpfzrbbupgiqkzqydji-auth-token');
          } else {
            console.error('[CxTrack] getSession() race error:', raceErr);
          }
        }

        // If no session from getSession(), try to restore from localStorage (backup)
        if (!session) {
          console.log('[CxTrack] No active session found, checking localStorage backup...');
          const storageKey = 'sb-zkpfzrbbupgiqkzqydji-auth-token';
          const storedSession = localStorage.getItem(storageKey);

          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession);
              if (parsed.access_token && parsed.refresh_token) {
                console.log('[CxTrack] Attempting recovery with stored tokens...');
                const { data: restoredData, error: setError } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token,
                });

                if (setError) {
                  console.error('[CxTrack] Recovery failed:', setError.message);
                  localStorage.removeItem(storageKey);
                } else if (restoredData.session) {
                  console.log('[CxTrack] Session recovered:', restoredData.session.user?.email);
                  session = restoredData.session;
                }
              }
            } catch (parseErr) {
              console.error('[CxTrack] Parse error on recovery:', parseErr);
              localStorage.removeItem(storageKey);
            }
          }
        }

        if (!isMounted) return;

        if (session?.user) {
          console.log('[CxTrack] Verified User:', session.user.email);
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
          console.log('[CxTrack] Auth state established');
        } else {
          console.log('[CxTrack] No user found');
        }
      } catch (err) {
        console.error('[CxTrack] Critical error in auth flow:', err);
      }

      console.log('[CxTrack] Auth initialization complete');
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
