import { useState, useEffect, useCallback } from 'react';
import {
  Users, CreditCard, BarChart2, MessageSquare,
  Settings, Shield, LayoutDashboard,
  ArrowLeft, Send, DollarSign, Phone,
  Brain, TrendingUp, Activity, Layers,
  RefreshCw, Menu, X, ChevronDown,
  FileBarChart, Plug
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAdminStore } from '../../stores/adminStore';

// Existing production-ready tabs
import { UsersTab } from './UsersTab';
import { BillingTab } from './BillingTab';
import { SupportTab } from './SupportTab';
import { PlansTab } from './PlansTab';

// New/rebuilt tabs
import { CommandCenterTab } from './CommandCenterTab';
import { AIAnalyticsTab } from './AIAnalyticsTab';
import { VoiceAnalyticsTab } from './VoiceAnalyticsTab';
import { FinancialAnalyticsTab } from './FinancialAnalyticsTab';
import { ModuleUsageTab } from './ModuleUsageTab';
import { APIMonitoringTab } from './APIMonitoringTab';
import { AuditLogsTab } from './AuditLogsTab';
import { SettingsTab } from './SettingsTab';
import { BroadcastPanel } from '../../components/admin/BroadcastPanel';
import { ReportingEngine } from '../../components/admin/ReportingEngine';
import { MCPConnectionPanel } from '../../components/admin/MCPConnectionPanel';

interface TabItem {
  id: string;
  label: string;
  icon: any;
  component: React.ComponentType<any>;
}

interface TabGroup {
  label: string;
  tabs: TabItem[];
}

const TAB_GROUPS: TabGroup[] = [
  {
    label: 'Overview',
    tabs: [
      { id: 'command-center', label: 'Command Center', icon: LayoutDashboard, component: CommandCenterTab },
    ],
  },
  {
    label: 'Analytics',
    tabs: [
      { id: 'users', label: 'Users & Orgs', icon: Users, component: UsersTab },
      { id: 'modules', label: 'Module Usage', icon: Layers, component: ModuleUsageTab },
      { id: 'ai', label: 'AI & LLM', icon: Brain, component: AIAnalyticsTab },
      { id: 'voice', label: 'Voice & Calls', icon: Phone, component: VoiceAnalyticsTab },
      { id: 'financial', label: 'Financial', icon: TrendingUp, component: FinancialAnalyticsTab },
    ],
  },
  {
    label: 'Operations',
    tabs: [
      { id: 'billing', label: 'Billing & Revenue', icon: CreditCard, component: BillingTab },
      { id: 'plans', label: 'Subscription Plans', icon: DollarSign, component: PlansTab },
      { id: 'support', label: 'Support Tickets', icon: MessageSquare, component: SupportTab },
      { id: 'reports', label: 'Reports', icon: FileBarChart, component: ReportingEngine },
    ],
  },
  {
    label: 'System',
    tabs: [
      { id: 'api-monitoring', label: 'API Monitoring', icon: Activity, component: APIMonitoringTab },
      { id: 'audit', label: 'Audit Logs', icon: Shield, component: AuditLogsTab },
      { id: 'broadcasts', label: 'Broadcasts', icon: Send, component: BroadcastPanel },
      { id: 'mcp', label: 'MCP / AI Ops', icon: Plug, component: MCPConnectionPanel },
      { id: 'settings', label: 'Settings', icon: Settings, component: SettingsTab },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('command-center');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthContext();
  const { lastRefreshed, fetchAll } = useAdminStore();

  // Load initial data
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRefresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  const activeTabData = ALL_TABS.find((t) => t.id === activeTab);
  const ActiveComponent = activeTabData?.component || CommandCenterTab;
  const adminName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const adminEmail = user?.email || '';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-purple-600/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              Admin
            </h1>
            <p className="text-[10px] text-gray-500 font-semibold tracking-widest uppercase">Command Center</p>
          </div>
        </div>

        {/* Back to CRM */}
        <div className="px-3 pt-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to CRM
          </Link>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {TAB_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {group.label}
              </p>
              {group.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <tab.icon
                    className={`w-4 h-4 ${
                      activeTab === tab.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
                    }`}
                  />
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Admin Profile */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {adminName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{adminName}</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
                Super Admin
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-purple-600">Admin</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to CRM
              </Link>
              {TAB_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {group.label}
                  </p>
                  {group.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-purple-600' : 'text-gray-400'}`} />
                      {tab.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 py-3 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                {activeTabData && <activeTabData.icon className="w-5 h-5 text-gray-400 hidden sm:block" />}
                {activeTabData?.label || 'Command Center'}
              </h2>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {/* Last refreshed + refresh button */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Refresh all data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {lastRefreshed
                    ? `Updated ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Refresh'}
                </span>
              </button>
              {/* Admin info - desktop only */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm text-right">
                  <p className="font-medium text-gray-900 dark:text-white">{adminName}</p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Super Admin</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 border-2 border-white dark:border-gray-800 shadow-sm flex items-center justify-center text-white text-xs font-bold">
                  {adminName[0].toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-4 md:p-6 lg:p-8 w-full">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
};
