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

    // Verify the requesting user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { customer_id, organization_id } = await req.json()
    if (!customer_id || !organization_id) {
      throw new Error('Missing required fields: customer_id, organization_id')
    }

    // Get customer details
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('first_name, last_name, email')
      .eq('id', customer_id)
      .single()

    if (custErr || !customer) throw new Error('Customer not found')
    if (!customer.email) throw new Error('Customer does not have an email address on file')

    // Get organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .single()

    const orgName = org?.name || 'A business'

    // Generate token with 7-day expiry
    const reoptToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    // Get or create consent record
    const { data: existing } = await supabase
      .from('sms_consent')
      .select('id, status')
      .eq('customer_id', customer_id)
      .eq('organization_id', organization_id)
      .maybeSingle()

    if (!existing) {
      throw new Error('No opt-out record found for this customer')
    }

    if (existing.status === 'opted_in') {
      throw new Error('Customer is already opted in to SMS')
    }

    // Update consent record with re-opt token
    await supabase
      .from('sms_consent')
      .update({
        status: 'pending_reopt',
        reopt_token: reoptToken,
        reopt_token_expires_at: expiresAt,
        reopt_requested_at: now,
        updated_at: now,
      })
      .eq('id', existing.id)

    // Create audit log
    await supabase.from('sms_consent_audit_log').insert({
      sms_consent_id: existing.id,
      action: 'reopt_requested',
      performed_by: user.id,
      metadata: { requested_by_email: user.email },
    })

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) throw new Error('RESEND_API_KEY not configured')

    const crmUrl = 'https://crm.easyaicrm.com'
    const reoptLink = `${crmUrl}/sms-reopt-in/${reoptToken}`
    const customerName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Valued Customer'

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CxTrack <noreply@easyaicrm.com>',
        to: [customer.email],
        subject: `${orgName} would like to send you SMS messages`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #111827; font-size: 20px; margin-bottom: 16px;">SMS Permission Request</h2>
            <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">Hi ${customerName},</p>
            <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">
              <strong>${orgName}</strong> would like to send you SMS messages. You previously opted out of SMS communications from them.
            </p>
            <p style="color: #4B5563; font-size: 14px; line-height: 1.6;">
              If you would like to receive SMS messages from them again, please click the button below:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${reoptLink}" style="background-color: #16A34A; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                Yes, I Agree to Receive SMS
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6;">
              If you do not wish to receive SMS messages, no action is needed. This link expires in 7 days.
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
            <p style="color: #9CA3AF; font-size: 11px;">
              Powered by CxTrack | Ontario, Canada<br/>
              You received this email because ${orgName} requested to re-enable SMS for your account.
            </p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const errData = await emailRes.json()
      console.error('Resend error:', errData)
      throw new Error('Failed to send re-opt-in email')
    }

    // Notify admin
    await supabase.from('admin_notifications').insert({
      type: 'sms_reopt_request',
      title: 'Re-Opt-In Requested',
      message: `${user.email} requested SMS re-opt-in for ${customerName} (${customer.email})`,
      metadata: { customer_id, organization_id, requested_by: user.id },
      is_read: false,
    })

    return new Response(
      JSON.stringify({ success: true, email_sent_to: customer.email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-reopt-email error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
