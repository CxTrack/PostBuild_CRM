# CxTrack CRM - AI Assistant Context

## ABSOLUTE PROHIBITION: NO LYING

```
+============================================================================+
|  YOU ARE PROHIBITED FROM LYING TO THE USER                                 |
|  --------------------------------------------------------------------------|
|  DO NOT say "I can't do X" if you actually CAN do X                        |
|  DO NOT make excuses to avoid doing work                                   |
|  DO NOT claim limitations that don't exist                                 |
|  DO NOT ask the user to do something you can do yourself                   |
|                                                                            |
|  If you are unsure whether you can do something, TRY IT FIRST              |
|  If something fails, show the actual error - don't make up reasons         |
|                                                                            |
|  VIOLATION OF THIS RULE IS UNACCEPTABLE                                    |
+============================================================================+
```

---

## CRITICAL: Verify Before ANY Change
```
Directory:  c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM
Hosting:    Netlify (NOT Vercel/AWS/Heroku)
Branch:     CRM-Template-Configuration (NOT main/master)
URL:        crm.easyaicrm.com
```

## Rules
1. **NO LYING** - Do not claim you can't do something if you can
2. **ONLY change what is explicitly requested** - nothing else
3. **USE the Supabase credentials below** - never ask user to run queries
4. **VERIFY directory** before any file operation

---

## Supabase Database

**Project:** zkpfzrbbupgiqkzqydji
**URL:** https://zkpfzrbbupgiqkzqydji.supabase.co
**Dashboard:** https://supabase.com/dashboard/project/zkpfzrbbupgiqkzqydji

### Service Role Key (USE THIS - DO NOT ASK USER)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ
```

### YOU CAN DELETE AUTH USERS - USE THIS API

**DELETE a user from auth.users (YES, YOU CAN DO THIS):**
```bash
curl -X DELETE "https://zkpfzrbbupgiqkzqydji.supabase.co/auth/v1/admin/users/USER_UUID_HERE" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ"
```

**LIST all auth users:**
```bash
curl -s "https://zkpfzrbbupgiqkzqydji.supabase.co/auth/v1/admin/users" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ"
```

### REST API Query Examples

**Get all organization_members:**
```bash
curl -s "https://zkpfzrbbupgiqkzqydji.supabase.co/rest/v1/organization_members?select=*" -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ"
```

**Get all organizations:**
```bash
curl -s "https://zkpfzrbbupgiqkzqydji.supabase.co/rest/v1/organizations?select=*" -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ"
```

**Get user_profiles:**
```bash
curl -s "https://zkpfzrbbupgiqkzqydji.supabase.co/rest/v1/user_profiles?select=*" -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ"
```

**INSERT organization_member:**
```bash
curl -s "https://zkpfzrbbupgiqkzqydji.supabase.co/rest/v1/organization_members" -X POST -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{"user_id": "UUID", "organization_id": "UUID", "role": "owner"}'
```

### API Capabilities Summary
| Action | API | Endpoint | CAN DO? |
|--------|-----|----------|---------|
| List auth users | Auth Admin | `/auth/v1/admin/users` | **YES** |
| Delete auth user | Auth Admin | `/auth/v1/admin/users/{id}` | **YES** |
| Query tables | REST | `/rest/v1/{table}` | **YES** |
| Insert records | REST | `/rest/v1/{table}` | **YES** |
| Update records | REST | `/rest/v1/{table}?id=eq.{id}` | **YES** |
| Delete records | REST | `/rest/v1/{table}?id=eq.{id}` | **YES** |

### Key Tables
| Table | Purpose |
|-------|---------|
| `auth.users` | User accounts - USE Auth Admin API above |
| `user_profiles` | Extended user info (REST API accessible) |
| `organizations` | Companies, industry_template, subscription_tier |
| `organization_members` | Links users to orgs (user_id, organization_id, role) |

---

## Two Production Repositories

### CRM Application (THIS REPO)
| Property | Value |
|----------|-------|
| Path | `c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM` |
| GitHub | `https://github.com/CxTrack/PostBuild_CRM.git` |
| URL | crm.easyaicrm.com |
| Branch | CRM-Template-Configuration |
| Framework | React 18 + Vite |

### Marketing Website
| Property | Value |
|----------|-------|
| Path | `c:\AntiGravity\CxTrack_Manik_Website_Production_02` |
| GitHub | `https://github.com/CxTrack/CxTrack_Official_Website.git` |
| URL | easyaicrm.com |
| Branch | main |

---

## Deploy Commands

**CRM:**
```bash
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
npm run build && git add . && git commit -m "Description" && git push origin CRM-Template-Configuration
```

