import { useEffect, useState } from 'react';
import {
  DollarSign, FileText, TrendingUp, TrendingDown,
  AlertTriangle, ArrowUpRight, Receipt
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAdminStore } from '../../stores/adminStore';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const formatCurrency = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
};

export const FinancialAnalyticsTab = () => {
  const { financialSummary, loading, fetchFinancialSummary } = useAdminStore();

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  const data = financialSummary;
  const isLoading = loading.financial;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Invoiced (30d)"
          value={data ? formatCurrency(data.total_invoiced) : '—'}
          icon={FileText}
          color="blue"
          loading={isLoading}
        />
        <MetricCard
          label="Collected (30d)"
          value={data ? formatCurrency(data.total_paid) : '—'}
          icon={DollarSign}
          color="green"
          loading={isLoading}
        />
        <MetricCard
          label="Outstanding"
          value={data ? formatCurrency(data.total_outstanding) : '—'}
          icon={AlertTriangle}
          color={data && data.total_outstanding > 0 ? 'red' : 'gray'}
          loading={isLoading}
        />
        <MetricCard
          label="Expenses (30d)"
          value={data ? formatCurrency(data.total_expenses) : '—'}
          icon={Receipt}
          color="orange"
          loading={isLoading}
        />
      </div>

      {/* Pipeline & Quote Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pipeline Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Pipeline Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Open Pipeline</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {data ? formatCurrency(data.pipeline_open_value) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Won (30d)</span>
              <span className="text-sm font-bold text-green-600">
                {data ? formatCurrency(data.pipeline_won_value) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Lost (30d)</span>
              <span className="text-sm font-bold text-red-600">
                {data ? formatCurrency(data.pipeline_lost_value) : '—'}
              </span>
            </div>
            {data && (data.pipeline_won_value + data.pipeline_lost_value > 0) && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {Math.round(data.pipeline_won_value / (data.pipeline_won_value + data.pipeline_lost_value) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quote Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Quote Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Quotes Sent (30d)</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{data?.quote_count || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Accepted</span>
              <span className="text-sm font-bold text-green-600">{data?.quotes_accepted || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Converted to Invoice</span>
              <span className="text-sm font-bold text-blue-600">{data?.quotes_converted || 0}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {data?.quote_conversion_rate ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Invoice Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Invoices (30d)</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{data?.invoice_count || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
              <span className={`text-sm font-bold ${(data?.overdue_invoices || 0) > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {data?.overdue_invoices || 0}
              </span>
            </div>
            {data && data.total_invoiced > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Collection Rate</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {Math.round(data.total_paid / data.total_invoiced * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Deals by Stage Chart */}
      {data?.pipeline_deals_by_stage && data.pipeline_deals_by_stage.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Pipeline Deals by Stage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.pipeline_deals_by_stage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="stage" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} width={50} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12, borderRadius: 8 }}
                formatter={(v: any, name: string) => [name === 'total_value' ? formatCurrency(v) : v, name === 'total_value' ? 'Value' : 'Count']}
              />
              <Bar dataKey="total_value" name="total_value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Customers */}
      {data?.top_customers_by_revenue && data.top_customers_by_revenue.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Customers by Revenue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Spent</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.top_customers_by_revenue.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{c.org_name || '—'}</td>
                    <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white text-right">
                      {formatCurrency(c.total_spent)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 text-right">{c.invoice_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const colorMapMetric: Record<string, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  gray: 'bg-gray-100 dark:bg-gray-700 text-gray-500',
};

const MetricCard = ({ label, value, icon: Icon, color, loading }: {
  label: string; value: string; icon: any; color: string; loading?: boolean;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMapMetric[color] || colorMapMetric.gray}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    {loading ? (
      <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ) : (
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    )}
  </div>
);
