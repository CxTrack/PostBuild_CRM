import { useState, useEffect, useCallback } from 'react';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

// Session-level cache: avoids per-render RPC calls
const flagCache = new Map<string, { value: boolean; expires: number }>();
const FLAG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Client-side feature flag hook.
 * Checks flag status against the current org's context (ID, industry, tier).
 * Falls back to `false` if the flag doesn't exist or on error.
 *
 * Usage:
 *   const isNewVoiceUiEnabled = useFeatureFlag('new_voice_ui');
 *   if (isNewVoiceUiEnabled) { ... }
 */
export function useFeatureFlag(flagKey: string): boolean {
  const { session, currentOrganizationId } = useAuthContext();
  const [enabled, setEnabled] = useState<boolean>(() => {
    // Return cached value synchronously if available
    const cached = flagCache.get(`${flagKey}:${currentOrganizationId || ''}`);
    if (cached && cached.expires > Date.now()) return cached.value;
    return false;
  });

  const checkFlag = useCallback(async () => {
    if (!flagKey || !session?.access_token) return;

    const cacheKey = `${flagKey}:${currentOrganizationId || ''}`;
    const cached = flagCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      setEnabled(cached.value);
      return;
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/check_feature_flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          p_flag_key: flagKey,
          p_org_id: currentOrganizationId || null,
        }),
      });

      if (!res.ok) {
        setEnabled(false);
        return;
      }

      const result = await res.json();
      const isEnabled = result === true;

      // Cache the result
      flagCache.set(cacheKey, { value: isEnabled, expires: Date.now() + FLAG_CACHE_TTL });
      setEnabled(isEnabled);
    } catch {
      // Fail closed: if we can't check, feature is off
      setEnabled(false);
    }
  }, [flagKey, session?.access_token, currentOrganizationId]);

  useEffect(() => {
    checkFlag();
  }, [checkFlag]);

  return enabled;
}

/**
 * Invalidate all cached flag values.
 * Call after toggling or updating flags in admin UI.
 */
export function invalidateFeatureFlagCache(): void {
  flagCache.clear();
}
