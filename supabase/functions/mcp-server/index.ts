/**
 * CxTrack MCP Server
 * Model Context Protocol (MCP) server exposing CRM data to external AI tools.
 * Uses Streamable HTTP transport (JSON-RPC 2.0 over HTTP POST).
 *
 * Auth: Bearer token -> SHA-256 hash -> api_keys lookup -> org_id extraction
 * Rate limited per API key (100 req/hr default).
 * Read-only: no CRM mutations via MCP.
 * Multi-tenant: each API key is scoped to one organization.
 */

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MCP_PROTOCOL_VERSION = '2024-11-05'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// ─── Tool Definitions ───────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_customers',
    description: 'Search customers by name, email, or phone number. Returns matching customer records.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term to match against name, email, or phone' },
        limit: { type: 'number', description: 'Max results to return (default 10, max 50)', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_customer_detail',
    description: 'Get full details for a specific customer including recent activity, open tasks, pipeline items, invoices, and call history.',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string', description: 'UUID of the customer' },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'list_recent_calls',
    description: 'List recent calls with summaries, optionally filtered by customer.',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string', description: 'Optional UUID to filter calls by customer' },
        limit: { type: 'number', description: 'Max results (default 10, max 50)', default: 10 },
      },
    },
  },
  {
    name: 'search_call_transcripts',
    description: 'Semantic search across call transcripts using vector similarity. Finds calls discussing specific topics.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language search query (e.g. "pricing discussion", "complaint about delivery")' },
        limit: { type: 'number', description: 'Max results (default 5, max 20)', default: 5 },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_pipeline',
    description: 'List pipeline deals grouped by stage with values and status.',
    inputSchema: {
      type: 'object',
      properties: {
        stage: { type: 'string', description: 'Filter by stage: lead, qualified, proposal, negotiation, closed_won, closed_lost' },
        limit: { type: 'number', description: 'Max results (default 20, max 50)', default: 20 },
      },
    },
  },
  {
    name: 'list_tasks',
    description: 'List open or overdue tasks, optionally filtered by assignee or priority.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: todo, in_progress, completed, overdue (default: open tasks)', default: 'open' },
        priority: { type: 'string', description: 'Filter by priority: low, medium, high, urgent' },
        limit: { type: 'number', description: 'Max results (default 20, max 50)', default: 20 },
      },
    },
  },
  {
    name: 'get_business_summary',
    description: 'Dashboard overview: customer count, active deals, pipeline value, outstanding invoices, overdue tasks, recent calls.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
]

// ─── Auth + Rate Limiting ───────────────────────────────────────────────────

interface AuthResult {
  orgId: string
  apiKeyId: string
  keyName: string
}

async function authenticateRequest(
  req: Request,
  supabase: SupabaseClient
): Promise<{ auth?: AuthResult; error?: string; status?: number }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 }
  }

  const token = authHeader.slice(7)
  if (!token || token.length < 20) {
    return { error: 'Invalid API key', status: 401 }
  }

  // Hash the token with SHA-256
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Look up key in api_keys table
  const { data: keyRow, error: keyErr } = await supabase
    .from('api_keys')
    .select('id, organization_id, name, permissions, is_active, expires_at')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (keyErr || !keyRow) {
    return { error: 'Invalid API key', status: 401 }
  }

  if (!keyRow.is_active) {
    return { error: 'API key is disabled', status: 403 }
  }

  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
    return { error: 'API key has expired', status: 403 }
  }

  // Check MCP permission
  const perms = keyRow.permissions || {}
  if (!perms.mcp) {
    return { error: 'API key does not have MCP access. Create a key with MCP permissions enabled.', status: 403 }
  }

  // Update last_used_at (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(() => {})

  // Check rate limit
  const { data: allowed } = await supabase.rpc('check_mcp_rate_limit', {
    p_api_key_id: keyRow.id,
    p_max_requests: 100,
    p_window_seconds: 3600,
  })

  if (allowed === false) {
    return { error: 'Rate limit exceeded. Max 100 requests per hour.', status: 429 }
  }

  return {
    auth: {
      orgId: keyRow.organization_id,
      apiKeyId: keyRow.id,
      keyName: keyRow.name,
    },
  }
}

