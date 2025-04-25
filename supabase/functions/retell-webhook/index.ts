import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('🧠 Retell webhook function is running...')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    })
  }

  let body: any
  try {
    body = await req.json()
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const { event, call } = body

  if (event !== 'call_ended' || !call) {
    // return new Response(JSON.stringify({ error: 'Invalid event or missing call data. Event type: ' + event }), {
    //   status: 400,
    // })
    return new Response(JSON.stringify({ error: 'Invalid event or missing call data. Event type: ' + event }), {
       status: 200,
     });
    
  }

  const {
    from_number,
    to_number,
    call_id: provider_call_id,
    agent_id: call_agent_id,
    provider_agent_id,
    disconnection_reason,
    transcript,
    start_timestamp,
    end_timestamp
  } = call

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Step 1: Find user_id from user_calls table
  const { data: userCall, error: userCallError } = await supabase
    .from('user_calls')
    .select('user_id')
    .eq('call_agent_id', call_agent_id)
    .single()

  if (userCallError || !userCall?.user_id) {
    console.error('Failed to find user_id for agent_id', call_agent_id, userCallError)
    return new Response(JSON.stringify({ error: 'Agent not linked to any user' }), {
      status: 404
    })
  }

  const user_id = userCall.user_id

  // Step 2: Insert call record
  const { error: insertError } = await supabase.from('calls').insert([
    {
      from_number,
      to_number,
      call_agent_id,
      user_id,
      start_time: new Date(start_timestamp),
      end_time: new Date(end_timestamp),
      disconnection_reason,
      transcript,
      provider_call_id,
      provider_agent_id,
    }
  ])

  if (insertError) {
    console.error('Failed to insert call:', insertError)
    return new Response(JSON.stringify({ error: 'Insert failed' }), {
      status: 500
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
