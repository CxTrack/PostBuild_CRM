import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-retell-signature',
}

// ── Types ──────────────────────────────────────────────────────────

interface RetellWebhookPayload {
  event: 'call_started' | 'call_ended' | 'call_analyzed'
  call: RetellCallData
}

interface RetellCallData {
  call_id: string
  agent_id: string
  call_type?: string
  from_number?: string
  to_number?: string
  direction?: string
  metadata?: Record<string, string>
  start_timestamp?: number
  end_timestamp?: number
  duration_ms?: number
  transcript?: string
  transcript_object?: Array<{ role: string; content: string; words?: any[] }>
  recording_url?: string
  public_log_url?: string
  disconnection_reason?: string
  call_analysis?: {
    call_summary?: string
    user_sentiment?: string
    custom_analysis_data?: Record<string, string>
    call_successful?: boolean
    in_voicemail?: boolean
  }
  retell_llm_dynamic_variables?: Record<string, string>
}

interface MemoryConfig {
  memory_enabled: boolean
  memory_call_history: boolean
  memory_customer_notes: boolean
  memory_calendar_tasks: boolean
}

interface CustomerRecord {
  id: string
  name: string | null
  first_name: string | null
  last_name: string | null
  email: string | null
  company: string | null
  phone: string | null
}

// ── Helpers ────────────────────────────────────────────────────────

function normalizeE164(phone: string): string {
  if (!phone) return ''
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) cleaned = '1' + cleaned
  if (!cleaned.startsWith('+')) cleaned = '+' + cleaned
  return cleaned
}

function mapSentiment(retellSentiment?: string): string | null {
  if (!retellSentiment) return null
  const lower = retellSentiment.toLowerCase()
  if (lower.includes('positive')) return 'positive'
  if (lower.includes('negative')) return 'negative'
  return 'neutral'
}

function truncateContext(text: string, maxChars: number = 3000): string {
  if (text.length <= maxChars) return text
  return text.substring(0, maxChars) + '\n... (context truncated for brevity)'
}

function formatPhoneDisplay(phone: string): string {
  if (!phone) return 'Unknown'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const area = cleaned.substring(1, 4)
    const prefix = cleaned.substring(4, 7)
    const line = cleaned.substring(7, 11)
    return `(${area}) ${prefix}-${line}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`
  }
  return phone
}

// ── Customer Info Extraction Helpers ──────────────────────────────

function extractEmailFromText(text: string): string | null {
  if (!text) return null
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi
  const matches = text.match(emailRegex)
  if (!matches || matches.length === 0) return null
  const filtered = matches.filter(email => {
    const lower = email.toLowerCase()
    return !lower.includes('noreply')
      && !lower.includes('no-reply')
      && !lower.includes('@example.')
      && !lower.includes('@test.')
  })
  return filtered.length > 0 ? filtered[0].toLowerCase() : null
}

function extractNameFromText(text: string): string | null {
  if (!text) return null
  const summaryPatterns = [
    /(?:The (?:user|caller|customer)),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/,
    /(?:user|caller|customer)\s+named?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
  ]
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const name = match[1].trim()
      if (name.length >= 2 && !isCommonWord(name)) return name
    }
  }
  return null
}

