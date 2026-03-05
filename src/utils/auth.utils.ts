/**
 * Shared Auth Utilities
 * Centralized auth token reading that avoids the Supabase AbortController issue.
 * Reads from localStorage first, falls back to supabase.auth.getSession().
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

/**
 * Get the current user's access token from localStorage.
 * This avoids the Supabase JS v2 AbortController bug that kills in-flight
 * HTTP requests during auth state transitions.
 *
 * Pattern: try sb-{ref}-auth-token → fallback key search → last resort getSession()
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const ref = SUPABASE_URL.split('//')[1]?.split('.')[0];
    const storageKey = ref ? `sb-${ref}-auth-token` : null;
    const stored = storageKey ? localStorage.getItem(storageKey) : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.access_token) return parsed.access_token;
    }
    // Fallback: search for any Supabase auth token key
    const fallbackKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (fallbackKey) {
      const parsed = JSON.parse(localStorage.getItem(fallbackKey) || '{}');
      if (parsed?.access_token) return parsed.access_token;
    }
  } catch {
    // localStorage failed — fall through to supabase client
  }
  // Last resort: try supabase client (may fail due to AbortController)
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Get the Supabase project URL for Edge Function calls.
 */
export function getSupabaseUrl(): string {
  return SUPABASE_URL;
}
