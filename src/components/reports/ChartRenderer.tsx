import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ScatterChart, Scatter
} from 'recharts';
import type { ChartType, ReportConfig } from './reportFieldMeta';
import { DEFAULT_COLORS } from './reportFieldMeta';

interface ChartRendererProps {
  chartType: ChartType;
  data: Record<string, any>[];
  config: ReportConfig;
  theme: string;
  height?: number;
}

export const ChartRenderer = ({ chartType, data, config, theme, height = 320 }: ChartRendererProps) => {
  const isMidnight = theme === 'midnight';
  const isDark = theme === 'dark' || theme === 'midnight';

  const chartGridColor = isMidnight ? '#333' : isDark ? '#374151' : '#E5E7EB';
  const chartAxisColor = isMidnight ? '#666' : isDark ? '#9CA3AF' : '#6B7280';
  const tooltipBg = isMidnight ? '#1a1a2e' : isDark ? '#1F2937' : '#fff';
  const tooltipBorder = isMidnight ? 'rgba(255,255,255,0.1)' : isDark ? '#374151' : '#E5E7EB';
  const tooltipText = isMidnight ? '#e0e0e0' : isDark ? '#F3F4F6' : '#111827';
  const colors = config.colors || DEFAULT_COLORS;

  const { dimensionKey, metricKeys } = useMemo(() => {
    if (!data || data.length === 0) return { dimensionKey: '', metricKeys: [] };
    const keys = Object.keys(data[0]);
    // Dimensions are the non-numeric (grouping) keys, metrics are numeric
    const dims = config.dimensions.map(d => d.label);
    const mets = config.metrics.map(m => m.label);
    // Fallback: first key is dimension, rest are metrics
    const dimKey = dims.find(d => keys.includes(d)) || keys[0] || '';
    const metKeys = mets.filter(m => keys.includes(m));
    if (metKeys.length === 0) {
      // All non-dimension keys
      return { dimensionKey: dimKey, metricKeys: keys.filter(k => k !== dimKey) };
    }
    return { dimensionKey: dimKey, metricKeys: metKeys };
  }, [data, config]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${isMidnight ? 'text-gray-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`} style={{ height }}>
        <div className="text-center">
          <p className="text-sm">No data available</p>
          <p className="text-xs mt-1 opacity-60">Adjust your filters or data source</p>
        </div>
      </div>
    );
  }

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(value % 1 === 0 ? 0 : 2);
    }
    return String(value ?? '');
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ color: tooltipText, fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || colors[i], fontSize: 12 }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </p>
        ))}
      </div>
    );
  };

  const pieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div style={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ color: tooltipText, fontWeight: 600, fontSize: 12 }}>{d.name}</p>
        <p style={{ color: d.payload?.fill || colors[0], fontSize: 12 }}>
          {typeof d.value === 'number' ? d.value.toLocaleString() : d.value}
        </p>
      </div>
    );
  };

  // Truncate long labels
  const formatLabel = (val: any) => {
    const s = String(val ?? '');
    return s.length > 16 ? s.slice(0, 14) + '...' : s;
  };

  switch (chartType) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
            <XAxis dataKey={dimensionKey} tick={{ fill: chartAxisColor, fontSize: 11 }} tickFormatter={formatLabel} />
            <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} tickFormatter={formatValue} />
            <Tooltip content={customTooltip} />
            {metricKeys.length > 1 && <Legend />}
            {metricKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'stacked_bar':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
            <XAxis dataKey={dimensionKey} tick={{ fill: chartAxisColor, fontSize: 11 }} tickFormatter={formatLabel} />
            <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} tickFormatter={formatValue} />
            <Tooltip content={customTooltip} />
            <Legend />
            {metricKeys.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="stack" fill={colors[i % colors.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
            <XAxis dataKey={dimensionKey} tick={{ fill: chartAxisColor, fontSize: 11 }} tickFormatter={formatLabel} />
            <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} tickFormatter={formatValue} />
            <Tooltip content={customTooltip} />
            {metricKeys.length > 1 && <Legend />}
            {metricKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              {metricKeys.map((key, i) => (
                <linearGradient key={key} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
            <XAxis dataKey={dimensionKey} tick={{ fill: chartAxisColor, fontSize: 11 }} tickFormatter={formatLabel} />
            <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} tickFormatter={formatValue} />
            <Tooltip content={customTooltip} />
            {metricKeys.length > 1 && <Legend />}
            {metricKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} fill={`url(#gradient-${i})`} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'pie':
    case 'donut': {
      const pieData = data.map((d, i) => ({
        name: String(d[dimensionKey] ?? `Item ${i + 1}`),
        value: Number(d[metricKeys[0]] || 0),
      }));
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={chartType === 'donut' ? height * 0.15 : 0}
              outerRadius={height * 0.3}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: chartAxisColor }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={pieTooltip} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case 'scatter': {
      if (metricKeys.length < 2) {
        return (
          <div className="flex items-center justify-center text-gray-500" style={{ height }}>
            <p className="text-sm">Scatter plots need at least 2 metrics</p>
          </div>
        );
      }
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
            <XAxis dataKey={metricKeys[0]} name={metricKeys[0]} tick={{ fill: chartAxisColor, fontSize: 11 }} />
            <YAxis dataKey={metricKeys[1]} name={metricKeys[1]} tick={{ fill: chartAxisColor, fontSize: 11 }} />
            <Tooltip content={customTooltip} />
            <Scatter data={data} fill={colors[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    case 'funnel': {
      const sorted = [...data].sort((a, b) => Number(b[metricKeys[0]] || 0) - Number(a[metricKeys[0]] || 0));
      const maxVal = Number(sorted[0]?.[metricKeys[0]] || 1);
      return (
        <div style={{ height }} className="flex flex-col justify-center gap-2 px-4">
          {sorted.map((d, i) => {
            const val = Number(d[metricKeys[0]] || 0);
            const pct = (val / maxVal) * 100;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-xs w-24 text-right truncate ${isMidnight ? 'text-gray-400' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {String(d[dimensionKey] ?? '')}
                </span>
                <div className="flex-1 relative h-7 rounded-md overflow-hidden" style={{ backgroundColor: isMidnight ? 'rgba(255,255,255,0.05)' : isDark ? '#374151' : '#F3F4F6' }}>
                  <div
                    className="h-full rounded-md transition-all flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: colors[i % colors.length] }}
                  >
                    <span className="text-xs font-medium text-white">{val.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case 'table':
      return (
        <div style={{ height, overflow: 'auto' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isMidnight ? 'border-white/10' : isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                {Object.keys(data[0] || {}).map(key => (
                  <th key={key} className={`text-left p-2 font-medium ${isMidnight ? 'text-gray-400' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 100).map((row, i) => (
                <tr key={i} className={`border-b ${isMidnight ? 'border-white/5 hover:bg-white/[0.03]' : isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} className={`p-2 ${isMidnight ? 'text-gray-300' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {typeof val === 'number' ? val.toLocaleString() : String(val ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <div style={{ height }}>Unsupported chart type: {chartType}</div>;
  }
};
