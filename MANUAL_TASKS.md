# CxTrack CRM — Manual Tasks

Tasks that require manual action by the project owner. These cannot be automated.

---

## 1. Google Places API Key (Address Autocomplete)

**Status:** Wired up, needs API key

The AddressAutocomplete component is live in Profile Settings (Location) and Customer Form (Street Address). It needs a Google API key to activate.

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key
5. Restrict the key to HTTP referrers: `crm.easyaicrm.com/*`
6. In `.env` and `.env.production`, uncomment and set:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```
7. Rebuild and deploy

**Files involved:**
- `index.html` — loads Google Maps SDK at build time using `%VITE_GOOGLE_MAPS_API_KEY%`
- `src/components/ui/AddressAutocomplete.tsx` — the component (fully built, US/CA only)
- `.env` / `.env.production` — placeholder ready

---

## 2. Stripe Payment Integration

**Status:** Not configured

Stripe keys were previously in the codebase but have been deprecated. To enable payment processing:

1. Create a [Stripe account](https://stripe.com)
2. Get publishable + secret keys from the Stripe dashboard
3. Configure webhook endpoints for subscription events
4. Add keys to environment variables

---

## 3. Custom Domain SSL

**Status:** Active on crm.easyaicrm.com

Ensure SSL certificates are renewed and DNS records are properly configured.

---

## 4. Supabase Security Advisors

The following security items were flagged by Supabase advisors and should be reviewed:

- **Exposed Auth Users:** `admin_user_view` and `user_call_agents_with_users` views expose `auth.users` to anon/authenticated roles
- **Security Definer Views:** `admin_user_view`, `pipeline_values`, `user_call_agents_with_users` use SECURITY DEFINER
- **Mutable Search Paths:** Several functions (`calculate_pipeline_value`, `generate_document_number`, `add_activity`, etc.) have mutable search paths
- **Leaked Password Protection:** Currently disabled in Supabase Auth settings

See: https://supabase.com/docs/guides/database/database-linter

---

## 5. OpenAI API Key (AI CoPilot)

**Status:** Key exists in `envs/.env-public`

Verify the OpenAI API key is active and has sufficient credits for the AI CoPilot feature.

---

## 6. Email/SMTP Configuration

**Status:** Not configured

For sending invoices, quotes, and notifications via email, configure SMTP or an email service provider in Settings > Communications.
