import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { file_path, bucket } = await req.json();

        if (!file_path || !bucket) {
            return new Response(
                JSON.stringify({ error: 'file_path and bucket are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create Supabase client with service role for storage access
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Download the image from storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(file_path);

        if (downloadError || !fileData) {
            return new Response(
                JSON.stringify({ error: 'Failed to download image: ' + (downloadError?.message || 'Unknown error') }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Convert to base64 for Google Vision API
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        // Call Google Cloud Vision API for text detection
        const googleApiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');

        if (!googleApiKey) {
            // Fallback: return empty fields with raw text extraction note
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Google Cloud Vision API key not configured',
                    contact: createEmptyContact(),
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const visionResponse = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [{
                        image: { content: base64Image },
                        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
                    }],
                }),
            }
        );

        if (!visionResponse.ok) {
            const errorText = await visionResponse.text();
            return new Response(
                JSON.stringify({ error: 'Vision API error: ' + errorText }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const visionData = await visionResponse.json();
        const rawText = visionData.responses?.[0]?.fullTextAnnotation?.text || '';

        // Parse the extracted text into contact fields
        const contact = parseBusinessCard(rawText);

        return new Response(
            JSON.stringify({ success: true, contact, raw_text: rawText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

function parseBusinessCard(text: string): ExtractedContact {
    const contact = createEmptyContact();
    contact.raw_text = text;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Extract email
    const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) contact.email = emailMatch[0].toLowerCase();

    // Extract phone number (North American format)
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) contact.phone = phoneMatch[0].replace(/[^\d+]/g, '');

    // Extract postal/zip code
    const postalRegex = /[A-Z]\d[A-Z]\s?\d[A-Z]\d/i; // Canadian
    const zipRegex = /\b\d{5}(?:-\d{4})?\b/; // US
    const postalMatch = text.match(postalRegex);
    const zipMatch = text.match(zipRegex);
    if (postalMatch) {
        contact.postal_code = postalMatch[0].toUpperCase();
        contact.country = 'Canada';
    } else if (zipMatch) {
        contact.postal_code = zipMatch[0];
        contact.country = 'United States';
    }

    // Extract name (usually the first or most prominent line)
    // Heuristic: first line that's NOT a company name (no Inc, Ltd, LLC, etc.) and NOT an email/phone
    for (const line of lines) {
        if (emailRegex.test(line) || phoneRegex.test(line)) continue;
        if (/(?:inc|ltd|llc|corp|co\.|company|group|associates|services|consulting|solutions|mortgage|realty|law\s+firm)/i.test(line)) {
            if (!contact.company) contact.company = line;
            continue;
        }
        if (/(?:www\.|\.com|\.ca|\.net|\.org)/i.test(line)) continue;
        if (postalRegex.test(line) || zipRegex.test(line)) continue;

        // Likely a name if it's short (2-4 words) and has capitalized words
        const words = line.split(/\s+/);
        if (words.length >= 2 && words.length <= 4 && !contact.first_name) {
            contact.first_name = words[0];
            contact.last_name = words.slice(1).join(' ');
            continue;
        }

        // Could be a job title or address — skip for now
    }

    // Try to find address (line with street number)
    for (const line of lines) {
        if (/^\d+\s+\w+/.test(line) && !emailRegex.test(line) && !phoneRegex.test(line)) {
            contact.address = line;
            break;
        }
    }

    return contact;
}
