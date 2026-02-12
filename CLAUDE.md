# CxTrack Project - Claude Context File

> **CRITICAL**: Read this file at the start of EVERY conversation. This is the source of truth for deployment workflows.

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
-

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
