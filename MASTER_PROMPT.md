# CxTrack CRM - Universal Agent Context

> **PASTE THIS ENTIRE DOCUMENT at the start of every new AI session (Claude, Gemini, GPT, etc.)**

---

## Project Overview

CxTrack is a multi-industry AI-powered CRM platform. Two separate codebases share one Supabase database.

---

## SECTION 1: THE TWO REPOSITORIES

| | Marketing Website | CRM Application |
|---|---|---|
| **What It Is** | Landing pages, signup, onboarding, Stripe checkout | Dashboard, CRM modules, customer management |
| **Path** | `c:\AntiGravity\CxTrack_Manik_Website_Production_02` | `c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM` |
| **GitHub** | `CxTrack/CxTrack_Official_Website` | `CxTrack/PostBuild_CRM` |
| **Branch** | `main` | `CRM-Template-Configuration` |
| **URL** | cxtrack.com | crm.cxtrack.com |
| **Framework** | Next.js 14 (App Router) | React 18 + Vite |
| **State Management** | React state / Server components | Zustand stores |
| **Hosting** | Netlify | Netlify |

### FORBIDDEN ACTIONS
- NEVER copy files between Marketing Website and CRM repos
- NEVER push CRM code to Marketing Website remote (or vice versa)
- NEVER push CRM code to `main`. CRM branch is ALWAYS `CRM-Template-Configuration`
- NEVER confuse the two repositories
- Platform is ALWAYS Netlify (not Vercel/AWS/Heroku)

---

## SECTION 2: SUPABASE DATABASE

- **Project Ref:** `zkpfzrbbupgiqkzqydji`
- **API URL:** `https://zkpfzrbbupgiqkzqydji.supabase.co`

### Key Tables
| Table | Purpose |
|---|---|
| `auth.users` | Supabase Auth users |
| `user_profiles` | Extended user info |
| `organizations` | Companies, industry_template, subscription_tier |
| `organization_members` | Links users to orgs (user_id, organization_id, role) |
| `customers` | CRM contacts |
| `deals` | Sales pipeline |
| `tasks` | Task management |
| `calendar_events` | Scheduling |
| `calls` | Call logs (human + AI) |
| `quotes` / `invoices` | Financial documents |
| `industry_templates` | CRM configurations per industry |
| `industry_pipeline_stages` | Pre-populated pipeline stages for all 11 industries |
| `organization_pipeline_stages` | Per-org customization of pipeline stages |

### Auth Flow
```
1. User visits cxtrack.com/signup (Marketing Site)
2. Creates account -> Supabase Auth
3. Selects industry template
4. Completes Stripe checkout (if paid plan)
5. Redirected to crm.cxtrack.com/dashboard (CRM App)
6. CRM reads same Supabase session
```

---

## SECTION 3: INDUSTRY TEMPLATE SYSTEM (CRITICAL)

Config file: `src/config/modules.config.ts`

**11 industries:** tax_accounting, distribution_logistics, gyms_fitness, contractors_home_services, healthcare, real_estate, legal_services, general_business, software_development, mortgage_broker, construction

### RULE: NEVER hardcode user-facing strings. Always use:
- `usePageLabels(pageId)` - for page titles, subtitles, buttons, empty states
- `useIndustryLabel(moduleId)` - for sidebar nav labels
- `getPageLabels()` - merges `DEFAULT_PAGE_LABELS` + industry-specific overrides

### Config Structure in modules.config.ts
- `INDUSTRY_TEMPLATES`: Which modules each industry gets
- `INDUSTRY_LABELS`: Sidebar nav label overrides (short names)
- `PAGE_LABELS`: Full page content overrides (title, subtitle, buttons, empty states)
- `DEFAULT_PAGE_LABELS`: Fallback for all modules (general_business uses these)
- `getPageLabels()`: Merges defaults + industry overrides
- `usePageLabels(pageId)`: React hook for components

### Label Examples by Industry
| Industry | customers | invoices | quotes | pipeline |
|---|---|---|---|---|
| mortgage_broker | Borrowers | Commissions | - | Applications |
| real_estate | Contacts | - | Listing Proposals | Deal Pipeline |
| contractors | Clients | Invoices | Estimates | Job Pipeline |
| healthcare | Patients | Invoices | - | - |
| legal_services | Clients | Invoices | Fee Proposals | Case Pipeline |
| construction | Clients | Invoices | Bids | Projects |
| general_business | Customers | Invoices | Quotes | Pipeline |

### Pages Using usePageLabels (Compliant)
Customers, Quotes, Invoices, Tasks, Pipeline, Calls, Products, Financials, Inventory, Suppliers

---

## SECTION 4: MODULE ACCESS SYSTEM

- `PLAN_MODULE_ACCESS` in modules.config.ts: which subscription tier gets which modules
- `FREE_TRIAL_ONLY_MODULES`: locked after 30 days on free tier
- `useVisibleModules()`: core hook for visibility/locking
- Free tier gets ALL modules for 30 days, then premium ones lock

---

## SECTION 5: CRITICAL ARCHITECTURE PATTERNS

### Supabase AbortController Bug
Supabase JS v2.57.4 kills ALL in-flight HTTP requests during auth state transitions. **Solution:** Use direct `fetch()` to Supabase REST API instead of `supabase.from().select()`. Read auth tokens from `localStorage` key `sb-zkpfzrbbupgiqkzqydji-auth-token`.

