import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

/**
 * Chat Cleanup - Tier-based message retention.
 *
 * Retention rules:
 * - free:       24 hours (daily reset)
 * - business:   7 days (1 week)
 * - elite:      30 days (1 month)
 * - enterprise: forever (no cleanup)
 *
 * Can be triggered:
 * 1. By cron (pg_cron or external scheduler) as a scheduled job
 * 2. Manually by an admin via POST request
 *
 * JWT required for manual trigger, not for cron.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // Authenticate: require either a valid admin JWT or a cron secret
    const authHeader = req.headers.get('Authorization')
    const cronSecret = req.headers.get('x-cron-secret')
    const expectedCronSecret = Deno.env.get('CRON_SECRET')

    const isCron = expectedCronSecret && cronSecret === expectedCronSecret
    if (!isCron) {
      // Manual trigger: require admin JWT
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user }, error: authErr } = await authClient.auth.getUser()
      if (authErr || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      // Check if user is platform admin
      const { data: adminCheck } = await authClient
        .from('admin_settings')
        .select('is_admin')
        .eq('user_id', user.id)
        .eq('is_admin', true)
        .maybeSingle()
      if (!adminCheck) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Retention periods per tier (in days)
    const retentionDays: Record<string, number | null> = {
      'free': 1,          // 24 hours
      'business': 7,      // 1 week
      'elite': 30,        // 1 month
      'enterprise': null,  // Forever
    }

    // Get all organizations with their subscription tiers
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, subscription_tier')

    if (orgError) {
      throw new Error(`Failed to fetch organizations: ${orgError.message}`)
    }

    let totalDeleted = 0
    const results: Array<{ org: string; tier: string; deleted: number }> = []

    for (const org of orgs || []) {
      const tier = org.subscription_tier || 'free'
      const days = retentionDays[tier]

      // Enterprise - no cleanup
      if (days === null || days === undefined) {
        continue
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      const cutoffISO = cutoffDate.toISOString()

      // Get conversations for this org
      const { data: convos } = await supabase
        .from('conversations')
        .select('id')
        .eq('organization_id', org.id)

      if (!convos || convos.length === 0) continue

      const convoIds = convos.map((c: any) => c.id)

      // Delete old messages in batches
      let orgDeleted = 0
      for (let i = 0; i < convoIds.length; i += 50) {
        const batch = convoIds.slice(i, i + 50)
        const { count, error: delError } = await supabase
          .from('messages')
          .delete({ count: 'exact' })
          .in('conversation_id', batch)
          .lt('created_at', cutoffISO)

        if (delError) {
          console.error(`[chat-cleanup] Delete error for org ${org.name}:`, delError)
        } else {
          orgDeleted += count || 0
        }
      }

      if (orgDeleted > 0) {
        totalDeleted += orgDeleted
        results.push({ org: org.name, tier, deleted: orgDeleted })

        // Log the cleanup
        await supabase.from('chat_retention_log').insert({
          organization_id: org.id,
          messages_deleted: orgDeleted,
          retention_tier: tier,
        })
      }
    }

    console.log(`[chat-cleanup] Complete. Deleted ${totalDeleted} messages across ${results.length} orgs.`)

    return new Response(
      JSON.stringify({
        success: true,
        totalDeleted,
        details: results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[chat-cleanup] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
