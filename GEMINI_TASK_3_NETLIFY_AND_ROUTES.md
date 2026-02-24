# GEMINI TASK 3: Fix Netlify Build Failure + Products Route

## STRICT RULES
1. Only modify the files listed below — do NOT create new files unless explicitly told to
2. Use exact line numbers provided — verify them before editing
3. Run `npm run build` after ALL changes — must pass with zero errors
4. Do NOT remove or change any existing functionality
5. Do NOT hardcode user-facing strings — use the existing label system
6. Commit message format: `fix: netlify secrets scan + products route + CSP for Google Maps`

---

## CONTEXT
The Netlify deploy fails because secrets scanning detects the Google Maps API key in:
1. `.env` line 6 (hardcoded key committed to git)
2. `dist/index.html` (Vite injects the key at build time — this is expected behavior for a client-side Google Maps key)

Additionally, the Content-Security-Policy in `netlify.toml` blocks Google Maps API scripts/connections. And the "New Loan Product" button on the Products page navigates to a non-existent route, causing a redirect to the dashboard.

---

## SUB-TASK A: Fix `.env` — Remove Hardcoded API Key

**File:** `.env`

**Current (line 5-6):**
```
# Google Places API — uncomment and add your key to enable address autocomplete
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBFeuGL2HnbR5qyni7Rfa8fhsPtSwoye8w
```

**Replace with:**
```
# Google Places API — set this in Netlify dashboard env vars, not here
# VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

**Why:** The key should only exist as a Netlify environment variable (already configured in the Netlify dashboard). Removing it from `.env` prevents the secrets scanner from detecting it in source files. The key will still be available at build time from Netlify env vars.

---

## SUB-TASK B: Fix `.gitignore` — Prevent `.env` From Being Committed

**File:** `.gitignore`

**Current (lines 25-28):**
```
# Local Netlify folder
.netlify
deploy_crm
.env.production
```

**Replace with:**
```
# Local Netlify folder
.netlify
deploy_crm
.env
.env.production
.env.local
```

**Why:** The `.env` file should never be in version control. Adding `.env` and `.env.local` to `.gitignore` prevents accidental commits of secrets.

---

## SUB-TASK C: Fix `netlify.toml` — CSP + Secrets Scan Config

**File:** `netlify.toml`

### C1. Add secrets scan omit configuration

**After the existing `[build.environment]` section (lines 8-9), add the omit value:**

**Current:**
```toml
[build.environment]
  NETLIFY_NEXT_PLUGIN_SKIP = "true"
```

**Replace with:**
```toml
[build.environment]
  NETLIFY_NEXT_PLUGIN_SKIP = "true"
  SECRETS_SCAN_SMART_DETECTION_ENABLED = "false"
```

**Why:** Google Maps API keys are designed to be client-side (restricted by HTTP referrer in Google Cloud Console). They will always appear in the built HTML. Disabling smart detection prevents false positives. The key is already restricted to the cxtrack.com domain in Google Cloud Console.

### C2. Update Content-Security-Policy to allow Google Maps

**Current CSP (lines 23-31):**
```toml
    Content-Security-Policy = """
      default-src 'self' https://*.supabase.co https://*.stripe.com;
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https://*.unsplash.com https://*.stripe.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://*.supabase.co https://*.stripe.com wss://*.supabase.co https://api.retellai.com;
      media-src 'self' https://*.cloudfront.net;
    """
```

**Replace with:**
```toml
    Content-Security-Policy = """
      default-src 'self' https://*.supabase.co https://*.stripe.com;
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://maps.googleapis.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https://*.unsplash.com https://*.stripe.com https://maps.gstatic.com https://maps.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://*.supabase.co https://*.stripe.com wss://*.supabase.co https://api.retellai.com https://maps.googleapis.com;
      media-src 'self' https://*.cloudfront.net;
    """
```

**Changes made:**
- `script-src`: Added `https://maps.googleapis.com` (Google Maps JS SDK)
- `img-src`: Added `blob:` (for image previews), `https://maps.gstatic.com` and `https://maps.googleapis.com` (map tiles/icons)
- `connect-src`: Added `https://maps.googleapis.com` (Places API calls)

---

## SUB-TASK D: Fix Products Route — Add Missing Route in App.tsx

**File:** `src/App.tsx`

### D1. Add ProductForm import

**After line 28:**
```typescript
import Products from './pages/Products';
```

**Add:**
```typescript
import ProductForm from './pages/products/ProductForm';
```

### D2. Add routes for products/new and products/:id/edit

**After line 124:**
```typescript
<Route path="products" element={<Products />} />
```

**Add these two new lines:**
```typescript
<Route path="products/new" element={<ProductForm />} />
<Route path="products/:id/edit" element={<ProductForm />} />
```

**So the block becomes:**
```typescript
<Route path="products" element={<Products />} />
<Route path="products/new" element={<ProductForm />} />
<Route path="products/:id/edit" element={<ProductForm />} />
```

---

## SUB-TASK E: Fix Products.tsx — Correct Link Paths

**File:** `src/pages/Products.tsx`

The Products page is rendered inside the `/dashboard` layout. Links must be relative (not absolute) to work correctly inside nested routes.

### E1. Fix "New Product" button link (line 216)

**Current:**
```tsx
to="/products/new"
```

**Change to:**
```tsx
to="products/new"
```

### E2. Fix empty state button link (line 341)

**Current:**
```tsx
to="/products/new"
```

**Change to:**
```tsx
to="products/new"
```

### E3. Fix product card links (line 99 and any other occurrences)

Search for ALL occurrences of `to={`/products/` in Products.tsx and change them to relative paths `to={`products/`.

**Current pattern:**
```tsx
to={`/products/${product.id}`}
```

**Change to:**
```tsx
to={`products/${product.id}`}
```

There should be approximately 2-3 occurrences of this pattern in the file. Fix ALL of them.

### E4. Fix ProductForm.tsx internal link (line 775)

**File:** `src/pages/products/ProductForm.tsx`

**Current (line 775):**
```tsx
path: '/products/new',
```

**Change to:**
```tsx
path: '/dashboard/products/new',
```

This is inside the `CreationSuccessModal` buttons — it uses absolute paths, so it needs the full `/dashboard/` prefix.

---

## VERIFICATION CHECKLIST

After making ALL changes:

1. Run `npm run build` — must pass with zero TypeScript errors
2. Verify the built `dist/index.html` still has the Google Maps script loader
3. Start dev server (`npm run dev`) and verify:
   - Navigate to `/dashboard/products` — Products page loads
   - Click "New Loan Product" button — navigates to ProductForm page (not dashboard redirect)
   - Click "Add Your First Loan Product" (empty state) — same result
   - The back button on ProductForm returns to Products page
4. Verify `.env` no longer contains the actual API key (only a comment)
5. Verify `.gitignore` includes `.env`

---

## FILES MODIFIED SUMMARY

| File | Changes |
|------|---------|
| `.env` | Removed hardcoded Google Maps API key (replaced with comment) |
| `.gitignore` | Added `.env` and `.env.local` |
| `netlify.toml` | Added `SECRETS_SCAN_SMART_DETECTION_ENABLED = "false"`, updated CSP with Google Maps domains |
| `src/App.tsx` | Added `ProductForm` import + two new routes (`products/new`, `products/:id/edit`) |
| `src/pages/Products.tsx` | Changed all `/products/...` absolute links to relative `products/...` |
| `src/pages/products/ProductForm.tsx` | Fixed internal link to use `/dashboard/products/new` |
