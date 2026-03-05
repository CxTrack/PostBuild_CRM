import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Build version for deployment verification
const BUILD_VERSION = 'SIGNUP_FIX_V15_2026-02-14';

if (typeof window !== 'undefined') {
  (window as any).CXTRACK_BUILD = BUILD_VERSION;
}

// Auto-reload on stale chunk errors after a new deployment.
// Vite fires this event when a preloaded module 404s because the old
// chunk hash no longer exists on the server.
window.addEventListener('vite:preloadError', (event) => {
  const reloadKey = 'cxtrack-preload-reload';
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  // Only auto-reload if we haven't reloaded in the last 10 seconds
  if (!lastReload || now - parseInt(lastReload, 10) > 10_000) {
    sessionStorage.setItem(reloadKey, String(now));
    event.preventDefault();
    window.location.reload();
  }
});

// Suppress Supabase AbortError from unhandled rejection
// These occur during auth state transitions when the Supabase client
// cancels in-flight requests — they are harmless and expected.
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError') {
    event.preventDefault();
  }
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
