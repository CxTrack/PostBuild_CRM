import { useEffect, useState, useCallback } from 'react';
import {
  Phone, Clock, MessageSquare, Hash, Mic, Send, Bot, AlertTriangle,
  ChevronDown, ChevronUp, ExternalLink, Activity, Users, DollarSign,
  PhoneForwarded, PhoneIncoming, PhoneOutgoing, CircleDot,
  ArrowDownLeft, ArrowUpRight, ShieldAlert, RefreshCw,
  PlayCircle, FileText, ArrowLeft, Search, Filter, X, Loader2,
  BarChart3, List, ChevronRight
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

/* ─── Helpers ─── */

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

const formatFullDateTime = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  });
};

const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* skip */ }
    }
  }
  return null;
};

/* ─── Supabase RPC caller ─── */
const callAdminRpc = async (fnName: string, params: Record<string, any> = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token');
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`RPC ${fnName} failed (${res.status})`);
  return res.json();
};

/* ─── Sub-tab types ─── */
type VoiceSubTab = 'overview' | 'agents' | 'calls' | 'sms';

/* ─── Collapsible section wrapper ─── */
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

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export const VoiceAnalyticsTab = () => {
  const { voiceAnalytics, smsUsageData, loading, fetchVoiceAnalytics, fetchSmsUsageData, setSelectedOrg } = useAdminStore();

  const [subTab, setSubTab] = useState<VoiceSubTab>('overview');
  // Call history state
  const [callsList, setCallsList] = useState<any[]>([]);
  const [callsTotal, setCallsTotal] = useState(0);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsPage, setCallsPage] = useState(0);
  const [callFilter, setCallFilter] = useState<{ agent?: string; orgId?: string; direction?: string; search?: string }>({});
  // Call detail state
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [callDetail, setCallDetail] = useState<any>(null);
  const [callDetailLoading, setCallDetailLoading] = useState(false);

  useEffect(() => {
    fetchVoiceAnalytics();
    fetchSmsUsageData();
  }, []);

  const data = voiceAnalytics;
  const sms = smsUsageData;
  const isLoading = loading.voice;
  const smsLoading = loading.smsUsage;

  /* ─── Fetch calls list ─── */
  const fetchCallsList = useCallback(async (page = 0, filters: typeof callFilter = callFilter) => {
    setCallsLoading(true);
    try {
      const result = await callAdminRpc('admin_get_calls_list', {
        p_limit: 50,
        p_offset: page * 50,
        p_agent_name: filters.agent || null,
        p_org_id: filters.orgId || null,
        p_direction: filters.direction || null,
        p_days: 90,
      });
      setCallsList(result?.calls || []);
      setCallsTotal(result?.total_count || 0);
    } catch (err) {
      console.error('[VoiceAnalyticsTab] fetchCallsList error:', err);
    } finally {
      setCallsLoading(false);
    }
  }, [callFilter]);

  /* ─── Fetch call detail ─── */
  const fetchCallDetail = useCallback(async (callId: string) => {
    setCallDetailLoading(true);
    setSelectedCallId(callId);
    try {
      const result = await callAdminRpc('admin_get_call_detail', { p_call_id: callId });
      setCallDetail(result);
    } catch (err) {
      console.error('[VoiceAnalyticsTab] fetchCallDetail error:', err);
    } finally {
      setCallDetailLoading(false);
    }
  }, []);

  /* ─── Navigate to call history with agent filter ─── */
  const goToAgentCalls = (agentName: string) => {
    const newFilter = { agent: agentName };
    setCallFilter(newFilter);
    setCallsPage(0);
    setSubTab('calls');
    setSelectedCallId(null);
    fetchCallsList(0, newFilter);
  };

  /* ─── Navigate to call history with org filter ─── */
  const goToOrgCalls = (orgId: string) => {
    const newFilter = { orgId };
    setCallFilter(newFilter);
    setCallsPage(0);
    setSubTab('calls');
    setSelectedCallId(null);
    fetchCallsList(0, newFilter);
  };

  /* ─── Switch to calls tab ─── */
  const switchToCallsTab = () => {
    setSubTab('calls');
    setSelectedCallId(null);
    if (callsList.length === 0) {
      fetchCallsList(0, {});
    }
  };

  /* ─── Sub-tab navigation ─── */
  const SUB_TABS: { id: VoiceSubTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'agents', label: 'Voice Agents', icon: Bot },
    { id: 'calls', label: 'Call History', icon: Phone },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
  ];

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Sub-tab navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSubTab(tab.id);
              if (tab.id === 'calls' && callsList.length === 0) {
                fetchCallsList(0, callFilter);
              }
            }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              subTab === tab.id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {subTab === 'overview' && (
        <OverviewSubTab
          data={data}
          sms={sms}
          isLoading={isLoading}
          smsLoading={smsLoading}
          fetchSmsUsageData={fetchSmsUsageData}
          setSelectedOrg={setSelectedOrg}
        />
      )}

      {/* ─── VOICE AGENTS TAB ─── */}
      {subTab === 'agents' && (
        <AgentsSubTab
          data={data}
          isLoading={isLoading}
          setSelectedOrg={setSelectedOrg}
          goToAgentCalls={goToAgentCalls}
        />
      )}

      {/* ─── CALL HISTORY TAB (split panel layout) ─── */}
      {subTab === 'calls' && (
        <div className={`flex gap-0 ${selectedCallId ? '' : ''}`}>
          {/* Call list (shrinks when detail panel is open) */}
          <div className={`${selectedCallId ? 'w-[380px] min-w-[380px] border-r border-gray-200 dark:border-gray-700 max-h-[calc(100vh-200px)] overflow-y-auto' : 'flex-1'} transition-all duration-200`}>
            <CallHistorySubTab
              calls={callsList}
              total={callsTotal}
              loading={callsLoading}
              page={callsPage}
              filter={callFilter}
              setFilter={(f) => {
                setCallFilter(f);
                setCallsPage(0);
                fetchCallsList(0, f);
              }}
              setPage={(p) => { setCallsPage(p); fetchCallsList(p, callFilter); }}
              onSelectCall={fetchCallDetail}
              setSelectedOrg={setSelectedOrg}
              data={data}
              compact={!!selectedCallId}
              selectedCallId={selectedCallId}
            />
          </div>
          {/* Call detail panel (slides in from right) */}
          {selectedCallId && (
            <div className="flex-1 max-h-[calc(100vh-200px)] overflow-y-auto p-4">
              <CallDetailView
                callDetail={callDetail}
                loading={callDetailLoading}
                onBack={() => { setSelectedCallId(null); setCallDetail(null); }}
                setSelectedOrg={setSelectedOrg}
                isPanel
              />
            </div>
          )}
        </div>
      )}

      {/* ─── SMS TAB ─── */}
      {subTab === 'sms' && (
        <SmsSubTab
          sms={sms}
          smsLoading={smsLoading}
          fetchSmsUsageData={fetchSmsUsageData}
          setSelectedOrg={setSelectedOrg}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   OVERVIEW SUB-TAB
   ═══════════════════════════════════════════════════════════ */

const OverviewSubTab = ({ data, sms, isLoading, smsLoading, fetchSmsUsageData, setSelectedOrg }: any) => (
  <div className="space-y-4">
    {/* Provisioning Failure Alert */}
    {data?.provisioning_failures > 0 && (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">
            {data.provisioning_failures} agent{data.provisioning_failures > 1 ? 's' : ''} failed provisioning
          </p>
          <p className="text-xs text-red-600/70 dark:text-red-400/60">
            Check the Voice Agents tab for error details
          </p>
        </div>
      </div>
    )}

    {/* KPI Cards */}
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

    {/* SMS Monthly Overview KPIs */}
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-green-600" />
          SMS Overview (This Month)
        </h3>
        <button onClick={fetchSmsUsageData} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${smsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Outbound</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{sms?.total_outbound_this_month || 0}</p>
        </div>
        <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Inbound</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{sms?.total_inbound_this_month || 0}</p>
        </div>
        <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Send className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{sms?.total_delivered_this_month || 0}</p>
        </div>
        <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Failed</span>
          </div>
          <p className={`text-2xl font-bold ${(sms?.total_failed_this_month || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {sms?.total_failed_this_month || 0}
          </p>
        </div>
      </div>
    </div>

    {/* Duration + Config row */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

    {/* Usage by Organization */}
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
                    <td className="px-4 py-2.5">
                      <OrgLink name={vu.org_name} orgId={vu.organization_id} setSelectedOrg={setSelectedOrg} />
                    </td>
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
                  <td className="px-4 py-2.5">
                    <OrgLink name={org.org_name} orgId={org.organization_id} setSelectedOrg={setSelectedOrg} />
                  </td>
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

    {/* Phone Number Inventory */}
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
                  <td className="px-4 py-2.5">
                    <OrgLink name={pn.org_name} orgId={pn.organization_id} setSelectedOrg={setSelectedOrg} />
                  </td>
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

/* ═══════════════════════════════════════════════════════════
   VOICE AGENTS SUB-TAB
   ═══════════════════════════════════════════════════════════ */

const AgentsSubTab = ({ data, isLoading, setSelectedOrg, goToAgentCalls }: any) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const agents = data?.voice_agents_list || [];

  if (agents.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">No voice agents configured yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Provisioning Failure Alert */}
      {data?.provisioning_failures > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              {data.provisioning_failures} agent{data.provisioning_failures > 1 ? 's' : ''} failed provisioning
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Bot className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Voice Agents</h3>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {agents.length}
          </span>
        </div>
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
              {agents.map((agent: any, i: number) => (
                <tr key={agent.id || i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => agent.agent_name && goToAgentCalls(agent.agent_name)}
                      className="flex items-center gap-2 group"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:underline cursor-pointer">
                        {agent.agent_name || '—'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <OrgLink name={agent.org_name} orgId={agent.organization_id} setSelectedOrg={setSelectedOrg} />
                  </td>
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
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CALL HISTORY SUB-TAB
   ═══════════════════════════════════════════════════════════ */

const CallHistorySubTab = ({ calls, total, loading, page, filter, setFilter, setPage, onSelectCall, setSelectedOrg, data, compact, selectedCallId }: any) => {
  const [searchInput, setSearchInput] = useState(filter.search || '');

  // Get unique agent names from voice_agents_list for filter dropdown
  const agentNames = Array.from(new Set(
    (data?.voice_agents_list || []).map((a: any) => a.agent_name).filter(Boolean)
  )) as string[];

  const totalPages = Math.ceil(total / 50);
  const hasActiveFilter = filter.agent || filter.orgId || filter.direction;

  return (
    <div className={compact ? 'space-y-0' : 'space-y-4'}>
      {/* Filter bar (hidden in compact/panel mode) */}
      {!compact && <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters:</span>
          </div>

          {/* Agent filter */}
          <select
            value={filter.agent || ''}
            onChange={(e) => setFilter({ ...filter, agent: e.target.value || undefined })}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Agents</option>
            {agentNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {/* Direction filter */}
          <select
            value={filter.direction || ''}
            onChange={(e) => setFilter({ ...filter, direction: e.target.value || undefined })}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>

          {/* Clear filters */}
          {hasActiveFilter && (
            <button
              onClick={() => setFilter({})}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}

          <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {total} call{total !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Active filter badges */}
        {hasActiveFilter && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {filter.agent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                <Bot className="w-3 h-3" /> Agent: {filter.agent}
                <button onClick={() => setFilter({ ...filter, agent: undefined })} className="ml-0.5 hover:text-purple-900 dark:hover:text-purple-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filter.orgId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                <Users className="w-3 h-3" /> Filtered by Organization
                <button onClick={() => setFilter({ ...filter, orgId: undefined })} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filter.direction && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                {filter.direction === 'inbound' ? <PhoneIncoming className="w-3 h-3" /> : <PhoneOutgoing className="w-3 h-3" />}
                {filter.direction}
                <button onClick={() => setFilter({ ...filter, direction: undefined })} className="ml-0.5 hover:text-orange-900 dark:hover:text-orange-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>}

      {/* Calls table */}
      <div className={`bg-white dark:bg-gray-800 ${compact ? '' : 'rounded-xl border border-gray-200 dark:border-gray-700'} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Phone className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No calls found</p>
          </div>
        ) : compact ? (
          /* ── Compact list for split-panel ── */
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {calls.map((call: any, i: number) => {
                const isSelected = call.id === selectedCallId;
                return (
                  <div
                    key={call.id || i}
                    onClick={() => onSelectCall(call.id)}
                    className={`px-3 py-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                          call.call_type === 'ai_agent' || call.call_type === 'ai'
                            ? 'bg-purple-100 dark:bg-purple-900/30'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {call.call_type === 'ai_agent' || call.call_type === 'ai'
                            ? <Bot className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            : <Phone className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          }
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {call.customer_name || call.customer_phone || call.phone_number || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                        {formatDuration(call.duration_seconds || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DirectionBadge direction={call.direction} />
                        {call.sentiment && <SentimentBadge sentiment={call.sentiment} />}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatTime(call.started_at || call.created_at)}
                      </span>
                    </div>
                    {call.org_name && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">{call.org_name}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* ── Full table for non-compact ── */
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Time</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Dir</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Caller</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sentiment</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Summary</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {calls.map((call: any, i: number) => (
                    <tr
                      key={call.id || i}
                      onClick={() => onSelectCall(call.id)}
                      className="hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatTime(call.started_at || call.created_at)}
                      </td>
                      <td className="px-4 py-2.5">
                        <OrgLink name={call.org_name} orgId={call.organization_id} setSelectedOrg={setSelectedOrg} />
                      </td>
                      <td className="px-4 py-2.5">
                        <DirectionBadge direction={call.direction} />
                      </td>
                      <td className="px-4 py-2.5">
                        <TypeBadge type={call.call_type} agentName={call.agent_name} />
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {call.customer_phone || call.phone_number || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                        {call.customer_name || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-white text-right font-medium">
                        {formatDuration(call.duration_seconds || 0)}
                      </td>
                      <td className="px-4 py-2.5">
                        <SentimentBadge sentiment={call.sentiment} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 max-w-[180px] truncate" title={call.summary_text || ''}>
                        {call.summary_text?.substring(0, 60) || '—'}
                        {call.summary_text?.length > 60 ? '...' : ''}
                      </td>
                      <td className="px-4 py-2.5">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CALL DETAIL VIEW
   ═══════════════════════════════════════════════════════════ */

const CallDetailView = ({ callDetail, loading, onBack, setSelectedOrg, isPanel }: any) => {
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const call = callDetail?.call;
  const summary = callDetail?.call_summary;

  if (!call) {
    return (
      <div className="text-center py-16">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline mx-auto mb-4">
          {isPanel ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} {isPanel ? 'Close' : 'Back to Call History'}
        </button>
        <p className="text-gray-500 dark:text-gray-400">Call not found</p>
      </div>
    );
  }

  // Get the best transcript
  const transcriptObj = summary?.transcript_object;
  const plainTranscript = summary?.cs_transcript || call.transcript || call.call_summary || call.summary;
  const summaryText = summary?.summary_text || call.call_summary || call.summary;
  const sentiment = summary?.cs_sentiment || call.sentiment;
  const sentimentScore = summary?.cs_sentiment_score || call.sentiment_score;
  const keyTopics = summary?.key_topics || [];
  const actionItems = summary?.cs_action_items || call.action_items || [];
  const recordingUrl = summary?.cs_recording_url || call.recording_url;
  const durationSec = call.duration_seconds || (summary?.duration_ms ? Math.round(summary.duration_ms / 1000) : 0);

  return (
    <div className="space-y-4">
      {/* Back/Close button + header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isPanel ? <X className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {isPanel ? 'Close' : 'Back to Calls'}
        </button>
      </div>

      {/* Call header card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                call.call_type === 'ai_agent' || call.call_type === 'ai'
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {call.call_type === 'ai_agent' || call.call_type === 'ai'
                  ? <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  : <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                }
              </div>
              <div>
                <span>{call.customer_name || call.customer_phone || call.phone_number || 'Unknown Caller'}</span>
                <div className="flex items-center gap-2 mt-1">
                  <DirectionBadge direction={call.direction} />
                  <TypeBadge type={call.call_type} agentName={call.agent_name} />
                  {sentiment && <SentimentBadge sentiment={sentiment} />}
                </div>
              </div>
            </h2>
          </div>
          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium text-gray-900 dark:text-white">{formatFullDateTime(call.started_at || call.created_at)}</p>
            <p>Duration: <span className="font-bold text-gray-900 dark:text-white">{formatDuration(durationSec)}</span></p>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetaItem label="Organization">
            <OrgLink name={call.org_name} orgId={call.organization_id} setSelectedOrg={setSelectedOrg} />
          </MetaItem>
          <MetaItem label="Phone Number">
            <span className="font-mono text-sm">{call.customer_phone || call.phone_number || '—'}</span>
          </MetaItem>
          <MetaItem label="Agent">
            <span className="text-sm">{call.agent_name || '—'}</span>
          </MetaItem>
          <MetaItem label="Outcome">
            <span className="text-sm capitalize">{call.outcome || '—'}</span>
          </MetaItem>
          {call.customer_email && (
            <MetaItem label="Customer Email">
              <span className="text-sm">{call.customer_email}</span>
            </MetaItem>
          )}
          {sentimentScore != null && (
            <MetaItem label="Sentiment Score">
              <span className="text-sm font-bold">{(Number(sentimentScore) * 100).toFixed(0)}%</span>
            </MetaItem>
          )}
          {call.status && (
            <MetaItem label="Status">
              <StatusBadge status={call.status} label={call.status} />
            </MetaItem>
          )}
        </div>
      </div>

      {/* Recording */}
      {recordingUrl && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <PlayCircle className="w-4 h-4 text-purple-500" />
            Recording
          </h3>
          <audio controls className="w-full" preload="metadata">
            <source src={recordingUrl} type="audio/mpeg" />
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      {/* Summary */}
      {summaryText && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-blue-500" />
            AI Summary
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {summaryText}
          </p>
        </div>
      )}

      {/* Key Topics + Action Items side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {keyTopics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Key Topics</h3>
            <div className="flex flex-wrap gap-2">
              {keyTopics.map((topic: string, i: number) => (
                <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {(Array.isArray(actionItems) ? actionItems : []).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Action Items</h3>
            <ul className="space-y-1.5">
              {(Array.isArray(actionItems) ? actionItems : []).map((item: any, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{typeof item === 'string' ? item : item?.text || item?.description || JSON.stringify(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Transcript */}
      {(transcriptObj || plainTranscript) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setTranscriptExpanded(!transcriptExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <List className="w-4 h-4 text-green-500" />
              Full Transcript
            </h3>
            {transcriptExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {transcriptExpanded && (
            <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
              {transcriptObj && Array.isArray(transcriptObj) ? (
                transcriptObj.map((msg: any, i: number) => {
                  const isAgent = msg.role === 'agent' || msg.role === 'assistant';
                  return (
                    <div key={i} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                        isAgent
                          ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30'
                          : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isAgent ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {isAgent ? 'Agent' : 'Customer'}
                          </span>
                          {msg.timestamp != null && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              {typeof msg.timestamp === 'number'
                                ? `${Math.floor(msg.timestamp / 60)}:${String(Math.floor(msg.timestamp % 60)).padStart(2, '0')}`
                                : msg.timestamp
                              }
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{msg.content || msg.text || msg.message || ''}</p>
                      </div>
                    </div>
                  );
                })
              ) : plainTranscript ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {plainTranscript}
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Call notes */}
      {call.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Notes</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{call.notes}</p>
        </div>
      )}

      {/* Tags */}
      {call.tags && call.tags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {call.tags.map((tag: string, i: number) => (
              <span key={i} className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SMS SUB-TAB
   ═══════════════════════════════════════════════════════════ */

const SmsSubTab = ({ sms, smsLoading, fetchSmsUsageData, setSelectedOrg }: any) => {
  const [selectedSms, setSelectedSms] = useState<any>(null);

  return (
  <div className="space-y-4">
    {/* SMS Monthly Overview */}
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-green-600" />
          SMS Overview (This Month)
        </h3>
        <button onClick={fetchSmsUsageData} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${smsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Outbound</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{sms?.total_outbound_this_month || 0}</p>
        </div>
        <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Inbound</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{sms?.total_inbound_this_month || 0}</p>
        </div>
        <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Send className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{sms?.total_delivered_this_month || 0}</p>
        </div>
        <div className="px-3 py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Failed</span>
          </div>
          <p className={`text-2xl font-bold ${(sms?.total_failed_this_month || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {sms?.total_failed_this_month || 0}
          </p>
        </div>
      </div>
    </div>

    {/* SMS Usage by Organization */}
    {sms?.usage_by_org && sms.usage_by_org.length > 0 && (
      <Section title="SMS Usage by Organization" icon={MessageSquare} count={sms.usage_by_org.length}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tier</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Outbound</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-28">Out %</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Inbound</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-28">In %</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sms.usage_by_org.map((org: any, i: number) => {
                const outPct = Number(org.outbound_pct) || 0;
                const inPct = Number(org.inbound_pct) || 0;
                const outBarColor = outPct >= 100 ? 'bg-red-500' : outPct >= 80 ? 'bg-yellow-500' : 'bg-green-500';
                const inBarColor = inPct >= 100 ? 'bg-red-500' : inPct >= 80 ? 'bg-yellow-500' : 'bg-green-500';
                const tierLabel: Record<string, string> = { free: 'Free', business: 'Business', elite_premium: 'Elite', enterprise: 'Enterprise' };
                const tierColors: Record<string, string> = {
                  free: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                  business: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  elite_premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                  enterprise: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                };
                return (
                  <tr key={org.org_id || i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5">
                      <OrgLink name={org.org_name} orgId={org.org_id} setSelectedOrg={setSelectedOrg} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${tierColors[org.tier] || tierColors.free}`}>
                        {tierLabel[org.tier] || org.tier}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white text-right">
                      {org.outbound_count}/{org.outbound_limit === 99999 ? '\u221E' : org.outbound_limit}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${outBarColor}`} style={{ width: `${Math.min(outPct, 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 w-8 text-right">{outPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white text-right">
                      {org.inbound_count}/{org.inbound_limit === 99999 ? '\u221E' : org.inbound_limit}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${inBarColor}`} style={{ width: `${Math.min(inPct, 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 w-8 text-right">{inPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right">
                      {(org.failed_count || 0) > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">{org.failed_count}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">0</span>
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

    {/* Recent SMS Log */}
    {sms?.recent_sms && sms.recent_sms.length > 0 && (
      <Section title="Recent SMS Messages" icon={Send} count={sms.recent_sms.length}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Time</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Direction</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Recipient</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Message</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sms.recent_sms.map((msg: any, i: number) => (
                <tr
                  key={msg.id || i}
                  onClick={() => setSelectedSms(msg)}
                  className="hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatTime(msg.sent_at)}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400">{msg.org_name || '---'}</td>
                  <td className="px-4 py-2.5">
                    {msg.direction === 'inbound' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <ArrowDownLeft className="w-3 h-3" /> In
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <ArrowUpRight className="w-3 h-3" /> Out
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono text-gray-600 dark:text-gray-400">
                    {msg.customer_name?.trim() || msg.recipient_phone || '---'}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={msg.message_body}>
                    {msg.message_body?.substring(0, 60) || '---'}{msg.message_body?.length > 60 ? '...' : ''}
                  </td>
                  <td className="px-4 py-2.5">
                    <SmsBadge status={msg.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    )}

    {/* ── SMS Detail Modal ── */}
    {selectedSms && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedSms(null)}>
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-600" />
              SMS Details
            </h3>
            <button onClick={() => setSelectedSms(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Modal body */}
          <div className="p-5 space-y-4">
            {/* Direction + Status */}
            <div className="flex items-center gap-3">
              {selectedSms.direction === 'inbound' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  <ArrowDownLeft className="w-3 h-3" /> Inbound
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  <ArrowUpRight className="w-3 h-3" /> Outbound
                </span>
              )}
              <SmsBadge status={selectedSms.status} />
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Organization</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedSms.org_name || '---'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Sent At</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{formatFullDateTime(selectedSms.sent_at)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">From</p>
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{selectedSms.from_phone || selectedSms.sender_phone || '---'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">To</p>
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{selectedSms.recipient_phone || selectedSms.to_phone || '---'}</p>
              </div>
              {selectedSms.customer_name && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedSms.customer_name}</p>
                </div>
              )}
              {selectedSms.sms_type && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm capitalize text-gray-700 dark:text-gray-300">{selectedSms.sms_type?.replace(/_/g, ' ')}</p>
                </div>
              )}
            </div>

            {/* Full message body */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Message</p>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {selectedSms.message_body || 'No message content'}
                </p>
              </div>
            </div>

            {/* Twilio SID */}
            {selectedSms.twilio_sid && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Twilio SID</p>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">{selectedSms.twilio_sid}</p>
              </div>
            )}

            {/* Error info */}
            {selectedSms.error_message && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-100 dark:border-red-800/30">
                <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{selectedSms.error_message}</p>
                {selectedSms.error_code && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Code: {selectedSms.error_code}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* Clickable org name link */
const OrgLink = ({ name, orgId, setSelectedOrg }: { name?: string; orgId?: string; setSelectedOrg: any }) => {
  if (!name && !orgId) return <span className="text-sm text-gray-400 dark:text-gray-500">—</span>;
  if (!orgId) return <span className="text-sm font-medium text-gray-900 dark:text-white">{name || '—'}</span>;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedOrg(orgId, { title: name || 'Organization', alertType: 'info' });
      }}
      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
    >
      {name || orgId.slice(0, 8)}
    </button>
  );
};

/* Metadata item in call detail */
const MetaItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{label}</p>
    {children}
  </div>
);

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
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    ended: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
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

const SmsBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    queued: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    undelivered: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
      {status}
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
