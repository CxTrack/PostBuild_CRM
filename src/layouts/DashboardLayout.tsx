import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutGrid, Users, Package, FileText, ShoppingCart,
  Settings, LogOut, Menu, X, ChevronDown, Bell, Search, DollarSign,
  CircleUser, BarChart3, Layers, ShoppingBag, FileText as Quote, Bot, Upload, Receipt, Star,
  Calendar, ChevronLeft, ChevronRight, Maximize2, ExternalLink
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import { useAuthStore } from '../stores/authStore';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { useTemplateStore } from '../stores/templateStore';
import { useTemplateConfigStore } from '../stores/templateConfigStore';
import { adminStore } from '../stores/adminStore';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMaximized, setCalendarMaximized] = useState(false);
  const { activeTemplateSettings, setActiveTemplate, getActiveTemplate, loading } = useTemplateStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sales: true,
    finance: true,
    team: true,
    system: true,
    admin: true
  });
  const { user, signOut } = useAuthStore();
  const { currentSubscription } = useSubscriptionStore();
  const { getConfig } = useTemplateConfigStore();
  const templateConfig = getConfig(activeTemplateSettings.activeTemplate);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isUserAdmin } = adminStore.getState();

  // Check if user has access to premium features
  const hasPremiumAccess = currentSubscription?.plan_id && ['business', 'enterprise'].includes(currentSubscription.plan_id);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle calendar maximize/minimize
  const handleCalendarMaximize = () => {
    setCalendarMaximized(!calendarMaximized);
    // Close sidebar when maximizing calendar
    if (!calendarMaximized) {
      setSidebarOpen(false);
    }
  };

  // Watch calendar state changes
  useEffect(() => {

    getActiveTemplate();
    isUserAdmin();

    if (calendarMaximized) {
      setSidebarOpen(false);
    }
  }, [calendarMaximized]);

  // Watch sidebar state changes
  useEffect(() => {
    if (sidebarOpen && calendarMaximized) {
      setCalendarMaximized(false);
    }
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if we're in the AI Agents section
  const isAIAgentsActive = location.pathname === '/settings' && location.search === '?tab=ai-agents';

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full bg-dark-900 transform transition-transform duration-200 ease-in-out md:relative ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 md:w-20'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-dark-800">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img src="/logo.svg" alt="CxTrack Logo" className="h-10 w-10 logo-glow" />
              {sidebarOpen && (
                <span className="brand-logo text-2xl font-bold text-white brand-text">CxTrack</span>
              )}
            </Link>
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-700 md:block"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <ChevronLeft size={20} className={`transform transition-transform duration-200 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </button>
          </div>

          {/* Sidebar links */}
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {templateConfig.sidebarItems.map((item, index) => {
              let Icon;
              switch (item.icon) {
                case 'LayoutDashboard':
                  Icon = LayoutGrid;
                  break;
                case 'Users':
                  Icon = Users;
                  break;
                case 'FileText':
                  Icon = FileText;
                  break;
                case 'Package':
                  Icon = Package;
                  break;
                case 'ShoppingCart':
                  Icon = ShoppingCart;
                  break;
                case 'Receipt':
                  Icon = Receipt;
                  break;
                case 'DollarSign':
                  Icon = DollarSign;
                  break;
                case 'Calendar':
                  Icon = Calendar;
                  break;
                default:
                  Icon = FileText;
              }
              return item.section ? null : (
                <NavLink
                  key={index}
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              );
            })}

            {sidebarOpen && templateConfig.dashboardSections.showSalesChart && (
              <div
                className="pt-4 pb-2 px-4 flex items-center justify-between cursor-pointer group"
                onClick={() => toggleSection('sales')}
              >
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sales</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transform transition-transform duration-200 ${expandedSections.sales ? 'rotate-180' : ''
                    }`}
                />
              </div>
            )}

            {((!sidebarOpen || expandedSections.sales) && templateConfig.dashboardSections.showSalesChart) && (
              <>{templateConfig.sidebarItems
                .filter(item => item.section === 'sales')
                .map((item, index) => {
                  let Icon;
                  switch (item.icon) {
                    case 'Quote':
                      Icon = Quote;
                      break;
                    case 'FileText':
                      Icon = FileText;
                      break;
                    default:
                      Icon = FileText;
                  }
                  return (
                    <NavLink
                      key={index}
                      to={item.path}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={20} />
                      {sidebarOpen && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}</>
            )}
            {/* 
            {sidebarOpen && (
              <div
                className="pt-4 pb-2 px-4 flex items-center justify-between cursor-pointer group"
                onClick={() => toggleSection('team')}
              >
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Team</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transform transition-transform duration-200 ${
                    expandedSections.team ? 'rotate-180' : ''
                  }`}
                />
              </div>
            )} */}

            {/* {(!sidebarOpen || expandedSections.team) && (
              <>
                <NavLink to="/team" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <Users size={20} />
                  {sidebarOpen && <span>Direct Reports</span>}
                </NavLink>

                <NavLink
                  to="/settings?tab=ai-agents"
                  className={({isActive}) => `sidebar-link ${isActive && isAIAgentsActive ? 'active' : ''}`}
                >
                  <Bot size={20} />
                  {sidebarOpen && (
                    <div className="flex items-center">
                      <span className="ml-3">AI Agents</span>
                      {!hasPremiumAccess && (
                        <Star
                          size={14}
                          className="ml-2 text-yellow-400 fill-yellow-400"
                          data-tooltip-id="premium-feature"
                          data-tooltip-content="Premium Feature"
                        />
                      )}
                    </div>
                  )}
                </NavLink>
              </>
            )} */}
            {/* 
            {sidebarOpen && templateConfig.dashboardSections.showFinance &&(
              <div
                className="pt-4 pb-2 px-4 flex items-center justify-between cursor-pointer group"
                onClick={() => toggleSection('finance')}
              >
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Finance</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transform transition-transform duration-200 ${expandedSections.finance ? 'rotate-180' : ''
                    }`}
                />
              </div>
            )} */}

            {/* {(!sidebarOpen || expandedSections.finance) && templateConfig.dashboardSections.showFinance && (
              <>
                <NavLink to="/revenue" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <DollarSign size={20} />
                  {sidebarOpen && <span>Revenue</span>}
                </NavLink>

                <NavLink to="/expenses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <Receipt size={20} />
                  {sidebarOpen && <span>Expenses</span>}
                </NavLink>

                <NavLink to="/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <Package size={20} />
                  {sidebarOpen && <span>Products</span>}
                </NavLink>

                <NavLink to="/inventory" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <Layers size={20} />
                  {sidebarOpen && <span>Inventory</span>}
                </NavLink>

                <NavLink to="/purchases" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <ShoppingCart size={20} />
                  {sidebarOpen && <span>Purchases</span>}
                </NavLink> 
              </>
            )} */}

            <NavLink to="/pipeline" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <DollarSign size={20} />
              {sidebarOpen && <span>Pipeline</span>}
            </NavLink>


            {/* ADMIN area */}
            {sidebarOpen && isAdmin && (
              <div
                className="pt-4 pb-2 px-4 flex items-center justify-between cursor-pointer group"
                onClick={() => toggleSection('admin')}
              >
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transform transition-transform duration-200 ${expandedSections.admin ? 'rotate-180' : ''
                    }`}
                />
              </div>
            )}

            {(!sidebarOpen || expandedSections.admin) && isAdmin && (
              <>
                <NavLink to="/admin-calls" end className={({ isActive }) => `sidebar-link ${isActive && !isAIAgentsActive ? 'active' : ''}`}>
                  <Settings size={20} />
                  {sidebarOpen && <span>Calls</span>}
                </NavLink>

                <NavLink to="/admin/call-agent-setup" end className={({ isActive }) => `sidebar-link ${isActive && !isAIAgentsActive ? 'active' : ''}`}>
                  <Settings size={20} />
                  {sidebarOpen && <span>Call Agents</span>}
                </NavLink>

                <NavLink to="/admin-users" end className={({ isActive }) => `sidebar-link ${isActive && !isAIAgentsActive ? 'active' : ''}`}>
                  <Settings size={20} />
                  {sidebarOpen && <span>Users</span>}
                </NavLink>

                <NavLink to="/admin/sent-notification" end className={({ isActive }) => `sidebar-link ${isActive && !isAIAgentsActive ? 'active' : ''}`}>
                  <Settings size={20} />
                  {sidebarOpen && <span>Send Notification</span>}
                </NavLink>
              </>
            )}

            {sidebarOpen && (
              <div
                className="pt-4 pb-2 px-4 flex items-center justify-between cursor-pointer group"
                onClick={() => toggleSection('system')}
              >
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transform transition-transform duration-200 ${expandedSections.system ? 'rotate-180' : ''
                    }`}
                />
              </div>
            )}

            {(!sidebarOpen || expandedSections.system) && (
              <>
                <NavLink to="/settings" end className={({ isActive }) => `sidebar-link ${isActive && !isAIAgentsActive ? 'active' : ''}`}>
                  <Settings size={20} />
                  {sidebarOpen && <span>Settings</span>}
                </NavLink>

                {/* <NavLink to="/settings?tab=integrations" className={({ isActive }) => `sidebar-link ${location.pathname === '/settings' && location.search === '?tab=integrations' ? 'active' : ''}`}>
                  <Upload size={20} />
                  {sidebarOpen && <span>Integrations</span>}
                </NavLink> */}

                <NavLink to="/templates" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <FileText size={20} />
                  {sidebarOpen && <span>Templates</span>}
                </NavLink>
              </>
            )}

            {/* <button
              onClick={() => {
                setShowCalendar(!showCalendar);
                if (!showCalendar && window.innerWidth < 1280) {
                  setSidebarOpen(false);
                }
              }}
              className={`sidebar-link w-full text-left ${showCalendar ? 'bg-primary-600 text-white' : ''}`}
            >
              <Calendar size={20} />
              {sidebarOpen && <span>Calendar</span>}
            </button> */}

            <button
              onClick={handleSignOut}
              className="sidebar-link text-red-400 hover:text-red-300 w-full text-left"
            >
              <LogOut size={20} />
              {sidebarOpen && <span>Sign Out</span>}
            </button>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-dark-900 border-b border-dark-800 sticky top-0 z-10">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Left side - Toggle button & search */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-white md:hidden"
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>

              {/* <div className="hidden md:flex items-center bg-dark-800 rounded-md px-3 py-1.5">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none focus:outline-none text-white ml-2 w-64"
                />
              </div> */}
            </div>

            {/* Right side - Notifications & user menu */}
            <div className="flex items-center space-x-4">
              {/* Removed the wrapping button */}
              <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none"
                  aria-label="User menu"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center text-white">
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  {sidebarOpen && (
                    <>
                      <span className="hidden md:inline-block font-medium">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                      </span>
                      <ChevronDown size={16} className="hidden md:block" />
                    </>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-md shadow-lg py-1 z-50">
                    <NavLink
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile Settings
                    </NavLink>
                    <NavLink
                      to="/settings?tab=billing"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Subscription
                    </NavLink>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile search bar */}
          {/* <div className="md:hidden px-4 pb-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="input pl-10 w-full"
              />
            </div>
          </div> */}
        </header>

        {/* Calendar Sidebar */}
        {/* {showCalendar && (
          <div
            id="calendar-wrapper"
            className={`fixed right-0 top-16 bottom-0 bg-dark-900 border-l border-dark-800 z-20 overflow-hidden transition-all duration-200 flex flex-col ${calendarMaximized ? 'left-64 md:left-20' : 'w-96'
              }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">Calendar</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCalendar(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-700"
                  title="Close Calendar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <CalendarComponent
                isMaximized={calendarMaximized}
                onToggleMaximize={handleCalendarMaximize}
                onOpenNewWindow={openCalendarInNewWindow}
              />
            </div>
          </div>
        )} */}

        {/* Sidebar Toggle Button - Only show when sidebar is closed and calendar is maximized */}
        {/* {!sidebarOpen && calendarMaximized && (
          <button
            onClick={toggleSidebar}
            className="fixed left-4 top-20 z-30 bg-dark-800 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-dark-700 shadow-lg"
            title="Show Sidebar"
          >
            <ChevronRight size={20} />
          </button>
        )} */}

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto bg-dark-950 p-4 md:p-6 transition-all duration-200 ${showCalendar ? (calendarMaximized ? 'mr-[calc(100%-16rem)]' : 'mr-96') : ''
          }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;