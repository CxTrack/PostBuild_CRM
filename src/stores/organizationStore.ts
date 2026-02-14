import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Organization, OrganizationMember, UserProfile } from '../types/database.types';
import { clearOrganizationDataStores } from './storeCleanup';

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
          const { data, error } = await supabase
            .from('organization_members')
            .select(`
              *,
              organization:organizations(*)
            `)
            .eq('user_id', userId);

          if (error) {
            console.error('[OrgStore] Error fetching organizations:', error);
            throw error;
          }

          console.log('[OrgStore] Fetched organizations:', data?.length || 0, 'memberships');

          const orgs = data
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
          clearOrganizationDataStores();
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
          const { data, error } = await supabase
            .from('organization_members')
            .select(`
              role,
              user:user_profiles(*)
            `)
            .eq('organization_id', currentOrganization.id);

          if (error) throw error;

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

        // TODO: Implement real invitation logic via Supabase Edge Function
        // For now, just simulate the invite
        await new Promise(resolve => setTimeout(resolve, 800));
      },
    }),
    {
      name: 'organization-storage',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        currentMembership: state.currentMembership,
      }),
      onRehydrateStorage: (_state) => {
        // Return a function that will be called after hydration completes
        return () => {
          // CRITICAL: Always set hydrated to true after hydration completes
          // Use the store's setHasHydrated method via setTimeout to avoid circular reference
          setTimeout(() => {
            useOrganizationStore.getState().setHasHydrated(true);
          }, 0);
        };
      },
    }
  )
);
