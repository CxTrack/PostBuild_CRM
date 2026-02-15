# GEMINI TASK 6: Business Card Scanner with OCR (Mobile)

## STRICT RULES
1. Only modify/create the files listed below
2. Run `npm run build` after ALL changes — must pass with zero errors
3. Do NOT remove or change any existing functionality
4. The camera/OCR features should be MOBILE ONLY — hidden on desktop
5. Use the existing Supabase client from `@/lib/supabase`
6. Use Tailwind responsive classes (`md:hidden`) for mobile-only visibility
7. Commit message format: `feat: mobile business card scanner with OCR auto-extract`

---

## CONTEXT
Users want to take a picture of a business card on their phone and have it auto-create a contact. This feature:
- Only appears on mobile devices (hidden on desktop)
- Captures an image via the device camera
- Uploads to Supabase Storage
- Sends to a Supabase Edge Function for OCR text extraction
- Auto-extracts: name, email, phone, company, address
- Pre-fills the CustomerModal with extracted data
- User reviews and confirms before saving

**Prerequisites:**
- GEMINI TASK 5 must be completed first (establishes Supabase Storage patterns)
- A Supabase Edge Function will be created for OCR processing

---

## SUB-TASK A: Create Supabase Storage Bucket for Business Cards

### Instructions (Supabase Dashboard → Storage):

1. Go to: https://supabase.com/dashboard/project/zkpfzrbbupgiqkzqydji/storage/buckets
2. Click "New Bucket"
3. Name: `business-cards`
4. Public: **OFF** (private)
5. File size limit: 10MB
6. Allowed MIME types: `image/jpeg, image/png, image/webp`

### Storage RLS Policies (SQL Editor):

```sql
-- Allow authenticated users to upload business cards to their org folder
CREATE POLICY "Users can upload business cards to their org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'business-cards'
    AND (storage.foldername(name))[1] IN (
        SELECT o.id::text FROM organizations o
        JOIN organization_members om ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
    )
);

-- Allow authenticated users to view business cards in their org folder
CREATE POLICY "Users can view business cards in their org folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'business-cards'
    AND (storage.foldername(name))[1] IN (
        SELECT o.id::text FROM organizations o
        JOIN organization_members om ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
    )
);

-- Allow authenticated users to delete business cards in their org folder
CREATE POLICY "Users can delete business cards in their org folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'business-cards'
    AND (storage.foldername(name))[1] IN (
        SELECT o.id::text FROM organizations o
        JOIN organization_members om ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
    )
);
```

---

## SUB-TASK B: Add `card_image_url` Column to Customers Table

### Migration SQL:

```sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS card_image_url TEXT;
```

### Also update the TypeScript Customer type

**File:** `src/types/app.types.ts`

Find the `Customer` interface and add:
```tsx
card_image_url?: string;
```

Add it near the other optional URL fields (after `avatar_url` or similar).

---

## SUB-TASK C: Create Supabase Edge Function for OCR

**Create new Edge Function:** `supabase/functions/ocr-extract/index.ts`

This Edge Function receives a Supabase Storage file path, downloads the image, and uses Google Cloud Vision API to extract text, then parses it into structured contact fields.

```typescript
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
```

### Deploy the Edge Function

Deploy using Supabase CLI or Supabase Dashboard:
```bash
supabase functions deploy ocr-extract --no-verify-jwt
```

**Important:** Set the `GOOGLE_CLOUD_VISION_API_KEY` as a secret in the Edge Function:
```bash
supabase secrets set GOOGLE_CLOUD_VISION_API_KEY=AIzaSyBFeuGL2HnbR5qyni7Rfa8fhsPtSwoye8w
```

**Note about the API key:** The same Google API key may work for Vision API if it's enabled in Google Cloud Console. If not, a separate key may be needed. The developer should check Google Cloud Console → APIs & Services → Enable "Cloud Vision API".

---

## SUB-TASK D: Create BusinessCardCapture Component

**Create new file:** `src/components/customers/BusinessCardCapture.tsx`

