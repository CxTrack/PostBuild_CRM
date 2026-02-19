import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { getAuthToken, getSupabaseUrl } from '@/utils/auth.utils';

interface AICustomerSummaryProps {
  customerId: string;
  customerName: string;
}

const AICustomerSummary: React.FC<AICustomerSummaryProps> = ({ customerId, customerName }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  const generateSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNoData(false);

    const token = await getAuthToken();
    if (!token) {
      setError('Please sign in to view AI summaries');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${getSupabaseUrl()}/functions/v1/copilot-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: `Give me a brief overview of customer "${customerName}" (ID: ${customerId}). Include their pipeline stage, open tasks, recent notes, upcoming meetings, outstanding invoices, and call history. Keep it concise - 3-5 sentences maximum. Focus on actionable insights. If there is very little data available for this customer, say so briefly.`,
          conversationHistory: [],
          context: {
            page: 'Customers',
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.error === 'token_limit_reached') {
          setError('Out of AI tokens this month');
          return;
        }
        throw new Error(data.error || 'Could not generate summary');
      }

      const data = await response.json();
      const aiMessage = data.response;

      if (aiMessage) {
        // Check if the AI response indicates no meaningful data
        const lowerMsg = aiMessage.toLowerCase();
        const noDataIndicators = ['no data', 'no information', 'no records', 'no activity', 'couldn\'t find', 'could not find', 'not found'];
        const isLikelyEmpty = noDataIndicators.some(ind => lowerMsg.includes(ind)) && aiMessage.length < 200;

        if (isLikelyEmpty) {
          setNoData(true);
        }
        setSummary(aiMessage);
      } else {
        setNoData(true);
      }
    } catch (err: any) {
      setError(err.message || 'Could not generate summary');
    } finally {
      setLoading(false);
    }
  }, [customerId, customerName]);

  useEffect(() => {
    generateSummary();
  }, [generateSummary]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
            <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Summary
          </h2>
        </div>
        <button
          onClick={generateSummary}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse w-4/6" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : noData && !summary ? (
        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
          <Info size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Summary will build as more activity is recorded for this client — add notes, tasks, or deals to get started.
          </p>
        </div>
      ) : summary ? (
        <div className="p-3 bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {summary}
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
          <Info size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Summary will build as more activity is recorded for this client — add notes, tasks, or deals to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default AICustomerSummary;
