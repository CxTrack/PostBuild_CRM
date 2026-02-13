# CxTrack CRM - Gemini Execution Guide

> **YOUR ROLE:** You are the execution engine. Claude provides the plan, you implement it precisely. Never deviate from the specified repository or deployment target.

---

## STOP - Read Before Every Task

### Which Repository Are You Working In?

**BEFORE WRITING ANY CODE, ANSWER THIS QUESTION:**

| If the task involves... | Work in this directory | Push to this branch |
|------------------------|------------------------|---------------------|
| Marketing pages, signup, onboarding, pricing | `c:\AntiGravity\CxTrack_Manik_Website_Production_02` | `main` |
| CRM dashboard, customers, deals, tasks, calendar, settings | `c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM` | `CRM-Template-Configuration` |

### Repository Verification Checklist
Before making changes, run:
```bash
# For Marketing Website
cd "c:\AntiGravity\CxTrack_Manik_Website_Production_02"
git remote -v  # Should show: CxTrack/CxTrack_Official_Website.git
git branch     # Should be on: main

# For CRM Application
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
git remote -v  # Should show: CxTrack/PostBuild_CRM.git
git branch     # Should be on: CRM-Template-Configuration
```

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
**If the user asks to fix X, ONLY fix X. Do not touch Y or Z even if they seem related.**

---

## Project Architecture

### System Overview
```
+-------------------------------------------------------------------------+
|                         SUPABASE DATABASE                                |
|  (Shared between Marketing Website and CRM Application)                 |
|  Tables: auth.users, organizations, customers, deals, etc.              |
+-----------------------------------+-------------------------------------+
                                    |
        +---------------------------+---------------------------+
        |                                                       |
        v                                                       v
+---------------------------+                   +---------------------------+
|   MARKETING WEBSITE       |                   |    CRM APPLICATION        |
|   easyaicrm.com           | ----------------> |  crm.easyaicrm.com        |
|                           |   Redirect after  |                           |
|   - Signup/Login          |   authentication  |   - Dashboard             |
|   - Onboarding            |                   |   - Customers             |
|   - Stripe Checkout       |                   |   - Pipeline              |
|   - Landing Pages         |                   |   - All CRM modules       |
|                           |                   |                           |
|   Next.js 14              |                   |   React + Vite            |
|   App Router              |                   |   Zustand stores          |
+---------------------------+                   +---------------------------+
```

---

## File Structure Reference

### Marketing Website (Next.js)
```
c:\AntiGravity\CxTrack_Manik_Website_Production_02\
├── app/
│   ├── page.tsx                 # Homepage
│   ├── layout.tsx               # Root layout
│   ├── signup/page.tsx          # Registration form
│   ├── onboarding/              # Onboarding wizard
│   └── api/                     # API routes
├── components/
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── stripe.ts                # Stripe client
└── .env.local                   # Environment variables
```

### CRM Application (React + Vite)
```
c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM\
├── src/
│   ├── App.tsx                  # Router & routes
│   ├── main.tsx                 # Entry point
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication state
│   ├── stores/
│   │   ├── organizationStore.ts # Current org state
│   │   ├── customerStore.ts     # Customers CRUD
│   │   ├── dealStore.ts         # Deals/pipeline
│   │   └── ...
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── Customers.tsx
│   │   ├── Pipeline.tsx
│   │   └── ...
│   ├── layouts/
│   │   └── DashboardLayout.tsx  # Sidebar + main content
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

### Rule 3: Store Pattern (CRM Only)
- CRM uses Zustand stores with persist middleware
- Always use `.maybeSingle()` instead of `.single()` for queries that might return no rows
- Clear cache only on actual user change, not on page reload

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
cd "c:\Users\cxtra\Final_CxTrack_production\PostBuild_CRM"
# Create: src/pages/NewModule.tsx
# Add route to src/App.tsx
# Add to sidebar in src/layouts/DashboardLayout.tsx
git add .
git commit -m "feat: Add new module"
git push origin CRM-Template-Configuration
```

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

### Rule 4: READ FILE BEFORE EDITING

Before making changes:
```bash
cat <filename>
```

Understand the current structure before modifying.

### Rule 5: VERIFY CORRECT REPOSITORY

Before any work:
```bash
pwd
git remote -v
git branch
```

Confirm you're in the right repo and branch.

### Rule 6: REPORT ACTUAL RESULTS, NOT ASSUMPTIONS

- Don't say "changes committed" unless you ran `git commit` and saw success
- Don't say "pushed to remote" unless you ran `git push` and saw success
- Don't say "build passed" unless you ran `npm run build` and saw success

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
