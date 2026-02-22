import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { Organization, OrganizationMember, UserProfile } from '../types/database.types';
import { cleanupOrganizationData } from './storeCleanupRegistry';

// Read auth token directly from localStorage — bypasses Supabase JS client's AbortController.
// The Supabase client persists session under sb-{ref}-auth-token in localStorage.
const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* malformed JSON, skip */ }
    }
  }
  return null;
};

interface OrganizationState {
  currentOrganization: Organization | null;
  currentMembership: OrganizationMember | null;
  organizations: Array<{ organization: Organization; membership: OrganizationMember }>;
  teamMembers: Array<UserProfile & { role: string; color: string }>;
  loading: boolean;
  demoMode: boolean;
  _hasHydrated: boolean;
  fetchUserOrganizations: (userId: string) => Promise<void>;
  setCurrentOrganization: (orgId: string) => Promise<void>;
  fetchTeamMembers: () => Promise<void>;
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  updateMember: (memberId: string, data: Partial<OrganizationMember>) => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  getOrganizationId: () => string;
  clearCache: () => void;
  setHasHydrated: (state: boolean) => void;
}

// Generate a color for each team member
const generateUserColor = (index: number): string => {
  const colors = [
    '#6366f1', // indigo
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];
  return colors[index % colors.length];
};

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      currentOrganization: null,
      currentMembership: null,
      organizations: [],
      teamMembers: [],
      loading: false,
      demoMode: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      getOrganizationId: () => {
        const { currentOrganization } = get();
        if (currentOrganization?.id) {
          return currentOrganization.id;
        }
        throw new Error('No organization available');
      },

      clearCache: () => {
        localStorage.removeItem('organization-storage');
        set({
          currentOrganization: null,
          currentMembership: null,
          organizations: [],
          teamMembers: [],
        });
      },

      fetchUserOrganizations: async (userId: string) => {
        if (!userId) {
          console.warn('[OrgStore] fetchUserOrganizations called without userId');
          return;
        }

        console.log('[OrgStore] Fetching organizations for user:', userId);
        set({ loading: true });
        try {
          // Use direct fetch() to bypass Supabase JS client's internal AbortController
          // which kills in-flight requests during auth state transitions
          const token = getAuthToken();
          if (!token) {
            console.warn('[OrgStore] No auth token found in localStorage');
            return;
          }

          const fetchUrl = `${supabaseUrl}/rest/v1/organization_members?user_id=eq.${userId}&select=*,organization:organizations(*)`;
          const fetchHeaders = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          };

          let res = await fetch(fetchUrl, { headers: fetchHeaders });
          if (!res.ok) {
            console.error('[OrgStore] Fetch failed:', res.status, await res.text());
            throw new Error(`Organization fetch failed (${res.status})`);
          }

          let data = await res.json();
          console.log('[OrgStore] Fetched organizations:', data?.length || 0, 'memberships');

          // If empty on first try, the JWT may not be fully propagated for RLS yet — retry once after delay
          if (!data || data.length === 0) {
            console.log('[OrgStore] No orgs found on first attempt, retrying after 1.5s...');
            await new Promise(r => setTimeout(r, 1500));
            const retryToken = getAuthToken();
            if (retryToken) {
              const retryRes = await fetch(fetchUrl, {
                headers: { ...fetchHeaders, 'Authorization': `Bearer ${retryToken}` },
              });
              if (retryRes.ok) {
                const retryData = await retryRes.json();
                if (retryData?.length > 0) {
                  console.log('[OrgStore] Retry succeeded:', retryData.length, 'memberships');
                  data = retryData;
                }
              }
            }
          }

          const orgs = (data || [])
            .filter((item: { organization: Organization | null }) => {
              // Filter out memberships where the organization join failed (RLS or deleted org)
              if (!item.organization) {
                console.warn('[OrgStore] Membership found but organization is null (possible RLS issue)');
                return false;
              }
              return true;
            })
            .map((item: { organization: Organization; id: string; organization_id: string; user_id: string; role: string; permissions: any; calendar_delegation: any; can_view_team_calendars: any; joined_at: string }) => ({
              organization: item.organization,
              membership: {
                id: item.id,
                organization_id: item.organization_id,
                user_id: item.user_id,
                role: item.role,
                permissions: item.permissions,
                calendar_delegation: item.calendar_delegation,
                can_view_team_calendars: item.can_view_team_calendars,
                joined_at: item.joined_at,
              },
            }));

          console.log('[OrgStore] Valid organizations after filtering:', orgs.length);
          set({ organizations: orgs });

          if (orgs.length === 0) {
            console.warn('[OrgStore] No organizations found for user:', userId);
          }

          // If no current org selected or cached org doesn't belong to this user, select the first one
          const currentOrg = get().currentOrganization;
          const orgBelongsToUser = orgs.some(o => o.organization.id === currentOrg?.id);

          if ((!currentOrg || !orgBelongsToUser) && orgs.length > 0) {
            console.log('[OrgStore] Setting current organization to:', orgs[0].organization.name);
            await get().setCurrentOrganization(orgs[0].organization.id);
          }
        } catch (error) {
          console.error('[OrgStore] fetchUserOrganizations failed:', error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      setCurrentOrganization: async (orgId: string) => {
        const { organizations, currentOrganization } = get();
        const orgData = organizations.find((o) => o.organization.id === orgId);

        if (!orgData) {
          throw new Error('Organization not found');
        }

        // Clear data stores if switching to a different org
        if (currentOrganization?.id && currentOrganization.id !== orgId) {
          console.log('[OrgStore] Switching org, clearing data stores...');
          cleanupOrganizationData();
        }

        set({
          currentOrganization: orgData.organization,
          currentMembership: orgData.membership,
        });

        try {
          await get().fetchTeamMembers();
        } catch (error) {
          console.error('[OrgStore] Error fetching team members:', error);
        }
      },

      fetchTeamMembers: async () => {
        const { currentOrganization } = get();
        if (!currentOrganization) return;

        try {
          // Use direct fetch() to bypass AbortController
          const token = getAuthToken();
          if (!token) return;

          const res = await fetch(
            `${supabaseUrl}/rest/v1/organization_members?organization_id=eq.${currentOrganization.id}&is_impersonation=eq.false&select=role,user:user_profiles(*)`,
            {
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (!res.ok) throw new Error(`Team members fetch failed (${res.status})`);
          const data = await res.json();

          interface MemberQueryResult {
            user_id: string;
            role: string;
            user: { full_name: string; avatar_url: string | null } | null;
          }
          const members = data.map((item: MemberQueryResult, index: number) => ({
            ...item.user,
            role: item.role,
            color: generateUserColor(index),
          }));

          set({ teamMembers: members });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred';
          throw error;
        }
      },

      updateOrganization: async (data: Partial<Organization>) => {
        const { currentOrganization } = get();
        if (!currentOrganization) throw new Error('No organization selected');

        const { error } = await supabase
          .from('organizations')
          .update(data)
          .eq('id', currentOrganization.id);

        if (error) throw error;

        // Refresh organization data
        const { data: updated, error: fetchError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', currentOrganization.id)
          .single();

        if (fetchError) throw fetchError;

        set({ currentOrganization: updated });
      },

      updateMember: async (memberId: string, data: Partial<OrganizationMember>) => {
        const { error } = await supabase
          .from('organization_members')
          .update(data)
          .eq('id', memberId);

        if (error) throw error;

        // Refresh team members
        await get().fetchTeamMembers();
      },

      inviteMember: async (email: string, role: string) => {
        const { currentOrganization } = get();
        if (!currentOrganization) throw new Error('No organization selected');

        const token = getAuthToken();
        if (!token) throw new Error('Not authenticated');

        // Get current user ID from localStorage
        let userId = '';
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            try {
              const stored = JSON.parse(localStorage.getItem(key) || '');
              if (stored?.user?.id) userId = stored.user.id;
            } catch { /* skip */ }
          }
        }

        // Insert invitation record
        const res = await fetch(
          `${supabaseUrl}/rest/v1/team_invitations`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              organization_id: currentOrganization.id,
              email: email.toLowerCase().trim(),
              role,
              invited_by: userId,
            }),
          }
        );

        if (!res.ok) {
          const errBody = await res.text();
          if (errBody.includes('duplicate')) {
            throw new Error('This email has already been invited');
          }
          throw new Error(`Invitation failed: ${errBody}`);
        }

        const [invitation] = await res.json();

        // Call Edge Function to send email (fire-and-forget, don't block on email)
        try {
          const currentUser = JSON.parse(localStorage.getItem(
            Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token')) || '{}'
          ) || '{}');

          await fetch(
            `${supabaseUrl}/functions/v1/send-invitation`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: email.toLowerCase().trim(),
                role,
                organization_id: currentOrganization.id,
                invitation_token: invitation.token,
                inviter_name: currentUser?.user?.user_metadata?.full_name || 'A team member',
                org_name: currentOrganization.name,
              }),
            }
          );
        } catch (emailErr) {
          console.warn('Email delivery failed, but invitation was created:', emailErr);
        }
      },
    }),
    {
      name: 'organization-storage',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        currentMembership: state.currentMembership,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
