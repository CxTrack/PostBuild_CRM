import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCalendarStore } from '../calendarStore';
import { supabase } from '@/lib/supabase';
import type { CalendarEvent } from '@/types/database.types';

// ---------------------------------------------------------------------------
// Mock external calendar integrations (not under test here)
// ---------------------------------------------------------------------------
vi.mock('@/services/microsoftCalendar.service', () => ({
  fetchTodayOutlookEvents: vi.fn().mockResolvedValue({ events: [], needsReauth: false, noConnection: false }),
  fetchOutlookEvents: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/services/googleCalendar.service', () => ({
  fetchTodayGoogleEvents: vi.fn().mockResolvedValue({ events: [], needsReauth: false, noConnection: false }),
  fetchGoogleEvents: vi.fn().mockResolvedValue([]),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// calendarStore.getAuthToken() scans localStorage for keys matching sb-*-auth-token
const AUTH_KEY = 'sb-test-auth-token';
const seedAuthToken = () =>
  localStorage.setItem(AUTH_KEY, JSON.stringify({ access_token: 'mock-access-token' }));

const stubFetch = (response: Partial<Response>) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockEvent: CalendarEvent = {
  id: 'evt-001',
  organization_id: 'org-001',
  user_id: 'user-001',
  customer_id: null,
  cal_com_event_id: null,
  title: 'Team Meeting',
  description: 'Weekly sync',
  event_type: 'meeting',
  start_time: '2026-03-05T10:00:00Z',
  end_time: '2026-03-05T11:00:00Z',
  location: null,
  meeting_url: null,
  status: 'scheduled',
  is_recurring: false,
  recurrence_rule: null,
  attendees: [],
  color_code: '#10b981',
  reminders: [],
  metadata: {},
  created_by: null,
  created_at: '2026-03-05T00:00:00Z',
  updated_at: '2026-03-05T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('calendarStore', () => {
  beforeEach(() => {
    useCalendarStore.getState().reset();
    seedAuthToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe('initial state', () => {
    it('starts with no events', () => {
      expect(useCalendarStore.getState().events).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Query helpers (synchronous — read from local store, no network)
  // -------------------------------------------------------------------------
  describe('query helpers', () => {
    const secondEvent: CalendarEvent = {
      ...mockEvent,
      id: 'evt-002',
      customer_id: 'cust-001',
      start_time: '2026-03-06T14:00:00Z',
      end_time: '2026-03-06T15:00:00Z',
    };

    beforeEach(() => {
      useCalendarStore.setState({ events: [mockEvent, secondEvent] });
    });

    it('getEventById returns the correct event', () => {
      const result = useCalendarStore.getState().getEventById('evt-001');
      expect(result).toBeDefined();
      expect(result?.title).toBe('Team Meeting');
    });

    it('getEventById returns undefined for an unknown id', () => {
      expect(useCalendarStore.getState().getEventById('no-such-id')).toBeUndefined();
    });

    it('getEventsByCustomer returns only events for that customer', () => {
      const results = useCalendarStore.getState().getEventsByCustomer('cust-001');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('evt-002');
    });

    it('getEventsByDate returns only events on that date', () => {
      const results = useCalendarStore.getState().getEventsByDate('2026-03-05');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('evt-001');
    });
  });

  // -------------------------------------------------------------------------
  // Add event
  // -------------------------------------------------------------------------
  describe('add event', () => {
    it('createEvent adds the new event to the store', async () => {
      stubFetch({ ok: true, json: () => Promise.resolve([mockEvent]) } as any);

      const { id, created_at, updated_at, ...eventData } = mockEvent;
      await useCalendarStore.getState().createEvent(eventData);

      const { events } = useCalendarStore.getState();
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Team Meeting');
      expect(events[0].event_type).toBe('meeting');
      expect(events[0].status).toBe('scheduled');
    });

    it('createEvent returns the created event object', async () => {
      stubFetch({ ok: true, json: () => Promise.resolve([mockEvent]) } as any);

      const { id, created_at, updated_at, ...eventData } = mockEvent;
      const result = await useCalendarStore.getState().createEvent(eventData);

      expect(result?.id).toBe('evt-001');
      expect(result?.title).toBe('Team Meeting');
    });

    it('createEvent returns null and sets error when not authenticated', async () => {
      localStorage.clear();

      const { id, created_at, updated_at, ...eventData } = mockEvent;
      const result = await useCalendarStore.getState().createEvent(eventData);

      expect(result).toBeNull();
      expect(useCalendarStore.getState().error).toBe('Not authenticated');
      expect(useCalendarStore.getState().events).toHaveLength(0);
    });

    it('createEvent sets error when the API returns an error status', async () => {
      stubFetch({ ok: false, status: 500, text: () => Promise.resolve('Internal Server Error') } as any);

      const { id, created_at, updated_at, ...eventData } = mockEvent;
      await useCalendarStore.getState().createEvent(eventData);

      expect(useCalendarStore.getState().error).toMatch(/Event creation failed/);
      expect(useCalendarStore.getState().events).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Edit event
  // -------------------------------------------------------------------------
  describe('edit event', () => {
    beforeEach(() => {
      useCalendarStore.setState({ events: [mockEvent] });
    });

    it('updateEvent reflects the change in the store', async () => {
      stubFetch({ ok: true } as any);

      await useCalendarStore.getState().updateEvent('evt-001', { title: 'Updated Meeting' });

      const { events } = useCalendarStore.getState();
      expect(events[0].title).toBe('Updated Meeting');
      // Other fields are unchanged
      expect(events[0].event_type).toBe('meeting');
      expect(events[0].status).toBe('scheduled');
    });

    it('updateEvent can change the event status', async () => {
      stubFetch({ ok: true } as any);

      await useCalendarStore.getState().updateEvent('evt-001', { status: 'confirmed' });

      expect(useCalendarStore.getState().events[0].status).toBe('confirmed');
    });

    it('updateEvent sets error and throws when not authenticated', async () => {
      localStorage.clear();

      await expect(
        useCalendarStore.getState().updateEvent('evt-001', { title: 'X' })
      ).rejects.toThrow('Not authenticated');

      expect(useCalendarStore.getState().error).toBe('Not authenticated');
    });

    it('updateEvent sets error and throws when the API returns an error status', async () => {
      stubFetch({ ok: false, status: 404, text: () => Promise.resolve('Not Found') } as any);

      await expect(
        useCalendarStore.getState().updateEvent('evt-001', { title: 'X' })
      ).rejects.toThrow(/Event update failed/);
    });
  });

  // -------------------------------------------------------------------------
  // Delete event
  // -------------------------------------------------------------------------
  describe('delete event', () => {
    beforeEach(() => {
      useCalendarStore.setState({ events: [mockEvent] });
    });

    it('deleteEvent removes the event from the store', async () => {
      stubFetch({ ok: true } as any);

      await useCalendarStore.getState().deleteEvent('evt-001');

      expect(useCalendarStore.getState().events).toHaveLength(0);
    });

    it('deleteEvent leaves other events untouched', async () => {
      const second: CalendarEvent = { ...mockEvent, id: 'evt-002', title: 'Another Event' };
      useCalendarStore.setState({ events: [mockEvent, second] });
      stubFetch({ ok: true } as any);

      await useCalendarStore.getState().deleteEvent('evt-001');

      const { events } = useCalendarStore.getState();
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('evt-002');
    });

    it('deleteEvent sets error when not authenticated', async () => {
      localStorage.clear();

      await useCalendarStore.getState().deleteEvent('evt-001');

      expect(useCalendarStore.getState().error).toBe('Not authenticated');
      // Event must still be in the store
      expect(useCalendarStore.getState().events).toHaveLength(1);
    });

    it('deleteEvent sets error when the API returns an error status', async () => {
      stubFetch({ ok: false, status: 403, text: () => Promise.resolve('Forbidden') } as any);

      await useCalendarStore.getState().deleteEvent('evt-001');

      expect(useCalendarStore.getState().error).toMatch(/Event deletion failed/);
      expect(useCalendarStore.getState().events).toHaveLength(1);
    });
  });
});
