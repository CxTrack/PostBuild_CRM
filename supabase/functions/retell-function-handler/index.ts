import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

// ── Types ──────────────────────────────────────────────────────────

interface RetellFunctionCallPayload {
  call_id: string
  agent_id: string
  name: string  // function name
  args: Record<string, any>
}

interface CallRecord {
  id: string
  organization_id: string
  customer_id: string | null
  customer_phone: string | null
}

// ── Helpers ────────────────────────────────────────────────────────

function respond(result: string) {
  return new Response(JSON.stringify({ result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ result: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function getCallRecord(
  supabase: ReturnType<typeof createClient>,
  callId: string
): Promise<CallRecord | null> {
  const { data } = await supabase
    .from('calls')
    .select('id, organization_id, customer_id, customer_phone')
    .eq('retell_call_id', callId)
    .maybeSingle()
  return data
}

// ── Tool Handlers ──────────────────────────────────────────────────

async function handleSaveCustomerInfo(
  supabase: ReturnType<typeof createClient>,
  payload: RetellFunctionCallPayload
): Promise<Response> {
  const { call_id, args } = payload
  const { customer_name, customer_email } = args

  console.log(`[save_customer_info] call_id=${call_id} name=${customer_name} email=${customer_email}`)

  const callRecord = await getCallRecord(supabase, call_id)
  if (!callRecord) {
    return respond("Thank you, I've noted that down.")
  }

  const orgId = callRecord.organization_id
  const phone = callRecord.customer_phone

  // Parse name into first/last
  const nameParts = (customer_name || '').trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  if (callRecord.customer_id) {
    // Update existing customer
    const updates: Record<string, any> = {}
    if (customer_name) {
      updates.name = customer_name
      updates.first_name = firstName
      updates.last_name = lastName
    }
    if (customer_email) updates.email = customer_email

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('customers')
        .update(updates)
        .eq('id', callRecord.customer_id)
    }

    return respond(
      firstName
        ? `Thank you, ${firstName}. I've updated your information on file.`
        : "Thank you, I've updated your information."
    )
  } else {
    // Create new customer record
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        organization_id: orgId,
        name: customer_name || 'Phone Caller',
        first_name: firstName || null,
        last_name: lastName || null,
        email: customer_email || null,
        phone: phone || null,
        status: 'Active',
        priority: 'Medium',
        country: 'CA',
        total_spent: 0,
        custom_fields: {},
        tags: ['phone-lead'],
      })
      .select('id')
      .single()

    if (error) {
      console.error(`[save_customer_info] Failed to create customer: ${error.message}`)
      return respond("Thank you, I've noted that down.")
    }

    // Link the call to the new customer
    if (newCustomer) {
      await supabase
        .from('calls')
        .update({ customer_id: newCustomer.id })
        .eq('retell_call_id', call_id)
    }

    return respond(
      firstName
        ? `Thank you, ${firstName}. I've created your profile in our system.`
        : "Thank you, I've added you to our system."
    )
  }
}

async function handleCreateTask(
  supabase: ReturnType<typeof createClient>,
  payload: RetellFunctionCallPayload
): Promise<Response> {
  const { call_id, args } = payload
  const { title, description, task_type, due_date, priority } = args

  console.log(`[create_task] call_id=${call_id} title=${title}`)

  const callRecord = await getCallRecord(supabase, call_id)
  if (!callRecord) {
    return respond("I've made a note of that for the team.")
  }

  // Default due date to tomorrow if not specified
  const dueDate = due_date || new Date(Date.now() + 86400000).toISOString().split('T')[0]

  // Map priority to DB format (Title Case)
  const priorityMap: Record<string, string> = {
    low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
  }
  const dbPriority = priorityMap[(priority || 'medium').toLowerCase()] || 'Medium'

  // Map task type
  const validTypes = ['call', 'email', 'sms', 'follow_up', 'meeting', 'other']
  const dbType = validTypes.includes(task_type) ? task_type : 'follow_up'

  const { error } = await supabase.from('tasks').insert({
    organization_id: callRecord.organization_id,
    customer_id: callRecord.customer_id,
    title: title || 'Follow-up from phone call',
    description: description || `Created by voice agent during call`,
    type: dbType,
    priority: dbPriority,
    status: 'pending',
    due_date: dueDate,
    show_on_calendar: true,
    duration: 30,
  })

  if (error) {
    console.error(`[create_task] Failed to create task: ${error.message}`)
    return respond("I'll make sure the team follows up on that.")
  }

  const dateStr = new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return respond(`Done. I've created a ${dbType.replace('_', ' ')} task for ${dateStr}.`)
}

async function handleCheckAvailability(
  supabase: ReturnType<typeof createClient>,
  payload: RetellFunctionCallPayload
): Promise<Response> {
  const { call_id, args } = payload
  const { date, duration_minutes } = args
  const duration = duration_minutes || 30

  console.log(`[check_availability] call_id=${call_id} date=${date} duration=${duration}`)

  const callRecord = await getCallRecord(supabase, call_id)
  if (!callRecord) {
    return respond("Let me check... I'm having trouble accessing the calendar right now. Can I take your preferred time and have someone confirm?")
  }

  const orgId = callRecord.organization_id

  // Check if Cal.com is configured
  const { data: calcomSettings } = await supabase
    .from('calcom_settings')
    .select('api_key, default_event_type_id')
    .eq('organization_id', orgId)
    .maybeSingle()

  let availableSlots: string[] = []

  // Try Cal.com availability first
  if (calcomSettings?.api_key && calcomSettings?.default_event_type_id) {
    try {
      const calcomUrl = `https://api.cal.com/v1/availability?apiKey=${calcomSettings.api_key}&eventTypeId=${calcomSettings.default_event_type_id}&dateFrom=${date}&dateTo=${date}`
      const resp = await fetch(calcomUrl)

      if (resp.ok) {
        const data = await resp.json()
        if (data.dateRanges || data.slots || data.busy) {
          availableSlots = extractCalcomSlots(data, date, duration)
        }
      }
    } catch (err) {
      console.warn(`[check_availability] Cal.com API error: ${err}`)
    }
  }

  // Fall back to native calendar gap-finding
  if (availableSlots.length === 0) {
    const dayStart = `${date}T09:00:00`
    const dayEnd = `${date}T17:00:00`

    const { data: events } = await supabase
      .from('calendar_events')
      .select('start_time, end_time')
      .eq('organization_id', orgId)
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true })

    availableSlots = findGaps(events || [], dayStart, dayEnd, duration)
  }

  if (availableSlots.length === 0) {
    const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
    return respond(`I don't see any available ${duration}-minute slots on ${dateStr}. Would you like to try a different date?`)
  }

  // Format top 4 slots for the agent to read
  const topSlots = availableSlots.slice(0, 4)
  const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const slotList = topSlots.map(s => formatTimeForSpeech(s)).join(', ')

  return respond(`On ${dateStr}, I have these times available: ${slotList}. Which works best for you?`)
}

