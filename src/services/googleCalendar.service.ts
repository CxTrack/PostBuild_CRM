/**
 * Google Calendar Service
 * Fetches Google Calendar events via the fetch-google-calendar edge function.
 * Mirrors the architecture of microsoftCalendar.service.ts for consistency.
 */

import { getAuthToken, getSupabaseUrl } from '@/utils/auth.utils';

export interface GoogleCalendarEvent {
  id: string;
  google_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_all_day: boolean;
  description: string | null;
  meeting_url: string | null;
  web_link: string | null;
  organizer: string | null;
  attendees: Array<{ name: string; email: string; status: string }>;
  show_as: string;
  source: 'google';
}

interface FetchCalendarResponse {
  success: boolean;
  events: GoogleCalendarEvent[];
  message?: string;
  needs_reauth?: boolean;
  no_connection?: boolean;
}

/**
 * Fetch today's Google Calendar events for the current user.
 * Returns empty array if no Google connection or calendar scope not granted.
 */
export async function fetchTodayGoogleEvents(): Promise<{
  events: GoogleCalendarEvent[];
  needsReauth: boolean;
  noConnection: boolean;
  message?: string;
}> {
  try {
    const token = await getAuthToken();
    if (!token) return { events: [], needsReauth: false, noConnection: true };

    const supabaseUrl = getSupabaseUrl();
    if (!supabaseUrl) return { events: [], needsReauth: false, noConnection: true };

    const res = await fetch(`${supabaseUrl}/functions/v1/fetch-google-calendar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      console.warn('[googleCalendar] Edge function error:', res.status);
      return { events: [], needsReauth: false, noConnection: false };
    }

    const data: FetchCalendarResponse = await res.json();

    return {
      events: data.events || [],
      needsReauth: data.needs_reauth || false,
      noConnection: data.no_connection || false,
      message: data.message,
    };
  } catch (err) {
    console.warn('[googleCalendar] Fetch error:', err);
    return { events: [], needsReauth: false, noConnection: false };
  }
}

/**
 * Fetch Google Calendar events for a custom date range.
 */
export async function fetchGoogleEvents(
  startDateTime: string,
  endDateTime: string
): Promise<GoogleCalendarEvent[]> {
  try {
    const token = await getAuthToken();
    if (!token) return [];

    const supabaseUrl = getSupabaseUrl();
    if (!supabaseUrl) return [];

    const res = await fetch(`${supabaseUrl}/functions/v1/fetch-google-calendar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startDateTime, endDateTime }),
    });

    if (!res.ok) return [];

    const data: FetchCalendarResponse = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}
