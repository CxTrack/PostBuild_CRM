/**
 * Quarterback Action Logger
 *
 * Fire-and-forget logging for QB insight lifecycle events.
 * Uses direct fetch to avoid AbortController issues.
 */
import { supabaseUrl } from '@/lib/supabase';

export type QBEventType =
  | 'impression'
  | 'click'
  | 'choice'
  | 'action_confirmed'
  | 'action_completed'
  | 'action_failed'
  | 'dismiss';

export interface QBLogEvent {
  insightId: string;
  insightType: string;
  eventType: QBEventType;
  choiceId?: string;
  actionType?: string;
  actionResult?: string;
  customerId?: string;
  customerName?: string;
  dealValue?: number;
  metadata?: Record<string, unknown>;
}

/** Session-level dedup set for impressions (avoids logging on every 5-min refresh) */
const loggedImpressions = new Set<string>();

/**
 * Log a QB event. Fire-and-forget -- never blocks UI, silently catches errors.
 * For impressions, deduplicates per browser session (same insight won't log twice).
 */
export function logQBEvent(event: QBLogEvent): void {
  // Session-level dedup for impressions
  if (event.eventType === 'impression') {
    const key = `${event.insightId}:${event.insightType}`;
    if (loggedImpressions.has(key)) return;
    loggedImpressions.add(key);
  }

  _doLog(event).catch((e) => console.error('[qbActionLog] log failed:', e));
}

/**
 * Batch-log impressions for multiple insights at once.
 */
export function logQBImpressions(
  insights: Array<{ id?: string; type: string; customer_id?: string; customer_name?: string; value?: number }>,
  orgId: string,
  userId: string
): void {
  for (const insight of insights) {
    if (!insight.id) continue;
    logQBEvent({
      insightId: insight.id,
      insightType: insight.type,
      eventType: 'impression',
      customerId: insight.customer_id,
      customerName: insight.customer_name,
      dealValue: insight.value,
    });
  }
}

async function _doLog(event: QBLogEvent): Promise<void> {
  const ref = supabaseUrl?.split('//')[1]?.split('.')[0];
  if (!ref) return;

  const raw = localStorage.getItem(`sb-${ref}-auth-token`);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  const token = parsed?.access_token;
  const userId = parsed?.user?.id;
  if (!token || !userId) return;

  // Resolve org_id from token claims or local storage
  const orgId = _getOrgId();
  if (!orgId) return;

  await fetch(`${supabaseUrl}/rest/v1/quarterback_action_log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      organization_id: orgId,
      user_id: userId,
      insight_id: event.insightId,
      insight_type: event.insightType,
      event_type: event.eventType,
      choice_id: event.choiceId || null,
      action_type: event.actionType || null,
      action_result: event.actionResult || null,
      customer_id: event.customerId || null,
      customer_name: event.customerName || null,
      deal_value: event.dealValue || null,
      metadata: event.metadata || null,
    }),
  });
}

function _getOrgId(): string | null {
  try {
    const raw = localStorage.getItem('current_organization_id');
    if (raw) return raw.replace(/"/g, '');
    // Fallback: check org store
    const orgStore = localStorage.getItem('organization-storage');
    if (orgStore) {
      const parsed = JSON.parse(orgStore);
      return parsed?.state?.currentOrganization?.id || null;
    }
    return null;
  } catch {
    return null;
  }
}
