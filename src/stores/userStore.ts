import { create } from 'zustand';
import { userService } from '../services/usersService';

interface UserState {
  users: any[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchUsers: () => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
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
}));