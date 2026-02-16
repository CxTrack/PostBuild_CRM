import { useEffect } from 'react';
import {
  Activity, AlertTriangle, Clock, DollarSign,
  Zap, CheckCircle, XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminStore, ApiUsageSummary } from '../../stores/adminStore';

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

export const APIMonitoringTab = () => {
  const { apiUsage, loading, fetchApiUsage } = useAdminStore();

  useEffect(() => {
    fetchApiUsage();
  }, []);

  const isLoading = loading.apiUsage;

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
        <SummaryCard label="Total API Calls" value={totalCalls.toLocaleString()} icon={Zap} color="purple" loading={isLoading} />
        <SummaryCard label="Total Errors" value={totalErrors.toLocaleString()} icon={AlertTriangle} color={totalErrors > 0 ? 'red' : 'green'} loading={isLoading} />
        <SummaryCard label="Avg Response" value={`${avgResponseMs}ms`} icon={Clock} color="blue" loading={isLoading} />
        <SummaryCard label="Est. Cost (30d)" value={formatCost(totalCost)} icon={DollarSign} color="orange" loading={isLoading} />
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allServices.map((svc) => (
          <div key={svc.key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
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
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                No API calls tracked yet. Data will appear after edge function instrumentation.
              </p>
            )}
          </div>
        ))}
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

const colorMap: Record<string, string> = {
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
};

const SummaryCard = ({ label, value, icon: Icon, color, loading }: {
  label: string; value: string; icon: any; color: string; loading?: boolean;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
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
  </div>
);
