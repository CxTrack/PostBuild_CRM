/**
 * AI Quarterback - Proactive Business Insights Widget
 *
 * Displays AI-generated proactive recommendations on the dashboard.
 * When a user clicks an insight, it opens CoPilot in "Quarterback Mode"
 * which is hyper business-savvy and offers to draft emails, texts, or call scripts.
 */
import React, { useCallback } from 'react';
import {
  X,
  Sparkles,
  TrendingDown,
  UserX,
  Clock,
  FileWarning,
  AlertCircle,
  PhoneForwarded,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useQuarterbackInsights, QuarterbackInsight } from '@/hooks/useQuarterbackInsights';
import { useVisibleModules } from '@/hooks/useVisibleModules';
import { buildQuarterbackChoices, buildQuarterbackIntro } from '@/config/quarterback-choices.config';
import { format } from 'date-fns';

// Type-based visual config for each insight category
const INSIGHT_CONFIG: Record<string, {
  icon: React.ComponentType<any>;
  accentColor: string;
  iconBg: string;
  rowBg: string;
  borderColor: string;
  label: string;
}> = {
  stale_deal: {
    icon: TrendingDown,
    accentColor: 'text-amber-500 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    rowBg: 'hover:bg-amber-50/50 dark:hover:bg-amber-900/20',
    borderColor: 'border-amber-200/60 dark:border-amber-700/30',
    label: 'Stale Deal',
  },
  inactive_customer: {
    icon: UserX,
    accentColor: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    rowBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/20',
    borderColor: 'border-blue-200/60 dark:border-blue-700/30',
    label: 'Inactive Contact',
  },
  overdue_task: {
    icon: Clock,
    accentColor: 'text-red-500 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    rowBg: 'hover:bg-red-50/50 dark:hover:bg-red-900/20',
    borderColor: 'border-red-200/60 dark:border-red-700/30',
    label: 'Overdue',
  },
  expiring_quote: {
    icon: FileWarning,
    accentColor: 'text-orange-500 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    rowBg: 'hover:bg-orange-50/50 dark:hover:bg-orange-900/20',
    borderColor: 'border-orange-200/60 dark:border-orange-700/30',
    label: 'Expiring',
  },
  overdue_invoice: {
    icon: AlertCircle,
    accentColor: 'text-purple-500 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    rowBg: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/20',
    borderColor: 'border-purple-200/60 dark:border-purple-700/30',
    label: 'Overdue Invoice',
  },
  follow_up_reminder: {
    icon: PhoneForwarded,
    accentColor: 'text-teal-500 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    rowBg: 'hover:bg-teal-50/50 dark:hover:bg-teal-900/20',
    borderColor: 'border-teal-200/60 dark:border-teal-700/30',
    label: 'Follow-up Due',
  },
};

/**
 * Build the quarterback prompt that will be sent to CoPilot
 * The [QUARTERBACK_MODE] prefix triggers the special system prompt in the edge function
 */
function buildQuarterbackPrompt(insight: QuarterbackInsight): string {
  const prefix = `[QUARTERBACK_MODE] Insight type: ${insight.type}. `;

  switch (insight.type) {
    case 'stale_deal':
      return prefix + `Deal "${insight.title}" for ${insight.customer_name} worth $${insight.value?.toLocaleString()} in stage "${insight.stage}" has not been updated in ${insight.days_stale} days. Their email is ${insight.email || 'not on file'} and phone is ${insight.phone || 'not on file'}. Help me re-engage this deal.`;

    case 'inactive_customer':
      return prefix + `Customer ${insight.customer_name} ($${insight.total_spent?.toLocaleString()} lifetime value) has not been contacted in ${insight.days_inactive} days. Their email is ${insight.email || 'not on file'} and phone is ${insight.phone || 'not on file'}. Help me reach out and re-engage them.`;

    case 'overdue_task':
      return prefix + `Task "${insight.title}" for ${insight.customer_name || 'unassigned'} is ${insight.days_overdue} days overdue (${insight.priority} priority). Their email is ${insight.email || 'not on file'} and phone is ${insight.phone || 'not on file'}. Help me address this.`;

    case 'expiring_quote':
      return prefix + `Quote "${insight.title}" for ${insight.customer_name} worth $${insight.total_amount?.toLocaleString()} expires in ${insight.days_until_expiry} days. Their email is ${insight.email || 'not on file'}. Help me follow up before it expires.`;

    case 'overdue_invoice':
      return prefix + `Invoice "${insight.title}" for ${insight.customer_name} with $${insight.amount_outstanding?.toLocaleString()} outstanding is ${insight.days_overdue} days overdue. Their email is ${insight.email || 'not on file'}. Help me collect this payment.`;

    case 'follow_up_reminder':
      return prefix + `Follow-up with ${insight.customer_name} was due ${insight.days_past_followup === 0 ? 'today' : `${insight.days_past_followup} days ago`}. Their email is ${insight.email || 'not on file'} and phone is ${insight.phone || 'not on file'}. Help me reach out.`;

    default:
      return prefix + insight.message;
  }
}

