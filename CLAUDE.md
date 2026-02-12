# CxTrack Project - Claude Context File

> **CRITICAL**: Read this file at the start of EVERY conversation. This is the source of truth for deployment workflows.

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

### Before EVERY Code Change:
1. Check the file path - does it start with `c:\AntiGravity\Database implementation\`?
2. If it starts with `c:\Users\cxtra\Final_CxTrack_production\` - STOP! Wrong directory!
3. Navigate to the correct production directory before making changes

---

## ⚠️ CRITICAL: NO UNAUTHORIZED CHANGES ⚠️

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  DO NOT MAKE ANY CHANGES WITHOUT EXPLICIT USER PERMISSION!                     ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  ❌ DO NOT change code that wasn't explicitly requested                        ║
║  ❌ DO NOT delete code unless specifically asked                               ║
║  ❌ DO NOT "improve" or refactor unrelated code                                ║
║  ❌ DO NOT add features that weren't requested                                 ║
║  ❌ DO NOT make changes from previous session context without asking first     ║
║                                                                                ║
║  ✅ ONLY make changes that directly address the user's current request         ║
║  ✅ ASK for permission before touching anything outside the request scope      ║
║  ✅ If unsure whether something is in scope, ASK FIRST                         ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Why This Matters
On 2026-02-12, Login/Register pages were changed based on previous session context without explicit permission. This broke login functionality and caused significant user frustration. The user only asked to fix a customer creation bug (`company_name` → `company`), but unrelated auth page changes were also pushed.

### The Rule
**If the user asks to fix X, ONLY fix X. Do not touch Y or Z even if they seem related or were mentioned in previous context.**

---

## Project Identity

**Project Name:** CxTrack - AI-Powered CRM Platform
**Architecture:** Marketing Website + CRM Application (Separate Codebases, Shared Database)
**AI Workflow:** Claude (Planning/Oversight in VSCode) → Gemini Flash (Execution)

---

## The Two Repositories - NEVER MIX THESE

### Repository 1: Marketing Website
| Property | Value |
|----------|-------|
| **Name** | CxTrack Marketing Website |
| **Local Path** | `c:\AntiGravity\CxTrack_Manik_Website_Production_02` |
| **GitHub Remote** | `https://github.com/CxTrack/CxTrack_Official_Website.git` |
| **Deploy Branch** | `main` |
| **Production URL** | `easyaicrm.com` / `cxtrack.com` |
| **Framework** | Next.js 14 (App Router) |
| **Hosting** | Netlify |

**Responsibilities:**
- Public marketing pages (`/`, `/products`, `/pricing`, `/about`)
- User authentication flow (`/signup`, `/access`, `/login`)
- Onboarding wizard (`/onboarding/*`)
- Stripe checkout integration
- Industry template selection

### Repository 2: CRM Application
| Property | Value |
|----------|-------|
| **Name** | PostBuild CRM |
| **Local Path** | `c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM` |
| **GitHub Remote** | `https://github.com/CxTrack/PostBuild_CRM.git` |
| **Deploy Branch** | `CRM-Template-Configuration` |
| **Production URL** | `crm.easyaicrm.com` |
| **Framework** | React 18 + Vite |
| **Hosting** | Netlify |

**Responsibilities:**
- Dashboard and CRM modules
- Customer/Deal/Task management
- Voice agent integration
- Team collaboration features
- Settings and preferences

---

## DEPLOYMENT RULES (MEMORIZE THESE)

```
┌─────────────────────────────────────────────────────────────────┐
│  MARKETING WEBSITE CHANGES                                       │
│  ───────────────────────────────────────────────────────────────│
│  1. Work in: c:\AntiGravity\CxTrack_Manik_Website_Production_02 │
│  2. Commit to: main branch                                       │
│  3. Push to: https://github.com/CxTrack/CxTrack_Official_Website│
│  4. Deploys to: easyaicrm.com                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CRM APPLICATION CHANGES                                         │
│  ───────────────────────────────────────────────────────────────│
│  1. Work in: c:\AntiGravity\Database implementation\...         │
│              \Website-CRM-integration\PostBuild_CRM             │
│  2. Commit to: CRM-Template-Configuration branch                │
│  3. Push to: https://github.com/CxTrack/PostBuild_CRM.git       │
│  4. Deploys to: crm.easyaicrm.com                               │
└─────────────────────────────────────────────────────────────────┘
```

### FORBIDDEN Actions
- NEVER copy files between Marketing Website and CRM repos
- NEVER work on CRM code in the Marketing Website directory
- NEVER push CRM changes to the Marketing Website remote
- NEVER use `CxTrack_CRM_App` folder - it's a deprecated local-only dev copy

---

## Shared Infrastructure

