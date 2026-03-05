/**
 * send-user-email
 * Sends an email on behalf of a user via their configured provider.
 * Provider resolution order:
 *   1. SMTP (user_email_smtp_settings)
 *   2. Google OAuth (email_oauth_connections, provider=google)
 *   3. Microsoft OAuth (email_oauth_connections, provider=microsoft)
 *   4. Returns { error: "no_email_connected" }
 *
 * POST body: {
 *   to_email, subject, body_text, body_html?,
 *   customer_id?, organization_id, template_key?,
 *   in_reply_to?, references?, conversation_id?
 * }
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

/** Fire-and-forget API usage logger (inlined to avoid _shared import issues on deploy). */
function logApiCall(supabase: ReturnType<typeof createClient>, params: Record<string, unknown>): void {
  supabase.from('api_usage_log').insert({
    service_name: params.serviceName,
    endpoint: params.endpoint,
    method: params.method,
    status_code: params.statusCode,
    response_time_ms: params.responseTimeMs,
    organization_id: params.organizationId ?? null,
    user_id: params.userId ?? null,
    error_message: params.errorMessage ?? null,
    metadata: params.metadata ?? null,
  }).then(() => {}).catch((e: Error) => console.error('[api-logger]', e.message))
}

// ─── SMTP sender ───────────────────────────────────────────────────────────────

interface SmtpResult {
  success: boolean
  messageId?: string
  error?: string
  provider: string
}

async function sendViaSMTP(
  supabase: ReturnType<typeof createClient>,
  settings: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<SmtpResult> {
  // Read password from Vault
  const { data: password, error: vaultErr } = await supabase.rpc('vault_read_secret', {
    p_id: settings.smtp_password_vault_id,
  })
  if (vaultErr || !password) {
    return { success: false, error: 'Failed to retrieve SMTP credentials', provider: 'smtp' }
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtp_host as string,
    port: settings.smtp_port as number,
    secure: settings.smtp_secure as boolean,
    auth: {
      user: settings.smtp_username as string,
      pass: password as string,
    },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  })

  const senderName = settings.sender_name as string | null
  const senderEmail = settings.sender_email as string
  const fromAddress = senderName ? `"${senderName}" <${senderEmail}>` : senderEmail

  const mailOptions: Record<string, unknown> = {
    from: fromAddress,
    to: payload.to_email,
    subject: payload.subject,
    text: payload.body_text,
  }

  if (payload.body_html) {
    mailOptions.html = payload.body_html
  }

  // Thread headers for replies
  if (payload.in_reply_to) {
    mailOptions.inReplyTo = payload.in_reply_to
    mailOptions.references = payload.references || payload.in_reply_to
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    transporter.close()

    // Update last_used_at
    await supabase
      .from('user_email_smtp_settings')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', settings.id)

    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp',
    }
  } catch (err: unknown) {
    transporter.close()
    const msg = err instanceof Error ? err.message : String(err)
    console.error('SMTP send error:', msg)
    return { success: false, error: `SMTP send failed: ${msg}`, provider: 'smtp' }
  }
}

// ─── Google OAuth sender (Gmail API) ───────────────────────────────────────────

