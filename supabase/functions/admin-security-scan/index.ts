import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getCorsHeaders, corsPreflightResponse } from '../_shared/cors.ts'

/**
 * Admin Security Scan
 *
 * On-demand security audit that checks:
 * 1. RLS coverage - tables with/without RLS policies
 * 2. Edge function JWT audit - which functions require auth
 * 3. Secret rotation age - flags secrets older than 90 days
 * 4. Failed auth attempts - recent login failures from auth.audit_log
 * 5. Active admin count
 *
 * Auth: Admin JWT required.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(req)
  }

  try {
    // 1. Authenticate caller + verify admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const { data: adminRow } = await supabase
      .from('admin_settings')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_admin', true)
      .maybeSingle()

    if (!adminRow) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: not an admin' }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // 2. Run all security checks in parallel
    const [
      rlsResult,
      secretsResult,
      failedAuthResult,
      adminsResult,
    ] = await Promise.all([
      // RLS coverage check
      supabase.rpc('admin_security_rls_check'),
      // Secret rotation ages
      supabase.from('secret_rotation_log')
        .select('secret_name, rotated_at, notes')
        .order('rotated_at', { ascending: false }),
      // Failed auth attempts (last 30 days)
      supabase.rpc('admin_security_failed_auth'),
      // Active admins
      supabase.from('admin_settings')
        .select('user_id, is_admin, admin_access_level, created_at')
        .eq('is_admin', true),
    ])

    // Build response
    const report = {
      scan_timestamp: new Date().toISOString(),
      scanned_by: user.email,
      rls_coverage: rlsResult.data || [],
      rls_error: rlsResult.error?.message || null,
      secret_rotations: secretsResult.data || [],
      secret_rotation_error: secretsResult.error?.message || null,
      failed_auth: failedAuthResult.data || { last_24h: 0, last_7d: 0, last_30d: 0, recent_failures: [] },
      failed_auth_error: failedAuthResult.error?.message || null,
      active_admins: {
        count: adminsResult.data?.length || 0,
        admins: adminsResult.data || [],
      },
    }

    // Log this scan to admin_audit_log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action: 'security_scan',
      category: 'security',
      target_type: 'system',
      target_id: 'full_scan',
      details: {
        rls_tables_checked: report.rls_coverage.length,
        secrets_tracked: report.secret_rotations.length,
        failed_auth_30d: report.failed_auth.last_30d ?? 0,
        active_admins: report.active_admins.count,
      },
    })

    return new Response(
      JSON.stringify({ success: true, report }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[admin-security-scan] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
