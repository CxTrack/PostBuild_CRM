import { useEffect, useState, useCallback } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  Lock, Unlock, RefreshCw, Play, Clock, CheckCircle2,
  XCircle, AlertTriangle, Timer, Eye, Key, Zap,
  ChevronDown, ChevronRight, Download, Search
} from 'lucide-react';
import { getAuthToken, getSupabaseUrl } from '../../utils/auth.utils';
import { logAdminAction } from '../../utils/adminAudit';
import toast from 'react-hot-toast';

// ── Types ───────────────────────────────────────────────────────────────────

interface RlsEntry {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
}

interface SecretRotation {
  secret_name: string;
  rotated_at: string;
  notes: string | null;
}

interface FailedAuth {
  last_24h: number;
  last_7d: number;
  last_30d: number;
  recent_failures: Array<{
    id: string;
    created_at: string;
    ip_address: string;
    action: string;
    error_msg: string;
  }>;
}

interface AdminInfo {
  user_id: string;
  is_admin: boolean;
  admin_access_level: string;
  created_at: string;
}

interface SecurityReport {
  scan_timestamp: string;
  scanned_by: string;
  rls_coverage: RlsEntry[];
  rls_error: string | null;
  secret_rotations: SecretRotation[];
  secret_rotation_error: string | null;
  failed_auth: FailedAuth;
  failed_auth_error: string | null;
  active_admins: { count: number; admins: AdminInfo[] };
}

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  command: string;
  active: boolean;
  database: string;
}

interface CronRunDetail {
  runid: number;
  jobid: number;
  status: string;
  return_message: string;
  start_time: string;
  end_time: string;
}

// ── Edge Function Data ──────────────────────────────────────────────────────

const EDGE_FUNCTIONS = [
  { name: 'copilot-chat', jwt: false, purpose: 'AI CoPilot proxy', api: 'OpenRouter' },
  { name: 'receipt-scan', jwt: false, purpose: 'Receipt OCR (vision)', api: 'OpenRouter' },
  { name: 'ocr-extract', jwt: true, purpose: 'Business card OCR', api: 'Google Vision' },
  { name: 'provision-voice-agent', jwt: false, purpose: 'Phone + agent provisioning', api: 'Retell + Twilio' },
  { name: 'list-voices', jwt: false, purpose: 'List available voices', api: 'Retell' },
  { name: 'update-retell-agent', jwt: false, purpose: 'Sync agent settings', api: 'Retell' },
  { name: 'manage-knowledge-base', jwt: false, purpose: 'KB CRUD', api: 'Retell' },
  { name: 'manage-phone-numbers', jwt: false, purpose: 'Phone release/management', api: 'Retell + Twilio' },
  { name: 'retell-webhook', jwt: false, purpose: 'Call events + summaries (Retell signature verified)', api: 'Retell + Twilio' },
  { name: 'send-invitation', jwt: false, purpose: 'Team invitation emails', api: 'Resend' },
  { name: 'send-sms', jwt: true, purpose: 'Outbound SMS (org membership enforced)', api: 'Twilio' },
  { name: 'receive-sms', jwt: false, purpose: 'Inbound SMS webhook (Twilio signature verified)', api: 'Twilio' },
  { name: 'configure-sms-webhooks', jwt: false, purpose: 'Auto-configure Twilio SMS webhooks', api: 'Twilio' },
  { name: 'send-reopt-email', jwt: false, purpose: 'SMS re-opt-in emails', api: 'Resend' },
  { name: 'chat-cleanup', jwt: true, purpose: 'Stale conversation cleanup (admin/cron)', api: 'Internal' },
  { name: 'sms-opt-out', jwt: false, purpose: 'Public SMS opt-out (customer-org verified)', api: 'Internal' },
  { name: 'make-call', jwt: true, purpose: 'Outbound calls (org membership enforced)', api: 'Twilio' },
  { name: 'stripe-billing', jwt: false, purpose: 'Subscription management', api: 'Stripe' },
  { name: 'stripe-checkout', jwt: false, purpose: 'Checkout sessions', api: 'Stripe' },
  { name: 'admin-deactivate-org', jwt: false, purpose: 'Org deactivation flow', api: 'Stripe + Twilio + Resend' },
  { name: 'admin-security-scan', jwt: true, purpose: 'On-demand security audit', api: 'Internal' },
  { name: 'admin-cron-status', jwt: true, purpose: 'Cron job monitoring', api: 'Internal' },
  { name: 'admin-health-check', jwt: true, purpose: 'Service health checks', api: 'Internal' },
  { name: 'admin-code-quality', jwt: true, purpose: 'Netlify deploy stats', api: 'Netlify' },
];

