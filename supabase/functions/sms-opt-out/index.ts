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

    const { customer_id, organization_id, method } = await req.json()

    if (!customer_id || !organization_id) {
      throw new Error('Missing required fields: customer_id, organization_id')
    }

    // Check if consent record already exists
    const { data: existing } = await supabase
      .from('sms_consent')
      .select('id, status')
      .eq('customer_id', customer_id)
      .eq('organization_id', organization_id)
      .maybeSingle()

    if (existing?.status === 'opted_out') {
      return new Response(
        JSON.stringify({ success: false, already_opted_out: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date().toISOString()

    if (existing) {
      // Update existing record
      await supabase
        .from('sms_consent')
        .update({
          status: 'opted_out',
          opted_out_at: now,
          opted_out_method: method || 'link',
          reopt_token: null,
          reopt_token_expires_at: null,
          updated_at: now,
        })
        .eq('id', existing.id)

      // Create audit log entry
      await supabase.from('sms_consent_audit_log').insert({
        sms_consent_id: existing.id,
        action: 'opt_out',
        performed_by: 'customer',
        metadata: { method: method || 'link', ip: req.headers.get('x-forwarded-for') || 'unknown' },
      })
    } else {
      // Create new record as opted_out
      const { data: newConsent } = await supabase
        .from('sms_consent')
        .insert({
          customer_id,
          organization_id,
          status: 'opted_out',
          opted_out_at: now,
          opted_out_method: method || 'link',
        })
        .select('id')
        .single()

      if (newConsent) {
        await supabase.from('sms_consent_audit_log').insert({
          sms_consent_id: newConsent.id,
          action: 'opt_out',
          performed_by: 'customer',
          metadata: { method: method || 'link', ip: req.headers.get('x-forwarded-for') || 'unknown' },
        })
      }
    }

    // Get customer info for notification
    const { data: customer } = await supabase
      .from('customers')
      .select('first_name, last_name, organization_id')
      .eq('id', customer_id)
      .single()

    const customerName = customer
      ? [customer.first_name, customer.last_name].filter(Boolean).join(' ')
      : 'A customer'

    // Get all org members to notify them
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organization_id)

    if (members && members.length > 0) {
      const notifications = members.map((m: any) => ({
        user_id: m.user_id,
        organization_id,
        type: 'sms_opt_out',
        title: 'Customer Opted Out of SMS',
        message: `${customerName} has opted out of SMS messages. You can no longer send SMS to this customer.`,
        metadata: { customer_id, organization_id },
        is_read: false,
      }))

      await supabase.from('system_notifications').insert(notifications)
    }

    // Also create admin notification
    await supabase.from('admin_notifications').insert({
      type: 'sms_opt_out',
      title: 'SMS Opt-Out',
      message: `${customerName} opted out of SMS (method: ${method || 'link'})`,
      metadata: { customer_id, organization_id, method: method || 'link' },
      is_read: false,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('sms-opt-out error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
