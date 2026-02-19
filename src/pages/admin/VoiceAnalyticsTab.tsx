import { useEffect, useState } from 'react';
import {
  Phone, Clock, MessageSquare, Hash, Mic, Send, Bot, AlertTriangle,
  ChevronDown, ChevronUp, ExternalLink, Activity, Users, DollarSign,
  PhoneForwarded, PhoneIncoming, PhoneOutgoing, CircleDot
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

const formatNumber = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Collapsible section wrapper
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

export const VoiceAnalyticsTab = () => {
  const { voiceAnalytics, loading, fetchVoiceAnalytics } = useAdminStore();

  useEffect(() => {
    fetchVoiceAnalytics();
  }, []);

  const data = voiceAnalytics;
  const isLoading = loading.voice;

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Provisioning Failure Alert */}
      {data?.provisioning_failures > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              {data.provisioning_failures} agent{data.provisioning_failures > 1 ? 's' : ''} failed provisioning
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/60">
              Check the Voice Agents table below for error details
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards — 8 metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <KpiCard label="Total Calls" value={data?.total_calls || 0} icon={Phone} color="purple" loading={isLoading} />
        <KpiCard label="Avg Duration" value={formatDuration(data?.avg_duration_seconds || 0)} icon={Clock} color="blue" loading={isLoading} isText />
        <KpiCard label="AI Calls" value={data?.ai_calls || 0} icon={Mic} color="green" loading={isLoading} />
        <KpiCard label="Human Calls" value={data?.human_calls || 0} icon={Phone} color="gray" loading={isLoading} />
        <KpiCard label="SMS Sent" value={data?.sms_sent || 0} icon={Send} color="orange" loading={isLoading} />
        <KpiCard label="Phone Numbers" value={`${data?.active_phone_numbers || 0}/${data?.total_phone_numbers || 0}`} icon={Hash} color="teal" loading={isLoading} isText />
        <KpiCard label="Active Agents" value={`${data?.total_active_agents || 0}/${data?.total_agent_configs || 0}`} icon={Bot} color="indigo" loading={isLoading} isText />
        <KpiCard label="Setup Done" value={data?.total_configured_agents || 0} icon={Activity} color="emerald" loading={isLoading} />
      </div>

      {/* Voice Minutes Usage */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Platform Voice Minutes</h3>
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
          <span>{Number(data?.voice_minutes_used || 0).toFixed(1)} minutes used</span>
          <span>{data?.voice_minutes_included || 0} minutes included</span>
        </div>
      </div>

      {/* SMS + Duration + Config row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">SMS Delivery</h3>
          <div className="space-y-2">
            <StatRow label="Sent" value={data?.sms_sent || 0} />
            <StatRow label="Delivered" value={data?.sms_delivered || 0} valueClass="text-green-600 dark:text-green-400" />
            <StatRow label="Failed" value={data?.sms_failed || 0} valueClass={(data?.sms_failed || 0) > 0 ? 'text-red-600 dark:text-red-400' : undefined} />
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
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Infrastructure</h3>
          <div className="space-y-2">
            <StatRow label="Voice Provider" value="Retell AI" isText />
            <StatRow label="Phone Provider" value="Twilio" isText />
            <StatRow label="SIP Trunk" value="Active" valueClass="text-green-600 dark:text-green-400" isText />
          </div>
        </div>
      </div>

      {/* Voice Agents Table — NEW */}
      {data?.voice_agents_list && data.voice_agents_list.length > 0 && (
        <Section title="Voice Agents" icon={Bot} count={data.voice_agents_list.length}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Agent</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Provisioning</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Phone</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tone</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Setup</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.voice_agents_list.map((agent: any, i: number) => (
                  <tr key={agent.id || i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{agent.agent_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{agent.org_name || '—'}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge
                        status={agent.is_active ? 'active' : 'paused'}
                        label={agent.is_active ? 'Active' : 'Paused'}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <ProvisioningBadge status={agent.provisioning_status} error={agent.provisioning_error} />
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {agent.retell_phone_number || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 capitalize">{agent.agent_tone || '—'}</td>
                    <td className="px-4 py-2.5">
                      {agent.setup_completed ? (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">Complete</span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Step {agent.setup_step || 0}/5</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">{formatDate(agent.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Usage by Organization — NEW */}
      {data?.voice_usage_by_org && data.voice_usage_by_org.length > 0 && (
        <Section title="Usage by Organization" icon={Users} count={data.voice_usage_by_org.length}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Period</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Used</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Included</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-32">Usage</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Overage</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.voice_usage_by_org.map((vu: any, i: number) => {
                  const pct = Number(vu.usage_percent) || 0;
                  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-green-500';
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{vu.org_name || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(vu.billing_period_start)} – {formatDate(vu.billing_period_end)}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white text-right">
                        {Number(vu.minutes_used).toFixed(1)}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 text-right">{vu.minutes_included}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-right">
                        {Number(vu.overage_minutes) > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">{Number(vu.overage_minutes).toFixed(1)} min</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-right">
                        {vu.overage_cost_cents > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-bold">${(vu.overage_cost_cents / 100).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Calls by Org */}
      {data?.calls_by_org && data.calls_by_org.length > 0 && (
        <Section title="Calls by Organization" icon={PhoneForwarded} count={data.calls_by_org.length}>
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
        </Section>
      )}

      {/* Recent Calls — NEW */}
      {data?.recent_calls && data.recent_calls.length > 0 && (
        <Section title="Recent Calls" icon={Phone} count={data.recent_calls.length} defaultOpen={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Direction</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Caller</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Outcome</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.recent_calls.map((call: any, i: number) => (
                  <tr key={call.id || i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatTime(call.started_at || call.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{call.org_name || '—'}</td>
                    <td className="px-4 py-2.5">
                      <DirectionBadge direction={call.direction} />
                    </td>
                    <td className="px-4 py-2.5">
                      <TypeBadge type={call.call_type} agentName={call.agent_name} />
                    </td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {call.customer_phone || call.phone_number || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-white text-right font-medium">
                      {formatDuration(call.duration_seconds || 0)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 capitalize">{call.outcome || '—'}</td>
                    <td className="px-4 py-2.5">
                      <SentimentBadge sentiment={call.sentiment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Phone Number Inventory — Enhanced */}
      {data?.phone_numbers_list && data.phone_numbers_list.length > 0 && (
        <Section title="Phone Number Inventory" icon={Hash} count={data.phone_numbers_list.length}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Number</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nickname</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Country</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Twilio SID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Agent ID</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Provisioned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.phone_numbers_list.map((pn: any, i: number) => (
                  <tr key={pn.id || i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 text-sm font-mono font-medium text-gray-900 dark:text-white">
                      {pn.phone_number_pretty || pn.phone_number}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{pn.nickname || '—'}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{pn.org_name || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {pn.country_code === 'CA' ? '🇨🇦 CA' : pn.country_code === 'US' ? '🇺🇸 US' : pn.country_code || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={pn.status} label={pn.status} />
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[140px]" title={pn.twilio_sid || ''}>
                      {pn.twilio_sid || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-500 dark:text-gray-400 truncate max-w-[120px]" title={pn.retell_agent_id || ''}>
                      {pn.retell_agent_id || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(pn.provisioned_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
};

/* ─── Sub-components ─── */

const colorMap: Record<string, string> = {
  purple: 'from-purple-500 to-purple-600',
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
  teal: 'from-teal-500 to-teal-600',
  gray: 'from-gray-400 to-gray-500',
  indigo: 'from-indigo-500 to-indigo-600',
  emerald: 'from-emerald-500 to-emerald-600',
};

const KpiCard = ({ label, value, icon: Icon, color, loading, isText }: {
  label: string; value: string | number; icon: any; color: string; loading?: boolean; isText?: boolean;
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
      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
        {isText ? value : formatNumber(value as number)}
      </p>
    )}
  </div>
);

const StatRow = ({ label, value, valueClass, isText }: {
  label: string; value: string | number; valueClass?: string; isText?: boolean;
}) => (
  <div className="flex justify-between">
    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    <span className={`text-sm font-bold ${valueClass || 'text-gray-900 dark:text-white'}`}>
      {isText ? value : (typeof value === 'number' ? value.toLocaleString() : value)}
    </span>
  </div>
);

const StatusBadge = ({ status, label }: { status: string; label: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    released: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles[status] || styles.inactive}`}>
      {label}
    </span>
  );
};

const ProvisioningBadge = ({ status, error }: { status: string; error?: string }) => {
  const configs: Record<string, { bg: string; label: string }> = {
    completed: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Completed' },
    in_progress: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'In Progress' },
    failed: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Failed' },
    not_started: { bg: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', label: 'Not Started' },
  };
  const cfg = configs[status] || configs.not_started;
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${cfg.bg}`} title={error || ''}>
      {cfg.label}
      {status === 'failed' && error && (
        <AlertTriangle className="w-3 h-3 ml-1 inline" />
      )}
    </span>
  );
};

const DirectionBadge = ({ direction }: { direction: string }) => {
  if (direction === 'inbound') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
        <PhoneIncoming className="w-3 h-3" /> In
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
      <PhoneOutgoing className="w-3 h-3" /> Out
    </span>
  );
};

const TypeBadge = ({ type, agentName }: { type: string; agentName?: string }) => {
  if (type === 'ai_agent' || type === 'ai') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400" title={agentName || 'AI Agent'}>
        <Bot className="w-3 h-3" /> AI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
      <Phone className="w-3 h-3" /> Human
    </span>
  );
};

const SentimentBadge = ({ sentiment }: { sentiment: string | null }) => {
  if (!sentiment) return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  const colors: Record<string, string> = {
    positive: 'text-green-600 dark:text-green-400',
    neutral: 'text-gray-600 dark:text-gray-400',
    negative: 'text-red-600 dark:text-red-400',
  };
  return (
    <span className={`text-xs font-medium capitalize ${colors[sentiment] || colors.neutral}`}>
      {sentiment}
    </span>
  );
};
