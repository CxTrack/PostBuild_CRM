# GEMINI TASK 2: Fix Settings Location Save + Wire Up Google Places Autocomplete

## DIRECTORY
```
c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM
```

## BRANCH
```
CRM-Template-Configuration
```

## PROBLEM
When users try to save their city/location in Business Settings, it fails with an error. Two issues:

1. **Save uses `supabase.from('organizations').update()`** which is vulnerable to the Supabase JS AbortController bug — auth state transitions kill in-flight requests
2. **An `AddressAutocomplete` component already exists** at `src/components/ui/AddressAutocomplete.tsx` but is NOT wired into either Settings page. Also `index.html` already has the Google Maps script loader. We just need to enable the API key and wire the component in.

## ROOT CAUSE OF SAVE ERROR

**TWO vulnerable calls in the save flow:**

### Call 1: `src/services/settings.service.ts` (lines 130-140)
`updateBusinessSettings()` uses `supabase.from('organizations').update(settings)` — AbortController kills this.

### Call 2: `src/pages/settings/Settings.tsx` (lines 187-191)
The `handleSave()` function does a SECOND query right after saving:
```typescript
const { data: afterUpdate } = await supabase
  .from('organizations')
  .select('business_city, business_state')
  .eq('id', orgId)
  .single();
```
This verification query is also vulnerable AND unnecessary. Remove it.

---

## TASK A: Fix the save/load methods in settings.service.ts

**File:** `src/services/settings.service.ts`

### Replace `updateBusinessSettings` (lines 130-140) with:

