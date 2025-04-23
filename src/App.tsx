import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useProfileStore } from './stores/profileStore';
import Pipeline from './pages/pipeline/Pipeline';
import PipelineDetail from './pages/pipeline/PipelineDetail';
import DirectReports from './pages/team/DirectReports';
import WaitlistForm from './pages/WaitlistForm';
import DemoWaitlist from './pages/DemoWaitlist';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import TermsOfService from './pages/legal/TermsOfService';
import CookiePolicy from './pages/legal/CookiePolicy';
import { supabase } from './lib/supabase';
import NavHeader from './components/NavHeader';
import { toast } from 'react-hot-toast';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/auth/Login';
import GDPRNotice from './pages/auth/GDPRNotice';
import ResetPassword from './pages/auth/ResetPassword';
import ForgotPassword from './pages/auth/ForgotPassword';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import CRMDashboard from './pages/crm/CRMDashboard';
import Customers from './pages/customers/Customers';
import CustomerDetail from './pages/customers/CustomerDetail';
import NewCustomer from './pages/customers/NewCustomer';
import Products from './pages/products/Products';
import NewProduct from './pages/products/NewProduct';
import ProductDetail from './pages/products/ProductDetail';
import EditProduct from './pages/products/EditProduct';
import Inventory from './pages/inventory/Inventory';
import Invoices from './pages/invoices/Invoices';
import Suppliers from './pages/Suppliers';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import CreateInvoice from './pages/invoices/CreateInvoice';
import EditInvoice from './pages/invoices/EditInvoice';
import Quotes from './pages/quotes/Quotes';
import CreateQuote from './pages/quotes/CreateQuote';
import QuoteDetail from './pages/quotes/QuoteDetail';
import Expenses from './pages/expenses/Expenses';
import ExpensesFeature from './pages/features/Expenses';
import QuotesFeature from './pages/features/Quotes';
import Purchases from './pages/purchases/Purchases';
import PurchaseDetail from './pages/purchases/PurchaseDetail';
import CreatePurchase from './pages/purchases/CreatePurchase';
import Settings from './pages/settings/Settings';
import FeatureLayout from './layouts/FeatureLayout';
import CustomerManagement from './pages/features/CustomerManagement';
import Invoicing from './pages/features/Invoicing';
import InventoryTracking from './pages/features/InventoryTracking';
import Sales from './pages/function/Sales';
import Marketing from './pages/function/Marketing';
import CustomerSupport from './pages/function/CustomerSupport';
import Research from './pages/function/Research';
import Operations from './pages/function/Operations';
import AIAgent from './pages/products/AIAgent';
import AIWorkforce from './pages/products/AIWorkforce';
import AITools from './pages/products/AITools';
import CRM from './pages/products/CRM';
import BDR from './pages/agents/BDR';
import { Marketer } from './pages/agents/Marketer';
import { Researcher } from './pages/agents/Researcher';
import CRMEnrichment from './pages/agents/CRMEnrichment';
import { Qualification } from './pages/agents/Qualification';
import { SEO } from './pages/agents/SEO';
import { InboxManager } from './pages/agents/InboxManager';
import AIMarket from './pages/blog/AIMarket';
import AIGrowthPartner from './pages/features/AIGrowthPartner';
import EnterprisePlan from './pages/features/EnterprisePlan';
import Solutions from './pages/enterprise/Solutions';
import Pricing from './pages/pricing/Pricing';
import ComparePlans from './pages/pricing/Compare';
import Security from './pages/enterprise/Security';
import CustomDevelopment from './pages/enterprise/CustomDevelopment';
import PlanDetails from './pages/features/PlanDetails';
import Contact from './pages/contact/Contact';
import ChatBot from './components/ChatBot';
import Templates from './pages/system/Templates';
import Revenue from './pages/finance/Revenue';

