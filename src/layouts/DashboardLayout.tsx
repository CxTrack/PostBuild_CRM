import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Package,
  TrendingUp,
  Shield,
  MessageCircle,
  BarChart3,
  Lock,
  Clock,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { supabase } from '../lib/supabase';
import { TourManager } from '@/lib/tourManager';
import { useCoPilot } from '../contexts/CoPilotContext';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useVisibleModules } from '../hooks/useVisibleModules';
import { usePipelineConfigStore } from '../stores/pipelineConfigStore';
import { BroadcastBanner } from '../components/BroadcastBanner';
import { CoPilotIntro } from '../components/tour/SubtleHints';
import CoPilotPanel from '../components/copilot/CoPilotPanel';
import CoPilotButton from '../components/copilot/CoPilotButton';
import { useImpersonationStore } from '../stores/impersonationStore';
import { ImpersonationBanner } from '../components/admin/ImpersonationBanner';
import { NotificationBell } from '../components/ui/NotificationBell';



type NavItem = {
  path: string;
  icon: any;
  label: string;
  tourId?: string;
  isLocked?: boolean;
  isTrialFeature?: boolean;
  trialDaysRemaining?: number | null;
};


// Icon mapping for modules - labels come ONLY from industry templates
const MODULE_ICONS: Record<string, any> = {
  crm: Users,
  calendar: Calendar,
  products: Package,
  quotes: FileText,
  invoices: DollarSign,
  calls: Phone,
  pipeline: TrendingUp,
  tasks: CheckSquare,
  inventory: Package,
  suppliers: Users,
  financials: DollarSign,
};

const MODULE_TOUR_IDS: Record<string, string> = {
  crm: 'customers',
  calendar: 'calendar',
  pipeline: 'pipeline',
};

const HOME_ITEM: NavItem = { path: '/dashboard', icon: LayoutGrid, label: 'Home' };
const SETTINGS_ITEM: NavItem = { path: '/dashboard/settings', icon: Settings, label: 'Settings' };
const CHAT_ITEM: NavItem = { path: '/dashboard/chat', icon: MessageCircle, label: 'Chat' };

// Extract module ID from path for DnD sorting
const getModuleIdFromPath = (path: string): string => {
  const segments = path.replace('/dashboard/', '').split('/');
  return segments[0] || path;
};

// Sortable nav item component for drag-and-drop reordering (desktop only)
const SortableNavItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  sidebarCollapsed: boolean;
  theme: string;
}> = ({ item, isActive: active, sidebarCollapsed, theme }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: getModuleIdFromPath(item.path) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/drag relative">
      <Link
        to={item.isLocked ? '/dashboard/upgrade' : item.path}
        className={
          theme === 'soft-modern'
            ? `nav-item flex items-center px-4 py-3 ${active ? 'active' : ''} ${item.isLocked ? 'opacity-60' : ''}`
            : `flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'} rounded-lg transition-colors ${active
              ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${item.isLocked ? 'opacity-60' : ''}`
        }
        title={sidebarCollapsed ? item.label : (item.isTrialFeature ? `🎁 Premium feature free for ${item.trialDaysRemaining} days! Upgrade to keep access forever.` : undefined)}
      >
        {/* Drag handle - appears on hover, only when not collapsed */}
        {!sidebarCollapsed && (
          <button
            {...attributes}
            {...listeners}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 opacity-0 group-hover/drag:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing p-0.5 text-gray-400 dark:text-gray-500 transition-opacity"
            onClick={(e) => e.preventDefault()}
            tabIndex={-1}
          >
            <GripVertical size={14} />
          </button>
        )}
        <item.icon size={20} className={sidebarCollapsed ? '' : 'mr-3'} />
        {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
        {!sidebarCollapsed && item.isLocked && <Lock size={14} className="ml-auto text-amber-500" />}
        {!sidebarCollapsed && item.isTrialFeature && !item.isLocked && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded" title={`Premium feature - ${item.trialDaysRemaining} days left in trial`}>
            <Sparkles size={10} />
            {item.trialDaysRemaining}d
          </span>
        )}
      </Link>
    </div>
  );
};

