import { useEffect } from 'react';
import { Phone, Clock, MessageSquare, Hash, Mic, Send } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

const formatNumber = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export const VoiceAnalyticsTab = () => {
  const { voiceAnalytics, loading, fetchVoiceAnalytics } = useAdminStore();

  useEffect(() => {
    fetchVoiceAnalytics();
  }, []);

  const data = voiceAnalytics;
  const isLoading = loading.voice;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Calls" value={data?.total_calls || 0} icon={Phone} color="purple" loading={isLoading} />
        <KpiCard label="Avg Duration" value={formatDuration(data?.avg_duration_seconds || 0)} icon={Clock} color="blue" loading={isLoading} isText />
        <KpiCard label="AI Calls" value={data?.ai_calls || 0} icon={Mic} color="green" loading={isLoading} />
        <KpiCard label="Human Calls" value={data?.human_calls || 0} icon={Phone} color="gray" loading={isLoading} />
        <KpiCard label="SMS Sent" value={data?.sms_sent || 0} icon={Send} color="orange" loading={isLoading} />
        <KpiCard label="Phone Numbers" value={`${data?.active_phone_numbers || 0}/${data?.total_phone_numbers || 0}`} icon={Hash} color="teal" loading={isLoading} isText />
      </div>

      {/* Voice Minutes Usage */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Voice Minutes Budget</h3>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {(() => {
              const used = data?.voice_minutes_used || 0;
              const included = data?.voice_minutes_included || 1;
              const pct = Math.min(Math.round(used / included * 100), 100);
              return (
                <div
                  className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${pct}%` }}
                />
              );
            })()}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{data?.voice_minutes_used || 0} minutes used</span>
          <span>{data?.voice_minutes_included || 0} minutes included</span>
        </div>
      </div>

      {/* SMS Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">SMS Delivery</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{data?.sms_sent || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Delivered</span>
              <span className="text-sm font-bold text-green-600">{data?.sms_delivered || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Failed</span>
              <span className={`text-sm font-bold ${(data?.sms_failed || 0) > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {data?.sms_failed || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Call Duration Total</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatDuration(data?.total_duration_seconds || 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">across {data?.total_calls || 0} calls</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Voice Agent Config</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Provider</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Retell AI</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Phone Provider</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Twilio</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">SIP Trunk</span>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calls by Org */}
      {data?.calls_by_org && data.calls_by_org.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Calls by Organization</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Calls</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.calls_by_org.map((org: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{org.org_name}</td>
                    <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white text-right">{org.call_count}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {formatDuration(org.total_duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Phone Numbers Inventory */}
      {data?.phone_numbers_list && data.phone_numbers_list.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Phone Number Inventory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Number</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nickname</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Agent ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.phone_numbers_list.map((pn: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-900 dark:text-white">
                      {pn.phone_number_pretty || pn.phone_number}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{pn.nickname || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{pn.org_name || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        pn.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {pn.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                      {pn.retell_agent_id || '—'}
                    </td>
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

const colorMap: Record<string, string> = {
  purple: 'from-purple-500 to-purple-600',
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
  teal: 'from-teal-500 to-teal-600',
  gray: 'from-gray-400 to-gray-500',
};

const KpiCard = ({ label, value, icon: Icon, color, loading, isText }: {
  label: string; value: string | number; icon: any; color: string; loading?: boolean; isText?: boolean;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
    <div className="flex items-center gap-2 mb-1.5">
      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
        <Icon className="w-3 h-3 text-white" />
      </div>
      <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
    </div>
    {loading ? (
      <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ) : (
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {isText ? value : formatNumber(value as number)}
      </p>
    )}
  </div>
);
