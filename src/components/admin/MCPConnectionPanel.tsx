import { useState } from 'react';
import { Copy, CheckCircle, ExternalLink, Terminal, Plug, Shield } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';

const copyToClipboard = async (text: string, setCopied: (v: string) => void, key: string) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  } catch { /* ignore */ }
};

export const MCPConnectionPanel = () => {
  const [copied, setCopied] = useState('');

  const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0] || 'zkpfzrbbupgiqkzqydji';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Plug className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Claude MCP Integration</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Connect Claude Code to CxTrack's Supabase for AI-powered admin operations</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            The MCP (Model Context Protocol) connection allows Claude Code to directly query your Supabase database,
            run analytics, manage edge functions, and perform admin operations — all through natural language.
          </p>
        </div>
      </div>

      {/* Connection Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          Connection Configuration
        </h3>

        <div className="space-y-3">
          <ConfigRow
            label="Supabase Project Ref"
            value={projectRef}
            copied={copied}
            onCopy={(v) => copyToClipboard(v, setCopied, 'ref')}
            copyKey="ref"
          />
          <ConfigRow
            label="Supabase URL"
            value={SUPABASE_URL}
            copied={copied}
            onCopy={(v) => copyToClipboard(v, setCopied, 'url')}
            copyKey="url"
          />
          <ConfigRow
            label="Dashboard"
            value={`https://supabase.com/dashboard/project/${projectRef}`}
            copied={copied}
            onCopy={(v) => copyToClipboard(v, setCopied, 'dashboard')}
            copyKey="dashboard"
            isLink
          />
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Setup Instructions</h3>

        <div className="space-y-4">
          <Step number={1} title="Install Claude Code">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Install the Claude Code CLI tool from Anthropic. This enables AI-powered development with MCP server connections.
            </p>
          </Step>

          <Step number={2} title="Configure Supabase MCP Server">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Add the Supabase MCP server to your Claude Code configuration. This gives Claude direct access to your database, edge functions, and project settings.
            </p>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 overflow-x-auto">
              <pre>{`// In your Claude Code MCP settings:
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@anthropic-ai/mcp-server-supabase",
        "--project-ref", "${projectRef}"
      ]
    }
  }
}`}</pre>
            </div>
          </Step>

          <Step number={3} title="Authenticate">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The MCP server will prompt you to authenticate with Supabase. Use your admin credentials to grant full access to platform analytics and management.
            </p>
          </Step>

          <Step number={4} title="Start Using">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Once connected, you can ask Claude natural language questions about your platform:
            </p>
            <div className="space-y-1.5">
              {[
                'What is our current MRR and how many active orgs do we have?',
                'Show me the top 5 organizations by revenue this month',
                'Are there any API errors in the last 24 hours?',
                'Which modules have the lowest adoption rate?',
                'Create a new migration to add an index on the customers table',
              ].map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2">
                  <span className="text-purple-500 font-bold shrink-0">&gt;</span>
                  <span className="italic">{q}</span>
                </div>
              ))}
            </div>
          </Step>
        </div>
      </div>

      {/* Available Admin RPC Functions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          Admin RPC Functions (SECURITY DEFINER)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          These functions are available to authenticated admin users and power the analytics dashboards.
        </p>
        <div className="space-y-2">
          {[
            { name: 'admin_get_platform_kpis()', description: 'All platform-wide KPIs in one call' },
            { name: 'admin_get_user_growth(p_months)', description: 'Monthly user growth time series' },
            { name: 'admin_get_org_breakdown()', description: 'Orgs by industry and subscription tier' },
            { name: 'admin_get_module_usage()', description: 'Record counts and adoption by module' },
            { name: 'admin_get_api_usage_summary(p_days)', description: 'External API call stats by service' },
            { name: 'admin_get_priority_alerts()', description: 'High/medium priority platform alerts' },
            { name: 'admin_get_ai_analytics(p_days)', description: 'AI token usage, top consumers' },
            { name: 'admin_get_voice_analytics(p_days)', description: 'Call stats, SMS, phone inventory' },
            { name: 'admin_get_financial_summary(p_days)', description: 'Revenue, pipeline, quotes, expenses' },
            { name: 'admin_get_activity_log(p_limit, p_offset, ...)', description: 'Paginated audit trail' },
          ].map(fn => (
            <div key={fn.name} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <span className="text-sm font-mono font-medium text-purple-600 dark:text-purple-400">{fn.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-3 text-right">{fn.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Tables Reference */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Key Database Tables</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { table: 'organizations', desc: 'Core org records with industry + plan' },
            { table: 'user_profiles', desc: 'User profiles linked to auth.users' },
            { table: 'organization_members', desc: 'User-org membership junction' },
            { table: 'customers', desc: 'CRM contacts per org' },
            { table: 'invoices', desc: 'Invoice records with amounts' },
            { table: 'quotes', desc: 'Quote documents' },
            { table: 'pipeline_items', desc: 'Deal/opportunity pipeline' },
            { table: 'tasks', desc: 'Task management' },
            { table: 'calls / call_summaries', desc: 'Voice call records' },
            { table: 'expenses', desc: 'Expense tracking with AI scan' },
            { table: 'ai_token_usage', desc: 'Monthly AI token allocation' },
            { table: 'phone_numbers', desc: 'Provisioned Twilio numbers' },
            { table: 'api_usage_log', desc: 'Edge function API call tracking' },
            { table: 'activity_logs', desc: 'Platform-wide audit trail' },
            { table: 'admin_settings', desc: 'Admin user configuration' },
            { table: 'support_tickets', desc: 'Support ticket queue' },
          ].map(t => (
            <div key={t.table} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">{t.table}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const ConfigRow = ({ label, value, copied, onCopy, copyKey, isLink }: {
  label: string; value: string; copied: string; onCopy: (v: string) => void; copyKey: string; isLink?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{value}</p>
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={() => onCopy(value)}
        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
        title="Copy"
      >
        {copied === copyKey ? (
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>
      {isLink && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          title="Open"
        >
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </a>
      )}
    </div>
  </div>
);

const Step = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-3">
    <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold shrink-0 mt-0.5">
      {number}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">{title}</h4>
      {children}
    </div>
  </div>
);
