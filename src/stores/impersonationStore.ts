/**
 * Admin Impersonation Store
 *
 * Manages the state for admin user impersonation. When an admin
 * "impersonates" a user, this store:
 *   1. Calls the admin_start_impersonation RPC (creates temp org membership)
 *   2. Switches the organization context to the target user's org
 *   3. Persists session to sessionStorage (survives page refresh)
 *
 * On exit, it reverses the process and returns the admin to /admin.
 *
 * Uses direct fetch() to bypass Supabase JS client's AbortController issue.
 */

import { create } from 'zustand';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';

// ── Auth token helper (same pattern as adminStore / organizationStore) ──

const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* skip */ }
    }
  }
  return null;
};

const getAuthUserId = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.user?.id) return stored.user.id;
      } catch { /* skip */ }
    }
  }
  return null;
};

// ── RPC helper ──

async function supabaseRpc<T = any>(fnName: string, params: Record<string, any> = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RPC ${fnName} failed: ${err}`);
  }

  return res.json();
}

// ── SessionStorage persistence ──

const SESSION_KEY = 'cxtrack_impersonation_session';

interface TargetProfile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  profile_metadata: Record<string, any>;
}

interface SessionData {
  sessionId: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  targetOrgId: string;
  targetOrgName: string;
  targetRole: string;
  adminOriginalOrgId: string | null;
  targetProfile: TargetProfile | null;
}

function saveSession(data: SessionData): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

// ── Store types ──

interface ImpersonationState {
  isImpersonating: boolean;
  sessionId: string | null;
  targetUserId: string | null;
  targetUserName: string | null;
  targetUserEmail: string | null;
  targetOrgId: string | null;
  targetOrgName: string | null;
  targetRole: string | null;
  adminOriginalOrgId: string | null;
  targetProfile: TargetProfile | null;
  loading: boolean;

  startImpersonation: (params: {
    targetUserId: string;
    targetUserName: string;
    targetUserEmail: string;
    targetOrgId: string;
    targetOrgName: string;
  }) => Promise<void>;

  endImpersonation: () => Promise<void>;

  restoreFromSession: () => void;

  reset: () => void;
}

const initialState = {
  isImpersonating: false,
  sessionId: null as string | null,
  targetUserId: null as string | null,
  targetUserName: null as string | null,
  targetUserEmail: null as string | null,
  targetOrgId: null as string | null,
  targetOrgName: null as string | null,
  targetRole: null as string | null,
  adminOriginalOrgId: null as string | null,
  targetProfile: null as TargetProfile | null,
  loading: false,
};

export const useImpersonationStore = create<ImpersonationState>()((set, get) => ({
  ...initialState,

  startImpersonation: async ({ targetUserId, targetUserName, targetUserEmail, targetOrgId, targetOrgName }) => {
    set({ loading: true });

    try {
      // 1. Call the RPC to create temp membership + session
      const result = await supabaseRpc<{
        success: boolean;
        session_id: string;
        target_role: string;
        target_org_id: string;
      }>('admin_start_impersonation', {
        p_target_user_id: targetUserId,
        p_target_org_id: targetOrgId,
      });

      if (!result.success) {
        throw new Error('Impersonation start failed');
      }

      // 2. Fetch target user's full profile (name, avatar, AI CoPilot preferences)
      let targetProfile: TargetProfile | null = null;
      try {
        const token = getAuthToken();
        const profileRes = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?id=eq.${targetUserId}&select=full_name,email,avatar_url,profile_metadata`,
          {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (profileRes.ok) {
          const profiles = await profileRes.json();
          if (profiles?.[0]) {
            targetProfile = {
              full_name: profiles[0].full_name,
              email: profiles[0].email,
              avatar_url: profiles[0].avatar_url,
              profile_metadata: profiles[0].profile_metadata || {},
            };
          }
        }
      } catch (err) {
        console.warn('[Impersonation] Could not fetch target profile:', err);
      }

      const sessionData: SessionData = {
        sessionId: result.session_id,
        targetUserId,
        targetUserName,
        targetUserEmail,
        targetOrgId,
        targetOrgName,
        targetRole: result.target_role,
        adminOriginalOrgId: null, // Will be set after org store reads
        targetProfile,
      };

      // 3. Get the admin's current org before switching
      const { useOrganizationStore } = await import('./organizationStore');
      const orgStore = useOrganizationStore.getState();
      sessionData.adminOriginalOrgId = orgStore.currentOrganization?.id || null;

      // 4. Save session to sessionStorage BEFORE org switch
      //    so a crash/refresh during the switch can still trigger cleanup
      saveSession(sessionData);

      // 5. Refresh org list to pick up the temp membership
      const adminUserId = getAuthUserId();
      if (adminUserId) {
        await orgStore.fetchUserOrganizations(adminUserId);
      }

      // 6. Switch to target org
      await orgStore.setCurrentOrganization(targetOrgId);

      // 7. Update store state
      set({
        isImpersonating: true,
        sessionId: result.session_id,
        targetUserId,
        targetUserName,
        targetUserEmail,
        targetOrgId,
        targetOrgName,
        targetRole: result.target_role,
        adminOriginalOrgId: sessionData.adminOriginalOrgId,
        targetProfile,
        loading: false,
      });

      console.log('[Impersonation] Started as', targetUserName, 'in', targetOrgName);
    } catch (error) {
      set({ loading: false });
      console.error('[Impersonation] Start failed:', error);
      throw error;
    }
  },

  endImpersonation: async () => {
    const { sessionId, adminOriginalOrgId } = get();
    set({ loading: true });

    try {
      // 1. Call the RPC to clean up temp membership + end session
      if (sessionId) {
        try {
          await supabaseRpc('admin_end_impersonation', {
            p_session_id: sessionId,
          });
        } catch (err) {
          console.warn('[Impersonation] End RPC failed (session may already be cleaned up):', err);
        }
      }

      // 2. Clear sessionStorage
      clearSession();

      // 3. Refresh org list (temp membership now removed)
      const { useOrganizationStore } = await import('./organizationStore');
      const orgStore = useOrganizationStore.getState();
      const adminUserId = getAuthUserId();

      if (adminUserId) {
        await orgStore.fetchUserOrganizations(adminUserId);
      }

      // 4. Restore admin's original org
      if (adminOriginalOrgId) {
        try {
          await orgStore.setCurrentOrganization(adminOriginalOrgId);
        } catch {
          // If original org restore fails, the store will pick the first available org
          console.warn('[Impersonation] Could not restore original org, using default');
        }
      }

      // 5. Reset store state
      set({ ...initialState });

      console.log('[Impersonation] Ended, returned to admin context');
    } catch (error) {
      set({ loading: false });
      console.error('[Impersonation] End failed:', error);
      // Even if cleanup fails, reset local state so UI is unblocked
      clearSession();
      set({ ...initialState });
    }
  },

  restoreFromSession: () => {
    const session = loadSession();
    if (!session) return;

    console.log('[Impersonation] Restoring session from sessionStorage:', session.targetUserName);

    set({
      isImpersonating: true,
      sessionId: session.sessionId,
      targetUserId: session.targetUserId,
      targetUserName: session.targetUserName,
      targetUserEmail: session.targetUserEmail,
      targetOrgId: session.targetOrgId,
      targetOrgName: session.targetOrgName,
      targetRole: session.targetRole,
      adminOriginalOrgId: session.adminOriginalOrgId,
      targetProfile: session.targetProfile || null,
      loading: false,
    });

    // Verify org context matches the impersonation target (persist may have stale data)
    import('./organizationStore').then(({ useOrganizationStore }) => {
      const orgStore = useOrganizationStore.getState();
      if (orgStore.currentOrganization?.id !== session.targetOrgId) {
        console.log('[Impersonation] Org mismatch on restore, re-switching to target org');
        const adminUserId = getAuthUserId();
        if (adminUserId) {
          orgStore.fetchUserOrganizations(adminUserId).then(() => {
            orgStore.setCurrentOrganization(session.targetOrgId).catch((err) => {
              console.error('[Impersonation] Failed to restore target org:', err);
            });
          });
        }
      }
    });
  },

  reset: () => {
    clearSession();
    set({ ...initialState });
  },
}));
