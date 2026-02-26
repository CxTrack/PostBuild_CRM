import { useState } from 'react';
import {
  Star, MoreVertical, Edit3, Copy, Share2, Download, Trash2,
  BarChart3, TrendingUp, PieChart as PieIcon, AreaChart as AreaIcon,
  Circle, Filter, Table, GitBranch, BarChart
} from 'lucide-react';
import { Card } from '@/components/theme/ThemeComponents';
import type { CustomReport, ChartType, DataSource } from './reportFieldMeta';
import { DATA_SOURCE_META, CHART_TYPE_META } from './reportFieldMeta';

const CHART_ICONS: Record<ChartType, any> = {
  bar: BarChart3,
  line: TrendingUp,
  pie: PieIcon,
  area: AreaIcon,
  donut: Circle,
  stacked_bar: BarChart,
  scatter: GitBranch,
  funnel: Filter,
  table: Table,
};

interface ReportCardProps {
  report: CustomReport;
  theme: string;
  onView: (report: CustomReport) => void;
  onEdit: (report: CustomReport) => void;
  onDuplicate: (report: CustomReport) => void;
  onShare: (report: CustomReport) => void;
  onExportCSV: (report: CustomReport) => void;
  onExportPDF: (report: CustomReport) => void;
  onDelete: (report: CustomReport) => void;
  onToggleFavorite: (report: CustomReport) => void;
}

export const ReportCard = ({
  report, theme, onView, onEdit, onDuplicate, onShare,
  onExportCSV, onExportPDF, onDelete, onToggleFavorite,
}: ReportCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const isMidnight = theme === 'midnight';
  const isDark = theme === 'dark' || theme === 'midnight';

  const ChartIcon = CHART_ICONS[report.report_config.chart_type] || BarChart3;
  const source = DATA_SOURCE_META[report.report_config.data_source as DataSource];
  const chartMeta = CHART_TYPE_META[report.report_config.chart_type];

  const textPrimary = isMidnight ? 'text-white' : isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isMidnight ? 'text-gray-400' : isDark ? 'text-gray-400' : 'text-gray-500';
  const menuBg = isMidnight ? 'bg-gray-900 border-white/10' : isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const menuHover = isMidnight ? 'hover:bg-white/[0.05]' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  const badgeColors: Record<string, string> = {
    customers: 'bg-blue-500/10 text-blue-500',
    invoices: 'bg-green-500/10 text-green-500',
    pipeline_items: 'bg-purple-500/10 text-purple-500',
    tasks: 'bg-amber-500/10 text-amber-500',
    calls: 'bg-pink-500/10 text-pink-500',
    quotes: 'bg-cyan-500/10 text-cyan-500',
    expenses: 'bg-red-500/10 text-red-500',
    products: 'bg-indigo-500/10 text-indigo-500',
    payments: 'bg-emerald-500/10 text-emerald-500',
    customer_subscriptions: 'bg-orange-500/10 text-orange-500',
  };

  return (
    <Card className="!p-0 overflow-hidden group">
      {/* Clickable body */}
      <button onClick={() => onView(report)} className="w-full text-left p-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold truncate ${textPrimary}`}>{report.name}</h3>
            {report.description && (
              <p className={`text-xs mt-0.5 truncate ${textSecondary}`}>{report.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(report); }}
              className={`p-1.5 rounded-lg transition-colors ${report.is_favorite ? 'text-amber-400' : textSecondary} ${isMidnight ? 'hover:bg-white/[0.05]' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Star className={`w-4 h-4 ${report.is_favorite ? 'fill-current' : ''}`} />
            </button>
            <div className={`relative ${showMenu ? 'z-40' : ''}`}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className={`p-1.5 rounded-lg transition-colors ${textSecondary} ${isMidnight ? 'hover:bg-white/[0.05]' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                  <div className={`absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg border py-1 min-w-[160px] ${menuBg}`}>
                    {[
                      { icon: Edit3, label: 'Edit', action: () => onEdit(report) },
                      { icon: Copy, label: 'Duplicate', action: () => onDuplicate(report) },
                      { icon: Share2, label: 'Share', action: () => onShare(report) },
                      { icon: Download, label: 'Export CSV', action: () => onExportCSV(report) },
                      { icon: Download, label: 'Export PDF', action: () => onExportPDF(report) },
                    ].map(({ icon: Icon, label, action }) => (
                      <button
                        key={label}
                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); action(); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${textSecondary} ${menuHover}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                    <div className={`border-t my-1 ${isMidnight ? 'border-white/10' : isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(report); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 ${menuHover}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[report.report_config.data_source] || 'bg-gray-500/10 text-gray-500'}`}>
            {source?.label || report.report_config.data_source}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isMidnight ? 'bg-white/[0.05] text-gray-400' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            <ChartIcon className="w-3 h-3" />
            {chartMeta?.label || report.report_config.chart_type}
          </span>
          {report.is_public && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
              <Share2 className="w-3 h-3" />
              Shared
            </span>
          )}
        </div>
      </button>

      {/* Footer */}
      <div className={`px-5 py-2.5 text-xs border-t ${isMidnight ? 'border-white/5 text-gray-500' : isDark ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
        Updated {new Date(report.updated_at).toLocaleDateString()}
      </div>
    </Card>
  );
};
