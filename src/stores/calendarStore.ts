import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CalendarEvent } from '../types/calendar.event';

export interface CalendarShare {
  id: string;
  owner_id: string;
  shared_with_id: string;
  role: 'viewer' | 'editor';
  owner_email?: string;
  shared_with_email?: string;
  created_at: string;
}

export interface CalendarUser {
  id: string;
  email: string;
}

interface CalendarState {
  events: CalendarEvent[];
  todaysEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  currentDate: Date;
  view: 'month' | 'week';
  selectedCalendarIds: string[]; // Array of user IDs whose calendars to display
  availableCalendars: CalendarUser[]; // All calendars user can view (own + shared)
  calendarShares: CalendarShare[]; // Shares where current user is owner
  sharedWithMe: CalendarShare[]; // Shares where current user has access
  
  // Actions
  fetchEvents: () => Promise<void>;
  addEvent: (event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<void>;
  setView: (view: 'month' | 'week') => void;
  setCurrentDate: (date: Date) => void;
  clearError: () => void;
  
  // Calendar sharing actions
  inviteUser: (userId: string, role?: 'viewer' | 'editor') => Promise<void>;
  revokeAccess: (shareId: string) => Promise<void>;
  fetchCalendarShares: () => Promise<void>;
  fetchAvailableCalendars: () => Promise<void>;
  setSelectedCalendars: (userIds: string[]) => void;
  toggleCalendar: (userId: string) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  todaysEvents: [],
  upcomingEvents: [],
  loading: false,
  error: null,
  currentDate: new Date(),
  view: 'month',
  selectedCalendarIds: [], // Will be initialized with current user's ID
  availableCalendars: [],
  calendarShares: [],
  sharedWithMe: [],
  
  clearError: () => set({ error: null }),
  
  setView: (view) => set({ view }),
  
  setCurrentDate: (date) => set({ currentDate: date }),
  
  setSelectedCalendars: (userIds) => {
    set({ selectedCalendarIds: userIds });
    // Refetch events when selection changes
    get().fetchEvents();
  },
  
  toggleCalendar: (userId) => {
    const current = get().selectedCalendarIds;
    const newSelection = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    get().setSelectedCalendars(newSelection);
  },
  
  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get selected calendar IDs, default to current user if none selected
      const selectedIds = get().selectedCalendarIds.length > 0 
        ? get().selectedCalendarIds 
        : [user.id];
      
      // Try querying calendar_events directly first to test if RLS is working
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .in('user_id', selectedIds)
        .order('start', { ascending: true });

      if (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
      }
      
      console.log('Fetched events:', data?.length || 0, 'events');

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Get available calendars to map user_id to email
      const calendars = get().availableCalendars;
      const emailMap = new Map(calendars.map(cal => [cal.id, cal.email]));
      
      // Convert all to Date objects and add user_email
      const formattedAllEvents = (data || []).map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
        user_email: emailMap.get(event.user_id) || undefined,
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
        .filter(event => event.start > todayEnd) // after today
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
  },
  
  // Calendar sharing functions
  inviteUser: async (userId: string, role: 'viewer' | 'editor' = 'viewer') => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      if (user.id === userId) {
        throw new Error('Cannot share calendar with yourself');
      }
      
      const { error } = await supabase
        .from('calendar_shares')
        .insert([{
          owner_id: user.id,
          shared_with_id: userId,
          role: role
        }]);
      
      if (error) throw error;
      
      // Refresh shares and available calendars
      await Promise.all([
        get().fetchCalendarShares(),
        get().fetchAvailableCalendars()
      ]);
      
      set({ loading: false });
    } catch (error: any) {
      console.error('Error in inviteUser:', error);
      set({ 
        error: error.message || 'Failed to invite user', 
        loading: false 
      });
      throw error;
    }
  },
  
  revokeAccess: async (shareId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('calendar_shares')
        .delete()
        .eq('id', shareId);
      
      if (error) throw error;
      
      // Remove from selected calendars if it was selected
      const share = get().calendarShares.find(s => s.id === shareId);
      if (share) {
        const newSelection = get().selectedCalendarIds.filter(
          id => id !== share.shared_with_id
        );
        set({ selectedCalendarIds: newSelection });
      }
      
      // Refresh shares and available calendars
      await Promise.all([
        get().fetchCalendarShares(),
        get().fetchAvailableCalendars()
      ]);
      
      set({ loading: false });
    } catch (error: any) {
      console.error('Error in revokeAccess:', error);
      set({ 
        error: error.message || 'Failed to revoke access', 
        loading: false 
      });
      throw error;
    }
  },
  
  fetchCalendarShares: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Fetch both queries in parallel for better performance
      const [sharesResult, sharedWithMeResult] = await Promise.all([
        supabase
          .from('calendar_shares_with_users')
          .select('*')
          .eq('owner_id', user.id),
        supabase
          .from('calendar_shares_with_users')
          .select('*')
          .eq('shared_with_id', user.id)
      ]);
      
      if (sharesResult.error) throw sharesResult.error;
      if (sharedWithMeResult.error) throw sharedWithMeResult.error;
      
      const sharesData = sharesResult.data;
      const sharedWithMeData = sharedWithMeResult.data;
      
      // Format the data
      const formattedShares = (sharesData || []).map(share => ({
        id: share.id,
        owner_id: share.owner_id,
        shared_with_id: share.shared_with_id,
        role: share.role || 'viewer' as 'viewer' | 'editor',
        shared_with_email: share.shared_with_email,
        created_at: share.created_at
      }));
      
      const formattedSharedWithMe = (sharedWithMeData || []).map(share => ({
        id: share.id,
        owner_id: share.owner_id,
        shared_with_id: share.shared_with_id,
        role: share.role || 'viewer' as 'viewer' | 'editor',
        owner_email: share.owner_email,
        created_at: share.created_at
      }));
      
      set({ 
        calendarShares: formattedShares,
        sharedWithMe: formattedSharedWithMe
      });
    } catch (error: any) {
      console.error('Error in fetchCalendarShares:', error);
      set({ error: error.message || 'Failed to fetch calendar shares' });
    }
  },
  
  fetchAvailableCalendars: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const currentUserEmail = user.email;
      
      // Get all users whose calendars are shared with current user (using view)
      const { data: sharedCalendars, error: sharedError } = await supabase
        .from('calendar_shares_with_users')
        .select('owner_id, owner_email')
        .eq('shared_with_id', user.id);
      
      if (sharedError) throw sharedError;
      
      // Build list of available calendars
      const calendars: CalendarUser[] = [
        // Always include current user's calendar
        { id: user.id, email: currentUserEmail || '' }
      ];
      
      // Add shared calendars
      (sharedCalendars || []).forEach(share => {
        if (share.owner_email) {
          calendars.push({
            id: share.owner_id,
            email: share.owner_email
          });
        }
      });
      
      set({ availableCalendars: calendars });
      
      // Initialize selected calendars with current user if not set
      if (get().selectedCalendarIds.length === 0) {
        set({ selectedCalendarIds: [user.id] });
      }
    } catch (error: any) {
      console.error('Error in fetchAvailableCalendars:', error);
      set({ error: error.message || 'Failed to fetch available calendars' });
    }
  }
}));