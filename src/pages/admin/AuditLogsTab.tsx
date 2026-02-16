import { useEffect, useState, useCallback } from 'react';
import {
  Search, Filter, Download, ChevronDown, ChevronRight,
  User, Clock, AlertCircle
} from 'lucide-react';
import { useAdminStore, ActivityLogEntry } from '../../stores/adminStore';

const ENTITY_TYPES = [
  'all', 'customer', 'invoice', 'quote', 'pipeline_item', 'task',
  'expense', 'product', 'call', 'organization', 'user',
];

const ACTIONS = ['all', 'created', 'updated', 'deleted', 'status_changed'];

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  status_changed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export const AuditLogsTab = () => {
  const { activityLog, loading, fetchActivityLog } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const pageSize = 50;

  useEffect(() => {
    fetchActivityLog(pageSize, page * pageSize,
      entityFilter !== 'all' ? entityFilter : undefined,
      actionFilter !== 'all' ? actionFilter : undefined
    );
  }, [page, entityFilter, actionFilter]);

  const handleFilterChange = useCallback((setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(0);
  }, []);

  // Client-side search on loaded results
  const filtered = activityLog.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.entity_type?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.user_email?.toLowerCase().includes(q) ||
      log.entity_id?.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Changes'];
    const rows = filtered.map((log) => [
      new Date(log.created_at).toISOString(),
      log.user_email || log.user_id || 'System',
      log.action,
      log.entity_type,
      log.entity_id,
      log.changes ? JSON.stringify(log.changes) : '',
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by user, action, entity..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={entityFilter}
            onChange={(e) => handleFilterChange(setEntityFilter, e.target.value)}
            className="px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All Entities' : t.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => handleFilterChange(setActionFilter, e.target.value)}
            className="px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a === 'all' ? 'All Actions' : a.replace('_', ' ')}</option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="w-8 px-2 py-2.5" />
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Time</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Action</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Entity</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((log) => (
                <LogRow
                  key={log.id}
                  log={log}
                  expanded={expandedRow === log.id}
                  onToggle={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-400">
                      {loading.activityLog ? 'Loading audit logs...' : 'No audit log entries found'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filtered.length} entries (page {page + 1})
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={activityLog.length < pageSize}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LogRow = ({ log, expanded, onToggle }: {
  log: ActivityLogEntry; expanded: boolean; onToggle: () => void;
}) => {
  const hasChanges = log.changes && Object.keys(log.changes).length > 0;

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={onToggle}>
        <td className="px-2 py-2.5 text-center">
          {hasChanges && (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 mx-auto" />
              : <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-auto" />
          )}
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatTimeAgo(log.created_at)}</span>
          </div>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white truncate max-w-[160px]">
              {log.user_email || log.user_id?.substring(0, 8) || 'System'}
            </span>
          </div>
        </td>
        <td className="px-4 py-2.5">
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {log.action}
          </span>
        </td>
        <td className="px-4 py-2.5">
          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
            {log.entity_type?.replace('_', ' ')}
          </span>
        </td>
        <td className="px-4 py-2.5 hidden md:table-cell">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {log.entity_id?.substring(0, 12)}...
          </span>
        </td>
      </tr>
      {expanded && hasChanges && (
        <tr>
          <td colSpan={6} className="px-4 py-3 bg-gray-50 dark:bg-gray-700/20">
            <div className="max-h-48 overflow-auto">
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                {JSON.stringify(log.changes, null, 2)}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
