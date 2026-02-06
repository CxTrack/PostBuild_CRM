import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';


// import { Login } from './pages/Login';
// import { Register } from './pages/Register';

const MARKETING_LOGIN_URL = (import.meta.env.VITE_MARKETING_URL as string) || 'https://cxtrackdemosite.netlify.app/access';

const ExternalRedirect = ({ to }: { to: string }) => {
  useEffect(() => {
    window.location.href = to;
  }, [to]);
  return null;
};

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, initialized, loading } = useAuthStore();
  const location = useLocation();

  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  const publicPaths = ['/login', '/register', '/share', '/admin', '/privacy-policy'];
  const isPublic = publicPaths.some(path => location.pathname.startsWith(path));

  if (!user && !isPublic) {
    window.location.href = MARKETING_LOGIN_URL;
    return null;
  }

  return <>{children}</>;
};

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
import OnboardingFlow from './pages/onboarding';

import PublicQuoteView from './pages/share/PublicQuoteView';
import PublicInvoiceView from './pages/share/PublicInvoiceView';
import Callback from './pages/auth/Callback';

function App() {
  const {
    initialize,
    initialized,
    user,
    profile,
  } = useAuthStore();

  const { fetchProfile } = useProfileStore();

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

  return (
    <ErrorBoundary>
      <CoPilotProvider>
        <BrowserRouter>
          <AuthGuard>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />

            <Routes>
              {/* ... */}
              <Route path="/login" element={<ExternalRedirect to={MARKETING_LOGIN_URL} />} />
              <Route path="/register" element={<ExternalRedirect to={MARKETING_LOGIN_URL} />} />

              <Route path="/share/quote/:token" element={<PublicQuoteView />} />
              <Route path="/share/invoice/:token" element={<PublicInvoiceView />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/auth/callback" element={<Callback />} />

              {/* ----------------------------------------
                 * PROTECTED ROUTES
                 * ---------------------------------------- */}
              <Route
                path="/"
                element={
                  user ? (
                    !profile?.onboarding_completed ? (
                      <Navigate to="/onboarding" replace />
                    ) : (
                      <DashboardLayout />
                    )
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

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

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* Popup / special */}
              <Route path="/onboarding" element={user ? <OnboardingFlow /> : <Navigate to="/login" />} />
              <Route path="/chat-window" element={<ChatPage isPopup />} />
            </Routes>

            <CoPilotButton />
            <CoPilotPanel />
            <CookieConsent />
          </AuthGuard>
        </BrowserRouter>
      </CoPilotProvider>
    </ErrorBoundary>
  );
}

export default App;
