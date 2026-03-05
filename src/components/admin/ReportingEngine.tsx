import { useState, useCallback } from 'react';
import {
  Download, FileText, Calendar, ChevronDown,
  Loader2, CheckCircle, FileBarChart, Printer
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { supabase } from '@/lib/supabase';

type ReportType =
  | 'executive_summary'
  | 'financial'
  | 'user_growth'
  | 'module_adoption'
  | 'api_usage'
  | 'voice_analytics'
  | 'ai_analytics'
  | 'billing_revenue';

interface ReportConfig {
  id: ReportType;
  label: string;
  description: string;
  icon: string;
}

const REPORT_TYPES: ReportConfig[] = [
  { id: 'executive_summary', label: 'Executive Summary', description: 'KPIs, growth trends, alerts, and platform overview', icon: '📊' },
  { id: 'financial', label: 'Financial Report', description: 'Revenue, invoices, pipeline, expenses, top customers', icon: '💰' },
  { id: 'user_growth', label: 'User Growth', description: 'User signups, org breakdown by industry and tier', icon: '📈' },
  { id: 'module_adoption', label: 'Module Adoption', description: 'Feature usage by module, adoption rates across orgs', icon: '🧩' },
  { id: 'api_usage', label: 'API Usage', description: 'External API calls, error rates, costs by service', icon: '⚡' },
  { id: 'voice_analytics', label: 'Voice & Calls', description: 'Call volume, duration, SMS delivery, phone inventory', icon: '📱' },
  { id: 'ai_analytics', label: 'AI & LLM', description: 'Token usage, AI users, receipt scans, model costs', icon: '🤖' },
  { id: 'billing_revenue', label: 'Billing & Revenue', description: 'Subscriptions, invoices, MRR, plan distribution', icon: '💳' },
];

const DATE_PRESETS = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: 'YTD', days: -1 },
];

