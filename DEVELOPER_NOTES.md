# CxTrack CRM — Developer Reference

Architecture notes, patterns, and known issues for developers working on this codebase.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3.1 |
| Build | Vite | 5.4.2 |
| Language | TypeScript | 5.5.3 |
| Styling | Tailwind CSS | 3.4.1 |
| UI Components | Radix UI + shadcn patterns | — |
| State | Zustand (with persist) | 5.0.9 |
| Forms | React Hook Form + Zod | 7.68 / 4.2 |
| Database | Supabase (PostgreSQL + Auth) | — |
| PDF Generation | jsPDF + AutoTable | 3.0.4 |
| Charts | Recharts | 3.6.0 |
| Calendar | React Big Calendar | 1.19.4 |
| Animations | Framer Motion + GSAP | 10.16 / 3.12 |
| Voice | Retell SDK | 4.66.0 |

**Build Scripts:**
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type checking

---

## Directory Structure

```
src/
  config/          → modules.config.ts (master industry/template config)
  contexts/        → AuthContext, CoPilotContext
  hooks/           → usePageLabels, useVisibleModules, etc.
  lib/             → supabase.ts (client init)
  stores/          → 23 Zustand stores (all persisted to localStorage)
  types/           → app.types.ts (Module, PageLabels, etc.)
  styles/          → midnight.css, soft-modern.css
  layouts/         → DashboardLayout (main app shell + sidebar)
  pages/           → All page components (50+ files)
    onboarding/    → Signup flow pages
    invoices/      → InvoiceBuilder, InvoiceDetail
    quotes/        → QuoteBuilder, QuoteDetail
    calls/         → CallDetail
    settings/      → BusinessSettings, ProfileTab, etc.
  components/      → 27 feature subdirectories + ui/ shared
    ui/            → Radix wrappers, skeletons, modals, AddressAutocomplete
    crm/           → Customer-related components
    pipeline/      → Kanban board components
    calendar/      → Calendar components
  services/        → settings.service.ts, etc.
```

---

## Industry Template System

This is the **core architecture pattern** of the CRM. All 11 industries share the same codebase but present different UX through labels and module visibility.

### Industries

| Key | Display Name |
|-----|-------------|
| `tax_accounting` | Tax & Accounting |
| `distribution_logistics` | Distribution & Logistics |
| `gyms_fitness` | Gyms & Fitness |
| `contractors_home_services` | Contractors & Home Services |
| `healthcare` | Healthcare |
| `real_estate` | Real Estate |
| `legal_services` | Legal Services |
| `general_business` | General Business (default) |
| `software_development` | Software Development |
| `mortgage_broker` | Mortgage Broker |
| `construction` | Construction |

### Configuration Objects in `src/config/modules.config.ts`

| Object | Purpose |
|--------|---------|
| `INDUSTRY_TEMPLATES` | Which modules each industry gets (array of module IDs) |
| `INDUSTRY_LABELS` | Sidebar nav label overrides (short names, e.g. "Members" vs "Customers") |
| `PAGE_LABELS` | Full page content overrides (title, subtitle, buttons, empty states, column headers) |
| `DEFAULT_PAGE_LABELS` | Fallback for all modules — `general_business` uses these |
| `getPageLabels(pageId, industryTemplate)` | Merges defaults + industry overrides |
| `usePageLabels(pageId)` | React hook consumed by page components |
| `getQuoteFieldLabels(industryTemplate)` | Customizes Quote/Invoice builder field labels |

### Critical Rule

**Never hardcode user-facing strings.** Always use `usePageLabels(pageId)` to get the correct label for the user's industry:

```tsx
// WRONG
<h1>Customers</h1>
<button>New Customer</button>

// RIGHT
const labels = usePageLabels('customers');
<h1>{labels.title}</h1>
<button>{labels.newButton}</button>
```

Examples of label differences:
- `customers` page: "Customers" (general) → "Clients" (tax) → "Members" (gym) → "Patients" (healthcare)
- `quotes` page: "Quotes" (general) → "Engagement Letters" (tax) → "Estimates" (contractors) → "Proposals" (real estate)

