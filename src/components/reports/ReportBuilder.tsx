import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Plus, Trash2, Play, Save, BarChart3, TrendingUp, PieChart as PieIcon,
  AreaChart as AreaIcon, Circle, Filter, Table, GitBranch, BarChart,
  Users, FileText, Target, CheckSquare, Phone, Receipt, Package,
  CreditCard, RefreshCw, ChevronDown, Loader2
} from 'lucide-react';
import { ChartRenderer } from './ChartRenderer';
import { useCustomReportStore } from '@/stores/customReportStore';
import {
  DATA_SOURCE_META, CHART_TYPE_META, AGGREGATE_LABELS, DIMENSION_TYPE_LABELS,
  FILTER_OPERATOR_LABELS, DEFAULT_COLORS, getDefaultReportConfig,
} from './reportFieldMeta';
import type {
  DataSource, ChartType, ReportConfig, ReportMetric, ReportDimension,
  ReportFilter, CustomReport, FieldMeta,
} from './reportFieldMeta';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';

const DATA_SOURCE_ICONS: Record<DataSource, any> = {
  customers: Users,
  invoices: FileText,
  pipeline_items: Target,
  tasks: CheckSquare,
  calls: Phone,
  quotes: FileText,
  expenses: Receipt,
  products: Package,
  payments: CreditCard,
  customer_subscriptions: RefreshCw,
};

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

