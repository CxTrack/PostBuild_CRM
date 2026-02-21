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
  type: 'stale_deal' | 'inactive_customer' | 'overdue_task' | 'expiring_quote' | 'overdue_invoice' | 'follow_up_reminder';
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

  // Fetch insights from the RPC function
  const fetchInsights = useCallback(async () => {
    if (!orgId || !userId) return;

    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
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
      );

      if (response.ok) {
        const data = await response.json();
        const insights = Array.isArray(data) ? data : [];
        setAllInsights(insights);
        setLastUpdated(new Date());
      } else {
        console.error('[QB] Failed to fetch insights:', response.status);
      }
    } catch (err) {
      console.error('[QB] Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, userId, userRole]);

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
