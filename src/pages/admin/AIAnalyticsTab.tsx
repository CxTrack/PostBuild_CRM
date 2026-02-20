import { useEffect } from 'react';
import { Brain, Zap, Users, Camera, DollarSign } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

const formatNumber = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
};

export const AIAnalyticsTab = () => {
  const { aiAnalytics, loading, fetchAIAnalytics } = useAdminStore();

  useEffect(() => {
    fetchAIAnalytics();
  }, []);

  const data = aiAnalytics;
  const isLoading = loading.ai;

  const tokenUsagePercent = data && data.total_tokens_allocated > 0
    ? Math.round(data.total_tokens_used / data.total_tokens_allocated * 100)
    : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Tokens Used</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data?.total_tokens_used || 0)}</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Allocated</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(data?.total_tokens_allocated || 0)}</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">AI Users</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.unique_ai_users || 0}</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Receipt Scans</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.receipt_scans_total || 0}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{data?.receipt_scans_period || 0} this period</p>
            </>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Utilization</span>
          </div>
          {isLoading ? (
            <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tokenUsagePercent}%</p>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                <div
                  className={`h-full rounded-full transition-all ${tokenUsagePercent > 80 ? 'bg-red-500' : tokenUsagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(tokenUsagePercent, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Token Usage Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Token Budget Overview</h3>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${tokenUsagePercent > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : tokenUsagePercent > 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}
              style={{ width: `${Math.min(tokenUsagePercent, 100)}%` }}
            />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white w-16 text-right">{tokenUsagePercent}%</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatNumber(data?.total_tokens_used || 0)} used</span>
          <span>{formatNumber(data?.total_tokens_allocated || 0)} allocated</span>
        </div>
      </div>

      {/* Top Token Consumers */}
      {data?.top_token_users && data.top_token_users.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Token Consumers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Used</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Allocated</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.top_token_users.map((u: any, i: number) => {
                  const pct = u.tokens_allocated > 0 ? Math.round(u.tokens_used / u.tokens_allocated * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-white">{u.email}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white text-right">
                        {formatNumber(u.tokens_used)}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 text-right">
                        {formatNumber(u.tokens_allocated)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div
                              className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Model Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">AI Services Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">CoPilot Model</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">meta-llama/llama-3.1-8b-instruct:free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Receipt Scan Model</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">google/gemini-2.0-flash-001</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Analysis Model</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">anthropic/claude-sonnet-4</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Provider</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">OpenRouter</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Free Tier Tokens</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">50,000/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Enterprise Tokens</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">1,000,000/month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
