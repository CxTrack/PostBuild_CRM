import { useCallStore } from '../stores/callStore';

export const callsService = {
  /**
   * Fetches calls for the current user.
   * Assumes RLS is set up in Supabase to filter by user_id.
   */
  async fetchCalls(): Promise<void> {
    // Access the fetchCalls method directly from the store's state
    await useCallStore.getState().fetchCalls();
  },

  // You can add other call-related service functions here
  // For example: createCall, updateCall, deleteCall, etc.
};
