import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAuthStore } from './stores/authStore';
import { useProfileStore } from './stores/profileStore';

import { CoPilotProvider } from './contexts/CoPilotContext';
import { DashboardLayout } from './layouts/DashboardLayout';

import ErrorBoundary from './components/ui/ErrorBoundary';
import CoPilotButton from './components/copilot/CoPilotButton';
import CoPilotPanel from './components/copilot/CoPilotPanel';
import { CookieConsent } from './components/common/CookieConsent';

import { DashboardPage } from './pages/DashboardPage';
import { Customers } from './pages/Customers';
import { CustomerProfile } from './pages/CustomerProfile';
import CustomerForm from './pages/customers/CustomerForm';
import Calendar from './pages/calendar/Calendar';
import Tasks from './pages/Tasks';
import Products from './pages/Products';
import ProductForm from './pages/products/ProductForm';
import Quotes from './pages/Quotes';
import QuoteBuilder from './pages/quotes/QuoteBuilder';
import QuoteDetail from './pages/quotes/QuoteDetail';
import Invoices from './pages/Invoices';
import InvoiceBuilder from './pages/invoices/InvoiceBuilder';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import Settings from './pages/settings/Settings';
import Calls from './pages/calls/Calls';
import { CallDetail } from './pages/calls/CallDetail';
import CRM from './pages/CRM';
import { ChatPage } from './pages/ChatPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/admin/AdminPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';

import PublicQuoteView from './pages/share/PublicQuoteView';
import PublicInvoiceView from './pages/share/PublicInvoiceView';
import Home from './website/Home';
import AccessPage from './website/Access';
import ProtectedRoute from './guards/guard-route';
import { useLocation, useNavigate } from "react-router-dom";

function App() {
  const {
    initialize,
    initialized,
    user,
  } = useAuthStore();

  const { fetchProfile } = useProfileStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  
  /* ----------------------------------------
   * INITIALIZE AUTH ONCE
   * ---------------------------------------- */
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  /* ----------------------------------------
   * LOAD PROFILE WHEN USER IS READY
   * ---------------------------------------- */
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

      useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user]);

  /* ----------------------------------------
   * GLOBAL LOADING STATE
   * ---------------------------------------- */
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <CoPilotProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'dark:bg-gray-800 dark:text-white',
            }}
          />

          <Routes>
            {/* ----------------------------------------
              * PUBLIC ROUTES
              * ---------------------------------------- */}
            <Route path="/" element={<Home />} />
            <Route path="/access" element={<AccessPage />} />

            <Route path="/share/quote/:token" element={<PublicQuoteView />} />
            <Route path="/share/invoice/:token" element={<PublicInvoiceView />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* ----------------------------------------
              * PROTECTED ROUTES
              * ---------------------------------------- */}
            <Route element={<ProtectedRoute user={user} />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />

                <Route path="customers" element={<Customers />} />
                <Route path="customers/new" element={<CustomerForm />} />
                <Route path="customers/:id" element={<CustomerProfile />} />
                <Route path="customers/:id/edit" element={<CustomerForm />} />

                <Route path="calendar" element={<Calendar />} />
                <Route path="tasks" element={<Tasks />} />

                <Route path="calls" element={<Calls />} />
                <Route path="calls/:callId" element={<CallDetail />} />

                <Route path="crm" element={<CRM />} />
                <Route path="pipeline" element={<CRM />} />

                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id/edit" element={<ProductForm />} />

                <Route path="quotes" element={<Quotes />} />
                <Route path="quotes/builder" element={<QuoteBuilder />} />
                <Route path="quotes/builder/:id" element={<QuoteBuilder />} />
                <Route path="quotes/:id" element={<QuoteDetail />} />

                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/builder" element={<InvoiceBuilder />} />
                <Route path="invoices/builder/:id" element={<InvoiceBuilder />} />
                <Route path="invoices/:id" element={<InvoiceDetail />} />

                <Route path="settings" element={<Settings />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="chat" element={<ChatPage />} />
              </Route>
            </Route>

            {/* Popup / special (intentionally public) */}
            <Route path="/chat-window" element={<ChatPage isPopup />} />

            {/* ----------------------------------------
              * FALLBACK
              * ---------------------------------------- */}
            <Route
              path="*"
              element={<Navigate to={user ? "/dashboard" : "/"} replace />}
            />
          </Routes>


          <CoPilotButton />
          <CoPilotPanel />
          <CookieConsent />
        </BrowserRouter>
      </CoPilotProvider>
    </ErrorBoundary>
  );
}

export default App;
