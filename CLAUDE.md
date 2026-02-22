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
URL:        crm.cxtrack.com
```

## Rules
1. **NO LYING** - Do not claim you can't do something if you can
2. **ONLY change what is explicitly requested** - nothing else
3. **USE Supabase MCP** for all DB queries - never ask user to run queries manually
4. **VERIFY directory** before any file operation
5. **Use MCP/CLI first** - never ask user to do something manually when tools are available
6. **No em dashes** in any copywriting

---

## Supabase Database

**Project:** `zkpfzrbbupgiqkzqydji`
**URL:** `https://zkpfzrbbupgiqkzqydji.supabase.co`
**Dashboard:** https://supabase.com/dashboard/project/zkpfzrbbupgiqkzqydji

> ⚠️ Service role key is in Netlify env vars and `.env` only. NEVER hardcode it here.
> Use the Supabase MCP server for authenticated DB access.

### Key Tables
| Table | Purpose |
|-------|---------|
| `auth.users` | User accounts — use Auth Admin API via MCP |
| `user_profiles` | Extended user info |
| `organizations` | Companies, industry_template, subscription_tier |
| `organization_members` | Links users to orgs (user_id, organization_id, role) |
| `team_invitations` | Token-based team invitations (7-day expiry) |

### Supabase Edge Function Secrets
| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend email API |
| `OPENROUTER_API_KEY` | AI models (copilot-chat v12, receipt-scan) |
| `RETELL_API_KEY` | Voice agent |
| `GOOGLE_CLOUD_VISION_API_KEY` | Business card OCR |
| `TWILIO_MASTER_ACCOUNT_SID` | Phone numbers + SMS |
| `TWILIO_MASTER_AUTH_TOKEN` | Twilio auth |
| `TWILIO_SIP_TRUNK_*` | SIP trunk credentials |

---

## Deploy Commands

**CRM:**
```bash
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
npm run build && git add . && git commit -m "Description" && git push origin CRM-Template-Configuration
```

---

## Industry Template System

**Config:** `src/config/modules.config.ts`
**Hook:** `src/hooks/useIndustryLabel.ts` and `src/hooks/usePageLabels.ts`

| Industry | customers | invoices | quotes | pipeline | calls |
|----------|-----------|----------|--------|----------|-------|
| agency | Clients | Billing | Proposals | Projects | Calls |
| mortgage_broker | Borrowers | Commissions | - | Applications | Call Log |
| real_estate | Contacts | - | Listing Proposals | Deal Pipeline | Calls |
| contractors | Clients | Invoices | Estimates | Job Pipeline | Calls |
| healthcare | Patients | Invoices | - | - | Calls |
| legal_services | Clients | Invoices | Fee Proposals | Case Pipeline | Calls |
| construction | Clients | Invoices | Bids | Projects | Calls |
| tax_accounting | Clients | Invoices | Engagement Letters | - | Calls |
| distribution_logistics | Accounts | Invoices | Quotes | Order Pipeline | Calls |
| gyms_fitness | Members | Invoices | - | Membership Pipeline | Calls |
| general_business | Customers | Invoices | Quotes | Pipeline | Calls |

**Rule:** Never hardcode user-facing strings. Use `usePageLabels(pageId)` or `useIndustryLabel(moduleId)`.

---

## Critical Patterns

### Supabase AbortController Issue
Supabase JS v2.57.4 kills in-flight requests during auth transitions. Use direct `fetch()` instead of `supabase.from()` or `supabase.functions.invoke()`. Read tokens from localStorage `sb-{ref}-auth-token`.

### Theme (Midnight)
- Root element: `class="dark midnight"`
- Use `gray-*` NOT `slate-*` — midnight.css only intercepts `gray-*`
- `dark:bg-gray-800` = glass effect, `dark:bg-gray-900` = void black
- JS check: `theme === 'dark' || theme === 'midnight'`

### Bug Learnings
- **Vite TDZ**: Variables in useEffect/useCallback dependency arrays must be defined ABOVE the hook
- **Edge 401s**: Set `verify_jwt: false` + auth via `getUser()`; read tokens from localStorage
- **No hardcoded Supabase refs**: Derive from `SUPABASE_URL.split('//')[1].split('.')[0]`

### User Preferences Store
- Table: `user_preferences (user_id, organization_id, preference_type, preference_value JSONB)`
- Types: `sidebar_order`, `dashboard_layout`, `quick_actions_order`, `mobile_nav_items`

### Drag-and-Drop Sidebar
- `@dnd-kit` libraries; `DashboardLayout.tsx` + `SortableNavItem`
- Home pinned first, Settings last; order saved to `user_preferences`
- Desktop only (8px activation distance)

---

## Common Issues

### Pages stuck on loading / Back button causes infinite loading

**Root Cause:** Race condition between page mounting and organization store hydration.

**The Pattern That Works:**
```typescript
const { currentOrganization } = useOrganizationStore();

useEffect(() => {
  fetchData();
}, [currentOrganization?.id]);

if (!currentOrganization || (loading && data.length === 0)) {
  return <LoadingSpinner />;
}
```

**What NOT to do:**
```typescript
// DON'T use early return guard in useEffect
useEffect(() => {
  if (!currentOrganization?.id) return;  // BAD - breaks loading UI
  fetchData();
}, [currentOrganization?.id]);
```

### "No Organization Found"
1. User exists in `auth.users` but NOT in `organization_members`
2. Query `organization_members` via Supabase MCP to verify
3. INSERT the missing record linking user to org

### Login not working
1. Clear storage: `localStorage.clear(); sessionStorage.clear(); location.reload();`
2. Check browser console for `[Auth]` messages
3. Check `AuthContext.tsx`

### Build failing
1. Run `npm run build` locally
2. Fix TypeScript errors
3. Verify imports exist

---

## Historical Mistakes (DO NOT REPEAT)

| Date | Mistake | Prevention |
|------|---------|------------|
| 2026-02-13 | Used early return guard for org check in useEffect — pages went blank | Show loading state in component body, not inside useEffect |
| 2026-02-13 | Claimed couldn't delete auth users via API | Auth Admin API at `/auth/v1/admin/users/{id}` CAN delete users with service role key |
| 2026-02-12 | Searched wrong directory | ALWAYS verify `c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM` |
| 2026-02-12 | Said "Vercel" instead of Netlify | Platform is ALWAYS Netlify |

---

## Confluence Boundaries

**ONLY operate within:**
- `CxTrack - Official Website`
- `CxTrack - CRM Application`

Never modify other developers' pages.
