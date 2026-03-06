/**
 * Shared CORS configuration for edge functions.
 *
 * - Authenticated app endpoints: restrict to known origins
 * - Webhook/public endpoints: allow all origins (use getCorsHeaders('*'))
 */

const ALLOWED_ORIGINS = [
  'https://crm.cxtrack.com',
  'https://cxtrack.com',
  'https://www.cxtrack.com',
  // Legacy domain (301 redirects active, but keep for transition)
  'https://crm.easyaicrm.com',
  // Local development
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

/**
 * Get CORS headers for a request.
 *
 * @param reqOrOrigin - Either a Request object (extracts Origin header) or '*' for open endpoints
 * @returns CORS headers object
 */
export function getCorsHeaders(reqOrOrigin: Request | '*'): Record<string, string> {
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
    // Vary on Origin so proxies/CDNs cache per-origin
    ...(allowedOrigin !== '*' ? { 'Vary': 'Origin' } : {}),
  }
}

/**
 * Build a preflight (OPTIONS) response.
 */
export function corsPreflightResponse(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  })
}

/**
 * Build a preflight (OPTIONS) response for open/webhook endpoints.
 */
export function corsPreflightResponseOpen(): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders('*'),
  })
}
