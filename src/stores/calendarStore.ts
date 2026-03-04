import { create } from 'zustand';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { CalendarEvent } from '../types/database.types';
import { useOrganizationStore } from './organizationStore';
import { fetchTodayOutlookEvents, fetchOutlookEvents as fetchOutlookEventsApi } from '@/services/microsoftCalendar.service';
import type { OutlookCalendarEvent } from '@/services/microsoftCalendar.service';
import { fetchTodayGoogleEvents, fetchGoogleEvents as fetchGoogleEventsApi } from '@/services/googleCalendar.service';
import type { GoogleCalendarEvent } from '@/services/googleCalendar.service';

// Read auth token directly from localStorage to bypass AbortController issues
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

interface CalendarPreferences {
  default_view: 'month' | 'week' | 'day' | 'agenda';
  week_start_day: number;
  time_format: '12h' | '24h';
  show_weekends: boolean;
  show_agenda_panel: boolean;
  agenda_panel_position: 'left' | 'right';
  working_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  email_reminders: boolean;
  sms_reminders: boolean;
  event_colors: {
    appointment: string;
    meeting: string;
    call: string;
    task: string;
    reminder: string;
  };
}

interface CalendarState {
  events: CalendarEvent[];
  outlookEvents: OutlookCalendarEvent[];
  outlookLoading: boolean;
  outlookNeedsReauth: boolean;
  googleEvents: GoogleCalendarEvent[];
  googleLoading: boolean;
  googleNeedsReauth: boolean;
  googleNoConnection: boolean;
  preferences: CalendarPreferences | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
  fetchEvents: (organizationId?: string, from?: Date, to?: Date) => Promise<void>;
  fetchOutlookTodayEvents: () => Promise<void>;
  fetchOutlookEventsRange: (startDate: string, endDate: string) => Promise<void>;
  fetchGoogleTodayEvents: () => Promise<void>;
  fetchGoogleEventsRange: (startDate: string, endDate: string) => Promise<void>;
  getEventById: (id: string) => CalendarEvent | undefined;
  getEventsByCustomer: (customerId: string) => CalendarEvent[];
  getEventsByDate: (date: string) => CalendarEvent[];
  createEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  fetchPreferences: (userId: string) => Promise<void>;
  updatePreferences: (userId: string, preferences: Partial<CalendarPreferences>) => Promise<void>;
}

const initialCalendarState = {
  events: [] as CalendarEvent[],
  outlookEvents: [] as OutlookCalendarEvent[],
  outlookLoading: false,
  outlookNeedsReauth: false,
  googleEvents: [] as GoogleCalendarEvent[],
  googleLoading: false,
  googleNeedsReauth: false,
  googleNoConnection: false,
  preferences: null as CalendarPreferences | null,
  loading: false,
  error: null as string | null,
};

export const useCalendarStore = create<CalendarState>((set, get) => ({
  ...initialCalendarState,

  reset: () => set(initialCalendarState),

  fetchEvents: async (organizationId?: string, from?: Date, to?: Date) => {
    // Get org from store if not provided
    const orgId = organizationId || useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) {
      set({ loading: false, error: 'No organization selected' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      let url = `${supabaseUrl}/rest/v1/calendar_events?organization_id=eq.${orgId}&select=*&order=start_time.asc`;
      if (from) {
        url += `&start_time=gte.${encodeURIComponent(from.toISOString())}`;
      }
      if (to) {
        url += `&start_time=lte.${encodeURIComponent(to.toISOString())}`;
      }

      const res = await fetch(url, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Events fetch failed (${res.status}): ${errBody}`);
      }

      const data = await res.json();
      set({ events: data || [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  fetchOutlookTodayEvents: async () => {
    set({ outlookLoading: true });
    try {
      const result = await fetchTodayOutlookEvents();
      set({
        outlookEvents: result.events,
        outlookNeedsReauth: result.needsReauth,
      });
      if (result.needsReauth) {
        console.warn('[calendarStore] Outlook calendar needs re-authorization');
      }
    } catch (err) {
      console.warn('[calendarStore] Outlook calendar fetch error:', err);
    } finally {
      set({ outlookLoading: false });
    }
  },

  fetchOutlookEventsRange: async (startDate: string, endDate: string) => {
    set({ outlookLoading: true });
    try {
      const events = await fetchOutlookEventsApi(startDate, endDate);
      set({ outlookEvents: events });
    } catch (err) {
      console.warn('[calendarStore] Outlook calendar range fetch error:', err);
    } finally {
      set({ outlookLoading: false });
    }
  },

  fetchGoogleTodayEvents: async () => {
    set({ googleLoading: true });
    try {
      const result = await fetchTodayGoogleEvents();
      set({
        googleEvents: result.events,
        googleNeedsReauth: result.needsReauth,
        googleNoConnection: result.noConnection,
      });
      if (result.needsReauth) {
        console.warn('[calendarStore] Google calendar needs re-authorization');
      }
    } catch (err) {
      console.warn('[calendarStore] Google calendar fetch error:', err);
    } finally {
      set({ googleLoading: false });
    }
  },

  fetchGoogleEventsRange: async (startDate: string, endDate: string) => {
    set({ googleLoading: true });
    try {
      const events = await fetchGoogleEventsApi(startDate, endDate);
      set({ googleEvents: events });
    } catch (err) {
      console.warn('[calendarStore] Google calendar range fetch error:', err);
    } finally {
      set({ googleLoading: false });
    }
  },

  getEventById: (id) => {
    return get().events.find((e) => e.id === id);
  },

  getEventsByCustomer: (customerId) => {
    return get().events.filter(event => event.customer_id === customerId);
  },

  getEventsByDate: (date) => {
    return get().events.filter(event => {
      const eventDate = new Date(event.start_time).toISOString().split('T')[0];
      return eventDate === date;
    });
  },

  createEvent: async (event) => {
    set({ loading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${supabaseUrl}/rest/v1/calendar_events`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(event),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Event creation failed (${res.status}): ${errBody}`);
      }

      const [data] = await res.json();

      set((state) => ({
        events: [...state.events, data],
      }));

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateEvent: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${supabaseUrl}/rest/v1/calendar_events?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Event update failed (${res.status}): ${errBody}`);
      }

      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteEvent: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${supabaseUrl}/rest/v1/calendar_events?id=eq.${id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Event deletion failed (${res.status}): ${errBody}`);
      }

      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  fetchPreferences: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('calendar_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        set({ preferences: data as any });
      } else {
        set({
          preferences: {
            default_view: 'week',
            week_start_day: 0,
            time_format: '12h',
            show_weekends: true,
            show_agenda_panel: true,
            agenda_panel_position: 'right',
            working_hours: {
              enabled: false,
              start: '09:00',
              end: '17:00',
            },
            email_reminders: true,
            sms_reminders: false,
            event_colors: {
              appointment: '#6366f1',
              meeting: '#10b981',
              call: '#f59e0b',
              task: '#8b5cf6',
              reminder: '#ec4899',
            },
          },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      // Error handled silently
    }
  },

  updatePreferences: async (userId, preferences) => {
    try {
      const { error } = await supabase
        .from('calendar_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
        });

      if (error) throw error;

      set((state) => ({
        preferences: state.preferences
          ? { ...state.preferences, ...preferences }
          : null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      // Error handled silently
    }
  },
}));
