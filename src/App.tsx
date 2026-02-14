import {
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';

import { useAuthContext } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CoPilotProvider } from './contexts/CoPilotContext';

// ============================================================================
// EAGERLY LOADED - Critical path components (login, register, dashboard shell)
// ============================================================================
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DashboardPage } from './pages/DashboardPage';

// ============================================================================
// LAZY LOADED - Code split for better initial bundle size
// These are loaded on-demand when the user navigates to the route
// ============================================================================

// Core Dashboard Pages
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile').then(m => ({ default: m.CustomerProfile })));
const Calendar = lazy(() => import('./pages/calendar/Calendar'));
const Quotes = lazy(() => import('./pages/Quotes'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Products = lazy(() => import('./pages/Products'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Calls = lazy(() => import('./pages/calls/Calls'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const Suppliers = lazy(() => import('./pages/Suppliers').then(m => ({ default: m.Suppliers })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Financials = lazy(() => import('./pages/Financials').then(m => ({ default: m.Financials })));
const UpgradePage = lazy(() => import('./pages/UpgradePage').then(m => ({ default: m.UpgradePage })));

// Builder Pages (heavy components)
const QuoteBuilder = lazy(() => import('./pages/quotes/QuoteBuilder'));
const InvoiceBuilder = lazy(() => import('./pages/invoices/InvoiceBuilder'));

// Admin Page
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then(m => ({ default: m.AdminPage })));

// Onboarding Pages (only used once during signup)
const SelectServicePage = lazy(() => import('./pages/onboarding/SelectServicePage'));
const PlanPage = lazy(() => import('./pages/onboarding/PlanPage'));
const VoiceSetupPage = lazy(() => import('./pages/onboarding/VoiceSetupPage'));
const CheckoutPage = lazy(() => import('./pages/onboarding/CheckoutPage'));
const SuccessPage = lazy(() => import('./pages/onboarding/SuccessPage'));
const CustomConfigPage = lazy(() => import('./pages/onboarding/CustomConfigPage'));

// Website/Access Page
const Access = lazy(() => import('./website/Access'));

// ============================================================================
// LOADING FALLBACK - Shown while lazy components are loading
// ============================================================================
const PageLoader = () => (
  <div className="h-full min-h-[400px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
    </div>
  </div>
);

// Full page loader for standalone routes
const FullPageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
    </div>
  </div>
);

// Diagnostic component to track route changes
const RouteChangeTracker = () => {
  const location = useLocation();
  useEffect(() => {
  }, [location.pathname]);
  return null;
};

// Auth guard component - redirects to login if not authenticated
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    // Redirect to login, save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default function App() {
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
          <Route path="/access" element={
            <Suspense fallback={<FullPageLoader />}>
              <Access />
            </Suspense>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Onboarding Routes (Public - user creates account during onboarding) */}
          <Route path="/onboarding/select-service" element={
            <Suspense fallback={<FullPageLoader />}>
              <SelectServicePage />
            </Suspense>
          } />
          <Route path="/onboarding/plan" element={
            <Suspense fallback={<FullPageLoader />}>
              <PlanPage />
            </Suspense>
          } />
          <Route path="/onboarding/voice-setup" element={
            <Suspense fallback={<FullPageLoader />}>
              <VoiceSetupPage />
            </Suspense>
          } />
          <Route path="/onboarding/checkout" element={
            <Suspense fallback={<FullPageLoader />}>
              <CheckoutPage />
            </Suspense>
          } />
          <Route path="/onboarding/success" element={
            <Suspense fallback={<FullPageLoader />}>
              <SuccessPage />
            </Suspense>
          } />
          <Route path="/onboarding/custom-config" element={
            <Suspense fallback={<FullPageLoader />}>
              <CustomConfigPage />
            </Suspense>
          } />


          {/* Dashboard Layout & Protected Routes - Require Authentication */}
          <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={
              <Suspense fallback={<PageLoader />}>
                <Customers />
              </Suspense>
            } />
            <Route path="customers/:id" element={
              <Suspense fallback={<PageLoader />}>
                <CustomerProfile />
              </Suspense>
            } />
            <Route path="calendar" element={
              <Suspense fallback={<PageLoader />}>
                <Calendar />
              </Suspense>
            } />
            <Route path="quotes" element={
              <Suspense fallback={<PageLoader />}>
                <Quotes />
              </Suspense>
            } />
            <Route path="invoices" element={
              <Suspense fallback={<PageLoader />}>
                <Invoices />
              </Suspense>
            } />
            <Route path="products" element={
              <Suspense fallback={<PageLoader />}>
                <Products />
              </Suspense>
            } />
            <Route path="pipeline" element={
              <Suspense fallback={<PageLoader />}>
                <Pipeline />
              </Suspense>
            } />
            <Route path="calls" element={
              <Suspense fallback={<PageLoader />}>
                <Calls />
              </Suspense>
            } />
            <Route path="tasks" element={
              <Suspense fallback={<PageLoader />}>
                <Tasks />
              </Suspense>
            } />
            <Route path="upgrade" element={
              <Suspense fallback={<PageLoader />}>
                <UpgradePage />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            } />
            <Route path="chat" element={
              <Suspense fallback={<PageLoader />}>
                <ChatPage />
              </Suspense>
            } />
            <Route path="reports" element={
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            } />
            <Route path="suppliers" element={
              <Suspense fallback={<PageLoader />}>
                <Suppliers />
              </Suspense>
            } />
            <Route path="inventory" element={
              <Suspense fallback={<PageLoader />}>
                <Inventory />
              </Suspense>
            } />
            <Route path="financials" element={
              <Suspense fallback={<PageLoader />}>
                <Financials />
              </Suspense>
            } />
          </Route>

          {/* Builder Routes - Require Authentication */}
          {/* Routes without ID for creating NEW quotes/invoices */}
          <Route path="/quotes/builder" element={
            <RequireAuth>
              <Suspense fallback={<FullPageLoader />}>
                <QuoteBuilder />
              </Suspense>
            </RequireAuth>
          } />
          <Route path="/quotes/builder/:id" element={
            <RequireAuth>
              <Suspense fallback={<FullPageLoader />}>
                <QuoteBuilder />
              </Suspense>
            </RequireAuth>
          } />
          <Route path="/invoices/builder" element={
            <RequireAuth>
              <Suspense fallback={<FullPageLoader />}>
                <InvoiceBuilder />
              </Suspense>
            </RequireAuth>
          } />
          <Route path="/invoices/builder/:id" element={
            <RequireAuth>
              <Suspense fallback={<FullPageLoader />}>
                <InvoiceBuilder />
              </Suspense>
            </RequireAuth>
          } />

          {/* Admin Routes - Require Authentication */}
          <Route path="/admin" element={
            <RequireAuth>
              <Suspense fallback={<FullPageLoader />}>
                <AdminPage />
              </Suspense>
            </RequireAuth>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </CoPilotProvider>
    </ErrorBoundary>
  );
}
