# Phase 3: Consolidate Auth Lifecycle and Remove Boolean Loading Guards

> **Status:** Planning
> **Priority:** Medium
> **Depends on:** Auth stabilization PR (merged)

---

## Context

The auth stabilization PR fixed the immediate failure modes:
- Memory leaks from unsubscribed listeners
- Stale data across login sessions
- Cross-org data leakage
- Incomplete logout cleanup

However, the architecture still has technical debt that could cause issues as the app grows.

---

## Goals

### 1. Replace Boolean Loading Flags with Explicit Lifecycle States

**Current Problem:**
```typescript
// Scattered across stores
loading: boolean;
initialized: boolean;
```

This leads to ambiguous states:
- `loading=true, initialized=false` - initial load or error recovery?
- `loading=false, initialized=false` - never started or failed?

**Target:**
```typescript
type AuthStatus = 'idle' | 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

// Single source of truth
status: AuthStatus;
```

**Files to modify:**
- `src/contexts/AuthContext.tsx`
- `src/stores/authStore.ts`
- Components consuming auth state

---

### 2. Consolidate AuthContext + authStore into Single Source of Truth

**Current Problem:**

Two systems manage auth state:
- `AuthContext` (React Context) - owns logout, orchestration
- `authStore` (Zustand) - reacts to auth changes, persists profile

This works today because we enforce:
- AuthContext.logout() is the only user-initiated logout
- authStore only reacts to auth state changes

But it's fragile and confusing for new developers.

**Options:**
1. **Keep both, formalize contract** - Document the invariant, add runtime guards
2. **Collapse into authStore only** - Remove AuthContext, use Zustand everywhere
3. **Collapse into AuthContext only** - Remove authStore, use React Context everywhere

**Recommendation:** Option 2 (Zustand only) - simpler, no provider nesting required

---

### 3. Move Shared Data Fetching to DashboardLayout

**Current Problem:**

Each page calls `fetchCustomers()`, `fetchInvoices()`, etc. independently.
This causes:
- Duplicate requests on navigation
- Inconsistent loading states
- Race conditions on fast navigation

**Target:**

DashboardLayout fetches core data once when org is set:
```typescript
useEffect(() => {
  if (currentOrganization?.id) {
    // Fetch in parallel
    Promise.all([
      fetchCustomers(),
      fetchCalendarEvents(),
      fetchTasks(),
      // etc.
    ]);
  }
}, [currentOrganization?.id]);
```

Pages then just read from stores (already populated).

---

## Non-Goals

- Changing the Supabase auth flow
- Modifying RLS policies
- Adding new auth providers (OAuth, SSO)

---

## Verification Checklist

After Phase 3:
- [ ] Single auth state enum visible in DevTools
- [ ] No loading state ambiguity
- [ ] authStore OR AuthContext (not both)
- [ ] Dashboard loads data once on entry
- [ ] Pages read cached store data (no refetch on navigate)
- [ ] Navigation feels instant

---

## Notes

Let the auth stabilization PR bake for a few days before starting this work.
Observe loading behavior, cancel flows, Settings stability, and org switching
to confirm Phase 2 fixes are solid before introducing more changes.