### Database: Supabase
Both applications share the same Supabase project:
- **Project URL:** Stored in `.env` as `VITE_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
- **Anon Key:** Stored in `.env` as `VITE_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Core Tables
| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase Auth users |
| `user_profiles` | Extended user info |
| `organizations` | Company/team accounts |
| `organization_members` | User-org relationships with roles |
| `customers` | CRM contacts |
| `deals` | Sales pipeline |
| `tasks` | Task management |
| `calendar_events` | Scheduling |
| `calls` | Call logs (human + AI) |
| `quotes` / `invoices` | Financial documents |
| `industry_templates` | CRM configurations per industry |

### Authentication Flow
```
User Journey:
1. User visits easyaicrm.com/signup (Marketing Site)
2. Creates account → Supabase Auth
3. Selects industry template
4. Completes Stripe checkout (if paid plan)
5. Redirected to crm.easyaicrm.com/dashboard (CRM App)
6. CRM reads same Supabase session
```

---

## Tech Stack Reference

### Marketing Website (Next.js)
```
├── app/                    # Next.js App Router pages
│   ├── signup/            # Registration flow
│   ├── onboarding/        # Onboarding wizard
│   ├── products/          # Product pages
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities (supabase client, stripe)
└── .env.local            # Environment variables
```

### CRM Application (React + Vite)
```
├── src/
│   ├── contexts/          # React Context (AuthContext)
│   ├── stores/            # Zustand stores
│   ├── pages/             # Route pages
│   ├── components/        # UI components
│   ├── layouts/           # DashboardLayout
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   └── lib/               # Supabase client
└── .env                   # Environment variables
```

---

## Common Issues & Solutions

### Issue: Infinite loading spinner on CRM dashboard
**Cause:** `SIGNED_IN` event fires on every page load, clearing cache repeatedly
**Solution:** Track previous user ID, only clear cache on actual user change
**File:** `PostBuild_CRM/src/contexts/AuthContext.tsx`

### Issue: User sees wrong organization data
**Cause:** Cached organization from previous user
**Solution:** AuthContext clears cache when different user signs in

### Issue: Build fails on Netlify
**Checklist:**
1. Check Node version (should be 20)
2. Run `npm install` locally first
3. Check for TypeScript errors: `npm run build`
4. Verify all imports exist

### Issue: Changes not appearing on production
**Checklist:**
1. Correct branch pushed? (main for website, CRM-Template-Configuration for CRM)
2. Netlify build succeeded? Check deploy logs
3. Clear browser cache (Ctrl+Shift+R)

---

## Environment Variables

### Marketing Website (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_CRM_URL=https://crm.easyaicrm.com
```

### CRM Application (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MARKETING_URL=https://easyaicrm.com
VITE_STRIPE_PUBLISHABLE_KEY=
```

---

## Claude's Role in This Project

As Claude in VSCode, your responsibilities are:

1. **Planning & Architecture** - Design solutions before implementation
2. **Code Review** - Catch issues before they're deployed
3. **Documentation** - Keep this file and gemini.md updated
4. **Quality Control** - Verify changes are in the correct repository

### Before ANY Code Change:
1. Confirm which system needs the change (Marketing or CRM)
2. Verify you're looking at the correct directory
3. Check the deployment rules above
4. Plan the change, then hand off to Gemini for execution

---

## Session Continuity Notes

*Add notes here when compacting conversation to preserve context:*

- 2026-02-11: Fixed infinite loading loop in CRM dashboard (AuthContext cache clear issue)
- 2026-02-12: Cross-domain auth issue - MAJOR POST-MORTEM BELOW

---

## POST-MORTEM: Cross-Domain Auth Failure (2026-02-12)

### The Problem
User wanted login on marketing site (easyaicrm.com) to automatically authenticate users on CRM (crm.easyaicrm.com).

### What Went Wrong

#### Error 1: Failed to Research Before Implementing
- **Mistake:** Immediately started coding workarounds without researching Supabase's cross-domain auth capabilities
- **Should Have Done:** Search Supabase documentation for "cross-domain authentication", "subdomain auth", "shared sessions"
- **Cost:** Multiple failed attempts, wasted tokens, user frustration

#### Error 2: Tried Multiple Hacky Workarounds That Were Doomed to Fail
Attempted solutions that violate browser security fundamentals:

