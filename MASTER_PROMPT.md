# CxTrack Master Prompt

> **Copy and paste the appropriate section when starting a new conversation**

---

## For Claude (VSCode Planning & Oversight)

```
# CxTrack Project Context

I'm working on the CxTrack platform - an AI-powered CRM with two separate codebases:

## CRITICAL: Two Separate Repositories

### 1. Marketing Website (easyaicrm.com)
- **Path:** `c:\AntiGravity\CxTrack_Manik_Website_Production_02`
- **Remote:** https://github.com/CxTrack/CxTrack_Official_Website.git
- **Branch:** `main`
- **Framework:** Next.js 14 (App Router)
- **Purpose:** Landing pages, signup, onboarding, Stripe checkout

### 2. CRM Application (crm.easyaicrm.com)
- **Path:** `c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM`
- **Remote:** https://github.com/CxTrack/PostBuild_CRM.git
- **Branch:** `CRM-Template-Configuration`
- **Framework:** React + Vite + Zustand
- **Purpose:** Dashboard, CRM modules, customer management

## Shared Infrastructure
- **Database:** Supabase (shared between both apps)
- **Auth:** Supabase Auth (session shared via cookies)
- **Payments:** Stripe

## Your Role
1. Read CLAUDE.md and GEMINI.md before making any changes
2. Verify which repository a change belongs to
3. Plan changes carefully before implementation
4. Hand off execution tasks to Gemini with clear instructions
5. Never copy files between repositories - they have different architectures

## Deployment Rules
- Marketing changes → push to `main` on CxTrack_Official_Website
- CRM changes → push to `CRM-Template-Configuration` on PostBuild_CRM

Read the full context in: CLAUDE.md
```

---

## For Gemini Flash (Execution)

```
# CxTrack Execution Context

You are executing tasks for the CxTrack platform. STOP and verify before any code change.

## MANDATORY PRE-FLIGHT CHECK

Before writing ANY code, confirm:
1. Which system? Marketing Website OR CRM Application
2. Which directory? (See below)
3. Which branch? (See below)

## Repository Map

| System | Directory | Branch | Deploys To |
|--------|-----------|--------|------------|
| Marketing | `c:\AntiGravity\CxTrack_Manik_Website_Production_02` | `main` | easyaicrm.com |
| CRM | `c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM` | `CRM-Template-Configuration` | crm.easyaicrm.com |

## FORBIDDEN
- Never copy files between Marketing and CRM repos
- Never push CRM code to Marketing repo or vice versa
- Never use the deprecated `CxTrack_CRM_App` directory

## Architecture Differences

| Aspect | Marketing Website | CRM Application |
|--------|------------------|-----------------|
| Framework | Next.js 14 | React + Vite |
| Router | App Router | react-router-dom |
| Auth | @supabase/auth-helpers-nextjs | Custom AuthContext |
| State | React state | Zustand stores |
| Navigation | next/link | react-router-dom Link |

## Before Every Push
```bash
# Verify you're in the right repo
git remote -v
git branch
npm run build  # Must succeed
```

Read the full context in: GEMINI.md
```

---

## B.L.A.S.T. Protocol Prompt (For New Features)

```
# B.L.A.S.T. Protocol - New Feature Implementation

You are the System Pilot using the B.L.A.S.T. protocol for the CxTrack platform.

## Phase 0: Initialization (MANDATORY)

Before any code:
1. Create/update task_plan.md with phases and goals
2. Create/update findings.md for research and discoveries
3. Create/update progress.md for tracking work
4. Verify GEMINI.md has correct data schemas

## Phase 1: Blueprint (Vision & Logic)

Answer these questions:
1. **North Star:** What is the singular desired outcome?
2. **Which Repository:** Marketing Website or CRM Application?
3. **Source of Truth:** Which Supabase tables are involved?
4. **Delivery:** Where does the result appear? (URL, UI location)
5. **Behavioral Rules:** Any constraints or "Do Not" rules?

Define the Data Schema in GEMINI.md before coding.

## Phase 2: Link (Connectivity)

1. Verify Supabase connection works
2. Test any external APIs
3. Confirm environment variables are set

## Phase 3: Architect (3-Layer Build)

Layer 1 - Architecture: Document the approach in task_plan.md
Layer 2 - Navigation: Plan the data/logic flow
Layer 3 - Tools: Write the actual code

## Phase 4: Stylize (Refinement)

1. Format outputs professionally
2. Apply consistent UI patterns
3. Get user feedback before finalizing

## Phase 5: Trigger (Deployment)

1. Run `npm run build` locally
2. Commit with descriptive message
3. Push to correct branch (main OR CRM-Template-Configuration)
4. Verify Netlify deployment succeeds

## Repository Reminder
- Marketing Website: `c:\AntiGravity\CxTrack_Manik_Website_Production_02` → `main`
- CRM Application: `c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM` → `CRM-Template-Configuration`
```

---

## Quick Start Prompt (For Bug Fixes)

```
# CxTrack Bug Fix Context

I need to fix a bug in the CxTrack platform.

## Repository Verification Required

Before any change, confirm:
- Marketing Website bugs → work in `c:\AntiGravity\CxTrack_Manik_Website_Production_02`
- CRM Application bugs → work in `c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM`

## Known Issues & Solutions

### Infinite Loading on CRM Dashboard
- Cause: SIGNED_IN event fires on page load, clearing cache
- Fix: Track previous user ID, only clear on actual user change
- File: PostBuild_CRM/src/contexts/AuthContext.tsx

### Wrong Organization Data
- Cause: Cached data from previous user
- Fix: AuthContext clears cache on user change

### Build Failures
1. Check Node version (20)
2. Run `npm install`
3. Fix TypeScript errors

## Deployment
- Marketing → `git push origin main`
- CRM → `git push origin CRM-Template-Configuration`
```

---

## Handoff Template (Claude → Gemini)

Use this format when handing tasks from Claude to Gemini:

```
# Task Handoff: [Brief Description]

## Target Repository
- [ ] Marketing Website (`c:\AntiGravity\CxTrack_Manik_Website_Production_02`)
- [ ] CRM Application (`c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM`)

## Files to Modify
1. `path/to/file1.tsx` - [description of change]
2. `path/to/file2.ts` - [description of change]

## Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Verification
- [ ] `npm run build` succeeds
- [ ] Feature works locally
- [ ] No console errors

## Deployment
- Branch: [main OR CRM-Template-Configuration]
- Commit message: "[type]: [description]"
```

---

## File Locations Summary

```
c:\AntiGravity\
├── CxTrack_Manik_Website_Production_02\    # Marketing Website (DEPLOY)
│   ├── CLAUDE.md                           # Claude context
│   ├── GEMINI.md                           # Gemini execution guide
│   ├── MASTER_PROMPT.md                    # This file
│   ├── app\                                # Next.js pages
│   └── components\                         # React components
│
├── Database implementation\
│   └── Website-CRM-integration\
│       └── PostBuild_CRM\                  # CRM Application (DEPLOY)
│           ├── src\
│           │   ├── contexts\               # AuthContext
│           │   ├── stores\                 # Zustand stores
│           │   ├── pages\                  # Route pages
│           │   └── layouts\                # DashboardLayout
│           └── .env                        # Environment vars
│
└── CxTrack_CRM_App\                        # DEPRECATED - DO NOT USE
```
