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

## RESOLVED ERRORS (fixed 2026-02-13)

> All three onboarding errors have been resolved via database migrations and code changes.

### Error 1: AbortError During Onboarding — RESOLVED
**Root Cause:** PlanPage.tsx had a fragile 4-step chain (users → organizations → user_profiles → organization_members) with retry logic that masked the real issue (RLS blocking).
**Fix:** Replaced with single atomic `supabase.rpc('create_organization_with_owner', {...})` call. The RPC is `SECURITY DEFINER` so it bypasses RLS.

### Error 2: 403 Forbidden on Organizations Table — RESOLVED
**Root Cause:** Chicken-and-egg RLS problem — new users couldn't INSERT into organizations because policies required membership that didn't exist yet.
**Fix:** Created `create_organization_with_owner()` SECURITY DEFINER RPC function that atomically creates org + user_profiles + organization_members. Fixed RLS policies to restrict direct INSERT (only via RPC).

### Error 3: Auth Session Not Establishing After Signup — RESOLVED
**Root Cause:** Email confirmation was already disabled. The real issue was that `handle_new_user()` trigger didn't create `user_profiles` or `public.users` records, causing FK violations when creating organization_members.
**Fix:** Updated trigger to create both `public.users` and `user_profiles` records. Simplified Register.tsx to remove unnecessary fallback sign-in logic.

---

### Database Migrations Applied (2026-02-13)

| Migration | Description |
|-----------|-------------|
| `remove_dev_bypass_policies` | Dropped `dev_anon_all` and `dev_auth_all` from customers, pipeline_items, tasks, calendar_events |
| `enable_rls_on_unprotected_tables` | Enabled RLS on calls, profiles, audit_requests, custom_crm_requests, onboarding_leads, plan_module_access, industries, industry_templates, voice_agent_configs |
| `remove_stripe_keys_from_organizations` | Dropped `stripe_secret_key` and `stripe_publishable_key` columns |
| `create_organization_with_owner_rpc` | Created atomic SECURITY DEFINER RPC for org creation |
| `fix_org_and_members_rls_policies` | Fixed RLS on organizations and organization_members tables |
| `fix_handle_new_user_trigger` | Updated trigger to create public.users + user_profiles records |

### Code Changes (2026-02-13)

| File | Changes Made |
|------|-------------|
| `src/pages/onboarding/PlanPage.tsx` | Replaced 4-step chain + retry logic with single `supabase.rpc('create_organization_with_owner')` call |
| `src/pages/Register.tsx` | Removed fallback sign-in logic, simplified to just `signUp()` + navigate |
| `src/stores/organizationStore.ts` | Fixed `_hasHydrated` default from `true` to `false`, added `onRehydrateStorage` callback |

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
