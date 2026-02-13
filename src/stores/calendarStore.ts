import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../types/database.types';
import { useOrganizationStore } from './organizationStore';

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
  preferences: CalendarPreferences | null;
  loading: boolean;
  error: string | null;
  fetchEvents: (organizationId?: string, from?: Date, to?: Date) => Promise<void>;
  getEventById: (id: string) => CalendarEvent | undefined;
  getEventsByCustomer: (customerId: string) => CalendarEvent[];
  getEventsByDate: (date: string) => CalendarEvent[];
  createEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  fetchPreferences: (userId: string) => Promise<void>;
  updatePreferences: (userId: string, preferences: Partial<CalendarPreferences>) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  preferences: null,
  loading: false,
  error: null,

  fetchEvents: async (organizationId?: string, from?: Date, to?: Date) => {
    // Get org from store if not provided
    const orgId = organizationId || useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) {
      set({ loading: false, error: 'No organization selected' });
      return;
    }

    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('organization_id', orgId);

      if (from) {
        query = query.gte('start_time', from.toISOString());
      }

      if (to) {
        query = query.lte('start_time', to.toISOString());
      }

      const { data, error } = await query.order('start_time', { ascending: true });

      if (error) throw error;
      set({ events: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
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
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        events: [...state.events, data],
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateEvent: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteEvent: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
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
    } catch (error: any) {
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
    } catch (error: any) {
      // Error handled silently
    }
  },
}));
