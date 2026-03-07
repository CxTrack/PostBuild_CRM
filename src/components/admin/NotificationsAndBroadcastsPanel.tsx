import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Send, Clock, Search, RefreshCw,
  Megaphone, CreditCard, Info, Shield, Settings, Zap,
  MessageSquare, ChevronDown,
} from 'lucide-react';
import { AdminNotificationComposer } from './AdminNotificationComposer';
import { BroadcastPanel } from './BroadcastPanel';
import { useAdminStore } from '@/stores/adminStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* ignore */ }
    }
  }
  return null;
};

interface HistoryEntry {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  source: string;
  created_at: string;
  expires_at: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  is_read: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  admin_message: <Megaphone className="w-3.5 h-3.5 text-purple-500" />,
  admin_notification: <Megaphone className="w-3.5 h-3.5 text-purple-500" />,
  billing_alert: <CreditCard className="w-3.5 h-3.5 text-red-500" />,
  system_update: <Info className="w-3.5 h-3.5 text-blue-500" />,
  security_alert: <Shield className="w-3.5 h-3.5 text-red-500" />,
  maintenance: <Settings className="w-3.5 h-3.5 text-gray-500" />,
  token_warning: <Zap className="w-3.5 h-3.5 text-amber-500" />,
  token_exhausted: <Zap className="w-3.5 h-3.5 text-red-500" />,
  token_exhausted_owner: <Zap className="w-3.5 h-3.5 text-red-500" />,
  sms_opt_out: <MessageSquare className="w-3.5 h-3.5 text-red-500" />,
  sms_reopt_confirmed: <RefreshCw className="w-3.5 h-3.5 text-green-500" />,
  sms_reopt_request: <RefreshCw className="w-3.5 h-3.5 text-amber-500" />,
};

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const SOURCE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  system: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  trigger: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
};

const SUB_TABS = [
  { id: 'send', label: 'Send Notification', icon: Send },
  { id: 'banners', label: 'Banners', icon: Megaphone },
  { id: 'history', label: 'History', icon: Clock },
] as const;

type SubTab = typeof SUB_TABS[number]['id'];

export const NotificationsAndBroadcastsPanel = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('send');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { fetchNotificationHistory } = useAdminStore();

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchNotificationHistory(
        100,
        0,
        sourceFilter !== 'all' ? sourceFilter : undefined,
        typeFilter !== 'all' ? typeFilter : undefined,
      );
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  }, [fetchNotificationHistory, sourceFilter, typeFilter]);

  useEffect(() => {
    if (activeSubTab === 'history') {
      loadHistory();
    }
  }, [activeSubTab, loadHistory]);

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  };

  const filteredHistory = history.filter(h => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        h.title.toLowerCase().includes(q) ||
        h.message.toLowerCase().includes(q) ||
        (h.recipient_name || '').toLowerCase().includes(q) ||
        (h.recipient_email || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeSubTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeSubTab === 'send' && <AdminNotificationComposer />}
      {activeSubTab === 'banners' && <BroadcastPanel />}
      {activeSubTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* History header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border-0 outline-none"
              >
                <option value="all">All Sources</option>
                <option value="admin">Admin</option>
                <option value="system">System</option>
                <option value="trigger">Trigger</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border-0 outline-none"
              >
                <option value="all">All Types</option>
                <option value="admin_message">Admin Message</option>
                <option value="billing_alert">Billing Alert</option>
                <option value="system_update">System Update</option>
                <option value="security_alert">Security Alert</option>
                <option value="maintenance">Maintenance</option>
                <option value="token_warning">Token Warning</option>
                <option value="token_exhausted">Token Exhausted</option>
              </select>
              <button
                onClick={loadHistory}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* History table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notification</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Recipient</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Source</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {loadingHistory && filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-gray-300" />
                      <p className="text-sm text-gray-400">Loading history...</p>
                    </td>
                  </tr>
                )}

                {filteredHistory.map((entry) => (
                  <tr
                    key={entry.notification_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {/* Notification */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {TYPE_ICONS[entry.type] || <Bell className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[260px]">
                            {entry.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1 mt-0.5">
                            {entry.message}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Recipient */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                          {entry.recipient_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">
                          {entry.recipient_email || ''}
                        </p>
                      </div>
                    </td>
                    {/* Source */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${SOURCE_BADGE[entry.source] || SOURCE_BADGE.system}`}>
                        {entry.source}
                      </span>
                    </td>
                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${PRIORITY_BADGE[entry.priority] || PRIORITY_BADGE.normal}`}>
                        {entry.priority}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        entry.is_read
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${entry.is_read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-blue-500'}`} />
                        {entry.is_read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    {/* Sent */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {getTimeAgo(entry.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}

                {!loadingHistory && filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600 opacity-50" />
                      <p className="text-sm text-gray-400">No notifications found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Count footer */}
          {filteredHistory.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {filteredHistory.length} notification{filteredHistory.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
