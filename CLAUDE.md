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

## Last Updated: 2026-02-10
## This file MUST be read before EVERY commit
