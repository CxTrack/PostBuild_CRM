/**
 * Store cleanup callback registry.
 *
 * This tiny module holds a reference to the organization-data cleanup
 * function.  It imports NOTHING from any store, so it can be safely
 * imported by organizationStore without creating a circular dependency.
 *
 * The actual cleanup implementation is registered at runtime by
 * storeCleanup.ts (via registerCleanupCallback), and invoked by
 * organizationStore.ts (via cleanupOrganizationData).
 *
 * Dependency graph (no cycles):
 *   organizationStore -> storeCleanupRegistry  (this file, leaf node)
 *   storeCleanup -> storeCleanupRegistry  (registers callback)
 *   storeCleanup -> {8 data stores} via dynamic import() (no static dep)
 *   AuthContext  -> storeCleanup  (imports & calls clearAllDataStores)
 *   AuthContext  -> organizationStore
 */

type CleanupFn = () => void;

let _cleanupCallback: CleanupFn | null = null;

/**
 * Called by storeCleanup.ts to register the real implementation.
 */
export function registerCleanupCallback(fn: CleanupFn): void {
  _cleanupCallback = fn;
}

/**
 * Called by organizationStore.ts when switching organizations.
 * Falls back to a console warning if the callback hasn't been registered yet.
 */
export function cleanupOrganizationData(): void {
  if (_cleanupCallback) {
    _cleanupCallback();
  } else {
    console.warn('[StoreCleanupRegistry] Cleanup callback not registered yet');
  }
}
