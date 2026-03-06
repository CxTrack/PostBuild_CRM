/**
 * delete-provider-email
 * Moves emails to trash in the user's connected email provider (Gmail / Outlook).
 * Fire-and-forget from the frontend -- failures are logged but do not block UI.
 *
 * POST body: { emails: [{ message_id: string, provider: 'google' | 'microsoft' }] }
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getCorsHeaders, corsPreflightResponse } from '../_shared/cors.ts'

// ── Token helpers (inlined -- MCP deploy can't resolve _shared imports) ──────

async function getValidToken(
  supabase: ReturnType<typeof createClient>,
  connection: Record<string, unknown>,
): Promise<{ token: string | null; error?: string }> {
  const { data: accessToken, error: vaultErr } = await supabase.rpc('vault_read_secret', {
    p_id: connection.access_token_vault_id,
  })
  if (vaultErr || !accessToken) {
    return { token: null, error: `Token not found for ${connection.provider}` }
  }

  const expiresAt = new Date(connection.access_token_expires_at as string)
  if (expiresAt > new Date()) {
    return { token: accessToken as string }
  }

  // Token expired -- refresh
  if (connection.provider === 'google') {
    return refreshGoogleToken(supabase, connection)
  }
  return refreshMicrosoftToken(supabase, connection)
}

async function refreshGoogleToken(
  supabase: ReturnType<typeof createClient>,
  connection: Record<string, unknown>,
): Promise<{ token: string | null; error?: string }> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) return { token: null, error: 'Google OAuth not configured' }

  const { data: refreshToken } = await supabase.rpc('vault_read_secret', {
    p_id: connection.refresh_token_vault_id,
  })
  if (!refreshToken) return { token: null, error: 'Refresh token not found' }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken as string,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    await supabase.from('email_oauth_connections')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', connection.id)
    return { token: null, error: 'Google token refresh failed' }
  }

  const data = await res.json()
  const newToken = data.access_token as string
  const expiresIn = (data.expires_in as number) || 3600

  await supabase.rpc('vault_update_secret', { p_id: connection.access_token_vault_id, p_secret: newToken })
  await supabase.from('email_oauth_connections').update({
    access_token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    status: 'active',
    updated_at: new Date().toISOString(),
  }).eq('id', connection.id)

  return { token: newToken }
}

async function refreshMicrosoftToken(
  supabase: ReturnType<typeof createClient>,
  connection: Record<string, unknown>,
): Promise<{ token: string | null; error?: string }> {
  const clientId = Deno.env.get('MICROSOFT_CLIENT_ID')
  const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')
  if (!clientId || !clientSecret) return { token: null, error: 'Microsoft OAuth not configured' }

  const { data: refreshToken } = await supabase.rpc('vault_read_secret', {
    p_id: connection.refresh_token_vault_id,
  })
  if (!refreshToken) return { token: null, error: 'Refresh token not found' }

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken as string,
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/Mail.ReadWrite offline_access',
    }),
  })

  if (!res.ok) {
    await supabase.from('email_oauth_connections')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', connection.id)
    return { token: null, error: 'Microsoft token refresh failed' }
  }

  const data = await res.json()
  const newToken = data.access_token as string
  const expiresIn = (data.expires_in as number) || 3600

  await supabase.rpc('vault_update_secret', { p_id: connection.access_token_vault_id, p_secret: newToken })
  await supabase.from('email_oauth_connections').update({
    access_token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    status: 'active',
    updated_at: new Date().toISOString(),
  }).eq('id', connection.id)

  if (data.refresh_token && connection.refresh_token_vault_id) {
    await supabase.rpc('vault_update_secret', { p_id: connection.refresh_token_vault_id, p_secret: data.refresh_token })
  }

  return { token: newToken }
}

// ── Provider-specific trash operations ───────────────────────────────────────

async function trashGmail(token: string, messageId: string): Promise<{ trashed: boolean; error?: string }> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { trashed: false, error: err.error?.message || `Gmail trash failed (${res.status})` }
  }
  return { trashed: true }
}

async function trashOutlook(token: string, messageId: string): Promise<{ trashed: boolean; error?: string }> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}/move`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ destinationId: 'deleteditems' }),
    },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { trashed: false, error: err.error?.message || `Outlook move-to-trash failed (${res.status})` }
  }
  return { trashed: true }
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(req)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Authenticate
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { emails } = await req.json() as {
      emails: { message_id: string; provider: string }[]
    }

    if (!emails?.length) {
      return new Response(JSON.stringify({ success: true, summary: { total: 0, trashed: 0, failed: 0 }, results: [] }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // Resolve OAuth connections (one query, reuse for all emails)
    const { data: oauthConnections } = await supabase
      .from('email_oauth_connections')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'expired'])
      .order('created_at', { ascending: false })

    const googleConn = oauthConnections?.find((c: Record<string, unknown>) => c.provider === 'google')
    const microsoftConn = oauthConnections?.find((c: Record<string, unknown>) => c.provider === 'microsoft')

    // Cache resolved tokens to avoid redundant refreshes
    const tokenCache: Record<string, string | null> = {}

    const results = []
    for (const email of emails) {
      const { message_id, provider } = email
      const conn = provider === 'google' ? googleConn : provider === 'microsoft' ? microsoftConn : null

      if (!conn) {
        results.push({ message_id, provider, trashed: false, error: `No ${provider} connection found` })
        continue
      }

      // Get or refresh token (cached per provider)
      if (!(provider in tokenCache)) {
        const resolved = await getValidToken(supabase, conn)
        tokenCache[provider] = resolved.token
        if (!resolved.token) {
          results.push({ message_id, provider, trashed: false, error: resolved.error })
          continue
        }
      }

      const token = tokenCache[provider]
      if (!token) {
        results.push({ message_id, provider, trashed: false, error: 'Token unavailable' })
        continue
      }

      try {
        const result = provider === 'google'
          ? await trashGmail(token, message_id)
          : await trashOutlook(token, message_id)
        results.push({ message_id, provider, ...result })
      } catch (err) {
        results.push({ message_id, provider, trashed: false, error: String(err) })
      }
    }

    const trashed = results.filter(r => r.trashed).length
    const failed = results.filter(r => !r.trashed).length

    return new Response(JSON.stringify({
      success: true,
      summary: { total: emails.length, trashed, failed },
      results,
    }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[delete-provider-email]', err)
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 400,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
