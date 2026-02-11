# CRITICAL: READ THIS FILE BEFORE EVERY COMMIT

## ⚠️ DEPLOYMENT BRANCH RULES ⚠️

### CRM App (crm.easyaicrm.com)
- **Repository:** PostBuild_CRM
- **ONLY commit to:** `CRM-Template-Configuration`
- **NEVER commit to:** `main`
- **Hosting:** Netlify (auto-deploys from CRM-Template-Configuration)

### Marketing Website (easyaicrm.com)
- **Repository:** CxTrack_Manik_Website_Production_02
- **ONLY commit to:** `main`
- **Hosting:** Vercel

---

## BEFORE EVERY GIT OPERATION:

1. **Check which project you're in:**
   ```bash
   pwd  # or check the current directory
   ```

2. **Verify the correct branch:**
   ```bash
   git branch
   ```

3. **For CRM App changes:**
   ```bash
   git checkout CRM-Template-Configuration
   git pull origin CRM-Template-Configuration
   # Make changes
   git add <files>
   git commit -m "message"
   git push origin CRM-Template-Configuration
   ```

4. **For Marketing Website changes:**
   ```bash
   git checkout main
   git pull origin main
   # Make changes
   git add <files>
   git commit -m "message"
   git push origin main
   ```

---

## FORBIDDEN COMMANDS FOR CRM:
- `git push origin main`
- `git checkout main`

---

## 🤖 GEMINI PROMPT PREFIX (COPY-PASTE THIS)

When working with Gemini on CRM tasks, **always start your prompt with:**

```
⚠️ CRITICAL BRANCH RULES - READ FIRST ⚠️

You are working on the CxTrack CRM App (PostBuild_CRM repository).

MANDATORY REQUIREMENTS:
1. ONLY use the folder: c:\AntiGravity\Database implementation\Website-CRM-integration\PostBuild_CRM
2. NEVER use any folder named "PostBuild_CRM-main" or any other copy
3. BEFORE any git operation, run: git checkout CRM-Template-Configuration
4. ONLY commit to branch: CRM-Template-Configuration
5. NEVER commit to or push to main branch
6. NEVER create Python scripts or files in the CRM folder

If you need to run git commands:
- git checkout CRM-Template-Configuration
- git pull origin CRM-Template-Configuration
- git add <specific files>
- git commit -m "message"
- git push origin CRM-Template-Configuration

FORBIDDEN COMMANDS (will break production):
- git checkout main
- git push origin main
- git push (without specifying CRM-Template-Configuration)

Now here is your task:
```

---

## Last Updated: 2026-02-10
## This file MUST be read before EVERY commit