---

## Routing

```
/                        → Redirect to /dashboard
/login, /register        → Public auth pages
/onboarding/*            → Public signup flow

/dashboard/*             → Protected by RequireAuth
  /                      → Dashboard analytics
  /customers, /customers/:id
  /calendar, /quotes, /invoices
  /products, /pipeline, /calls
  /tasks, /suppliers, /inventory
  /financials, /settings, /chat, /reports

/quotes/builder[/:id]    → Quote builder (new/edit)
/invoices/builder[/:id]  → Invoice builder (new/edit)
```

**Important:** Builder routes do NOT have the `/dashboard/` prefix. They are top-level routes.

---

## Authentication & Authorization

### Auth Flow
- Supabase email/password auth
- Email confirmation is disabled (auto-confirms on signup)
- `AuthContext` provides: `user`, `loading`, `signUp`, `signIn`, `signOut`, `passwordReset`
- `RequireAuth` component guards all `/dashboard/*` routes

### Auth Token
- Stored in `localStorage` key: `sb-zkpfzrbbupgiqkzqydji-auth-token`
- JWT included as `Authorization: Bearer {token}` in API calls
- Token refreshed automatically by Supabase client

### Organization Membership
- Users belong to organizations via `organization_members` table
- Roles: Owner, Admin, Manager, User
- All data queries filtered by `organization_id` via RLS policies

### Module Access / Subscription Tiers

```typescript
PLAN_MODULE_ACCESS: {
  free: [...all modules for 30-day trial],
  business: [restricted set],
  elite_premium: [all modules],
  enterprise: [all modules]
}
```

- Free tier gets ALL modules for 30 days (`FREE_TRIAL_DAYS`)
- After trial, `FREE_TRIAL_ONLY_MODULES` are locked: pipeline, calls, products, inventory, suppliers, financials
- `useVisibleModules()` hook controls visibility and lock state

---

## Supabase Integration

### Project
- **Project ID:** `zkpfzrbbupgiqkzqydji`
- **Client init:** `src/lib/supabase.ts`

### CRITICAL: AbortController Bug (v2.57.4)

Supabase JS v2.57.4 has an internal `AbortController` that kills ALL in-flight HTTP requests during auth state transitions. This causes random query failures.

**Workaround:** Use direct `fetch()` to the Supabase REST API instead of `supabase.from().select()`:

```typescript
const token = JSON.parse(
  localStorage.getItem('sb-zkpfzrbbupgiqkzqydji-auth-token') || '{}'
)?.access_token;

const response = await fetch(
  'https://zkpfzrbbupgiqkzqydji.supabase.co/rest/v1/customers?organization_id=eq.{orgId}',
  {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### Row Level Security (RLS)

All tables enforce organization-level isolation:

```sql
-- Standard pattern for all data tables
CREATE POLICY "Users can access own org data" ON table_name
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members
      WHERE organization_id = table_name.organization_id
    )
  );
```

**Tables with RLS policies:** customers, deals, invoices, quotes, tasks, calls, products, pipeline stages, organization members, etc.

### Key Database Tables

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase-managed accounts (use Auth Admin API for deletion) |
| `user_profiles` | Extended user data (auto-created by `handle_new_user` trigger) |
| `organizations` | Company data: industry_template, subscription_tier, tax settings, branding |
| `organization_members` | Links users to orgs (user_id, organization_id, role) |
| `customers` | CRM contacts (org-scoped) |
| `deals` | Pipeline deals (org-scoped) |
| `invoices` / `invoice_items` | Invoice records with line items |
| `quotes` / `quote_items` | Quote records with line items |
| `tasks` | Task management (org-scoped) |
| `calls` | Call logging (org-scoped) |
| `products` | Product catalog (org-scoped) |
| `industry_pipeline_stages` | Pre-populated pipeline defaults per industry |
| `organization_pipeline_stages` | Per-org pipeline customization (overrides defaults) |
| `document_templates` | Quote/Invoice PDF templates (layout, colors, fonts) |

---

## State Management (Zustand)

23 stores with `persist` middleware. All persisted to `localStorage` with key prefix `cxtrack-`.

### Key Stores

| Store | Purpose |
|-------|---------|
| `organizationStore` | Current org, industry_template, subscription_tier |
| `authStore` | Auth state (user, session) |
| `customerStore` | Customer list and CRUD |
| `dealStore` | Pipeline deals |
| `invoiceStore` | Invoice management |
| `quoteStore` | Quote management |
| `taskStore` | Task management |
| `preferencesStore` | User prefs (theme, sidebar collapsed state) |
| `themeStore` | Theme selection (light, dark, midnight) |
| `pipelineConfigStore` | Pipeline stage configuration |
| `customFieldsStore` | Custom field definitions |

### Pattern

```typescript
// In components
const { currentOrganization } = useOrganizationStore();