function App() {
  const { user, initialized, initialize, checkAuthStatus } = useAuthStore();
  const { fetchProfile } = useProfileStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  
  // Re-initialize auth when location changes (helps with mobile browsers)
  useEffect(() => {
    // Handle OAuth callback
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const verifyAuth = async () => {
      // Only verify if we think we're logged in but on a protected route
      if (user && location.pathname !== '/login' && location.pathname !== '/register' && !location.pathname.startsWith('/features') && location.pathname !== '/contact') {
        setIsVerifyingAuth(true);
        const isAuthenticated = await checkAuthStatus();
        
        if (!isAuthenticated) {
          // Session is invalid, redirect to login
          toast.error('Your session has expired. Please sign in again.');
          navigate('/login');
        }
        
        setIsVerifyingAuth(false);
      }
    };
    
    verifyAuth();
  }, [location.pathname, user, checkAuthStatus, navigate]);
  
  // Re-initialize on page load and after any auth operations
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);
  
  // Fetch profile when user is authenticated
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);
  
  // Handle network status changes
  useEffect(() => {
    const handleNetworkChange = (event: Event) => {
      const customEvent = event as CustomEvent<{online: boolean}>;
      if (customEvent.detail?.online) {
        // When coming back online, verify auth status
        checkAuthStatus();
      }
    };
    
    document.addEventListener('networkStatusChange', handleNetworkChange);
    
    return () => {
      document.removeEventListener('networkStatusChange', handleNetworkChange);
    };
  }, [checkAuthStatus]);
  
  // Handle visibility changes (when app comes to foreground on mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only check auth if we've been hidden for more than 30 minutes
      if (document.visibilityState === 'visible' && user && Date.now() - lastVisibilityChange > 30 * 60 * 1000) {
        // When app becomes visible again and user is logged in, verify auth
        checkAuthStatus();
      }
      lastVisibilityChange = Date.now();
    };
    
    let lastVisibilityChange = Date.now();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuthStatus, user]);
  
  if (!initialized || isVerifyingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/waitlist" />} />
        <Route path="/waitlist" element={<WaitlistForm />} />
        <Route path="/demo" element={<DemoWaitlist />} />
        <Route element={<FeatureLayout />}>
          <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/legal/terms-of-service" element={<TermsOfService />} />
          <Route path="/legal/cookie-policy" element={<CookiePolicy />} />
        </Route>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/gdpr" element={<GDPRNotice />} />
        <Route 
          path="/forgot-password" 
          element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} 
        />
        <Route path="/reset-password" element={user ? <Navigate to="/dashboard" /> : <ResetPassword />} />
        
        {/* Feature Pages */}
        <Route element={<FeatureLayout />}>
          <Route path="/features/customer-management" element={<CustomerManagement />} />
          <Route path="/features/invoicing" element={<Invoicing />} />
          <Route path="/features/inventory-tracking" element={<InventoryTracking />} />
          <Route path="/function/sales" element={<Sales />} />
          <Route path="/function/marketing" element={<Marketing />} />
          <Route path="/function/customer-support" element={<CustomerSupport />} />
          <Route path="/function/research" element={<Research />} />
          <Route path="/function/operations" element={<Operations />} />
          <Route path="/products/ai-agent" element={<AIAgent />} />
          <Route path="/products/ai-workforce" element={<AIWorkforce />} />
          <Route path="/products/ai-tools" element={<AITools />} />
          <Route path="/products/crm" element={<CRM />} />
          <Route path="/agents/bdr" element={<BDR />} />
          <Route path="/agents/marketer" element={<Marketer />} />
          <Route path="/agents/researcher" element={<Researcher />} />
          <Route path="/agents/crm" element={<CRMEnrichment />} />
          <Route path="/agents/qualification" element={<Qualification />} />
          <Route path="/agents/seo" element={<SEO />} />
          <Route path="/agents/inbox" element={<InboxManager />} />
          <Route path="/blog/ai-market" element={<AIMarket />} />
          <Route path="/features/expenses" element={<ExpensesFeature />} />
          <Route path="/features/quotes" element={<QuotesFeature />} />
          <Route path="/features/ai-growth-partner" element={<AIGrowthPartner />} />
          <Route path="/features/enterprise-plan" element={<EnterprisePlan />} />
          <Route path="/enterprise/solutions" element={<Solutions />} />
          <Route path="/enterprise/security" element={<Security />} />
          <Route path="/enterprise/custom" element={<CustomDevelopment />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pricing/compare" element={<ComparePlans />} />
          <Route path="/features/:planId" element={<PlanDetails />} />
        </Route>
        
        {/* Contact & Demo Pages */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/demo" element={<DemoWaitlist />} />
        <Route path="/waitlist" element={<WaitlistForm />} />
        
        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/crm" element={user ? <CRMDashboard /> : <Navigate to="/login" />} />
          <Route path="/customers" element={user ? <Customers /> : <Navigate to="/login" />} />
          <Route path="/customers/new" element={user ? <NewCustomer /> : <Navigate to="/login" />} />
          <Route path="/customers/:id" element={user ? <CustomerDetail /> : <Navigate to="/login" />} />
          <Route path="/customers/:id/edit" element={user ? <NewCustomer /> : <Navigate to="/login" />} />
          <Route path="/products" element={user ? <Products /> : <Navigate to="/login" />} />
          <Route path="/products/new" element={user ? <NewProduct /> : <Navigate to="/login" />} />
          <Route path="/products/:id" element={user ? <ProductDetail /> : <Navigate to="/login" />} />
          <Route path="/products/:id/edit" element={user ? <EditProduct /> : <Navigate to="/login" />} />
          <Route path="/inventory" element={user ? <Inventory /> : <Navigate to="/login" />} />
          <Route path="/invoices" element={user ? <Invoices /> : <Navigate to="/login" />} />
          <Route path="/invoices/create" element={user ? <CreateInvoice /> : <Navigate to="/login" />} />
          <Route path="/invoices/:id/edit" element={user ? <EditInvoice /> : <Navigate to="/login" />} />
          <Route path="/invoices/:id" element={user ? <InvoiceDetail /> : <Navigate to="/login" />} />
          <Route path="/invoices/:id/edit" element={user ? <EditInvoice /> : <Navigate to="/login" />} />
          <Route path="/pipeline" element={user ? <Pipeline /> : <Navigate to="/login" />} />
          <Route path="/pipeline/:stage" element={user ? <PipelineDetail /> : <Navigate to="/login" />} />
          <Route path="/suppliers" element={user ? <Suppliers /> : <Navigate to="/login" />} />
          <Route path="/team" element={user ? <DirectReports /> : <Navigate to="/login" />} />
          <Route path="/quotes" element={user ? <Quotes /> : <Navigate to="/login" />} />
          <Route path="/quotes/create" element={user ? <CreateQuote /> : <Navigate to="/login" />} />
          <Route path="/quotes/:id" element={user ? <QuoteDetail /> : <Navigate to="/login" />} />
          <Route path="/purchases" element={user ? <Purchases /> : <Navigate to="/login" />} />
          <Route path="/expenses" element={user ? <Expenses /> : <Navigate to="/login" />} />
          <Route path="/purchases/create" element={user ? <CreatePurchase /> : <Navigate to="/login" />} />
          <Route path="/purchases/:id" element={user ? <PurchaseDetail /> : <Navigate to="/login" />} />
          <Route path="/revenue" element={user ? <Revenue /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/templates" element={user ? <Templates /> : <Navigate to="/login" />} />
        </Route>
        
        {/* Catch all - redirect to home or dashboard */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
      </Routes>

      {/* Chat Bot */}
      {!user && !location.pathname.includes('/dashboard') && !location.pathname.includes('/login') && !location.pathname.includes('/register') && (
        <ChatBot isOpen={false} />
      )}
    </>
  );
}

export default App