interface ReportBuilderProps {
  organizationId: string;
  theme: string;
  editingReport?: CustomReport | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ReportBuilder = ({ organizationId, theme, editingReport, onClose, onSaved }: ReportBuilderProps) => {
  const { createReport, updateReport, executeReport, executing } = useCustomReportStore();

  const [name, setName] = useState(editingReport?.name || '');
  const [description, setDescription] = useState(editingReport?.description || '');
  const [config, setConfig] = useState<ReportConfig>(editingReport?.report_config || getDefaultReportConfig());
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState<'source' | 'chart' | 'metrics' | 'dimensions' | 'filters'>('source');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMidnight = theme === 'midnight';
  const isDark = theme === 'dark' || theme === 'midnight';

  const bg = isMidnight ? 'bg-gray-900' : isDark ? 'bg-gray-800' : 'bg-white';
  const panelBg = isMidnight ? 'bg-white/[0.02]' : isDark ? 'bg-gray-900/50' : 'bg-gray-50';
  const border = isMidnight ? 'border-white/10' : isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isMidnight ? 'text-white' : isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isMidnight ? 'text-gray-400' : isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isMidnight ? 'bg-white/[0.05] border-white/10 text-white placeholder-gray-500' : isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const cardBg = isMidnight ? 'bg-white/[0.03] border-white/10' : isDark ? 'bg-gray-700/50 border-gray-700' : 'bg-white border-gray-200';
  const selectedBg = isMidnight ? 'bg-blue-500/20 border-blue-500/50' : isDark ? 'bg-blue-500/20 border-blue-500/50' : 'bg-blue-50 border-blue-500';
  const hoverBg = isMidnight ? 'hover:bg-white/[0.05]' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  // Get current data source fields
  const sourceFields = DATA_SOURCE_META[config.data_source]?.fields || [];
  const aggregatableFields = sourceFields.filter(f => f.aggregatable);
  const groupableFields = sourceFields.filter(f => f.groupable);
  const dateFields = sourceFields.filter(f => f.type === 'date');

  // Auto-run preview with debounce
  const runPreview = useCallback(async () => {
    if (!config.data_source || config.metrics.length === 0) return;
    const result = await executeReport(organizationId, config);
    setPreviewData(result);
    setPreviewLoaded(true);
  }, [config, organizationId, executeReport]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (config.metrics.length > 0) runPreview();
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [config]);

  const updateConfig = (updates: Partial<ReportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setPreviewLoaded(false);
  };

  // When data source changes, reset metrics/dimensions/filters
  const handleSourceChange = (source: DataSource) => {
    const fields = DATA_SOURCE_META[source]?.fields || [];
    const firstAgg = fields.find(f => f.aggregatable);
    const firstGroup = fields.find(f => f.groupable);
    updateConfig({
      data_source: source,
      metrics: firstAgg ? [{ field: firstAgg.key, aggregate: 'count', label: 'Count' }] : [],
      dimensions: firstGroup ? [{ field: firstGroup.key, type: 'category', label: firstGroup.label }] : [],
      filters: [],
      date_range: null,
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Please enter a report name'); return; }
    if (config.metrics.length === 0) { toast.error('Add at least one metric'); return; }
    setSaving(true);
    try {
      if (editingReport) {
        await updateReport(editingReport.id, { name, description: description || null, report_config: config });
        toast.success('Report updated');
      } else {
        await createReport(organizationId, name.trim(), description.trim() || null, config);
        toast.success('Report created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
    setSaving(false);
  };

  const addMetric = () => {
    const field = aggregatableFields[0];
    if (!field) return;
    updateConfig({
      metrics: [...config.metrics, { field: field.key, aggregate: 'count', label: `${field.label} Count` }],
    });
  };

  const updateMetric = (index: number, updates: Partial<ReportMetric>) => {
    const newMetrics = [...config.metrics];
    newMetrics[index] = { ...newMetrics[index], ...updates };
    // Auto-label
    if (updates.field || updates.aggregate) {
      const f = sourceFields.find(sf => sf.key === newMetrics[index].field);
      newMetrics[index].label = `${f?.label || newMetrics[index].field} ${AGGREGATE_LABELS[newMetrics[index].aggregate]}`;
    }
    updateConfig({ metrics: newMetrics });
  };

  const removeMetric = (index: number) => {
    updateConfig({ metrics: config.metrics.filter((_, i) => i !== index) });
  };

  const addDimension = () => {
    const field = groupableFields.find(f => !config.dimensions.some(d => d.field === f.key));
    if (!field) return;
    updateConfig({
      dimensions: [...config.dimensions, { field: field.key, type: field.type === 'date' ? 'date_month' : 'category', label: field.label }],
    });
  };

  const updateDimension = (index: number, updates: Partial<ReportDimension>) => {
    const newDims = [...config.dimensions];
    newDims[index] = { ...newDims[index], ...updates };
    if (updates.field) {
      const f = sourceFields.find(sf => sf.key === newDims[index].field);
      newDims[index].label = f?.label || newDims[index].field;
      if (f?.type === 'date' && newDims[index].type === 'category') {
        newDims[index].type = 'date_month';
      }
    }
    updateConfig({ dimensions: newDims });
  };

  const removeDimension = (index: number) => {
    updateConfig({ dimensions: config.dimensions.filter((_, i) => i !== index) });
  };

  const addFilter = () => {
    const field = sourceFields[0];
    if (!field) return;
    updateConfig({
      filters: [...config.filters, { field: field.key, operator: 'eq', value: '' }],
    });
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const newFilters = [...config.filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    updateConfig({ filters: newFilters });
  };

  const removeFilter = (index: number) => {
    updateConfig({ filters: config.filters.filter((_, i) => i !== index) });
  };

  const steps = [
    { id: 'source' as const, label: 'Data Source' },
    { id: 'chart' as const, label: 'Chart Type' },
    { id: 'metrics' as const, label: 'Metrics' },
    { id: 'dimensions' as const, label: 'Dimensions' },
    { id: 'filters' as const, label: 'Filters' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-7xl h-[95vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${bg} ${border}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-3.5 border-b shrink-0 ${border}`}>
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Report name..."
              className={`text-lg font-semibold bg-transparent border-none outline-none flex-1 min-w-0 ${textPrimary} placeholder-gray-500`}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              onClick={runPreview}
              disabled={executing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isMidnight ? 'bg-white/[0.05] border border-white/10 text-gray-300 hover:bg-white/[0.08]' : isDark ? 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {editingReport ? 'Update' : 'Save'}
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${textSecondary} ${hoverBg}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className={`px-6 py-2 border-b shrink-0 ${border}`}>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description (optional)..."
            className={`w-full text-sm bg-transparent border-none outline-none ${textSecondary} placeholder-gray-500`}
          />
        </div>

        {/* Main content — left config + right preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — config */}
          <div className={`w-[380px] shrink-0 border-r overflow-y-auto ${panelBg} ${border}`}>
            {/* Step tabs */}
            <div className={`flex border-b ${border} overflow-x-auto`}>
              {steps.map(step => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${activeStep === step.id
                    ? `${isMidnight ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600'}`
                    : `${textSecondary} ${hoverBg}`
                  }`}
                >
                  {step.label}
                  {step.id === 'metrics' && config.metrics.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-500">{config.metrics.length}</span>
                  )}
                  {step.id === 'filters' && config.filters.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-500">{config.filters.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4">
              {/* Data Source */}
              {activeStep === 'source' && (
                <div className="space-y-3">
                  <p className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>Select Data Source</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(DATA_SOURCE_META) as [DataSource, typeof DATA_SOURCE_META[DataSource]][]).map(([key, meta]) => {
                      const Icon = DATA_SOURCE_ICONS[key] || Package;
                      const isSelected = config.data_source === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleSourceChange(key)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${isSelected ? selectedBg : `${cardBg} ${hoverBg}`}`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-500' : textSecondary}`} />
                          <span className={`text-xs font-medium ${isSelected ? 'text-blue-500' : textPrimary}`}>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className={`text-xs ${textSecondary}`}>
                    {DATA_SOURCE_META[config.data_source]?.description}
                  </p>
                </div>
              )}

              {/* Chart Type */}
              {activeStep === 'chart' && (
                <div className="space-y-3">
                  <p className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>Choose Visualization</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(CHART_TYPE_META) as [ChartType, typeof CHART_TYPE_META[ChartType]][]).map(([key, meta]) => {
                      const Icon = CHART_ICONS[key] || BarChart3;
                      const isSelected = config.chart_type === key;
                      return (
                        <button
                          key={key}
                          onClick={() => updateConfig({ chart_type: key })}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${isSelected ? selectedBg : `${cardBg} ${hoverBg}`}`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-500' : textSecondary}`} />
                          <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-500' : textPrimary}`}>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Metrics */}
              {activeStep === 'metrics' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>Metrics (What to measure)</p>
                    <button onClick={addMetric} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-500 hover:bg-blue-500/10 transition-colors">
                      <Plus className="w-3 h-3" />Add
                    </button>
                  </div>
                  {config.metrics.length === 0 ? (
                    <p className={`text-xs ${textSecondary} text-center py-4`}>No metrics added. Click "Add" to start.</p>
                  ) : (
                    config.metrics.map((metric, i) => (
                      <div key={i} className={`p-3 rounded-xl border space-y-2 ${cardBg}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${textPrimary}`}>Metric {i + 1}</span>
                          <button onClick={() => removeMetric(i)} className="p-1 rounded text-red-500 hover:bg-red-500/10">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <select
                          value={metric.field}
                          onChange={(e) => updateMetric(i, { field: e.target.value })}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                        >
                          {aggregatableFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                        </select>
                        <select
                          value={metric.aggregate}
                          onChange={(e) => updateMetric(i, { aggregate: e.target.value as any })}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                        >
                          {Object.entries(AGGREGATE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Dimensions */}
              {activeStep === 'dimensions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>Dimensions (Group by)</p>
                    <button onClick={addDimension} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-500 hover:bg-blue-500/10 transition-colors">
                      <Plus className="w-3 h-3" />Add
                    </button>
                  </div>
                  {config.dimensions.length === 0 ? (
                    <p className={`text-xs ${textSecondary} text-center py-4`}>No dimensions. Data will be aggregated as a single total.</p>
                  ) : (
                    config.dimensions.map((dim, i) => {
                      const selectedField = sourceFields.find(f => f.key === dim.field);
                      const isDate = selectedField?.type === 'date';
                      return (
                        <div key={i} className={`p-3 rounded-xl border space-y-2 ${cardBg}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${textPrimary}`}>Dimension {i + 1}</span>
                            <button onClick={() => removeDimension(i)} className="p-1 rounded text-red-500 hover:bg-red-500/10">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <select
                            value={dim.field}
                            onChange={(e) => updateDimension(i, { field: e.target.value })}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                          >
                            {groupableFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                          </select>
                          {isDate && (
                            <select
                              value={dim.type}
                              onChange={(e) => updateDimension(i, { type: e.target.value as any })}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                            >
                              {Object.entries(DIMENSION_TYPE_LABELS)
                                .filter(([k]) => k.startsWith('date_'))
                                .map(([k, v]) => <option key={k} value={k}>{v}</option>)
                              }
                            </select>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Filters */}
              {activeStep === 'filters' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium uppercase tracking-wider ${textSecondary}`}>Filters</p>
                    <button onClick={addFilter} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-500 hover:bg-blue-500/10 transition-colors">
                      <Plus className="w-3 h-3" />Add
                    </button>
                  </div>

                  {/* Date Range */}
                  <div className={`p-3 rounded-xl border space-y-2 ${cardBg}`}>
                    <p className={`text-xs font-medium ${textPrimary}`}>Date Range</p>
                    <select
                      value={config.date_range?.field || ''}
                      onChange={(e) => {
                        if (!e.target.value) { updateConfig({ date_range: null }); return; }
                        updateConfig({
                          date_range: {
                            field: e.target.value,
                            start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                            end: format(new Date(), 'yyyy-MM-dd'),
                          },
                        });
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                    >
                      <option value="">No date filter</option>
                      {dateFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                    {config.date_range && (
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={config.date_range.start}
                          onChange={(e) => updateConfig({ date_range: { ...config.date_range!, start: e.target.value } })}
                          className={`flex-1 px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                        />
                        <input
                          type="date"
                          value={config.date_range.end}
                          onChange={(e) => updateConfig({ date_range: { ...config.date_range!, end: e.target.value } })}
                          className={`flex-1 px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                        />
                      </div>
                    )}
                    {/* Quick presets */}
                    {config.date_range && (
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { label: '7d', days: 7 },
                          { label: '30d', days: 30 },
                          { label: '90d', days: 90 },
                          { label: '6mo', days: 180 },
                          { label: '1yr', days: 365 },
                        ].map(p => (
                          <button
                            key={p.label}
                            onClick={() => updateConfig({
                              date_range: {
                                ...config.date_range!,
                                start: format(subDays(new Date(), p.days), 'yyyy-MM-dd'),
                                end: format(new Date(), 'yyyy-MM-dd'),
                              },
                            })}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${isMidnight ? 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.08]' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Field filters */}
                  {config.filters.map((filter, i) => (
                    <div key={i} className={`p-3 rounded-xl border space-y-2 ${cardBg}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${textPrimary}`}>Filter {i + 1}</span>
                        <button onClick={() => removeFilter(i)} className="p-1 rounded text-red-500 hover:bg-red-500/10">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(i, { field: e.target.value })}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                      >
                        {sourceFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(i, { operator: e.target.value as any })}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                      >
                        {Object.entries(FILTER_OPERATOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(i, { value: e.target.value })}
                        placeholder="Value..."
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                      />
                    </div>
                  ))}

                  {config.filters.length === 0 && (
                    <p className={`text-xs ${textSecondary} text-center py-2`}>No additional filters</p>
                  )}

                  {/* Limit */}
                  <div className={`p-3 rounded-xl border space-y-2 ${cardBg}`}>
                    <p className={`text-xs font-medium ${textPrimary}`}>Row Limit</p>
                    <input
                      type="number"
                      value={config.limit || ''}
                      onChange={(e) => updateConfig({ limit: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="No limit (max 10,000)"
                      min={1}
                      max={10000}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-sm ${inputBg}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel — preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Preview header */}
            <div className={`flex items-center justify-between px-6 py-3 border-b shrink-0 ${border}`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${textPrimary}`}>Preview</span>
                {previewLoaded && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isMidnight ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600'}`}>
                    {previewData.length} rows
                  </span>
                )}
              </div>
              {executing && (
                <span className={`text-xs flex items-center gap-1 ${textSecondary}`}>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              )}
            </div>

            {/* Chart area */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
              {!previewLoaded && !executing ? (
                <div className="text-center">
                  <BarChart3 className={`w-12 h-12 mx-auto mb-3 ${textSecondary} opacity-30`} />
                  <p className={`text-sm ${textSecondary}`}>Configure your report to see a preview</p>
                  <p className={`text-xs mt-1 ${textSecondary} opacity-60`}>Select a data source, add metrics, and click Preview</p>
                </div>
              ) : executing ? (
                <div className="text-center">
                  <Loader2 className={`w-8 h-8 mx-auto animate-spin ${textSecondary}`} />
                  <p className={`text-sm mt-3 ${textSecondary}`}>Running report...</p>
                </div>
              ) : (
                <div className="w-full">
                  <ChartRenderer
                    chartType={config.chart_type}
                    data={previewData}
                    config={config}
                    theme={theme}
                    height={Math.max(320, window.innerHeight * 0.5)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