async function handleBookAppointment(
  supabase: ReturnType<typeof createClient>,
  payload: RetellFunctionCallPayload
): Promise<Response> {
  const { call_id, args } = payload
  const { title, start_time, duration_minutes, attendee_name, attendee_email, attendee_phone } = args

  console.log(`[book_appointment] call_id=${call_id} title=${title} start=${start_time}`)

  const callRecord = await getCallRecord(supabase, call_id)
  if (!callRecord) {
    return respond("I apologize, I'm having trouble booking that. Can I take your details and have someone call you back to confirm?")
  }

  const orgId = callRecord.organization_id
  const duration = duration_minutes || 30
  const endTime = new Date(new Date(start_time).getTime() + duration * 60000).toISOString()

  // Try Cal.com booking if configured and we have attendee email
  let calcomBookingUid: string | null = null
  if (attendee_email) {
    const { data: calcomSettings } = await supabase
      .from('calcom_settings')
      .select('api_key, default_event_type_id')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (calcomSettings?.api_key && calcomSettings?.default_event_type_id) {
      try {
        const resp = await fetch(`https://api.cal.com/v1/bookings?apiKey=${calcomSettings.api_key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventTypeId: calcomSettings.default_event_type_id,
            start: start_time,
            end: endTime,
            name: attendee_name || 'Phone Caller',
            email: attendee_email,
            timeZone: 'America/Toronto',
          }),
        })

        if (resp.ok) {
          const data = await resp.json()
          calcomBookingUid = data.uid || data.id || null
        }
      } catch (err) {
        console.warn(`[book_appointment] Cal.com booking error: ${err}`)
      }
    }
  }

  // Get org owner for user_id
  const { data: orgOwner } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  // Create native calendar event
  const { error } = await supabase.from('calendar_events').insert({
    organization_id: orgId,
    user_id: orgOwner?.user_id || null,
    customer_id: callRecord.customer_id,
    title: title || 'Phone Booking',
    event_type: 'appointment',
    start_time: start_time,
    end_time: endTime,
    status: 'scheduled',
    attendee_name: attendee_name || null,
    attendee_email: attendee_email || null,
    attendee_phone: attendee_phone || callRecord.customer_phone || null,
    calcom_booking_uid: calcomBookingUid,
    color: '#6366f1',
    is_recurring: false,
    attendees: [{
      name: attendee_name || '',
      email: attendee_email || '',
      status: 'pending',
    }],
    reminders: [{ minutes: 30, method: 'email' }],
    metadata: { created_by: 'voice_agent', call_id: call_id },
  })

  if (error) {
    console.error(`[book_appointment] Failed to create event: ${error.message}`)
    return respond("I'm sorry, I had trouble booking that. Let me take your preferred time and someone will confirm with you shortly.")
  }

  const timeStr = new Date(start_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto',
  })
  const dateStr = new Date(start_time).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Toronto',
  })

  return respond(`Your appointment "${title}" is booked for ${dateStr} at ${timeStr}. ${attendee_email ? "You'll receive a confirmation email." : "Is there anything else I can help with?"}`)
}

// ── Calendar Utilities ─────────────────────────────────────────────

function extractCalcomSlots(data: any, date: string, durationMinutes: number): string[] {
  // Cal.com returns various formats depending on API version
  const slots: string[] = []

  if (data.slots && Array.isArray(data.slots)) {
    for (const slot of data.slots) {
      const time = typeof slot === 'string' ? slot : slot.time || slot.start
      if (time) slots.push(time)
    }
  } else if (data.dateRanges && Array.isArray(data.dateRanges)) {
    // Generate slots from available ranges
    for (const range of data.dateRanges) {
      const start = new Date(range.start)
      const end = new Date(range.end)
      let current = new Date(start)
      while (current.getTime() + durationMinutes * 60000 <= end.getTime()) {
        slots.push(current.toISOString())
        current = new Date(current.getTime() + 30 * 60000) // 30-min increments
      }
    }
  }

  return slots
}

function findGaps(
  events: Array<{ start_time: string; end_time: string }>,
  dayStart: string,
  dayEnd: string,
  durationMinutes: number
): string[] {
  const slots: string[] = []
  const busyPeriods = events
    .map(e => ({
      start: new Date(e.start_time).getTime(),
      end: new Date(e.end_time).getTime(),
    }))
    .sort((a, b) => a.start - b.start)

  let cursor = new Date(dayStart).getTime()
  const endOfDay = new Date(dayEnd).getTime()
  const slotDuration = durationMinutes * 60000

  for (const busy of busyPeriods) {
    // Add slots in the gap before this busy period
    while (cursor + slotDuration <= busy.start && cursor + slotDuration <= endOfDay) {
      slots.push(new Date(cursor).toISOString())
      cursor += 30 * 60000 // 30-min increments
    }
    // Jump past the busy period
    if (busy.end > cursor) {
      cursor = busy.end
    }
  }

  // Add remaining slots after last busy period
  while (cursor + slotDuration <= endOfDay) {
    slots.push(new Date(cursor).toISOString())
    cursor += 30 * 60000
  }

  return slots
}

function formatTimeForSpeech(isoTime: string): string {
  const d = new Date(isoTime)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Toronto',
  })
}

// ── Main Handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const payload: RetellFunctionCallPayload = await req.json()

    console.log(`[retell-function-handler] function=${payload.name} call_id=${payload.call_id}`)

    if (!payload.call_id || !payload.name) {
      return errorResponse('Missing call_id or function name')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (payload.name) {
      case 'save_customer_info':
        return await handleSaveCustomerInfo(supabaseClient, payload)
      case 'create_task':
        return await handleCreateTask(supabaseClient, payload)
      case 'check_availability':
        return await handleCheckAvailability(supabaseClient, payload)
      case 'book_appointment':
        return await handleBookAppointment(supabaseClient, payload)
      default:
        console.warn(`[retell-function-handler] Unknown function: ${payload.name}`)
        return respond("I'll make a note of that.")
    }
  } catch (error) {
    console.error('[retell-function-handler] Error:', error)
    return errorResponse("I'm having a moment, let me continue.", 500)
  }
})
