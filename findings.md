# CxTrack Findings

> Research, discoveries, constraints, and learnings

---

## Architecture Findings

### Authentication System
- **Discovery:** Supabase `onAuthStateChange` fires `SIGNED_IN` event on every page load when a session exists, not just on actual new sign-ins
- **Implication:** Cache clearing logic must differentiate between session restoration and actual user change
- **Solution:** Track previous user ID with useRef, only clear cache when IDs differ

### State Management (CRM)
- **Discovery:** Zustand's persist middleware reads from localStorage on component mount
- **Implication:** Clearing localStorage during render causes store to reset to default values
- **Solution:** Only clear persisted storage on actual user change events

### Cross-App Communication
- **Discovery:** Marketing Website and CRM share Supabase session via cookies
- **Implication:** User authenticated on cxtrack.com is automatically authenticated on crm.cxtrack.com
- **Constraint:** Both apps must use same Supabase project and URL

---

## API Constraints

### Supabase
- `.single()` throws error when no row exists
- `.maybeSingle()` returns null when no row exists (preferred for optional data)
- RLS policies must allow access based on `organization_id`

### Stripe
- Webhook must be configured for both test and live modes
- Customer portal requires return URL configuration
- Subscription metadata stores `organization_id` for linking

---

## UI/UX Findings

### Industry Templates
Available templates:
- `tax_accounting` - Tax & Accounting
- `real_estate` - Real Estate
- `contractors_home_services` - Contractors
- `legal_services` - Legal
- `gyms_fitness` - Gyms & Fitness
- `distribution_logistics` - Logistics
- `healthcare` - Healthcare
- `software_development` - Software Development
- `mortgage_broker` - Mortgage Broker
- `general_business` - General Business

### Color Themes
Product cards use different accent colors:
- CxTrack CRM: Blue (`#3b82f6`)
- Custom CRM Build: Gold (`#FFD700`)
- Custom Configuration: Purple (`#8b5cf6`)
- AI & Ops Audit: Emerald (`#10b981`)

---

## Performance Findings

### Dashboard Loading
- Multiple stores fetch data on mount
- Organization data should be loaded before fetching org-specific data
- Use `currentOrganization?.id` as dependency to prevent premature fetches

---

## Deployment Findings

### Netlify Configuration
- Marketing Website: Auto-deploys from `main` branch
- CRM Application: Auto-deploys from `CRM-Template-Configuration` branch
- Both use `_redirects` file for SPA routing: `/* /index.html 200`

### Build Requirements
- Node version: 20
- Marketing: `npm run build` outputs to `.next/`
- CRM: `npm run build` outputs to `dist/`

---

## Known Limitations

1. **No real-time sync between apps** - Changes in CRM don't reflect in Marketing without page refresh
2. **Single organization per user** - Current architecture assumes one org membership per user
3. **No offline support** - Both apps require internet connection

---

## Future Investigation

- [ ] Implement real-time updates with Supabase Realtime
- [ ] Add multi-organization support
- [ ] Investigate service worker for offline capability
