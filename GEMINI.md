# CxTrack Project - Gemini Execution Guide

> **YOUR ROLE:** You are the execution engine. Claude provides the plan, you implement it precisely. Never deviate from the specified repository or deployment target.

---

## ⚠️ CRITICAL WARNING: TWO CRM DIRECTORIES EXIST ⚠️

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  STOP! VERIFY YOUR DIRECTORY BEFORE MAKING ANY CHANGES!                        ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  PRODUCTION CRM (deploys to crm.easyaicrm.com):                               ║
║  ✅ c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM║
║                                                                                ║
║  NON-PRODUCTION CRM (local development copy - DOES NOT DEPLOY):               ║
║  ❌ c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM                       ║
║                                                                                ║
║  ALWAYS WORK IN THE PRODUCTION DIRECTORY!                                      ║
║  Changes to the non-production directory will NOT appear on the live site!     ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Why This Matters
On 2026-02-12, hours were wasted making changes to the wrong directory. Auth pages were updated in the non-production folder, but the live site kept showing the old styling because the production directory wasn't touched.

---

## STOP - Read Before Every Task

### Which Repository Are You Working In?

**BEFORE WRITING ANY CODE, ANSWER THIS QUESTION:**

| If the task involves... | Work in this directory | Push to this branch |
|------------------------|------------------------|---------------------|
| Marketing pages, signup, onboarding, pricing, landing pages | `c:\AntiGravity\CxTrack_Manik_Website_Production_02` | `main` |
| CRM dashboard, customers, deals, tasks, calendar, settings | `c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM` | `CRM-Template-Configuration` |

### Repository Verification Checklist
Before making changes, run:
```bash
# For Marketing Website
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
git remote -v  # Should show: CxTrack/CxTrack_Official_Website.git
git branch     # Should be on: main

# For CRM Application
cd "c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM"
git remote -v  # Should show: CxTrack/PostBuild_CRM.git
git branch     # Should be on: CRM-Template-Configuration
```

---

## Project Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                            │
│  (Shared between Marketing Website and CRM Application)             │
│  Tables: auth.users, organizations, customers, deals, etc.          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼                                               ▼
┌───────────────────────┐                   ┌───────────────────────┐
│   MARKETING WEBSITE   │                   │    CRM APPLICATION    │
│   easyaicrm.com       │ ───────────────▶  │  crm.easyaicrm.com    │
│                       │   Redirect after  │                       │
│   - Signup/Login      │   authentication  │   - Dashboard         │
│   - Onboarding        │                   │   - Customers         │
│   - Stripe Checkout   │                   │   - Pipeline          │
│   - Landing Pages     │                   │   - All CRM modules   │
│                       │                   │                       │
│   Next.js 14          │                   │   React + Vite        │
│   App Router          │                   │   Zustand stores      │
└───────────────────────┘                   └───────────────────────┘
```

### User Authentication Flow
```
1. User → easyaicrm.com/signup
2. Form submission → Supabase Auth (creates user)
3. Industry selection → Creates organization record
4. Stripe checkout → Creates subscription
5. Redirect → crm.easyaicrm.com/dashboard
6. CRM reads Supabase session → Loads user's organization
```

---

## Data Schemas

### Core Entities

#### User (auth.users + user_profiles)
```typescript
interface User {
  id: string;                    // UUID from Supabase Auth
  email: string;
  user_metadata: {
    full_name?: string;
  };
}