/** Compact one-time hint bubble next to Settings link — uses portal to escape sidebar overflow */
const SettingsHint: React.FC<{ sidebarCollapsed: boolean; theme: string; isActive: boolean }> = ({ sidebarCollapsed, theme, isActive }) => {
  const [showHint, setShowHint] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    TourManager.shouldShowTooltip('voice-agent-settings-hint').then(show => {
      if (show) setShowHint(true);
    });
  }, []);

  // Position the portal tooltip relative to the Settings link
  useEffect(() => {
    if (!showHint || sidebarCollapsed || !linkRef.current) return;
    const update = () => {
      const rect = linkRef.current?.getBoundingClientRect();
      if (rect) setPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [showHint, sidebarCollapsed]);

  const dismiss = () => {
    setShowHint(false);
    TourManager.dismissTooltip('voice-agent-settings-hint');
  };

  return (
    <>
      <Link
        ref={linkRef}
        to={SETTINGS_ITEM.path}
        className={
          theme === 'soft-modern'
            ? `nav-item flex items-center px-4 py-3 ${isActive ? 'active' : ''}`
            : `flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'} rounded-lg transition-colors ${isActive
              ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`
        }
        title={sidebarCollapsed ? SETTINGS_ITEM.label : undefined}
        onClick={showHint ? dismiss : undefined}
      >
        <SETTINGS_ITEM.icon size={20} className={sidebarCollapsed ? '' : 'mr-3'} />
        {!sidebarCollapsed && <span className="font-medium">{SETTINGS_ITEM.label}</span>}
      </Link>

      {showHint && !sidebarCollapsed && pos && createPortal(
        <div
          className="fixed z-[9999] animate-in fade-in slide-in-from-left-2 duration-300 pointer-events-auto"
          style={{ top: pos.top, left: pos.left, transform: 'translateY(-50%)' }}
        >
          <div className="relative bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-500/30 px-3 py-2 text-xs whitespace-nowrap">
            {/* Arrow pointing left */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-indigo-600" />
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-indigo-200 shrink-0" />
              <span className="font-semibold leading-tight">Voice Agent settings live here</span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(); }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-800 hover:bg-indigo-900 rounded-full flex items-center justify-center transition-colors"
              aria-label="Dismiss"
            >
              <X size={10} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const DashboardLayout = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('cxtrack_sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const { visibleModules } = useVisibleModules();



  const { theme, toggleTheme } = useThemeStore();
  const { preferences } = usePreferencesStore();
  const { currentOrganization, teamMembers } = useOrganizationStore();
  const { fetchPipelineStages } = usePipelineConfigStore();
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuthContext();
  const { isOpen: isCoPilotOpen, panelSide } = useCoPilot();
  const { loadPreferences, saveSidebarOrder } = usePreferencesStore();
  const { isImpersonating, restoreFromSession } = useImpersonationStore();

  // DnD sensors — require 8px movement before dragging starts to avoid accidental drags on clicks
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Sharing metadata reference for memoization
  const sharingMetadata = currentOrganization?.metadata?.sharing;

  // Memoize visible nav items to prevent unnecessary re-renders and DnD instability
  const visibleNavItems = useMemo(() => {
    return navItems.filter(item => {
      if (!sharingMetadata) return true;

      const pathMap: Record<string, string> = {
        '/dashboard/customers': 'customers',
        '/dashboard/calendar': 'calendar',
        '/dashboard/pipeline': 'pipeline',
        '/dashboard/tasks': 'tasks',
      };

      const key = pathMap[item.path];
      if (!key) return true;

      return sharingMetadata[key] ?? true;
    });
  }, [navItems, sharingMetadata]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleNavItems.findIndex(item => getModuleIdFromPath(item.path) === active.id);
    const newIndex = visibleNavItems.findIndex(item => getModuleIdFromPath(item.path) === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(visibleNavItems, oldIndex, newIndex);
    setNavItems(reordered);

    // Persist the new order using module IDs
    const newOrder = reordered.map(item => getModuleIdFromPath(item.path));
    saveSidebarOrder(newOrder);
  }, [visibleNavItems, saveSidebarOrder]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('cxtrack_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  // Auto-collapse sidebar when CoPilot opens (desktop only) for better UX
  useEffect(() => {
    if (isCoPilotOpen && !sidebarCollapsed && window.innerWidth >= 768) {
      setSidebarCollapsed(true);
      try { localStorage.setItem('cxtrack_sidebar_collapsed', 'true'); } catch {}
    }
  }, [isCoPilotOpen]);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user, loadPreferences]);

  // Restore impersonation session on page refresh
  useEffect(() => {
    if (user) {
      restoreFromSession();
    }
  }, [user, restoreFromSession]);

  useEffect(() => {
    if (currentOrganization) {
      fetchPipelineStages();
    }
  }, [currentOrganization, fetchPipelineStages]);

  const ADMIN_EMAILS = ['cto@cxtrack.com', 'manik.sharma@cxtrack.com', 'abdullah.nassar@cxtrack.com', 'info@cxtrack.com'];
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
        setIsSuperAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, isLocalDev]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  useEffect(() => {
    // ONLY use visibleModules from template system - no legacy static items
    const filteredModules = visibleModules.filter((m: any) => m.id !== 'dashboard');

    // Use a Map to deduplicate by module ID (belt and suspenders)
    const moduleMap = new Map<string, NavItem>();

    filteredModules.forEach((m: any) => {
      // Only add if not already in map (first occurrence wins)
      if (!moduleMap.has(m.id)) {
        moduleMap.set(m.id, {
          path: `/dashboard${m.route}`, // Always use actual route, handle locked in UI
          icon: MODULE_ICONS[m.id] || Package,
          label: m.name, // This comes from industry template labels
          isLocked: m.isLocked,
          isTrialFeature: m.isTrialFeature,
          trialDaysRemaining: m.trialDaysRemaining,
          tourId: MODULE_TOUR_IDS[m.id]
        });
      }
    });

    const moduleNavItems = Array.from(moduleMap.values());

    // Apply saved sidebar order from user preferences
    const savedOrder = preferences.sidebarOrder;
    if (savedOrder && savedOrder.length > 0) {
      // Reorder moduleNavItems to match saved order
      const ordered: NavItem[] = [];
      const remaining = new Map(moduleNavItems.map(item => [getModuleIdFromPath(item.path), item]));

      // Add items in saved order (skip stale IDs that no longer exist)
      savedOrder.forEach((moduleId: string) => {
        const item = remaining.get(moduleId);
        if (item) {
          ordered.push(item);
          remaining.delete(moduleId);
        }
      });

      // Append any new modules not in saved order (e.g. newly added to template)
      remaining.forEach(item => ordered.push(item));

      setNavItems(ordered);
    } else {
      setNavItems(moduleNavItems);
    }

  }, [visibleModules, preferences.sidebarOrder]);


  // Fetch organizations once when user changes - use getState() to avoid infinite loops
  useEffect(() => {
    if (!user?.id) return;

    const state = useOrganizationStore.getState();
    const orgs = state.organizations;
    const cachedMembership = state.currentMembership;

    // Clear cache if cached membership belongs to a different user (stale data)
    if (cachedMembership && cachedMembership.user_id !== user.id) {
      console.log('[DashboardLayout] Clearing stale organization cache - user mismatch');
      state.clearCache();
    }

    // Only fetch if no orgs yet or cached user doesn't match current user
    if (orgs.length === 0 || !orgs.some(o => o.membership.user_id === user.id)) {
      console.log('[DashboardLayout] Fetching organizations for user:', user.id);
      state.fetchUserOrganizations(user.id);
    }
  }, [user?.id]);

  // Mobile navigation logic: show Home, 3 custom items + "More"
  // Mobile navigation - use first 3 items from template
  const mobileBottomNavItems = [
    HOME_ITEM,
    ...navItems.slice(0, 3)
  ];

  // All other visible items go to "More"
  const selectedPaths = new Set(mobileBottomNavItems.map(i => i.path));
  const moreNavItems = visibleNavItems.filter((item: NavItem) => !selectedPaths.has(item.path));

  // Ensure Settings is in More if not selected
  if (!selectedPaths.has('/dashboard/settings') && !moreNavItems.some((i: NavItem) => i.path === '/dashboard/settings')) {
    moreNavItems.push(SETTINGS_ITEM);
  }

  return (
    <div className={`h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 ${isImpersonating ? 'pt-10' : ''}`}>
      <ImpersonationBanner />
      <BroadcastBanner />
      {/* Desktop Sidebar - Hidden on Mobile */}
      <aside
        className={`hidden md:flex md:flex-col ${sidebarCollapsed ? 'md:w-[68px]' : 'md:w-64'} transition-all duration-300 ${theme === 'soft-modern'
          ? 'bg-white border-r border-gray-200/60'
          : 'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700'
          } ${isCoPilotOpen && panelSide === 'left' ? 'md:ml-[400px]' : ''}`}
      >
        {/* Logo + Collapse Toggle */}
        <div className={`${theme === 'soft-modern' ? "p-6 border-b border-default" : "p-4 border-b border-gray-200 dark:border-gray-700"} flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`} data-tour="sidebar">
          {!sidebarCollapsed ? (
            <div>
              <h1 className={theme === 'soft-modern' ? "text-xl font-semibold text-primary" : "text-xl font-bold text-gray-900 dark:text-white"}>CxTrack</h1>
              {currentOrganization?.industry_template && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest mt-1">
                  {currentOrganization.industry_template.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          ) : (
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Cx</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={theme === 'soft-modern' ? "flex-1 overflow-y-auto p-4 space-y-2" : `flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-2 space-y-1' : 'p-4 space-y-1'}`}>
          <Link
            to={HOME_ITEM.path}
            onClick={(e) => {
              // Ensure router transition even if Link default fails
            }}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 ${isActive(HOME_ITEM.path) ? 'active' : ''}`
                : `flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'} rounded-lg transition-colors ${isActive(HOME_ITEM.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
            title={sidebarCollapsed ? HOME_ITEM.label : undefined}
          >
            <HOME_ITEM.icon size={20} className={sidebarCollapsed ? '' : 'mr-3'} />
            {!sidebarCollapsed && <span className="font-medium">{HOME_ITEM.label}</span>}
          </Link>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleNavItems.map(item => getModuleIdFromPath(item.path))}
              strategy={verticalListSortingStrategy}
            >
              {visibleNavItems.map((item) => (
                <SortableNavItem
                  key={`nav-${getModuleIdFromPath(item.path)}`}
                  item={item}
                  isActive={isActive(item.path)}
                  sidebarCollapsed={sidebarCollapsed}
                  theme={theme}
                />
              ))}
            </SortableContext>
          </DndContext>

          <SettingsHint sidebarCollapsed={sidebarCollapsed} theme={theme} isActive={isActive(SETTINGS_ITEM.path)} />

          {/* Upgrade Button - Only show for free tier */}
          {currentOrganization?.subscription_tier === 'free' && (
            <Link
              to="/dashboard/upgrade"
              className={`flex items-center justify-center gap-2 ${sidebarCollapsed ? 'mx-0 mt-2 p-2.5' : 'mx-1 mt-3 px-4 py-3'} bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:scale-[1.02]`}
              title={sidebarCollapsed ? 'Upgrade Plan' : undefined}
            >
              <Sparkles size={16} />
              {!sidebarCollapsed && 'Upgrade Plan'}
            </Link>
          )}

        </nav>

        {/* Pinned Chat Section */}
        <div className={theme === 'soft-modern' ? "px-4 py-2" : `${sidebarCollapsed ? 'px-2' : 'px-4'} py-2 border-t border-gray-200 dark:border-gray-700`}>
          <Link
            to={CHAT_ITEM.path}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center justify-between px-4 py-3 ${isActive(CHAT_ITEM.path) ? 'active' : ''}`
                : `flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'} rounded-lg transition-colors ${isActive(CHAT_ITEM.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
            title={sidebarCollapsed ? 'Team Chat' : undefined}
          >
            <div className="flex items-center">
              <MessageCircle size={20} className={sidebarCollapsed ? '' : 'mr-3'} />
              {!sidebarCollapsed && <span className="font-medium">Team Chat</span>}
            </div>
          </Link>

          {/* Reports Link */}
          <Link
            to="/dashboard/reports"
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 mt-1 ${isActive('/dashboard/reports') ? 'active' : ''}`
                : `flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'} mt-1 rounded-lg transition-colors ${isActive('/dashboard/reports')
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
            title={sidebarCollapsed ? 'Reports' : undefined}
          >
            <BarChart3 size={20} className={sidebarCollapsed ? '' : 'mr-3'} />
            {!sidebarCollapsed && <span className="font-medium">Reports</span>}
          </Link>
        </div>

        {/* User Profile */}
        <div className={theme === 'soft-modern' ? "p-4 border-t border-default" : `${sidebarCollapsed ? 'p-2' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
          <button
            onClick={() => {
              if (isSuperAdmin) {
                navigate('/admin');
              } else {
                navigate('/dashboard/settings');
              }
            }}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-2' : 'justify-between p-3'} rounded-2xl transition-all ${theme === 'soft-modern'
              ? 'hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            title={sidebarCollapsed ? (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User') : undefined}
          >
            <div className="flex items-center">
              {(() => {
                const currentUserAvatar = teamMembers.find((m: any) => m.id === user?.id)?.avatar_url;
                const initial = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase();
                return currentUserAvatar ? (
                  <img src={currentUserAvatar} alt="" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
                ) : (
                  <div className={theme === 'soft-modern' ? "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-purple-600 to-blue-600 shadow-sm" : "w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"}>
                    {initial}
                  </div>
                );
              })()}
              {!sidebarCollapsed && (
                <div className="ml-3 text-left">
                  <p className={theme === 'soft-modern' ? "text-xs font-bold text-primary" : "text-xs font-bold text-gray-900 dark:text-white"}>
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  {isSuperAdmin && !isImpersonating && (
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Super Admin</p>
                  )}
                </div>
              )}
            </div>
            {!sidebarCollapsed && isSuperAdmin && !isImpersonating && (
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[2.5px]" />
            )}
          </button>

          <div className={`mt-2 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-3'}`}>
            {!sidebarCollapsed && <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Theme</span>}
            <button
              onClick={toggleTheme}
              className={theme === 'soft-modern' ? "p-1.5 rounded-lg transition-all btn-ghost" : "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"}
              title={sidebarCollapsed ? 'Toggle theme' : undefined}
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
            <NotificationBell />
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
        <Outlet />
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
                  {(() => {
                    const mobileAvatar = teamMembers.find((m: any) => m.id === user?.id)?.avatar_url;
                    return mobileAvatar ? (
                      <img src={mobileAvatar} alt="" className="w-10 h-10 rounded-full object-cover mr-3" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                        {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    {isSuperAdmin && (
                      <p className="text-sm text-purple-600 dark:text-purple-400">Super Admin</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CoPilot Panel - slides in from side */}
      <CoPilotPanel />

      {/* CoPilot Button - fixed on right side when panel is closed */}
      <CoPilotButton />

      {/* Subtle CoPilot Introduction */}
      <CoPilotIntro />
    </div>
  );
};
