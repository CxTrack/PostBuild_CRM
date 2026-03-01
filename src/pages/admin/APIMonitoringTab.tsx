import { useEffect, useState } from 'react';
import {
  AlertTriangle, Clock, DollarSign,
  Zap, CheckCircle, XCircle, ChevronRight, ArrowLeft,
  Copy, ExternalLink, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminStore, type ApiErrorDetail } from '../../stores/adminStore';

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
  const { apiUsage, loading, fetchApiUsage } = useAdminStore();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    fetchApiUsage();
  }, []);

  const isLoading = loading.apiUsage;

  // If a service is selected, show the detail panel
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

  // Calculate totals
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

  // All 6 services for the overview grid, even if no data
  const allServices = Object.entries(SERVICE_INFO).map(([key, info]) => {
    const usage = apiUsage.find((a) => a.service_name === key);
    return { key, ...info, usage };
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total API Calls"
          value={totalCalls.toLocaleString()}
          icon={Zap}
          color="purple"
          loading={isLoading}
          onClick={totalErrors > 0 ? () => setSelectedService('_all') : undefined}
        />
        <SummaryCard
          label="Total Errors"
          value={totalErrors.toLocaleString()}
          icon={AlertTriangle}
          color={totalErrors > 0 ? 'red' : 'green'}
          loading={isLoading}
          onClick={totalErrors > 0 ? () => setSelectedService('_all') : undefined}
          hint={totalErrors > 0 ? 'Click to view' : undefined}
        />
        <SummaryCard label="Avg Response" value={`${avgResponseMs}ms`} icon={Clock} color="blue" loading={isLoading} />
        <SummaryCard label="Est. Cost (30d)" value={formatCost(totalCost)} icon={DollarSign} color="orange" loading={isLoading} />
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allServices.map((svc) => {
          const hasErrors = svc.usage && Number(svc.usage.error_count) > 0;
          return (
            <div
              key={svc.key}
              onClick={hasErrors ? () => setSelectedService(svc.key) : undefined}
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
                  {/* Click hint for error cards */}
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
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Edge Functions (10)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { name: 'copilot-chat', api: 'OpenRouter', purpose: 'AI CoPilot proxy' },
            { name: 'receipt-scan', api: 'OpenRouter', purpose: 'Receipt OCR (vision)' },
            { name: 'ocr-extract', api: 'Google Vision', purpose: 'Business card OCR' },
            { name: 'provision-voice-agent', api: 'Retell + Twilio', purpose: 'Phone + agent provisioning' },
            { name: 'list-voices', api: 'Retell', purpose: 'List available voices' },
            { name: 'update-retell-agent', api: 'Retell', purpose: 'Sync agent settings' },
            { name: 'manage-knowledge-base', api: 'Retell', purpose: 'KB CRUD' },
            { name: 'retell-webhook', api: 'Retell + Twilio', purpose: 'Call events + SMS' },
            { name: 'send-invitation', api: 'Resend', purpose: 'Team invitation emails' },
            { name: 'send-sms', api: 'Twilio', purpose: 'SMS notifications' },
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
    </div>
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