```typescript
async updateBusinessSettings(
  organizationId: string,
  settings: Partial<BusinessSettings>
): Promise<void> {
  // Use direct fetch to avoid Supabase JS AbortController bug
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
  const stored = localStorage.getItem(storageKey);
  const token = stored ? JSON.parse(stored)?.access_token : null;

  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${supabaseUrl}/rest/v1/organizations?id=eq.${organizationId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(settings),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to save settings (${response.status})`);
  }
},
```

### Also replace `getBusinessSettings` (lines 60-88) with:

```typescript
async getBusinessSettings(organizationId: string): Promise<BusinessSettings | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
  const stored = localStorage.getItem(storageKey);
  const token = stored ? JSON.parse(stored)?.access_token : null;

  if (!token) throw new Error('Not authenticated');

  const fields = [
    'business_email', 'business_phone', 'business_address', 'business_city',
    'business_state', 'business_postal_code', 'business_country', 'business_website',
    'logo_url', 'primary_color', 'quote_prefix', 'invoice_prefix',
    'default_payment_terms', 'default_quote_template_id', 'default_invoice_template_id',
    'business_tax_id', 'default_tax_rate', 'tax_label'
  ].join(',');

  const response = await fetch(
    `${supabaseUrl}/rest/v1/organizations?id=eq.${organizationId}&select=${fields}`,
    {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.pgrst.object+json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to load settings (${response.status})`);
  }

  return response.json();
},
```

**Keep the rest of the file unchanged.** Only replace these two methods.

---

## TASK B: Fix the handleSave in Settings.tsx

**File:** `src/pages/settings/Settings.tsx`

### Remove the unnecessary verification query in handleSave (lines 187-191):

```typescript
// BEFORE (lines 178-204):
const handleSave = async () => {
  const orgId = currentOrganization?.id || devOrgId;
  if (!orgId || !settings) return;
  try {
    setSaving(true);
    await settingsService.updateBusinessSettings(orgId, settings);

    const { data: afterUpdate } = await supabase   // <-- DELETE THIS
      .from('organizations')                        // <-- DELETE THIS
      .select('business_city, business_state')      // <-- DELETE THIS
      .eq('id', orgId)                              // <-- DELETE THIS
      .single();                                    // <-- DELETE THIS

    localStorage.removeItem('organization-storage');
    await fetchUserOrganizations();
    setSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setSaved(false), 2000);
  } catch (error) {
    toast.error('Failed to save settings');
  } finally {
    setSaving(false);
  }
};

// AFTER:
const handleSave = async () => {
  const orgId = currentOrganization?.id || devOrgId;
  if (!orgId || !settings) return;
  try {
    setSaving(true);
    await settingsService.updateBusinessSettings(orgId, settings);

    localStorage.removeItem('organization-storage');
    await fetchUserOrganizations();
    setSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setSaved(false), 2000);
  } catch (error) {
    console.error('[Settings] Save error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to save settings');
  } finally {
    setSaving(false);
  }
};
```

---

## TASK C: Enable Google Places API key in .env files

**File:** `.env` — Change line 6 from:
```
# VITE_GOOGLE_MAPS_API_KEY=your_google_api_key_here
```
To:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBFeuGL2HnbR5qyni7Rfa8fhsPtSwoye8w
```

**File:** `.env.production` — Change line 6 from:
```
# VITE_GOOGLE_MAPS_API_KEY=your_google_api_key_here
```
To:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBFeuGL2HnbR5qyni7Rfa8fhsPtSwoye8w
```

**NOTE:** `index.html` already has the Google Maps script loader that checks for this key at build time. No changes needed to index.html.

---

## TASK D: Wire AddressAutocomplete into BOTH Settings pages

There are TWO settings pages that have address fields. Both need the existing `AddressAutocomplete` component wired in.

### EXISTING COMPONENT (DO NOT RECREATE):
`src/components/ui/AddressAutocomplete.tsx`

This component already:
- Has Google Places autocomplete with debouncing
- Caches predictions
- Supports keyboard navigation (arrow keys + Enter)
- Restricts to Canada + US addresses
- Has a clear button
- Has a fallback message when API key isn't set
- Calls `onAddressSelect(components)` with `{ address, city, state, postal_code, country }`

### Page 1: `src/pages/settings/Settings.tsx`

**Add import (at top):**
```typescript
import { AddressAutocomplete, AddressComponents } from '@/components/ui/AddressAutocomplete';
```

**Replace the Street Address `<Input>` block (around lines 641-652):**

Find this section:
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Street Address
  </label>
  <Input
    type="text"
    value={settings.business_address || ''}
    onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
    placeholder="123 Main Street"
  />
</div>
```

Replace with:
```tsx
<div>
  <AddressAutocomplete
    label="Street Address"
    value={settings.business_address || ''}
    onChange={(value) => setSettings({ ...settings, business_address: value })}
    onAddressSelect={(components: AddressComponents) => {
      setSettings({
        ...settings,
        business_address: components.address,
        business_city: components.city,
        business_state: components.state,
        business_postal_code: components.postal_code,
        business_country: components.country,
      });
    }}
    placeholder="Start typing an address..."
  />
</div>
```

### Page 2: `src/pages/settings/BusinessSettings.tsx`

**Add import (at top):**
```typescript
import { AddressAutocomplete, AddressComponents } from '@/components/ui/AddressAutocomplete';
```

**Replace the Street Address block (lines 189-200):**

Find:
```tsx
<div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    <MapPin className="w-4 h-4 inline mr-2" />
    Street Address
  </label>
  <Input
    type="text"
    value={settings.business_address || ''}
    onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
    placeholder="123 Business Street"
  />
</div>
```

Replace with:
```tsx
<div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    <MapPin className="w-4 h-4 inline mr-2" />
    Street Address
  </label>
  <AddressAutocomplete
    value={settings.business_address || ''}
    onChange={(value) => setSettings({ ...settings, business_address: value })}
    onAddressSelect={(components: AddressComponents) => {
      setSettings({
        ...settings,
        business_address: components.address,
        business_city: components.city,
        business_state: components.state,
        business_postal_code: components.postal_code,
        business_country: components.country,
      });
    }}
    placeholder="Start typing an address..."
  />
</div>
```

---

## TASK E: Also fix the BusinessSettings.tsx save handler

**File:** `src/pages/settings/BusinessSettings.tsx`

The `handleSaveBusinessInfo` (lines 61-89) also uses `settingsService.updateBusinessSettings` which we already fixed in Task A. But improve the error handling:

Replace the catch block (line 84):
```typescript
// BEFORE:
} catch (error) {
  toast.error('Failed to save settings');
}

// AFTER:
} catch (error) {
  console.error('[BusinessSettings] Save error:', error);
  toast.error(error instanceof Error ? error.message : 'Failed to save settings');
}
```

---

## DO NOT CREATE THESE FILES (they already exist):
- ❌ `src/hooks/useGooglePlaces.ts` — NOT NEEDED, use existing `AddressAutocomplete` component
- ❌ `src/types/google-maps.d.ts` — NOT NEEDED, the component uses `any` casts and the script is loaded via index.html
- ❌ Any changes to `index.html` — already has Google Maps loader

---

## VERIFICATION CHECKLIST
- [ ] `npm run build` succeeds with zero errors
- [ ] Settings > type in city field and click Save → saves successfully (no error)
- [ ] Settings > type in Street Address field → Google Places suggestions appear
- [ ] Picking a suggestion auto-fills city, state, postal code, country
- [ ] Can still manually type in any field without using Google
- [ ] Works gracefully when Google Maps API key is not set (shows fallback message)
- [ ] Dark mode works on the suggestions dropdown
- [ ] Both Settings.tsx AND BusinessSettings.tsx have the autocomplete wired in
- [ ] `.env` files are NOT committed to git

## DEPLOY
```bash
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
npm run build
git add src/services/settings.service.ts src/pages/settings/Settings.tsx src/pages/settings/BusinessSettings.tsx
git commit -m "fix: settings save error (AbortController bug) + wire up Google Places address autocomplete"
git push origin CRM-Template-Configuration
```

**ALSO:** Add `VITE_GOOGLE_MAPS_API_KEY=AIzaSyBFeuGL2HnbR5qyni7Rfa8fhsPtSwoye8w` to Netlify environment variables for production deployment.