async function sendViaGoogle(
  supabase: ReturnType<typeof createClient>,
  connection: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<SmtpResult> {
  // Read access token from Vault
  const { data: accessToken, error: vaultErr } = await supabase.rpc('vault_read_secret', {
    p_id: connection.access_token_vault_id,
  })
  if (vaultErr || !accessToken) {
    return { success: false, error: 'Gmail token not found', provider: 'google' }
  }

  // Check if token is expired and try refresh
  const expiresAt = new Date(connection.access_token_expires_at as string)
  let token = accessToken as string

  if (expiresAt < new Date()) {
    const refreshed = await refreshGoogleToken(supabase, connection)
    if (!refreshed.success) {
      return { success: false, error: refreshed.error || 'Token refresh failed', provider: 'google' }
    }
    token = refreshed.token!
  }

  // Build RFC 2822 message
  const senderEmail = connection.email_address as string
  const displayName = connection.display_name as string | null
  const from = displayName ? `"${displayName}" <${senderEmail}>` : senderEmail

  const headers = [
    `From: ${from}`,
    `To: ${payload.to_email}`,
    `Subject: ${payload.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
  ]

  if (payload.in_reply_to) {
    headers.push(`In-Reply-To: ${payload.in_reply_to}`)
    headers.push(`References: ${payload.references || payload.in_reply_to}`)
  }

  const rawMessage = headers.join('\r\n') + '\r\n\r\n' + (payload.body_html || payload.body_text)
  const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const start = Date.now()
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  })

  const elapsed = Date.now() - start
  const data = await response.json()

  if (!response.ok) {
    console.error('Gmail API error:', data)
    return { success: false, error: `Gmail API error: ${data.error?.message || response.statusText}`, provider: 'google' }
  }

  // Update last_used_at
  await supabase
    .from('email_oauth_connections')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', connection.id)

  return { success: true, messageId: data.id, provider: 'google' }
}

async function refreshGoogleToken(
  supabase: ReturnType<typeof createClient>,
  connection: Record<string, unknown>,
): Promise<{ success: boolean; token?: string; error?: string }> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    return { success: false, error: 'Google OAuth not configured' }
  }

  const { data: refreshToken } = await supabase.rpc('vault_read_secret', {
    p_id: connection.refresh_token_vault_id,
  })
  if (!refreshToken) return { success: false, error: 'Refresh token not found' }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken as string,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    // Mark connection as expired
    await supabase
      .from('email_oauth_connections')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', connection.id)
    return { success: false, error: 'Token refresh failed' }
  }

  const data = await response.json()
  const newAccessToken = data.access_token as string
  const expiresIn = (data.expires_in as number) || 3600

  // Store the new access token in Vault
  await supabase.rpc('vault_update_secret', {
    p_id: connection.access_token_vault_id,
    p_secret: newAccessToken,
  })

  // Update expiry
  const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString()
  await supabase
    .from('email_oauth_connections')
    .update({
      access_token_expires_at: newExpiry,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)

  return { success: true, token: newAccessToken }
}

// ─── Microsoft OAuth sender (Graph API) ────────────────────────────────────────

async function sendViaMicrosoft(
  supabase: ReturnType<typeof createClient>,
  connection: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<SmtpResult> {
  const { data: accessToken, error: vaultErr } = await supabase.rpc('vault_read_secret', {
    p_id: connection.access_token_vault_id,
  })
  if (vaultErr || !accessToken) {
    return { success: false, error: 'Outlook token not found', provider: 'microsoft' }
  }

  const expiresAt = new Date(connection.access_token_expires_at as string)
  let token = accessToken as string

  if (expiresAt < new Date()) {
    const refreshed = await refreshMicrosoftToken(supabase, connection)
    if (!refreshed.success) {
      return { success: false, error: refreshed.error || 'Token refresh failed', provider: 'microsoft' }
    }
    token = refreshed.token!
  }

  const emailBody: Record<string, unknown> = {
    message: {
      subject: payload.subject,
      body: {
        contentType: payload.body_html ? 'HTML' : 'Text',
        content: payload.body_html || payload.body_text,
      },
      toRecipients: [
        { emailAddress: { address: payload.to_email } },
      ],
    },
    saveToSentItems: true,
  }

  // Reply threading
  if (payload.in_reply_to) {
    (emailBody.message as Record<string, unknown>).internetMessageHeaders = [
      { name: 'In-Reply-To', value: payload.in_reply_to },
      { name: 'References', value: payload.references || payload.in_reply_to },
    ]
  }

  const start = Date.now()
  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailBody),
  })

  const elapsed = Date.now() - start

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    console.error('Graph API error:', errData)
    return { success: false, error: `Outlook send failed: ${errData.error?.message || response.statusText}`, provider: 'microsoft' }
  }

  // Update last_used_at
  await supabase
    .from('email_oauth_connections')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', connection.id)

  return { success: true, messageId: `graph-${Date.now()}`, provider: 'microsoft' }
}

async function refreshMicrosoftToken(
  supabase: ReturnType<typeof createClient>,
  connection: Record<string, unknown>,
): Promise<{ success: boolean; token?: string; error?: string }> {
  const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    return { success: false, error: 'Microsoft OAuth not configured' }
  }

  const { data: refreshToken } = await supabase.rpc('vault_read_secret', {
    p_id: connection.refresh_token_vault_id,
  })
  if (!refreshToken) return { success: false, error: 'Refresh token not found' }

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken as string,
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/Mail.Send offline_access',
    }),
  })

  if (!response.ok) {
    await supabase
      .from('email_oauth_connections')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', connection.id)
    return { success: false, error: 'Token refresh failed' }
  }

  const data = await response.json()
  const newAccessToken = data.access_token as string
  const expiresIn = (data.expires_in as number) || 3600

  await supabase.rpc('vault_update_secret', {
    p_id: connection.access_token_vault_id,
    p_secret: newAccessToken,
  })

  const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString()
  await supabase
    .from('email_oauth_connections')
    .update({
      access_token_expires_at: newExpiry,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)

  // Also update refresh token if a new one was issued
  if (data.refresh_token && connection.refresh_token_vault_id) {
    await supabase.rpc('vault_update_secret', {
      p_id: connection.refresh_token_vault_id,
      p_secret: data.refresh_token,
    })
  }

  return { success: true, token: newAccessToken }
}

// ─── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Authenticate
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const payload = await req.json()
    const { to_email, subject, body_text, organization_id } = payload

    if (!to_email?.trim()) throw new Error('Missing to_email')
    if (!subject?.trim()) throw new Error('Missing subject')
    if (!body_text?.trim()) throw new Error('Missing body_text')
    if (!organization_id) throw new Error('Missing organization_id')

    // Verify org membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()

    if (!membership) throw new Error('Not a member of this organization')

    // --- Resolve email provider ---
    // 1. Try SMTP first
    const { data: smtpSettings } = await supabase
      .from('user_email_smtp_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .maybeSingle()

    // 2. Try OAuth connections
    const { data: oauthConnections } = await supabase
      .from('email_oauth_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .in('status', ['active', 'expired'])
      .order('created_at', { ascending: false })

    const googleConn = oauthConnections?.find((c: Record<string, unknown>) => c.provider === 'google')
    const microsoftConn = oauthConnections?.find((c: Record<string, unknown>) => c.provider === 'microsoft')

    let result: SmtpResult | null = null
    let senderEmail: string | null = null

    // Try providers in order: SMTP -> Google -> Microsoft
    if (smtpSettings?.smtp_password_vault_id) {
      senderEmail = smtpSettings.sender_email as string
      result = await sendViaSMTP(supabase, smtpSettings, payload)
    }

    if ((!result || !result.success) && googleConn?.access_token_vault_id) {
      senderEmail = googleConn.email_address as string
      result = await sendViaGoogle(supabase, googleConn, payload)
    }

    if ((!result || !result.success) && microsoftConn?.access_token_vault_id) {
      senderEmail = microsoftConn.email_address as string
      result = await sendViaMicrosoft(supabase, microsoftConn, payload)
    }

    // No provider available
    if (!result) {
      return new Response(
        JSON.stringify({ error: 'no_email_connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // All providers failed
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error || 'Email sending failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // --- Log to email_log ---
    const now = new Date().toISOString()
    await supabase.from('email_log').insert({
      organization_id,
      customer_id: payload.customer_id || null,
      user_id: user.id,
      direction: 'outbound',
      sender_email: senderEmail,
      recipient_email: to_email.trim(),
      subject: subject.trim(),
      body_text: body_text?.trim() || null,
      body_html: payload.body_html || null,
      status: 'sent',
      provider: result.provider,
      message_id: result.messageId || null,
      conversation_id: payload.conversation_id || null,
      in_reply_to: payload.in_reply_to || null,
      template_key: payload.template_key || null,
      sent_at: now,
    })

    // Log API usage
    logApiCall(supabase, {
      serviceName: `email_${result.provider}`,
      endpoint: '/send',
      method: 'POST',
      statusCode: 200,
      responseTimeMs: 0,
      organizationId: organization_id,
      userId: user.id,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message_id: result.messageId,
        provider: result.provider,
        sender_email: senderEmail,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-user-email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
