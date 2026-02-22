import { create } from 'zustand';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';

export interface SystemNotification {
  id: string;
  user_id: string;
  organization_id: string | null;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* ignore */ }
    }
  }
  return null;
};

interface NotificationState {
  notifications: SystemNotification[];
  unreadCount: number;
  loading: boolean;
  lastFetched: Date | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addOptimistic: (notification: Omit<SystemNotification, 'id' | 'created_at'>) => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  lastFetched: null,

  fetchNotifications: async () => {
    const token = getAuthToken();
    if (!token) return;

    set({ loading: true });
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/system_notifications?select=*&order=created_at.desc&limit=50`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data: SystemNotification[] = await res.json();

      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.is_read).length,
        loading: false,
        lastFetched: new Date(),
      });
    } catch {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    // Optimistic update
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));

    await fetch(
      `${supabaseUrl}/rest/v1/system_notifications?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ is_read: true }),
      }
    ).catch(() => {});
  },

  markAllAsRead: async () => {
    const token = getAuthToken();
    if (!token) return;

    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));

    await fetch(
      `${supabaseUrl}/rest/v1/system_notifications?is_read=eq.false`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ is_read: true }),
      }
    ).catch(() => {});
  },

  addOptimistic: (notification) => {
    const newNotif: SystemNotification = {
      ...notification,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    set((s) => ({
      notifications: [newNotif, ...s.notifications],
      unreadCount: s.unreadCount + (newNotif.is_read ? 0 : 1),
    }));
  },
}));
