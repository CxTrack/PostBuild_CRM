# CxTrack CRM - Claude Context File

> **MANDATORY**: Run the validation check below BEFORE making ANY changes.

---

## MANDATORY PRE-FLIGHT CHECK

```
+============================================================================+
|  CHECKPOINT 1: Am I in the correct directory?                              |
|  --------------------------------------------------------------------------|
|  CORRECT: c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM            |
|                                                                            |
|  CHECKPOINT 2: What is the hosting platform?                               |
|  --------------------------------------------------------------------------|
|  CORRECT: Netlify                                                          |
|  WRONG:   Vercel, AWS, Heroku, etc.                                        |
|                                                                            |
|  CHECKPOINT 3: What branch deploys to production?                          |
|  --------------------------------------------------------------------------|
|  CORRECT: CRM-Template-Configuration                                       |
|  WRONG:   main, master, develop                                            |
+============================================================================+
```

**If ANY checkpoint fails, STOP and ask the user before proceeding.**

---

## Quick Facts (Memorize These)

| Property | Value |
|----------|-------|
| **Production URL** | crm.easyaicrm.com |
| **Hosting** | Netlify |
| **Deploy Branch** | CRM-Template-Configuration |
| **Framework** | React 18 + Vite |
| **Database** | Supabase |
| **Production Path** | `c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM` |

---

## NO UNAUTHORIZED CHANGES

```
+============================================================================+
|  DO NOT MAKE ANY CHANGES WITHOUT EXPLICIT USER PERMISSION!                 |
|  --------------------------------------------------------------------------|
|                                                                            |
|  DO NOT change code that wasn't explicitly requested                       |
|  DO NOT delete code unless specifically asked                              |
|  DO NOT "improve" or refactor unrelated code                               |
|  DO NOT add features that weren't requested                                |
|  DO NOT make changes from previous session context without asking first    |
|                                                                            |
|  ONLY make changes that directly address the user's current request        |
|  ASK for permission before touching anything outside the request scope     |
|  If unsure whether something is in scope, ASK FIRST                        |
|                                                                            |
+============================================================================+
```

### The Rule
**If the user asks to fix X, ONLY fix X. Do not touch Y or Z even if they seem related or were mentioned in previous context.**

---

## The Two Production Repositories

### Marketing Website
| Property | Value |
|----------|-------|
| **Path** | `c:\AntiGravity\CxTrack_Manik_Website_Production_02` |
| **GitHub Remote** | `https://github.com/CxTrack/CxTrack_Official_Website.git` |
| **URL** | easyaicrm.com |
| **Branch** | main |
| **Hosting** | Netlify |

### CRM Application (THIS REPO)
| Property | Value |
|----------|-------|
| **Path** | `c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM` |
| **GitHub Remote** | `https://github.com/CxTrack/PostBuild_CRM.git` |
| **URL** | crm.easyaicrm.com |
| **Branch** | CRM-Template-Configuration |
| **Hosting** | Netlify |

---

## Deployment Commands

```bash
# CRM Application
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
npm run build                                    # Test build
git add .
git commit -m "Description"
git push origin CRM-Template-Configuration       # Deploys to Netlify

# Marketing Website
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
npm run build
git add .
git commit -m "Description"
git push origin main                             # Deploys to Netlify
```

---

## Database: Supabase

- **Project ID**: zkpfzrbbupgiqkzqydji
- **URL**: https://zkpfzrbbupgiqkzqydji.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/zkpfzrbbupgiqkzqydji
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcGZ6cmJidXBnaXFrenF5ZGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjU2NiwiZXhwIjoyMDg1ODAyNTY2fQ.7GFcwHDR6zAZBnh74vVJke40unovy3xE0Wygbwh79iQ

### How to Query Database

**To run SQL queries, ASK THE USER to either:**
1. Provide the **service role key** (for auth tables)
2. Run the query in Supabase Dashboard and share results

**Key Tables:**
| Table | Purpose |
|-------|---------|
| `auth.users` | User accounts (requires service role) |
| `user_profiles` | Extended user info |
| `organizations` | Companies, industry_template, subscription_tier |
| `organization_members` | Links users to orgs |

**Common Debug Query (ask user to run in dashboard):**
```sql
SELECT u.email, om.organization_id, o.name, o.industry_template, o.subscription_tier
FROM auth.users u
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
WHERE u.email = 'user@example.com';
```

---

## Common Issues

### Login not working
1. Clear localStorage: `localStorage.clear(); sessionStorage.clear(); location.reload();`
2. Check AuthContext.tsx - should be simple, no complex timeouts
3. Verify Supabase is accessible
4. Check browser console for `[Auth]` log messages

### Changes not appearing on production
1. Verify you're in the correct directory
2. Check Netlify deploy logs
3. Hard refresh: Ctrl+Shift+R

### Build failing
1. Run `npm run build` locally first
2. Check TypeScript errors
3. Verify all imports exist

### Navigation redirects to dashboard unexpectedly
1. Check if the route exists in `src/App.tsx`
2. Check if the component is imported in App.tsx
3. Check if the component file exists
4. The fallback route `<Route path="*" element={<Navigate to="/dashboard" replace />}` catches unmatched routes

