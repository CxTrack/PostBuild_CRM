/**
 * HMAC-SHA256 utilities for signing and verifying opt-out URLs.
 * Uses Web Crypto API (available in Deno/Edge Runtime).
 */

const encoder = new TextEncoder()

/**
 * Generate HMAC-SHA256 signature for a payload string.
 */
export async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return arrayBufferToHex(signature)
}

/**
 * Verify HMAC-SHA256 signature for a payload string.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function hmacVerify(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(payload, secret)
  if (expected.length !== signature.length) return false
  // Constant-time comparison
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Build the HMAC payload for opt-out URLs.
 * Format: "customer_id:organization_id:timestamp"
 */
export function buildOptOutPayload(customerId: string, organizationId: string, timestamp: number): string {
  return `${customerId}:${organizationId}:${timestamp}`
}

/**
 * Generate a signed opt-out URL.
 */
export async function generateSignedOptOutUrl(
  baseUrl: string,
  customerId: string,
  organizationId: string,
  secret: string
): Promise<string> {
  const ts = Math.floor(Date.now() / 1000)
  const payload = buildOptOutPayload(customerId, organizationId, ts)
  const sig = await hmacSign(payload, secret)
  return `${baseUrl}/sms-opt-out?customer_id=${customerId}&organization_id=${organizationId}&ts=${ts}&sig=${sig}`
}

/**
 * Validate a signed opt-out request.
 * Returns { valid: true } or { valid: false, reason: string }.
 * Rejects signatures older than maxAgeDays (default 30).
 */
export async function validateOptOutSignature(
  customerId: string,
  organizationId: string,
  timestamp: number,
  signature: string,
  secret: string,
  maxAgeDays = 30
): Promise<{ valid: boolean; reason?: string }> {
  // Check timestamp is a number
  if (!timestamp || isNaN(timestamp)) {
    return { valid: false, reason: 'Missing or invalid timestamp' }
  }

  // Check signature is present
  if (!signature || typeof signature !== 'string') {
    return { valid: false, reason: 'Missing signature' }
  }

  // Check age
  const nowSeconds = Math.floor(Date.now() / 1000)
  const ageSeconds = nowSeconds - timestamp
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60

  if (ageSeconds > maxAgeSeconds) {
    return { valid: false, reason: 'Link has expired' }
  }

  if (ageSeconds < -300) {
    // More than 5 minutes in the future = clock skew attack
    return { valid: false, reason: 'Invalid timestamp' }
  }

  // Verify HMAC
  const payload = buildOptOutPayload(customerId, organizationId, timestamp)
  const isValid = await hmacVerify(payload, signature, secret)

  if (!isValid) {
    return { valid: false, reason: 'Invalid signature' }
  }

  return { valid: true }
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}
