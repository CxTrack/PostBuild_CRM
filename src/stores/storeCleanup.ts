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
 */

import { useCalendarStore } from './calendarStore';
import { useCallStore } from './callStore';
import { useCustomerStore } from './customerStore';
import { useDealStore } from './dealStore';
import { useInvoiceStore } from './invoiceStore';
import { usePreferencesStore } from './preferencesStore';
import { useQuoteStore } from './quoteStore';
import { useTaskStore } from './taskStore';

/**
 * Clears all non-persisted data stores.
 * Call this on logout to ensure no stale data remains.
 */
export function clearAllDataStores(): void {
  console.log('[StoreCleanup] Clearing all data stores...');

  try {
    useCalendarStore.getState().reset();
    useCallStore.getState().reset();
    useCustomerStore.getState().reset();
    useDealStore.getState().reset();
    useInvoiceStore.getState().reset();
    usePreferencesStore.getState().reset();
    useQuoteStore.getState().reset();
    useTaskStore.getState().reset();

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
