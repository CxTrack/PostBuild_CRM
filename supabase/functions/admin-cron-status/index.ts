import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getCorsHeaders, corsPreflightResponse } from '../_shared/cors.ts'

/**
 * Admin Cron Status
 *
 * Returns:
 * 1. All pg_cron jobs (schedule, active status, last run)
 * 2. Recent run history per job (success/fail, duration)
 *
 * Auth: Admin JWT required.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(req)
  }

  try {
    // Authenticate + verify admin
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

    // Fetch cron jobs and recent run details via RPC
    const [jobsResult, runDetailsResult] = await Promise.all([
      supabase.rpc('admin_get_cron_jobs'),
      supabase.rpc('admin_get_cron_run_details', { p_limit: 100 }),
    ])

    return new Response(
      JSON.stringify({
        success: true,
        jobs: jobsResult.data || [],
        jobs_error: jobsResult.error?.message || null,
        run_details: runDetailsResult.data || [],
        run_details_error: runDetailsResult.error?.message || null,
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[admin-cron-status] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
