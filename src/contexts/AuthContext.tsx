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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Maximum time to wait for auth initialization before showing the app
const AUTH_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initCompleteRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // CRITICAL: Guarantee loading becomes false after timeout
    const timeoutId = setTimeout(() => {
      if (isMounted && !initCompleteRef.current) {
        console.warn('[Auth] Timeout reached, forcing loading to false');
        initCompleteRef.current = true;
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const completeInit = () => {
      if (isMounted && !initCompleteRef.current) {
        initCompleteRef.current = true;
        setLoading(false);
      }
    };

    const initAuth = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && isMounted) {
          // Set user immediately (org data can be fetched later by DashboardLayout)
          setUser(session.user);

          // Try to get org membership, but don't block on it
          try {
            const { data: memberData } = await supabase
              .from('organization_members')
              .select('organization_id, role')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (isMounted && memberData) {
              setUser({
                ...session.user,
                role: memberData.role,
                organization_id: memberData.organization_id
              });
            }
          } catch {
            // Org data fetch failed, but user is still authenticated
          }
        }
      } catch (err) {
        // Ignore AbortError - happens during navigation/unmount
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[Auth] Init error:', err);
      } finally {
        completeInit();
      }
    };

    // Start initialization
    initAuth();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Skip INITIAL_SESSION as initAuth handles that
      if (event === 'INITIAL_SESSION') return;

      if (session?.user) {
        setUser(session.user);

        // Fetch org data in background
        try {
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (isMounted && memberData) {
            setUser({
              ...session.user,
              role: memberData.role,
              organization_id: memberData.organization_id
            });
          }
        } catch {
          // Org data fetch failed, keep user without org data
        }
      } else {
        setUser(null);
      }

      completeInit();
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, logout }}>
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
