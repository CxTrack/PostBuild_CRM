# CxTrack Master System Prompt

> **PASTE THIS ENTIRE DOCUMENT at the start of every new AI session (Claude or Gemini)**

---

# SECTION 1: WORKSPACE SETUP (New Machine/New Workspace)

## Step 1: Clone Both Repositories

```bash
# Create workspace directory
mkdir c:\AntiGravity
cd c:\AntiGravity

# Clone Marketing Website (Next.js)
git clone https://github.com/CxTrack/CxTrack_Official_Website.git CxTrack_Manik_Website_Production_02
cd CxTrack_Manik_Website_Production_02
npm install
cd ..

# Clone CRM Application (React + Vite) - NOTE THE NESTED PATH!
mkdir -p "Database implementation/Website-CRM-integration"
cd "Database implementation/Website-CRM-integration"
git clone -b CRM-Template-Configuration https://github.com/CxTrack/PostBuild_CRM.git PostBuild_CRM
cd PostBuild_CRM
npm install
cd ../../..
```

## Step 2: Environment Variables

### Marketing Website: `c:\AntiGravity\CxTrack_Manik_Website_Production_02\.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[KEY]
STRIPE_SECRET_KEY=sk_live_[KEY]
STRIPE_WEBHOOK_SECRET=whsec_[KEY]
NEXT_PUBLIC_CRM_URL=https://crm.easyaicrm.com
```

### CRM Application: `c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM\.env`
```env
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY]
VITE_MARKETING_URL=https://easyaicrm.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_[KEY]
```

## Step 3: Verify Setup
```bash
# Marketing Website (should run on localhost:3000)
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02" && npm run dev

# CRM Application (should run on localhost:5173)
cd "c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM" && npm run dev
```

---

# SECTION 2: CRITICAL DEPLOYMENT RULES

## THE TWO REPOSITORIES - NEVER CONFUSE THESE

| | Marketing Website | CRM Application |
|--|-------------------|-----------------|
| **What It Is** | Landing pages, signup, onboarding, Stripe checkout | Dashboard, CRM modules, customer management |
| **Production URL** | `easyaicrm.com` | `crm.easyaicrm.com` |
| **Local Path** | `c:\AntiGravity\CxTrack_Manik_Website_Production_02` | `c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM` |
| **GitHub Remote** | `https://github.com/CxTrack/CxTrack_Official_Website.git` | `https://github.com/CxTrack/PostBuild_CRM.git` |
| **Deploy Branch** | `main` | `CRM-Template-Configuration` |
| **Framework** | Next.js 14 (App Router) | React 18 + Vite |
| **State Management** | React state / Server components | Zustand stores |
| **Auth Pattern** | `@supabase/auth-helpers-nextjs` | Custom `AuthContext` |
| **Router** | `next/navigation` | `react-router-dom` |

## FORBIDDEN ACTIONS
- NEVER copy files between Marketing Website and CRM repos
- NEVER push CRM code to Marketing Website remote (or vice versa)
- NEVER use the deprecated `CxTrack_CRM_App` folder
- NEVER confuse the two repositories

## DEPLOYMENT COMMANDS

### For Marketing Website changes:
```bash
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
git status                    # Verify correct repo
git branch                    # Should be: main
npm run build                 # Test build locally
git add [files]
git commit -m "description"
git push origin main          # Deploys to easyaicrm.com via Netlify
```

### For CRM Application changes:
```bash
cd "c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM"
git status                    # Verify correct repo
git branch                    # Should be: CRM-Template-Configuration
npm run build                 # Test build locally
git add [files]
git commit -m "description"
git push origin CRM-Template-Configuration  # Deploys to crm.easyaicrm.com via Netlify
```

---

# SECTION 3: SYSTEM ARCHITECTURE

## How The Two Apps Connect

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE DATABASE                                  │
│   (Shared by both applications - same project, same tables)                 │
│                                                                              │
│   Tables: auth.users, user_profiles, organizations, organization_members,  │
│           customers, deals, tasks, calendar_events, calls, quotes, invoices │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          │                                                   │
          ▼                                                   ▼
