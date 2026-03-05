import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Shared API usage logger for all edge functions.
 * Fire-and-forget: never blocks the main flow, silently catches errors.
 *
 * Usage:
 *   const start = Date.now();
 *   const res = await fetch(url, opts);
 *   logApiCall({
 *     serviceName: 'openrouter', endpoint: '/v1/chat/completions', method: 'POST',
 *     statusCode: res.status, responseTimeMs: Date.now() - start,
 *     organizationId, userId,
 *     errorMessage: res.ok ? null : await res.clone().text(),
 *   });
 */
export interface ApiLogParams {
  serviceName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  tokensUsed?: number;
  costCents?: number;
  organizationId?: string | null;
  userId?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function logApiCall(params: ApiLogParams): void {
  // Fire-and-forget — intentionally no await at call sites
  _doLog(params).catch((e) => console.error("[api-logger] log failed:", e));
}

async function _doLog(params: ApiLogParams): Promise<void> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return;

  const admin = createClient(url, key);
  await admin.from("api_usage_log").insert({
    service_name: params.serviceName,
    endpoint: params.endpoint,
    method: params.method,
    status_code: params.statusCode,
    response_time_ms: params.responseTimeMs,
    tokens_used: params.tokensUsed ?? null,
    cost_cents: params.costCents ?? null,
    organization_id: params.organizationId ?? null,
    user_id: params.userId ?? null,
    error_message: params.errorMessage ?? null,
    metadata: params.metadata ?? null,
  });
}
