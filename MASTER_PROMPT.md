# CxTrack Master System Prompt

> **PASTE THIS ENTIRE DOCUMENT at the start of every new AI session (Claude or Gemini)**

---

# SECTION 1: THE TWO REPOSITORIES

## Production Repositories - MEMORIZE THESE

| | Marketing Website | CRM Application |
|--|-------------------|-----------------|
| **What It Is** | Landing pages, signup, onboarding, Stripe checkout | Dashboard, CRM modules, customer management |
| **Production URL** | `easyaicrm.com` | `crm.easyaicrm.com` |
| **Local Path** | `c:\AntiGravity\CxTrack_Manik_Website_Production_02` | `c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM` |
| **GitHub Remote** | `https://github.com/CxTrack/CxTrack_Official_Website.git` | `https://github.com/CxTrack/PostBuild_CRM.git` |
| **Deploy Branch** | `main` | `CRM-Template-Configuration` |
| **Framework** | Next.js 14 (App Router) | React 18 + Vite |
| **State Management** | React state / Server components | Zustand stores |
| **Hosting** | Netlify | Netlify |

## FORBIDDEN ACTIONS
- NEVER copy files between Marketing Website and CRM repos
- NEVER push CRM code to Marketing Website remote (or vice versa)
- NEVER confuse the two repositories

---

# SECTION 2: DEPLOYMENT COMMANDS

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
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
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
+-------------------------------------------------------------------------+
|                           SUPABASE DATABASE                              |
|   (Shared by both applications - same project, same tables)             |
|                                                                          |
|   Tables: auth.users, user_profiles, organizations, organization_members,|
|           customers, deals, tasks, calendar_events, calls, quotes        |
+-----------------------------------+--------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-------------------------+                     +-------------------------+
|   MARKETING WEBSITE     |                     |    CRM APPLICATION      |
|   easyaicrm.com         |  -----------------> |  crm.easyaicrm.com      |
|                         |  Redirect after     |                         |
|   Pages:                |  signup/login       |   Pages:                |
|   - / (landing)         |                     |   - /dashboard          |
|   - /signup             |                     |   - /dashboard/customers|
|   - /onboarding/*       |                     |   - /dashboard/pipeline |
|   - /products           |                     |   - /dashboard/calendar |
|   - /pricing            |                     |   - /dashboard/settings |
|                         |                     |   - etc.                |
|   Next.js 14            |                     |   React + Vite          |
+-------------------------+                     +-------------------------+
```

---

# SECTION 4: FILE STRUCTURE

## Marketing Website (Next.js)
```
c:\AntiGravity\CxTrack_Manik_Website_Production_02\
├── app/
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout
│   ├── signup/page.tsx             # Registration
│   ├── onboarding/                 # Onboarding wizard
│   └── api/                        # API routes
├── components/
├── lib/
│   ├── supabase.ts                 # Supabase client
│   └── stripe.ts                   # Stripe client
└── .env.local                      # Environment variables
```

## CRM Application (React + Vite)
```
c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM\
├── src/
│   ├── App.tsx                     # Router & routes
│   ├── main.tsx                    # Entry point
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication state
│   ├── stores/
│   │   ├── organizationStore.ts    # Current org state
│   │   ├── customerStore.ts        # Customers CRUD
│   │   └── ...
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── Customers.tsx
│   │   └── ...
│   ├── layouts/
│   │   └── DashboardLayout.tsx     # Sidebar + main content
│   └── lib/
│       └── supabase.ts             # Supabase client
└── .env                            # Environment variables
```

---

# SECTION 5: COMMON BUGS & SOLUTIONS

## Bug: Infinite Loading Spinner on CRM Dashboard

**Symptoms:** After signup, CRM shows spinner forever.

**Cause:** Supabase `SIGNED_IN` event fires on every page load, triggering cache clear loop.

**Solution:** Track previous user ID with `useRef`, only clear cache when user ID actually changes.

**File:** `PostBuild_CRM/src/contexts/AuthContext.tsx`

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

# SECTION 6: AI WORKFLOW

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

---

# SECTION 7: QUICK REFERENCE

## Pull Latest Code
```bash
# Marketing Website
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
git pull origin main

# CRM Application
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
git pull origin CRM-Template-Configuration
```

## Run Locally
```bash
# Marketing Website (localhost:3000)
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02" && npm run dev

# CRM Application (localhost:5173)
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM" && npm run dev
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