interface UserProfile {
  id: string;                    // Same as auth.users.id
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}
```

#### Organization
```typescript
interface Organization {
  id: string;
  name: string;
  industry_template: string;     // e.g., "tax_accounting", "real_estate"
  subscription_tier: string;     // "free", "starter", "professional", "enterprise"
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  metadata?: {
    sharing?: Record<string, boolean>;
    features?: string[];
  };
  created_at: string;
}
```

#### OrganizationMember
```typescript
interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  permissions?: string[];
  joined_at: string;
}
```

#### Customer
```typescript
interface Customer {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'Active' | 'Inactive' | 'Lead';
  created_at: string;
}
```

---

## File Structure Reference

### Marketing Website (Next.js)
```
c:\AntiGravity\CxTrack_Manik_Website_Production_02\
├── app/
│   ├── page.tsx                 # Homepage
│   ├── layout.tsx               # Root layout
│   ├── signup/
│   │   └── page.tsx             # Registration form
│   ├── onboarding/
│   │   ├── select-service/      # Service selection
│   │   ├── plan/                # Plan selection
│   │   ├── voice-setup/         # AI voice config
│   │   └── checkout/            # Stripe checkout
│   ├── products/
│   │   ├── page.tsx             # Products overview
│   │   └── crm/page.tsx         # CRM product page
│   └── api/
│       ├── signup/route.ts      # Signup API
│       └── stripe/              # Stripe webhooks
├── components/
│   ├── Navbar.tsx
│   ├── ServiceCard.tsx
│   └── ...
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── stripe.ts                # Stripe client
└── .env.local                   # Environment variables
```

### CRM Application (React + Vite)
```
c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM\
├── src/
│   ├── App.tsx                  # Router & routes
│   ├── main.tsx                 # Entry point
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication state
│   ├── stores/
│   │   ├── organizationStore.ts # Current org state
│   │   ├── customerStore.ts     # Customers CRUD
│   │   ├── dealStore.ts         # Deals/pipeline
│   │   ├── taskStore.ts         # Tasks
│   │   └── ...
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── Customers.tsx
│   │   ├── Pipeline.tsx
│   │   └── ...
│   ├── layouts/
│   │   └── DashboardLayout.tsx  # Sidebar + main content
│   ├── components/
│   │   └── ...
│   └── lib/
│       └── supabase.ts          # Supabase client
└── .env                         # Environment variables
```

---

## Behavioral Rules

### Rule 1: Repository Isolation
- Marketing Website code NEVER goes in CRM directory
- CRM code NEVER goes in Marketing Website directory
- No copying files between repositories

### Rule 2: Branch Discipline
- Marketing Website: Always work on `main` branch
- CRM Application: Always work on `CRM-Template-Configuration` branch

### Rule 3: Auth Pattern Consistency
- Marketing Website: Uses `createClientComponentClient()` from `@supabase/auth-helpers-nextjs`
- CRM Application: Uses `AuthContext` with `supabase.auth.onAuthStateChange()`

### Rule 4: Store Pattern (CRM Only)
- CRM uses Zustand stores with persist middleware
- Always use `.maybeSingle()` instead of `.single()` for queries that might return no rows
- Clear cache only on actual user change, not on page reload

### Rule 5: Navigation
- Marketing Website: Uses Next.js `<Link>` and `useRouter()`
- CRM Application: Uses react-router-dom `<Link>` and `useNavigate()`

---

## Common Tasks

### Task: Add a new page to Marketing Website
```bash
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
# Create: app/new-page/page.tsx
# Add to navigation if needed
git add .
git commit -m "feat: Add new page"
git push origin main
```

### Task: Add a new module to CRM
```bash
cd "c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM"
# Create: src/pages/NewModule.tsx
# Add route to src/App.tsx
# Add to sidebar in src/layouts/DashboardLayout.tsx
git add .
git commit -m "feat: Add new module"
git push origin CRM-Template-Configuration
```

### Task: Update database schema
1. Make changes in Supabase dashboard
2. Update TypeScript types in BOTH repos if needed
3. Test locally in both applications
4. Deploy both if types changed

---

## Error Recovery

### If you pushed to wrong branch/repo:
```bash
# Revert the last commit (if not yet pushed to others)
git revert HEAD
git push

# Or reset if you haven't pushed
git reset --hard HEAD~1
```

### If build fails on Netlify:
1. Check build logs in Netlify dashboard
2. Run `npm run build` locally to reproduce
3. Fix TypeScript/import errors
4. Push fix

### If CRM shows infinite loading:
- Check `AuthContext.tsx` - ensure `SIGNED_IN` handler doesn't clear cache on every page load
- Check browser console for error loops
- Verify `organization_members` record exists for user

---

## Testing Checklist

Before pushing ANY change:

- [ ] `npm run build` succeeds locally
- [ ] Correct repository directory confirmed
- [ ] Correct branch confirmed
- [ ] No console errors in browser
- [ ] Feature works as expected locally

---

## Progress Log

*Update this after each session:*

| Date | Change | Status |
|------|--------|--------|
| 2026-02-11 | Fixed infinite loading loop in AuthContext | Deployed |
| | | |

---

## Findings

*Document discoveries, constraints, and learnings:*

- Supabase `SIGNED_IN` event fires on page load when session exists, not just on actual sign-in
- Zustand persist middleware reads from localStorage on mount - clearing localStorage resets store state
- Both repos must have matching Supabase credentials to share authentication