export const ReportingEngine = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('executive_summary');
  const [dateRange, setDateRange] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const store = useAdminStore();

  const getDateRangeDays = useCallback(() => {
    if (dateRange === -1) {
      // YTD
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    }
    return dateRange;
  }, [dateRange]);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const generateCSV = useCallback(async () => {
    setGenerating(true);
    try {
      const days = getDateRangeDays();
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 86400000);
      const dateStr = `${formatDate(startDate)} to ${formatDate(endDate)}`;

      let csvContent = '';
      let filename = '';

      switch (selectedReport) {
        case 'executive_summary': {
          await Promise.allSettled([
            store.fetchKPIs(),
            store.fetchUserGrowth(),
            store.fetchOrgBreakdown(),
          ]);
          const k = store.kpis;
          csvContent = [
            `CxTrack Executive Summary,${dateStr}`,
            `Generated,${new Date().toLocaleString()}`,
            '',
            'Platform KPIs',
            'Metric,Value',
            `Total Users,${k?.total_users || 0}`,
            `Total Organizations,${k?.total_orgs || 0}`,
            `Active Orgs (30d),${k?.active_orgs_30d || 0}`,
            `New Users (7d),${k?.new_users_7d || 0}`,
            `New Users (30d),${k?.new_users_30d || 0}`,
            `Pipeline Value,${k?.total_pipeline_value || 0}`,
            `Deals Won (30d),${k?.deals_won_30d || 0}`,
            `Deals Won Value (30d),${k?.deals_won_value_30d || 0}`,
            `Total Invoiced (30d),${k?.total_invoiced_30d || 0}`,
            `Total Collected (30d),${k?.total_paid_30d || 0}`,
            `AI Tokens Used (MTD),${k?.ai_tokens_used_30d || 0}`,
            `AI Tokens Allocated (MTD),${k?.ai_tokens_allocated_30d || 0}`,
            `Voice Minutes (30d),${k?.voice_minutes_30d || 0}`,
            `Active Phone Numbers,${k?.active_phone_numbers || 0}`,
            `Total Customers,${k?.total_customers || 0}`,
            `Total Invoices,${k?.total_invoices || 0}`,
            `Total Quotes,${k?.total_quotes || 0}`,
            `Total Expenses,${k?.total_expenses || 0}`,
            `Total Tasks,${k?.total_tasks || 0}`,
            `Total Calls,${k?.total_calls || 0}`,
            `Open Support Tickets,${k?.open_support_tickets || 0}`,
            `Urgent Support Tickets,${k?.urgent_support_tickets || 0}`,
            '',
            'User Growth (Monthly)',
            'Period,New Users,Cumulative Users',
            ...store.userGrowth.map(g => `${g.period},${g.new_users},${g.cumulative_users}`),
            '',
            'Organization Breakdown',
            'Industry,Tier,Org Count,Total Members',
            ...store.orgBreakdown.map(o => `${o.industry_template},${o.subscription_tier},${o.org_count},${o.total_members}`),
          ].join('\n');
          filename = `executive-summary-${formatDate(endDate)}`;
          break;
        }

        case 'financial': {
          await store.fetchFinancialSummary(days);
          const f = store.financialSummary;
          csvContent = [
            `CxTrack Financial Report,${dateStr}`,
            `Generated,${new Date().toLocaleString()}`,
            '',
            'Revenue Summary',
            'Metric,Value',
            `Total Invoiced,${f?.total_invoiced || 0}`,
            `Total Collected,${f?.total_paid || 0}`,
            `Outstanding,${f?.total_outstanding || 0}`,
            `Total Expenses,${f?.total_expenses || 0}`,
            `Collection Rate,${f && f.total_invoiced > 0 ? Math.round(f.total_paid / f.total_invoiced * 100) : 0}%`,
            '',
            'Pipeline',
            'Metric,Value',
            `Open Pipeline Value,${f?.pipeline_open_value || 0}`,
            `Won Value,${f?.pipeline_won_value || 0}`,
            `Lost Value,${f?.pipeline_lost_value || 0}`,
            `Win Rate,${f && (f.pipeline_won_value + f.pipeline_lost_value > 0) ? Math.round(f.pipeline_won_value / (f.pipeline_won_value + f.pipeline_lost_value) * 100) : 0}%`,
            '',
            'Quotes',
            `Quotes Sent,${f?.quote_count || 0}`,
            `Accepted,${f?.quotes_accepted || 0}`,
            `Converted to Invoice,${f?.quotes_converted || 0}`,
            `Conversion Rate,${f?.quote_conversion_rate || 0}%`,
            '',
            'Invoices',
            `Total Count,${f?.invoice_count || 0}`,
            `Overdue,${f?.overdue_invoices || 0}`,
            '',
            ...(f?.pipeline_deals_by_stage?.length > 0 ? [
              'Pipeline Deals by Stage',
              'Stage,Count,Total Value',
              ...f.pipeline_deals_by_stage.map((s: any) => `"${s.stage}",${s.deal_count || 0},${s.total_value || 0}`),
            ] : []),
            '',
            ...(f?.top_customers_by_revenue?.length > 0 ? [
              'Top Customers by Revenue',
              'Name,Organization,Total Spent,Invoice Count',
              ...f.top_customers_by_revenue.map((c: any) =>
                `"${c.first_name} ${c.last_name}","${c.org_name || ''}",${c.total_spent},${c.invoice_count}`
              ),
            ] : []),
          ].join('\n');
          filename = `financial-report-${formatDate(endDate)}`;
          break;
        }

        case 'user_growth': {
          await Promise.allSettled([
            store.fetchUserGrowth(Math.ceil(days / 30) || 12),
            store.fetchOrgBreakdown(),
          ]);
          csvContent = [
            `CxTrack User Growth Report,${dateStr}`,
            `Generated,${new Date().toLocaleString()}`,
            '',
            'User Growth (Monthly)',
            'Period,New Users,Cumulative Users',
            ...store.userGrowth.map(g => `${g.period},${g.new_users},${g.cumulative_users}`),
            '',
            'Organization Breakdown',
            'Industry,Subscription Tier,Org Count,Total Members',
            ...store.orgBreakdown.map(o => `${o.industry_template},${o.subscription_tier},${o.org_count},${o.total_members}`),
            '',
            'Industry Summary',
            'Industry,Total Orgs',
            ...Object.entries(
              store.orgBreakdown.reduce<Record<string, number>>((acc, o) => {
                acc[o.industry_template] = (acc[o.industry_template] || 0) + Number(o.org_count);
                return acc;
              }, {})
            ).map(([k, v]) => `${k},${v}`),
            '',
            'Tier Summary',
            'Tier,Total Orgs',
            ...Object.entries(
              store.orgBreakdown.reduce<Record<string, number>>((acc, o) => {
                acc[o.subscription_tier] = (acc[o.subscription_tier] || 0) + Number(o.org_count);
                return acc;
              }, {})
            ).map(([k, v]) => `${k},${v}`),
          ].join('\n');
          filename = `user-growth-${formatDate(endDate)}`;
          break;
        }

        case 'module_adoption': {
          await Promise.allSettled([
            store.fetchModuleUsage(),
            store.fetchOrgBreakdown(),
          ]);
          const totalOrgs = store.orgBreakdown.reduce((s, o) => s + Number(o.org_count), 0);
          csvContent = [
            `CxTrack Module Adoption Report,${dateStr}`,
            `Generated,${new Date().toLocaleString()}`,
            `Total Organizations,${totalOrgs}`,
            '',
            'Module Usage',
            'Module,Total Records,Active Orgs,Avg Per Org,Adoption Rate',
            ...store.moduleUsage.map(m => {
              const adoption = totalOrgs > 0 ? Math.round(Number(m.active_orgs) / totalOrgs * 100) : 0;
              return `${m.module_name},${m.record_count},${m.active_orgs},${m.avg_per_org},${adoption}%`;
            }),
          ].join('\n');
          filename = `module-adoption-${formatDate(endDate)}`;
          break;
        }

        case 'api_usage': {
          await store.fetchApiUsage(days);
          csvContent = [
            `CxTrack API Usage Report,${dateStr}`,
            `Generated,${new Date().toLocaleString()}`,
            '',
            'API Usage by Service',
            'Service,Total Calls,Errors,Error Rate,Avg Response (ms),Total Cost (cents),Total Tokens',
            ...store.apiUsage.map(a =>
              `${a.service_name},${a.total_calls},${a.error_count},${a.error_rate}%,${Math.round(Number(a.avg_response_ms))},${Number(a.total_cost_cents).toFixed(2)},${a.total_tokens}`
            ),
            '',
            'Summary',
            `Total API Calls,${store.apiUsage.reduce((s, a) => s + Number(a.total_calls), 0)}`,
            `Total Errors,${store.apiUsage.reduce((s, a) => s + Number(a.error_count), 0)}`,
            `Total Cost (cents),${store.apiUsage.reduce((s, a) => s + Number(a.total_cost_cents), 0).toFixed(2)}`,
          ].join('\n');
          filename = `api-usage-${formatDate(endDate)}`;
          break;
        }

        case 'voice_analytics': {
          await store.fetchVoiceAnalytics(days);
          const v = store.voiceAnalytics;
          csvContent = [
            `CxTrack Voice & Calls Report,${dateStr}`,
            `Generated,${new Date().toLocaleString()}`,
            '',
            'Voice KPIs',
            'Metric,Value',
            `Total Calls,${v?.total_calls || 0}`,
            `AI Calls,${v?.ai_calls || 0}`,
            `Human Calls,${v?.human_calls || 0}`,
            `Average Duration (seconds),${v?.avg_duration_seconds || 0}`,
            `Total Duration (seconds),${v?.total_duration_seconds || 0}`,
            `Voice Minutes Used,${v?.voice_minutes_used || 0}`,
            `Voice Minutes Included,${v?.voice_minutes_included || 0}`,
            `Active Phone Numbers,${v?.active_phone_numbers || 0}`,
            `Total Phone Numbers,${v?.total_phone_numbers || 0}`,
            '',
            'SMS',
            `Sent,${v?.sms_sent || 0}`,
            `Delivered,${v?.sms_delivered || 0}`,
            `Failed,${v?.sms_failed || 0}`,
            '',
            ...(v?.calls_by_org?.length > 0 ? [
              'Calls by Organization',
              'Organization,Call Count,Total Duration (s)',
              ...v.calls_by_org.map((o: any) => `"${o.org_name}",${o.call_count},${o.total_duration}`),
            ] : []),
            '',
            ...(v?.phone_numbers_list?.length > 0 ? [
              'Phone Number Inventory',
              'Number,Nickname,Organization,Status,Agent ID',
              ...v.phone_numbers_list.map((p: any) =>
                `"${p.phone_number_pretty || p.phone_number}","${p.nickname || ''}","${p.org_name || ''}",${p.status},"${p.retell_agent_id || ''}"`
              ),
            ] : []),
          ].join('\n');
          filename = `voice-analytics-${formatDate(endDate)}`;
          break;
        }

        case 'ai_analytics': {
          await store.fetchAIAnalytics(days);
          const ai = store.aiAnalytics;
          csvContent = [
            `CxTrack AI & LLM Report,${dateStr}`,
            `Generated,${new Date().toLocaleString()}`,
            '',
            'AI KPIs',
            'Metric,Value',
            `Tokens Used,${ai?.total_tokens_used || 0}`,
            `Tokens Allocated,${ai?.total_tokens_allocated || 0}`,
            `Utilization,${ai && ai.total_tokens_allocated > 0 ? Math.round(ai.total_tokens_used / ai.total_tokens_allocated * 100) : 0}%`,
            `Unique AI Users,${ai?.unique_ai_users || 0}`,
            `Receipt Scans (total),${ai?.receipt_scans_total || 0}`,
            `Receipt Scans (period),${ai?.receipt_scans_period || 0}`,
            '',
            ...(ai?.top_token_users?.length > 0 ? [
              'Top Token Consumers',
              'Email,Tokens Used,Tokens Allocated,Usage %',
              ...ai.top_token_users.map((u: any) =>
                `"${u.email}",${u.tokens_used},${u.tokens_allocated},${u.tokens_allocated > 0 ? Math.round(u.tokens_used / u.tokens_allocated * 100) : 0}%`
              ),
            ] : []),
          ].join('\n');
          filename = `ai-analytics-${formatDate(endDate)}`;
          break;
        }

        case 'billing_revenue': {
          // Fetch subscriptions, invoices, and plans directly
          const [{ data: allSubs }, { data: allInvoices }, { data: allPlans }] = await Promise.all([
            supabase.from('subscriptions').select('*, organizations(name, status)').order('created_at', { ascending: false }),
            supabase.from('stripe_invoices').select('*, organizations(name)').order('created_at', { ascending: false }).limit(200),
            supabase.from('subscription_plans').select('id, name, price, status'),
          ]);

          const subs = allSubs || [];
          const invs = allInvoices || [];

          const activeSubs = subs.filter((s: any) => s.status === 'active');
          const mrr = activeSubs.reduce((sum: number, s: any) => sum + (s.plan_amount / 100), 0);
          const arr = mrr * 12;

          // Plan distribution
          const planCounts: Record<string, number> = {};
          activeSubs.forEach((s: any) => {
            const name = s.plan_name || 'Unknown';
            planCounts[name] = (planCounts[name] || 0) + 1;
          });

          csvContent = [
            `CxTrack Billing & Revenue Report,${dateStr}`,
            `Generated,${new Date().toLocaleString()}`,
            '',
            'Revenue Summary',
            'Metric,Value',
            `Monthly Recurring Revenue (MRR),$${mrr.toFixed(2)}`,
            `Annual Recurring Revenue (ARR),$${arr.toFixed(2)}`,
            `Active Subscriptions,${activeSubs.length}`,
            `Total Subscriptions (all statuses),${subs.length}`,
            `Total Invoices,${invs.length}`,
            `Total Invoiced,$${(invs.reduce((s: number, i: any) => s + (i.amount_due || 0), 0) / 100).toFixed(2)}`,
            `Total Collected,$${(invs.reduce((s: number, i: any) => s + (i.amount_paid || 0), 0) / 100).toFixed(2)}`,
            `Total Refunded,$${(invs.reduce((s: number, i: any) => s + (i.refunded_amount || 0), 0) / 100).toFixed(2)}`,
            '',
            'Plan Distribution',
            'Plan,Active Count',
            ...Object.entries(planCounts).map(([plan, count]) => `"${plan}",${count}`),
            '',
            'Active Subscriptions',
            'Organization,Plan,Amount,Interval,Status,Period End,Created',
            ...activeSubs.map((s: any) =>
              `"${s.organizations?.name || 'Unknown'}","${s.plan_name}","$${(s.plan_amount / 100).toFixed(2)}","${s.interval}","${s.status}","${s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : ''}","${new Date(s.created_at).toLocaleDateString()}"`
            ),
            '',
            'Recent Invoices',
            'Invoice ID,Organization,Amount Paid,Amount Due,Status,Refunded,Date',
            ...invs.map((i: any) =>
              `"${i.stripe_invoice_id}","${i.organizations?.name || 'Unknown'}","$${(i.amount_paid / 100).toFixed(2)}","$${(i.amount_due / 100).toFixed(2)}","${i.status}","${i.refunded_amount ? `$${(i.refunded_amount / 100).toFixed(2)}` : ''}","${new Date(i.created_at).toLocaleDateString()}"`
            ),
          ].join('\n');
          filename = `billing-revenue-${formatDate(endDate)}`;
          break;
        }
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setLastGenerated(filename);
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [selectedReport, getDateRangeDays, store]);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  const selectedConfig = REPORT_TYPES.find(r => r.id === selectedReport)!;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Report Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Report Type */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Report Type
            </label>
            <div className={`relative ${dropdownOpen ? 'z-40' : ''}`}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{selectedConfig.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedConfig.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedConfig.description}</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden">
                  {REPORT_TYPES.map(report => (
                    <button
                      key={report.id}
                      onClick={() => { setSelectedReport(report.id); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedReport === report.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                      }`}
                    >
                      <span className="text-lg">{report.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{report.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{report.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Date Range
            </label>
            <div className="flex gap-1.5">
              {DATE_PRESETS.map(preset => (
                <button
                  key={preset.days}
                  onClick={() => setDateRange(preset.days)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    dateRange === preset.days
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={generateCSV}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {generating ? 'Generating...' : 'Export CSV'}
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
              title="Print current admin page"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Last generated notification */}
        {lastGenerated && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Downloaded <span className="font-medium">{lastGenerated}.csv</span>
            </span>
          </div>
        )}
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {REPORT_TYPES.map(report => (
          <button
            key={report.id}
            onClick={() => { setSelectedReport(report.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`text-left p-4 rounded-xl border transition-all ${
              selectedReport === report.id
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 ring-1 ring-purple-400/30'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{report.icon}</span>
              <h3 className={`text-sm font-bold ${
                selectedReport === report.id ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'
              }`}>
                {report.label}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Data Preview Hint */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileBarChart className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Export Guide</h4>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li>CSV exports include all data visible in the corresponding analytics tab</li>
              <li>Date range filters apply to time-sensitive metrics (revenue, API calls, etc.)</li>
              <li>Use Print to generate a PDF of the currently visible admin tab</li>
              <li>For stakeholder presentations, use Executive Summary or Financial Report</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
