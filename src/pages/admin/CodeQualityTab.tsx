import { useEffect, useState } from 'react';
import {
  Activity, CheckCircle, XCircle, Clock, GitBranch,
  Rocket, AlertTriangle, FileCode, Bug, Wrench,
  ChevronDown, ChevronRight, ExternalLink,
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import type {
  NetlifyDeploy,
  CodeQualityTestFile,
  CodeQualityLintDetail,
  CodeQualityTSDetail,
} from '../../stores/adminStore';

// ---------------------------------------------------------------------------
// Reusable SummaryCard (matches APIMonitoringTab pattern)
// ---------------------------------------------------------------------------
const colorMap: Record<string, string> = {
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
};

const SummaryCard = ({
  label,
  value,
  icon: Icon,
  color,
  loading,
  subtitle,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  loading?: boolean;
  subtitle?: string;
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
      <>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Deploy status badge
// ---------------------------------------------------------------------------
const DeployBadge = ({ state }: { state: string }) => {
  const map: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    ready: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Published', icon: CheckCircle },
    error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Failed', icon: XCircle },
    building: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Building', icon: Clock },
    enqueued: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Queued', icon: Clock },
  };
  const s = map[state] || map.building;
  const StatusIcon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${s.bg} ${s.text}`}>
      <StatusIcon className="w-3 h-3" />
      {s.label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Time-ago helper
// ---------------------------------------------------------------------------
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const CodeQualityTab = () => {
  const { codeQuality, loading, errors, fetchCodeQualityDeploys, fetchCodeQualityReport } = useAdminStore();
  const [lintOpen, setLintOpen] = useState(false);
  const [tsOpen, setTsOpen] = useState(false);

  useEffect(() => {
    fetchCodeQualityDeploys();
    fetchCodeQualityReport();
  }, []);

  const isLoadingDeploys = loading.codeQualityDeploys;
  const isLoadingReport = loading.codeQualityReport;
  const { report, deploys, deploySummary } = codeQuality;

  const lastDeploy = deploySummary?.last_deploy;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Error banners */}
      {errors.codeQualityDeploys && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          Deploy data unavailable: {errors.codeQualityDeploys}
        </div>
      )}
      {errors.codeQualityReport && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          Quality report not available yet. It will be generated on the next deploy.
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Row 1: Deploy KPIs */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Deploy Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label="Last Deploy"
            value={lastDeploy ? (lastDeploy.state === 'ready' ? 'Success' : lastDeploy.state === 'error' ? 'Failed' : lastDeploy.state) : '--'}
            icon={lastDeploy?.state === 'error' ? XCircle : CheckCircle}
            color={lastDeploy?.state === 'error' ? 'red' : lastDeploy?.state === 'ready' ? 'green' : 'yellow'}
            loading={isLoadingDeploys}
            subtitle={lastDeploy ? timeAgo(lastDeploy.created_at) : undefined}
          />
          <SummaryCard
            label="Avg Build Time"
            value={deploySummary ? formatDuration(deploySummary.avg_build_time_seconds) : '--'}
            icon={Clock}
            color="blue"
            loading={isLoadingDeploys}
          />
          <SummaryCard
            label="Branch"
            value={lastDeploy?.branch || '--'}
            icon={GitBranch}
            color="purple"
            loading={isLoadingDeploys}
          />
          <SummaryCard
            label="Deploys (30d)"
            value={deploySummary ? String(deploySummary.deploys_last_30d) : '--'}
            icon={Rocket}
            color={deploySummary && deploySummary.success_rate < 90 ? 'orange' : 'green'}
            loading={isLoadingDeploys}
            subtitle={deploySummary ? `${deploySummary.success_rate}% success rate` : undefined}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Row 2: Test Health */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Test Suite</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label="Tests Passed"
            value={report ? `${report.tests.passed}/${report.tests.total}` : '--'}
            icon={CheckCircle}
            color={report && report.tests.failed > 0 ? 'red' : 'green'}
            loading={isLoadingReport}
          />
          <SummaryCard
            label="Pass Rate"
            value={report && report.tests.total > 0 ? `${Math.round((report.tests.passed / report.tests.total) * 100)}%` : '--'}
            icon={Activity}
            color={report && report.tests.failed > 0 ? 'red' : 'green'}
            loading={isLoadingReport}
          />
          <SummaryCard
            label="Test Files"
            value={report ? String(report.tests.files.length) : '--'}
            icon={FileCode}
            color="indigo"
            loading={isLoadingReport}
          />
          <SummaryCard
            label="Suite Duration"
            value={report ? `${(report.tests.duration_ms / 1000).toFixed(1)}s` : '--'}
            icon={Clock}
            color="blue"
            loading={isLoadingReport}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Row 3: Code Quality (TS + Lint) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Code Quality</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label="TS Errors"
            value={report ? String(report.typescript.errors) : '--'}
            icon={Bug}
            color={report && report.typescript.errors > 0 ? 'red' : 'green'}
            loading={isLoadingReport}
            subtitle={report && report.typescript.files_with_errors > 0 ? `${report.typescript.files_with_errors} files` : undefined}
          />
          <SummaryCard
            label="Lint Errors"
            value={report ? String(report.lint.errors) : '--'}
            icon={AlertTriangle}
            color={report && report.lint.errors > 0 ? 'red' : 'green'}
            loading={isLoadingReport}
          />
          <SummaryCard
            label="Lint Warnings"
            value={report ? String(report.lint.warnings) : '--'}
            icon={AlertTriangle}
            color={report && report.lint.warnings > 10 ? 'yellow' : 'green'}
            loading={isLoadingReport}
          />
          <SummaryCard
            label="Auto-fixable"
            value={report ? String(report.lint.fixable) : '--'}
            icon={Wrench}
            color="teal"
            loading={isLoadingReport}
            subtitle={report && report.lint.fixable > 0 ? 'run eslint --fix' : undefined}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Recent Deploys Table */}
      {/* ------------------------------------------------------------------ */}
      {deploys.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Recent Deploys</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Commit</th>
                  <th className="pb-2 pr-3 hidden md:table-cell">Branch</th>
                  <th className="pb-2 pr-3 hidden lg:table-cell">Context</th>
                  <th className="pb-2 pr-3">Duration</th>
                  <th className="pb-2">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {deploys.slice(0, 20).map((d: NetlifyDeploy) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 pr-3">
                      <DeployBadge state={d.state} />
                    </td>
                    <td className="py-2 pr-3">
                      <div className="max-w-[200px] md:max-w-[300px] truncate">
                        {d.commit_ref && (
                          <span className="font-mono text-xs text-purple-600 dark:text-purple-400 mr-1.5">
                            {d.commit_ref.slice(0, 7)}
                          </span>
                        )}
                        <span className="text-gray-700 dark:text-gray-300">{d.commit_message || 'No message'}</span>
                      </div>
                      {d.committer && (
                        <span className="text-xs text-gray-400">{d.committer}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <GitBranch className="w-3 h-3" />
                        {d.branch}
                      </span>
                    </td>
                    <td className="py-2 pr-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{d.context}</span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {formatDuration(d.deploy_time)}
                    </td>
                    <td className="py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {timeAgo(d.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 5: Test File Breakdown */}
      {/* ------------------------------------------------------------------ */}
      {report && report.tests.files.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Test File Breakdown</h3>
            <span className="text-xs text-gray-400">
              Generated {new Date(report.generated_at).toLocaleString()} | {report.git_branch}@{report.git_sha}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2 pr-3">File</th>
                  <th className="pb-2 pr-3 text-right">Tests</th>
                  <th className="pb-2 pr-3 text-right">Passed</th>
                  <th className="pb-2 pr-3 text-right">Failed</th>
                  <th className="pb-2 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {report.tests.files.map((f: CodeQualityTestFile) => (
                  <tr key={f.file} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 pr-3 font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[300px]">
                      {f.file}
                    </td>
                    <td className="py-2 pr-3 text-right text-gray-600 dark:text-gray-400">{f.tests}</td>
                    <td className="py-2 pr-3 text-right">
                      <span className={f.passed === f.tests ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                        {f.passed}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <span className={f.failed > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>
                        {f.failed}
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-gray-500 dark:text-gray-400">
                      {f.duration_ms}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 6: TypeScript Errors (collapsible) */}
      {/* ------------------------------------------------------------------ */}
      {report && report.typescript.errors > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={() => setTsOpen(!tsOpen)}
            className="flex items-center gap-2 w-full text-left"
          >
            {tsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              TypeScript Errors ({report.typescript.errors})
            </h3>
            <span className="text-xs text-gray-400 ml-auto">
              {report.typescript.files_with_errors} files affected
            </span>
          </button>
          {tsOpen && (
            <div className="mt-3 space-y-1 max-h-[400px] overflow-y-auto">
              {report.typescript.details.map((d: CodeQualityTSDetail, i: number) => (
                <div key={i} className="flex items-start gap-2 px-3 py-1.5 bg-red-50/50 dark:bg-red-900/10 rounded text-xs">
                  <span className="font-mono text-red-600 dark:text-red-400 shrink-0">{d.code}</span>
                  <span className="font-mono text-gray-600 dark:text-gray-400 shrink-0">{d.file}:{d.line}</span>
                  <span className="text-gray-700 dark:text-gray-300 truncate">{d.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 7: Lint Issues (collapsible) */}
      {/* ------------------------------------------------------------------ */}
      {report && (report.lint.errors > 0 || report.lint.warnings > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={() => setLintOpen(!lintOpen)}
            className="flex items-center gap-2 w-full text-left"
          >
            {lintOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Lint Issues ({report.lint.errors} errors, {report.lint.warnings} warnings)
            </h3>
            <span className="text-xs text-gray-400 ml-auto">
              {report.lint.files_with_issues} files
            </span>
          </button>
          {lintOpen && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-2 pr-3">File</th>
                    <th className="pb-2 pr-3 text-right">Errors</th>
                    <th className="pb-2 pr-3 text-right">Warnings</th>
                    <th className="pb-2 text-right">Fixable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {report.lint.details.map((d: CodeQualityLintDetail) => (
                    <tr key={d.file} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="py-2 pr-3 font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[300px]">
                        {d.file}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <span className={d.errors > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>
                          {d.errors}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <span className={d.warnings > 0 ? 'text-yellow-600' : 'text-gray-400'}>
                          {d.warnings}
                        </span>
                      </td>
                      <td className="py-2 text-right text-teal-600 dark:text-teal-400">{d.fixable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All green banner */}
      {report && report.tests.failed === 0 && report.typescript.errors === 0 && report.lint.errors === 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-green-800 dark:text-green-300">All checks passing</p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {report.tests.passed} tests passed, 0 TypeScript errors, 0 lint errors
              {report.lint.warnings > 0 && ` (${report.lint.warnings} warnings)`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
