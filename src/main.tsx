import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Build version for deployment verification
const BUILD_VERSION = 'NAV_FIX_V3_2026-02-10';
console.log(`%c[CxTrack] Build: ${BUILD_VERSION}`, 'color: #6366f1; font-weight: bold; font-size: 14px;');
console.log('%c[CxTrack] Navigation fix deployed - DndKit removed from sidebar', 'color: #22c55e;');

// Defensive fallback for DEMO_MODE_CONFIG
if (typeof window !== 'undefined') {
  (window as any).DEMO_MODE_CONFIG = (window as any).DEMO_MODE_CONFIG || { enabled: false };
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
