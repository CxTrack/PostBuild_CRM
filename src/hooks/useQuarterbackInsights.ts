/**
 * AI Quarterback Insights Hook
 * Fetches proactive business insights from the generate_quarterback_insights RPC
 * and manages dismissed insight state via user_preferences.
 * Uses direct fetch() to avoid Supabase AbortController issue.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { getAuthToken } from '@/utils/auth.utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface QuarterbackInsight {
  id: string;
  type: 'stale_deal' | 'inactive_customer' | 'overdue_task' | 'expiring_quote' | 'overdue_invoice' | 'follow_up_reminder' | 'new_email_received';
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

  // Fetch insights from the RPC function + email insights
  const fetchInsights = useCallback(async () => {
    if (!orgId || !userId) return;

    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch RPC insights and email insights in parallel
      const [rpcResponse, emailInsights] = await Promise.all([
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
      ]);

      let insights: QuarterbackInsight[] = [];

      if (rpcResponse.ok) {
        const data = await rpcResponse.json();
        insights = Array.isArray(data) ? data : [];
      } else {
        console.error('[QB] Failed to fetch RPC insights:', rpcResponse.status);
      }

      // Merge: email insights first (high priority), then existing
      const combined = [...emailInsights, ...insights];
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