```tsx
/**
 * BusinessCardCapture - Mobile-only component for scanning business cards
 * Shows a FAB (floating action button) on mobile viewports
 * Captures image → uploads to Supabase → sends to OCR Edge Function → returns extracted data
 */

import React, { useState, useRef } from 'react';
import { Camera, Loader2, X, AlertCircle, CreditCard, Check, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from '@/stores/organizationStore';

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

interface BusinessCardCaptureProps {
    onContactExtracted: (contact: ExtractedContact, imageUrl: string) => void;
}

export const BusinessCardCapture: React.FC<BusinessCardCaptureProps> = ({
    onContactExtracted,
}) => {
    const { currentOrganization } = useOrganizationStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showProcessing, setShowProcessing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [progress, setProgress] = useState<string>('');
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentOrganization?.id) return;

        // Show preview
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        setShowProcessing(true);
        setIsProcessing(true);
        setError(null);

        try {
            // Step 1: Upload to Supabase Storage
            setProgress('Uploading image...');
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${currentOrganization.id}/${timestamp}_${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from('business-cards')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw new Error('Failed to upload: ' + uploadError.message);

            // Step 2: Get a signed URL for the uploaded image
            const { data: signedUrlData } = await supabase.storage
                .from('business-cards')
                .createSignedUrl(path, 3600);

            const imageUrl = signedUrlData?.signedUrl || path;

            // Step 3: Call OCR Edge Function
            setProgress('Scanning card...');
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
            const stored = localStorage.getItem(storageKey);
            const token = stored ? JSON.parse(stored)?.access_token : null;

            const ocrResponse = await fetch(
                `${supabaseUrl}/functions/v1/ocr-extract`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        file_path: path,
                        bucket: 'business-cards',
                    }),
                }
            );

            if (!ocrResponse.ok) {
                const errorData = await ocrResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'OCR processing failed');
            }

            const ocrData = await ocrResponse.json();

            if (ocrData.success && ocrData.contact) {
                setProgress('Contact info extracted!');
                // Small delay so user sees the success message
                await new Promise(r => setTimeout(r, 800));
                onContactExtracted(ocrData.contact, path);
                resetState();
            } else {
                throw new Error(ocrData.error || 'Could not extract contact info from card');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to process business card');
            setIsProcessing(false);
        }

        // Reset file input
        e.target.value = '';
    };

    const resetState = () => {
        setShowProcessing(false);
        setIsProcessing(false);
        setError(null);
        setPreview(null);
        setProgress('');
    };

    // Processing overlay
    if (showProcessing) {
        return (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:hidden">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                    {/* Card image preview */}
                    {preview && (
                        <div className="bg-gray-100 dark:bg-gray-900">
                            <img
                                src={preview}
                                alt="Business card"
                                className="w-full max-h-48 object-contain"
                            />
                        </div>
                    )}

                    <div className="p-6">
                        {isProcessing ? (
                            <div className="text-center">
                                <Loader2 size={40} className="text-blue-600 animate-spin mx-auto mb-3" />
                                <p className="font-medium text-gray-900 dark:text-white">{progress}</p>
                                <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                            </div>
                        ) : error ? (
                            <div className="text-center">
                                <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
                                <p className="font-medium text-red-600 dark:text-red-400">{error}</p>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center"
                                    >
                                        <RotateCcw size={16} className="mr-2" />
                                        Retry
                                    </button>
                                    <button
                                        onClick={resetState}
                                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Check size={40} className="text-green-500 mx-auto mb-3" />
                                <p className="font-medium text-green-600">Contact extracted!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hidden camera input for retry */}
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCapture}
                    className="hidden"
                />
            </div>
        );
    }

    // FAB — only visible on mobile
    return (
        <>
            <button
                onClick={() => cameraInputRef.current?.click()}
                className="md:hidden fixed bottom-24 right-6 z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                title="Scan Business Card"
            >
                <CreditCard size={24} />
            </button>

            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
            />
        </>
    );
};

export default BusinessCardCapture;
```

---

## SUB-TASK E: Wire BusinessCardCapture into Customers Page

**File:** `src/pages/Customers.tsx`

### E1. Add imports (top of file, after existing imports around line 21)

**After line 21 (`import { useConfirmDialog } from '@/components/ui/ConfirmDialog';`), add:**
```tsx
import BusinessCardCapture from '@/components/customers/BusinessCardCapture';
```

### E2. Add handler for extracted contact data

**Inside the `Customers` component (after the existing state declarations, approximately after line 30), add:**

```tsx
// Business card scanner handler
const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
const [prefillData, setPrefillData] = useState<any>(null);

const handleCardExtracted = (contact: any, imageUrl: string) => {
    setCardImageUrl(imageUrl);
    setPrefillData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        address: contact.address || '',
        city: contact.city || '',
        state: contact.state || '',
        postal_code: contact.postal_code || '',
        country: contact.country || '',
        card_image_url: imageUrl,
    });
    setShowCustomerModal(true);
};
```

### E3. Pass prefill data to CustomerModal

Find where `CustomerModal` is rendered in the JSX (search for `<CustomerModal`). It should look something like:

```tsx
<CustomerModal
    isOpen={showCustomerModal}
    onClose={() => setShowCustomerModal(false)}
/>
```

**Update it to pass the prefill data as a customer prop:**
```tsx
<CustomerModal
    isOpen={showCustomerModal}
    onClose={() => {
        setShowCustomerModal(false);
        setPrefillData(null);
        setCardImageUrl(null);
    }}
    customer={prefillData || undefined}
/>
```

### E4. Add BusinessCardCapture component to the JSX

**At the end of the component's return JSX (just before the closing `</PageContainer>` or similar wrapper), add:**

