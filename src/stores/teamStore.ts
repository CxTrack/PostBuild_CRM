import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Team, TeamWithMembers } from '../types/database.types';
import { useOrganizationStore } from './organizationStore';

interface TeamState {
  teams: TeamWithMembers[];
  loading: boolean;
  error: string | null;

  fetchTeams: () => Promise<void>;
  createTeam: (data: { name: string; description?: string; color?: string }) => Promise<Team>;
  updateTeam: (id: string, data: { name?: string; description?: string; color?: string }) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addMember: (teamId: string, userId: string) => Promise<void>;
  removeMember: (teamId: string, userId: string) => Promise<void>;

  // Local helpers (no API calls)
  getTeamsForUser: (userId: string) => TeamWithMembers[];
  getUserIdsForTeam: (teamId: string) => string[];

  reset: () => void;
}

const initialState = {
  teams: [] as TeamWithMembers[],
  loading: false,
  error: null as string | null,
};

export const useTeamStore = create<TeamState>((set, get) => ({
  ...initialState,

  fetchTeams: async () => {
    const orgId = useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) return;

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members (
            id,
            team_id,
            user_id,
            added_by,
            added_at,
            user_profiles:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .eq('organization_id', orgId)
        .order('name');

      if (error) throw error;
      set({ teams: (data || []) as TeamWithMembers[], loading: false });
    } catch (error: any) {
      console.error('[TeamStore] fetchTeams error:', error);
      set({ error: error.message, loading: false });
    }
  },

  createTeam: async (data) => {
    const orgId = useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) throw new Error('No organization selected');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        organization_id: orgId,
        name: data.name,
        description: data.description || null,
        color: data.color || '#6366f1',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Refetch to get full joined data
    await get().fetchTeams();
    return team;
  },

  updateTeam: async (id, data) => {
    const { error } = await supabase
      .from('teams')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await get().fetchTeams();
  },

  deleteTeam: async (id) => {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== id),
    }));
  },

  addMember: async (teamId, userId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        added_by: user.id,
      });

    if (error) throw error;
    await get().fetchTeams();
  },

  removeMember: async (teamId, userId) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
    await get().fetchTeams();
  },

  getTeamsForUser: (userId) => {
    return get().teams.filter((team) =>
      team.team_members.some((m) => m.user_id === userId)
    );
  },

  getUserIdsForTeam: (teamId) => {
    const team = get().teams.find((t) => t.id === teamId);
    return team ? team.team_members.map((m) => m.user_id) : [];
  },

  reset: () => set(initialState),
}));
