import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Build version for deployment verification
const BUILD_VERSION = 'LOGOUT_FIX_V10_2026-02-11';
console.log(`%c[CxTrack] Build: ${BUILD_VERSION}`, 'color: #6366f1; font-weight: bold; font-size: 14px;');
console.log('%c[CxTrack] Fixed: Added logout button when no organization', 'color: #22c55e;');

if (typeof window !== 'undefined') {
  (window as any).CXTRACK_BUILD = BUILD_VERSION;
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