// Direct synchronous read (outside React)
const org = useOrganizationStore.getState().currentOrganization;
```

---

## Theme System

### Three Themes
1. **Light** — Default Tailwind light mode
2. **Dark** — Tailwind `dark:` variant classes
3. **Midnight** — Premium glass morphism theme (custom CSS)

### Midnight Theme Architecture

**File:** `src/styles/midnight.css`

Activation: `themeStore.setTheme('midnight')` adds `.midnight` class to `<html>` element.

**Design tokens:**
```css
--mn-bg-void: #000000;                     /* True black background */
--mn-bg-surface: rgba(255,255,255, 0.03);  /* Glass surface */
--mn-text-primary: #FFF8E1;                /* Warm white text */
--mn-text-secondary: rgba(255,248,225, 0.7);
--mn-accent-gold: #FFD700;                 /* Premium gold accent */
--mn-accent-blue: #1E90FF;                 /* Action color */
--mn-border-subtle: rgba(255,215,0, 0.08);
```

**Key behavior:**
- Glass morphism effect via `backdrop-filter: blur(12px)` on card containers
- Form inputs (`input`, `select`, `textarea`) are **excluded** from backdrop-filter to prevent icon blur
- Midnight overrides Tailwind dark classes with `!important`
- Sidebar uses gradient background with gold accent borders

### Important CSS Rule

When adding new card/container components with `dark:bg-gray-800`, they automatically get the glass blur in midnight mode. **Form inputs must not inherit this** — the exclusion rule in `midnight.css` handles standard elements, but custom components may need explicit `backdrop-filter: none`.

---

## Tax System

### Organization Settings
- `default_tax_rate` (DECIMAL 5,2) — Pre-populates new invoices/quotes
- `tax_label` (TEXT) — Display label on documents ("HST", "Sales Tax", etc.)
- `business_tax_id` (TEXT) — GST/HST number, EIN, or VAT number

### Invoice/Quote Tax Flow
1. Organization sets default rate in Settings > Business Info > Tax & Identification
2. New invoice/quote pre-populates with org default rate
3. User can override rate per-document in the Summary section
4. Rate applies to all line items (stored as `tax_rate` on each line item)
5. Tax calculation: `SUM(line_total * tax_rate / 100)`

### Supported Tax Presets (Settings UI)
- **Canada:** HST 13% (ON), HST 15% (Atlantic), GST 5%, GST+PST 12% (BC), GST+PST 11% (SK), GST+QST 14.975% (QC)
- **US:** Sales Tax 0-10% (varies by state)

---

## PDF Generation

### Templates
Stored in `document_templates` table. Four layout types:
- `modern` — Contemporary with color accents
- `classic` — Traditional professional
- `minimal` — Clean whitespace design
- `creative` — Bold with product images

### Settings
- `logo_url` — Organization logo (Supabase Storage)
- `color_scheme` — `{ primary, accent }` hex colors
- `font_family` — Currently "Inter"
- `show_line_numbers`, `show_product_images` — Toggle features
- `header_text`, `footer_text`, `terms_text` — Custom text blocks

### Service
`settingsService.getTemplates(orgId, type)` — Fetches templates
`settingsService.getOrganizationForPDF(orgId)` — Fetches org info for PDF header

---

## Google Places Autocomplete

**Component:** `src/components/ui/AddressAutocomplete.tsx`

- Fully built, restricts to US and Canada (`componentRestrictions: { country: ['ca', 'us'] }`)
- Used in Profile Settings (Location) and Customer Form (Street Address)
- Requires `VITE_GOOGLE_MAPS_API_KEY` env variable
- SDK loaded in `index.html` via `%VITE_GOOGLE_MAPS_API_KEY%` replacement
- Guard: `indexOf('VITE_')` check prevents loading with unreplaced placeholder

**Setup:** See `MANUAL_TASKS.md` for Google API key configuration steps.

---

## Common Patterns

### 1. Organization Context Loading

Almost every page needs the current organization. Always check it exists before fetching data:

```tsx
const { currentOrganization } = useOrganizationStore();

