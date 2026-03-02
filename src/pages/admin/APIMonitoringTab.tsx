import { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle, Clock, DollarSign,
  Zap, CheckCircle, XCircle, ChevronRight, ArrowLeft,
  Copy, ExternalLink, RefreshCw, TrendingUp, Activity,
  Shield, Heart, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { useAdminStore, type ApiErrorDetail, type PerformanceTrend, type SlaStatus } from '../../stores/adminStore';

type SubView = 'overview' | 'trends' | 'costs' | 'health';

const SUB_VIEW_TABS: { key: SubView; label: string; icon: any }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'trends', label: 'Performance Trends', icon: TrendingUp },
  { key: 'costs', label: 'Cost Analysis', icon: DollarSign },
  { key: 'health', label: 'Health Check', icon: Heart },
];

const SERVICE_INFO: Record<string, { label: string; color: string; icon: string }> = {
  openrouter: { label: 'OpenRouter (AI)', color: 'purple', icon: '🤖' },
  retell: { label: 'Retell AI (Voice)', color: 'blue', icon: '🎙️' },
  twilio: { label: 'Twilio (Phone/SMS)', color: 'green', icon: '📱' },
  google_vision: { label: 'Google Vision (OCR)', color: 'orange', icon: '📸' },
  resend: { label: 'Resend (Email)', color: 'teal', icon: '📧' },
  stripe: { label: 'Stripe (Payments)', color: 'indigo', icon: '💳' },
};

