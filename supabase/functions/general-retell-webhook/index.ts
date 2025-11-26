import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
console.log('🧠 Retell webhook function is running...');
serve(async (req)=>{
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405
    });
  }
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Invalid JSON'
    }), {
      status: 400
    });
  }
  const { event, call } = body;
  console.log('event: ' + event);
  console.log('call:', JSON.stringify(call, null, 2));
  if (event !== 'call_ended' || !call) {
    // return new Response(JSON.stringify({ error: 'Invalid event or missing call data. Event type: ' + event }), {
    //   status: 400,
    // })
    return new Response(JSON.stringify({
      error: 'Invalid event or missing call data. Event type: ' + event
    }), {
      status: 200
    });
  }
  const { from_number, to_number, call_id: provider_call_id, agent_id: call_agent_id, provider_agent_id, disconnection_reason, transcript, start_timestamp, end_timestamp, collected_dynamic_variables } = call;
  const supabase = createClient(Deno.env.get('DB_URL'), Deno.env.get('DB_SERVICE_ROLE_KEY'));
  // Step 1: Find user_id from user_call_agents table
  const { data: userCall, error: userCallError } = await supabase.from('user_call_agents').select('user_id').eq('call_agent_id', call_agent_id).single();
  if (userCallError || !userCall?.user_id) {
    console.error('Failed to find user_id for agent_id', call_agent_id, userCallError);
    return new Response(JSON.stringify({
      error: 'Agent not linked to any user'
    }), {
      status: 404
    });
  }
  const user_id = userCall.user_id;
  const cleanedFromPhone = from_number?.startsWith('+1') ? from_number.slice(2) : from_number;
  // Step 2: Insert call record
  const { error: insertError } = await supabase.from('calls').insert([
    {
      from_number: cleanedFromPhone,
      to_number,
      call_agent_id,
      user_id,
      start_time: new Date(start_timestamp),
      end_time: new Date(end_timestamp),
      disconnection_reason,
      transcript,
      provider_call_id,
      provider_agent_id,
      name: collected_dynamic_variables?.customer_name,
      phone_number: collected_dynamic_variables?.customer_phone,
      email: collected_dynamic_variables?.customer_email
    }
  ]);
  if (insertError) {
    console.error('Failed to insert call:', insertError);
    return new Response(JSON.stringify({
      error: 'Insert failed'
    }), {
      status: 500
    });
  }
  // Step 3: Check if customer exists for this user by phone number
  const { data: existingCustomer, error: customerLookupError } = await supabase.from('customers').select('id').eq('phone', cleanedFromPhone).eq('user_id', user_id).maybeSingle();
  if (customerLookupError) {
    console.error('Customer lookup failed:', customerLookupError);
  // Not a hard failure, continue response
  } else if (!existingCustomer) {
    // Step 4: Create new customer with phone
    const cleanedPhone = from_number?.startsWith('+1') ? from_number.slice(2) : from_number;
    const { error: customerInsertError } = await supabase.from('customers').insert([
      {
        phone: cleanedPhone,
        email: collected_dynamic_variables?.customer_email ?? '',
        name: collected_dynamic_variables?.customer_name ?? 'Unknown',
        user_id: user_id
      }
    ]);
    if (customerInsertError) {
      console.error('Customer insert failed:', customerInsertError);
    // Optional: return error or just log
    } else {
      console.log('Customer inserted. Phone: ' + cleanedPhone + ' Name: ' + collected_dynamic_variables?.customer_name + '. UserId: ', user_id);
    }
  }
  return new Response(JSON.stringify({
    success: true
  }), {
    headers: {
      'Content-Type': 'application/json'
    },
    status: 200
  });
});
