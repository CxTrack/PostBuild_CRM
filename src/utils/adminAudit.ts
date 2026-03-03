/**
 * Admin Audit Logger
 *
 * Fire-and-forget utility to log admin actions to admin_audit_log table.
 * Uses direct fetch to avoid AbortController issues.
 */

import { getAuthToken, getSupabaseUrl } from './auth.utils';

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface AdminAuditEntry {
  action: string;
  category: 'security' | 'cron' | 'settings' | 'user_management' | 'system';
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
}

/**
 * Log an admin action. Fire-and-forget -- never blocks the caller.
 */
export function logAdminAction(entry: AdminAuditEntry): void {
  _doLog(entry).catch((e) => console.error('[adminAudit] log failed:', e));
}

async function _doLog(entry: AdminAuditEntry): Promise<void> {
  const token = await getAuthToken();
  const url = getSupabaseUrl();
  if (!token || !url) return;

  // Get current user ID from the JWT payload
  const userId = _extractUserIdFromJwt(token);
  if (!userId) return;

  await fetch(`${url}/rest/v1/admin_audit_log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      admin_user_id: userId,
      action: entry.action,
      category: entry.category,
      target_type: entry.target_type || null,
      target_id: entry.target_id || null,
      details: entry.details || {},
    }),
  });
}

/**
 * Extract user ID from a JWT token (base64-decode the payload).
 */
function _extractUserIdFromJwt(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded.sub || null;
  } catch {
    return null;
  }
}
