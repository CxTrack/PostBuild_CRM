import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

// API USAGE LOGGER
async function logApiCall(params: {
  serviceName: string; endpoint: string; method: string; statusCode: number;
  responseTimeMs: number; costCents?: number;
  organizationId?: string; userId?: string; errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await admin.from('api_usage_log').insert({
      service_name: params.serviceName, endpoint: params.endpoint, method: params.method,
      status_code: params.statusCode, response_time_ms: params.responseTimeMs,
      tokens_used: null, cost_cents: params.costCents || null,
      organization_id: params.organizationId || null, user_id: params.userId || null,
      error_message: params.errorMessage || null, metadata: params.metadata || null,
    });
  } catch (e) { console.error('API usage log failed:', e); }
}

interface OutboundCallRequest {
  organizationId: string;
  toNumber: string;
  customerId?: string;
  customerName?: string;
  callReason?: string;
  callContext?: string;
  // Optional overrides
  overrideAgentId?: string;
  metadata?: Record<string, unknown>;
}

function formatE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

// ============================================================
// AUTO-CREATE OUTBOUND AGENT
// Clones the inbound agent with an outbound-specific prompt.
// Called lazily on first outbound call attempt.
// ============================================================
async function createOutboundAgent(params: {
  supabase: ReturnType<typeof createClient>;
  retellApiKey: string;
  organizationId: string;
  userId: string;
  inboundAgentId: string;
  agentName: string;
  businessName: string;
}): Promise<{ agentId: string; llmId: string }> {
  const { supabase, retellApiKey, organizationId, userId, inboundAgentId, agentName, businessName } = params;
  const retellHeaders = { 'Authorization': `Bearer ${retellApiKey}`, 'Content-Type': 'application/json' };

  // 1. Read inbound agent from Retell to get its config
  const readStart = Date.now();
  const agentRes = await fetch(`https://api.retellai.com/get-agent/${inboundAgentId}`, {
    method: 'GET', headers: { 'Authorization': `Bearer ${retellApiKey}` },
  });
  const readMs = Date.now() - readStart;

  if (!agentRes.ok) {
    const err = await agentRes.text();
    await logApiCall({ serviceName: 'retell', endpoint: '/get-agent', method: 'GET', statusCode: agentRes.status, responseTimeMs: readMs, organizationId, userId, errorMessage: err.substring(0, 500), metadata: { function: 'make-outbound-call', step: 'read-inbound-agent' } });
    throw new Error(`Failed to read inbound agent: ${err}`);
  }
  await logApiCall({ serviceName: 'retell', endpoint: '/get-agent', method: 'GET', statusCode: 200, responseTimeMs: readMs, organizationId, userId, metadata: { function: 'make-outbound-call', step: 'read-inbound-agent' } });

  const inboundAgent = await agentRes.json();

  // 2. Create new outbound agent (clones the LLM automatically)
  const { version: _v, ...responseEngineClean } = inboundAgent.response_engine || {};
  const webhookUrl = `${SUPABASE_URL}/functions/v1/retell-webhook`;

  const newAgentBody: Record<string, unknown> = {
    response_engine: responseEngineClean,
    voice_id: inboundAgent.voice_id,
    agent_name: `${agentName} - ${businessName} (Outbound)`,
    webhook_url: webhookUrl,
    webhook_events: ['call_started', 'call_ended', 'call_analyzed'],
  };

  // Copy voice settings from inbound agent
  if (inboundAgent.voice_model) newAgentBody.voice_model = inboundAgent.voice_model;
  if (inboundAgent.voice_temperature !== undefined) newAgentBody.voice_temperature = inboundAgent.voice_temperature;
  if (inboundAgent.voice_speed !== undefined) newAgentBody.voice_speed = inboundAgent.voice_speed;
  if (inboundAgent.responsiveness !== undefined) newAgentBody.responsiveness = inboundAgent.responsiveness;
  if (inboundAgent.interruption_sensitivity !== undefined) newAgentBody.interruption_sensitivity = inboundAgent.interruption_sensitivity;
  if (inboundAgent.enable_backchannel !== undefined) newAgentBody.enable_backchannel = inboundAgent.enable_backchannel;
  if (inboundAgent.language) newAgentBody.language = inboundAgent.language;
  if (inboundAgent.ambient_sound) newAgentBody.ambient_sound = inboundAgent.ambient_sound;
  if (inboundAgent.opt_out_sensitive_data_storage !== undefined) newAgentBody.opt_out_sensitive_data_storage = inboundAgent.opt_out_sensitive_data_storage;
  // Enable voicemail detection for outbound (people may not answer)
  newAgentBody.enable_voicemail_detection = true;
  newAgentBody.voicemail_message = `Hi {{customer_name}}, this is ${agentName} from ${businessName}. I was calling regarding {{call_reason}}. Please give us a call back at your convenience. Thank you!`;

  const createStart = Date.now();
  const createRes = await fetch('https://api.retellai.com/create-agent', {
    method: 'POST', headers: retellHeaders,
    body: JSON.stringify(newAgentBody),
  });
  const createMs = Date.now() - createStart;

  if (!createRes.ok) {
    const err = await createRes.text();
    await logApiCall({ serviceName: 'retell', endpoint: '/create-agent', method: 'POST', statusCode: createRes.status, responseTimeMs: createMs, organizationId, userId, errorMessage: err.substring(0, 500), metadata: { function: 'make-outbound-call', step: 'create-outbound-agent' } });
    throw new Error(`Failed to create outbound agent: ${err}`);
  }
  await logApiCall({ serviceName: 'retell', endpoint: '/create-agent', method: 'POST', statusCode: 200, responseTimeMs: createMs, organizationId, userId, metadata: { function: 'make-outbound-call', step: 'create-outbound-agent' } });

  const newAgent = await createRes.json();
  const outboundAgentId = newAgent.agent_id;
  const outboundLlmId = newAgent.response_engine?.llm_id || '';

  // 3. Update the cloned LLM with outbound-specific prompt
  if (outboundLlmId) {
    const outboundPrompt = `You are ${agentName}, an AI assistant calling on behalf of ${businessName}.

## CALL CONTEXT
You are making an OUTBOUND call. The person you are calling may not be expecting your call. Be polite, professional, and get to the point quickly.

Reason for calling: {{call_reason}}
Customer name: {{customer_name}}
Additional context: {{customer_context}}

## CALL FLOW
1. Greet the person and introduce yourself: "Hi, is this {{customer_name}}? This is ${agentName} from ${businessName}."
2. Confirm you are speaking with the right person before proceeding
3. State the reason for your call clearly and concisely
4. Handle the conversation based on their response
5. If they are busy or not interested, be respectful and offer to call back at a better time
6. Before ending, summarize any next steps or action items

## GUIDELINES
- Be concise and respectful of their time
- If they ask you to stop calling or express disinterest, respect that immediately and politely end the call
- If you reach voicemail, leave a brief message with the reason for calling and how to reach back
- Do not be pushy or aggressive
- Capture any information they provide (email, preferred callback time, decisions made, etc.)
- If the call reason involves scheduling, offer to check availability and book an appointment
- Always maintain a professional and friendly tone
- If they have questions you cannot answer, offer to have someone follow up with more details`;

    const outboundGreeting = `Hi, is this {{customer_name}}? This is ${agentName} from ${businessName}.`;

    const updateLlmStart = Date.now();
    const updateLlmRes = await fetch(`https://api.retellai.com/update-retell-llm/${outboundLlmId}`, {
      method: 'PATCH', headers: retellHeaders,
      body: JSON.stringify({
        general_prompt: outboundPrompt,
        begin_message: outboundGreeting,
      }),
    });
    const updateLlmMs = Date.now() - updateLlmStart;

    if (!updateLlmRes.ok) {
      const err = await updateLlmRes.text();
      console.warn('Failed to update outbound LLM prompt (non-fatal):', err);
      await logApiCall({ serviceName: 'retell', endpoint: '/update-retell-llm', method: 'PATCH', statusCode: updateLlmRes.status, responseTimeMs: updateLlmMs, organizationId, userId, errorMessage: err.substring(0, 500), metadata: { function: 'make-outbound-call', step: 'update-outbound-llm' } });
    } else {
      await logApiCall({ serviceName: 'retell', endpoint: '/update-retell-llm', method: 'PATCH', statusCode: 200, responseTimeMs: updateLlmMs, organizationId, userId, metadata: { function: 'make-outbound-call', step: 'update-outbound-llm' } });

      // Store the outbound prompt in DB
      await supabase.from('voice_agent_configs').update({
        outbound_general_prompt: outboundPrompt,
        outbound_begin_message: outboundGreeting,
      }).eq('organization_id', organizationId);
    }
  }

  // 4. Save outbound agent ID in DB
  await supabase.from('voice_agent_configs').update({
    outbound_agent_id: outboundAgentId,
    outbound_llm_id: outboundLlmId,
    updated_at: new Date().toISOString(),
  }).eq('organization_id', organizationId);

  console.log(`[Outbound] Created outbound agent ${outboundAgentId} for org ${organizationId}`);
  return { agentId: outboundAgentId, llmId: outboundLlmId };
}

