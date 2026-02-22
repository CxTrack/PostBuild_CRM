import { useEffect, useState } from 'react';
import {
  Phone, DollarSign, AlertTriangle, Hash, Clock, Recycle,
  ChevronDown, ChevronUp, Trash2, Archive, ArrowRightLeft,
  History, Building2, XCircle, Timer, PhoneOff
} from 'lucide-react';
import { useAdminStore, PhoneOrphanEntry } from '../../stores/adminStore';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (cents: number) => {
  return `$${(cents / 100).toFixed(2)}`;
};

// Collapsible section (same pattern as VoiceAnalyticsTab)
const Section = ({ title, icon: Icon, count, defaultOpen = true, children }: {
  title: string; icon: any; count?: number; defaultOpen?: boolean; children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          {count !== undefined && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
};

const colorMap: Record<string, string> = {
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  teal: 'from-teal-500 to-teal-600',
  gray: 'from-gray-400 to-gray-500',
};

const KpiCard = ({ label, value, icon: Icon, color, loading }: {
  label: string; value: string; icon: any; color: string; loading?: boolean;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
    <div className="flex items-center gap-2 mb-1.5">
      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
        <Icon className="w-3 h-3 text-white" />
      </div>
      <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{label}</span>
    </div>
    {loading ? (
      <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ) : (
      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{value}</p>
    )}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    grace_period: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    pooled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    released: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };
  const labels: Record<string, string> = {
    active: 'Active',
    grace_period: 'Grace Period',
    pooled: 'Pooled',
    released: 'Released',
    inactive: 'Inactive',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.inactive}`}>
      {labels[status] || status}
    </span>
  );
};

// Confirmation modal
const ConfirmModal = ({ open, title, message, confirmLabel, onConfirm, onCancel, danger }: {
  open: boolean; title: string; message: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

type OrphanTab = 'canceled' | 'inactive' | 'deactivated' | 'grace';

export const PhoneLifecycleTab = () => {
  const {
    phoneLifecycle, phoneCostSummary, phoneAssignmentHistory,
    loading, fetchPhoneLifecycle, fetchPhoneCostSummary, fetchPhoneAssignmentHistory,
    flagNumberForRelease, releaseNumber, poolNumber,
  } = useAdminStore();

  const [orphanTab, setOrphanTab] = useState<OrphanTab>('canceled');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'release' | 'pool' | 'flag';
    entry: PhoneOrphanEntry;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchPhoneLifecycle();
    fetchPhoneCostSummary();
    fetchPhoneAssignmentHistory();
  }, []);

  const data = phoneLifecycle;
  const cost = phoneCostSummary;
  const isLoading = loading.phoneLifecycle || loading.phoneCost;

  const orphanCount =
    (data?.canceled_subscription?.length || 0) +
    (data?.inactive_org?.length || 0) +
    (data?.deactivated_agent?.length || 0) +
    (data?.grace_period?.length || 0);

  const getOrphanList = (): PhoneOrphanEntry[] => {
    if (!data) return [];
    switch (orphanTab) {
      case 'canceled': return data.canceled_subscription || [];
      case 'inactive': return data.inactive_org || [];
      case 'deactivated': return data.deactivated_agent || [];
      case 'grace': return data.grace_period || [];
      default: return [];
    }
  };

  const handleAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    setActionResult(null);
    try {
      if (confirmAction.type === 'release') {
        const result = await releaseNumber(confirmAction.entry.phone_number_id);
        setActionResult({
          success: result.success,
          message: result.success
            ? `Released ${confirmAction.entry.phone_number_pretty}`
            : result.error || 'Release failed',
        });
      } else if (confirmAction.type === 'pool') {
        const result = await poolNumber(confirmAction.entry.phone_number_id);
        setActionResult({
          success: result.success,
          message: result.success
            ? `Pooled ${confirmAction.entry.phone_number_pretty}`
            : result.error || 'Pool failed',
        });
      } else if (confirmAction.type === 'flag') {
        await flagNumberForRelease(confirmAction.entry.phone_number_id, 'admin_manual');
        setActionResult({ success: true, message: `Flagged ${confirmAction.entry.phone_number_pretty} for release (30-day grace)` });
      }
      fetchPhoneAssignmentHistory();
    } catch (e: any) {
      setActionResult({ success: false, message: e.message });
    }
    setActionLoading(false);
    setConfirmAction(null);
  };

  const orphanTabItems: { key: OrphanTab; label: string; count: number }[] = [
    { key: 'canceled', label: 'Canceled Subs', count: data?.canceled_subscription?.length || 0 },
    { key: 'inactive', label: 'Inactive Orgs', count: data?.inactive_org?.length || 0 },
    { key: 'deactivated', label: 'Deactivated Agents', count: data?.deactivated_agent?.length || 0 },
    { key: 'grace', label: 'Grace Period', count: data?.grace_period?.length || 0 },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Result toast */}
      {actionResult && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${
          actionResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
        }`}>
          {actionResult.success ? (
            <Recycle className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
          <p className={`text-sm font-medium ${
            actionResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
          }`}>
            {actionResult.message}
          </p>
          <button onClick={() => setActionResult(null)} className="ml-auto text-gray-400 hover:text-gray-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Orphan alert banner */}
      {orphanCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {orphanCount} phone number{orphanCount > 1 ? 's' : ''} may need attention
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/60">
              Review numbers below that belong to canceled, inactive, or deactivated accounts
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Monthly Cost"
          value={cost ? formatCurrency(cost.total_monthly_cost_cents) : '$0.00'}
          icon={DollarSign} color="orange" loading={isLoading}
        />
        <KpiCard
          label="Active Numbers"
          value={cost ? `${cost.active_numbers}` : '0'}
          icon={Phone} color="green" loading={isLoading}
        />
        <KpiCard
          label="At Risk"
          value={`${orphanCount}`}
          icon={AlertTriangle} color="red" loading={isLoading}
        />
        <KpiCard
          label="Potential Savings"
          value={cost ? formatCurrency(cost.potential_savings_cents) : '$0.00'}
          icon={Recycle} color="teal" loading={isLoading}
        />
      </div>

      {/* Status summary row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Active', count: data?.summary?.total_active || 0, color: 'text-green-600 dark:text-green-400' },
          { label: 'Grace Period', count: data?.summary?.total_grace_period || 0, color: 'text-yellow-600 dark:text-yellow-400' },
          { label: 'Pooled', count: data?.summary?.total_pooled || 0, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Released', count: data?.summary?.total_released || 0, color: 'text-red-600 dark:text-red-400' },
          { label: 'Total', count: cost?.total_numbers || 0, color: 'text-gray-900 dark:text-white' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className={`text-xl font-bold ${item.color}`}>{item.count}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Numbers Requiring Review */}
      <Section title="Numbers Requiring Review" icon={AlertTriangle} count={orphanCount} defaultOpen={true}>
        {/* Sub-tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 overflow-x-auto">
          {orphanTabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setOrphanTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                orphanTab === tab.key
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  orphanTab === tab.key
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orphan table */}
        {getOrphanList().length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No numbers found in this category
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Number</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Reason</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cost/mo</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Call</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {getOrphanList().map((entry) => (
                  <tr key={entry.phone_number_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                        {entry.phone_number_pretty || entry.phone_number}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{entry.org_name}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {orphanTab === 'canceled' && `Canceled ${entry.days_since_canceled || 0}d ago`}
                      {orphanTab === 'inactive' && `No login ${entry.days_since_login || 0}d`}
                      {orphanTab === 'deactivated' && `Agent off ${entry.days_since_agent_update || 0}d`}
                      {orphanTab === 'grace' && `${entry.days_remaining || 0}d remaining`}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white text-right">
                      {formatCurrency(entry.monthly_cost_cents)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {entry.last_call_at ? formatDate(entry.last_call_at) : 'Never'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        {orphanTab !== 'grace' && (
                          <button
                            onClick={() => setConfirmAction({ type: 'flag', entry })}
                            title="Flag for release (30-day grace)"
                            className="p-1.5 rounded-lg text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                          >
                            <Timer className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmAction({ type: 'pool', entry })}
                          title="Move to pool (keep on Twilio)"
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'release', entry })}
                          title="Release from Twilio (permanent)"
                          className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Cost by Organization */}
      {cost?.cost_by_org && cost.cost_by_org.length > 0 && (
        <Section title="Cost by Organization" icon={Building2} count={cost.cost_by_org.length} defaultOpen={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tier</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Numbers</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Monthly Cost</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Call</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cost.cost_by_org.map((org, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{org.org_name}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 capitalize">{org.subscription_tier?.replace('_', ' ') || 'free'}</td>
                    <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white text-right">{org.number_count}</td>
                    <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white text-right">{formatCurrency(org.monthly_cost_cents)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {org.last_call_at ? formatDate(org.last_call_at) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Assignment History */}
      <Section title="Assignment History" icon={History} count={phoneAssignmentHistory.length} defaultOpen={false}>
        {phoneAssignmentHistory.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No assignment events recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Number</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Event</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Reason</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {phoneAssignmentHistory.map((event) => {
                  const eventStyles: Record<string, string> = {
                    assigned: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    flagged_for_release: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    pooled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    reassigned: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                    released: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    twilio_released: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  };
                  return (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(event.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono text-gray-600 dark:text-gray-400">{event.phone_number}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          eventStyles[event.event_type] || eventStyles.released
                        }`}>
                          {event.event_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{event.org_name || '\u2014'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">{event.reason || '\u2014'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">{event.performed_by_name || 'System'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={!!confirmAction}
        title={
          confirmAction?.type === 'release'
            ? 'Release Phone Number'
            : confirmAction?.type === 'pool'
            ? 'Pool Phone Number'
            : 'Flag for Release'
        }
        message={
          confirmAction?.type === 'release'
            ? `This will permanently release ${confirmAction?.entry.phone_number_pretty} from Twilio. The number will be lost and cannot be recovered. This saves ${formatCurrency(confirmAction?.entry.monthly_cost_cents || 150)}/mo.`
            : confirmAction?.type === 'pool'
            ? `This will unbind ${confirmAction?.entry.phone_number_pretty} from its agent and move it to the pool for reassignment. The Twilio number is kept (${formatCurrency(confirmAction?.entry.monthly_cost_cents || 150)}/mo continues).`
            : `This will put ${confirmAction?.entry.phone_number_pretty} into a 30-day grace period. The number stays active during this time, giving the organization a chance to reactivate.`
        }
        confirmLabel={actionLoading ? 'Processing...' : (
          confirmAction?.type === 'release' ? 'Release Permanently' :
          confirmAction?.type === 'pool' ? 'Move to Pool' : 'Flag for Release'
        )}
        danger={confirmAction?.type === 'release'}
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