```tsx
{/* Mobile Business Card Scanner FAB */}
<BusinessCardCapture onContactExtracted={handleCardExtracted} />
```

---

## SUB-TASK F: Update CustomerModal to Accept card_image_url

**File:** `src/components/customers/CustomerModal.tsx`

The CustomerModal already accepts a `customer` prop (used for editing). When `prefillData` is passed from the business card scanner, it will pre-fill the fields automatically thanks to the existing `useState` initialization and `useEffect` block that we updated in GEMINI TASK 4.

However, we need to add `card_image_url` to the formData and display the card image reference.

### F1. Add card_image_url to formData (in the state initialization and useEffect)

Add to the `useState` initialization (alongside the address fields from Task 4):
```tsx
card_image_url: customer?.card_image_url || '',
```

Add the same to the `useEffect` reset block.

### F2. Show the card image reference in the modal (optional but nice)

After the header section (line 154-164) and before the form, add:

```tsx
{formData.card_image_url && (
    <div className="mx-6 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Business Card Reference:</p>
        <img
            src={formData.card_image_url}
            alt="Business card"
            className="w-full max-h-32 object-contain rounded"
        />
    </div>
)}
```

**Note:** The `card_image_url` from the scanner will be a Supabase Storage path. For it to display as an image, we'd need a signed URL. Since the `BusinessCardCapture` component already gets a signed URL, you should pass the signed URL (not the storage path) as the `card_image_url` in `prefillData`. Update the `handleCardExtracted` in Customers.tsx to use the signed URL for display.

---

## SUB-TASK G: Enable Google Cloud Vision API

### Manual Steps (Google Cloud Console):

1. Go to: https://console.cloud.google.com/
2. Select your project (or create one)
3. Navigate to: APIs & Services → Library
4. Search for "Cloud Vision API"
5. Click "Enable"
6. The existing Google Maps API key may work, or create a new one restricted to Vision API
7. Set the key as an Edge Function secret:
   ```bash
   supabase secrets set GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key
   ```

---

## VERIFICATION CHECKLIST

After making ALL changes:

1. Run `npm run build` — must pass with zero TypeScript errors
2. **Prerequisites must be done first:**
   - Supabase storage bucket `business-cards` created with RLS policies
   - Edge Function `ocr-extract` deployed
   - Google Cloud Vision API enabled and key set as Edge Function secret
   - `card_image_url` column added to customers table
3. **Test on mobile device or Chrome DevTools mobile emulator:**
   - Navigate to `/dashboard/customers`
   - A floating blue/purple button with a credit card icon should appear at bottom-right
   - On desktop (resize to >768px) — FAB should be hidden
   - Tap the FAB — camera opens
   - Take a photo of a business card
   - Processing overlay shows: "Uploading image..." → "Scanning card..." → "Contact info extracted!"
   - CustomerModal opens with pre-filled fields (name, email, phone, company)
   - The business card image shows as a reference at the top of the modal
   - Edit/correct any fields, then save
   - Customer is created with all fields + `card_image_url`
4. **Error handling:**
   - Test with a blurry/unreadable card — should show error with Retry option
   - Test with no network — should show error message
   - Cancel button should close the processing overlay

---

## FILES SUMMARY

| File | Action | Changes |
|------|--------|---------|
| `src/components/customers/BusinessCardCapture.tsx` | CREATE | Mobile FAB + camera capture + OCR processing overlay |
| `src/pages/Customers.tsx` | MODIFY | Import BusinessCardCapture, add handler, wire FAB + prefill data to CustomerModal |
| `src/components/customers/CustomerModal.tsx` | MODIFY | Add `card_image_url` to formData, show card image reference |
| `src/types/app.types.ts` | MODIFY | Add `card_image_url?: string` to Customer interface |
| `supabase/functions/ocr-extract/index.ts` | CREATE | Edge Function for Google Vision OCR + business card text parsing |
| Supabase Dashboard | MANUAL | Create `business-cards` bucket + RLS policies, deploy Edge Function, set Vision API key secret |
| Google Cloud Console | MANUAL | Enable Cloud Vision API |

---

## ARCHITECTURE NOTES

### Why an Edge Function instead of client-side OCR?
1. **Security:** The Google Cloud Vision API key stays server-side (not exposed to the browser)
2. **Performance:** Server-side processing is faster and doesn't depend on device capability
3. **Flexibility:** Easy to swap OCR providers later (Google Vision → Anthropic Vision → Tesseract)
4. **Cost control:** Edge Function can add rate limiting, caching, etc.

### Why mobile-only?
1. Business card scanning is inherently a mobile use case — you're at a meeting/event and want to capture cards
2. Desktop users can simply type contact info or use CSV import
3. Keeps the desktop UI clean

### Future enhancements:
- Add a "Scan History" tab showing previously scanned cards
- Batch scanning (scan multiple cards in sequence)
- Integration with CRM pipeline (auto-create a deal when scanning a card)
- Support for multi-language business cards
