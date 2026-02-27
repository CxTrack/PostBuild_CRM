/**
 * Microsoft Calendar Service
 * Fetches Outlook calendar events via the fetch-outlook-calendar edge function.
 * Uses the same auth pattern as other CxTrack services (direct fetch, Vault tokens).
 */

import { getAuthToken, getSupabaseUrl } from '@/utils/auth.utils';

export interface OutlookCalendarEvent {
  id: string;
  outlook_id: string;
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
  source: 'outlook';
}

interface FetchCalendarResponse {
  success: boolean;
  events: OutlookCalendarEvent[];
  message?: string;
  needs_reauth?: boolean;
}

/**
 * Fetch today's Outlook calendar events for the current user.
 * Returns empty array if no Microsoft connection or calendar scope not granted.
 */
export async function fetchTodayOutlookEvents(): Promise<{
  events: OutlookCalendarEvent[];
  needsReauth: boolean;
  message?: string;
}> {
  try {
    const token = await getAuthToken();
    if (!token) return { events: [], needsReauth: false };

    const supabaseUrl = getSupabaseUrl();
    if (!supabaseUrl) return { events: [], needsReauth: false };

    const res = await fetch(`${supabaseUrl}/functions/v1/fetch-outlook-calendar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      console.warn('[microsoftCalendar] Edge function error:', res.status);
      return { events: [], needsReauth: false };
    }

    const data: FetchCalendarResponse = await res.json();

    return {
      events: data.events || [],
      needsReauth: data.needs_reauth || false,
      message: data.message,
    };
  } catch (err) {
    console.warn('[microsoftCalendar] Fetch error:', err);
    return { events: [], needsReauth: false };
  }
}

/**
 * Fetch Outlook calendar events for a custom date range.
 */
export async function fetchOutlookEvents(
  startDateTime: string,
  endDateTime: string
): Promise<OutlookCalendarEvent[]> {
  try {
    const token = await getAuthToken();
    if (!token) return [];

    const supabaseUrl = getSupabaseUrl();
    if (!supabaseUrl) return [];

    const res = await fetch(`${supabaseUrl}/functions/v1/fetch-outlook-calendar`, {
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