**Marketing Website:**
```bash
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
npm run build && git add . && git commit -m "Description" && git push origin main
```

---

## Industry Template System

CxTrack is multi-industry. ALL user-facing text must use dynamic labels.

**Config:** `src/config/modules.config.ts`
**Hook:** `src/hooks/useIndustryLabel.ts` and `src/hooks/usePageLabels.ts`

| Industry | customers | invoices | quotes | pipeline |
|----------|-----------|----------|--------|----------|
| mortgage_broker | Borrowers | Commissions | - | Applications |
| real_estate | Contacts | - | Listing Proposals | Deal Pipeline |
| contractors | Clients | Invoices | Estimates | Job Pipeline |
| healthcare | Patients | Invoices | - | - |
| legal_services | Clients | Invoices | Fee Proposals | Case Pipeline |
| construction | Clients | Invoices | Bids | Projects |
| general_business | Customers | Invoices | Quotes | Pipeline |

**Rule:** Never hardcode user-facing strings. Use `usePageLabels(pageId)` or `useIndustryLabel(moduleId)`.

---

## Common Issues

### Pages stuck on loading / Back button causes infinite loading

**Root Cause:** Race condition between page mounting and organization store hydration.

The `organizationStore` uses Zustand's `persist` middleware which rehydrates asynchronously from localStorage. Pages that fetch data need to wait for `currentOrganization` to be available.

**The Pattern That Works:**
```typescript
// 1. Get currentOrganization from the store
const { currentOrganization } = useOrganizationStore();

// 2. Add currentOrganization?.id to useEffect dependencies
useEffect(() => {
  fetchData();  // Let fetchData handle the missing org case internally
}, [currentOrganization?.id]);  // Re-runs when org becomes available

// 3. Show loading state while waiting for organization
if (!currentOrganization || (loading && data.length === 0)) {
  return <LoadingSpinner />;
}
```

**What NOT to do:**
```typescript
// DON'T use early return guard in useEffect - it prevents loading state
useEffect(() => {
  if (!currentOrganization?.id) return;  // BAD - breaks loading UI
  fetchData();
}, [currentOrganization?.id]);

// DON'T use empty dependency array - won't re-fetch when org loads
useEffect(() => {
  fetchData();
}, []);  // BAD - only runs once on mount
```

**Key Files:**
- `src/stores/organizationStore.ts` - Zustand store with persist middleware
- `src/layouts/DashboardLayout.tsx` - Fetches organizations using `getState()` to avoid loops
- Individual pages (`Calls.tsx`, `CRM.tsx`, etc.) - Must wait for org before showing content

**Diagnosis:** Check browser console for `[OrgStore]` and `[DashboardLayout]` logs. If org is being set but page still loading, the page component isn't properly waiting for org.

---

### "No Organization Found"
1. User exists in `auth.users` but NOT in `organization_members`
2. Query `organization_members` to verify
3. INSERT the missing record linking user to org

### Login not working
1. Clear storage: `localStorage.clear(); sessionStorage.clear(); location.reload();`
2. Check browser console for `[Auth]` messages
3. Check AuthContext.tsx

### Navigation redirects to dashboard
1. Check route exists in `src/App.tsx`
2. Check component is imported
3. Fallback `<Route path="*">` catches unmatched routes

### Build failing
1. Run `npm run build` locally
2. Fix TypeScript errors
3. Verify imports exist

---

## UNRESOLVED ERRORS (as of 2026-02-13)

> **Note for next AI assistant:** These errors were not resolved. The onboarding signup flow is broken.

### Error 1: AbortError During Onboarding Organization Creation

**Console Output:**
```
[Auth] Timeout reached, forcing loading to false
Uncaught (in promise) AbortError: signal is aborted without reason
[Onboarding] Org creation attempt 1 aborted, retrying...
[Onboarding] Org creation attempt 2 aborted, retrying...
[Onboarding] Org creation attempt 3 aborted, retrying...
[Onboarding] Error selecting plan: AbortError: signal is aborted without reason
```

**Location:** `src/pages/onboarding/PlanPage.tsx` - `createOrganizationWithRetry()` function (lines 119-173)

**Suspected Causes:**
- Supabase client is aborting requests before they complete
- Auth session not fully established when DB calls are made
- Request timeout may be configured too short
- Possible network/CORS issues

**What Was Tried:**
- Added retry logic with exponential backoff
- Generate org ID client-side with `crypto.randomUUID()` to avoid `.select()` after INSERT
- Added session check before making DB calls

---

### Error 2: 403 Forbidden on Organizations Table (RLS Issue)

