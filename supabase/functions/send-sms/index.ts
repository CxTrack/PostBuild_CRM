import { createClient } from 'jsr:@supabase/supabase-js@2'
import { logApiCall } from '../_shared/api-logger.ts'
import { generateSignedOptOutUrl } from '../_shared/hmac.ts'
import { getCorsHeaders, corsPreflightResponse } from '../_shared/cors.ts'

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
        return corsPreflightResponse(req)
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

        // Verify user belongs to this organization (prevent cross-tenant abuse)
        const { data: membership } = await supabaseClient
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('organization_id', organizationId)
            .maybeSingle()

        if (!membership) {
            throw new Error('Unauthorized: you do not belong to this organization')
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
                        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
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

        // Fetch Twilio credentials from Vault via secure RPC
        const { data: creds, error: credsError } = await supabaseClient
            .rpc('get_sms_credentials', { p_organization_id: organizationId })

        if (credsError) {
            throw new Error(`Failed to fetch SMS credentials: ${credsError.message}`)
        }

        if (!creds || creds.error || !creds.is_configured) {
            throw new Error('Twilio is not configured. Please add your Twilio credentials in Settings.')
        }

        const { twilio_account_sid, twilio_auth_token, twilio_phone_number } = creds

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
        let optOutSuffix = '\n\nReply STOP to opt out of SMS messages.'
        const hmacSecret = Deno.env.get('SMS_OPT_OUT_SECRET')
        if (hmacSecret && customerId) {
            const appUrl = Deno.env.get('APP_URL') || 'https://crm.cxtrack.com'
            const signedUrl = await generateSignedOptOutUrl(appUrl, customerId, organizationId, hmacSecret)
            optOutSuffix = `\n\nReply STOP or visit ${signedUrl} to opt out.`
        }
        const fullBody = body.includes('STOP') ? body : body + optOutSuffix

        // Call Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`
        const twilioAuth = btoa(`${twilio_account_sid}:${twilio_auth_token}`)

        const smsStart = Date.now()
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

        logApiCall({
            serviceName: 'twilio', endpoint: `/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`,
            method: 'POST', statusCode: twilioResponse.status, responseTimeMs: Date.now() - smsStart,
            organizationId, userId: user.id,
            errorMessage: twilioResponse.ok ? null : JSON.stringify(twilioData),
        })

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
                    ...getCorsHeaders(req),
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
                    ...getCorsHeaders(req),
                    'Content-Type': 'application/json',
                },
            }
        )
    }
})
