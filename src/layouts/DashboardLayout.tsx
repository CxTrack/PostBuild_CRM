import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';
import { useOrganizationStore } from '../stores/organizationStore';
import { useAuthContext } from '../contexts/AuthContext';
import { useChatUnreadCount } from '../hooks/useChatUnreadCount';
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
  Mail,
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

import { supabase, supabaseUrl } from '../lib/supabase';
import { getAuthToken } from '../utils/auth.utils';

import { useCoPilot } from '../contexts/CoPilotContext';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useVisibleModules } from '../hooks/useVisibleModules';
import { usePipelineConfigStore } from '../stores/pipelineConfigStore';
import { BroadcastBanner } from '../components/BroadcastBanner';
import { CoPilotIntro } from '../components/tour/SubtleHints';
import CoPilotPanel from '../components/copilot/CoPilotPanel';
import CoPilotButton from '../components/copilot/CoPilotButton';
import { useImpersonationStore } from '../stores/impersonationStore';
import { useEffectiveUser } from '../hooks/useEffectiveUser';
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
  email: Mail,
};

const MODULE_TOUR_IDS: Record<string, string> = {
  crm: 'customers',
  calendar: 'calendar',
  pipeline: 'pipeline',
};

const HOME_ITEM: NavItem = { path: '/dashboard', icon: LayoutGrid, label: 'Home' };
const SETTINGS_ITEM: NavItem = { path: '/dashboard/settings', icon: Settings, label: 'Settings' };
const CHAT_ITEM: NavItem = { path: '/dashboard/chat', icon: MessageCircle, label: 'Chat' };
const COPILOT_ITEM: NavItem = { path: '/dashboard/copilot', icon: Sparkles, label: 'CoPilot' };

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
        to={item.path}
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
  const { currentOrganization, teamMembers, allOrgsDeactivated } = useOrganizationStore();
  const { fetchPipelineStages } = usePipelineConfigStore();
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuthContext();
  const { isOpen: isCoPilotOpen, panelSide } = useCoPilot();
  const { totalUnread: chatUnreadCount } = useChatUnreadCount();
  const { loadPreferences, saveSidebarOrder } = usePreferencesStore();
  const { isImpersonating, restoreFromSession } = useImpersonationStore();
  const effectiveUser = useEffectiveUser();

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

  // Auto-connect email when user logged in via OAuth (Microsoft or Google)
  useEffect(() => {
    const autoConnectEmail = async () => {
      if (!currentOrganization?.id) return;

      // Check for Microsoft provider tokens
      const msStored = sessionStorage.getItem('microsoft_provider_tokens');
      // Check for Google provider tokens
      const googleStored = sessionStorage.getItem('google_provider_tokens');

      if (!msStored && !googleStored) return;

      // Signal to DashboardPage that auto-connect is in progress
      // (prevents "Reconnect" flash before fresh tokens are stored in Vault)
      (window as any).__cxtrack_auto_connect_pending = true;

      // Remove immediately to prevent double-fire
      if (msStored) sessionStorage.removeItem('microsoft_provider_tokens');
      if (googleStored) sessionStorage.removeItem('google_provider_tokens');

      try {
        const token = await getAuthToken();
        if (!token) return;

        // Determine which provider to auto-connect
        const stored = msStored || googleStored;
        const provider = msStored ? 'microsoft' : 'google';
        const { provider_token, provider_refresh_token, timestamp } = JSON.parse(stored!);

        // Expire after 5 minutes (tokens may be stale)
        if (Date.now() - timestamp > 5 * 60 * 1000) return;

        const res = await fetch(`${supabaseUrl}/functions/v1/auto-connect-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            provider_token,
            provider_refresh_token,
            organization_id: currentOrganization.id,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const providerLabel = provider === 'microsoft' ? 'Outlook' : 'Gmail';
          console.log(`[AutoConnect] ${providerLabel} email connected:`, data.email_address);
          if (data.email_address) {
            const { default: toast } = await import('react-hot-toast');
            toast.success(`Your ${providerLabel} email (${data.email_address}) is connected and ready to send from CxTrack.`, { duration: 5000 });
          }

          // Trigger immediate email sync after connection is established
          try {
            const syncRes = await fetch(`${supabaseUrl}/functions/v1/sync-inbox-emails`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({}),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              console.log(`[AutoConnect] Immediate sync after connect:`, syncData);
              localStorage.setItem('cxtrack_last_email_sync', Date.now().toString());
            }
          } catch {
            // Non-fatal: background sync will catch up
          }

          // Dispatch event so DashboardPage re-fetches calendar events
          (window as any).__cxtrack_auto_connect_pending = false;
          window.dispatchEvent(new CustomEvent('cxtrack:email-connected', { detail: { provider } }));
        } else {
          (window as any).__cxtrack_auto_connect_pending = false;
          console.warn('[AutoConnect] Failed:', await res.text());
        }
      } catch (err) {
        (window as any).__cxtrack_auto_connect_pending = false;
        console.warn('[AutoConnect] Error:', err);
      }
    };

    autoConnectEmail();
  }, [currentOrganization?.id]);

  // Background inbox sync - always syncs on login, then every 15 minutes
  useEffect(() => {
    if (!currentOrganization?.id) return;

    const syncInbox = async (isInitial: boolean) => {
      // On initial mount (login), always sync regardless of throttle.
      // On subsequent intervals, respect the 15-minute throttle.
      if (!isInitial) {
        const lastSync = localStorage.getItem('cxtrack_last_email_sync');
        const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
        if (lastSync && parseInt(lastSync) > fifteenMinAgo) return;
      }

      try {
        const token = await getAuthToken();
        if (!token) return;

        const res = await fetch(`${supabaseUrl}/functions/v1/sync-inbox-emails`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (res.ok) {
          const data = await res.json();
          console.log('[InboxSync] response:', data);
          localStorage.setItem('cxtrack_last_email_sync', Date.now().toString());
          if (data.synced > 0) {
            console.log(`[InboxSync] ${data.synced} new emails synced`);
          }
        }
      } catch {
        // Silent background sync
      }
    };

    // Run initial sync after short delay to not block render, but always force it
    const initialTimer = setTimeout(() => syncInbox(true), 3000);

    // Set up recurring sync every 15 minutes
    const intervalTimer = setInterval(() => syncInbox(false), 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [currentOrganization?.id]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        return;
      }

      // DB is source of truth for admin status
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
  }, [user]);

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

  // Account Deactivated Screen - blocks access when all orgs are deactivated
  if (allOrgsDeactivated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Account Deactivated</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            Your organization's account has been deactivated. Your data has been preserved.
            If you believe this is an error, please contact our support team.
          </p>
          <a
            href="mailto:support@cxtrack.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors mb-4"
          >
            Contact support@cxtrack.com
          </a>
          <div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/auth');
              }}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${isCoPilotOpen && panelSide === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'} bg-gray-50 dark:bg-gray-900 ${isImpersonating ? 'pt-10' : ''}`}>
      <ImpersonationBanner />
      <BroadcastBanner />
      {/* Desktop Sidebar - Hidden on Mobile */}
      <aside
        className={`hidden md:flex md:flex-col ${sidebarCollapsed ? 'md:w-[68px]' : 'md:w-64'} transition-all duration-300 ${theme === 'soft-modern'
          ? `bg-white ${isCoPilotOpen && panelSide === 'left' ? 'border-l' : 'border-r'} border-gray-200/60`
          : `bg-white dark:bg-gray-800 ${isCoPilotOpen && panelSide === 'left' ? 'border-l' : 'border-r'} border-gray-200 dark:border-gray-700`
          }`}
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

          {/* Settings - pinned after modules */}
          <Link
            to={SETTINGS_ITEM.path}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 ${isActive(SETTINGS_ITEM.path) ? 'active' : ''}`
                : `flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'} rounded-lg transition-colors ${isActive(SETTINGS_ITEM.path)
                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
            title={sidebarCollapsed ? SETTINGS_ITEM.label : undefined}
          >
            <SETTINGS_ITEM.icon size={20} className={sidebarCollapsed ? '' : 'mr-3'} />
            {!sidebarCollapsed && <span className="font-medium">{SETTINGS_ITEM.label}</span>}
          </Link>

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
            title={sidebarCollapsed ? `Messages${chatUnreadCount > 0 ? ` (${chatUnreadCount} unread)` : ''}` : undefined}
          >
            <div className="flex items-center relative">
              <MessageCircle size={20} className={sidebarCollapsed ? '' : 'mr-3'} />
              {sidebarCollapsed && chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
              )}
              {!sidebarCollapsed && <span className="font-medium">Messages</span>}
            </div>
            {!sidebarCollapsed && chatUnreadCount > 0 && (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-semibold rounded-full bg-blue-500 text-white">
                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
              </span>
            )}
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

          {/* CoPilot Link */}
          <Link
            to={COPILOT_ITEM.path}
            className={
              theme === 'soft-modern'
                ? `nav-item flex items-center px-4 py-3 mt-1 ${isActive(COPILOT_ITEM.path) ? 'active' : ''}`
                : `flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'} mt-1 rounded-lg transition-colors ${isActive(COPILOT_ITEM.path)
                  ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
            }
            title={sidebarCollapsed ? 'CoPilot' : undefined}
          >
            <Sparkles size={20} className={sidebarCollapsed ? '' : 'mr-3'} />
            {!sidebarCollapsed && <span className="font-medium">CoPilot</span>}
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
            title={sidebarCollapsed ? effectiveUser.fullName : undefined}
          >
            <div className="flex items-center">
              {(() => {
                const currentUserAvatar = effectiveUser.isImpersonated
                  ? effectiveUser.avatarUrl
                  : teamMembers.find((m: any) => m.id === user?.id)?.avatar_url;
                const initial = (effectiveUser.fullName || 'U')[0].toUpperCase();
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
                    {effectiveUser.fullName}
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
                    const mobileAvatar = effectiveUser.isImpersonated
                      ? effectiveUser.avatarUrl
                      : teamMembers.find((m: any) => m.id === user?.id)?.avatar_url;
                    return mobileAvatar ? (
                      <img src={mobileAvatar} alt="" className="w-10 h-10 rounded-full object-cover mr-3" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                        {(effectiveUser.fullName || 'U')[0].toUpperCase()}
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {effectiveUser.fullName}
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

      {/* CoPilot Panel + Button + Intro -- hidden on full-page CoPilot route */}
      {location.pathname !== '/dashboard/copilot' && (
        <>
          <CoPilotPanel />
          <CoPilotButton />
          <CoPilotIntro />
        </>
      )}
    </div>
  );
};
