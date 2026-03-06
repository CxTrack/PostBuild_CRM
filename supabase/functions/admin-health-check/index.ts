import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getCorsHeaders, corsPreflightResponse } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface HealthResult {
  service_name: string;
  status: 'up' | 'degraded' | 'down';
  response_time_ms: number;
  error_message: string | null;
  checked_at: string;
}

async function checkService(
  name: string,
  url: string,
  headers: Record<string, string>,
  method = 'GET',
  body?: string,
): Promise<HealthResult> {
  const checkedAt = new Date().toISOString();
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const ms = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        service_name: name,
        status: res.status >= 500 ? 'down' : 'degraded',
        response_time_ms: ms,
        error_message: `HTTP ${res.status}: ${errText.substring(0, 200)}`,
        checked_at: checkedAt,
      };
    }

    // Consume body to complete the request
    await res.text().catch(() => {});

    return {
      service_name: name,
      status: ms > 5000 ? 'degraded' : 'up',
      response_time_ms: ms,
      error_message: null,
      checked_at: checkedAt,
    };
  } catch (err: any) {
    return {
      service_name: name,
      status: 'down',
      response_time_ms: 0,
      error_message: err.message || 'Connection failed',
      checked_at: checkedAt,
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse(req);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth check - only admins can run health checks
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    // Verify admin
    const { data: adminCheck } = await supabase
      .from('admin_settings')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_admin', true)
      .maybeSingle();
    if (!adminCheck) throw new Error('Admin access required');

    // Run all health checks in parallel
    const checks: Promise<HealthResult>[] = [];

    // 1. OpenRouter - GET /api/v1/models (free, returns model list)
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (openRouterKey) {
      checks.push(
        checkService('openrouter', 'https://openrouter.ai/api/v1/models', {
          'Authorization': `Bearer ${openRouterKey}`,
        })
      );
    } else {
      checks.push(Promise.resolve({
        service_name: 'openrouter',
        status: 'down' as const,
        response_time_ms: 0,
        error_message: 'API key not configured',
        checked_at: new Date().toISOString(),
      }));
    }

    // 2. Retell - GET /list-voices (free, returns voice list)
    const retellKey = Deno.env.get('RETELL_API_KEY');
    if (retellKey) {
      checks.push(
        checkService('retell', 'https://api.retellai.com/list-voices', {
          'Authorization': `Bearer ${retellKey}`,
        })
      );
    } else {
      checks.push(Promise.resolve({
        service_name: 'retell',
        status: 'down' as const,
        response_time_ms: 0,
        error_message: 'API key not configured',
        checked_at: new Date().toISOString(),
      }));
    }

    // 3. Twilio - GET /Accounts/{SID}.json (free, returns account info)
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (twilioSid && twilioAuth) {
      checks.push(
        checkService(
          'twilio',
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`,
          { 'Authorization': `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}` }
        )
      );
    } else {
      checks.push(Promise.resolve({
        service_name: 'twilio',
        status: 'down' as const,
        response_time_ms: 0,
        error_message: 'Credentials not configured',
        checked_at: new Date().toISOString(),
      }));
    }

    // 4. Google Vision - minimal annotate call (near-free: 1x1 pixel)
    const googleKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (googleKey) {
      // Tiny 1x1 white PNG in base64
      const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      checks.push(
        checkService(
          'google_vision',
          `https://vision.googleapis.com/v1/images:annotate?key=${googleKey}`,
          { 'Content-Type': 'application/json' },
          'POST',
          JSON.stringify({
            requests: [{ image: { content: tinyPng }, features: [{ type: 'TEXT_DETECTION', maxResults: 1 }] }],
          })
        )
      );
    } else {
      checks.push(Promise.resolve({
        service_name: 'google_vision',
        status: 'down' as const,
        response_time_ms: 0,
        error_message: 'API key not configured',
        checked_at: new Date().toISOString(),
      }));
    }

    // 5. Resend - GET /domains (free, returns domain list)
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      checks.push(
        checkService('resend', 'https://api.resend.com/domains', {
          'Authorization': `Bearer ${resendKey}`,
        })
      );
    } else {
      checks.push(Promise.resolve({
        service_name: 'resend',
        status: 'down' as const,
        response_time_ms: 0,
        error_message: 'API key not configured',
        checked_at: new Date().toISOString(),
      }));
    }

    // 6. Stripe - GET /v1/balance (free, returns account balance)
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (stripeKey) {
      checks.push(
        checkService('stripe', 'https://api.stripe.com/v1/balance', {
          'Authorization': `Bearer ${stripeKey}`,
        })
      );
    } else {
      checks.push(Promise.resolve({
        service_name: 'stripe',
        status: 'down' as const,
        response_time_ms: 0,
        error_message: 'API key not configured',
        checked_at: new Date().toISOString(),
      }));
    }

    const results = await Promise.all(checks);

    // Persist results to DB
    const inserts = results.map((r) => ({
      service_name: r.service_name,
      status: r.status,
      response_time_ms: r.response_time_ms,
      error_message: r.error_message,
      checked_at: r.checked_at,
      checked_by: user.id,
    }));

    await supabase.from('service_health_checks').insert(inserts);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        checked_by: user.email,
        checked_at: new Date().toISOString(),
      }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
