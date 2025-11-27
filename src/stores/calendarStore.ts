import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CalendarEvent } from '../types/calendar.event';

interface CalendarState {
  events: CalendarEvent[];
  todaysEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  currentDate: Date;
  view: 'month' | 'week';
  
  // Actions
  fetchEvents: () => Promise<void>;
  addEvent: (event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<void>;
  setView: (view: 'month' | 'week') => void;
  setCurrentDate: (date: Date) => void;
  clearError: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  todaysEvents: [],
  upcomingEvents: [],
  loading: false,
  error: null,
  currentDate: new Date(),
  view: 'month',
  
  clearError: () => set({ error: null }),
  
  setView: (view) => set({ view }),
  
  setCurrentDate: (date) => set({ currentDate: date }),
  
  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // First, convert all to Date objects
      const formattedAllEvents = (data || []).map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));

      // Then filter for today’s events
      const todaysEvents = formattedAllEvents.filter(event => {
        if (event.allDay) {
          return event.start <= todayEnd && event.end >= todayStart;
        }

        if (event.start <= now && event.end >= now) return true;
        if (event.start >= now && event.start <= todayEnd) return true;

        return false;
      });

      // Upcoming events (next 3 events starting after today)
      const upcomingEvents = formattedAllEvents
        .filter(event => event.start >= todayEnd) // after today
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 3); // only 3 next events

      set({
        events: formattedAllEvents,
        todaysEvents,
        upcomingEvents: upcomingEvents,
        loading: false,
      });
    } catch (error: any) {
      console.error('Error in fetchEvents:', error);
      set({ 
        error: error.message || 'Failed to fetch calendar events', 
        loading: false 
      });
    }
  },
  
  addEvent: async (eventData) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          ...eventData,
          user_id: user.id,
          start: eventData.start?.toISOString(),
          end: eventData.end?.toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newEvent = {
        ...data,
        start: new Date(data.start),
        end: new Date(data.end)
      };

      set({ 
        events: [...get().events, newEvent],
        loading: false 
      });

      return newEvent;
    } catch (error: any) {
      console.error('Error in addEvent:', error);
      set({ 
        error: error.message || 'Failed to add event', 
        loading: false 
      });
      throw error;
    }
  },
  
  updateEvent: async (id, eventData) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          ...eventData,
          start: eventData.start?.toISOString(),
          end: eventData.end?.toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedEvent = {
        ...data,
        start: new Date(data.start),
        end: new Date(data.end)
      };

      set({ 
        events: get().events.map(event => 
          event.id === id ? updatedEvent : event
        ),
        loading: false 
      });

      return updatedEvent;
    } catch (error: any) {
      console.error('Error in updateEvent:', error);
      set({ 
        error: error.message || 'Failed to update event', 
        loading: false 
      });
      throw error;
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
      
      set({ 
        events: get().events.filter(event => event.id !== id),
        loading: false 
      });
    } catch (error: any) {
      console.error('Error in deleteEvent:', error);
      set({ 
        error: error.message || 'Failed to delete event', 
        loading: false 
      });
      throw error;
    }
  }
}));