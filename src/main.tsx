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
