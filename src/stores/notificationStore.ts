import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { userService } from '../services/usersService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  notifyAll: (title: string, message: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  notifyUser: async (title: string, message: string, userId: string) => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase.from('notifications').insert([
      {
        user_id: userId,
        title: title,
        message: message,
        type: 'success'
      }]);

    if (error) {
      console.error('Error inserting notification:', error);
      throw error;
    }
  },


  notifyAll: async (title: string, message: string) => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      throw new Error('User not authenticated');
    }

    const users = await userService.getUsers();

    for (let index = 0; index < users.length; index++) {
      const user = users[index];

      const { error } = await supabase.from('notifications').insert([
        {
          user_id: user.user_id,
          title: title,
          message: message,
          type: 'success'
        },
      ]);

      if (error) {
        console.error('Error inserting notification:', error);
        throw error;
      }
    }
  },

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notifications = data || [];
      const unreadCount = notifications.filter(n => !n.read).length;

      set({
        notifications,
        unreadCount,
        loading: false
      });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      set({
        error: error.message || 'Failed to fetch notifications',
        loading: false
      });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      const notifications = get().notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );

      set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  },

  markAllAsRead: async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;

      const notifications = get().notifications.map(n => ({ ...n, read: true }));

      set({ notifications, unreadCount: 0 });
      toast.success('All notifications marked as read');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  }
}));