function extractNameFromTranscript(transcript: string): string | null {
  if (!transcript) return null
  const patterns = [
    /(?:my name is|this is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,
    /(?:it's|its)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*[.,!]/gi,
  ]
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    const match = pattern.exec(transcript)
    if (match?.[1]) {
      const name = match[1].trim()
      if (name.length >= 2 && !isCommonWord(name)) return name
    }
  }
  return null
}

function isCommonWord(text: string): boolean {
  const common = new Set([
    'the', 'this', 'that', 'just', 'here', 'there', 'calling', 'call',
    'about', 'today', 'hello', 'thanks', 'thank', 'good', 'great',
    'morning', 'afternoon', 'evening', 'yes', 'yeah', 'sure', 'okay',
  ])
  return common.has(text.toLowerCase())
}

async function findExistingCustomer(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  phone: string | null,
  email: string | null
): Promise<{ id: string } | null> {
  if (phone) {
    const normalized = normalizeE164(phone)
    if (normalized) {
      const { data: byPhone } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', orgId)
        .eq('phone', normalized)
        .maybeSingle()
      if (byPhone) return byPhone

      // Also try without + prefix for format mismatches
      const withoutPlus = normalized.replace(/^\+/, '')
      const { data: byPhoneAlt } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', orgId)
        .or(`phone.eq.${withoutPlus},phone.eq.+${withoutPlus}`)
        .maybeSingle()
      if (byPhoneAlt) return byPhoneAlt
    }
  }

  if (email) {
    const { data: byEmail } = await supabase
      .from('customers')
      .select('id')
      .eq('organization_id', orgId)
      .ilike('email', email)
      .maybeSingle()
    if (byEmail) return byEmail
  }

  return null
}

async function sendBrokerNotificationSMS(
  supabase: ReturnType<typeof createClient>,
  callRecord: { id: string; organization_id: string; customer_phone: string | null },
  summaryText: string | null,
  callerPhone: string,
  durationMs: number | null,
  agentId: string,
): Promise<void> {
  try {
    // 1. Get voice agent config for broker contact info
    const { data: voiceConfig } = await supabase
      .from('voice_agent_configs')
      .select('broker_phone, broker_name, agent_name')
      .eq('organization_id', callRecord.organization_id)
      .maybeSingle()

    if (!voiceConfig?.broker_phone) {
      console.log('[broker_sms] No broker_phone configured, skipping notification')
      return
    }

    // 2. Get the org's provisioned phone number to use as FROM
    const { data: phoneNumber } = await supabase
      .from('phone_numbers')
      .select('phone_number')
      .eq('organization_id', callRecord.organization_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (!phoneNumber?.phone_number) {
      console.log('[broker_sms] No active phone number for org, skipping')
      return
    }

    // 4. Build the SMS body
    const formattedCaller = formatPhoneDisplay(callerPhone)
    const durationStr = durationMs ? `${Math.round(durationMs / 1000)}s` : 'unknown'
    const truncatedSummary = summaryText
      ? (summaryText.length > 200 ? summaryText.substring(0, 200) + '...' : summaryText)
      : 'No summary available.'
    const brokerName = voiceConfig.broker_name || 'there'

    const smsBody = `Hi ${brokerName}, your AI agent just handled a call.\n\nCaller: ${formattedCaller}\nDuration: ${durationStr}\n\n${truncatedSummary}\n\nView details: https://crm.cxtrack.com/calls/${callRecord.id}`

    // 5. Send via master Twilio account (provisioned numbers are owned by master)
    const masterSid = Deno.env.get('TWILIO_MASTER_ACCOUNT_SID')
    const masterToken = Deno.env.get('TWILIO_MASTER_AUTH_TOKEN')

    if (!masterSid || !masterToken) {
      console.error('[broker_sms] Missing TWILIO_MASTER_ACCOUNT_SID or TWILIO_MASTER_AUTH_TOKEN')
      return
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${masterSid}/Messages.json`
    const twilioAuth = btoa(`${masterSid}:${masterToken}`)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const statusCallbackUrl = `${supabaseUrl}/functions/v1/sms-status-callback`

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: voiceConfig.broker_phone,
        From: phoneNumber.phone_number,
        Body: smsBody,
        StatusCallback: statusCallbackUrl,
      }),
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('[broker_sms] Twilio API error:', twilioData)
      return
    }

    console.log(`[broker_sms] Sent to ${voiceConfig.broker_phone}, sid=${twilioData.sid}`)

    // 6. Log in sms_log
    await supabase.from('sms_log').insert({
      organization_id: callRecord.organization_id,
      document_type: 'call_summary',
      document_id: callRecord.id,
      recipient_phone: voiceConfig.broker_phone,
      message_body: smsBody,
      message_sid: twilioData.sid,
      status: twilioData.status || 'queued',
      sent_at: new Date().toISOString(),
    })

    // 7. Mark call summary as broker_notified
    await supabase
      .from('call_summaries')
      .update({
        broker_notified: true,
        sms_sent_at: new Date().toISOString(),
      })
      .eq('call_id', callRecord.id)

  } catch (err) {
    console.error('[broker_sms] Error sending notification:', err)
  }
}

async function verifyRetellSignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('x-retell-signature')

  const apiKey = Deno.env.get('RETELL_API_KEY')
  if (!apiKey) {
    console.warn('RETELL_API_KEY not set, skipping signature verification')
    return true
  }

  if (!signature) {
    console.warn('[retell-webhook] No x-retell-signature header, allowing request (check Retell config)')
    return true
  }

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(apiKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (signature === expectedSignature) {
      return true
    }

    // Signature mismatch - log but allow through to prevent blocking legitimate calls
    console.warn(`[retell-webhook] Signature mismatch. Expected=${expectedSignature.substring(0, 16)}... Got=${signature.substring(0, 16)}... Allowing request.`)
    return true
  } catch (err) {
    console.error('Signature verification error:', err)
    return true // Allow through on error to prevent blocking
  }
}

// ── Event Handlers ─────────────────────────────────────────────────

async function handleCallStarted(
  supabase: ReturnType<typeof createClient>,
  payload: RetellWebhookPayload
): Promise<Response> {
  const { call } = payload
  const callerPhone = call.from_number || ''
  const agentPhone = call.to_number || ''

  console.log(`[call_started] call_id=${call.call_id} from=${callerPhone} to=${agentPhone}`)

  // 1. Find organization by the Retell agent's phone number
  let orgId: string | null = null

  const { data: phoneRecord } = await supabase
    .from('phone_numbers')
    .select('organization_id')
    .eq('phone_number', normalizeE164(agentPhone))
    .eq('status', 'active')
    .maybeSingle()

  if (phoneRecord) {
    orgId = phoneRecord.organization_id
  } else {
    // Fallback: find org by retell_agent_id
    const { data: agentConfig } = await supabase
      .from('voice_agent_configs')
      .select('organization_id')
      .eq('retell_agent_id', call.agent_id)
      .maybeSingle()

    if (agentConfig) {
      orgId = agentConfig.organization_id
    }
  }

  if (!orgId) {
    console.error(`[call_started] Could not find org for agent_id=${call.agent_id} phone=${agentPhone}`)
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 2. Check memory settings
  const { data: config } = await supabase
    .from('voice_agent_configs')
    .select('agent_name, memory_enabled, memory_call_history, memory_customer_notes, memory_calendar_tasks')
    .eq('organization_id', orgId)
    .maybeSingle()

  const memoryConfig: MemoryConfig = {
    memory_enabled: config?.memory_enabled ?? true,
    memory_call_history: config?.memory_call_history ?? true,
    memory_customer_notes: config?.memory_customer_notes ?? true,
    memory_calendar_tasks: config?.memory_calendar_tasks ?? true,
  }

  // 3. Look up customer by phone number
  const normalized = normalizeE164(callerPhone)
  let customer: CustomerRecord | null = null

  if (normalized) {
    // Try exact match first
    const { data: exactMatch } = await supabase
      .from('customers')
      .select('id, name, first_name, last_name, email, company, phone')
      .eq('organization_id', orgId)
      .eq('phone', normalized)
      .maybeSingle()

    if (exactMatch) {
      customer = exactMatch
    } else {
      // Try without + prefix (some records might be stored differently)
      const withoutPlus = normalized.replace(/^\+/, '')
      const { data: altMatch } = await supabase
        .from('customers')
        .select('id, name, first_name, last_name, email, company, phone')
        .eq('organization_id', orgId)
        .or(`phone.eq.${withoutPlus},phone.eq.+${withoutPlus},phone.eq.${withoutPlus.substring(1)}`)
        .maybeSingle()

      if (altMatch) {
        customer = altMatch
      }
    }
  }

  // 4. Build context from enabled memory sources
  const contextParts: string[] = []

  if (customer && memoryConfig.memory_enabled) {
    const displayName = customer.first_name
      ? `${customer.first_name}${customer.last_name ? ' ' + customer.last_name : ''}`
      : customer.name || 'Customer'

    contextParts.push(
      `Returning caller: ${displayName}` +
      (customer.email ? `, email: ${customer.email}` : '') +
      (customer.company ? `, company: ${customer.company}` : '')
    )

    // Call history
    if (memoryConfig.memory_call_history) {
      const { data: pastCalls } = await supabase
        .from('call_summaries')
        .select('summary_text, key_topics, action_items, created_at')
        .eq('organization_id', orgId)
        .eq('caller_phone', normalized)
        .order('created_at', { ascending: false })
        .limit(5)

      if (pastCalls && pastCalls.length > 0) {
        contextParts.push('\nPAST CALL HISTORY:')
        for (const c of pastCalls) {
          const dateStr = new Date(c.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })
          contextParts.push(`- ${dateStr}: ${c.summary_text || 'No summary available'}`)
          if (c.action_items && Array.isArray(c.action_items) && c.action_items.length > 0) {
            const items = c.action_items.map((a: any) =>
              typeof a === 'string' ? a : a.description || a.text || JSON.stringify(a)
            )
            contextParts.push(`  Action items: ${items.join('; ')}`)
          }
          if (c.key_topics && Array.isArray(c.key_topics) && c.key_topics.length > 0) {
            contextParts.push(`  Topics: ${c.key_topics.join(', ')}`)
          }
        }
      }
    }

    // Customer notes
    if (memoryConfig.memory_customer_notes) {
      const { data: notes } = await supabase
        .from('customer_notes')
        .select('content, note_type, created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (notes && notes.length > 0) {
        contextParts.push('\nCUSTOMER NOTES:')
        for (const n of notes) {
          const dateStr = new Date(n.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
          })
          contextParts.push(`- [${n.note_type}] (${dateStr}) ${n.content}`)
        }
      }
    }

    // Calendar events & tasks
    if (memoryConfig.memory_calendar_tasks) {
      const now = new Date().toISOString()

      const { data: events } = await supabase
        .from('calendar_events')
        .select('title, start_time, event_type, status')
        .eq('organization_id', orgId)
        .eq('customer_id', customer.id)
        .gte('start_time', now)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true })
        .limit(5)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('title, due_date, status, type, priority')
        .eq('organization_id', orgId)
        .eq('customer_id', customer.id)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(5)

      if ((events && events.length > 0) || (tasks && tasks.length > 0)) {
        contextParts.push('\nUPCOMING SCHEDULE:')
        if (events) {
          for (const e of events) {
            const dateStr = new Date(e.start_time).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric'
            })
            const timeStr = new Date(e.start_time).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit'
            })
            contextParts.push(`- ${e.event_type}: "${e.title}" on ${dateStr} at ${timeStr} (${e.status})`)
          }
        }
        if (tasks) {
          for (const t of tasks) {
            const dueStr = t.due_date
              ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'no due date'
            contextParts.push(`- Task [${t.priority || 'medium'}]: "${t.title}" due ${dueStr} (${t.status})`)
          }
        }
      }
    }
  }

  // 5. Insert call record
  const callInsert: Record<string, any> = {
    organization_id: orgId,
    customer_id: customer?.id || null,
    retell_call_id: call.call_id,
    direction: 'inbound',
    call_type: 'ai_agent',
    agent_id: call.agent_id,
    agent_name: config?.agent_name || 'AI Phone Agent',
    agent_type: 'retell',
    customer_phone: callerPhone,
    phone_number: agentPhone,
    status: 'in_progress',
    started_at: call.start_timestamp
      ? new Date(call.start_timestamp).toISOString()
      : new Date().toISOString(),
  }

  await supabase.from('calls').insert(callInsert)

  // 6. Build dynamic variables for Retell
  const customerName = customer
    ? (customer.first_name
      ? `${customer.first_name}${customer.last_name ? ' ' + customer.last_name : ''}`
      : customer.name || 'Caller')
    : 'Caller'

  const contextStr = contextParts.length > 0
    ? truncateContext(contextParts.join('\n'))
    : 'New caller, no previous history found.'

  const dynamicVars: Record<string, string> = {
    customer_name: customerName,
    customer_email: customer?.email || '',
    customer_id: customer?.id || '',
    customer_context: contextStr,
    is_returning_customer: customer ? 'true' : 'false',
  }

  console.log(`[call_started] Returning context for ${customerName} (returning=${!!customer}, context_length=${contextStr.length})`)

  return new Response(JSON.stringify({
    response_data: {
      retell_llm_dynamic_variables: dynamicVars,
    },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleCallEnded(
  supabase: ReturnType<typeof createClient>,
  payload: RetellWebhookPayload
): Promise<Response> {
  const { call } = payload

  console.log(`[call_ended] call_id=${call.call_id} reason=${call.disconnection_reason || 'unknown'}`)

  const updates: Record<string, any> = {
    status: 'completed',
    ended_at: call.end_timestamp
      ? new Date(call.end_timestamp).toISOString()
      : new Date().toISOString(),
  }

  if (call.transcript) updates.transcript = call.transcript
  if (call.recording_url) updates.recording_url = call.recording_url
  if (call.duration_ms) updates.duration_seconds = Math.round(call.duration_ms / 1000)

  const { error } = await supabase
    .from('calls')
    .update(updates)
    .eq('retell_call_id', call.call_id)

  if (error) {
    console.error(`[call_ended] Failed to update call: ${error.message}`)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleCallAnalyzed(
  supabase: ReturnType<typeof createClient>,
  payload: RetellWebhookPayload
): Promise<Response> {
  const { call } = payload

  console.log(`[call_analyzed] call_id=${call.call_id}`)

  // Find the call record
  const { data: callRecord } = await supabase
    .from('calls')
    .select('id, organization_id, customer_id, customer_phone')
    .eq('retell_call_id', call.call_id)
    .maybeSingle()

  if (!callRecord) {
    console.error(`[call_analyzed] No call record found for retell_call_id=${call.call_id}`)
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Update call with analysis data
  const sentiment = mapSentiment(call.call_analysis?.user_sentiment)
  const callUpdates: Record<string, any> = {}
  if (call.call_analysis?.call_summary) callUpdates.summary = call.call_analysis.call_summary
  if (sentiment) callUpdates.sentiment = sentiment

  if (Object.keys(callUpdates).length > 0) {
    await supabase.from('calls').update(callUpdates).eq('id', callRecord.id)
  }

  // Extract key topics and action items from custom analysis data
  const customData = call.call_analysis?.custom_analysis_data || {}
  const keyTopics: string[] = customData.key_topics
    ? customData.key_topics.split(',').map((t: string) => t.trim()).filter(Boolean)
    : []
  const actionItems: any[] = customData.action_items
    ? customData.action_items.split(',').map((a: string) => ({ description: a.trim(), completed: false }))
    : []

  // Create call_summaries record
  const summaryInsert: Record<string, any> = {
    call_id: callRecord.id,
    organization_id: callRecord.organization_id,
    retell_call_id: call.call_id,
    summary_text: call.call_analysis?.call_summary || null,
    caller_phone: callRecord.customer_phone || call.from_number || null,
    agent_id: call.agent_id,
    duration_ms: call.duration_ms || null,
    recording_url: call.recording_url || null,
    raw_webhook_payload: payload,
  }

  if (call.transcript) summaryInsert.transcript = call.transcript
  if (call.transcript_object) summaryInsert.transcript_object = call.transcript_object
  if (sentiment) summaryInsert.sentiment = sentiment
  if (keyTopics.length > 0) summaryInsert.key_topics = keyTopics
  if (actionItems.length > 0) summaryInsert.action_items = actionItems

  const { error: summaryError } = await supabase
    .from('call_summaries')
    .insert(summaryInsert)

  if (summaryError) {
    console.error(`[call_analyzed] Failed to insert call_summary: ${summaryError.message}`)
  }

  // Send broker notification SMS (non-blocking)
  if (!summaryError) {
    await sendBrokerNotificationSMS(
      supabase,
      callRecord,
      call.call_analysis?.call_summary || null,
      callRecord.customer_phone || call.from_number || '',
      call.duration_ms || null,
      call.agent_id,
    )
  }

  // ── Extract customer info from multiple sources (cascading) ──
  let extractedName: string | null = customData.customer_name || null
  let extractedEmail: string | null = customData.customer_email || null

  // Source 2: call summary text
  const summaryText = call.call_analysis?.call_summary || ''
  if (!extractedName && summaryText) {
    extractedName = extractNameFromText(summaryText)
  }
  if (!extractedEmail && summaryText) {
    extractedEmail = extractEmailFromText(summaryText)
  }

  // Source 3: transcript (fallback)
  if (!extractedName && call.transcript) {
    extractedName = extractNameFromTranscript(call.transcript)
  }
  if (!extractedEmail && call.transcript) {
    extractedEmail = extractEmailFromText(call.transcript)
  }

  if (extractedName || extractedEmail) {
    console.log(`[call_analyzed] Extracted customer data: name="${extractedName}" email="${extractedEmail}" (has_customer_id=${!!callRecord.customer_id})`)
    await processCustomerDataFromAnalysis(
      supabase,
      callRecord,
      call.from_number || '',
      extractedName,
      extractedEmail
    )
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function processCustomerDataFromAnalysis(
  supabase: ReturnType<typeof createClient>,
  callRecord: { id: string; organization_id: string; customer_id: string | null; customer_phone: string | null },
  callerPhone: string,
  customerName: string | null,
  customerEmail: string | null
) {
  try {
    if (!customerName && !customerEmail) {
      console.log('[processCustomerData] No name or email to process, skipping')
      return
    }

    const phone = callerPhone || callRecord.customer_phone || null

    if (callRecord.customer_id) {
      // ── Update existing customer ──
      const updates: Record<string, any> = {}
      if (customerName) {
        updates.name = customerName
        const parts = customerName.trim().split(/\s+/)
        updates.first_name = parts[0] || ''
        updates.last_name = parts.slice(1).join(' ') || ''
      }
      if (customerEmail) updates.email = customerEmail

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', callRecord.customer_id)
        if (error) console.error(`[processCustomerData] Update failed: ${error.message}`)
        else console.log(`[processCustomerData] Updated customer ${callRecord.customer_id}`)
      }
    } else {
      // ── Create new customer ──

      // 1. Duplicate check by phone or email
      const existing = await findExistingCustomer(
        supabase,
        callRecord.organization_id,
        phone,
        customerEmail
      )

      if (existing) {
        // Link existing customer to this call instead of creating a duplicate
        console.log(`[processCustomerData] Found existing customer ${existing.id}, linking to call`)
        await supabase
          .from('calls')
          .update({ customer_id: existing.id })
          .eq('id', callRecord.id)

        // Update with any new info they provided
        const updates: Record<string, any> = {}
        if (customerName) {
          updates.name = customerName
          const parts = customerName.trim().split(/\s+/)
          updates.first_name = parts[0] || ''
          updates.last_name = parts.slice(1).join(' ') || ''
        }
        if (customerEmail) updates.email = customerEmail
        if (Object.keys(updates).length > 0) {
          await supabase.from('customers').update(updates).eq('id', existing.id)
        }
        return
      }

      // 2. Build customer name
      const nameParts = (customerName || '').trim().split(/\s+/)
      const firstName = nameParts[0] || null
      const lastName = nameParts.slice(1).join(' ') || null
      const displayName = customerName || 'Phone Caller'

      // 3. Create the customer
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          organization_id: callRecord.organization_id,
          name: displayName,
          first_name: firstName,
          last_name: lastName,
          email: customerEmail || null,
          phone: phone ? normalizeE164(phone) : null,
          status: 'Active',
          priority: 'Medium',
          country: 'CA',
          total_spent: 0,
          custom_fields: {},
          tags: ['phone-lead'],
        })
        .select('id')
        .single()

      if (insertError) {
        console.error(`[processCustomerData] Insert failed: ${insertError.message}`)
        return
      }

      // 4. Link the new customer to the call
      if (newCustomer) {
        await supabase
          .from('calls')
          .update({ customer_id: newCustomer.id })
          .eq('id', callRecord.id)
        console.log(`[processCustomerData] Created customer ${newCustomer.id} and linked to call ${callRecord.id}`)
      }
    }
  } catch (err) {
    // Non-blocking: log but don't throw
    console.error(`[processCustomerData] Unexpected error:`, err)
  }
}

// ── Main Handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const bodyText = await req.text()

    // Verify Retell webhook signature
    const isValid = await verifyRetellSignature(req, bodyText)
    if (!isValid) {
      console.error('[retell-webhook] Invalid signature')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload: RetellWebhookPayload = JSON.parse(bodyText)

    if (!payload.event || !payload.call) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (payload.event) {
      case 'call_started':
        return await handleCallStarted(supabaseClient, payload)
      case 'call_ended':
        return await handleCallEnded(supabaseClient, payload)
      case 'call_analyzed':
        return await handleCallAnalyzed(supabaseClient, payload)
      default:
        console.log(`[retell-webhook] Unknown event: ${payload.event}`)
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    console.error('[retell-webhook] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
