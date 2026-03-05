import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Building2, TrendingUp, UserCheck, Loader2, X, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAdminStore } from '../../stores/adminStore';
import { useImpersonationStore } from '../../stores/impersonationStore';

// Direct fetch helper (AbortController workaround)
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const INDUSTRY_COLORS: Record<string, string> = {
  tax_accounting: '#8b5cf6',
  distribution_logistics: '#3b82f6',
  gyms_fitness: '#10b981',
  contractors_home_services: '#f59e0b',
  healthcare: '#ef4444',
  real_estate: '#ec4899',
  legal_services: '#6366f1',
  general_business: '#64748b',
  agency: '#14b8a6',
  mortgage_broker: '#f97316',
  construction: '#84cc16',
};

const INDUSTRY_LABELS: Record<string, string> = {
  tax_accounting: 'Tax & Accounting',
  distribution_logistics: 'Distribution',
  gyms_fitness: 'Gyms & Fitness',
  contractors_home_services: 'Contractors',
  healthcare: 'Healthcare',
  real_estate: 'Real Estate',
  legal_services: 'Legal',
  general_business: 'General',
  agency: 'Agency',
  mortgage_broker: 'Mortgage',
  construction: 'Construction',
};

const TIER_COLORS: Record<string, string> = {
  free: '#64748b',
  business: '#3b82f6',
  elite: '#8b5cf6',
  enterprise: '#f59e0b',
};