const formatCost = (cents: number) => {
  if (cents >= 100) return `$${(cents / 100).toFixed(2)}`;
  return `${cents.toFixed(1)}¢`;
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/** Try to extract a concise human-readable message from potentially nested JSON error strings */
const parseErrorMessage = (raw: string | null): string => {
  if (!raw) return 'No error message recorded';
  try {
    const parsed = JSON.parse(raw);
    // Nested JSON from Google, Retell, etc.
    if (parsed?.error?.message) return parsed.error.message;
    if (parsed?.message) return parsed.message;
    if (parsed?.error && typeof parsed.error === 'string') return parsed.error;
    return raw.slice(0, 500);
  } catch {
    return raw.slice(0, 500);
  }
};

const statusLabel = (code: number) => {
  if (code === 400) return 'Bad Request';
  if (code === 401) return 'Unauthorized';
  if (code === 403) return 'Forbidden';
  if (code === 404) return 'Not Found';
  if (code === 429) return 'Rate Limited';
  if (code === 500) return 'Internal Server Error';
  if (code === 502) return 'Bad Gateway';
  if (code === 503) return 'Service Unavailable';
  return `Error ${code}`;
};

// ---------------------------------------------------------------------------
// Error Detail Panel (shown when user clicks a service card with errors)
// ---------------------------------------------------------------------------
const ErrorDetailPanel = ({
  serviceName,
  serviceLabel,
  serviceIcon,
  onBack,
}: {
  serviceName: string;
  serviceLabel: string;
  serviceIcon: string;
  onBack: () => void;
}) => {
  const { apiErrorDetails, loading, fetchApiErrorDetails } = useAdminStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApiErrorDetails(serviceName);
  }, [serviceName]);

  const isLoading = loading.apiErrorDetails;
  const errors = apiErrorDetails.filter((e) => e.service_name === serviceName);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to API Overview
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{serviceIcon}</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{serviceLabel} Errors</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {errors.length} error{errors.length !== 1 ? 's' : ''} in last 30 days
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchApiErrorDetails(serviceName)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && errors.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">No errors found</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {serviceLabel} has been running without errors in the selected time range.
          </p>
        </div>
      )}

      {/* Error list */}
      {!isLoading && errors.length > 0 && (
        <div className="space-y-3">
          {errors.map((err) => {
            const isExpanded = expandedId === err.id;
            const parsedMsg = parseErrorMessage(err.error_message);
            return (
              <div
                key={err.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all"
              >
                {/* Clickable summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : err.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded ${
                          err.status_code >= 500
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {err.status_code}
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {statusLabel(err.status_code)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {err.method || 'POST'} {err.endpoint}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {parsedMsg}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {timeAgo(err.created_at)}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50 space-y-3">
                    {/* Timestamp + response time */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">Timestamp</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(err.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">Response Time</span>
                        <span className="font-medium text-gray-900 dark:text-white">{err.response_time_ms}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">Organization</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {err.organization_name || err.organization_id?.slice(0, 8) || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">User</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {err.user_email || err.user_id?.slice(0, 8) || 'System'}
                        </span>
                      </div>
                    </div>

                    {/* Full error message */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Error Message</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(err.error_message || parsedMsg, err.id);
                          }}
                          className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                        >
                          {copiedId === err.id ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono">
                        {err.error_message || 'No error message recorded'}
                      </pre>
                    </div>

                    {/* Metadata if present */}
                    {err.metadata && Object.keys(err.metadata).length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Metadata</span>
                        <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-32 overflow-y-auto font-mono">
                          {JSON.stringify(err.metadata, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Copy all for sharing */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const report = [
                          `Service: ${serviceLabel}`,
                          `Status: ${err.status_code} ${statusLabel(err.status_code)}`,
                          `Endpoint: ${err.method || 'POST'} ${err.endpoint}`,
                          `Time: ${new Date(err.created_at).toLocaleString()}`,
                          `Response: ${err.response_time_ms}ms`,
                          `Org: ${err.organization_name || err.organization_id || 'N/A'}`,
                          `User: ${err.user_email || err.user_id || 'System'}`,
                          ``,
                          `Error:`,
                          err.error_message || 'No error message',
                          err.metadata ? `\nMetadata:\n${JSON.stringify(err.metadata, null, 2)}` : '',
                        ].join('\n');
                        handleCopy(report, `full-${err.id}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {copiedId === `full-${err.id}` ? 'Copied full report!' : 'Copy full error report'}
                    </button>
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

// ---------------------------------------------------------------------------
// Main Tab
// ---------------------------------------------------------------------------
export const APIMonitoringTab = () => {
  const { apiUsage, slaStatus, loading, fetchApiUsage, fetchSlaStatus } = useAdminStore();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [activeSubView, setActiveSubView] = useState<SubView>('overview');

  useEffect(() => {
    fetchApiUsage();
    fetchSlaStatus();
  }, []);

  const isLoading = loading.apiUsage;

  // If a service is selected (error drill-down), show the detail panel
  if (selectedService === '_all') {
    return (
      <AllErrorsPanel
        onSelectService={(svc) => setSelectedService(svc || null)}
      />
    );
  }

  if (selectedService) {
    const info = SERVICE_INFO[selectedService];
    return (
      <ErrorDetailPanel
        serviceName={selectedService}
        serviceLabel={info?.label || selectedService}
        serviceIcon={info?.icon || '🔌'}
        onBack={() => setSelectedService(null)}
      />
    );
  }

  // Build SLA lookup for service cards
  const slaLookup = useMemo(() => {
    const map: Record<string, SlaStatus> = {};
    slaStatus.forEach((s) => { map[s.service_name] = s; });
    return map;
  }, [slaStatus]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Sub-view navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
        {SUB_VIEW_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSubView(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeSubView === key
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Sub-view content */}
      {activeSubView === 'overview' && (
        <OverviewPanel
          apiUsage={apiUsage}
          slaLookup={slaLookup}
          isLoading={isLoading}
          onSelectService={setSelectedService}
        />
      )}
      {activeSubView === 'trends' && <PerformanceTrendsPanel />}
      {activeSubView === 'costs' && <CostAnalysisPanel />}
      {activeSubView === 'health' && <HealthCheckPanel />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Overview Panel (the original content, extracted)
// ---------------------------------------------------------------------------
const OverviewPanel = ({
  apiUsage,
  slaLookup,
  isLoading,
  onSelectService,
}: {
  apiUsage: any[];
  slaLookup: Record<string, SlaStatus>;
  isLoading: boolean;
  onSelectService: (svc: string | null) => void;
}) => {
  const totalCalls = apiUsage.reduce((s, a) => s + Number(a.total_calls), 0);
  const totalErrors = apiUsage.reduce((s, a) => s + Number(a.error_count), 0);
  const totalCost = apiUsage.reduce((s, a) => s + Number(a.total_cost_cents), 0);
  const avgResponseMs = apiUsage.length > 0
    ? Math.round(apiUsage.reduce((s, a) => s + Number(a.avg_response_ms), 0) / apiUsage.length)
    : 0;

  const chartData = apiUsage.map((a) => ({
    ...a,
    name: SERVICE_INFO[a.service_name]?.label || a.service_name,
  }));

  const allServices = Object.entries(SERVICE_INFO).map(([key, info]) => {
    const usage = apiUsage.find((a) => a.service_name === key);
    return { key, ...info, usage };
  });

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total API Calls"
          value={totalCalls.toLocaleString()}
          icon={Zap}
          color="purple"
          loading={isLoading}
          onClick={totalErrors > 0 ? () => onSelectService('_all') : undefined}
        />
        <SummaryCard
          label="Total Errors"
          value={totalErrors.toLocaleString()}
          icon={AlertTriangle}
          color={totalErrors > 0 ? 'red' : 'green'}
          loading={isLoading}
          onClick={totalErrors > 0 ? () => onSelectService('_all') : undefined}
          hint={totalErrors > 0 ? 'Click to view' : undefined}
        />
        <SummaryCard label="Avg Response" value={`${avgResponseMs}ms`} icon={Clock} color="blue" loading={isLoading} />
        <SummaryCard label="Est. Cost (30d)" value={formatCost(totalCost)} icon={DollarSign} color="orange" loading={isLoading} />
      </div>

      {/* Service Cards Grid with SLA badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allServices.map((svc) => {
          const hasErrors = svc.usage && Number(svc.usage.error_count) > 0;
          const sla = slaLookup[svc.key];
          return (
            <div
              key={svc.key}
              onClick={hasErrors ? () => onSelectService(svc.key) : undefined}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all ${
                hasErrors
                  ? 'cursor-pointer hover:border-red-400 dark:hover:border-red-500 hover:shadow-md hover:shadow-red-500/10 group'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{svc.icon}</span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{svc.label}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* SLA badge */}
                  {sla && sla.total_calls > 0 && (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded ${
                      sla.overall_ok
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      <Shield className="w-2.5 h-2.5" />
                      {sla.overall_ok ? 'SLA OK' : 'SLA'}
                    </span>
                  )}
                  {svc.usage ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      Number(svc.usage.error_rate) > 5
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {Number(svc.usage.error_rate) > 5 ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {Number(svc.usage.error_rate) > 5 ? 'Issues' : 'Healthy'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      No data
                    </span>
                  )}
                </div>
              </div>
              {svc.usage ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Calls</span>
                    <span className="font-bold text-gray-900 dark:text-white">{Number(svc.usage.total_calls).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Errors</span>
                    <span className={`font-bold ${Number(svc.usage.error_count) > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                      {Number(svc.usage.error_count)} ({svc.usage.error_rate}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg Response</span>
                    <span className="font-medium text-gray-900 dark:text-white">{Math.round(Number(svc.usage.avg_response_ms))}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Cost</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCost(Number(svc.usage.total_cost_cents))}</span>
                  </div>
                  {Number(svc.usage.total_tokens) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tokens</span>
                      <span className="font-medium text-gray-900 dark:text-white">{Number(svc.usage.total_tokens).toLocaleString()}</span>
                    </div>
                  )}
                  {hasErrors && (
                    <div className="flex items-center justify-center gap-1 pt-1 text-xs text-red-500 dark:text-red-400 opacity-70 group-hover:opacity-100 transition-opacity">
                      <AlertTriangle className="w-3 h-3" />
                      Click to view error details
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  No API calls tracked yet. Data will appear after edge function instrumentation.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* API Calls Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">API Call Volume by Service</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="total_calls" name="Total Calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="error_count" name="Errors" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Edge Functions Reference */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Instrumented Edge Functions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { name: 'copilot-chat', api: 'OpenRouter', purpose: 'AI CoPilot proxy' },
            { name: 'make-outbound-call', api: 'Retell', purpose: 'Outbound AI calls' },
            { name: 'make-call', api: 'Twilio', purpose: 'Voice calls' },
            { name: 'send-sms', api: 'Twilio', purpose: 'SMS notifications' },
            { name: 'ocr-extract', api: 'Google Vision', purpose: 'Business card OCR' },
            { name: 'send-reopt-email', api: 'Resend', purpose: 'Re-opt-in emails' },
            { name: 'retell-webhook', api: 'Retell + OpenRouter', purpose: 'Call events + analysis' },
            { name: 'retell-function-handler', api: 'Retell + Cal.com', purpose: 'Agent tool execution' },
            { name: 'receipt-scan', api: 'OpenRouter', purpose: 'Receipt OCR (vision)' },
            { name: 'provision-voice-agent', api: 'Retell + Twilio', purpose: 'Phone + agent provisioning' },
          ].map((fn) => (
            <div key={fn.name} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div>
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">{fn.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{fn.purpose}</span>
              </div>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{fn.api}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// All-errors panel (when user clicks "Total Errors" card)
// ---------------------------------------------------------------------------
const AllErrorsPanel = ({ onSelectService }: { onSelectService: (svc: string) => void }) => {
  const { apiErrorDetails, loading, fetchApiErrorDetails } = useAdminStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApiErrorDetails(undefined); // all services
  }, []);

  const isLoading = loading.apiErrorDetails;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group errors by service for summary
  const byService = apiErrorDetails.reduce<Record<string, ApiErrorDetail[]>>((acc, err) => {
    (acc[err.service_name] = acc[err.service_name] || []).push(err);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <button
        onClick={() => onSelectService('')}
        className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to API Overview
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">All API Errors</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {apiErrorDetails.length} error{apiErrorDetails.length !== 1 ? 's' : ''} across all services in last 30 days
          </p>
        </div>
        <button
          onClick={() => fetchApiErrorDetails(undefined)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Service breakdown chips */}
      {!isLoading && Object.keys(byService).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byService).map(([svc, errs]) => {
            const info = SERVICE_INFO[svc];
            return (
              <button
                key={svc}
                onClick={() => onSelectService(svc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <span>{info?.icon || '🔌'}</span>
                {info?.label || svc}: {errs.length}
                <ChevronRight className="w-3 h-3" />
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error list */}
      {!isLoading && apiErrorDetails.length > 0 && (
        <div className="space-y-3">
          {apiErrorDetails.map((err) => {
            const isExpanded = expandedId === err.id;
            const parsedMsg = parseErrorMessage(err.error_message);
            const info = SERVICE_INFO[err.service_name];
            return (
              <div key={err.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : err.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm">{info?.icon || '🔌'}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded ${
                          err.status_code >= 500
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {err.status_code}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {err.method || 'POST'} {err.endpoint}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white truncate">{parsedMsg}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {timeAgo(err.created_at)}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">Timestamp</span>
                        <span className="font-medium text-gray-900 dark:text-white">{new Date(err.created_at).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">Response Time</span>
                        <span className="font-medium text-gray-900 dark:text-white">{err.response_time_ms}ms</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">Organization</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {err.organization_name || err.organization_id?.slice(0, 8) || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">User</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {err.user_email || err.user_id?.slice(0, 8) || 'System'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Error Message</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(err.error_message || parsedMsg, err.id);
                          }}
                          className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                        >
                          {copiedId === err.id ? <><CheckCircle className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                      <pre className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono">
                        {err.error_message || 'No error message recorded'}
                      </pre>
                    </div>
                    {err.metadata && Object.keys(err.metadata).length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Metadata</span>
                        <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-32 overflow-y-auto font-mono">
                          {JSON.stringify(err.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const report = [
                          `Service: ${info?.label || err.service_name}`,
                          `Status: ${err.status_code} ${statusLabel(err.status_code)}`,
                          `Endpoint: ${err.method || 'POST'} ${err.endpoint}`,
                          `Time: ${new Date(err.created_at).toLocaleString()}`,
                          `Response: ${err.response_time_ms}ms`,
                          `Org: ${err.organization_name || err.organization_id || 'N/A'}`,
                          `User: ${err.user_email || err.user_id || 'System'}`,
                          ``,
                          `Error:`,
                          err.error_message || 'No error message',
                          err.metadata ? `\nMetadata:\n${JSON.stringify(err.metadata, null, 2)}` : '',
                        ].join('\n');
                        handleCopy(report, `full-${err.id}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {copiedId === `full-${err.id}` ? 'Copied full report!' : 'Copy full error report'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && apiErrorDetails.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">All clear</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No API errors in the last 30 days.</p>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------
const colorMap: Record<string, string> = {
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
};

const SummaryCard = ({ label, value, icon: Icon, color, loading, onClick, hint }: {
  label: string; value: string; icon: any; color: string; loading?: boolean; onClick?: () => void; hint?: string;
}) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${
      onClick ? 'cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all' : ''
    }`}
  >
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.purple}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
    {loading ? (
      <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    ) : (
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    )}
    {hint && !loading && (
      <p className="text-[10px] text-purple-500 dark:text-purple-400 mt-1 flex items-center gap-1">
        {hint} <ChevronRight className="w-3 h-3" />
      </p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Performance Trends Panel
// ---------------------------------------------------------------------------
const TREND_COLORS: Record<string, string> = {
  openrouter: '#a855f7',
  retell: '#3b82f6',
  twilio: '#22c55e',
  google_vision: '#f97316',
  resend: '#14b8a6',
  stripe: '#6366f1',
};

const PerformanceTrendsPanel = () => {
  const { performanceTrends, loading, fetchPerformanceTrends } = useAdminStore();
  const [days, setDays] = useState(30);
  const [bucket, setBucket] = useState('day');
  const [selectedMetric, setSelectedMetric] = useState<'p50' | 'p95' | 'p99'>('p95');
  const [filterService, setFilterService] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceTrends(days, bucket);
  }, [days, bucket]);

  const isLoading = loading.performanceTrends;

  // Get unique services
  const services = useMemo(() => {
    const set = new Set(performanceTrends.map((t) => t.service_name));
    return Array.from(set).sort();
  }, [performanceTrends]);

  // Group data by bucket for the chart
  const chartData = useMemo(() => {
    const filtered = filterService
      ? performanceTrends.filter((t) => t.service_name === filterService)
      : performanceTrends;

    const bucketMap: Record<string, Record<string, number>> = {};
    filtered.forEach((t) => {
      const key = t.bucket;
      if (!bucketMap[key]) bucketMap[key] = {};
      const metricKey = selectedMetric === 'p50' ? 'p50_response_ms'
        : selectedMetric === 'p99' ? 'p99_response_ms' : 'p95_response_ms';
      bucketMap[key][t.service_name] = Math.round(Number(t[metricKey]));
    });

    return Object.entries(bucketMap)
      .map(([b, vals]) => ({
        bucket: new Date(b).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...vals,
      }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));
  }, [performanceTrends, filterService, selectedMetric]);

  // Summary stats per service
  const serviceStats = useMemo(() => {
    const map: Record<string, { calls: number; errors: number; avgMs: number; p95Ms: number; cost: number }> = {};
    performanceTrends.forEach((t) => {
      if (!map[t.service_name]) map[t.service_name] = { calls: 0, errors: 0, avgMs: 0, p95Ms: 0, cost: 0 };
      map[t.service_name].calls += Number(t.total_calls);
      map[t.service_name].errors += Number(t.error_count);
      map[t.service_name].cost += Number(t.total_cost_cents);
    });
    // Compute averages from latest bucket
    services.forEach((svc) => {
      const svcData = performanceTrends.filter((t) => t.service_name === svc);
      if (svcData.length > 0) {
        const latest = svcData[svcData.length - 1];
        if (map[svc]) {
          map[svc].avgMs = Math.round(Number(latest.avg_response_ms));
          map[svc].p95Ms = Math.round(Number(latest.p95_response_ms));
        }
      }
    });
    return map;
  }, [performanceTrends, services]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === d ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['hour', 'day', 'week'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBucket(b)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                bucket === b ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['p50', 'p95', 'p99'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md uppercase transition-colors ${
                selectedMetric === m ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={() => fetchPerformanceTrends(days, bucket)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ml-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Service filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterService(null)}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
            !filterService
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All Services
        </button>
        {services.map((svc) => (
          <button
            key={svc}
            onClick={() => setFilterService(filterService === svc ? null : svc)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              filterService === svc
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span>{SERVICE_INFO[svc]?.icon || '🔌'}</span>
            {SERVICE_INFO[svc]?.label || svc}
          </button>
        ))}
      </div>

      {/* Response Time Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
          {selectedMetric.toUpperCase()} Response Time (ms)
        </h3>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="bucket" stroke="#6b7280" tick={{ fontSize: 10 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} unit="ms" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: 12, borderRadius: 8 }}
                formatter={(value: number) => [`${value}ms`]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {(filterService ? [filterService] : services).map((svc) => (
                <Line
                  key={svc}
                  type="monotone"
                  dataKey={svc}
                  name={SERVICE_INFO[svc]?.label || svc}
                  stroke={TREND_COLORS[svc] || '#8b5cf6'}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No trend data available for the selected period.
          </div>
        )}
      </div>

      {/* Per-service stats table */}
      {services.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Service Performance Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Service</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Calls</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Errors</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Error %</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Avg (ms)</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">P95 (ms)</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Cost</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => {
                  const stats = serviceStats[svc];
                  if (!stats) return null;
                  const errRate = stats.calls > 0 ? ((stats.errors / stats.calls) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={svc} className="border-t border-gray-100 dark:border-gray-700/50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span>{SERVICE_INFO[svc]?.icon || '🔌'}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{SERVICE_INFO[svc]?.label || svc}</span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-2.5 font-medium text-gray-900 dark:text-white">{stats.calls.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 font-medium text-gray-900 dark:text-white">{stats.errors}</td>
                      <td className={`text-right px-4 py-2.5 font-medium ${Number(errRate) > 5 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{errRate}%</td>
                      <td className="text-right px-4 py-2.5 font-medium text-gray-900 dark:text-white">{stats.avgMs}</td>
                      <td className="text-right px-4 py-2.5 font-medium text-gray-900 dark:text-white">{stats.p95Ms}</td>
                      <td className="text-right px-4 py-2.5 font-medium text-gray-900 dark:text-white">{formatCost(stats.cost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Cost Analysis Panel
// ---------------------------------------------------------------------------
const CostAnalysisPanel = () => {
  const { costForecast, costPerTransaction, loading, fetchCostForecast, fetchCostPerTransaction } = useAdminStore();
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchCostForecast(days);
    fetchCostPerTransaction(days);
  }, [days]);

  const isLoadingForecast = loading.costForecast;
  const isLoadingCpt = loading.costPerTransaction;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === d ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <button
          onClick={() => { fetchCostForecast(days); fetchCostPerTransaction(days); }}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ml-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingForecast || isLoadingCpt ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Cost Forecast Section */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          30-Day Cost Forecast
        </h3>
        {isLoadingForecast ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : costForecast ? (
          <div className="space-y-4">
            {/* Total forecast card */}
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800/50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">Projected 30-Day Total</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCost(costForecast.totals.projected_30d_cents)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {formatCost(costForecast.totals.total_actual_cents)} actual over {costForecast.period_days}d
                    {' | '}
                    {Math.round(costForecast.totals.daily_call_rate).toLocaleString()} calls/day
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                    {formatCost(Math.round(costForecast.totals.total_actual_cents / (costForecast.period_days || 1)))}/day
                  </span>
                </div>
              </div>
            </div>

            {/* Per-service forecast cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {costForecast.by_service.map((svc) => {
                const info = SERVICE_INFO[svc.service_name];
                return (
                  <div key={svc.service_name} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{info?.icon || '🔌'}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{info?.label || svc.service_name}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Actual ({days}d)</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatCost(svc.actual_cost_cents)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Projected 30d</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{formatCost(svc.projected_30d_cents)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Daily rate</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatCost(svc.daily_cost_rate_cents)}/day</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Calls/day</span>
                        <span className="font-medium text-gray-900 dark:text-white">{Math.round(svc.daily_call_rate).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No cost data available yet.</p>
          </div>
        )}
      </div>

      {/* Cost Per Transaction Section */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-500" />
          Cost Per Transaction
        </h3>
        {isLoadingCpt ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />)}
            </div>
          </div>
        ) : costPerTransaction.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Action</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Service</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Count</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Total Cost</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Avg/Tx</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {costPerTransaction.map((cpt, i) => {
                    const info = SERVICE_INFO[cpt.service_name];
                    return (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-700/50">
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{cpt.action_name}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{info?.icon || '🔌'}</span>
                            <span className="text-gray-600 dark:text-gray-400">{info?.label || cpt.service_name}</span>
                          </div>
                        </td>
                        <td className="text-right px-4 py-2.5 font-medium text-gray-900 dark:text-white">{Number(cpt.transaction_count).toLocaleString()}</td>
                        <td className="text-right px-4 py-2.5 font-medium text-gray-900 dark:text-white">{formatCost(Number(cpt.total_cost_cents))}</td>
                        <td className="text-right px-4 py-2.5 font-bold text-purple-600 dark:text-purple-400">{formatCost(Number(cpt.avg_cost_per_transaction_cents))}</td>
                        <td className="text-right px-4 py-2.5 text-gray-600 dark:text-gray-400">{Math.round(Number(cpt.avg_response_ms))}ms</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No transaction data available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Health Check Panel
// ---------------------------------------------------------------------------
const HealthCheckPanel = () => {
  const { healthChecks, slaStatus, loading, runHealthCheck, fetchHealthCheckStatus, fetchSlaStatus } = useAdminStore();

  useEffect(() => {
    fetchHealthCheckStatus();
    fetchSlaStatus();
  }, []);

  const isRunning = loading.healthChecks;
  const isLoadingSla = loading.slaStatus;

  const handleRunCheck = async () => {
    await runHealthCheck();
  };

  const statusColors = {
    up: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    degraded: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    down: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    unknown: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  };

  const statusIcons = {
    up: <CheckCircle className="w-5 h-5 text-green-500" />,
    degraded: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    down: <XCircle className="w-5 h-5 text-red-500" />,
    unknown: <Minus className="w-5 h-5 text-gray-400" />,
  };

  // Build combined cards: 6 services, merge health check + SLA data
  const serviceCards = Object.entries(SERVICE_INFO).map(([key, info]) => {
    const health = healthChecks.find((h) => h.service_name === key);
    const sla = slaStatus.find((s) => s.service_name === key);
    return { key, ...info, health, sla };
  });

  const lastCheck = healthChecks.length > 0
    ? healthChecks.reduce((latest, h) => {
        if (!latest || new Date(h.checked_at) > new Date(latest)) return h.checked_at;
        return latest;
      }, '' as string)
    : null;

  const allUp = healthChecks.length > 0 && healthChecks.every((h) => h.status === 'up');

  return (
    <div className="space-y-4">
      {/* Header + Run button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Service Health Check</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {lastCheck ? `Last checked: ${timeAgo(lastCheck)}` : 'No checks run yet'}
            {healthChecks.length > 0 && (
              <span className={`ml-2 font-medium ${allUp ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {allUp ? 'All services operational' : 'Some services have issues'}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRunCheck}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Heart className="w-3.5 h-3.5" />
              Run Health Check
            </>
          )}
        </button>
      </div>

      {/* Service Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceCards.map((svc) => {
          const status = svc.health?.status || 'unknown';
          return (
            <div
              key={svc.key}
              className={`rounded-xl border p-4 transition-all ${statusColors[status]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{svc.icon}</span>
                  <h4 className="text-sm font-bold">{svc.label}</h4>
                </div>
                {statusIcons[status]}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="opacity-70">Status</span>
                  <span className="font-bold capitalize">{status}</span>
                </div>
                {svc.health?.response_time_ms != null && (
                  <div className="flex justify-between text-xs">
                    <span className="opacity-70">Response</span>
                    <span className="font-medium">{svc.health.response_time_ms}ms</span>
                  </div>
                )}
                {svc.health?.avg_response_24h != null && (
                  <div className="flex justify-between text-xs">
                    <span className="opacity-70">Avg (24h)</span>
                    <span className="font-medium">{Math.round(svc.health.avg_response_24h)}ms</span>
                  </div>
                )}
                {svc.health?.checks_last_24h != null && svc.health.checks_last_24h > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="opacity-70">Checks (24h)</span>
                    <span className="font-medium">{svc.health.checks_last_24h}</span>
                  </div>
                )}
                {svc.health?.error_message && (
                  <p className="text-xs mt-2 p-2 rounded bg-black/5 dark:bg-black/20 break-words">
                    {svc.health.error_message}
                  </p>
                )}
              </div>

              {/* SLA status footer */}
              {svc.sla && svc.sla.total_calls > 0 && (
                <div className="mt-3 pt-2.5 border-t border-current/10">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium">
                    <Shield className="w-3 h-3" />
                    SLA:
                    <span className={svc.sla.error_rate_ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      Err {Number(svc.sla.actual_error_rate).toFixed(1)}%
                    </span>
                    <span className={svc.sla.p95_ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      P95 {Math.round(Number(svc.sla.actual_p95_ms))}ms
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SLA Configuration summary */}
      {slaStatus.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              SLA Compliance (30 days)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Service</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Error Rate</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">SLA Max</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">P95 (ms)</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">SLA Max</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {slaStatus.map((sla) => {
                  const info = SERVICE_INFO[sla.service_name];
                  return (
                    <tr key={sla.service_name} className="border-t border-gray-100 dark:border-gray-700/50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span>{info?.icon || '🔌'}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{sla.display_name}</span>
                        </div>
                      </td>
                      <td className="text-right px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                        {Number(sla.actual_error_rate).toFixed(1)}%
                      </td>
                      <td className="text-right px-4 py-2.5 text-gray-500 dark:text-gray-400">
                        {Number(sla.sla_max_error_rate).toFixed(1)}%
                      </td>
                      <td className="text-center px-4 py-2.5">
                        {sla.error_rate_ok ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="text-right px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                        {Math.round(Number(sla.actual_p95_ms))}
                      </td>
                      <td className="text-right px-4 py-2.5 text-gray-500 dark:text-gray-400">
                        {sla.sla_max_p95_ms}
                      </td>
                      <td className="text-center px-4 py-2.5">
                        {sla.p95_ok ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