interface AIQuarterbackProps {
  compact?: boolean;
}

const AIQuarterback: React.FC<AIQuarterbackProps> = ({ compact = false }) => {
  const { theme } = useThemeStore();
  const { openPanel, setContext, clearMessages, addAssistantMessage } = useCoPilot();
  const { insights, loading, lastUpdated, dismissInsight, refreshInsights, insightCount } = useQuarterbackInsights();
  const { planTier } = useVisibleModules();

  const handleInsightClick = useCallback((insight: QuarterbackInsight) => {
    // Clear previous conversation, set quarterback context, open panel
    clearMessages();
    setContext({
      page: 'Quarterback',
      data: {
        quarterbackMode: true,
        insightType: insight.type,
        insightData: insight,
      },
    });
    openPanel();

    // Build deterministic choices and intro (no AI tokens consumed)
    const choices = buildQuarterbackChoices(insight, planTier);
    const introText = buildQuarterbackIntro(insight);

    // Small delay to let panel open before adding the choice message
    setTimeout(() => {
      addAssistantMessage({
        role: 'assistant',
        content: introText,
        choices,
      });
    }, 100);
  }, [clearMessages, setContext, openPanel, addAssistantMessage, planTier]);

  const handleDismiss = useCallback((e: React.MouseEvent, insightId: string) => {
    e.stopPropagation();
    dismissInsight(insightId);
  }, [dismissInsight]);

  const handleRefresh = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    refreshInsights();
  }, [refreshInsights]);

  const isMidnight = theme === 'midnight';
  const isSoftModern = theme === 'soft-modern';
  const isEmpty = !loading && insights.length === 0;

  return (
    <div className={compact ? 'mb-4' : 'mt-6'}>
      {/* Premium container with gradient glow */}
      <div className={`
        relative rounded-2xl overflow-hidden transition-all
        ${isMidnight
          ? 'bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] shadow-[0_0_30px_rgba(139,92,246,0.08)]'
          : isSoftModern
            ? 'bg-white shadow-[8px_8px_16px_rgba(0,0,0,0.08),-8px_-8px_16px_rgba(255,255,255,0.9)]'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm'
        }
      `}>
        {/* Top gradient accent bar — animated flow */}
        <div className={`absolute inset-x-0 top-0 h-[3px] qb-gradient-bar opacity-90 ${
          isMidnight
            ? 'bg-gradient-to-r from-purple-500 via-amber-400 to-blue-500'
            : isSoftModern
              ? 'bg-gradient-to-r from-blue-500 via-teal-400 to-indigo-500'
              : 'bg-gradient-to-r from-purple-500 via-blue-500 to-amber-500'
        }`} />

        {/* Subtle glow effect behind the card (midnight theme only) */}
        {isMidnight && (
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-amber-500/10 blur-sm -z-10" />
        )}

        {/* Animated gradient overlay — subtle color shift per theme */}
        <div className={`absolute inset-0 rounded-2xl qb-card-glow ${
          isMidnight
            ? 'bg-gradient-to-br from-purple-600/[0.06] via-amber-500/[0.04] to-blue-600/[0.06]'
            : isSoftModern
              ? 'bg-gradient-to-br from-blue-400/[0.03] via-teal-300/[0.02] to-indigo-400/[0.03]'
              : theme === 'dark'
                ? 'bg-gradient-to-br from-purple-500/[0.05] via-blue-500/[0.03] to-teal-500/[0.05]'
                : 'bg-gradient-to-br from-blue-300/[0.04] via-purple-200/[0.03] to-pink-300/[0.04]'
        }`} />

        {/* Header */}
        <div className={`${compact ? 'px-4 pt-4 pb-2' : 'px-6 pt-6 pb-3'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Gradient icon container */}
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-purple-500 via-blue-500 to-amber-500 shadow-lg shadow-purple-500/20">
                <Sparkles className="w-5 h-5 text-white" />
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 via-blue-500 to-amber-500 animate-qb-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white`}>
                    AI Quarterback
                  </h3>
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                {lastUpdated && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {format(lastUpdated, 'h:mm a')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Insight count badge */}
              <span className={`
                text-xs font-semibold px-3 py-1 rounded-full
                ${isEmpty
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-300'
                  : 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/40 dark:to-blue-900/40 dark:text-purple-300'
                }
              `}>
                {isEmpty ? 'All clear' : `${insightCount} insight${insightCount !== 1 ? 's' : ''}`}
              </span>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                className={`
                  p-2 rounded-lg transition-all
                  ${loading ? 'animate-spin' : ''}
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                `}
                title="Refresh insights"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Insight rows, loading state, or empty state */}
        <div className={`${compact ? 'px-4 pb-4' : 'px-6 pb-6'} space-y-2`}>
          {loading && insights.length === 0 ? (
            <div className={`
              flex items-center gap-3 p-4 rounded-xl border border-dashed animate-pulse
              ${isMidnight
                ? 'border-white/[0.08] bg-white/[0.01]'
                : 'border-gray-200 dark:border-gray-600 bg-gray-50/30 dark:bg-gray-700/20'
              }
            `}>
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0">
                <div className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ) : isEmpty ? (
            <div className={`
              flex items-center gap-3 p-4 rounded-xl border border-dashed
              ${isMidnight
                ? 'border-white/[0.08] bg-white/[0.01]'
                : 'border-gray-200 dark:border-gray-600 bg-gray-50/30 dark:bg-gray-700/20'
              }
            `}>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
                <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 leading-snug`}>
                  You're all caught up. No stale deals, overdue tasks, or follow-ups needed right now.
                </p>
              </div>
            </div>
          ) : (
            insights.map((insight, index) => {
              const config = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.overdue_task;
              const Icon = config.icon;

              return (
                <div
                  key={`${insight.id}-${index}`}
                  onClick={() => handleInsightClick(insight)}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group
                    border ${config.borderColor} ${config.rowBg}
                    hover:shadow-md hover:scale-[1.005]
                    ${isMidnight
                      ? 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06] hover:border-white/[0.12]'
                      : isSoftModern
                        ? 'bg-gray-50/50 shadow-[2px_2px_4px_rgba(0,0,0,0.04),-2px_-2px_4px_rgba(255,255,255,0.8)] hover:shadow-[4px_4px_8px_rgba(0,0,0,0.06),-4px_-4px_8px_rgba(255,255,255,0.9)]'
                        : 'bg-gray-50/50 dark:bg-gray-700/30'
                    }
                  `}
                >
                  {/* Type icon */}
                  <div className={`p-2 rounded-lg ${config.iconBg} shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.accentColor}`} />
                  </div>

                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-800 dark:text-gray-200 font-medium leading-snug`}>
                      {insight.message}
                    </p>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold mt-0.5 inline-block ${config.accentColor}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Click indicator + Dismiss button */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Arrow indicator on hover */}
                    <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
                      Ask AI
                    </span>

                    {/* Dismiss X */}
                    <button
                      onClick={(e) => handleDismiss(e, insight.id)}
                      className={`
                        p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all
                        hover:bg-gray-200 dark:hover:bg-gray-600
                      `}
                      title="Dismiss this insight"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AIQuarterback;
