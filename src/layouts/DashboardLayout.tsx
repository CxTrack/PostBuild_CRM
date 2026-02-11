import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { useAuthContext } from '../contexts/AuthContext';
import {
  LayoutGrid,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Phone,
  CheckSquare,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  Package,
  TrendingUp,
  Shield,
  MessageCircle,
  BarChart3,
  Lock,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { useCoPilot } from '../contexts/CoPilotContext';
import { isAllowedDevUser } from '../config/demo.config';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useVisibleModules } from '../hooks/useVisibleModules';
import { usePipelineConfigStore } from '../stores/pipelineConfigStore';
import { BroadcastBanner } from '../components/BroadcastBanner';
import { CoPilotIntro } from '../components/tour/SubtleHints';



type NavItem = {
  path: string;
  icon: any;
  label: string;
  tourId?: string;
  isLocked?: boolean;
};


const DEFAULT_NAV_ITEMS: NavItem[] = [
  { path: '/dashboard/customers', icon: Users, label: 'Customers', tourId: 'customers' },
  { path: '/dashboard/calendar', icon: Calendar, label: 'Calendar', tourId: 'calendar' },
  { path: '/dashboard/products', icon: Package, label: 'Products' },
  { path: '/dashboard/quotes', icon: FileText, label: 'Quotes' },
  { path: '/dashboard/invoices', icon: DollarSign, label: 'Invoices' },
  { path: '/dashboard/calls', icon: Phone, label: 'Calls' },
  { path: '/dashboard/pipeline', icon: TrendingUp, label: 'Pipeline', tourId: 'pipeline' },
  { path: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
];

const HOME_ITEM: NavItem = { path: '/dashboard', icon: LayoutGrid, label: 'Home' };
const SETTINGS_ITEM: NavItem = { path: '/dashboard/settings', icon: Settings, label: 'Settings' };
const CHAT_ITEM: NavItem = { path: '/dashboard/chat', icon: MessageCircle, label: 'Chat' };

export const DashboardLayout = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { visibleModules } = useVisibleModules();



  const { theme, toggleTheme } = useThemeStore();
  const { preferences } = usePreferencesStore();
  const { fetchUserOrganizations, currentOrganization } = useOrganizationStore();
  const { fetchPipelineStages } = usePipelineConfigStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { isOpen: isCoPilotOpen, panelSide } = useCoPilot();
  const { loadPreferences } = usePreferencesStore();

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user, loadPreferences]);

  useEffect(() => {
    if (currentOrganization) {
      fetchPipelineStages();
    }
  }, [currentOrganization, fetchPipelineStages]);

  const ADMIN_EMAILS = ['cto@cxtrack.com', 'manik.sharma@cxtrack.com', 'abdullah.nassar@cxtrack.com'];
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        return;
      }

      // Allow admin in local dev OR for authorized emails
      if (isLocalDev || (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))) {
        setIsSuperAdmin(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setIsSuperAdmin(!!data?.is_admin);
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsSuperAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, isLocalDev]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  useEffect(() => {
    // 1. Map visibleModules to NavItems (filter out dashboard - Home already handles it)
    const filteredModules = visibleModules.filter((m: any) => m.id !== 'dashboard');
    const moduleNavItems: NavItem[] = filteredModules.map((m: any) => {

      const existing = DEFAULT_NAV_ITEMS.find(item => item.path === `/dashboard${m.route}`);
      return {
        path: m.isLocked ? '/dashboard/upgrade' : `/dashboard${m.route}`,
        icon: existing?.icon || Package,
        label: m.name,
        isLocked: m.isLocked,
        tourId: existing?.tourId
      };
    });

    if (preferences.sidebarOrder && preferences.sidebarOrder.length > 0) {
      const orderedItems = preferences.sidebarOrder
        .map((path: string) => moduleNavItems.find((item: NavItem) => item.path === path))
        .filter((item): item is NavItem => !!item);

      // Add any missing items from moduleNavItems
      const existingPaths = new Set(preferences.sidebarOrder);
      const missingItems = moduleNavItems.filter(item => !existingPaths.has(item.path));

      setNavItems([...orderedItems, ...missingItems]);
    } else {
      setNavItems(moduleNavItems);
    }
  }, [preferences.sidebarOrder, visibleModules]);


  useEffect(() => {
    if (user?.id) {
      fetchUserOrganizations(user.id);
    }
  }, [user, fetchUserOrganizations]);

  const isModuleShared = (path: string) => {
    if (!currentOrganization?.metadata?.sharing) return true;

    const pathMap: Record<string, string> = {
      '/dashboard/customers': 'customers',
      '/dashboard/calendar': 'calendar',
      '/dashboard/pipeline': 'pipeline',
      '/dashboard/tasks': 'tasks',
      // Default to shared if not explicitly in the map or metadata
    };

    const key = pathMap[path];
    if (!key) return true;

    return currentOrganization.metadata.sharing[key] ?? true;
  };

  const visibleNavItems = navItems.filter(item => isModuleShared(item.path));

  // Mobile navigation logic: show Home, 3 custom items + "More"
  const mobileCustomPaths = preferences.mobileNavItems || ['/dashboard/customers', '/dashboard/calendar', '/dashboard/products'];

  // Find the actual nav items for the preferred paths
  const mobileBottomNavItems = [
    HOME_ITEM,
    ...mobileCustomPaths
      .map((path: string) => DEFAULT_NAV_ITEMS.find((item: NavItem) => item.path === path))
      .filter((item): item is NavItem => !!item)
  ].slice(0, 4);

  // All other visible items go to "More"
  const selectedPaths = new Set(mobileBottomNavItems.map(i => i.path));
  const moreNavItems = visibleNavItems.filter((item: NavItem) => !selectedPaths.has(item.path));

  // Ensure Settings is in More if not selected
  if (!selectedPaths.has('/dashboard/settings') && !moreNavItems.some((i: NavItem) => i.path === '/dashboard/settings')) {
    moreNavItems.push(SETTINGS_ITEM);
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      <BroadcastBanner />
      {/* Desktop Sidebar - Hidden on Mobile */}
      <aside
        className={`hidden md:flex md:flex-col md:w-64 transition-all duration-300 ${theme === 'soft-modern'
          ? 'bg-white border-r border-gray-200/60'
          : 'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700'
          } ${isCoPilotOpen && panelSide === 'left' ? 'md:ml-[400px]' : ''}`}
      >
        {/* Logo */}
        <div className={theme === 'soft-modern' ? "p-6 border-b border-default" : "p-4 border-b border-gray-200 dark:border-gray-700"} data-tour="sidebar">
          <h1 className={theme === 'soft-modern' ? "text-xl font-semibold text-primary" : "text-xl font-bold text-gray-900 dark:text-white"}>CxTrack</h1>
          {currentOrganization?.industry_template && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest mt-1">
              {currentOrganization.industry_template.replace(/_/g, ' ')}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className={theme === 'soft-modern' ? "flex-1 overflow-y-auto p-4 space-y-2" : "flex-1 overflow-y-auto p-4 space-y-1"}>
          <Link
            to={HOME_ITEM.path}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 ${isActive(HOME_ITEM.path) ? 'active' : ''}`
                : `flex items-center px-3 py-2 rounded-lg transition-colors ${isActive(HOME_ITEM.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
          >
            <HOME_ITEM.icon size={20} className="mr-3" />
            <span className="font-medium">{HOME_ITEM.label}</span>
          </Link>

          {visibleNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.isLocked ? '/dashboard/upgrade' : item.path}
              className={
                theme === 'soft-modern'
                  ? `nav-item flex items-center px-4 py-3 ${isActive(item.path) ? 'active' : ''} ${item.isLocked ? 'opacity-60' : ''}`
                  : `flex items-center px-3 py-2 rounded-lg transition-colors ${isActive(item.path)
                    ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${item.isLocked ? 'opacity-60' : ''}`
              }
            >
              <item.icon size={20} className="mr-3" />
              <span className="font-medium">{item.label}</span>
              {item.isLocked && <Lock size={14} className="ml-auto text-amber-500" />}
            </Link>
          ))}

          <Link
            to={SETTINGS_ITEM.path}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 ${isActive(SETTINGS_ITEM.path) ? 'active' : ''}`
                : `flex items-center px-3 py-2 rounded-lg transition-colors ${isActive(SETTINGS_ITEM.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
          >
            <SETTINGS_ITEM.icon size={20} className="mr-3" />
            <span className="font-medium">{SETTINGS_ITEM.label}</span>
          </Link>

        </nav>

        {/* Pinned Chat Section */}
        <div className={theme === 'soft-modern' ? "px-4 py-2" : "px-4 py-2 border-t border-gray-200 dark:border-gray-700"}>
          <Link
            to={CHAT_ITEM.path}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center justify-between px-4 py-3 ${isActive(CHAT_ITEM.path) ? 'active' : ''}`
                : `flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${isActive(CHAT_ITEM.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
          >
            <div className="flex items-center">
              <MessageCircle size={20} className="mr-3" />
              <span className="font-medium">Team Chat</span>
            </div>
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              3
            </span>
          </Link>

          {/* Reports Link */}
          <Link
            to="/dashboard/reports"
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 mt-1 ${isActive('/dashboard/reports') ? 'active' : ''}`
                : `flex items-center px-3 py-2 mt-1 rounded-lg transition-colors ${isActive('/dashboard/reports')
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
          >
            <BarChart3 size={20} className="mr-3" />
            <span className="font-medium">Reports</span>
          </Link>
        </div>

        {/* User Profile */}
        <div className={theme === 'soft-modern' ? "p-4 border-t border-default" : "p-4 border-t border-gray-200 dark:border-gray-700"}>
          <button
            onClick={() => {
              if (isSuperAdmin) {
                navigate('/admin');
              } else {
                navigate('/dashboard/settings');
              }
            }}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${theme === 'soft-modern'
              ? 'hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <div className="flex items-center">
              <div
                className={theme === 'soft-modern' ? "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-purple-600 to-blue-600 shadow-sm" : "w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"}
              >
                {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="ml-3 text-left">
                <p className={theme === 'soft-modern' ? "text-xs font-bold text-primary" : "text-xs font-bold text-gray-900 dark:text-white"}>
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                {isSuperAdmin ? (
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Super Admin</p>
                ) : isAllowedDevUser(user?.email) ? (
                  <p className={theme === 'soft-modern' ? "text-[10px] text-tertiary font-bold uppercase" : "text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase"}>Dev Mode</p>
                ) : null}
              </div>
            </div>
            {isSuperAdmin && (
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[2.5px]" />
            )}
          </button>

          <div className="mt-2 flex items-center justify-between px-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Theme</span>
            <button
              onClick={toggleTheme}
              className={theme === 'soft-modern' ? "p-1.5 rounded-lg transition-all btn-ghost" : "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Shown on Mobile Only */}
      <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-base font-black text-indigo-600 tracking-tight">CxTrack</h1>
          <div className="flex items-center">
            <Link to="/dashboard/calendar" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
              <Calendar size={18} />
            </Link>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative text-gray-500 dark:text-gray-400">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto pb-20 md:pb-0 transition-all duration-300 ${isCoPilotOpen ? (panelSide === 'left' ? 'md:ml-[400px]' : 'md:mr-[400px]') : ''
        }`}>
        <Outlet key={location.pathname} />
      </main>

      {/* Mobile Bottom Navigation - Shown on Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {mobileBottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${isActive(item.path)
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <item.icon size={22} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="flex flex-col items-center justify-center flex-1 py-2 text-gray-500 dark:text-gray-400"
          >
            <Menu size={22} />
            <span className="text-xs mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">More Options</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
              {moreNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg active:bg-gray-100 dark:active:bg-gray-600 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <item.icon size={20} className="mr-3 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                </Link>
              ))}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                    A
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Admin User</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dev Mode</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtle CoPilot Introduction */}
      <CoPilotIntro />
    </div>
  );
};
