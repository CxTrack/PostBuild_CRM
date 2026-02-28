import {
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';

import { useAuthContext } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CoPilotProvider } from './contexts/CoPilotContext';
import { RequireAdmin } from './components/admin/RequireAdmin';
import ProtectedRoute from './guards/guard-route';
import { CookieConsent } from './components/common/CookieConsent';
import { checkOnboardingStatus } from './utils/onboarding';

// Lazy-loaded pages — Named exports
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile').then(m => ({ default: m.CustomerProfile })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const UpgradePage = lazy(() => import('./pages/UpgradePage').then(m => ({ default: m.UpgradePage })));
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then(m => ({ default: m.AdminPage })));
const CallDetail = lazy(() => import('./pages/calls/CallDetail').then(m => ({ default: m.CallDetail })));
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const Suppliers = lazy(() => import('./pages/Suppliers').then(m => ({ default: m.Suppliers })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Financials = lazy(() => import('./pages/Financials').then(m => ({ default: m.Financials })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const BookingPage = lazy(() => import('./pages/public/BookingPage').then(m => ({ default: m.BookingPage })));
const SharedDocumentViewer = lazy(() => import('./pages/public/SharedDocumentViewer').then(m => ({ default: m.SharedDocumentViewer })));
const SmsOptOut = lazy(() => import('./pages/public/SmsOptOut').then(m => ({ default: m.SmsOptOut })));
const SmsReoptIn = lazy(() => import('./pages/public/SmsReoptIn').then(m => ({ default: m.SmsReoptIn })));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite').then(m => ({ default: m.AcceptInvite })));

// Lazy-loaded pages — Default exports
const Calendar = lazy(() => import('./pages/calendar/Calendar'));
const Quotes = lazy(() => import('./pages/Quotes'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Products = lazy(() => import('./pages/Products'));
const ProductForm = lazy(() => import('./pages/products/ProductForm'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Calls = lazy(() => import('./pages/calls/Calls'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const StripeCallback = lazy(() => import('./pages/settings/StripeCallback'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const Access = lazy(() => import('./website/Access'));
const QuoteBuilder = lazy(() => import('./pages/quotes/QuoteBuilder'));
const InvoiceBuilder = lazy(() => import('./pages/invoices/InvoiceBuilder'));
const NewDealPage = lazy(() => import('./pages/pipeline/NewDealPage'));
const EmailPage = lazy(() => import('./pages/EmailPage'));

// Lazy-loaded — Onboarding
const ProfilePage = lazy(() => import('./pages/onboarding/ProfilePage'));
const SelectServicePage = lazy(() => import('./pages/onboarding/SelectServicePage'));
const IndustryPage = lazy(() => import('./pages/onboarding/IndustryPage'));
const PlanPage = lazy(() => import('./pages/onboarding/PlanPage'));
const VoiceSetupPage = lazy(() => import('./pages/onboarding/VoiceSetupPage'));
const CheckoutPage = lazy(() => import('./pages/onboarding/CheckoutPage'));
const SuccessPage = lazy(() => import('./pages/onboarding/SuccessPage'));
const CustomConfigPage = lazy(() => import('./pages/onboarding/CustomConfigPage'));
const JoinTeamPage = lazy(() => import('./pages/onboarding/JoinTeamPage'));

// Lazy-loaded — Auth
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'));


// Loading spinner shown while lazy chunks download
const PageLoadingFallback = () => (
  <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="w-8 h-8 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
  </div>
);

// Diagnostic component to track route changes
const RouteChangeTracker = () => {
  const location = useLocation();
  useEffect(() => {
  }, [location.pathname]);
  return null;
};

// Auth guard component - redirects to login if not authenticated, and to onboarding if incomplete
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user || checkedRef.current) return;

    (async () => {
      const status = await checkOnboardingStatus(user.id);
      // Fail-open: if status is null (query failed or no profile), allow access
      if (status === null) {
        setOnboardingComplete(true);
      } else {
        setOnboardingComplete(status.complete);
      }
      checkedRef.current = true;
      setOnboardingChecked(true);
    })();
  }, [user]);

  if (loading || (user && !onboardingChecked)) {
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

  if (!onboardingComplete) {
    // User has not completed onboarding - redirect to profile (which handles resume)
    return <Navigate to="/onboarding/profile" replace />;
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
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/access" element={<Access />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            {/* Onboarding Routes (Public - user creates account during onboarding) */}
            <Route path="/onboarding/profile" element={<ProfilePage />} />
            <Route path="/onboarding/select-service" element={<SelectServicePage />} />
            <Route path="/onboarding/industry" element={<IndustryPage />} />
            <Route path="/onboarding/plan" element={<PlanPage />} />
            <Route path="/onboarding/voice-setup" element={<VoiceSetupPage />} />
            <Route path="/onboarding/checkout" element={<CheckoutPage />} />
            <Route path="/onboarding/success" element={<SuccessPage />} />
            <Route path="/onboarding/custom-config" element={<CustomConfigPage />} />
            <Route path="/onboarding/join-team" element={<JoinTeamPage />} />
            <Route path="/book/:slug" element={<BookingPage />} />
            <Route path="/share/:type/:token" element={<SharedDocumentViewer />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            {/* SMS Compliance - Public Pages (no auth required) */}
            <Route path="/sms-opt-out" element={<SmsOptOut />} />
            <Route path="/sms-reopt-in/:token" element={<SmsReoptIn />} />

            {/* Dashboard Layout & Protected Routes - Require Authentication */}
            <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
              <Route index element={<DashboardPage />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerProfile />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="quotes" element={<Quotes />} />
              <Route path="invoices" element={<Invoices />} />
              <Route element={<ProtectedRoute moduleId="products" />}>
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id/edit" element={<ProductForm />} />
              </Route>
              <Route element={<ProtectedRoute moduleId="pipeline" />}>
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="pipeline/new" element={<NewDealPage />} />
              </Route>
              <Route element={<ProtectedRoute moduleId="calls" />}>
                <Route path="calls" element={<Calls />} />
                <Route path="calls/:callId" element={<CallDetail />} />
              </Route>
              <Route path="tasks" element={<Tasks />} />
              <Route path="upgrade" element={<UpgradePage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/stripe-callback" element={<StripeCallback />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route element={<ProtectedRoute moduleId="suppliers" />}>
                <Route path="suppliers" element={<Suppliers />} />
              </Route>
              <Route element={<ProtectedRoute moduleId="inventory" />}>
                <Route path="inventory" element={<Inventory />} />
              </Route>
              <Route element={<ProtectedRoute moduleId="financials" />}>
                <Route path="financials" element={<Financials />} />
              </Route>
              <Route element={<ProtectedRoute moduleId="email" />}>
                <Route path="email" element={<EmailPage />} />
              </Route>
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
        </Suspense>
      </CoPilotProvider>
    </ErrorBoundary>
  );
}
