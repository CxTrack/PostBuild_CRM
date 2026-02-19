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
import { RequireAdmin } from './components/admin/RequireAdmin';

// Pages - Default exports
import Calendar from './pages/calendar/Calendar';
import Quotes from './pages/Quotes';
import Invoices from './pages/Invoices';
import Products from './pages/Products';
import ProductForm from './pages/products/ProductForm';
import Pipeline from './pages/Pipeline';
import Calls from './pages/calls/Calls';
import { CallDetail } from './pages/calls/CallDetail';
import Tasks from './pages/Tasks';
import Settings from './pages/settings/Settings';
import StripeCallback from './pages/settings/StripeCallback';
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
import ProfilePage from './pages/onboarding/ProfilePage';
import SelectServicePage from './pages/onboarding/SelectServicePage';
import IndustryPage from './pages/onboarding/IndustryPage';
import PlanPage from './pages/onboarding/PlanPage';
import VoiceSetupPage from './pages/onboarding/VoiceSetupPage';
import CheckoutPage from './pages/onboarding/CheckoutPage';
import SuccessPage from './pages/onboarding/SuccessPage';
import CustomConfigPage from './pages/onboarding/CustomConfigPage';
import { BookingPage } from './pages/public/BookingPage';
import { SharedDocumentViewer } from './pages/public/SharedDocumentViewer';
import { AcceptInvite } from './pages/AcceptInvite';

// Legal & Auth Pages
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { CookieConsent } from './components/common/CookieConsent';

// Pipeline Pages
import NewDealPage from './pages/pipeline/NewDealPage';


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
        <CookieConsent />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/access" element={<Access />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Onboarding Routes (Public - user creates account during onboarding) */}
          <Route path="/onboarding/profile" element={<ProfilePage />} />
          <Route path="/onboarding/select-service" element={<SelectServicePage />} />
          <Route path="/onboarding/industry" element={<IndustryPage />} />
          <Route path="/onboarding/plan" element={<PlanPage />} />
          <Route path="/onboarding/voice-setup" element={<VoiceSetupPage />} />
          <Route path="/onboarding/checkout" element={<CheckoutPage />} />
          <Route path="/onboarding/success" element={<SuccessPage />} />
          <Route path="/onboarding/custom-config" element={<CustomConfigPage />} />
          <Route path="/book/:slug" element={<BookingPage />} />
          <Route path="/share/:type/:token" element={<SharedDocumentViewer />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />

          {/* Dashboard Layout & Protected Routes - Require Authentication */}
          <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerProfile />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="pipeline/new" element={<NewDealPage />} />
            <Route path="calls" element={<Calls />} />
            <Route path="calls/:callId" element={<CallDetail />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="upgrade" element={<UpgradePage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/stripe-callback" element={<StripeCallback />} />
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

          {/* Pop-out Chat Window - standalone, no sidebar */}
          <Route path="/chat-window" element={<RequireAuth><ChatPage isPopup={true} /></RequireAuth>} />

          {/* Admin Routes - Require Authentication + Admin Check */}
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </CoPilotProvider>
    </ErrorBoundary>
  );
}
