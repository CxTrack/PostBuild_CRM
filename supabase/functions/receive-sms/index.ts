import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

/**
 * Incoming SMS Webhook - called by Twilio when a customer replies via SMS.
 * No JWT required (Twilio calls this directly).
 *
 * Twilio sends form-urlencoded POST with: From, To, Body, MessageSid, etc.
 *
 * Flow:
 * 1. Parse incoming Twilio webhook data
 * 2. Look up which organization owns the "To" phone number
 * 3. Look up customer by "From" phone number
 * 4. Find or create SMS conversation in chat
 * 5. Insert inbound message
 * 6. Return TwiML acknowledgment
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse Twilio form-urlencoded body
    const formData = await req.formData()
    const from = formData.get('From') as string    // Customer phone (e.g., +15551234567)
    const to = formData.get('To') as string        // Our Twilio number
    const body = formData.get('Body') as string    // Message text
    const messageSid = formData.get('MessageSid') as string

    console.log(`[receive-sms] From: ${from}, To: ${to}, Body: ${body?.substring(0, 50)}...`)

    if (!from || !body) {
      console.error('[receive-sms] Missing From or Body')
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'application/xml' } }
      )
    }

    // Handle STOP/opt-out keywords
    const upperBody = body.trim().toUpperCase()
    if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(upperBody)) {
      console.log(`[receive-sms] Opt-out received from ${from}`)
      // Mark consent as opted_out for all orgs with this customer
      const { data: consents } = await supabase
        .from('sms_consent')
        .select('id, customer_id, organization_id')
        .eq('status', 'opted_in')

      if (consents) {
        // Find matching customers by phone
        for (const consent of consents) {
          const { data: customer } = await supabase
            .from('customers')
            .select('phone')
            .eq('id', consent.customer_id)
            .maybeSingle()

          if (customer?.phone) {
            const cleanPhone = customer.phone.replace(/\D/g, '')
            const cleanFrom = from.replace(/\D/g, '')
            if (cleanPhone === cleanFrom || cleanPhone.endsWith(cleanFrom.slice(-10))) {
              await supabase.from('sms_consent').update({
                status: 'opted_out',
                opted_out_at: new Date().toISOString(),
              }).eq('id', consent.id)

              await supabase.from('sms_consent_audit_log').insert({
                sms_consent_id: consent.id,
                action: 'opt_out',
                metadata: { method: 'sms_reply', keyword: upperBody },
              })
            }
          }
        }
      }

      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed. Reply START to re-subscribe.</Message></Response>',
        { headers: { 'Content-Type': 'application/xml' } }
      )
    }

    // 1. Find which organization owns the "To" phone number
    // Check phone_numbers table (provisioned) and sms_settings (manual)
    let orgId: string | null = null
    let orgCreatorId: string | null = null

    const { data: provNumber } = await supabase
      .from('phone_numbers')
      .select('organization_id')
      .eq('phone_number', to)
      .eq('status', 'active')
      .maybeSingle()

    if (provNumber) {
      orgId = provNumber.organization_id
    } else {
      // Check sms_settings for manually configured Twilio numbers
      const { data: smsSettings } = await supabase
        .from('sms_settings')
        .select('organization_id')
        .eq('twilio_phone_number', to)
        .eq('is_configured', true)
        .maybeSingle()

      if (smsSettings) {
        orgId = smsSettings.organization_id
      }
    }

    if (!orgId) {
      console.error(`[receive-sms] No organization found for phone number: ${to}`)
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'application/xml' } }
      )
    }

    // Get org owner to use as conversation creator / sender_id
    const { data: orgOwner } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()

    orgCreatorId = orgOwner?.user_id || null

    if (!orgCreatorId) {
      // Fallback: any org member
      const { data: anyMember } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle()
      orgCreatorId = anyMember?.user_id || null
    }

    if (!orgCreatorId) {
      console.error(`[receive-sms] No members found for org ${orgId}`)
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'application/xml' } }
      )
    }

    // 2. Look up customer by phone number
    const cleanFrom = from.replace(/\D/g, '')
    const { data: customers } = await supabase
      .from('customers')
      .select('id, first_name, last_name, phone')
      .eq('organization_id', orgId)

    let customer: { id: string; first_name: string; last_name: string; phone: string } | null = null
    if (customers) {
      customer = customers.find((c: any) => {
        if (!c.phone) return false
        const cleanCustomerPhone = c.phone.replace(/\D/g, '')
        return cleanCustomerPhone === cleanFrom ||
               cleanCustomerPhone.endsWith(cleanFrom.slice(-10)) ||
               cleanFrom.endsWith(cleanCustomerPhone.slice(-10))
      }) || null
    }

    const customerName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : from

    // 3. Find or create SMS conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', orgId)
      .eq('channel_type', 'sms')
      .eq('customer_phone', from)
      .limit(1)
      .maybeSingle()

    let conversationId: string

    if (existingConv) {
      conversationId = existingConv.id
      // Update timestamp
      await supabase.from('conversations').update({
        updated_at: new Date().toISOString(),
        name: customerName, // Update name in case customer was matched later
      }).eq('id', conversationId)
    } else {
      // Create new SMS conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          organization_id: orgId,
          channel_type: 'sms',
          is_group: false,
          name: customerName,
          customer_id: customer?.id || null,
          customer_phone: from,
          created_by: orgCreatorId,
        })
        .select('id')
        .single()

      if (convError || !newConv) {
        console.error('[receive-sms] Failed to create conversation:', convError)
        return new Response(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { 'Content-Type': 'application/xml' } }
        )
      }

      conversationId = newConv.id

      // Add org owner as participant
      await supabase.from('conversation_participants').insert({
        conversation_id: conversationId,
        user_id: orgCreatorId,
        role: 'member',
      })
    }

    // 4. Insert the inbound message
    // sender_id must be a valid user_profiles ID, so we use the org creator
    // metadata.direction = 'inbound' tells the UI this is from the customer
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: orgCreatorId,
      content: body,
      message_type: 'sms',
      metadata: {
        direction: 'inbound',
        customer_phone: from,
        customer_name: customerName,
        customer_id: customer?.id || null,
        twilio_message_sid: messageSid,
      },
    })

    if (msgError) {
      console.error('[receive-sms] Failed to insert message:', msgError)
    }

    // 5. Log inbound SMS
    await supabase.from('sms_log').insert({
      organization_id: orgId,
      customer_id: customer?.id || null,
      recipient_phone: to,
      message_body: body,
      message_sid: messageSid,
      status: 'received',
      document_type: 'custom',
      sent_at: new Date().toISOString(),
    }).then(() => {}, (err: any) => console.error('[receive-sms] SMS log error:', err))

    console.log(`[receive-sms] Inbound SMS from ${from} routed to conversation ${conversationId}`)

    // Return empty TwiML (acknowledge receipt, no auto-reply)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'application/xml' } }
    )
  } catch (error) {
    console.error('[receive-sms] Error:', error)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'application/xml' } }
    )
  }
})
