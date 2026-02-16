/**
 * Centralized store cleanup utility
 *
 * Each store exposes its own reset() method that returns it to initial state.
 * This file provides functions to reset multiple stores at once for:
 * - Logout (clears all data stores)
 * - Organization switch (clears org-specific data)
 *
 * Note: Persisted stores (authStore, organizationStore, themeStore) are NOT
 * cleared here - they handle their own cleanup.
 *
 * IMPORTANT: This file uses dynamic imports to avoid circular dependencies.
 * The 8 data stores all import organizationStore, and AuthContext imports
 * both this file and organizationStore — static imports here would create
 * a circular chain that causes TDZ errors in production minified builds.
 */

import { registerCleanupCallback } from './storeCleanupRegistry';

/**
 * Dynamically loads all data stores and calls reset() on each.
 * Using dynamic import() breaks the circular dependency chain at
 * module evaluation time — stores are only loaded when cleanup
 * is actually invoked (logout or org switch), not at import time.
 */
async function resetAllStores(): Promise<void> {
  const [
    { useCalendarStore },
    { useCallStore },
    { useCustomerStore },
    { useDealStore },
    { useInvoiceStore },
    { usePreferencesStore },
    { useQuoteStore },
    { useTaskStore },
  ] = await Promise.all([
    import('./calendarStore'),
    import('./callStore'),
    import('./customerStore'),
    import('./dealStore'),
    import('./invoiceStore'),
    import('./preferencesStore'),
    import('./quoteStore'),
    import('./taskStore'),
  ]);

  const stores = [
    useCalendarStore,
    useCallStore,
    useCustomerStore,
    useDealStore,
    useInvoiceStore,
    usePreferencesStore,
    useQuoteStore,
    useTaskStore,
  ];

  for (const store of stores) {
    store.getState().reset();
  }
}

/**
 * Clears all non-persisted data stores.
 * Call this on logout to ensure no stale data remains.
 */
export async function clearAllDataStores(): Promise<void> {
  console.log('[StoreCleanup] Clearing all data stores...');

  try {
    await resetAllStores();
    console.log('[StoreCleanup] All data stores cleared successfully');
  } catch (error) {
    console.error('[StoreCleanup] Error clearing stores:', error);
  }
}

/**
 * Clears organization-specific data stores.
 * Call this when switching organizations.
 * Same as clearAllDataStores for now, but can be refined
 * to exclude user-specific non-org data if needed.
 */
export async function clearOrganizationDataStores(): Promise<void> {
  console.log('[StoreCleanup] Clearing organization-specific stores...');
  await clearAllDataStores();
}

/**
 * Initializes the store cleanup system by registering the org-switch callback.
 * Must be called AFTER all modules have finished loading (e.g. in a useEffect)
 * to avoid TDZ errors in production builds where module evaluation order
 * can cause minified variables to be accessed before initialization.
 */
export function initStoreCleanup(): void {
  registerCleanupCallback(() => {
    clearOrganizationDataStores();
  });
}