useEffect(() => {
  if (!currentOrganization?.id) return;
  loadData(currentOrganization.id);
}, [currentOrganization?.id]);
```

### 2. Loading States

Show spinner while loading, not empty state. The user sees "No data" briefly before data loads otherwise:

```tsx
if (loading) return <Skeleton />;
if (data.length === 0) return <EmptyState />;
return <DataTable data={data} />;
```

### 3. Supabase Queries with Error Handling

```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('organization_id', orgId);

if (error) {
  console.error('Query failed:', error);
  toast({ title: 'Error', description: error.message, variant: 'destructive' });
  return;
}
```

### 4. Page Labels Hook

```tsx
const labels = usePageLabels('invoices');
// labels.title → "Invoices" or "Billing" or "Fee Proposals" etc.
// labels.entitySingular → "Invoice" or "Bill" etc.
// labels.newButton → "New Invoice" or "New Bill" etc.
// labels.emptyState → { title, description }
```

---

## Known Issues & Security Advisors

### Supabase Security Findings

These were flagged by Supabase advisors and should be reviewed:

1. **Exposed Auth Users:** `admin_user_view` and `user_call_agents_with_users` views expose `auth.users` to anon/authenticated roles
2. **Security Definer Views:** `admin_user_view`, `pipeline_values`, `user_call_agents_with_users` use SECURITY DEFINER — could bypass RLS
3. **Mutable Search Paths:** Several functions (`calculate_pipeline_value`, `generate_document_number`, `add_activity`, etc.) have mutable search paths — potential SQL injection vector
4. **Leaked Password Protection:** Currently disabled in Supabase Auth settings

See: https://supabase.com/docs/guides/database/database-linter

### AbortController Race Condition

See "Supabase Integration" section above. Auth state transitions can kill in-flight queries. Use direct `fetch()` for critical data loads.

---

## Deployment

| Setting | Value |
|---------|-------|
| Branch | `CRM-Template-Configuration` |
| Host | Netlify |
| Domain | crm.easyaicrm.com |
| Supabase Project | `zkpfzrbbupgiqkzqydji` |
| Build Command | `npm run build` |
| Output | `dist/` |

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Places autocomplete | Optional |

---

## Recent Changes Log

### Tax System (Feb 2025)
- Added `business_tax_id`, `default_tax_rate`, `tax_label` columns to `organizations`
- Added Tax & Identification section to Business Settings UI
- Invoice/Quote builders now support editable tax rate with org default pre-population
- Bottom Create/Save buttons added to both builders

### RLS Policy Fixes (Feb 2025)
- Added INSERT, UPDATE, DELETE policies for `invoices`, `products`, `quotes`, `tasks`
- Previously only SELECT policies existed, causing 403 errors on create/update operations

### Midnight Theme Fix (Feb 2025)
- Excluded form inputs from `backdrop-filter: blur()` to prevent icon blurriness
- Icons in inputs use `dark:text-gray-400` for visibility in dark/midnight modes

### Profile Name Split (Feb 2025)
- Split single `full_name` field into `first_name` + `last_name`
- Migration logic auto-splits existing names on first space
- `full_name` still derived for backward compatibility (avatar initials, etc.)
