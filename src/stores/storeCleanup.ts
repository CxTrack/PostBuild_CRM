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
 * IMPORTANT: This file does NOT import organizationStore.  The reverse
 * direction (organizationStore needing cleanup) goes through the
 * storeCleanupRegistry callback to avoid circular dependencies.
 */

import { useCalendarStore } from './calendarStore';
import { useCallStore } from './callStore';
import { useCustomerStore } from './customerStore';
import { useDealStore } from './dealStore';
import { useInvoiceStore } from './invoiceStore';
import { usePreferencesStore } from './preferencesStore';
import { useQuoteStore } from './quoteStore';
import { useTaskStore } from './taskStore';
import { registerCleanupCallback } from './storeCleanupRegistry';

const dataStores = [
  useCalendarStore,
  useCallStore,
  useCustomerStore,
  useDealStore,
  useInvoiceStore,
  usePreferencesStore,
  useQuoteStore,
  useTaskStore,
];

/**
 * Clears all non-persisted data stores.
 * Call this on logout to ensure no stale data remains.
 */
export function clearAllDataStores(): void {
  console.log('[StoreCleanup] Clearing all data stores...');

  try {
    for (const store of dataStores) {
      store.getState().reset();
    }
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
export function clearOrganizationDataStores(): void {
  console.log('[StoreCleanup] Clearing organization-specific stores...');
  clearAllDataStores();
}

/**
 * Initializes the store cleanup system by registering the org-switch callback.
 * Must be called AFTER all modules have finished loading (e.g. in a useEffect)
 * to avoid TDZ errors in production builds where module evaluation order
 * can cause minified variables to be accessed before initialization.
 */
export function initStoreCleanup(): void {
  registerCleanupCallback(clearOrganizationDataStores);
}