// ─── Tool Implementations ───────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  args: Record<string, any>,
  orgId: string,
  supabase: SupabaseClient
): Promise<any> {
  switch (toolName) {

    case 'search_customers': {
      const query = args.query as string
      const limit = Math.min(args.limit || 10, 50)
      const pattern = `%${query}%`

      const { data, error } = await supabase
        .from('customers')
        .select('id, name, first_name, last_name, email, phone, company, status, type, priority, total_spent, created_at')
        .eq('organization_id', orgId)
        .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},company.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw new Error(`Search failed: ${error.message}`)
      return { customers: data || [], count: data?.length || 0 }
    }

    case 'get_customer_detail': {
      const customerId = args.customer_id as string

      // Use the existing copilot RPC for rich data
      const { data, error } = await supabase.rpc('copilot_query_crm_data', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // service context
        p_organization_id: orgId,
        p_role: 'owner', // full access via API key
        p_query_domain: 'customer_detail',
        p_filters: { customer_id: customerId },
      })

      if (error) throw new Error(`Customer detail failed: ${error.message}`)
      return data || { error: 'Customer not found' }
    }

    case 'list_recent_calls': {
      const limit = Math.min(args.limit || 10, 50)
      let query = supabase
        .from('calls')
        .select(`
          id, phone_number, direction, duration_seconds, status, outcome,
          sentiment, summary, created_at,
          customers!left(name, company),
          call_summaries!left(summary_text, sentiment, key_topics)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (args.customer_id) {
        query = query.eq('customer_id', args.customer_id)
      }

      const { data, error } = await query
      if (error) throw new Error(`List calls failed: ${error.message}`)
      return { calls: data || [], count: data?.length || 0 }
    }

    case 'search_call_transcripts': {
      const searchQuery = args.query as string
      const limit = Math.min(args.limit || 5, 20)

      // Generate query embedding
      const embResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-embedding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: searchQuery,
          table_name: '_query_only',
          record_id: 'none',
          organization_id: orgId,
        }),
      })

      if (!embResponse.ok) {
        throw new Error('Failed to generate search embedding')
      }

      const embResult = await embResponse.json()
      if (!embResult.embedding) {
        throw new Error('No embedding returned')
      }

      // Semantic search via RPC
      const { data: matches, error: matchErr } = await supabase.rpc('match_call_summaries', {
        query_embedding: embResult.embedding,
        p_organization_id: orgId,
        match_threshold: 0.4,
        match_count: limit,
      })

      if (matchErr) throw new Error(`Transcript search failed: ${matchErr.message}`)

      return {
        results: (matches || []).map((m: any) => ({
          similarity: Math.round(m.similarity * 100) / 100,
          summary: m.summary_text,
          sentiment: m.sentiment,
          topics: m.key_topics,
          caller_phone: m.caller_phone,
          duration_seconds: m.duration_ms ? Math.round(m.duration_ms / 1000) : null,
          date: m.created_at,
          transcript_preview: m.transcript?.substring(0, 800) || null,
        })),
        count: matches?.length || 0,
      }
    }

    case 'list_pipeline': {
      const limit = Math.min(args.limit || 20, 50)
      let query = supabase
        .from('pipeline_items')
        .select('id, title, value, stage, probability, expected_close_date, final_status, created_at, customers!left(name, company)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (args.stage) {
        query = query.eq('stage', args.stage)
      }

      const { data, error } = await query
      if (error) throw new Error(`List pipeline failed: ${error.message}`)

      // Group by stage for summary
      const byStage: Record<string, { count: number; totalValue: number }> = {}
      for (const item of data || []) {
        const s = item.stage || 'unknown'
        if (!byStage[s]) byStage[s] = { count: 0, totalValue: 0 }
        byStage[s].count++
        byStage[s].totalValue += item.value || 0
      }

      return { deals: data || [], count: data?.length || 0, by_stage: byStage }
    }

    case 'list_tasks': {
      const limit = Math.min(args.limit || 20, 50)
      const statusFilter = args.status || 'open'

      let query = supabase
        .from('tasks')
        .select('id, title, description, due_date, priority, status, category, created_at, customers!left(name)')
        .eq('organization_id', orgId)
        .order('due_date', { ascending: true })
        .limit(limit)

      if (statusFilter === 'open') {
        query = query.in('status', ['todo', 'in_progress'])
      } else if (statusFilter === 'overdue') {
        query = query
          .in('status', ['todo', 'in_progress'])
          .lt('due_date', new Date().toISOString())
      } else if (['todo', 'in_progress', 'completed', 'cancelled'].includes(statusFilter)) {
        query = query.eq('status', statusFilter)
      }

      if (args.priority) {
        query = query.eq('priority', args.priority)
      }

      const { data, error } = await query
      if (error) throw new Error(`List tasks failed: ${error.message}`)
      return { tasks: data || [], count: data?.length || 0 }
    }

    case 'get_business_summary': {
      const { data, error } = await supabase.rpc('copilot_query_crm_data', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_organization_id: orgId,
        p_role: 'owner',
        p_query_domain: 'dashboard_overview',
        p_filters: {},
      })

      if (error) throw new Error(`Business summary failed: ${error.message}`)
      return data || {}
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

// ─── JSON-RPC 2.0 Response Helpers ──────────────────────────────────────────

function jsonRpcResponse(id: string | number | null, result: any): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function jsonRpcError(id: string | number | null, code: number, message: string, data?: any): Response {
  return new Response(
    JSON.stringify({ jsonrpc: '2.0', id, error: { code, message, data } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Parse JSON-RPC request
  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonRpcError(null, -32700, 'Parse error: invalid JSON')
  }

  const { jsonrpc, method, params, id } = body

  if (jsonrpc !== '2.0') {
    return jsonRpcError(id, -32600, 'Invalid request: must be JSON-RPC 2.0')
  }

  // Handle initialize (no auth required)
  if (method === 'initialize') {
    return jsonRpcResponse(id, {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        tools: { listChanged: false },
      },
      serverInfo: {
        name: 'cxtrack-crm',
        version: '1.0.0',
      },
    })
  }

  // Handle notifications (no response needed)
  if (method === 'notifications/initialized') {
    return new Response('', { status: 204, headers: corsHeaders })
  }

  // All other methods require auth
  const { auth, error: authError, status: authStatus } = await authenticateRequest(req, supabase)
  if (authError || !auth) {
    return jsonRpcError(id, -32000, authError || 'Unauthorized', { status: authStatus })
  }

  switch (method) {

    case 'tools/list': {
      return jsonRpcResponse(id, { tools: TOOLS })
    }

    case 'tools/call': {
      const toolName = params?.name as string
      const toolArgs = params?.arguments || {}

      if (!toolName) {
        return jsonRpcError(id, -32602, 'Missing tool name')
      }

      const validToolNames = TOOLS.map(t => t.name)
      if (!validToolNames.includes(toolName)) {
        return jsonRpcError(id, -32602, `Unknown tool: ${toolName}. Available: ${validToolNames.join(', ')}`)
      }

      try {
        const result = await executeTool(toolName, toolArgs, auth.orgId, supabase)
        return jsonRpcResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        })
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e)
        console.error(`[mcp-server] Tool ${toolName} error:`, errMsg)
        return jsonRpcResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: errMsg }),
            },
          ],
          isError: true,
        })
      }
    }

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`)
  }
})
