/**
 * Vitest Global Test Setup
 *
 * Provides mocks for browser APIs, Supabase, and environment variables
 * so unit tests can run in jsdom without real network calls.
 */
import { vi, beforeAll, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// ---------------------------------------------------------------------------
// Environment Variables (mimic Vite's import.meta.env)
// ---------------------------------------------------------------------------
// Vitest exposes import.meta.env by default; seed the values tests need.
vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-1234567890');
vi.stubEnv('DEV', 'true');

// ---------------------------------------------------------------------------
// Browser API Mocks
// ---------------------------------------------------------------------------

// matchMedia (used by theme, responsive hooks)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ResizeObserver (used by charts, layout components)
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// IntersectionObserver (used by lazy loading, infinite scroll)
class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// scrollTo (used by navigation, modals)
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

// crypto.randomUUID (used for generating IDs)
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }),
    },
  });
}

// ---------------------------------------------------------------------------
// Supabase Client Mock
// ---------------------------------------------------------------------------
// Auto-mock the Supabase module so store/service tests don't make real calls.
vi.mock('@/lib/supabase', () => {
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  });

  return {
    supabase: {
      from: mockFrom,
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: null, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.storage.co/test.png' } }),
        }),
      },
      channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
      }),
    },
    supabaseUrl: 'https://test-project.supabase.co',
    supabaseAnonKey: 'test-anon-key-1234567890',
    getCurrentUser: vi.fn().mockResolvedValue(null),
    getUserProfile: vi.fn().mockResolvedValue(null),
    getUserOrganizations: vi.fn().mockResolvedValue([]),
  };
});

// ---------------------------------------------------------------------------
// React Router Mock
// ---------------------------------------------------------------------------
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

beforeAll(() => {
  // Suppress console.error for expected test errors
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    // Allow through unexpected errors for debugging
    if (
      !msg.includes('act(') &&
      !msg.includes('Warning:') &&
      !msg.includes('[') // Suppress our logError calls
    ) {
      // eslint-disable-next-line no-console
      console.warn('[test]', ...args);
    }
  });
});