// ============================================================
// MAIN HANDLER
// ============================================================
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const body: OutboundCallRequest = await req.json();
    const { organizationId, toNumber, customerId, customerName, callReason, callContext, overrideAgentId, metadata } = body;

    if (!organizationId) throw new Error('Missing organizationId');
    if (!toNumber) throw new Error('Missing toNumber');

    // Verify user belongs to org
    const { data: membership } = await supabaseClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) throw new Error('Not a member of this organization');

    // Get voice agent config (including outbound agent ID)
    const { data: config, error: configError } = await supabaseClient
      .from('voice_agent_configs')
      .select('retell_agent_id, outbound_agent_id, retell_phone_number, is_active, agent_name, business_name')
      .eq('organization_id', organizationId)
      .maybeSingle();
    if (configError || !config) throw new Error('Voice agent not configured');
    if (!config.is_active) throw new Error('Voice agent is not active');
    if (!config.retell_agent_id) throw new Error('No Retell agent ID configured');
    if (!config.retell_phone_number) throw new Error('No phone number assigned to agent');

    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    if (!RETELL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Voice AI is not configured.', notConfigured: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedTo = formatE164(toNumber);

    // Determine which agent to use for the outbound call
    let agentId: string;
    if (overrideAgentId) {
      // Explicit override takes priority
      agentId = overrideAgentId;
    } else if (config.outbound_agent_id) {
      // Use existing outbound agent
      agentId = config.outbound_agent_id;
    } else {
      // Auto-create outbound agent (first outbound call for this org)
      console.log(`[Outbound] No outbound agent found for org ${organizationId}, creating one...`);
      const result = await createOutboundAgent({
        supabase: supabaseClient,
        retellApiKey: RETELL_API_KEY,
        organizationId,
        userId: user.id,
        inboundAgentId: config.retell_agent_id,
        agentName: config.agent_name || 'AI Assistant',
        businessName: config.business_name || 'Our Company',
      });
      agentId = result.agentId;
    }

    // Build dynamic variables for the outbound agent
    const dynamicVars: Record<string, string> = {
      customer_name: customerName || 'there',
      customer_id: customerId || '',
      call_reason: callReason || 'a follow-up regarding your recent inquiry',
      customer_context: callContext || 'No additional context provided.',
    };

    // Call Retell API to create outbound phone call
    const retellBody: Record<string, unknown> = {
      from_number: config.retell_phone_number,
      to_number: formattedTo,
      override_agent_id: agentId,
      retell_llm_dynamic_variables: dynamicVars,
      metadata: {
        organization_id: organizationId,
        customer_id: customerId || null,
        initiated_by: user.id,
        direction: 'outbound',
        call_reason: callReason || null,
        ...(metadata || {}),
      },
    };

    const start = Date.now();
    const retellRes = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(retellBody),
    });
    const ms = Date.now() - start;

    if (!retellRes.ok) {
      const errText = await retellRes.text();
      await logApiCall({
        serviceName: 'retell', endpoint: '/v2/create-phone-call', method: 'POST',
        statusCode: retellRes.status, responseTimeMs: ms,
        organizationId, userId: user.id,
        errorMessage: errText.substring(0, 500),
        metadata: { function: 'make-outbound-call', toNumber: formattedTo },
      });
      throw new Error(`Retell API error (${retellRes.status}): ${errText}`);
    }

    const retellData = await retellRes.json();
    await logApiCall({
      serviceName: 'retell', endpoint: '/v2/create-phone-call', method: 'POST',
      statusCode: 200, responseTimeMs: ms,
      organizationId, userId: user.id,
      metadata: {
        function: 'make-outbound-call',
        toNumber: formattedTo,
        callId: retellData.call_id,
        agentId,
        isOutboundAgent: agentId !== config.retell_agent_id,
      },
    });

    // Pre-create call record in DB so it's tracked immediately
    const { data: callRecord } = await supabaseClient.from('calls').insert({
      organization_id: organizationId,
      customer_id: customerId || null,
      phone_number: formattedTo,
      direction: 'outbound',
      call_type: 'ai_agent',
      agent_id: agentId,
      agent_name: config.agent_name || 'AI Assistant',
      status: 'in_progress',
      started_at: new Date().toISOString(),
      retell_call_id: retellData.call_id || null,
      user_id: user.id,
      notes: callReason ? `Outbound call reason: ${callReason}` : null,
    }).select('id').maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        callId: retellData.call_id,
        callRecordId: callRecord?.id || null,
        fromNumber: config.retell_phone_number,
        toNumber: formattedTo,
        agentId,
        agentName: config.agent_name,
        status: retellData.call_status || 'initiated',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Make Outbound Call Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
