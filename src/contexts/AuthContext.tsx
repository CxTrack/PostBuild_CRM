import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useOrganizationStore } from '@/stores/organizationStore';
import { clearAllDataStores, initStoreCleanup } from '@/stores/storeCleanup';

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
// 10s to handle Supabase free-tier cold starts
const AUTH_TIMEOUT_MS = 10000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initCompleteRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Register store cleanup callbacks now that all modules are fully initialized.
    // This MUST NOT run at module-level (TDZ errors in production minified builds).
    initStoreCleanup();

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
          // Track current user ID for detecting user changes
          previousUserIdRef.current = session.user.id;
          // Set user immediately — org data is fetched by DashboardLayout via organizationStore
          // DO NOT query organization_members here — it creates in-flight requests that get
          // killed by the Supabase JS client's AbortController during auth state transitions
          setUser(session.user);
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
        // Clear organization cache if user changed (different user logged in)
        if (previousUserIdRef.current && previousUserIdRef.current !== session.user.id) {
          console.log('[Auth] User changed, clearing organization cache');
          useOrganizationStore.getState().clearCache();
        }
        previousUserIdRef.current = session.user.id;

        // Set user immediately — org data is fetched by DashboardLayout via organizationStore
        // DO NOT query organization_members here — it creates in-flight requests that get
        // killed by the Supabase JS client's AbortController during auth state transitions
        setUser(session.user);
      } else {
        // CRITICAL: When auth becomes null (logout, token expiry, session invalidation)
        // Clear all data stores to prevent stale data on next login
        console.log('[Auth] Session ended, clearing all data stores');
        clearAllDataStores();
        useOrganizationStore.getState().clearCache();
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

    // 1. Clear all in-memory data stores
    clearAllDataStores();

    // 2. Clear persisted organization data
    useOrganizationStore.getState().clearCache();

    // 3. Sign out from Supabase (triggers onAuthStateChange with SIGNED_OUT)
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
