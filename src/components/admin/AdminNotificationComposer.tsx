import { useState, useEffect, useCallback } from 'react';
import {
  Send, Users, Building2, Crown, User, Search,
  Megaphone, CreditCard, Info, Shield, Settings, Zap, Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
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

interface OrgOption { id: string; name: string }
interface UserOption { id: string; full_name: string; email: string }

const TARGET_TYPES = [
  { id: 'all_users', label: 'All Users', icon: Users, description: 'Every user on the platform' },
  { id: 'organization', label: 'Organization', icon: Building2, description: 'All members of a specific org' },
  { id: 'org_owners', label: 'Org Owners', icon: Crown, description: 'Only org owners (all or specific)' },
  { id: 'individual', label: 'Individual', icon: User, description: 'A specific user' },
] as const;

const NOTIFICATION_TYPES = [
  { id: 'admin_message', label: 'Admin Message', icon: Megaphone },
  { id: 'billing_alert', label: 'Billing Alert', icon: CreditCard },
  { id: 'system_update', label: 'System Update', icon: Info },
  { id: 'security_alert', label: 'Security Alert', icon: Shield },
  { id: 'maintenance', label: 'Maintenance', icon: Settings },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  { id: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
];

const EXPIRY_OPTIONS = [
  { value: '', label: 'No Expiry' },
  { value: '1', label: '1 hour' },
  { value: '6', label: '6 hours' },
  { value: '24', label: '24 hours' },
  { value: '72', label: '3 days' },
  { value: '168', label: '1 week' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  admin_message: <Megaphone className="w-4 h-4 text-purple-500" />,
  billing_alert: <CreditCard className="w-4 h-4 text-red-500" />,
  system_update: <Info className="w-4 h-4 text-blue-500" />,
  security_alert: <Shield className="w-4 h-4 text-red-500" />,
  maintenance: <Settings className="w-4 h-4 text-gray-500" />,
};

export const AdminNotificationComposer = () => {
  const { sendTargetedNotification } = useAdminStore();

  const [targetType, setTargetType] = useState<string>('all_users');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('admin_message');
  const [priority, setPriority] = useState('normal');
  const [expiresIn, setExpiresIn] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [sending, setSending] = useState(false);

  // Org search
  const [orgQuery, setOrgQuery] = useState('');
  const [orgResults, setOrgResults] = useState<OrgOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
  const [orgSearching, setOrgSearching] = useState(false);

  // User search
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [userSearching, setUserSearching] = useState(false);

  // Org search with debounce
  useEffect(() => {
    if (!orgQuery.trim() || orgQuery.length < 2) { setOrgResults([]); return; }
    const timer = setTimeout(async () => {
      setOrgSearching(true);
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/organizations?select=id,name&name=ilike.*${encodeURIComponent(orgQuery)}*&order=name.asc&limit=20`,
          { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` } }
        );
        if (res.ok) setOrgResults(await res.json());
      } catch { /* silent */ }
      setOrgSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [orgQuery]);

  // User search with debounce
  useEffect(() => {
    if (!userQuery.trim() || userQuery.length < 2) { setUserResults([]); return; }
    const timer = setTimeout(async () => {
      setUserSearching(true);
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/user_profiles?select=id,full_name,email&or=(full_name.ilike.*${encodeURIComponent(userQuery)}*,email.ilike.*${encodeURIComponent(userQuery)}*)&limit=20`,
          { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` } }
        );
        if (res.ok) setUserResults(await res.json());
      } catch { /* silent */ }
      setUserSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery]);

  const handleSend = useCallback(async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    if (targetType === 'organization' && !selectedOrg) {
      toast.error('Please select an organization');
      return;
    }
    if (targetType === 'individual' && !selectedUser) {
      toast.error('Please select a user');
      return;
    }

    setSending(true);
    try {
      let expiresAt: string | undefined;
      if (expiresIn) {
        const d = new Date();
        d.setHours(d.getHours() + parseInt(expiresIn));
        expiresAt = d.toISOString();
      }

      const result = await sendTargetedNotification({
        targetType: targetType as any,
        title,
        message,
        type: notificationType,
        organizationId: (targetType === 'organization' || targetType === 'org_owners') ? selectedOrg?.id : undefined,
        userIds: targetType === 'individual' && selectedUser ? [selectedUser.id] : undefined,
        priority,
        expiresAt,
        actionUrl: actionUrl.trim() || undefined,
      });

      const sentCount = result?.sent ?? 0;
      toast.success(`Notification sent to ${sentCount} user${sentCount !== 1 ? 's' : ''}`);
      setTitle('');
      setMessage('');
      setActionUrl('');
      setPriority('normal');
      setExpiresIn('');
      setNotificationType('admin_message');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  }, [targetType, title, message, notificationType, priority, expiresIn, actionUrl, selectedOrg, selectedUser, sendTargetedNotification]);

  const previewBorder = priority === 'urgent' ? 'border-l-2 border-l-red-500' : priority === 'high' ? 'border-l-2 border-l-orange-500' : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Left: Compose form */}
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Send Notification</h3>
            <p className="text-xs text-gray-500">Deliver to user notification bell</p>
          </div>
        </div>

        {/* Target type */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Audience</label>
          <div className="grid grid-cols-2 gap-2">
            {TARGET_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setTargetType(t.id);
                  setSelectedOrg(null);
                  setSelectedUser(null);
                  setOrgQuery('');
                  setUserQuery('');
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                  targetType === t.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Org search (for organization / org_owners) */}
        {(targetType === 'organization' || targetType === 'org_owners') && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              {targetType === 'org_owners' ? 'Organization (optional for org owners)' : 'Organization'}
            </label>
            {selectedOrg ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700 dark:text-blue-300 font-medium flex-1">{selectedOrg.name}</span>
                <button onClick={() => { setSelectedOrg(null); setOrgQuery(''); }}
                  className="text-xs text-blue-500 hover:underline">Change</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={orgQuery}
                  onChange={(e) => setOrgQuery(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {orgResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {orgResults.map(o => (
                      <button key={o.id} onClick={() => { setSelectedOrg(o); setOrgQuery(''); setOrgResults([]); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white">
                        {o.name}
                      </button>
                    ))}
                  </div>
                )}
                {orgSearching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
              </div>
            )}
          </div>
        )}

        {/* User search (for individual) */}
        {targetType === 'individual' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">User</label>
            {selectedUser ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <User className="w-4 h-4 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{selectedUser.full_name || 'Unknown'}</span>
                  <span className="text-xs text-blue-500 ml-2">{selectedUser.email}</span>
                </div>
                <button onClick={() => { setSelectedUser(null); setUserQuery(''); }}
                  className="text-xs text-blue-500 hover:underline">Change</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {userResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {userResults.map(u => (
                      <button key={u.id} onClick={() => { setSelectedUser(u); setUserQuery(''); setUserResults([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <p className="text-sm text-gray-900 dark:text-white">{u.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {userSearching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title..."
          className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
        />

        {/* Message */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your message..."
          rows={3}
          className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none resize-none focus:ring-2 focus:ring-blue-500/50"
        />

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          <select value={notificationType} onChange={(e) => setNotificationType(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border-0">
            {NOTIFICATION_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border-0">
            {EXPIRY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Priority</label>
          <div className="flex items-center gap-2">
            {PRIORITIES.map(p => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${p.color} ${
                  priority === p.id ? 'ring-2 ring-offset-1 ring-blue-400 dark:ring-offset-gray-800' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action URL */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Link to Page (optional)</label>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">
            When clicked, the notification will navigate the user to this CRM page.
          </p>
          <input
            type="text"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            placeholder="/dashboard/billing or /dashboard/settings"
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Send button */}
        <button onClick={handleSend} disabled={sending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send Notification'}
        </button>
      </div>

      {/* Right: Live preview */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Live Preview</h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Mock bell header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifications</span>
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">1</span>
              </div>
            </div>
            {/* Preview notification */}
            <div className={`flex items-start gap-3 px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 ${previewBorder}`}>
              <div className="mt-0.5 shrink-0">
                {ICON_MAP[notificationType] || <Bell className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {title || 'Notification title'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {message || 'Your message will appear here...'}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">Just now</p>
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0" />
            </div>
          </div>

          {/* Target summary */}
          <div className="mt-4 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">Target: </span>
              {targetType === 'all_users' && 'All platform users'}
              {targetType === 'organization' && (selectedOrg ? `All members of ${selectedOrg.name}` : 'Select an organization')}
              {targetType === 'org_owners' && (selectedOrg ? `Owners of ${selectedOrg.name}` : 'All organization owners')}
              {targetType === 'individual' && (selectedUser ? `${selectedUser.full_name || selectedUser.email}` : 'Select a user')}
            </p>
            {actionUrl && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">Links to: </span>
                <span className="text-blue-500">{actionUrl}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
