import { create } from 'zustand';
import { userService } from '../services/usersService';
import { UserProfile } from '../types/database.types';

interface UserState {
  users: any[];
  currentUserProfile: UserProfile| null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
  getCurrentUserProfie: () => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUserProfile: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await userService.getUsers();
      set({ users, loading: false });
    } catch (error: any) {
      console.error('Error in fetchCustomers:', error);
      set({
        error: error.message || 'Failed to fetch customers',
        loading: false
      });
    }
  },

  getCurrentUserProfie: async () => {
    set({ loading: true, error: null });
    try {
      var profile = await userService.getProfile();
      set({ currentUserProfile:profile, loading: false });
    } catch (error: any) {
      console.error('Error in retriving user profile:', error);
      set({
        error: error.message || 'Failed to retre user profile',
        loading: false
      });
      throw error;
    }
  },
}));