**Console Output:**
```
Failed to load zkpfzrbbupgiqkzqydji...izations?select=*
resource: the server responded with a status of 403 ()
[Onboarding] Error selecting plan: Object
```

**Location:** `src/pages/onboarding/PlanPage.tsx` - organization INSERT operation

**Root Cause:** RLS (Row Level Security) policies on `organizations` table are blocking INSERT/SELECT operations for newly authenticated users who aren't yet members of any organization.

**The Chicken-and-Egg Problem:**
1. User authenticates successfully
2. User tries to INSERT into `organizations` table
3. RLS policy blocks because user isn't a member yet
4. Can't create `organization_members` record without org ID
5. Can't get org ID without INSERT succeeding

**Fixes Attempted:**
1. Changed to generate org ID client-side (avoid needing .select() after INSERT)
2. Added session establishment logic in Register.tsx
3. Added session check before DB calls in PlanPage.tsx
4. Provided RLS SQL policies to user

**RLS Policies Needed (run in Supabase SQL Editor):**
```sql
-- Allow authenticated users to INSERT organizations
CREATE POLICY "Users can create organizations" ON organizations
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow users to SELECT orgs they're members of
CREATE POLICY "Users can select member orgs" ON organizations
FOR SELECT TO authenticated
USING (
  id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);
```

**Alternative Fix: Create RPC Function with SECURITY DEFINER**
```sql
CREATE OR REPLACE FUNCTION create_organization_with_membership(
  org_name TEXT,
  org_slug TEXT,
  industry TEXT,
  tier TEXT,
  user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Insert org
  INSERT INTO organizations (name, slug, industry_template, subscription_tier)
  VALUES (org_name, org_slug, industry, tier)
  RETURNING id INTO new_org_id;

  -- Insert membership
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, user_id, 'owner');

  RETURN new_org_id;
END;
$$;
```

---

### Error 3: Auth Session Not Establishing After Signup

**Console Output:**
```
[Auth] Timeout reached, forcing loading to false
[Register] No session returned - checking if auto-confirm is enabled
[Register] Could not auto-login: Invalid login credentials
```

**Location:** `src/pages/Register.tsx` - after `supabase.auth.signUp()`

**Suspected Cause:** Supabase project may have email confirmation enabled, which means:
1. `signUp()` creates user but returns no session
2. Session is only created after email confirmation
3. Our code tries to sign in immediately but user isn't confirmed yet

**Fix in Supabase Dashboard:**
1. Go to Authentication > Settings
2. Under "Email Auth", disable "Confirm email"
3. Or implement proper email confirmation flow

---

### Files Modified This Session (may need review)

| File | Changes Made |
|------|-------------|
| `src/pages/onboarding/PlanPage.tsx` | Added `createOrganizationWithRetry()` with retry logic, client-side UUID generation, session checks before DB calls |
| `src/pages/Register.tsx` | Added session establishment logic after signup - tries to sign in if no session returned |
| `src/pages/Quotes.tsx` | Fixed loading condition to prevent skeleton flash on navigation |
| `src/pages/calls/Calls.tsx` | Added AI Agents tab purple glow styling |

---

## Historical Mistakes (LEARN FROM THESE - DO NOT REPEAT)

| Date | Mistake | What Actually Happened | Prevention |
|------|---------|------------------------|------------|
| 2026-02-13 | **Used early return guard for org check** | Added `if (!currentOrganization?.id) return;` inside useEffect which prevented loading UI from showing - pages appeared blank | **Show loading state BEFORE the render**, not inside useEffect. Check `if (!currentOrganization)` in component body and return spinner. |
| 2026-02-13 | **LIED about auth user deletion** | Said "I cannot delete auth.users via API" when the Auth Admin API at `/auth/v1/admin/users/{id}` exists and works with the service role key | **NEVER claim you can't do something without trying. The Auth Admin API CAN delete users.** |
| 2026-02-12 | Asked user to run DB queries | Had the service role key but didn't use it | USE the service role key via curl |
| 2026-02-12 | Missing route in App.tsx | Component existed but wasn't routed | Check: file exists, imported, route defined |
| 2026-02-12 | Searched wrong directory | Kept looking in wrong path | ALWAYS verify: `c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM` |
| 2026-02-12 | Said "Vercel" instead of Netlify | Wrong platform mentioned | Platform is ALWAYS Netlify |

---

## Gemini Handoff Template

```
## Gemini Execution Prompt

**Directory:** c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM

**Task:** [Brief description]

### File Changes:
**File:** `src/path/file.tsx`
- Line X: Change `old` to `new`

### Commands:
```bash
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
npm run build
git add [files]
git commit -m "Description"
git push origin CRM-Template-Configuration
```

### Verify:
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Feature works
```