---

## Historical Mistakes (Learn From These)

### 2026-02-12: Missing Route Definition in App.tsx
- CustomerProfile component existed at `src/pages/CustomerProfile.tsx`
- But it was NEVER imported or routed in App.tsx
- Result: Clicking a customer redirected to dashboard (fallback route)
- Prevention: **When debugging navigation issues, ALWAYS check:**
  1. Does the component file exist?
  2. Is it imported in App.tsx?
  3. Is the route defined in App.tsx?

### 2026-02-12: Searching Wrong Directory
- Kept searching in `Website-CRM-integration` directory
- Correct path is `c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM`
- Result: Wasted time, user frustration
- Prevention: **ALWAYS use the paths in MANDATORY PRE-FLIGHT CHECK above**

### 2026-02-12: Wrong Platform
- Said "deploy to Vercel" when platform is Netlify
- Result: Confused instructions
- Prevention: Platform is ALWAYS Netlify for this project

### 2026-02-12: Timeout Too Short
- 3-second getSession() timeout was too aggressive
- Result: Auth tokens cleared prematurely, users couldn't log in
- Prevention: Removed timeout entirely - Supabase handles tokens automatically

---

## AI Assistant Rules

1. **READ THIS FILE** at the start of every session
2. **VERIFY DIRECTORY** before any file edit
3. **ASK PERMISSION** before changing anything not explicitly requested
4. **NEVER ASSUME** - always verify platform, branch, directory
5. **STATE CLEARLY** if something is impossible instead of trying hacky workarounds
6. **PROVIDE GEMINI PROMPT** - Always end with a copy-paste ready prompt for Gemini
7. **ASK QUESTIONS WHEN STUCK** - Do NOT guess or make things up. If missing info, ASK THE USER.
8. **BE EFFICIENT** - Minimize token usage, don't repeat yourself, be concise
9. **NO QUICK FIXES** - Always build proper, production-ready systems. Never apply band-aid solutions.
10. **ANALYZE HARDCODED VALUES** - When finding hardcoded strings/values, analyze if they should be dynamic. This CRM is highly flexible and industry-variable - most hardcoded text should be configurable per industry template.

---

## Industry Template System

**CRITICAL**: CxTrack is a multi-industry CRM. ALL user-facing text must be dynamic based on `industry_template`.

### Architecture
- **Config:** `src/config/modules.config.ts` - defines available modules and industry labels
- **Hook:** `src/hooks/useIndustryLabel.ts` - retrieves industry-specific labels
- **Templates:** Each industry has different terminology (see below)

### Industry Terminology Reference

| Industry | customers → | invoices → | quotes → | pipeline → | tasks → |
|----------|-------------|------------|----------|------------|---------|
| **mortgage_broker** | Borrowers | Commissions | - | Applications | Follow-ups |
| **real_estate** | Contacts | - | Listing Proposals | Deal Pipeline | Tasks |
| **contractors_home_services** | Clients | Invoices | Estimates | Job Pipeline | Tasks |
| **healthcare** | Patients | Invoices | - | - | Tasks |
| **legal_services** | Clients | Invoices | Fee Proposals | Case Pipeline | Tasks |
| **tax_accounting** | Clients | Invoices | Engagement Letters | - | Tasks |
| **construction** | Clients | Invoices | Bids | Projects | Punch List |
| **gyms_fitness** | Members | Invoices | - | Membership Pipeline | Tasks |
| **software_development** | Clients | Billing | Proposals | Projects | Sprints & Tasks |
| **general_business** | Customers | Invoices | Quotes | Pipeline | Tasks |

### When Adding New Pages/Features
1. NEVER hardcode user-facing strings
2. Use `useIndustryLabel(moduleId)` for module names
3. Use `usePageLabels(pageId)` for page content (titles, descriptions, buttons, empty states)
4. Check `modules.config.ts` for existing labels before adding new ones

---

## Claude to Gemini Workflow

**Claude's Role:** Planning, analysis, code review, architecture decisions
**Gemini's Role:** Execute file changes, run commands, deploy

### After Every Task, Claude MUST Provide:

```
## Gemini Execution Prompt

**Directory:** c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM

**Task:** [Brief description]

### File Changes:

**File: `src/path/to/file.tsx`**
- Line X: Change `old code` to `new code`
- Line Y: Change `old code` to `new code`

### Commands to Run:
```bash
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
npm run build
git add [specific files]
git commit -m "Description of change"
git push origin CRM-Template-Configuration
```

### Verification:
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Feature works as expected
```

### Template for Find & Replace Tasks:

```
**File:** `src/path/to/file.tsx`
**Find:** `/old-pattern/`
**Replace with:** `/new-pattern/`
**Replace all:** Yes/No
```

### Template for New Code:

```
**File:** `src/path/to/file.tsx`
**Insert after line X:**
```tsx
// new code here
```
```

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
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
npm run dev          # Local development
npm run build        # Test production build
git push origin CRM-Template-Configuration  # Deploy to production
```