export const UsersTab = () => {
  const { kpis, userGrowth, orgBreakdown, loading, fetchUserGrowth, fetchOrgBreakdown, setSelectedOrg } = useAdminStore();
  const { startImpersonation, loading: impersonationLoading } = useImpersonationStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmUser, setConfirmUser] = useState<any | null>(null);

  useEffect(() => {
    fetchUserGrowth();
    fetchOrgBreakdown();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/admin_get_user_list`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ p_limit: 100 }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        // Map RPC response to expected shape for UI compatibility
        const mapped = (Array.isArray(data) ? data : []).map((u: any) => ({
          ...u,
          id: u.user_id,
          organization_id: u.organization_id,
          organizations: u.org_name ? { name: u.org_name, plan: u.plan } : null,
          org_deactivated_at: u.org_deactivated_at || null,
          last_seen_at: u.last_sign_in_at,
          is_active: u.status === 'active',
        }));
        setUsers(mapped);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return user.full_name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.organizations?.name?.toLowerCase().includes(q);
  });

  // Industry pie chart data
  const industryData = Object.entries(
    orgBreakdown.reduce((acc, item) => {
      acc[item.industry_template] = (acc[item.industry_template] || 0) + Number(item.org_count);
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, value]) => ({
    name: INDUSTRY_LABELS[key] || key,
    value,
    color: INDUSTRY_COLORS[key] || '#94a3b8',
  }));

  // Tier distribution
  const tierData = Object.entries(
    orgBreakdown.reduce((acc, item) => {
      acc[item.subscription_tier] = (acc[item.subscription_tier] || 0) + Number(item.org_count);
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: TIER_COLORS[key] || '#94a3b8',
  }));

  const handleImpersonate = async (user: any) => {
    if (!user.organization_id || !user.organizations?.name) return;
    try {
      await startImpersonation({
        targetUserId: user.id,
        targetUserName: user.full_name || user.email,
        targetUserEmail: user.email,
        targetOrgId: user.organization_id,
        targetOrgName: user.organizations.name,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Impersonation failed:', err);
      alert('Failed to start impersonation. Check console for details.');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Impersonation Confirmation Modal */}
      {confirmUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setConfirmUser(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Impersonate User</h3>
              <button onClick={() => setConfirmUser(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                You are about to view the CRM as this user. You will see their organization exactly as they experience it.
              </p>
            </div>

            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0">
                {confirmUser.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{confirmUser.full_name || 'Unknown'}</p>
                <p className="text-xs text-gray-500 truncate">{confirmUser.email}</p>
                <p className="text-xs text-gray-400 truncate">{confirmUser.organizations?.name || 'No organization'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmUser(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmUser(null);
                  handleImpersonate(confirmUser);
                }}
                disabled={impersonationLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-lg transition-colors"
              >
                {impersonationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                View as User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={kpis?.total_users || users.length} icon={Users} color="purple" />
        <StatCard label="Organizations" value={kpis?.total_orgs || 0} icon={Building2} color="blue" />
        <StatCard label="New (7d)" value={kpis?.new_users_7d || 0} icon={TrendingUp} color="green" />
        <StatCard label="New (30d)" value={kpis?.new_users_30d || 0} icon={TrendingUp} color="orange" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Growth Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">User Growth</h3>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="period" stroke="#6b7280" tick={{ fontSize: 10 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short' })} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="cumulative_users" fill="url(#userGrowthGrad)" stroke="#8b5cf6" strokeWidth={2} name="Total Users" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
              {loading.userGrowth ? 'Loading...' : 'No data'}
            </div>
          )}
        </div>

        {/* Industry Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">By Industry</h3>
          {industryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={industryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} strokeWidth={2} stroke="#fff">
                  {industryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
              {loading.orgBreakdown ? 'Loading...' : 'No data'}
            </div>
          )}
        </div>

        {/* Tier Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">By Subscription Tier</h3>
          {tierData.length > 0 ? (
            <div className="space-y-3 mt-4">
              {tierData.map((t) => {
                const total = tierData.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? Math.round((t.value / total) * 100) : 0;
                return (
                  <div key={t.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t.name}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{t.value} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: t.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
              {loading.orgBreakdown ? 'Loading...' : 'No data'}
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, org..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 outline-none"
            />
          </div>
        </div>
        <div>
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-[30%]">User</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell w-[22%]">Organization</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell w-[8%]">Plan</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell w-[12%]">Last Seen</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-[10%]">Status</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell w-[18%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loadingUsers ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-400">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-400">No users found</td>
                </tr>
              ) : filteredUsers.map(user => {
                const isOrgDeactivated = !!user.org_deactivated_at;
                return (
                <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isOrgDeactivated ? 'bg-red-50/50 dark:bg-red-500/5' : ''}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${isOrgDeactivated ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-purple-600 to-blue-600'}`}>
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isOrgDeactivated ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{user.full_name || 'Unknown'}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    {user.organization_id && user.organizations?.name ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          onClick={() => setSelectedOrg(user.organization_id, { alertType: 'view_org', orgName: user.organizations.name })}
                          className={`text-sm hover:underline truncate block text-left font-medium transition-colors ${isOrgDeactivated ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300' : 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300'}`}
                          title={isOrgDeactivated ? `View deactivated organization (${new Date(user.org_deactivated_at).toLocaleDateString()})` : 'View organization details'}
                        >
                          {user.organizations.name}
                        </button>
                        {isOrgDeactivated && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 whitespace-nowrap shrink-0">
                            Deactivated
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">{'\u2014'}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      isOrgDeactivated ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500 line-through' :
                      user.organizations?.plan === 'elite' || user.organizations?.plan === 'elite_premium' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      user.organizations?.plan === 'business' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      user.organizations?.plan === 'enterprise' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {(user.organizations?.plan || 'free').replace('_premium', '')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 hidden lg:table-cell">
                    {user.last_seen_at ? new Date(user.last_seen_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-3 py-2.5">
                    {isOrgDeactivated ? (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Deactivated
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                        user.is_active !== false
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right hidden md:table-cell">
                    {user.organization_id && user.organizations?.name ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedOrg(user.organization_id, { alertType: 'view_org', orgName: user.organizations.name })}
                          className="p-1.5 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-lg transition-colors"
                          title="View organization details"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                        </button>
                        {!isOrgDeactivated && (
                          <button
                            onClick={() => setConfirmUser(user)}
                            className="p-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors"
                            title="Impersonate user"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">No org</span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
};

const statColors: Record<string, string> = {
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
};

const StatCard = ({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: any; color: string;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statColors[color] || statColors.purple}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
  </div>
);
