import { useState, useEffect } from 'react';
import { X, Download, Edit3, Share2, RefreshCw, Calendar } from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';
import { useCustomReportStore } from '@/stores/customReportStore';
import { DATA_SOURCE_META, CHART_TYPE_META } from './reportFieldMeta';
import type { CustomReport } from './reportFieldMeta';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

interface ReportViewerProps {
  report: CustomReport;
  organizationId: string;
  theme: string;
  onClose: () => void;
  onEdit: () => void;
  onShare: () => void;
}

export const ReportViewer = ({ report, organizationId, theme, onClose, onEdit, onShare }: ReportViewerProps) => {
  const { executeReport, executing } = useCustomReportStore();
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loaded, setLoaded] = useState(false);

  const isMidnight = theme === 'midnight';
  const isDark = theme === 'dark' || theme === 'midnight';

  const bg = isMidnight ? 'bg-gray-900' : isDark ? 'bg-gray-800' : 'bg-white';
  const border = isMidnight ? 'border-white/10' : isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isMidnight ? 'text-white' : isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isMidnight ? 'text-gray-400' : isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = isMidnight ? 'hover:bg-white/[0.05]' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const btnSecondary = isMidnight
    ? 'bg-white/[0.05] border-white/10 text-gray-300 hover:bg-white/[0.08]'
    : isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50';

  useEffect(() => {
    loadData();
  }, [report.id]);

  const loadData = async () => {
    const result = await executeReport(organizationId, report.report_config);
    setData(result);
    setLoaded(true);
  };

  const exportToCSV = () => {
    if (!data.length) { toast.error('No data to export'); return; }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportToPDF = () => {
    if (!data.length) { toast.error('No data to export'); return; }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(report.name, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(`Generated: ${format(new Date(), 'PPp')}`, 14, 28);
    doc.text(`Source: ${DATA_SOURCE_META[report.report_config.data_source]?.label || report.report_config.data_source}`, 14, 34);

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => String(row[h] ?? '')));
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    doc.save(`${report.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exported');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border flex flex-col ${bg} ${border}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${border}`}>
          <div className="min-w-0 flex-1">
            <h2 className={`text-lg font-semibold truncate ${textPrimary}`}>{report.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs ${textSecondary}`}>
                {DATA_SOURCE_META[report.report_config.data_source]?.label} &middot; {CHART_TYPE_META[report.report_config.chart_type]?.label}
              </span>
              {report.description && <span className={`text-xs ${textSecondary}`}>&middot; {report.description}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button onClick={loadData} disabled={executing} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${btnSecondary}`}>
              <RefreshCw className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={onEdit} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${btnSecondary}`}>
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button onClick={onShare} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${btnSecondary}`}>
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button onClick={exportToCSV} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${btnSecondary}`}>
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button onClick={exportToPDF} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${btnSecondary}`}>
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${textSecondary} ${hoverBg}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 overflow-auto p-6">
          {!loaded || executing ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <RefreshCw className={`w-8 h-8 mx-auto animate-spin ${textSecondary}`} />
                <p className={`text-sm mt-3 ${textSecondary}`}>Loading report data...</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <Calendar className={`w-10 h-10 mx-auto mb-3 ${textSecondary} opacity-40`} />
                <p className={`text-sm ${textSecondary}`}>No data matches your report criteria</p>
                <p className={`text-xs mt-1 ${textSecondary} opacity-60`}>Try adjusting the filters or date range</p>
              </div>
            </div>
          ) : (
            <ChartRenderer
              chartType={report.report_config.chart_type}
              data={data}
              config={report.report_config}
              theme={theme}
              height={440}
            />
          )}

          {/* Data summary */}
          {loaded && data.length > 0 && (
            <div className={`mt-4 text-xs ${textSecondary}`}>
              {data.length} row{data.length !== 1 ? 's' : ''} returned
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
