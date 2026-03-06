import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import { logApiCall } from "../_shared/api-logger.ts";
import { getCorsHeaders, corsPreflightResponse } from '../_shared/cors.ts'

interface ExtractedContact {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    raw_text: string;
}

const SYSTEM_PROMPT = `You are a business card OCR extraction system. Given an image of a business card, extract all contact information into a structured JSON object.

Return ONLY valid JSON with these exact fields (use empty string "" for any field not found):
{
  "first_name": "",
  "last_name": "",
  "email": "",
  "phone": "",
  "company": "",
  "address": "",
  "city": "",
  "state": "",
  "postal_code": "",
  "country": "",
  "raw_text": ""
}

Rules:
- "raw_text" should contain ALL text visible on the card, separated by newlines
- "email" must be lowercase
- "phone" should include country code if visible (e.g. +1 for North American), digits and + only, no dashes or spaces
- If you see a Canadian postal code (e.g. K1A 0B1), set country to "Canada"
- If you see a US zip code, set country to "United States"
- Separate first_name and last_name (do not put full name in first_name)
- "address" should be the street address only (not city/state/postal)
- Do NOT include job titles in the name fields
- Return ONLY the JSON object, no markdown, no explanation`;

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return corsPreflightResponse(req);
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid or expired token' }),
                { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
            );
        }

        const { file_path, bucket } = await req.json();

        if (!file_path || !bucket) {
            return new Response(
                JSON.stringify({ error: 'file_path and bucket are required' }),
                { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
            );
        }

        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
        if (!openRouterKey) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'AI service not configured. OPENROUTER_API_KEY secret is missing.',
                    contact: createEmptyContact(),
                }),
                { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
            );
        }

        // Download the image from storage
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(file_path);

        if (downloadError || !fileData) {
            return new Response(
                JSON.stringify({ error: 'Failed to download image: ' + (downloadError?.message || 'Unknown error') }),
                { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
            );
        }

        // Convert to base64 data URL for vision model
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Image = encodeBase64(new Uint8Array(arrayBuffer));

        // Detect MIME type from file extension
        const ext = file_path.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeMap: Record<string, string> = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
        };
        const mimeType = mimeMap[ext] || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        // Call OpenRouter with a vision-capable model
        const ocrStart = Date.now();
        const ocrResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://crm.cxtrack.com',
                'X-Title': 'CxTrack CRM',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: { url: dataUrl },
                            },
                            {
                                type: 'text',
                                text: 'Extract all contact information from this business card image. Return ONLY the JSON object.',
                            },
                        ],
                    },
                ],
                temperature: 0,
                max_tokens: 1000,
            }),
        });

        const responseTimeMs = Date.now() - ocrStart;

        if (!ocrResponse.ok) {
            const errorText = await ocrResponse.text();
            logApiCall({
                serviceName: 'openrouter_vision', endpoint: '/v1/chat/completions',
                method: 'POST', statusCode: ocrResponse.status, responseTimeMs,
                errorMessage: errorText,
            });
            return new Response(
                JSON.stringify({ error: 'OCR service error: ' + errorText }),
                { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
            );
        }

        const ocrData = await ocrResponse.json();
        logApiCall({
            serviceName: 'openrouter_vision', endpoint: '/v1/chat/completions',
            method: 'POST', statusCode: 200, responseTimeMs,
        });

        const content = ocrData.choices?.[0]?.message?.content || '';
        const tokensUsed = ocrData.usage?.total_tokens || 0;

        // Parse the LLM JSON response
        const contact = parseLLMResponse(content);

        return new Response(
            JSON.stringify({ success: true, contact, raw_text: contact.raw_text, tokensUsed }),
            { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        );
    }
});

function createEmptyContact(): ExtractedContact {
    return {
        first_name: '', last_name: '', email: '', phone: '',
        company: '', address: '', city: '', state: '',
        postal_code: '', country: '', raw_text: '',
    };
}

function parseLLMResponse(content: string): ExtractedContact {
    const empty = createEmptyContact();

    try {
        // Strip markdown code fences if present
        let json = content.trim();
        if (json.startsWith('```')) {
            json = json.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(json);

        return {
            first_name: String(parsed.first_name || '').trim(),
            last_name: String(parsed.last_name || '').trim(),
            email: String(parsed.email || '').trim().toLowerCase(),
            phone: String(parsed.phone || '').trim().replace(/[^\d+]/g, ''),
            company: String(parsed.company || '').trim(),
            address: String(parsed.address || '').trim(),
            city: String(parsed.city || '').trim(),
            state: String(parsed.state || '').trim(),
            postal_code: String(parsed.postal_code || '').trim(),
            country: String(parsed.country || '').trim(),
            raw_text: String(parsed.raw_text || '').trim(),
        };
    } catch {
        console.error('[ocr-extract] Failed to parse LLM response as JSON:', content);
        empty.raw_text = content;
        return empty;
    }
}
