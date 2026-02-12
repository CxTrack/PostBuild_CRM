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

---

## Execution Rules - MUST FOLLOW

### Rule 1: ALWAYS RUN BUILD BEFORE COMMIT

```bash
npm run build
```

- If build fails, DO NOT commit
- Fix the error first, then rebuild
- Only commit after successful build

### Rule 2: VERIFY FILE CHANGES ACTUALLY EXIST

After editing a file, run:
```bash
git diff <filename>
```

- If no diff output, the edit did NOT happen
- Re-apply the edit before proceeding

### Rule 3: ALWAYS PUSH AFTER COMMIT

Commits without push do nothing. Always run:
```bash
git push origin <branch-name>
```

Branches:
- Marketing Website: `main`
- CRM Application: `CRM-Template-Configuration`

### Rule 4: WHEN REPLACING ENTIRE FILE - USE COMPLETE CODE

When given complete file contents to replace:
1. Read the ENTIRE new code provided
2. Replace the ENTIRE file - don't try to merge
3. Verify line count matches expected

### Rule 5: NEVER LEAVE DANGLING SYNTAX

Common mistakes to avoid:
- `}, []);` without a matching opening
- `return () =>` outside of useEffect
- Functions defined outside component body
- Missing closing braces `}`

After editing, verify:
```bash
npx tsc --noEmit  # For TypeScript projects
```

### Rule 6: UNDERSTAND REACT HOOKS STRUCTURE

**useEffect structure:**
```tsx
useEffect(() => {
  // All code inside here

  return () => {
    // Cleanup here
  };
}, [dependencies]);
```

- `onAuthStateChange` subscriptions go INSIDE useEffect
- Cleanup/unsubscribe goes in the return function
- Dependencies array comes AFTER the closing brace

### Rule 7: READ FILE BEFORE EDITING

Before making changes:
```bash
cat <filename>
```

Understand the current structure before modifying.

### Rule 8: ONE LOGICAL CHANGE PER COMMIT

Don't combine unrelated changes. Each commit should:
- Fix one issue, OR
- Add one feature

### Rule 9: VERIFY CORRECT REPOSITORY

Before any work:
```bash
pwd
git remote -v
git branch
```

Confirm you're in the right repo and branch.

### Rule 10: REPORT ACTUAL RESULTS, NOT ASSUMPTIONS

- Don't say "changes committed" unless you ran `git commit` and saw success
- Don't say "pushed to remote" unless you ran `git push` and saw success
- Don't say "build passed" unless you ran `npm run build` and saw success

---

## Error History (Learn from these)

### Error 1: Uncommitted changes claimed as done
- **What happened:** Said changes were committed but `git status` showed nothing
- **Prevention:** Always run `git status` after commit to verify

### Error 2: Syntax error from broken useEffect
- **What happened:** `onAuthStateChange` was placed outside useEffect, leaving dangling `}, []);`
- **Prevention:** When editing hooks, always include the COMPLETE hook structure

### Error 3: Redirect URL missing path
- **What happened:** Redirected to root `/` instead of `/dashboard`, losing URL params
- **Prevention:** Trace the FULL user flow before implementing

---

## CHECKLIST BEFORE SAYING "DONE"

- [ ] `npm run build` passed
- [ ] `git diff` shows expected changes
- [ ] `git add <files>` completed
- [ ] `git commit -m "message"` succeeded
- [ ] `git push origin <branch>` succeeded
- [ ] Netlify shows new deployment (check if applicable)

---

## COPY THIS INTO EVERY GEMINI PROMPT:

```
IMPORTANT: Before responding, read and follow all rules in GEMINI.md

After completing the task:
1. Run `npm run build` - paste the result
2. Run `git diff` - paste the result
3. Run `git status` after commit - paste the result
4. Run `git push` - paste the result

Do NOT say the task is complete until all 4 commands show success.
```
