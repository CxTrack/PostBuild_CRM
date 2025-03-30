import { create } from 'zustand';
import { format, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '../lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  type: 'invoice' | 'expense' | 'task' | 'custom' | 'holiday';
  allDay?: boolean;
}

interface CalendarState {
  events: CalendarEvent[];
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

      // Convert date strings to Date objects
      const formattedEvents = (data || []).map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));

      set({ events: formattedEvents, loading: false });
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