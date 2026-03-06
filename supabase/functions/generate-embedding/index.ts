import { createClient } from 'jsr:@supabase/supabase-js@2'
import { logApiCall } from '../_shared/api-logger.ts'
import { getCorsHeaders, corsPreflightResponse } from '../_shared/cors.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Whitelist of tables that can have embeddings stored -- prevents SQL injection
const ALLOWED_TABLES = ['call_summaries', 'copilot_memory'] as const
type AllowedTable = (typeof ALLOWED_TABLES)[number]

// Special mode: return embedding without storing
const QUERY_ONLY_TABLE = '_query_only'

const MAX_TEXT_LENGTH = 30_000 // ~7,500 tokens at 4 chars/token
const EMBEDDING_MODEL = 'openai/text-embedding-3-small'
const EMBEDDING_DIMENSION = 1536

interface EmbeddingRequest {
  text: string
  table_name: string // AllowedTable or '_query_only'
  record_id: string
  column_name?: string // Default: 'embedding'
  organization_id?: string // For logging
}

interface OpenRouterEmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>
  model: string
  usage: { prompt_tokens: number; total_tokens: number }
}

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(req)
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  // Authenticate: only service_role calls allowed
  // Verify by creating a client with the caller's token and checking admin access
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  try {
    const testClient = createClient(SUPABASE_URL, token, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    // Service role key can list users; anon/user JWTs cannot
    const { error: authErr } = await testClient.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (authErr) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!OPENROUTER_API_KEY) {
    console.error('[generate-embedding] OPENROUTER_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Embedding service not configured' }), { status: 500 })
  }

  let body: EmbeddingRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { text, table_name, record_id, column_name = 'embedding', organization_id } = body

  // Validate inputs
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return new Response(JSON.stringify({ error: 'Text too short (min 10 chars)' }), { status: 400 })
  }

  const isQueryOnly = table_name === QUERY_ONLY_TABLE
  if (!isQueryOnly) {
    if (!ALLOWED_TABLES.includes(table_name as AllowedTable)) {
      return new Response(
        JSON.stringify({ error: `Table '${table_name}' not in allowed list` }),
        { status: 400 },
      )
    }
    if (!record_id || record_id === 'none') {
      return new Response(JSON.stringify({ error: 'record_id required for storage mode' }), { status: 400 })
    }
  }

  // Truncate if too long
  let inputText = text.trim()
  if (inputText.length > MAX_TEXT_LENGTH) {
    console.warn(`[generate-embedding] Text truncated from ${inputText.length} to ${MAX_TEXT_LENGTH} chars`)
    inputText = inputText.substring(0, MAX_TEXT_LENGTH)
  }

  // Call OpenRouter embedding API
  const startMs = Date.now()
  let embeddingVector: number[]
  let tokensUsed = 0

  try {
    const response = await callOpenRouterEmbedding(inputText)

    if (!response.ok) {
      const errText = await response.text()

      // Retry once on rate limit
      if (response.status === 429) {
        console.warn('[generate-embedding] Rate limited, retrying in 1s...')
        await new Promise((r) => setTimeout(r, 1000))
        const retry = await callOpenRouterEmbedding(inputText)
        if (!retry.ok) {
          const retryErr = await retry.text()
          logApiCall({
            serviceName: 'openrouter',
            endpoint: '/v1/embeddings',
            method: 'POST',
            statusCode: retry.status,
            responseTimeMs: Date.now() - startMs,
            organizationId: organization_id,
            errorMessage: retryErr,
          })
          return new Response(JSON.stringify({ error: 'Embedding API rate limited' }), { status: 429 })
        }
        const retryResult: OpenRouterEmbeddingResponse = await retry.json()
        embeddingVector = retryResult.data[0].embedding
        tokensUsed = retryResult.usage?.total_tokens || 0
      } else {
        logApiCall({
          serviceName: 'openrouter',
          endpoint: '/v1/embeddings',
          method: 'POST',
          statusCode: response.status,
          responseTimeMs: Date.now() - startMs,
          organizationId: organization_id,
          errorMessage: errText,
        })
        return new Response(JSON.stringify({ error: `Embedding API error: ${response.status}` }), {
          status: 502,
        })
      }
    } else {
      const result: OpenRouterEmbeddingResponse = await response.json()
      embeddingVector = result.data[0].embedding
      tokensUsed = result.usage?.total_tokens || 0
    }
  } catch (e) {
    console.error('[generate-embedding] OpenRouter call failed:', e)
    return new Response(JSON.stringify({ error: 'Embedding generation failed' }), { status: 500 })
  }

  // Validate embedding dimension
  if (!embeddingVector || embeddingVector.length !== EMBEDDING_DIMENSION) {
    console.error(
      `[generate-embedding] Unexpected dimension: ${embeddingVector?.length} (expected ${EMBEDDING_DIMENSION})`,
    )
    return new Response(JSON.stringify({ error: 'Invalid embedding dimension' }), { status: 500 })
  }

  const responseTimeMs = Date.now() - startMs

  // Log API usage
  logApiCall({
    serviceName: 'openrouter',
    endpoint: '/v1/embeddings',
    method: 'POST',
    statusCode: 200,
    responseTimeMs,
    tokensUsed,
    organizationId: organization_id,
    metadata: {
      model: EMBEDDING_MODEL,
      mode: isQueryOnly ? 'query_only' : 'store',
      table_name: isQueryOnly ? null : table_name,
      text_length: inputText.length,
    },
  })

  // Query-only mode: return the embedding without storing
  if (isQueryOnly) {
    return new Response(
      JSON.stringify({
        embedding: embeddingVector,
        model: EMBEDDING_MODEL,
        tokens_used: tokensUsed,
        response_time_ms: responseTimeMs,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Storage mode: update the target table with the embedding
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Format embedding as pgvector string: [0.1,0.2,0.3,...]
  const vectorString = `[${embeddingVector.join(',')}]`

  const { error: updateError } = await supabase
    .from(table_name)
    .update({ [column_name]: vectorString })
    .eq('id', record_id)

  if (updateError) {
    console.error(`[generate-embedding] Failed to store embedding in ${table_name}:`, updateError.message)
    return new Response(
      JSON.stringify({ error: `Failed to store embedding: ${updateError.message}` }),
      { status: 500 },
    )
  }

  return new Response(
    JSON.stringify({
      success: true,
      table: table_name,
      record_id,
      model: EMBEDDING_MODEL,
      tokens_used: tokensUsed,
      response_time_ms: responseTimeMs,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})

async function callOpenRouterEmbedding(text: string): Promise<Response> {
  return fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  })
}