const API_SECRETS = [
  { name: 'OPENROUTER_API_KEY', service: 'OpenRouter (AI)', usedBy: 'copilot-chat, receipt-scan' },
  { name: 'RETELL_API_KEY', service: 'Retell AI (Voice)', usedBy: 'provision-voice-agent, list-voices, update-retell-agent, manage-knowledge-base, retell-webhook' },
  { name: 'TWILIO_MASTER_ACCOUNT_SID', service: 'Twilio (Phone/SMS)', usedBy: 'provision-voice-agent, retell-webhook, send-sms, receive-sms, configure-sms-webhooks' },
  { name: 'TWILIO_MASTER_AUTH_TOKEN', service: 'Twilio (Phone/SMS)', usedBy: 'provision-voice-agent, retell-webhook, send-sms, receive-sms, configure-sms-webhooks' },
  { name: 'GOOGLE_CLOUD_VISION_API_KEY', service: 'Google Vision (OCR)', usedBy: 'ocr-extract' },
  { name: 'RESEND_API_KEY', service: 'Resend (Email)', usedBy: 'send-invitation' },
  { name: 'TWILIO_SIP_TRUNK_SID', service: 'Twilio SIP Trunk', usedBy: 'provision-voice-agent' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

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

const daysSince = (dateStr: string): number => {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

const cronToHuman = (schedule: string): string => {
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  const [min, hour, dom, mon, dow] = parts;
  if (dom === '*' && mon === '*' && dow === '*') {
    if (hour === '*') return `Every ${min === '*/5' ? '5 mins' : min === '*/15' ? '15 mins' : min + ' mins'}`;
    return `Daily at ${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
  }
  if (dow !== '*') return `Weekly (${dow}) at ${hour}:${min} UTC`;
  return schedule;
};

// ── Component ───────────────────────────────────────────────────────────────

export const SecurityHealthTab = () => {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [cronRuns, setCronRuns] = useState<CronRunDetail[]>([]);
  const [scanning, setScanning] = useState(false);
  const [loadingCron, setLoadingCron] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedCronJob, setExpandedCronJob] = useState<number | null>(null);

  // Load cron status on mount
  useEffect(() => {
    fetchCronStatus();
  }, []);

  const runSecurityScan = useCallback(async () => {
    setScanning(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${getSupabaseUrl()}/functions/v1/admin-security-scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Scan failed (${res.status})`);
      setReport(data.report);
      setLastScan(data.report.scan_timestamp);
      toast.success('Security scan complete');
    } catch (err: any) {
      console.error('[SecurityHealthTab] Scan error:', err);
      toast.error(err.message || 'Security scan failed');
    } finally {
      setScanning(false);
    }
  }, []);

  const fetchCronStatus = useCallback(async () => {
    setLoadingCron(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${getSupabaseUrl()}/functions/v1/admin-cron-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Cron fetch failed (${res.status})`);
      setCronJobs(data.jobs || []);
      setCronRuns(data.run_details || []);
    } catch (err: any) {
      console.error('[SecurityHealthTab] Cron error:', err);
      toast.error(err.message || 'Failed to load cron status');
    } finally {
      setLoadingCron(false);
    }
  }, []);

  const triggerCronManually = useCallback(async (job: CronJob) => {
    // Extract edge function URL from the cron command
    const urlMatch = job.command.match(/url\s*:=\s*'([^']+)'/);
    if (!urlMatch) {
      toast.error('Could not extract function URL from cron command');
      return;
    }
    const functionUrl = urlMatch[1];
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Trigger failed (${res.status})`);
      toast.success(`Triggered "${job.jobname}" successfully`);
      logAdminAction({
        action: 'cron_manual_trigger',
        category: 'cron',
        target_type: 'cron_job',
        target_id: String(job.jobid),
        details: { jobname: job.jobname, function_url: functionUrl },
      });
      // Refresh cron status after a short delay
      setTimeout(fetchCronStatus, 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger cron job');
    }
  }, [fetchCronStatus]);

  // Compute summary metrics from report
  const rlsStats = report ? {
    total: report.rls_coverage.length,
    protected: report.rls_coverage.filter(r => r.rls_enabled && r.policy_count > 0).length,
    exposed: report.rls_coverage.filter(r => !r.rls_enabled).length,
    noPolicy: report.rls_coverage.filter(r => r.rls_enabled && r.policy_count === 0).length,
  } : null;

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'rls', label: 'RLS Coverage' },
    { id: 'functions', label: 'Edge Functions' },
    { id: 'secrets', label: 'API Secrets' },
    { id: 'auth', label: 'Auth Failures' },
    { id: 'cron', label: 'Cron Jobs' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-1.5">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeSection === s.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Scan Button + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={runSecurityScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {scanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {scanning ? 'Scanning...' : 'Run Security Scan'}
          </button>
          {lastScan && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last scan: {formatTimeAgo(lastScan)}
            </span>
          )}
        </div>
        {report && rlsStats && (
          <div className="hidden md:flex items-center gap-4">
            <SummaryBadge icon={<ShieldCheck className="w-3.5 h-3.5" />} label="RLS Protected" value={rlsStats.protected} color="green" />
            <SummaryBadge icon={<ShieldX className="w-3.5 h-3.5" />} label="No RLS" value={rlsStats.exposed} color="red" />
            <SummaryBadge icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Failed Auth (24h)" value={report.failed_auth.last_24h} color="yellow" />
            <SummaryBadge icon={<Shield className="w-3.5 h-3.5" />} label="Admins" value={report.active_admins.count} color="purple" />
          </div>
        )}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <>
          {!report ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No security scan results yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Click "Run Security Scan" to check your platform's security posture</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={<ShieldCheck className="w-5 h-5 text-green-500" />}
                label="RLS Protected Tables"
                value={`${rlsStats!.protected}/${rlsStats!.total}`}
                sub={`${Math.round((rlsStats!.protected / Math.max(rlsStats!.total, 1)) * 100)}% coverage`}
                color="green"
              />
              <StatCard
                icon={<ShieldX className="w-5 h-5 text-red-500" />}
                label="Tables Without RLS"
                value={String(rlsStats!.exposed)}
                sub={rlsStats!.exposed === 0 ? 'All tables secured' : 'Needs attention'}
                color={rlsStats!.exposed === 0 ? 'green' : 'red'}
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
                label="Failed Logins (30d)"
                value={String(report.failed_auth.last_30d)}
                sub={`${report.failed_auth.last_24h} in last 24h`}
                color={report.failed_auth.last_24h > 10 ? 'red' : 'yellow'}
              />
              <StatCard
                icon={<Shield className="w-5 h-5 text-purple-500" />}
                label="Active Admins"
                value={String(report.active_admins.count)}
                sub="Platform administrators"
                color="purple"
              />
            </div>
          )}
        </>
      )}

      {/* RLS Coverage Section */}
      {activeSection === 'rls' && report && (
        <RlsCoveragePanel entries={report.rls_coverage} error={report.rls_error} />
      )}
      {activeSection === 'rls' && !report && <ScanPrompt />}

      {/* Edge Functions Section */}
      {activeSection === 'functions' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            Edge Functions ({EDGE_FUNCTIONS.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {EDGE_FUNCTIONS.map((fn) => (
              <div key={fn.name} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate">{fn.name}</span>
                  <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    fn.jwt
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {fn.jwt ? 'JWT' : 'Internal'}
                  </span>
                </div>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium shrink-0 ml-2">{fn.api}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            "JWT" = requires valid user JWT in Authorization header. "Internal" = uses webhook signatures, API keys, or service-role auth.
          </p>
        </div>
      )}

      {/* API Secrets Section */}
      {activeSection === 'secrets' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-orange-600" />
              API Secrets (Stored in Supabase Vault)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Secret Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Service</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Used By</th>
                    {report && <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Rotated</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {API_SECRETS.map((secret) => {
                    const rotation = report?.secret_rotations.find(r => r.secret_name === secret.name);
                    const daysOld = rotation ? daysSince(rotation.rotated_at) : null;
                    return (
                      <tr key={secret.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-3 py-2">
                          <span className="text-sm font-mono text-gray-900 dark:text-white">{secret.name}</span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{secret.service}</td>
                        <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">{secret.usedBy}</td>
                        {report && (
                          <td className="px-3 py-2">
                            {rotation ? (
                              <span className={`text-xs font-medium ${
                                daysOld! > 90 ? 'text-red-600 dark:text-red-400' :
                                daysOld! > 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-green-600 dark:text-green-400'
                              }`}>
                                {daysOld}d ago
                                {daysOld! > 90 && ' (overdue)'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Not tracked</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Auth Failures Section */}
      {activeSection === 'auth' && report && (
        <FailedAuthPanel data={report.failed_auth} error={report.failed_auth_error} />
      )}
      {activeSection === 'auth' && !report && <ScanPrompt />}

      {/* Cron Jobs Section */}
      {activeSection === 'cron' && (
        <CronJobsPanel
          jobs={cronJobs}
          runs={cronRuns}
          loading={loadingCron}
          onRefresh={fetchCronStatus}
          onTrigger={triggerCronManually}
          expandedJob={expandedCronJob}
          onToggleExpand={(id) => setExpandedCronJob(expandedCronJob === id ? null : id)}
        />
      )}
    </div>
  );
};

// ── Sub-Components ──────────────────────────────────────────────────────────

const ScanPrompt = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
    <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
    <p className="text-sm text-gray-500 dark:text-gray-400">Run a security scan first to see this data</p>
  </div>
);

const SummaryBadge = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => {
  const colors: Record<string, string> = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={colors[color]}>{icon}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}:</span>
      <span className={`text-sm font-bold ${colors[color]}`}>{value}</span>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) => {
  const bgColors: Record<string, string> = {
    green: 'border-green-200 dark:border-green-800/30',
    red: 'border-red-200 dark:border-red-800/30',
    yellow: 'border-yellow-200 dark:border-yellow-800/30',
    purple: 'border-purple-200 dark:border-purple-800/30',
  };
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border ${bgColors[color] || 'border-gray-200 dark:border-gray-700'} p-4`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span></div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
};

// ── RLS Coverage Panel ──────────────────────────────────────────────────────

const RlsCoveragePanel = ({ entries, error }: { entries: RlsEntry[]; error: string | null }) => {
  const [filter, setFilter] = useState<'all' | 'protected' | 'exposed' | 'no-policy'>('all');

  const filtered = entries.filter(e => {
    if (filter === 'protected') return e.rls_enabled && e.policy_count > 0;
    if (filter === 'exposed') return !e.rls_enabled;
    if (filter === 'no-policy') return e.rls_enabled && e.policy_count === 0;
    return true;
  });

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-400">RLS check error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-green-600" />
          Row Level Security Coverage ({entries.length} tables)
        </h3>
        <div className="flex gap-1">
          {(['all', 'protected', 'exposed', 'no-policy'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-[10px] font-medium rounded ${
                filter === f
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'protected' ? 'Protected' : f === 'exposed' ? 'No RLS' : 'No Policies'}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filtered.map(entry => (
          <div key={entry.table_name} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30">
            <div className="flex items-center gap-2">
              {entry.rls_enabled && entry.policy_count > 0 ? (
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              ) : entry.rls_enabled ? (
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className="text-sm font-mono text-gray-900 dark:text-white">{entry.table_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                entry.rls_enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {entry.rls_enabled ? 'RLS ON' : 'RLS OFF'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {entry.policy_count} {entry.policy_count === 1 ? 'policy' : 'policies'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Failed Auth Panel ───────────────────────────────────────────────────────

const FailedAuthPanel = ({ data, error }: { data: FailedAuth; error: string | null }) => {
  if (error) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-700 dark:text-yellow-400">Auth log check: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.last_24h}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Last 24 hours</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.last_7d}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.last_30d}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Last 30 days</p>
        </div>
      </div>

      {data.recent_failures.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Recent Failed Attempts</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {data.recent_failures.map((f, i) => (
              <div key={f.id || i} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{f.action}</span>
                  {f.ip_address && <span className="text-[10px] text-gray-400 font-mono">{f.ip_address}</span>}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(f.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Cron Jobs Panel ─────────────────────────────────────────────────────────

const CronJobsPanel = ({ jobs, runs, loading, onRefresh, onTrigger, expandedJob, onToggleExpand }: {
  jobs: CronJob[];
  runs: CronRunDetail[];
  loading: boolean;
  onRefresh: () => void;
  onTrigger: (job: CronJob) => void;
  expandedJob: number | null;
  onToggleExpand: (id: number) => void;
}) => {
  const getJobRuns = (jobId: number) => runs.filter(r => r.jobid === jobId).slice(0, 10);

  const getJobHealth = (jobId: number): 'green' | 'yellow' | 'red' => {
    const jobRuns = getJobRuns(jobId);
    if (jobRuns.length === 0) return 'yellow';
    const lastRun = jobRuns[0];
    if (lastRun.status === 'failed') return 'red';
    const consecutiveFails = jobRuns.findIndex(r => r.status !== 'failed');
    if (consecutiveFails >= 2) return 'red';
    return 'green';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Timer className="w-4 h-4 text-blue-600" />
          Scheduled Jobs ({jobs.length})
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="h-24 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No cron jobs configured</p>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => {
            const health = getJobHealth(job.jobid);
            const jobRuns = getJobRuns(job.jobid);
            const isExpanded = expandedJob === job.jobid;

            return (
              <div key={job.jobid} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  onClick={() => onToggleExpand(job.jobid)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      health === 'green' ? 'bg-green-500' : health === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{job.jobname || `Job #${job.jobid}`}</span>
                      <span className="text-xs text-gray-400 ml-2">{cronToHuman(job.schedule)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      job.active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {job.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onTrigger(job); }}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      title="Trigger manually"
                    >
                      <Play className="w-3 h-3" /> Run Now
                    </button>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-700/20">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1.5">Recent Runs</p>
                    {jobRuns.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">No run history available</p>
                    ) : (
                      <div className="space-y-1">
                        {jobRuns.map(run => (
                          <div key={run.runid} className="flex items-center justify-between px-2 py-1 rounded text-xs">
                            <div className="flex items-center gap-2">
                              {run.status === 'succeeded' ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                              <span className={run.status === 'succeeded' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                {run.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                              {run.start_time && run.end_time && (
                                <span>{Math.round((new Date(run.end_time).getTime() - new Date(run.start_time).getTime()) / 1000)}s</span>
                              )}
                              <span>{run.start_time ? formatTimeAgo(run.start_time) : 'Unknown'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Command preview */}
                    <details className="mt-2">
                      <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">Show command</summary>
                      <pre className="mt-1 text-[10px] font-mono text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-all bg-gray-100 dark:bg-gray-800 rounded p-2 max-h-32 overflow-auto">
                        {job.command}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
