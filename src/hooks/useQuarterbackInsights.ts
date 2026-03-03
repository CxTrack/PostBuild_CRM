/**
 * AI Quarterback Insights Hook
 * Fetches proactive business insights from the generate_quarterback_insights RPC
 * and manages dismissed insight state via user_preferences.
 * Uses direct fetch() to avoid Supabase AbortController issue.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useTaskStore } from '@/stores/taskStore';
import { getAuthToken } from '@/utils/auth.utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface QuarterbackInsight {
  id: string;
  type: 'stale_deal' | 'inactive_customer' | 'overdue_task' | 'expiring_quote' | 'overdue_invoice' | 'follow_up_reminder' | 'new_email_received' | 'upcoming_meeting';
  title: string;
  customer_name?: string;
  customer_id?: string;
  email?: string;
  phone?: string;
  message: string;
  value?: number;
  total_amount?: number;
  amount_outstanding?: number;
  total_spent?: number;
  days_stale?: number;
  days_inactive?: number;
  days_overdue?: number;
  days_until_expiry?: number;
  days_past_followup?: number;
  priority?: string;
  stage?: string;
  due_date?: string;
  expiry_date?: string;
  follow_up_date?: string;
  task_type?: string;
  /** Email-specific fields for new_email_received insights */
  email_subject?: string;
  email_sender?: string;
  email_received_at?: string;
  email_log_id?: string;
  conversation_id?: string;
  /** Meeting-specific fields for upcoming_meeting insights */
  meeting_title?: string;
  meeting_start_time?: string;
  meeting_end_time?: string;
  meeting_location?: string;
  meeting_url?: string;
  meeting_description?: string;
  meeting_attendees?: Array<{ email: string; name: string; status?: string }>;
  meeting_company_domains?: Array<{ domain: string; companyName: string; attendeeNames: string[] }>;
  meeting_source?: 'local' | 'outlook';
  meeting_event_id?: string;
  meeting_web_link?: string;
}

const MAX_VISIBLE_INSIGHTS = 5;

