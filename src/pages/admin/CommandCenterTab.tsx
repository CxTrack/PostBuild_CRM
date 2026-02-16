import { useEffect } from 'react';
import {
  Users, Building2, DollarSign, TrendingUp,
  Brain, Phone, AlertTriangle, AlertCircle,
  FileText, CheckSquare, ShoppingCart, Clock,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAdminStore } from '../../stores/adminStore';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'];

const formatNumber = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const formatCurrency = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
};

export const CommandCenterTab = () => {
  const {
    kpis, userGrowth, orgBreakdown, priorityAlerts,
    loading, fetchKPIs, fetchUserGrowth, fetchOrgBreakdown, fetchPriorityAlerts
  } = useAdminStore();

  useEffect(() => {
    fetchKPIs();
    fetchUserGrowth();
    fetchOrgBreakdown();
    fetchPriorityAlerts();
  }, []);

  // Aggregate org breakdown for pie chart
  const industryData = orgBreakdown.reduce<{ name: string; value: number }[]>((acc, item) => {
    const existing = acc.find((a) => a.name === item.industry_template);
    if (existing) {
      existing.value += Number(item.org_count);
    } else {
      acc.push({ name: item.industry_template || 'unknown', value: Number(item.org_count) });
    }
    return acc;
  }, []);

  const tierData = orgBreakdown.reduce<{ name: string; value: number }[]>((acc, item) => {
    const existing = acc.find((a) => a.name === item.subscription_tier);
    if (existing) {
      existing.value += Number(item.org_count);
    } else {
      acc.push({ name: item.subscription_tier || 'free', value: Number(item.org_count) });
    }
    return acc;
  }, []);

  const isLoading = loading.kpis || loading.userGrowth;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="Total Users"
          value={kpis ? formatNumber(kpis.total_users) : '—'}
          subValue={kpis ? `+${kpis.new_users_7d} this week` : ''}
          icon={Users}
          color="purple"
          loading={loading.kpis}
        />
        <KPICard
          label="Organizations"
          value={kpis ? formatNumber(kpis.total_orgs) : '—'}
          subValue={kpis ? `${kpis.active_orgs_30d} active` : ''}
          icon={Building2}
          color="blue"
          loading={loading.kpis}
        />
        <KPICard
          label="Pipeline Value"
          value={kpis ? formatCurrency(kpis.total_pipeline_value) : '—'}
          subValue={kpis ? `${kpis.deals_won_30d} won (30d)` : ''}
          icon={TrendingUp}
          color="green"
          loading={loading.kpis}
        />
        <KPICard
          label="Invoiced (30d)"
          value={kpis ? formatCurrency(kpis.total_invoiced_30d) : '—'}
          subValue={kpis ? `${formatCurrency(kpis.total_paid_30d)} collected` : ''}
          icon={DollarSign}
          color="emerald"
          loading={loading.kpis}
        />
        <KPICard
          label="AI Tokens (MTD)"
          value={kpis ? formatNumber(kpis.ai_tokens_used_30d) : '—'}
          subValue={kpis && kpis.ai_tokens_allocated_30d > 0 ? `${Math.round(kpis.ai_tokens_used_30d / kpis.ai_tokens_allocated_30d * 100)}% used` : ''}
          icon={Brain}
          color="orange"
          loading={loading.kpis}
        />
        <KPICard
          label="Voice Minutes"
          value={kpis ? formatNumber(kpis.voice_minutes_30d) : '—'}
          subValue={kpis ? `${kpis.active_phone_numbers} numbers` : ''}
          icon={Phone}
          color="teal"
          loading={loading.kpis}
        />
      </div>

      {/* Priority Alerts */}
      {priorityAlerts && (
        (priorityAlerts.high_priority.length > 0 || priorityAlerts.medium_priority.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* High Priority */}
            {priorityAlerts.high_priority.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
                <h3 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  High Priority ({priorityAlerts.high_priority.length})
                </h3>
                <div className="space-y-2">
                  {priorityAlerts.high_priority.map((alert, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-300">{alert.title}</p>
                        <p className="text-xs text-red-600 dark:text-red-400/70">{alert.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medium Priority */}
            {priorityAlerts.medium_priority.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4">
                <h3 className="text-sm font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4" />
                  Needs Attention ({priorityAlerts.medium_priority.length})
                </h3>
                <div className="space-y-2">
                  {priorityAlerts.medium_priority.map((alert, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-300">{alert.title}</p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400/70">{alert.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Growth */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">User Growth</h3>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="period" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="cumulative_users" name="Total Users" stroke="#8b5cf6" strokeWidth={2} fill="url(#growthGrad)" />
                <Bar dataKey="new_users" name="New Users" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={16} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
              {loading.userGrowth ? 'Loading...' : 'No data yet'}
            </div>
          )}
        </div>

        {/* Industry Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">By Industry</h3>
          {industryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {industryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12, borderRadius: 8 }}
                  formatter={(value: any, name: string) => [value, name.replace(/_/g, ' ')]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
              {loading.orgBreakdown ? 'Loading...' : 'No data yet'}
            </div>
          )}
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {industryData.slice(0, 6).map((item, i) => (
              <div key={item.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{item.name.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard icon={FileText} label="Invoices" value={kpis?.total_invoices || 0} loading={loading.kpis} />
        <StatCard icon={FileText} label="Quotes" value={kpis?.total_quotes || 0} loading={loading.kpis} />
        <StatCard icon={Users} label="Customers" value={kpis?.total_customers || 0} loading={loading.kpis} />
        <StatCard icon={Phone} label="Calls" value={kpis?.total_calls || 0} loading={loading.kpis} />
        <StatCard icon={CheckSquare} label="Tasks" value={kpis?.total_tasks || 0} loading={loading.kpis} />
        <StatCard icon={ShoppingCart} label="Expenses" value={kpis?.total_expenses || 0} loading={loading.kpis} />
      </div>

      {/* Support & Tier Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Support Tickets Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Support Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Open Tickets</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{kpis?.open_support_tickets || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Urgent Tickets</span>
              <span className={`text-sm font-bold ${(kpis?.urgent_support_tickets || 0) > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {kpis?.urgent_support_tickets || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Tier Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Subscription Tiers</h3>
          <div className="space-y-2">
            {tierData.map((tier) => (
              <div key={tier.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{tier.name}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{tier.value} orgs</span>
              </div>
            ))}
            {tierData.length === 0 && (
              <p className="text-sm text-gray-400">{loading.orgBreakdown ? 'Loading...' : 'No data'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

interface KPICardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: any;
  color: string;
  loading?: boolean;
}

const colorMap: Record<string, string> = {
  purple: 'from-purple-500 to-purple-600',
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  emerald: 'from-emerald-500 to-emerald-600',
  orange: 'from-orange-500 to-orange-600',
  teal: 'from-teal-500 to-teal-600',
};

const KPICard = ({ label, value, subValue, icon: Icon, color, loading }: KPICardProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 md:p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colorMap[color] || colorMap.purple} flex items-center justify-center`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
    </div>
    {loading ? (
      <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ) : (
      <>
        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subValue && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{subValue}</p>}
      </>
    )}
  </div>
);

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  loading?: boolean;
}

const StatCard = ({ icon: Icon, label, value, loading }: StatCardProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3">
    <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      {loading ? (
        <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-0.5" />
      ) : (
        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(value)}</p>
      )}
    </div>
  </div>
);
