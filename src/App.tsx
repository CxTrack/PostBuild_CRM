import {
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import { useAuthContext } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CoPilotProvider } from './contexts/CoPilotContext';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { Customers } from './pages/Customers';
import { Calendar } from './pages/calendar/Calendar';
import { Quotes } from './pages/Quotes';
import { Invoices } from './pages/Invoices';
import { Products } from './pages/Products';
import { Pipeline } from './pages/Pipeline';
import { Calls } from './pages/calls/Calls';
import { Tasks } from './pages/Tasks';
import { Inventory } from './pages/Inventory';
import { Suppliers } from './pages/Suppliers';
import { Financials } from './pages/Financials';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Upgrade } from './pages/Upgrade';
import { Settings } from './pages/Settings';
import { AdminPortal } from './pages/AdminPortal';
import { Profile } from './pages/Profile';
import { Organizations } from './pages/Organizations';
import { EmailService } from './pages/EmailService';
import { AIChat } from './pages/AIChat';
import { Help } from './pages/Help';
import { NotFound } from './pages/NotFound';
import { Access } from './website/Access';

// Builder Pages
import { QuoteBuilder } from './pages/quotes/QuoteBuilder';
import { InvoiceBuilder } from './pages/invoices/InvoiceBuilder';

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
            <Route path="inventory" element={<Inventory />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="financials" element={<Financials />} />
            <Route path="upgrade" element={<Upgrade />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="email" element={<EmailService />} />
            <Route path="chat" element={<AIChat />} />
            <Route path="help" element={<Help />} />
          </Route>

          {/* Builder Routes */}
          <Route path="/quotes/builder/:id" element={<QuoteBuilder />} />
          <Route path="/invoices/builder/:id" element={<InvoiceBuilder />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminPortal />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </CoPilotProvider>
    </ErrorBoundary>
  );
}