┌─────────────────────────┐                     ┌─────────────────────────┐
│   MARKETING WEBSITE     │                     │    CRM APPLICATION      │
│   easyaicrm.com         │  ─────────────────▶ │  crm.easyaicrm.com      │
│                         │  Redirect after     │                         │
│   Pages:                │  signup/login       │   Pages:                │
│   - / (landing)         │                     │   - /dashboard          │
│   - /signup             │                     │   - /dashboard/customers│
│   - /onboarding/*       │                     │   - /dashboard/pipeline │
│   - /products           │                     │   - /dashboard/calendar │
│   - /pricing            │                     │   - /dashboard/settings │
│                         │                     │   - etc.                │
│   Next.js 14            │                     │   React + Vite          │
└─────────────────────────┘                     └─────────────────────────┘
```

## User Authentication Flow

1. User visits `easyaicrm.com/signup` (Marketing Website)
2. Fills out signup form → Supabase Auth creates user
3. Selects industry template → Creates `organization` record
4. Completes Stripe checkout → Creates subscription
5. Redirected to `crm.easyaicrm.com/dashboard` (CRM Application)
6. CRM reads same Supabase session (shared via cookies)
7. CRM fetches user's `organization_members` record
8. Dashboard loads with organization data

---

# SECTION 4: FILE STRUCTURE

## Marketing Website (Next.js)
```
c:\AntiGravity\CxTrack_Manik_Website_Production_02\
├── app/
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout
│   ├── signup/page.tsx             # Registration
│   ├── onboarding/
│   │   ├── select-service/page.tsx # Service selection
│   │   ├── plan/page.tsx           # Plan selection
│   │   ├── voice-setup/page.tsx    # AI voice config
│   │   └── checkout/page.tsx       # Stripe checkout
│   ├── products/page.tsx           # Products page
│   └── api/
│       ├── signup/route.ts         # Signup API
│       └── stripe/                 # Stripe webhooks
├── components/                     # React components
├── lib/
│   ├── supabase.ts                 # Supabase client
│   └── stripe.ts                   # Stripe client
├── .env.local                      # Environment variables
└── package.json
```

## CRM Application (React + Vite)
```
c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM\
├── src/
│   ├── App.tsx                     # Router & routes
│   ├── main.tsx                    # Entry point
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication state (React Context)
│   ├── stores/
│   │   ├── organizationStore.ts    # Current org state (Zustand)
│   │   ├── customerStore.ts        # Customers CRUD
│   │   ├── dealStore.ts            # Deals/pipeline
│   │   ├── taskStore.ts            # Tasks
│   │   ├── calendarStore.ts        # Calendar events
│   │   ├── callStore.ts            # Call logs
│   │   └── ...
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── Customers.tsx
│   │   ├── Pipeline.tsx
│   │   └── ...
│   ├── layouts/
│   │   └── DashboardLayout.tsx     # Sidebar + main content
│   ├── components/
│   └── lib/
│       └── supabase.ts             # Supabase client
├── .env                            # Environment variables
└── package.json
```

---

# SECTION 5: COMMON BUGS & SOLUTIONS

## Bug: Infinite Loading Spinner on CRM Dashboard

**Symptoms:** After signup, CRM shows spinner forever. Console shows repeated "Cleared all cached data on sign-in"

**Cause:** Supabase `SIGNED_IN` event fires on every page load (not just actual sign-ins), triggering cache clear loop.

**Solution:** Track previous user ID with `useRef`, only clear cache when user ID actually changes.

**File:** `PostBuild_CRM/src/contexts/AuthContext.tsx`

## Bug: User Sees Wrong Organization Data

**Cause:** Cached organization from previous user in localStorage.

**Solution:** AuthContext clears cache when different user signs in.

## Bug: Build Fails on Netlify

**Checklist:**
1. Check Node version (must be 20)
2. Run `npm install` locally
3. Run `npm run build` locally to see errors
4. Fix TypeScript/import errors
5. Push fix

## Bug: Changes Not Appearing on Production

**Checklist:**
1. Pushed to correct branch? (`main` for website, `CRM-Template-Configuration` for CRM)
2. Check Netlify deploy logs
3. Clear browser cache (Ctrl+Shift+R)

---

# SECTION 6: DATABASE SCHEMA

## Core Tables

### organizations
```sql
id              UUID PRIMARY KEY
name            TEXT
industry_template TEXT  -- e.g., "tax_accounting", "real_estate"
subscription_tier TEXT  -- "free", "starter", "professional", "enterprise"
stripe_customer_id TEXT
stripe_subscription_id TEXT
metadata        JSONB
created_at      TIMESTAMP
```

### organization_members
```sql
id              UUID PRIMARY KEY
organization_id UUID REFERENCES organizations(id)
user_id         UUID REFERENCES auth.users(id)
role            TEXT  -- "owner", "admin", "member"
permissions     TEXT[]
joined_at       TIMESTAMP
```

### customers
```sql
id              UUID PRIMARY KEY
organization_id UUID REFERENCES organizations(id)
name            TEXT
email           TEXT
phone           TEXT
company         TEXT
status          TEXT  -- "Active", "Inactive", "Lead"
created_at      TIMESTAMP
```

### Industry Templates Available
- `tax_accounting` - Tax & Accounting
- `real_estate` - Real Estate
- `contractors_home_services` - Contractors
- `legal_services` - Legal
- `gyms_fitness` - Gyms & Fitness
- `distribution_logistics` - Logistics
- `healthcare` - Healthcare
- `software_development` - Software Development
- `mortgage_broker` - Mortgage Broker
- `general_business` - General Business

---

# SECTION 7: AI WORKFLOW

## Claude (VSCode) - Planning & Oversight
- Reads CLAUDE.md for context
- Designs solutions before implementation
- Verifies which repository needs changes
- Creates detailed handoff instructions for Gemini

## Gemini Flash - Execution
- Reads GEMINI.md for context
- Executes tasks Claude designs
- ALWAYS verifies repository before coding
- Runs `npm run build` before committing

## Handoff Template (Claude → Gemini)
```
# Task: [Brief Description]

## Target Repository
[X] Marketing Website OR [X] CRM Application

## Directory
[Full path]

## Branch
[main OR CRM-Template-Configuration]

## Files to Modify
1. path/to/file.tsx - [what to change]

## Steps
1. [Step 1]
2. [Step 2]

## Verification
- npm run build succeeds
- Feature works locally
- No console errors

## Commit Message
[type]: [description]
```

---

# SECTION 8: B.L.A.S.T. PROTOCOL

For new features, follow B.L.A.S.T.:

## B - Blueprint
1. What is the goal?
2. Which repository?
3. What data is involved?

## L - Link
1. Verify Supabase connection
2. Test any external APIs

## A - Architect
1. Document the approach
2. Plan the data flow
3. Write the code

## S - Stylize
1. Polish UI
2. Format outputs
3. Get feedback

## T - Trigger
1. `npm run build` locally
2. Commit with good message
3. Push to correct branch
4. Verify Netlify deploy

---

# SECTION 9: QUICK REFERENCE

## Pull Latest Code
```bash
# Marketing Website
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
git pull origin main

# CRM Application
cd "c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM"
git pull origin CRM-Template-Configuration
```

## Run Locally
```bash
# Marketing Website
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02" && npm run dev

# CRM Application
cd "c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM" && npm run dev
```

## Check Which Repo You're In
```bash
git remote -v    # Shows GitHub URL
git branch       # Shows current branch
pwd              # Shows current directory
```

---

# REMEMBER

1. **Always verify which repo** before making changes
2. **Never copy files** between Marketing and CRM repos
3. **Test build locally** before pushing
4. **Push to correct branch** (main OR CRM-Template-Configuration)
5. **Both apps share the same Supabase database**
