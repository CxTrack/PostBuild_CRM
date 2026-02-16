import { useEffect } from 'react';
import { Layers, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminStore } from '../../stores/adminStore';

const MODULE_LABELS: Record<string, string> = {
  customers: 'Customers / CRM',
  invoices: 'Invoices',
  quotes: 'Quotes',
  pipeline_deals: 'Pipeline / Deals',
  calls: 'Calls',
  tasks: 'Tasks',
  products: 'Products',
  expenses: 'Expenses',
  inventory: 'Inventory',
  suppliers: 'Suppliers',
};

const formatNumber = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

export const ModuleUsageTab = () => {
  const { moduleUsage, orgBreakdown, loading, fetchModuleUsage, fetchOrgBreakdown } = useAdminStore();

  useEffect(() => {
    fetchModuleUsage();
    fetchOrgBreakdown();
  }, []);

  const totalOrgs = orgBreakdown.reduce((sum, item) => sum + Number(item.org_count), 0);
  const chartData = moduleUsage.map((m) => ({
    ...m,
    name: MODULE_LABELS[m.module_name] || m.module_name,
    adoption: totalOrgs > 0 ? Math.round(Number(m.active_orgs) / totalOrgs * 100) : 0,
  }));

  const deadFeatures = chartData.filter((m) => m.adoption < 10 && totalOrgs > 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Module Usage Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Records by Module</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={formatNumber} />
              <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12, borderRadius: 8 }}
                formatter={(v: any) => [formatNumber(v), 'Records']}
              />
              <Bar dataKey="record_count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-sm text-gray-400">
            {loading.moduleUsage ? 'Loading...' : 'No data yet'}
          </div>
        )}
      </div>

      {/* Module Details Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Module Adoption & Usage</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Module</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Records</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Active Orgs</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Avg/Org</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Adoption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {chartData.map((m) => (
                <tr key={m.module_name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{m.name}</td>
                  <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white text-right">
                    {formatNumber(m.record_count)}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 text-right">{m.active_orgs}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 text-right">{m.avg_per_org}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className={`h-full rounded-full ${m.adoption >= 50 ? 'bg-green-500' : m.adoption >= 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${m.adoption}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${m.adoption >= 50 ? 'text-green-600' : m.adoption >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {m.adoption}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {chartData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    {loading.moduleUsage ? 'Loading...' : 'No module data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Adoption Warning */}
      {deadFeatures.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4">
          <h3 className="text-sm font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" />
            Low Adoption Modules (&lt;10%)
          </h3>
          <div className="space-y-1">
            {deadFeatures.map((m) => (
              <p key={m.module_name} className="text-sm text-yellow-800 dark:text-yellow-300">
                <span className="font-medium">{m.name}</span>: {m.adoption}% adoption ({m.active_orgs} orgs, {formatNumber(m.record_count)} records)
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
