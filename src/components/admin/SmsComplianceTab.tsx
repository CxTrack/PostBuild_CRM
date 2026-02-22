import React, { useEffect, useState } from 'react';
import {
  MessageSquare, XCircle, CheckCircle, Clock, RefreshCw, Search,
  ChevronDown, AlertCircle, User, Building2, Calendar, Loader2, Eye
} from 'lucide-react';
import { useAdminStore } from '@/stores/adminStore';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  opted_out: {
    label: 'Opted Out',
    color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  pending_reopt: {
    label: 'Pending Re-opt-in',
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  opted_in: {
    label: 'Active',
    color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
};

export const SmsComplianceTab: React.FC = () => {
  const {
    smsConsentList, smsAuditLog, adminNotifications,
    fetchSmsConsentList, fetchSmsAuditLog, adminReenableSms, adminDenySmsReopt,
    loading, fetchAdminNotifications, markAdminNotificationRead,
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'opted_out' | 'pending_reopt'>('all');
  const [selectedConsent, setSelectedConsent] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSmsConsentList();
    fetchAdminNotifications('sms_opt_out');
    fetchAdminNotifications('sms_reopt_confirmed');
  }, []);

  const filtered = (smsConsentList || []).filter((c: any) => {
    const matchSearch = !search ||
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.organization_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingApproval = (smsConsentList || []).filter(
    (c: any) => c.status === 'pending_reopt' && c.reopt_completed_at
  );

  const handleApprove = async (consentId: string) => {
    setProcessingId(consentId);
    try {
      await adminReenableSms(consentId);
      toast.success('SMS re-enabled for customer');
    } catch (e: any) {
      toast.error(e.message || 'Failed to re-enable SMS');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (consentId: string) => {
    setProcessingId(consentId);
    try {
      await adminDenySmsReopt(consentId);
      toast.success('Re-opt-in request denied');
    } catch (e: any) {
      toast.error(e.message || 'Failed to deny request');
    } finally {
      setProcessingId(null);
    }
  };

  const isLoading = loading['smsConsent'];

  return (
    <div className="space-y-6">
      {/* Pending Approval Banner */}
      {pendingApproval.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                {pendingApproval.length} Re-opt-in Request{pendingApproval.length > 1 ? 's' : ''} Awaiting Admin Approval
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Customer{pendingApproval.length > 1 ? 's have' : ' has'} confirmed they wish to receive SMS again. Review and approve or deny below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Opt-Outs', value: (smsConsentList || []).filter((c: any) => c.status === 'opted_out').length, color: 'text-red-600 dark:text-red-400' },
          { label: 'Pending Re-opt-in', value: (smsConsentList || []).filter((c: any) => c.status === 'pending_reopt').length, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Pending Approval', value: pendingApproval.length, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Active Consent', value: (smsConsentList || []).filter((c: any) => c.status === 'opted_in').length, color: 'text-green-600 dark:text-green-400' },
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
            placeholder="Search customer or organization..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30"
        >
          <option value="all">All Statuses</option>
          <option value="opted_out">Opted Out</option>
          <option value="pending_reopt">Pending Re-opt-in</option>
        </select>
        <button
          onClick={fetchSmsConsentList}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
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
            <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Organization</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Opt-Out Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Customer Confirmed</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => {
                  const statusInfo = STATUS_LABELS[c.status] || STATUS_LABELS.opted_in;
                  const isPendingApproval = c.status === 'pending_reopt' && c.reopt_completed_at;
                  const isProcessing = processingId === c.id;

                  return (
                    <tr key={c.id} className={`border-b border-gray-100 dark:border-gray-700/30 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors ${isPendingApproval ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{c.customer_name || 'Unknown'}</p>
                            {c.customer_email && <p className="text-xs text-gray-400">{c.customer_email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Building2 className="w-3.5 h-3.5" />
                          {c.organization_name || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {c.opted_out_at ? new Date(c.opted_out_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {c.reopt_completed_at ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {new Date(c.reopt_completed_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                          </span>
                        ) : c.reopt_requested_at ? (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            Awaiting
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {isPendingApproval && (
                            <>
                              <button
                                onClick={() => handleApprove(c.id)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                Approve
                              </button>
                              <button
                                onClick={() => handleDeny(c.id)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                Deny
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmsComplianceTab;
