import { useEffect, useState, useRef } from 'react';
import {
  Shield, Users, Server, Key, Copy, Check,
  ExternalLink, RefreshCw, Zap, UserPlus, X, ShieldOff, Search, AlertTriangle, ArrowRight
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { useAuthContext } from '../../contexts/AuthContext';
import { FeatureFlagsPanel } from '../../components/admin/FeatureFlagsPanel';
import { logAdminAction } from '../../utils/adminAudit';
import toast from 'react-hot-toast';

const PROJECT_REF = 'zkpfzrbbupgiqkzqydji';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const TOKEN_TIERS = [
  { tier: 'Free', monthly: '50,000', color: 'gray' },
  { tier: 'Business', monthly: '500,000', color: 'blue' },
  { tier: 'Elite', monthly: '1,000,000', color: 'purple' },
  { tier: 'Enterprise', monthly: '1,000,000', color: 'orange' },
];

const SMS_TIERS = [
  { tier: 'Free', inbound: '10', outbound: '10', color: 'gray' },
  { tier: 'Business', inbound: '100', outbound: '100', color: 'blue' },
  { tier: 'Elite', inbound: '500', outbound: '500', color: 'purple' },
  { tier: 'Enterprise', inbound: 'Unlimited', outbound: 'Unlimited', color: 'orange' },
];

export const SettingsTab = () => {
  const { user } = useAuthContext();
  const { adminUsers, loading, fetchAdminUsers, setAdminStatus, searchUsersForAdmin } = useAdminStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ user_id: string; email: string; full_name: string; is_admin: boolean; admin_access_level: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsersForAdmin(value);
      setSearchResults(results);
      setSearching(false);
    }, 300);
  };

  const handleGrantAdmin = async (userId: string, email: string) => {
    setActionLoading(userId);
    const result = await setAdminStatus(userId, true, 'full');
    if (result.success) {
      toast.success(`Admin access granted to ${email}`);
      logAdminAction({
        action: 'admin_grant',
        category: 'user_management',
        target_type: 'user',
        target_id: userId,
        details: { email, access_level: 'full' },
      });
      setSearchQuery('');
      setSearchResults([]);
      setShowAddAdmin(false);
    } else {
      toast.error(result.error || 'Failed to grant admin access');
    }
    setActionLoading(null);
  };

  const handleRevokeAdmin = async (userId: string, email: string) => {
    if (userId === user?.id) {
      toast.error('You cannot revoke your own admin access');
      return;
    }
    setActionLoading(userId);
    const result = await setAdminStatus(userId, false);
    if (result.success) {
      toast.success(`Admin access revoked from ${email}`);
      logAdminAction({
        action: 'admin_revoke',
        category: 'user_management',
        target_type: 'user',
        target_id: userId,
        details: { email },
      });
      setRevokeConfirm(null);
    } else {
      toast.error(result.error || 'Failed to revoke admin access');
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Admin Users - Full Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            Admin Users
          </h3>
          <button
            onClick={() => setShowAddAdmin(!showAddAdmin)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            {showAddAdmin ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            {showAddAdmin ? 'Cancel' : 'Add Admin'}
          </button>
        </div>

        {/* Add Admin Search */}
        {showAddAdmin && (
          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-700 dark:text-purple-300 mb-2 font-medium">
              Search for a user by name or email to grant admin access
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type email or name..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                autoFocus
              />
              {searching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {searchResults.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{u.full_name || u.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                    </div>
                    {u.is_admin ? (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Already Admin
                      </span>
                    ) : (
                      <button
                        onClick={() => handleGrantAdmin(u.user_id, u.email)}
                        disabled={actionLoading === u.user_id}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === u.user_id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Shield className="w-3 h-3" />
                        )}
                        Grant Admin
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center py-2">No users found matching "{searchQuery}"</p>
            )}
          </div>
        )}

        {/* Current Admins List */}
        <div className="space-y-2">
          {loading.adminUsers ? (
            <div className="h-20 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          ) : adminUsers.length > 0 ? (
            adminUsers.map((admin: any) => (
              <div key={admin.user_id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {(admin.full_name?.[0] || admin.email?.[0] || 'A').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {admin.full_name || admin.email}
                      {admin.user_id === user?.id && (
                        <span className="ml-1.5 text-[10px] text-purple-500 font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {admin.email} · {admin.admin_access_level || 'full'} access{admin.created_at ? ` · Since ${new Date(admin.created_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    admin.admin_access_level === 'full'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {admin.admin_access_level === 'full' ? 'Super Admin' : admin.admin_access_level || 'Admin'}
                  </span>
                  {admin.user_id !== user?.id && (
                    revokeConfirm === admin.user_id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRevokeAdmin(admin.user_id, admin.email)}
                          disabled={actionLoading === admin.user_id}
                          className="px-2 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading === admin.user_id ? 'Revoking...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setRevokeConfirm(null)}
                          className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRevokeConfirm(admin.user_id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Revoke admin access"
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No admin users configured</p>
          )}
        </div>

        <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Admin access grants full platform control including user management, billing, and data access. Only grant to trusted team members.
          </p>
        </div>
      </div>

      {/* Project Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          Project Configuration
        </h3>
        <div className="space-y-2">
          <ConfigRow
            label="Project Ref"
            value={PROJECT_REF}
            copied={copiedField === 'ref'}
            onCopy={() => copyToClipboard(PROJECT_REF, 'ref')}
          />
          <ConfigRow
            label="Supabase URL"
            value={SUPABASE_URL}
            copied={copiedField === 'url'}
            onCopy={() => copyToClipboard(SUPABASE_URL, 'url')}
          />
          <ConfigRow
            label="Dashboard"
            value={`https://supabase.com/dashboard/project/${PROJECT_REF}`}
            copied={copiedField === 'dashboard'}
            onCopy={() => copyToClipboard(`https://supabase.com/dashboard/project/${PROJECT_REF}`, 'dashboard')}
            isLink
          />
          <ConfigRow
            label="Edge Functions URL"
            value={`${SUPABASE_URL}/functions/v1`}
            copied={copiedField === 'fn-url'}
            onCopy={() => copyToClipboard(`${SUPABASE_URL}/functions/v1`, 'fn-url')}
          />
        </div>
      </div>

      {/* Security Info Link */}
      <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200">Edge Functions, API Secrets, and RLS coverage</p>
              <p className="text-xs text-purple-600 dark:text-purple-400">These are now in the Security & Health tab for centralized monitoring</p>
            </div>
          </div>
          <button
            onClick={() => useAdminStore.getState().setActiveTab('security')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            Go to Security <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Token Allocation by Tier */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-green-600" />
          AI Token Allocation by Tier
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TOKEN_TIERS.map((t) => (
            <div key={t.tier} className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t.tier}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{t.monthly}</p>
              <p className="text-[10px] text-gray-400">tokens/month</p>
            </div>
          ))}
        </div>
      </div>

      {/* SMS Limits by Tier */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-600" />
          SMS Limits by Tier (Monthly)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SMS_TIERS.map((t) => (
            <div key={t.tier} className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t.tier}</p>
              <div className="space-y-1">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{t.inbound}</p>
                  <p className="text-[10px] text-gray-400">inbound/mo</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{t.outbound}</p>
                  <p className="text-[10px] text-gray-400">outbound/mo</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Enforced in send-sms (outbound) and receive-sms (inbound) edge functions. Quota resets on the 1st of each month.</p>
      </div>

      {/* Feature Flags */}
      <FeatureFlagsPanel />
    </div>
  );
};

const ConfigRow = ({ label, value, copied, onCopy, isLink }: {
  label: string; value: string; copied: boolean; onCopy: () => void; isLink?: boolean;
}) => (
  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{value}</p>
    </div>
    <div className="flex items-center gap-1 ml-2">
      {isLink && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
        >
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </a>
      )}
      <button onClick={onCopy} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
      </button>
    </div>
  </div>
);
