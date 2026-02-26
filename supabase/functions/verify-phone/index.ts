import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

const CODE_LENGTH = 6
const CODE_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_SECONDS = 60

function generateCode(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(array[0] % 1000000).padStart(CODE_LENGTH, '0')
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

    // Authenticate the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, phone, code } = await req.json()

    if (!action || !phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: action, phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalize phone to E.164
    let normalizedPhone = phone.replace(/\D/g, '')
    if (normalizedPhone.length === 10) {
      normalizedPhone = `+1${normalizedPhone}`
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = `+${normalizedPhone}`
    }
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = `+${normalizedPhone}`
    }

    // ========== SEND ACTION ==========
    if (action === 'send') {
      // Rate limit: check for recent codes sent to this user/phone
      const cooldownTime = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000).toISOString()
      const { data: recentCodes } = await supabase
        .from('phone_verification_codes')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('phone', normalizedPhone)
        .gte('created_at', cooldownTime)
        .order('created_at', { ascending: false })
        .limit(1)

      if (recentCodes && recentCodes.length > 0) {
        const secondsAgo = Math.floor((Date.now() - new Date(recentCodes[0].created_at).getTime()) / 1000)
        const waitSeconds = RESEND_COOLDOWN_SECONDS - secondsAgo
        if (waitSeconds > 0) {
          return new Response(
            JSON.stringify({ success: false, error: `Please wait ${waitSeconds} seconds before requesting a new code.` }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Invalidate any existing codes for this user/phone
      await supabase
        .from('phone_verification_codes')
        .delete()
        .eq('user_id', user.id)
        .eq('phone', normalizedPhone)
        .eq('verified', false)

      // Generate new code
      const newCode = generateCode()
      const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000).toISOString()

      // Store in DB
      const { error: insertError } = await supabase
        .from('phone_verification_codes')
        .insert({
          user_id: user.id,
          phone: normalizedPhone,
          code: newCode,
          expires_at: expiresAt,
          verified: false,
          attempts: 0,
        })

      if (insertError) {
        console.error('Failed to store verification code:', insertError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to generate verification code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Send SMS via Twilio master credentials
      const twilioSid = Deno.env.get('TWILIO_MASTER_ACCOUNT_SID')
      const twilioToken = Deno.env.get('TWILIO_MASTER_AUTH_TOKEN')
      let twilioFrom = Deno.env.get('TWILIO_SYSTEM_PHONE_NUMBER') || ''

      // If no system number configured, grab first active provisioned number
      if (!twilioFrom) {
        const { data: provNumber } = await supabase
          .from('phone_numbers')
          .select('phone_number')
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()

        if (provNumber?.phone_number) {
          twilioFrom = provNumber.phone_number
        }
      }

      if (!twilioSid || !twilioToken || !twilioFrom) {
        console.error('Missing Twilio credentials for verification SMS')
        return new Response(
          JSON.stringify({ success: false, error: 'SMS service not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const smsBody = `Your CxTrack verification code is: ${newCode}\n\nThis code expires in ${CODE_EXPIRY_MINUTES} minutes.`

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
      const twilioAuth = btoa(`${twilioSid}:${twilioToken}`)

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${twilioAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: normalizedPhone,
          From: twilioFrom,
          Body: smsBody,
        }),
      })

      const twilioData = await twilioResponse.json()

      if (!twilioResponse.ok) {
        console.error('Twilio send error:', twilioData)
        // Clean up the code we stored
        await supabase
          .from('phone_verification_codes')
          .delete()
          .eq('user_id', user.id)
          .eq('phone', normalizedPhone)
          .eq('code', newCode)

        return new Response(
          JSON.stringify({ success: false, error: 'Failed to send verification SMS. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[verify-phone] Code sent to ${normalizedPhone} for user ${user.id}, SID: ${twilioData.sid}`)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========== CHECK ACTION ==========
    if (action === 'check') {
      if (!code) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing verification code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find the most recent unexpired, unverified code for this user/phone
      const now = new Date().toISOString()
      const { data: verification, error: lookupError } = await supabase
        .from('phone_verification_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('phone', normalizedPhone)
        .eq('verified', false)
        .gte('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lookupError) {
        console.error('Verification lookup error:', lookupError)
        return new Response(
          JSON.stringify({ success: false, error: 'Verification check failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!verification) {
        return new Response(
          JSON.stringify({ success: false, verified: false, error: 'No active verification code found. Please request a new code.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check max attempts
      if (verification.attempts >= MAX_ATTEMPTS) {
        // Invalidate the code
        await supabase
          .from('phone_verification_codes')
          .delete()
          .eq('id', verification.id)

        return new Response(
          JSON.stringify({ success: false, verified: false, error: 'Too many attempts. Please request a new code.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Increment attempts
      await supabase
        .from('phone_verification_codes')
        .update({ attempts: verification.attempts + 1 })
        .eq('id', verification.id)

      // Check the code
      if (verification.code !== code.trim()) {
        const remaining = MAX_ATTEMPTS - (verification.attempts + 1)
        return new Response(
          JSON.stringify({
            success: false,
            verified: false,
            error: remaining > 0
              ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
              : 'Too many attempts. Please request a new code.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Code matches! Mark as verified
      await supabase
        .from('phone_verification_codes')
        .update({ verified: true })
        .eq('id', verification.id)

      // Update user_profiles.phone_verified
      await supabase
        .from('user_profiles')
        .update({ phone_verified: true })
        .eq('id', user.id)

      console.log(`[verify-phone] Phone ${normalizedPhone} verified for user ${user.id}`)

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[verify-phone] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
