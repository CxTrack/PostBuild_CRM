import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { token } = await req.json()
    if (!token) throw new Error('Missing token')

    // Look up consent record by token
    const { data: consent, error: lookupErr } = await supabase
      .from('sms_consent')
      .select('id, customer_id, organization_id, status, reopt_token_expires_at, reopt_completed_at')
      .eq('reopt_token', token)
      .maybeSingle()

    if (lookupErr || !consent) {
      return new Response(
        JSON.stringify({ success: false, error: 'This link is no longer valid or has already been used.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already confirmed
    if (consent.reopt_completed_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'This link has already been used.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check expiry
    if (consent.reopt_token_expires_at && new Date(consent.reopt_token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'This re-opt-in link has expired. Please contact the business for a new link.' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date().toISOString()

    // Update consent - mark customer confirmation but keep pending_reopt (admin must approve)
    await supabase
      .from('sms_consent')
      .update({
        reopt_completed_at: now,
        updated_at: now,
      })
      .eq('id', consent.id)

    // Audit log
    await supabase.from('sms_consent_audit_log').insert({
      sms_consent_id: consent.id,
      action: 'reopt_confirmed',
      performed_by: 'customer',
      metadata: { ip: req.headers.get('x-forwarded-for') || 'unknown' },
    })

    // Get customer name for notifications
    const { data: customer } = await supabase
      .from('customers')
      .select('first_name, last_name')
      .eq('id', consent.customer_id)
      .single()

    const customerName = customer
      ? [customer.first_name, customer.last_name].filter(Boolean).join(' ')
      : 'A customer'

    // Notify all org members
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', consent.organization_id)

    if (members && members.length > 0) {
      const notifications = members.map((m: any) => ({
        user_id: m.user_id,
        organization_id: consent.organization_id,
        type: 'sms_reopt_confirmed',
        title: 'Customer Confirmed SMS Re-Opt-In',
        message: `${customerName} has agreed to receive SMS again. Admin approval is pending.`,
        metadata: { customer_id: consent.customer_id, organization_id: consent.organization_id },
        is_read: false,
      }))

      await supabase.from('system_notifications').insert(notifications)
    }

    // Notify admin
    await supabase.from('admin_notifications').insert({
      type: 'sms_reopt_confirmed',
      title: 'Re-Opt-In Confirmed by Customer',
      message: `${customerName} confirmed SMS re-opt-in. Awaiting admin approval.`,
      metadata: { customer_id: consent.customer_id, organization_id: consent.organization_id, consent_id: consent.id },
      is_read: false,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('process-reopt-confirmation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
