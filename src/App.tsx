import {
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import { useAuthContext } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CoPilotProvider } from './contexts/CoPilotContext';

// Pages - Named exports
import { DashboardPage } from './pages/DashboardPage';
import { Customers } from './pages/Customers';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UpgradePage } from './pages/UpgradePage';
import { AdminPage } from './pages/admin/AdminPage';

// Pages - Default exports
import Calendar from './pages/calendar/Calendar';
import Quotes from './pages/Quotes';
import Invoices from './pages/Invoices';
import Products from './pages/Products';
import Pipeline from './pages/Pipeline';
import Calls from './pages/calls/Calls';
import Tasks from './pages/Tasks';
import Settings from './pages/settings/Settings';
import { ChatPage } from './pages/ChatPage';
import ReportsPage from './pages/ReportsPage';
import Access from './website/Access';

// Builder Pages - Default exports
import QuoteBuilder from './pages/quotes/QuoteBuilder';
import InvoiceBuilder from './pages/invoices/InvoiceBuilder';

// Diagnostic component to track route changes
const RouteChangeTracker = () => {
  const location = useLocation();
  useEffect(() => {
    console.log('[APP DEBUG] Route changed to:', location.pathname);
  }, [location.pathname]);
  return null;
};

export default function App() {
  // AuthContext provides user info (not used for route guards currently)
  useAuthContext();

  return (
    <ErrorBoundary>
      <RouteChangeTracker />
      <CoPilotProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/access" element={<Access />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard Layout & Protected Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<Customers />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="products" element={<Products />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="calls" element={<Calls />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* Builder Routes */}
          <Route path="/quotes/builder/:id" element={<QuoteBuilder />} />
          <Route path="/invoices/builder/:id" element={<InvoiceBuilder />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </CoPilotProvider>
    </ErrorBoundary>
  );
}
