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
import { CustomerProfile } from './pages/CustomerProfile';
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
import { Suppliers } from './pages/Suppliers';
import { Inventory } from './pages/Inventory';
import { Financials } from './pages/Financials';
import Access from './website/Access';

// Builder Pages - Default exports
import QuoteBuilder from './pages/quotes/QuoteBuilder';
import InvoiceBuilder from './pages/invoices/InvoiceBuilder';

// Onboarding Pages
import SelectServicePage from './pages/onboarding/SelectServicePage';
import PlanPage from './pages/onboarding/PlanPage';
import VoiceSetupPage from './pages/onboarding/VoiceSetupPage';
import CheckoutPage from './pages/onboarding/CheckoutPage';
import SuccessPage from './pages/onboarding/SuccessPage';
import CustomConfigPage from './pages/onboarding/CustomConfigPage';


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
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
          <Route path="/access" element={<Access />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Onboarding Routes (Public - user creates account during onboarding) */}
          <Route path="/onboarding/select-service" element={<SelectServicePage />} />
          <Route path="/onboarding/plan" element={<PlanPage />} />
          <Route path="/onboarding/voice-setup" element={<VoiceSetupPage />} />
          <Route path="/onboarding/checkout" element={<CheckoutPage />} />
          <Route path="/onboarding/success" element={<SuccessPage />} />
          <Route path="/onboarding/custom-config" element={<CustomConfigPage />} />


          {/* Dashboard Layout & Protected Routes - Require Authentication */}
          <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerProfile />} />
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
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="financials" element={<Financials />} />
          </Route>

          {/* Builder Routes - Require Authentication */}
          {/* Routes without ID for creating NEW quotes/invoices */}
          <Route path="/quotes/builder" element={<RequireAuth><QuoteBuilder /></RequireAuth>} />
          <Route path="/quotes/builder/:id" element={<RequireAuth><QuoteBuilder /></RequireAuth>} />
          <Route path="/invoices/builder" element={<RequireAuth><InvoiceBuilder /></RequireAuth>} />
          <Route path="/invoices/builder/:id" element={<RequireAuth><InvoiceBuilder /></RequireAuth>} />

          {/* Admin Routes - Require Authentication */}
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </CoPilotProvider>
    </ErrorBoundary>
  );
}
