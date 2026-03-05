import React, { useEffect, useState } from 'react';
import { Mail, Search, RefreshCw, UserX, UserCheck, Loader2, Download, Eye } from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import toast from 'react-hot-toast';

export const MarketingEmailsTab: React.FC = () => {
  const {
    marketingSubscriptions, fetchMarketingSubscriptions, loading
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'subscribed' | 'unsubscribed'>('all');

  useEffect(() => {
    fetchMarketingSubscriptions();
  }, []);

  const filtered = (marketingSubscriptions || []).filter((s: any) => {
    const matchSearch = !search || s.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSubscribed = (marketingSubscriptions || []).filter((s: any) => s.status === 'subscribed').length;
  const totalUnsubscribed = (marketingSubscriptions || []).filter((s: any) => s.status === 'unsubscribed').length;
  const unsubscribeRate = marketingSubscriptions?.length
    ? ((totalUnsubscribed / marketingSubscriptions.length) * 100).toFixed(1)
    : '0.0';

  const isLoading = loading['marketingSubs'];

  const handleExport = () => {
    const rows = filtered.map((s: any) => [
      s.email, s.status, s.subscription_type, s.subscribed_at, s.unsubscribed_at || '', s.unsubscribe_reason || ''
    ]);
    const csv = [
      ['Email', 'Status', 'Type', 'Subscribed At', 'Unsubscribed At', 'Reason'],
      ...rows,
    ].map((r) => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-emails-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: marketingSubscriptions?.length || 0, color: 'text-gray-900 dark:text-gray-100' },
          { label: 'Subscribed', value: totalSubscribed, color: 'text-green-600 dark:text-green-400' },
          { label: 'Unsubscribed', value: totalUnsubscribed, color: 'text-red-600 dark:text-red-400' },
          { label: 'Unsubscribe Rate', value: `${unsubscribeRate}%`, color: 'text-amber-600 dark:text-amber-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <button
          onClick={fetchMarketingSubscriptions}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Mail className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Subscribed</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Unsubscribed</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Reason</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/30 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{s.email}</td>
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 capitalize">{s.subscription_type}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        s.status === 'subscribed'
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
                          : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
                      }`}>
                        {s.status === 'subscribed' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {s.status === 'subscribed' ? 'Subscribed' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                      {s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                      {s.unsubscribed_at ? new Date(s.unsubscribed_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {s.unsubscribe_reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingEmailsTab;
