/**
 * sync-inbox-emails
 * Bidirectional email sync: pulls Inbox + Sent Items from Microsoft Graph or Gmail
 * into email_log, with delta/history tracking and customer auto-matching.
 *
 * POST body: { organization_id: string }
 * Returns: { success, synced, deleted, updated, steps[] }
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'

// ── CORS (inlined -- MCP deploy can't resolve _shared imports) ──────────────

const ALLOWED_ORIGINS = [
  'https://crm.cxtrack.com',
  'https://cxtrack.com',
  'https://www.cxtrack.com',
  'https://crm.easyaicrm.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

function getCorsHeaders(reqOrOrigin: Request | '*'): Record<string, string> {
  let allowedOrigin = ''
  if (reqOrOrigin === '*') {
    allowedOrigin = '*'
  } else {
    const origin = reqOrOrigin.headers.get('Origin') || ''
    allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ''
  }
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    ...(allowedOrigin !== '*' ? { 'Vary': 'Origin' } : {}),
  }
}

function corsPreflightResponse(req: Request): Response {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) })
}

// ── Token helpers (inlined from mark-provider-email-read) ───────────────────

type SupabaseAdmin = ReturnType<typeof createClient>
type Connection = Record<string, unknown>

async function getValidToken(
  supabase: SupabaseAdmin,
  connection: Connection,
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

  if (connection.provider === 'google') {
    return refreshGoogleToken(supabase, connection)
  }
  return refreshMicrosoftToken(supabase, connection)
}

async function refreshGoogleToken(
  supabase: SupabaseAdmin,
  connection: Connection,
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
  supabase: SupabaseAdmin,
  connection: Connection,
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

// ── Customer matching ───────────────────────────────────────────────────────

async function matchCustomerByEmail(
  supabase: SupabaseAdmin,
  orgId: string,
  emailAddress: string,
  cache: Map<string, string | null>,
): Promise<string | null> {
  const normalized = emailAddress.toLowerCase().trim()
  if (cache.has(normalized)) return cache.get(normalized)!

  // 1. Check customers.email (case-insensitive)
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('organization_id', orgId)
    .ilike('email', normalized)
    .limit(1)
    .maybeSingle()

  if (customer) {
    cache.set(normalized, customer.id)
    return customer.id
  }

  // 2. Check customer_contacts.email via RPC
  const { data: contactCustomerId } = await supabase
    .rpc('match_customer_by_contact_email', { p_org_id: orgId, p_email: normalized })

  const result = contactCustomerId || null
  cache.set(normalized, result)
  return result
}

function getCounterpartyEmail(
  msg: { senderEmail: string | null; recipientEmail: string | null },
  folder: string,
): string | null {
  if (folder === 'inbox' || folder === 'INBOX') {
    return msg.senderEmail || null
  }
  // sentitems / SENT
  return msg.recipientEmail || null
}

// ── Microsoft Graph sync ────────────────────────────────────────────────────

interface SyncResult {
  synced: number
  deleted: number
  updated: number
  newCursor: string
}

const GRAPH_SELECT_FIELDS = [
  'id', 'subject', 'from', 'toRecipients', 'sentDateTime', 'receivedDateTime',
  'bodyPreview', 'body', 'isRead', 'conversationId', 'internetMessageId', 'flag',
].join(',')

const MAX_PAGES = 15
const INITIAL_SYNC_DAYS = 90

async function syncMicrosoftFolder(
  supabase: SupabaseAdmin,
  token: string,
  userId: string,
  orgId: string,
  folder: string,
  syncState: Record<string, unknown>,
  customerCache: Map<string, string | null>,
): Promise<SyncResult> {
  const folderState = (syncState[folder] as Record<string, unknown>) || {}
  let url: string

  if (folderState.delta_link) {
    url = folderState.delta_link as string
  } else {
    const since = new Date(Date.now() - INITIAL_SYNC_DAYS * 24 * 60 * 60 * 1000).toISOString()
    url = `https://graph.microsoft.com/v1.0/me/mailFolders/${folder}/messages/delta` +
      `?$select=${GRAPH_SELECT_FIELDS}&$top=50&$filter=receivedDateTime ge ${since}` +
      `&$orderby=receivedDateTime desc`
  }

  let synced = 0, deleted = 0, updated = 0
  let newCursor = ''
  let pageCount = 0

  while (url && pageCount < MAX_PAGES) {
    pageCount++
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!res.ok) {
      if (res.status === 410) {
        // Delta link expired -- clear for fresh sync next time
        return { synced, deleted, updated, newCursor: '' }
      }
      const err = await res.json().catch(() => ({}))
      throw new Error(`Graph ${res.status}: ${err.error?.message || res.statusText}`)
    }

    const data = await res.json()
    const messages = data.value || []

    for (const msg of messages) {
      // Handle deletions
      if (msg['@removed']) {
        const { error } = await supabase
          .from('email_log')
          .update({ is_deleted: true })
          .eq('message_id', msg.id)
          .eq('organization_id', orgId)
        if (!error) deleted++
        continue
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from('email_log')
        .select('id, is_read, starred')
        .eq('message_id', msg.id)
        .eq('organization_id', orgId)
        .maybeSingle()

      if (existing) {
        const newIsRead = msg.isRead ?? false
        const newStarred = msg.flag?.flagStatus === 'flagged'
        const updates: Record<string, unknown> = {}
        if (existing.is_read !== newIsRead) updates.is_read = newIsRead
        if (existing.starred !== newStarred) updates.starred = newStarred
        if (Object.keys(updates).length > 0) {
          await supabase.from('email_log').update(updates).eq('id', existing.id)
          updated++
        }
        continue
      }

      // New message -- build row
      const isInbound = folder === 'inbox'
      const senderEmail = msg.from?.emailAddress?.address || null
      const recipientEmail = msg.toRecipients?.[0]?.emailAddress?.address || ''

      const customerId = await matchCustomerByEmail(
        supabase, orgId,
        getCounterpartyEmail({ senderEmail, recipientEmail }, folder) || '',
        customerCache,
      )

      const row = {
        organization_id: orgId,
        user_id: userId,
        customer_id: customerId,
        direction: isInbound ? 'inbound' : 'outbound',
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        subject: msg.subject || '(No subject)',
        body_text: msg.body?.contentType === 'text' ? msg.body.content : null,
        body_html: msg.body?.contentType === 'html' ? msg.body.content : null,
        status: isInbound ? 'received' : 'sent',
        provider: 'microsoft',
        message_id: msg.id,
        internet_message_id: msg.internetMessageId || null,
        conversation_id: msg.conversationId || null,
        is_read: msg.isRead ?? false,
        starred: msg.flag?.flagStatus === 'flagged',
        folder: folder,
        snippet: (msg.bodyPreview || '').slice(0, 200),
        sent_at: msg.sentDateTime || msg.receivedDateTime,
        is_deleted: false,
      }

      const { error: insertError } = await supabase.from('email_log').insert(row)
      // Unique constraint violation = duplicate, silently skip
      if (!insertError) synced++
      else if (!insertError.message?.includes('duplicate') && !insertError.message?.includes('unique')) {
        console.error('[sync] insert error:', insertError.message)
      }
    }

    // Pagination or done
    if (data['@odata.nextLink']) {
      url = data['@odata.nextLink']
    } else if (data['@odata.deltaLink']) {
      newCursor = data['@odata.deltaLink']
      url = ''
    } else {
      url = ''
    }
  }

  return { synced, deleted, updated, newCursor }
}

// ── Gmail sync ──────────────────────────────────────────────────────────────

function extractGmailHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase())
  return header?.value || ''
}

function parseEmailAddress(raw: string): string {
  // "Name <email@example.com>" -> "email@example.com"
  const match = raw.match(/<([^>]+)>/)
  return (match ? match[1] : raw).trim().toLowerCase()
}

async function fetchGmailMessage(
  token: string,
  messageId: string,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { 'Authorization': `Bearer ${token}` } },
  )
  if (!res.ok) return null
  return res.json()
}

async function syncGmailLabel(
  supabase: SupabaseAdmin,
  token: string,
  userId: string,
  orgId: string,
  label: string,
  syncState: Record<string, unknown>,
  customerCache: Map<string, string | null>,
): Promise<SyncResult> {
  const labelState = (syncState[label] as Record<string, unknown>) || {}
  let synced = 0, deleted = 0, updated = 0
  let newCursor = ''

  if (labelState.history_id) {
    // Incremental sync via History API
    const historyResult = await syncGmailHistory(
      supabase, token, userId, orgId, label,
      labelState.history_id as string, customerCache,
    )
    synced = historyResult.synced
    deleted = historyResult.deleted
    updated = historyResult.updated
    newCursor = historyResult.newCursor
  } else {
    // Initial sync -- list messages with label
    const since = Math.floor((Date.now() - INITIAL_SYNC_DAYS * 24 * 60 * 60 * 1000) / 1000)
    let pageToken = ''
    let pageCount = 0
    let latestHistoryId = ''

    while (pageCount < MAX_PAGES) {
      pageCount++
      let listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages` +
        `?labelIds=${label}&maxResults=50&q=after:${since}`
      if (pageToken) listUrl += `&pageToken=${pageToken}`

      const listRes = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!listRes.ok) {
        const err = await listRes.json().catch(() => ({}))
        throw new Error(`Gmail list ${listRes.status}: ${err.error?.message || listRes.statusText}`)
      }

      const listData = await listRes.json()
      const messageIds: string[] = (listData.messages || []).map((m: { id: string }) => m.id)

      for (const msgId of messageIds) {
        // Check if already exists
        const { data: existing } = await supabase
          .from('email_log')
          .select('id')
          .eq('message_id', msgId)
          .eq('organization_id', orgId)
          .maybeSingle()

        if (existing) continue

        // Fetch full message
        const msg = await fetchGmailMessage(token, msgId) as Record<string, unknown> | null
        if (!msg) continue

        // Capture highest historyId for delta tracking
        const msgHistoryId = String(msg.historyId || '')
        if (!latestHistoryId || BigInt(msgHistoryId) > BigInt(latestHistoryId || '0')) {
          latestHistoryId = msgHistoryId
        }

        const headers = (msg.payload as Record<string, unknown>)?.headers as Array<{ name: string; value: string }> || []
        const labels = msg.labelIds as string[] || []
        const isInbound = label === 'INBOX'
        const senderRaw = extractGmailHeader(headers, 'From')
        const recipientRaw = extractGmailHeader(headers, 'To')
        const senderEmail = parseEmailAddress(senderRaw)
        const recipientEmail = parseEmailAddress(recipientRaw)

        const customerId = await matchCustomerByEmail(
          supabase, orgId,
          getCounterpartyEmail({ senderEmail, recipientEmail }, label) || '',
          customerCache,
        )

        // Extract body text from payload
        const bodyText = extractGmailBodyText(msg.payload as Record<string, unknown>)

        const row = {
          organization_id: orgId,
          user_id: userId,
          customer_id: customerId,
          direction: isInbound ? 'inbound' : 'outbound',
          sender_email: senderEmail,
          recipient_email: recipientEmail,
          subject: extractGmailHeader(headers, 'Subject') || '(No subject)',
          body_text: bodyText,
          body_html: null as string | null,
          status: isInbound ? 'received' : 'sent',
          provider: 'google',
          message_id: msgId,
          internet_message_id: extractGmailHeader(headers, 'Message-ID') || null,
          conversation_id: (msg.threadId as string) || null,
          is_read: !labels.includes('UNREAD'),
          starred: labels.includes('STARRED'),
          folder: label.toLowerCase(),
          snippet: ((msg.snippet as string) || '').slice(0, 200),
          sent_at: extractGmailHeader(headers, 'Date')
            ? new Date(extractGmailHeader(headers, 'Date')).toISOString()
            : new Date(Number(msg.internalDate) || Date.now()).toISOString(),
          is_deleted: false,
        }

        const { error: insertError } = await supabase.from('email_log').insert(row)
        if (!insertError) synced++
      }

      if (listData.nextPageToken) {
        pageToken = listData.nextPageToken
      } else {
        break
      }
    }

    newCursor = latestHistoryId
  }

  return { synced, deleted, updated, newCursor }
}

async function syncGmailHistory(
  supabase: SupabaseAdmin,
  token: string,
  userId: string,
  orgId: string,
  label: string,
  startHistoryId: string,
  customerCache: Map<string, string | null>,
): Promise<SyncResult> {
  let synced = 0, deleted = 0, updated = 0
  let pageToken = ''
  let latestHistoryId = startHistoryId
  let pageCount = 0

  while (pageCount < MAX_PAGES) {
    pageCount++
    let url = `https://gmail.googleapis.com/gmail/v1/users/me/history` +
      `?startHistoryId=${startHistoryId}&historyTypes=messageAdded&historyTypes=messageDeleted&historyTypes=labelRemoved&labelId=${label}`
    if (pageToken) url += `&pageToken=${pageToken}`

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!res.ok) {
      if (res.status === 404) {
        // historyId expired -- clear for fresh sync
        return { synced, deleted, updated, newCursor: '' }
      }
      const err = await res.json().catch(() => ({}))
      throw new Error(`Gmail history ${res.status}: ${err.error?.message || res.statusText}`)
    }

    const data = await res.json()
    latestHistoryId = String(data.historyId || latestHistoryId)

    for (const entry of (data.history || [])) {
      // Messages added to this label
      for (const added of (entry.messagesAdded || [])) {
        const msgMeta = added.message as Record<string, unknown>
        const msgId = msgMeta.id as string
        const msgLabels = msgMeta.labelIds as string[] || []

        // Only process if this message has the label we care about
        if (!msgLabels.includes(label)) continue

        // Check if already exists
        const { data: existing } = await supabase
          .from('email_log')
          .select('id')
          .eq('message_id', msgId)
          .eq('organization_id', orgId)
          .maybeSingle()

        if (existing) continue

        // Fetch full message
        const msg = await fetchGmailMessage(token, msgId)
        if (!msg) continue

        const headers = (msg.payload as Record<string, unknown>)?.headers as Array<{ name: string; value: string }> || []
        const labels = msg.labelIds as string[] || []
        const isInbound = label === 'INBOX'
        const senderRaw = extractGmailHeader(headers, 'From')
        const recipientRaw = extractGmailHeader(headers, 'To')
        const senderEmail = parseEmailAddress(senderRaw)
        const recipientEmail = parseEmailAddress(recipientRaw)

        const customerId = await matchCustomerByEmail(
          supabase, orgId,
          getCounterpartyEmail({ senderEmail, recipientEmail }, label) || '',
          customerCache,
        )

        const bodyText = extractGmailBodyText(msg.payload as Record<string, unknown>)

        const row = {
          organization_id: orgId,
          user_id: userId,
          customer_id: customerId,
          direction: isInbound ? 'inbound' : 'outbound',
          sender_email: senderEmail,
          recipient_email: recipientEmail,
          subject: extractGmailHeader(headers, 'Subject') || '(No subject)',
          body_text: bodyText,
          body_html: null as string | null,
          status: isInbound ? 'received' : 'sent',
          provider: 'google',
          message_id: msgId,
          internet_message_id: extractGmailHeader(headers, 'Message-ID') || null,
          conversation_id: (msg.threadId as string) || null,
          is_read: !labels.includes('UNREAD'),
          starred: labels.includes('STARRED'),
          folder: label.toLowerCase(),
          snippet: ((msg.snippet as string) || '').slice(0, 200),
          sent_at: extractGmailHeader(headers, 'Date')
            ? new Date(extractGmailHeader(headers, 'Date')).toISOString()
            : new Date(Number(msg.internalDate) || Date.now()).toISOString(),
          is_deleted: false,
        }

        const { error: insertError } = await supabase.from('email_log').insert(row)
        if (!insertError) synced++
      }

      // Messages deleted
      for (const removed of (entry.messagesDeleted || [])) {
        const msgId = (removed.message as Record<string, unknown>).id as string
        const { error } = await supabase
          .from('email_log')
          .update({ is_deleted: true })
          .eq('message_id', msgId)
          .eq('organization_id', orgId)
        if (!error) deleted++
      }

      // Labels removed (message moved out of INBOX or SENT)
      for (const labelRemoved of (entry.labelsRemoved || [])) {
        const msgMeta = labelRemoved.message as Record<string, unknown>
        const removedLabels = labelRemoved.labelIds as string[] || []
        if (removedLabels.includes(label)) {
          const msgId = msgMeta.id as string
          const { error } = await supabase
            .from('email_log')
            .update({ is_deleted: true })
            .eq('message_id', msgId)
            .eq('organization_id', orgId)
          if (!error) deleted++
        }
      }
    }

    if (data.nextPageToken) {
      pageToken = data.nextPageToken
    } else {
      break
    }
  }

  return { synced, deleted, updated, newCursor: latestHistoryId }
}

function extractGmailBodyText(payload: Record<string, unknown>): string | null {
  // Try to get text/plain from payload parts
  if (!payload) return null

  const mimeType = payload.mimeType as string || ''
  const body = payload.body as Record<string, unknown> | undefined

  // Direct text/plain body
  if (mimeType === 'text/plain' && body?.data) {
    try {
      return atob((body.data as string).replace(/-/g, '+').replace(/_/g, '/'))
    } catch { return null }
  }

  // Multipart -- recurse into parts
  const parts = payload.parts as Array<Record<string, unknown>> | undefined
  if (parts) {
    // Prefer text/plain
    for (const part of parts) {
      if ((part.mimeType as string) === 'text/plain' && (part.body as Record<string, unknown>)?.data) {
        try {
          return atob(((part.body as Record<string, unknown>).data as string).replace(/-/g, '+').replace(/_/g, '/'))
        } catch { continue }
      }
    }
    // Recurse into nested multipart
    for (const part of parts) {
      const result = extractGmailBodyText(part)
      if (result) return result
    }
  }

  return null
}

// ── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse(req)

  const headers = { ...getCorsHeaders(req), 'Content-Type': 'application/json' }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    )
    if (authError || !user) throw new Error('Unauthorized')

    const { organization_id } = await req.json()
    if (!organization_id) throw new Error('Missing organization_id')

    // Verify org membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single()
    if (!membership) throw new Error('Not a member of this organization')

    // Get email connection (prefer active, then expired for refresh)
    const { data: connection } = await supabase
      .from('email_oauth_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .in('status', ['active', 'expired'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!connection) {
      return new Response(JSON.stringify({
        success: false,
        error: 'no_email_connection',
        message: 'No connected email account found. Connect Outlook or Gmail in Settings.',
        synced: 0,
      }), { status: 400, headers })
    }

    // Get valid token
    const { token, error: tokenError } = await getValidToken(supabase, connection)
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'token_error',
        message: tokenError || 'Could not get a valid access token',
        synced: 0,
      }), { status: 401, headers })
    }

    const syncState = (connection.sync_state as Record<string, unknown>) || {}
    const steps: string[] = []
    let totalSynced = 0, totalDeleted = 0, totalUpdated = 0
    const customerCache = new Map<string, string | null>()

    const provider = connection.provider as string

    // Determine folders based on provider
    const folders = provider === 'microsoft'
      ? ['inbox', 'sentitems']
      : ['INBOX', 'SENT']

    for (const folder of folders) {
      try {
        let result: SyncResult

        if (provider === 'microsoft') {
          result = await syncMicrosoftFolder(
            supabase, token, user.id, organization_id, folder, syncState, customerCache,
          )
        } else {
          result = await syncGmailLabel(
            supabase, token, user.id, organization_id, folder, syncState, customerCache,
          )
        }

        totalSynced += result.synced
        totalDeleted += result.deleted
        totalUpdated += result.updated

        // Update sync state
        if (result.newCursor) {
          if (provider === 'microsoft') {
            syncState[folder] = {
              delta_link: result.newCursor,
              last_sync_at: new Date().toISOString(),
            }
          } else {
            syncState[folder] = {
              history_id: result.newCursor,
              last_sync_at: new Date().toISOString(),
            }
          }
        } else if (provider === 'microsoft' && !(syncState[folder] as Record<string, unknown>)?.delta_link) {
          // Delta link expired (410) -- clear for fresh sync next time
          delete syncState[folder]
        } else if (provider === 'google' && !(syncState[folder] as Record<string, unknown>)?.history_id) {
          // History ID expired (404) -- clear for fresh sync next time
          delete syncState[folder]
        }

        steps.push(`${folder}: +${result.synced} new, ${result.updated} updated, ${result.deleted} deleted`)
      } catch (folderErr: unknown) {
        const msg = folderErr instanceof Error ? folderErr.message : String(folderErr)
        console.error(`[sync] ${folder} error:`, msg)
        steps.push(`${folder}: ERROR - ${msg}`)
      }
    }

    // Persist updated sync state
    await supabase
      .from('email_oauth_connections')
      .update({
        sync_state: syncState,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', connection.id)

    return new Response(JSON.stringify({
      success: true,
      synced: totalSynced,
      deleted: totalDeleted,
      updated: totalUpdated,
      provider,
      steps,
    }), { headers })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[sync-inbox-emails]', msg)
    return new Response(JSON.stringify({
      success: false,
      error: msg,
      synced: 0,
    }), { status: 400, headers })
  }
})