| Attempt | Why It Failed |
|---------|---------------|
| URL query params with tokens | Netlify SPA rewrite stripped them |
| Hash fragments (#access_token) | Also stripped/not persisted |
| Cookies with `domain=.easyaicrm.com` | Modern browsers block cross-subdomain cookies for security |
| iframe + postMessage | Still can't set cookies/localStorage on different origin |
| sessionStorage transfer | sessionStorage is per-origin, cannot be shared |

#### Error 3: Incorrectly Reported Project Status
- **Mistake:** Stated "Is directory a git repo: No" without verifying
- **Reality:** Both projects ARE git repos with proper remotes
- **Should Have Done:** Run `git status` before making claims about repo state

#### Error 4: Continued Trying Workarounds Instead of Stating the Truth
- **Mistake:** Kept proposing new hacky solutions instead of clearly stating: "This is fundamentally impossible with Supabase client-side auth"
- **Should Have Done:** After 2nd failed attempt, stop and research properly

### The Correct Solution (What Should Have Been Done First)
**Centralize all authentication on ONE domain.** This is the only correct approach:

1. Marketing site `/access` → Redirects to `crm.easyaicrm.com/login`
2. All auth (login, signup, password reset) happens on CRM domain
3. Supabase handles everything on single origin - no cross-domain issues

### Root Cause Analysis
Supabase stores auth tokens in `localStorage` which is **origin-specific**:
- `easyaicrm.com` has its own localStorage
- `crm.easyaicrm.com` has its own localStorage
- These CANNOT be shared via client-side code

**This is a browser security feature, not a bug.**

### Prevention Checklist (MANDATORY for Future Auth Work)

Before implementing ANY authentication changes:

- [ ] **Research first:** Search official documentation for the exact use case
- [ ] **Understand browser security model:** localStorage, cookies, CORS are origin-specific
- [ ] **State impossibilities clearly:** If something violates browser security, say so immediately
- [ ] **Verify git status:** Always run `git status` before making claims about repo state
- [ ] **Propose correct solution first:** Don't waste tokens on doomed workarounds
- [ ] **Ask clarifying questions:** "Do you want single-domain auth or are you okay with server-side complexity?"

### Files Modified (Final Correct State)

**Marketing Site:**
- `app/access/page.tsx` - Now just redirects to CRM login

**CRM:**
- `src/pages/auth/Login.tsx` - Updated with marketing site aesthetic
- `src/pages/auth/Register.tsx` - Updated with marketing site aesthetic
- `src/pages/auth/ForgotPassword.tsx` - Updated with marketing site aesthetic
- `src/pages/auth/ResetPassword.tsx` - Updated with marketing site aesthetic

### Deployment Required
```bash
# CRM (branch: CRM-Template-Configuration)
# ⚠️ USE PRODUCTION DIRECTORY, NOT Final_CxTrack_production!
cd "c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM"
git add src/pages/auth/
git commit -m "Update auth pages with marketing site aesthetic"
git push origin CRM-Template-Configuration

# Marketing Site (branch: main)
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
git add app/access/page.tsx
git commit -m "Redirect /access to CRM login"
git push origin main
```

### Key Lesson
**When encountering cross-origin auth requirements, the answer is almost always: "Put auth on one domain" or "Use server-side session management (complex)." There is no client-side magic that bypasses browser security.**

---

## POST-MORTEM: Wrong File Updated (2026-02-12)

### The Problem
Updated auth pages in `src/pages/auth/Login.tsx` but the live site kept showing the old UI.

### What Went Wrong

#### Error: Updated Wrong File Without Checking Router
- **Mistake:** Modified `src/pages/auth/Login.tsx` without checking which file App.tsx actually imports
- **Reality:** TWO Login.tsx files exist:
  - `src/pages/Login.tsx` - OLD file (actually used by router)
  - `src/pages/auth/Login.tsx` - NEW file (NOT used, just sitting there)
- **Should Have Done:**
  1. Check App.tsx imports FIRST
  2. Search for all files with same name: `find . -name "Login.tsx"`
  3. Trace the actual route to see which component is rendered

### Root Cause
The router in App.tsx imports from `src/pages/Login.tsx`, NOT `src/pages/auth/Login.tsx`:
```tsx
import Login from './pages/Login';  // OLD file
// NOT: import Login from './pages/auth/Login';  // NEW file we updated
```

### Files That Actually Need Updating
```
src/pages/Login.tsx      ← ACTUALLY USED
src/pages/Register.tsx   ← ACTUALLY USED (if exists at root)
```

NOT:
```
src/pages/auth/Login.tsx      ← NOT USED BY ROUTER
src/pages/auth/Register.tsx   ← NOT USED BY ROUTER
```

### Prevention Checklist (MANDATORY Before Updating ANY Component)

- [ ] **Check the router FIRST:** Look at App.tsx imports before editing anything
- [ ] **Search for duplicate files:** `find . -name "ComponentName.tsx"`
- [ ] **Verify import path:** Ensure the file you're editing matches the import path exactly
- [ ] **Test locally:** Run `npm run dev` and verify your changes appear

### Key Lesson
**ALWAYS trace the import chain from the router to the component before making changes. Never assume a file is used just because it exists.**

---

## Quick Reference Commands

### Marketing Website
```bash
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
npm run dev          # Local development
npm run build        # Test production build
git push origin main # Deploy to production
```

### CRM Application
```bash
cd "c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM"
npm run dev          # Local development
npm run build        # Test production build
git push origin CRM-Template-Configuration  # Deploy to production
```
