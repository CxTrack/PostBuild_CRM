import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface SMSRequest {
    to: string;
    body: string;
    organizationId: string;
    customerId?: string;
    documentType?: 'quote' | 'invoice';
    documentId?: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders,
        })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Verify authorization
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Parse request body
        const { to, body, organizationId, customerId, documentType, documentId }: SMSRequest = await req.json()

        if (!to || !body || !organizationId) {
            throw new Error('Missing required fields: to, body, organizationId')
        }

        // --- SMS CONSENT CHECK ---
        if (customerId) {
            const { data: consent } = await supabaseClient
                .from('sms_consent')
                .select('id, status')
                .eq('customer_id', customerId)
                .eq('organization_id', organizationId)
                .maybeSingle()

            if (consent && (consent.status === 'opted_out' || consent.status === 'pending_reopt')) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: 'This customer has opted out of SMS messages. You cannot send SMS to them.',
                        opted_out: true,
                    }),
                    {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    }
                )
            }

            // If no consent record exists, create initial consent (opted_in)
            if (!consent) {
                const { data: newConsent } = await supabaseClient
                    .from('sms_consent')
                    .insert({
                        customer_id: customerId,
                        organization_id: organizationId,
                        status: 'opted_in',
                        consent_given_at: new Date().toISOString(),
                    })
                    .select('id')
                    .single()

                if (newConsent) {
                    await supabaseClient.from('sms_consent_audit_log').insert({
                        sms_consent_id: newConsent.id,
                        action: 'initial_consent',
                        performed_by: user.id,
                        metadata: { triggered_by: 'first_sms_send' },
                    })
                }
            }
        }

        // Fetch Twilio credentials from sms_settings
        const { data: settings, error: settingsError } = await supabaseClient
            .from('sms_settings')
            .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, is_configured')
            .eq('organization_id', organizationId)
            .maybeSingle()

        if (settingsError) {
            throw new Error(`Failed to fetch SMS settings: ${settingsError.message}`)
        }

        if (!settings || !settings.is_configured) {
            throw new Error('Twilio is not configured. Please add your Twilio credentials in Settings.')
        }

        const { twilio_account_sid, twilio_auth_token, twilio_phone_number } = settings

        if (!twilio_account_sid || !twilio_auth_token || !twilio_phone_number) {
            throw new Error('Incomplete Twilio configuration. Please verify your credentials.')
        }

        // Format phone number (ensure E.164 format)
        let formattedTo = to.replace(/\D/g, '')
        if (formattedTo.length === 10) {
            formattedTo = `+1${formattedTo}`
        } else if (!formattedTo.startsWith('+')) {
            formattedTo = `+${formattedTo}`
        }

        // Append opt-out message to every SMS
        const optOutSuffix = '\n\nReply STOP to opt out of SMS messages.'
        const fullBody = body.includes('STOP') ? body : body + optOutSuffix

        // Call Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`
        const twilioAuth = btoa(`${twilio_account_sid}:${twilio_auth_token}`)

        const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${twilioAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                To: formattedTo,
                From: twilio_phone_number,
                Body: fullBody,
            }),
        })

        const twilioData = await twilioResponse.json()

        if (!twilioResponse.ok) {
            console.error('Twilio API Error:', twilioData)
            throw new Error(twilioData.message || 'Failed to send SMS via Twilio')
        }

        // Log the SMS in the database
        const logEntry = {
            organization_id: organizationId,
            document_type: documentType || null,
            document_id: documentId || null,
            recipient_phone: formattedTo,
            message_body: fullBody,
            message_sid: twilioData.sid,
            status: twilioData.status || 'queued',
            sent_at: new Date().toISOString(),
        }

        await supabaseClient.from('sms_log').insert(logEntry)

        return new Response(
            JSON.stringify({
                success: true,
                messageSid: twilioData.sid,
                status: twilioData.status,
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            }
        )
    } catch (error) {
        console.error('SMS Edge Function Error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            }
        )
    }
})
