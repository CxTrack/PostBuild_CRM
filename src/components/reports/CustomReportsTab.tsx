import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Star, SlidersHorizontal, BarChart3, ArrowUpDown,
  FileBarChart2, Loader2
} from 'lucide-react';
import { Card } from '@/components/theme/ThemeComponents';
import { useCustomReportStore } from '@/stores/customReportStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore } from '@/stores/themeStore';
import { ReportCard } from './ReportCard';
import { ReportBuilder } from './ReportBuilder';
import { ReportViewer } from './ReportViewer';
import { ReportShareModal } from './ReportShareModal';
import { DATA_SOURCE_META } from './reportFieldMeta';
import type { CustomReport, DataSource } from './reportFieldMeta';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

export const CustomReportsTab = () => {
  const { theme } = useThemeStore();
  const { currentOrganization } = useOrganizationStore();
  const { reports, loading, fetchReports, deleteReport, toggleFavorite, togglePublic, executeReport, duplicateReport } = useCustomReportStore();

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  const [viewingReport, setViewingReport] = useState<CustomReport | null>(null);
  const [sharingReport, setSharingReport] = useState<CustomReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'favorites'>('newest');

  const isMidnight = theme === 'midnight';
  const isDark = theme === 'dark' || theme === 'midnight';
  const orgId = currentOrganization?.id;

  const textPrimary = isMidnight ? 'text-white' : isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isMidnight ? 'text-gray-400' : isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isMidnight ? 'bg-white/[0.05] border-white/10 text-white placeholder-gray-500' : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const btnSecondary = isMidnight
    ? 'bg-white/[0.05] border border-white/10 text-gray-300 hover:bg-white/[0.08]'
    : isDark ? 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50';

  useEffect(() => {
    if (orgId) fetchReports(orgId);
  }, [orgId]);

  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        r.report_config.data_source.toLowerCase().includes(q)
      );
    }

    // Filter by source
    if (filterSource !== 'all') {
      result = result.filter(r => r.report_config.data_source === filterSource);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'favorites':
        result.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));
        break;
      default: // newest
        result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }

    return result;
  }, [reports, searchQuery, filterSource, sortBy]);

  const handleView = (report: CustomReport) => setViewingReport(report);
  const handleEdit = (report: CustomReport) => { setEditingReport(report); setShowBuilder(true); };
  const handleDuplicate = async (report: CustomReport) => {
    try {
      await duplicateReport(report);
      toast.success('Report duplicated');
    } catch { toast.error('Failed to duplicate'); }
  };
  const handleShare = (report: CustomReport) => setSharingReport(report);
  const handleDelete = async (report: CustomReport) => {
    if (!confirm(`Delete "${report.name}"? This cannot be undone.`)) return;
    try {
      await deleteReport(report.id);
      toast.success('Report deleted');
    } catch { toast.error('Failed to delete'); }
  };
  const handleToggleFavorite = async (report: CustomReport) => {
    try { await toggleFavorite(report.id, report.is_favorite); } catch { /* silent */ }
  };

  const handleExportCSV = async (report: CustomReport) => {
    if (!orgId) return;
    try {
      const data = await executeReport(orgId, report.report_config);
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
    } catch { toast.error('Export failed'); }
  };

  const handleExportPDF = async (report: CustomReport) => {
    if (!orgId) return;
    try {
      const data = await executeReport(orgId, report.report_config);
      if (!data.length) { toast.error('No data to export'); return; }
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(report.name, 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(128);
      doc.text(`Generated: ${format(new Date(), 'PPp')}`, 14, 28);
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(h => String(row[h] ?? '')));
      autoTable(doc, { head: [headers], body: rows, startY: 34, styles: { fontSize: 8 }, headStyles: { fillColor: [59, 130, 246] } });
      doc.save(`${report.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF exported');
    } catch { toast.error('Export failed'); }
  };

  const handleBuilderSaved = () => {
    setShowBuilder(false);
    setEditingReport(null);
    if (orgId) fetchReports(orgId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-semibold ${textPrimary}`}>Custom Reports</h2>
          <p className={`text-sm ${textSecondary}`}>Build and share your own reports from any data source</p>
        </div>
        <button
          onClick={() => { setEditingReport(null); setShowBuilder(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm ${inputBg}`}
          />
        </div>
        {/* Source filter */}
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm ${inputBg}`}
        >
          <option value="all">All Sources</option>
          {(Object.entries(DATA_SOURCE_META) as [DataSource, typeof DATA_SOURCE_META[DataSource]][]).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className={`px-3 py-2 rounded-xl border text-sm ${inputBg}`}
        >
          <option value="newest">Newest First</option>
          <option value="name">Name A-Z</option>
          <option value="favorites">Favorites First</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`w-6 h-6 animate-spin ${textSecondary}`} />
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="!p-12">
          <div className="text-center">
            <FileBarChart2 className={`w-16 h-16 mx-auto mb-4 ${textSecondary} opacity-30`} />
            <h3 className={`text-lg font-semibold mb-2 ${textPrimary}`}>
              {reports.length === 0 ? 'Create Your First Custom Report' : 'No Reports Found'}
            </h3>
            <p className={`text-sm mb-6 max-w-md mx-auto ${textSecondary}`}>
              {reports.length === 0
                ? 'Build powerful custom reports from any data in your CRM. Choose data sources, chart types, metrics, and dimensions to create exactly the insights you need.'
                : 'Try adjusting your search or filters to find what you\'re looking for.'
              }
            </p>
            {reports.length === 0 && (
              <button
                onClick={() => { setEditingReport(null); setShowBuilder(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Report
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              theme={theme}
              onView={handleView}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onShare={handleShare}
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showBuilder && orgId && (
        <ReportBuilder
          organizationId={orgId}
          theme={theme}
          editingReport={editingReport}
          onClose={() => { setShowBuilder(false); setEditingReport(null); }}
          onSaved={handleBuilderSaved}
        />
      )}

      {viewingReport && orgId && (
        <ReportViewer
          report={viewingReport}
          organizationId={orgId}
          theme={theme}
          onClose={() => setViewingReport(null)}
          onEdit={() => { setViewingReport(null); setEditingReport(viewingReport); setShowBuilder(true); }}
          onShare={() => { setSharingReport(viewingReport); }}
        />
      )}

      {sharingReport && orgId && (
        <ReportShareModal
          report={sharingReport}
          organizationId={orgId}
          theme={theme}
          onClose={() => setSharingReport(null)}
          onTogglePublic={async () => {
            await togglePublic(sharingReport.id, sharingReport.is_public);
            // Refresh the local report object
            const updated = { ...sharingReport, is_public: !sharingReport.is_public };
            setSharingReport(updated);
          }}
        />
      )}
    </div>
  );
};