export function useQuarterbackInsights() {
  const [allInsights, setAllInsights] = useState<QuarterbackInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const hasFetched = useRef(false);

  const { currentOrganization, currentMembership } = useOrganizationStore();
  const orgId = currentOrganization?.id;
  const userId = currentMembership?.user_id;
  const userRole = currentMembership?.role || 'user';

  // Load dismissed insight IDs from user_preferences
  const loadDismissed = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token || !orgId) return;

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_preferences?preference_type=eq.qb_dismissed_insights&organization_id=eq.${orgId}&select=preference_value`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.[0]?.preference_value && Array.isArray(data[0].preference_value)) {
          setDismissedIds(data[0].preference_value);
        }
      }
    } catch {
      // Silent - dismissed list is non-critical
    }
  }, [orgId]);

  // Fetch new inbound email insights (client-side supplement)
  const fetchEmailInsights = useCallback(async (token: string): Promise<QuarterbackInsight[]> => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // Fetch inbound emails from last 24 hours that are linked to customers
      const emailRes = await fetch(
        `${SUPABASE_URL}/rest/v1/email_log?organization_id=eq.${orgId}&direction=eq.inbound&sent_at=gte.${twentyFourHoursAgo}&customer_id=not.is.null&select=id,customer_id,sender_email,subject,sent_at,conversation_id&order=sent_at.desc&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
        }
      );

      if (!emailRes.ok) return [];
      const inboundEmails = await emailRes.json();
      if (!inboundEmails || inboundEmails.length === 0) return [];

      // Check which ones already have an outbound reply
      const customerIds = [...new Set(inboundEmails.map((e: any) => e.customer_id))];
      const repliedRes = await fetch(
        `${SUPABASE_URL}/rest/v1/email_log?organization_id=eq.${orgId}&direction=eq.outbound&sent_at=gte.${twentyFourHoursAgo}&customer_id=in.(${customerIds.join(',')})&select=customer_id`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
        }
      );

      const repliedCustomerIds = new Set<string>();
      if (repliedRes.ok) {
        const replied = await repliedRes.json();
        (replied || []).forEach((r: any) => repliedCustomerIds.add(r.customer_id));
      }

      // Also get customer names for the unreplied emails
      const unrepliedEmails = inboundEmails.filter((e: any) => !repliedCustomerIds.has(e.customer_id));
      if (unrepliedEmails.length === 0) return [];

      const unrepliedCustomerIds = [...new Set(unrepliedEmails.map((e: any) => e.customer_id))];
      const custRes = await fetch(
        `${SUPABASE_URL}/rest/v1/customers?id=in.(${unrepliedCustomerIds.join(',')})&select=id,name,email,phone`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
        }
      );

      const customerMap = new Map<string, any>();
      if (custRes.ok) {
        const custs = await custRes.json();
        (custs || []).forEach((c: any) => customerMap.set(c.id, c));
      }

      // Build insights (one per unique customer, using latest email)
      const seenCustomers = new Set<string>();
      const emailInsights: QuarterbackInsight[] = [];

      for (const email of unrepliedEmails) {
        if (seenCustomers.has(email.customer_id)) continue;
        seenCustomers.add(email.customer_id);

        const customer = customerMap.get(email.customer_id);
        const timeDiff = Date.now() - new Date(email.sent_at).getTime();
        const hoursAgo = Math.round(timeDiff / (1000 * 60 * 60));
        const timeLabel = hoursAgo < 1 ? 'just now' : hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`;

        emailInsights.push({
          id: `email_${email.id}`,
          type: 'new_email_received',
          title: email.subject || '(No subject)',
          customer_name: customer?.name || email.sender_email,
          customer_id: email.customer_id,
          email: customer?.email || email.sender_email,
          phone: customer?.phone || undefined,
          message: `New email from ${customer?.name || email.sender_email} - "${email.subject}" received ${timeLabel}. No reply sent yet.`,
          priority: 'high',
          email_subject: email.subject,
          email_sender: email.sender_email,
          email_received_at: email.sent_at,
          email_log_id: email.id,
          conversation_id: email.conversation_id,
        });
      }

      return emailInsights;
    } catch (err) {
      console.error('[QB] Error fetching email insights:', err);
      return [];
    }
  }, [orgId]);

  // Fetch upcoming meeting insights (client-side supplement, same pattern as email insights)
  const fetchMeetingInsights = useCallback(async (token: string): Promise<QuarterbackInsight[]> => {
    try {
      const now = new Date();
      const fortyEightHoursOut = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      // 1. Fetch local CRM calendar events in the next 48 hours
      const localRes = await fetch(
        `${SUPABASE_URL}/rest/v1/calendar_events?organization_id=eq.${orgId}&start_time=gte.${now.toISOString()}&start_time=lte.${fortyEightHoursOut.toISOString()}&status=in.(scheduled,confirmed)&select=id,title,description,start_time,end_time,location,meeting_url,attendees,customer_id,event_type&order=start_time.asc&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
        }
      );

      let localEvents: any[] = [];
      if (localRes.ok) {
        localEvents = await localRes.json();
      }

      // 2. Fetch Outlook events for the same window (optional integration)
      let outlookEvents: any[] = [];
      try {
        const { fetchOutlookEvents } = await import('@/services/microsoftCalendar.service');
        outlookEvents = await fetchOutlookEvents(now.toISOString(), fortyEightHoursOut.toISOString());
      } catch {
        // Outlook integration is optional -- silent if unavailable
      }

      // 3. For events linked to a CRM customer, batch-fetch customer data
      const customerIds = localEvents
        .filter(e => e.customer_id)
        .map(e => e.customer_id);

      const customerMap = new Map<string, any>();
      if (customerIds.length > 0) {
        const uniqueIds = [...new Set(customerIds)];
        const custRes = await fetch(
          `${SUPABASE_URL}/rest/v1/customers?id=in.(${uniqueIds.join(',')})&select=id,name,email,phone,company,total_spent`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': SUPABASE_ANON_KEY,
            },
          }
        );
        if (custRes.ok) {
          const custs = await custRes.json();
          (custs || []).forEach((c: any) => customerMap.set(c.id, c));
        }
      }

      // 4. Build meeting insights
      const { extractCompanyDomains } = await import('@/utils/domain.utils');
      const insights: QuarterbackInsight[] = [];
      const seenKeys = new Set<string>();

      const buildTimeLabel = (startTime: string): string => {
        const hoursUntil = Math.round((new Date(startTime).getTime() - now.getTime()) / (1000 * 60 * 60));
        if (hoursUntil < 1) return 'less than an hour';
        if (hoursUntil === 1) return '1 hour';
        if (hoursUntil < 24) return `${hoursUntil} hours`;
        return 'tomorrow';
      };

      const buildMessage = (
        title: string,
        startTime: string,
        attendees: Array<{ email: string; name?: string }>,
        companyDomains: Array<{ domain: string; companyName: string; attendeeNames: string[] }>,
        customer?: any,
      ): string => {
        const timeLabel = buildTimeLabel(startTime);
        let msg = `"${title}" starts in ${timeLabel}`;
        if (customer) {
          msg += ` with ${customer.name}`;
        } else if (attendees.length > 0) {
          const first = attendees[0].name || attendees[0].email;
          msg += attendees.length === 1
            ? ` with ${first}`
            : ` with ${first} and ${attendees.length - 1} other${attendees.length > 2 ? 's' : ''}`;
        }
        if (companyDomains.length > 0) {
          msg += ` (${companyDomains.map(d => d.companyName).join(', ')})`;
        }
        return msg;
      };

      // Process local CRM events
      for (const event of localEvents) {
        const dedupeKey = `${event.title}_${event.start_time}`;
        if (seenKeys.has(dedupeKey)) continue;
        seenKeys.add(dedupeKey);

        const customer = event.customer_id ? customerMap.get(event.customer_id) : null;
        const attendees = Array.isArray(event.attendees) ? event.attendees : [];
        const companyDomains = extractCompanyDomains(attendees);

        insights.push({
          id: `meeting_${event.id}`,
          type: 'upcoming_meeting',
          title: event.title,
          customer_name: customer?.name || attendees[0]?.name || undefined,
          customer_id: event.customer_id || undefined,
          email: customer?.email || attendees[0]?.email || undefined,
          phone: customer?.phone || undefined,
          total_spent: customer?.total_spent || undefined,
          message: buildMessage(event.title, event.start_time, attendees, companyDomains, customer),
          meeting_title: event.title,
          meeting_start_time: event.start_time,
          meeting_end_time: event.end_time,
          meeting_location: event.location,
          meeting_url: event.meeting_url,
          meeting_description: event.description,
          meeting_attendees: attendees,
          meeting_company_domains: companyDomains,
          meeting_source: 'local',
          meeting_event_id: event.id,
        });
      }

      // Process Outlook events
      for (const event of outlookEvents) {
        const dedupeKey = `${event.title}_${event.start_time}`;
        if (seenKeys.has(dedupeKey)) continue;
        seenKeys.add(dedupeKey);

        const attendees = Array.isArray(event.attendees) ? event.attendees : [];
        const companyDomains = extractCompanyDomains(attendees);

        insights.push({
          id: `meeting_outlook_${event.id || event.outlook_id}`,
          type: 'upcoming_meeting',
          title: event.title,
          customer_name: attendees[0]?.name || undefined,
          email: attendees[0]?.email || undefined,
          message: buildMessage(event.title, event.start_time, attendees, companyDomains),
          meeting_title: event.title,
          meeting_start_time: event.start_time,
          meeting_end_time: event.end_time,
          meeting_location: event.location,
          meeting_url: event.meeting_url,
          meeting_description: event.description || undefined,
          meeting_attendees: attendees,
          meeting_company_domains: companyDomains,
          meeting_source: 'outlook',
          meeting_event_id: event.id || event.outlook_id,
          meeting_web_link: event.web_link || undefined,
        });
      }

      // Sort nearest first, cap at 3 to leave room for other insight types
      insights.sort((a, b) =>
        new Date(a.meeting_start_time!).getTime() - new Date(b.meeting_start_time!).getTime()
      );

      return insights.slice(0, 3);
    } catch (err) {
      console.error('[QB] Error fetching meeting insights:', err);
      return [];
    }
  }, [orgId]);

  // Fetch insights from the RPC function + email insights + meeting insights
  const fetchInsights = useCallback(async () => {
    if (!orgId || !userId) return;

    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch RPC insights, email insights, and meeting insights in parallel
      const [rpcResponse, emailInsights, meetingInsights] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/rpc/generate_quarterback_insights`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              p_user_id: userId,
              p_organization_id: orgId,
              p_role: userRole,
            }),
          }
        ),
        fetchEmailInsights(token),
        fetchMeetingInsights(token),
      ]);

      let insights: QuarterbackInsight[] = [];

      if (rpcResponse.ok) {
        const data = await rpcResponse.json();
        insights = Array.isArray(data) ? data : [];
      } else {
        console.error('[QB] Failed to fetch RPC insights:', rpcResponse.status);
      }

      // Merge: meetings first (time-sensitive), then emails, then RPC insights
      const combined = [...meetingInsights, ...emailInsights, ...insights];
      setAllInsights(combined);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[QB] Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, userId, userRole, fetchEmailInsights]);

  // Dismiss an insight and persist to user_preferences
  const dismissInsight = useCallback(async (insightId: string) => {
    // Optimistic update
    setDismissedIds(prev => {
      const updated = [...prev, insightId];
      // Persist async (fire and forget)
      persistDismissed(updated);
      return updated;
    });
  }, [orgId, userId]);

  const persistDismissed = async (ids: string[]) => {
    try {
      const token = await getAuthToken();
      if (!token || !orgId || !userId) return;

      await fetch(
        `${SUPABASE_URL}/rest/v1/user_preferences`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            user_id: userId,
            organization_id: orgId,
            preference_type: 'qb_dismissed_insights',
            preference_value: ids,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    } catch {
      // Silent - persistence failure is non-critical
    }
  };

  // Load dismissed IDs and fetch insights on mount
  useEffect(() => {
    if (orgId && userId && !hasFetched.current) {
      hasFetched.current = true;
      loadDismissed();
      fetchInsights();
    }
  }, [orgId, userId, loadDismissed, fetchInsights]);

  // Reset when org changes
  useEffect(() => {
    hasFetched.current = false;
  }, [orgId]);

  // Auto-refresh when tasks are updated (e.g. status changed to completed)
  const lastTaskUpdate = useTaskStore((s) => s.lastTaskUpdate);
  useEffect(() => {
    if (lastTaskUpdate > 0 && hasFetched.current) {
      fetchInsights();
    }
  }, [lastTaskUpdate, fetchInsights]);

  // Filter out dismissed, limit visible count
  const visibleInsights = allInsights
    .filter(insight => !dismissedIds.includes(insight.id))
    .slice(0, MAX_VISIBLE_INSIGHTS);

  return {
    insights: visibleInsights,
    allInsights,
    loading,
    lastUpdated,
    dismissInsight,
    refreshInsights: fetchInsights,
    insightCount: visibleInsights.length,
  };
}