### Organization Store Hydration (MUST FOLLOW)
Zustand `persist` middleware rehydrates async from localStorage. Pages MUST wait for `currentOrganization` before fetching data:

```typescript
// CORRECT PATTERN
const { currentOrganization } = useOrganizationStore();

useEffect(() => {
  fetchData(); // Let fetchData handle missing org internally
}, [currentOrganization?.id]); // Re-runs when org becomes available

if (!currentOrganization || (loading && data.length === 0)) {
  return <LoadingSpinner />;
}
```

```typescript
// WRONG - DO NOT DO THIS
useEffect(() => {
  if (!currentOrganization?.id) return; // BAD - breaks loading UI
  fetchData();
}, [currentOrganization?.id]);
```

### Onboarding
Uses atomic RPC `supabase.rpc('create_organization_with_owner', {...})` which is `SECURITY DEFINER` to bypass RLS chicken-and-egg problem. Do NOT use multi-step insert chains.

### Key Files
- `src/stores/organizationStore.ts` - Zustand store with persist middleware
- `src/layouts/DashboardLayout.tsx` - Fetches organizations using `getState()` to avoid loops
- `src/contexts/AuthContext.tsx` - Authentication state management

---

## SECTION 6: CRM APP DIRECTORY STRUCTURE

```
c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM\
├── src/
│   ├── App.tsx                     # Router & routes
│   ├── main.tsx                    # Entry point
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication state
│   ├── stores/
│   │   ├── organizationStore.ts    # Current org state (Zustand + persist)
│   │   ├── customerStore.ts        # Customers CRUD
│   │   └── ...
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── Customers.tsx
│   │   ├── Pipeline.tsx
│   │   ├── onboarding/PlanPage.tsx # Uses atomic RPC
│   │   └── ...
│   ├── layouts/
│   │   └── DashboardLayout.tsx     # Sidebar + main content
│   ├── hooks/
│   │   ├── usePageLabels.ts        # Page label hook
│   │   ├── useIndustryLabel.ts     # Nav label hook
│   │   └── useVisibleModules.ts    # Module access hook
│   ├── config/
│   │   └── modules.config.ts       # THE template/access system
│   ├── components/                 # UI components
│   ├── services/                   # API services
│   └── lib/
│       └── supabase.ts             # Supabase client
└── .env                            # Environment variables
```

---

## SECTION 7: DEPLOY COMMANDS

### CRM Application
```bash
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
npm run build && git add . && git commit -m "Description" && git push origin CRM-Template-Configuration
```

### Marketing Website
```bash
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
npm run build && git add . && git commit -m "Description" && git push origin main
```

### Run Locally
```bash
# Marketing Website (localhost:3000)
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02" && npm run dev

# CRM Application (localhost:5173)
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM" && npm run dev
```

---

## SECTION 8: COMMON ISSUES & SOLUTIONS

| Problem | Cause | Fix |
|---|---|---|
| Page stuck on loading | Org store not hydrated yet | Add `currentOrganization?.id` to useEffect deps, show spinner while waiting |
| "No Organization Found" | User missing from `organization_members` | INSERT the missing record linking user to org |
| Login not working | Stale auth state | `localStorage.clear(); sessionStorage.clear(); location.reload();` |
| Nav redirects to dashboard | Route missing in `src/App.tsx` | Add the route + import the component |
| Build failing | TypeScript errors | Run `npm run build` locally, fix errors |
| Changes not on production | Wrong branch or cache | Check branch, check Netlify logs, Ctrl+Shift+R |

---

## SECTION 9: RESOLVED ISSUES (2026-02-13)

These are FIXED. Do not re-introduce these patterns:

- **AbortError during onboarding** - Was: 4-step chain with retry logic. Fixed: single atomic RPC
- **403 on organizations table** - Was: RLS chicken-and-egg. Fixed: SECURITY DEFINER RPC + corrected RLS policies
- **Auth session not establishing** - Was: `handle_new_user()` trigger didn't create records. Fixed: trigger now creates `public.users` + `user_profiles`

### Migrations Applied
| Migration | Description |
|---|---|
| `remove_dev_bypass_policies` | Dropped dev bypass RLS policies |
| `enable_rls_on_unprotected_tables` | Enabled RLS on calls, profiles, etc. |
| `remove_stripe_keys_from_organizations` | Dropped stripe key columns |
| `create_organization_with_owner_rpc` | Atomic SECURITY DEFINER RPC |
| `fix_org_and_members_rls_policies` | Fixed RLS on organizations + members |
| `fix_handle_new_user_trigger` | Trigger creates public.users + user_profiles |

---

## RULES

1. **Only change what is explicitly requested** - nothing else
2. **Verify directory** before any file operation
3. **All user-facing text** must use the template system (usePageLabels / useIndustryLabel)
4. **Test builds** before pushing (`npm run build`)
5. **Pages that fetch data** MUST handle org store hydration pattern
6. **Platform is ALWAYS Netlify** (not Vercel/AWS/Heroku)
7. **Do not lie** - if unsure whether you can do something, try it first
8. **Use the Supabase service role key** - never ask the user to run DB queries
