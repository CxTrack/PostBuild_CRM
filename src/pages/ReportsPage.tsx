import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, TrendingUp, TrendingDown, Users, Phone, DollarSign,
    Download, Calendar, ChevronDown, ChevronRight,
    ArrowUpRight, ArrowDownRight, HelpCircle, CreditCard,
    Activity, Target, Clock, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { useThemeStore } from '@/stores/themeStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useCallStore } from '@/stores/callStore';
import { useDealStore } from '@/stores/dealStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { PageContainer, Card } from '@/components/theme/ThemeComponents';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { usePageLabels } from '@/hooks/usePageLabels';

// Helper to format duration in seconds to mm:ss
const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Chart colors
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
const CHART_COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
};

// Date presets
const DATE_PRESETS = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'This Month', days: -1 },
    { label: 'Last 6 Months', days: 180 },
];

// Report sections
type ReportSection = 'overview' | 'revenue' | 'subscriptions' | 'customers' | 'pipeline' | 'calls' | 'team';

export const ReportsPage = () => {
    const { theme } = useThemeStore();
    const navigate = useNavigate();
    const { invoices, fetchInvoices } = useInvoiceStore();
    const { customers, fetchCustomers } = useCustomerStore();
    const { calls, fetchCalls } = useCallStore();
    const { fetchPipelineStats, pipelineStats } = useDealStore();
    const { currentOrganization } = useOrganizationStore();

    // Industry-specific labels
    const crmLabels = usePageLabels('crm');
    const pipelineLabels = usePageLabels('pipeline');

    const [activeSection, setActiveSection] = useState<ReportSection>('overview');
    const [datePreset, setDatePreset] = useState('Last 30 Days');
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
    });
    const [expandedChart, setExpandedChart] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Subscription tracking state
    interface SubscriptionData {
        id: string;
        plan_name: string;
        plan_amount: number;
        interval: string;
        status: string;
        created_at: string;
        canceled_at?: string;
    }
    const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);

    const isDark = theme === 'dark';

    // Load subscription data
    useEffect(() => {
        const loadSubscriptions = async () => {
            setSubsLoading(true);
            const { data } = await supabase
                .from('subscriptions')
                .select('id, plan_name, plan_amount, interval, status, created_at, canceled_at')
                .order('created_at', { ascending: false });
            setSubscriptions(data || []);
            setSubsLoading(false);
        };
        loadSubscriptions();

        if (currentOrganization?.id) {
            Promise.all([
                fetchInvoices(),
                fetchCustomers(),
                fetchCalls(),
                fetchPipelineStats()
            ]);
        }
    }, [currentOrganization?.id]);

    // Subscription metrics calculations
    const subscriptionMetrics = useMemo(() => {
        const activeSubs = subscriptions.filter(s => s.status === 'active');
        const mrr = activeSubs.reduce((sum, s) => sum + (s.plan_amount / 100), 0);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const subsAtStartOfMonth = subscriptions.filter(s =>
            new Date(s.created_at) < startOfMonth
        );

        const canceledThisMonth = subscriptions.filter(s =>
            s.status === 'canceled' &&
            s.canceled_at &&
            new Date(s.canceled_at) >= startOfMonth
        );

        const newThisMonth = subscriptions.filter(s =>
            new Date(s.created_at) >= startOfMonth && s.status === 'active'
        );

        const churnRate = subsAtStartOfMonth.length > 0
            ? (canceledThisMonth.length / subsAtStartOfMonth.length) * 100
            : 0;

        return {
            mrr,
            arr: mrr * 12,
            activeCount: activeSubs.length,
            churnRate: Math.round(churnRate * 10) / 10,
            churnedThisMonth: canceledThisMonth.length,
            newThisMonth: newThisMonth.length,
        };
    }, [subscriptions]);

    // MRR Trend data (last 6 months)
    const mrrTrendData = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date(),
        });

        return months.map((month) => {
            // Subscriptions active during this month
            const activeInMonth = subscriptions.filter(s => {
                const created = new Date(s.created_at);
                const canceled = s.canceled_at ? new Date(s.canceled_at) : null;
                const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

                return created <= monthEnd && (!canceled || canceled > month);
            });

            const mrr = activeInMonth.reduce((sum, s) => sum + (s.plan_amount / 100), 0);

            // New subscriptions this month
            const newSubs = subscriptions.filter(s => {
                const created = new Date(s.created_at);
                return created.getMonth() === month.getMonth() &&
                    created.getFullYear() === month.getFullYear();
            }).length;

            // Churned subscriptions this month
            const churned = subscriptions.filter(s => {
                if (!s.canceled_at) return false;
                const canceled = new Date(s.canceled_at);
                return canceled.getMonth() === month.getMonth() &&
                    canceled.getFullYear() === month.getFullYear();
            }).length;

            return {
                month: format(month, 'MMM'),
                mrr,
                new: newSubs,
                churned,
            };
        });
    }, [subscriptions]);

    // Handle date preset change
    const handlePresetChange = (preset: typeof DATE_PRESETS[0]) => {
        setDatePreset(preset.label);
        if (preset.days === -1) {
            // This month
            setDateRange({
                start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
            });
        } else {
            setDateRange({
                start: format(subDays(new Date(), preset.days), 'yyyy-MM-dd'),
                end: format(new Date(), 'yyyy-MM-dd'),
            });
        }
    };

    // Generate revenue data
    const revenueData = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date(),
        });

        return months.map((month) => {
            const monthInvoices = invoices.filter(inv => {
                const invDate = new Date(inv.created_at || '');
                return invDate.getMonth() === month.getMonth() && invDate.getFullYear() === month.getFullYear();
            });

            const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
            const paid = monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

            return {
                month: format(month, 'MMM'),
                revenue,
                paid,
                pending: revenue - paid,
            };
        });
    }, [invoices]);

    // Generate customer growth data
    const customerGrowthData = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date(),
        });

        let cumulative = 0;
        return months.map((month) => {
            const newCustomers = customers.filter(c => {
                const cDate = new Date(c.created_at || '');
                return cDate.getMonth() === month.getMonth() && cDate.getFullYear() === month.getFullYear();
            }).length;

            cumulative += newCustomers;
            return {
                month: format(month, 'MMM'),
                new: newCustomers,
                total: cumulative,
            };
        });
    }, [customers]);

    // Pipeline data
    const pipelineData = useMemo(() => {
        if (!pipelineStats?.by_stage) {
            // Return empty stages with zero values when no data
            const stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
            return stages.map((stage, i) => ({
                name: stage,
                value: 0,
                color: COLORS[i % COLORS.length],
            }));
        }

        return Object.entries(pipelineStats.by_stage).map(([stage, stats], i) => ({
            name: stage.charAt(0).toUpperCase() + stage.slice(1),
            value: (stats as any).count,
            color: COLORS[i % COLORS.length],
        }));
    }, [pipelineStats]);

    // Call analytics data
    const callData = useMemo(() => {
        const aiCalls = calls.filter(c => c.call_type === 'ai_agent').length;
        const humanCalls = calls.filter(c => c.call_type === 'human').length;
        const inbound = calls.filter(c => c.direction === 'inbound').length;
        const outbound = calls.filter(c => c.direction === 'outbound').length;

        // Calculate sentiment from actual call data
        const positiveCalls = calls.filter(c => (c as any).sentiment === 'positive').length;
        const neutralCalls = calls.filter(c => (c as any).sentiment === 'neutral').length;
        const negativeCalls = calls.filter(c => (c as any).sentiment === 'negative').length;

        return {
            byType: [
                { name: 'AI Agent', value: aiCalls, color: CHART_COLORS.purple },
                { name: 'Human', value: humanCalls, color: CHART_COLORS.primary },
            ],
            byDirection: [
                { name: 'Inbound', value: inbound, color: CHART_COLORS.success },
                { name: 'Outbound', value: outbound, color: CHART_COLORS.warning },
            ],
            bySentiment: [
                { name: 'Positive', value: positiveCalls, color: CHART_COLORS.success },
                { name: 'Neutral', value: neutralCalls, color: CHART_COLORS.warning },
                { name: 'Negative', value: negativeCalls, color: CHART_COLORS.danger },
            ],
        };
    }, [calls]);

    // Team performance data - will be populated from actual data
    const teamData = useMemo(() => [] as { name: string; tasks: number; calls: number; revenue: number; efficiency: number }[], []);

    // Summary stats
    const summaryStats = useMemo(() => {
        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const paidRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalCustomers = customers.length;
        const totalCalls = calls.length;

        return [
            {
                label: 'Total Revenue',
                value: `$${totalRevenue.toLocaleString()}`,
                change: '+12.5%',
                isPositive: true,
                icon: DollarSign,
                color: 'blue',
            },
            {
                label: crmLabels.entityPlural,
                value: totalCustomers.toString(),
                change: '+8.2%',
                isPositive: true,
                icon: Users,
                color: 'green',
            },
            {
                label: 'Total Calls',
                value: totalCalls.toString(),
                change: '+24.1%',
                isPositive: true,
                icon: Phone,
                color: 'purple',
            },
            {
                label: 'Collection Rate',
                value: totalRevenue > 0 ? `${((paidRevenue / totalRevenue) * 100).toFixed(0)}%` : '0%',
                change: '+5.3%',
                isPositive: true,
                icon: Target,
                color: 'amber',
            },
        ];
    }, [invoices, customers, calls]);

    // Export functions
    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success('CSV downloaded successfully!');
    };

    const exportToPDF = (title: string, data: any[]) => {
        if (data.length === 0) {
            toast.error('No data to export');
            return;
        }

        const doc = new jsPDF();
        const headers = Object.keys(data[0]);

        // Title
        doc.setFontSize(18);
        doc.setTextColor(59, 130, 246);
        doc.text(title, 14, 22);

        // Date
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 30);
        doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 36);

        // Table
        autoTable(doc, {
            head: [headers.map(h => h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' '))],
            body: data.map(row => headers.map(h => row[h]?.toString() ?? '')),
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success('PDF downloaded successfully!');
    };

    // Section nav items
    const sections = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
        { id: 'customers', label: crmLabels.entityPlural, icon: Users },
        { id: 'pipeline', label: pipelineLabels.title, icon: Target },
        { id: 'calls', label: 'Calls', icon: Phone },
        { id: 'team', label: 'Team', icon: Activity },
    ];

    // Theme-aware helper classes
    const isMidnight = theme === 'midnight';
    const isSoftModern = theme === 'soft-modern';

    const textPrimary = isMidnight ? 'text-white' : isSoftModern ? 'text-gray-800' : 'text-gray-900 dark:text-white';
    const textSecondary = isMidnight ? 'text-gray-400' : isSoftModern ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400';
    const textMuted = isMidnight ? 'text-gray-500' : isSoftModern ? 'text-gray-400' : 'text-gray-400 dark:text-gray-500';
    const borderColor = isMidnight ? 'border-white/[0.08]' : isSoftModern ? 'border-gray-200' : 'border-gray-200 dark:border-gray-700';
    const hoverBg = isMidnight ? 'hover:bg-white/[0.05]' : isSoftModern ? 'hover:bg-gray-100' : 'hover:bg-gray-100 dark:hover:bg-gray-700';
    const subtleBg = isMidnight ? 'bg-white/[0.03]' : isSoftModern ? 'bg-white' : 'bg-gray-50 dark:bg-gray-800';
    const chartGridColor = isMidnight ? '#333' : isDark ? '#374151' : '#E5E7EB';
    const chartAxisColor = isMidnight ? '#666' : isDark ? '#9CA3AF' : '#6B7280';
    const tooltipBg = isMidnight ? '#1a1a1a' : isDark ? '#1F2937' : '#FFF';

    // Chart card component
    const ChartCard = ({ title, children, onExport, expandable = true }: {
        title: string;
        children: React.ReactNode;
        onExport?: () => void;
        expandable?: boolean;
    }) => (
        <Card className="!p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${textPrimary}`}>{title}</h3>
                <div className="flex items-center gap-2">
                    {onExport && (
                        <button
                            onClick={onExport}
                            className={`p-1.5 rounded-lg transition-colors ${textMuted} ${hoverBg}`}
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    )}
                    {expandable && (
                        <button
                            onClick={() => setExpandedChart(expandedChart === title ? null : title)}
                            className={`p-1.5 rounded-lg transition-colors ${textMuted} ${hoverBg}`}
                        >
                            {expandedChart === title ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>
            {children}
        </Card>
    );

    // Stat card component
    const StatCard = ({ stat }: { stat: typeof summaryStats[0] }) => {
        const colorClasses: Record<string, string> = isMidnight ? {
            blue: 'bg-blue-500/10 text-blue-400',
            green: 'bg-green-500/10 text-green-400',
            purple: 'bg-purple-500/10 text-purple-400',
            amber: 'bg-amber-500/10 text-amber-400',
        } : {
            blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        };

        return (
            <Card className="!p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className={`text-sm ${textSecondary}`}>{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${textPrimary}`}>{stat.value}</p>
                        <div className={`flex items-center gap-1 mt-2 text-sm ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {stat.change} vs last period
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                        <stat.icon className="w-5 h-5" />
                    </div>
                </div>
            </Card>
        );
    };

    // Tab nav theme classes
    const tabContainerBg = isMidnight ? 'bg-white/[0.03] border border-white/[0.08]' : isSoftModern ? 'bg-[#E8E4DC]' : 'bg-gray-100 dark:bg-gray-800';
    const tabActiveBg = isMidnight ? 'bg-white/[0.08] text-white shadow-sm' : isSoftModern ? 'bg-white text-blue-600 shadow-sm' : 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm';
    const tabInactiveTxt = isMidnight ? 'text-gray-500 hover:text-gray-300' : isSoftModern ? 'text-gray-500 hover:text-gray-700' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white';
    const dropdownBg = isMidnight ? 'bg-gray-900 border-white/[0.1]' : isSoftModern ? 'bg-white border-gray-200' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    const dropdownItemHover = isMidnight ? 'hover:bg-white/[0.05]' : isSoftModern ? 'hover:bg-gray-100' : 'hover:bg-gray-100 dark:hover:bg-gray-700';
    const btnSecondaryClasses = isMidnight
        ? 'bg-white/[0.05] border border-white/[0.1] text-gray-300 hover:bg-white/[0.08]'
        : isSoftModern
            ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700';

    return (
        <PageContainer>
            <div className="max-w-[1800px] mx-auto w-full flex-1">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className={`text-2xl font-bold ${textPrimary}`}>Reports & Analytics</h1>
                        <p className={`text-sm mt-1 ${textSecondary}`}>
                            Comprehensive insights across your business
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Date Preset Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${btnSecondaryClasses}`}
                            >
                                <Calendar className="w-4 h-4" />
                                {datePreset}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showFilters && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                                    <div className={`absolute right-0 top-full mt-2 z-20 rounded-xl shadow-lg border py-2 min-w-[180px] ${dropdownBg}`}>
                                        {DATE_PRESETS.map(preset => (
                                            <button
                                                key={preset.label}
                                                onClick={() => { handlePresetChange(preset); setShowFilters(false); }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${datePreset === preset.label
                                                    ? (isMidnight ? 'bg-white/[0.08] text-blue-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600')
                                                    : `${dropdownItemHover} ${isMidnight ? 'text-gray-400' : isSoftModern ? 'text-gray-700' : 'text-gray-700 dark:text-gray-300'}`
                                                    }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Export All Button */}
                        <button
                            onClick={() => {
                                const allData = invoices.map(inv => ({
                                    id: inv.id,
                                    customer: inv.customer_name || 'Unknown',
                                    total: inv.total_amount,
                                    status: inv.status,
                                    date: inv.created_at,
                                }));
                                exportToPDF('Complete Business Report', allData);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export Report</span>
                        </button>
                    </div>
                </div>

                {/* Section Navigation */}
                <div className={`flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto ${tabContainerBg}`}>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id as ReportSection)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeSection === section.id
                                ? tabActiveBg
                                : tabInactiveTxt
                                }`}
                        >
                            <section.icon className="w-4 h-4" />
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Overview Section */}
                {activeSection === 'overview' && (
                    <div className="space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {summaryStats.map((stat, i) => (
                                <StatCard key={i} stat={stat} />
                            ))}
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue Trend */}
                            <ChartCard
                                title="Revenue Trend"
                                onExport={() => exportToCSV(revenueData, 'revenue_trend')}
                            >
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                            <XAxis dataKey="month" stroke={chartAxisColor} fontSize={12} />
                                            <YAxis stroke={chartAxisColor} fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: tooltipBg, border: isMidnight ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '8px', color: isDark || isMidnight ? '#fff' : '#111' }}
                                                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Customer Growth */}
                            <ChartCard
                                title="Customer Growth"
                                onExport={() => exportToCSV(customerGrowthData, 'customer_growth')}
                            >
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={customerGrowthData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                            <XAxis dataKey="month" stroke={chartAxisColor} fontSize={12} />
                                            <YAxis stroke={chartAxisColor} fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: isMidnight ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '8px', color: isDark || isMidnight ? '#fff' : '#111' }} />
                                            <Bar dataKey="new" name="New Customers" fill="#10B981" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Pipeline Breakdown */}
                            <ChartCard
                                title="Pipeline Stages"
                                onExport={() => exportToCSV(pipelineData, 'pipeline_stages')}
                            >
                                <div className="h-64 flex items-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pipelineData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {pipelineData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: isMidnight ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '8px', color: isDark || isMidnight ? '#fff' : '#111' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Call Distribution */}
                            <ChartCard
                                title="Call Analytics"
                                onExport={() => exportToCSV(callData.byType, 'call_analytics')}
                            >
                                <div className="h-64 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className={`text-xs font-medium mb-2 ${textSecondary}`}>By Type</p>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <PieChart>
                                                <Pie data={callData.byType} cx="50%" cy="50%" outerRadius={50} dataKey="value">
                                                    {callData.byType.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div>
                                        <p className={`text-xs font-medium mb-2 ${textSecondary}`}>By Sentiment</p>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <PieChart>
                                                <Pie data={callData.bySentiment} cx="50%" cy="50%" outerRadius={50} dataKey="value">
                                                    {callData.bySentiment.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                )}

                {/* Revenue Section */}
                {activeSection === 'revenue' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {summaryStats.slice(0, 1).map((stat, i) => <StatCard key={i} stat={stat} />)}
                            <StatCard stat={{ label: 'Paid', value: `$${invoices.filter(inv => inv.status === 'paid').reduce((s, inv) => s + (inv.total_amount || 0), 0).toLocaleString()}`, change: '+15.2%', isPositive: true, icon: CheckCircle, color: 'green' }} />
                            <StatCard stat={{ label: 'Sent', value: `$${invoices.filter(inv => inv.status === 'sent').reduce((s, inv) => s + (inv.total_amount || 0), 0).toLocaleString()}`, change: '-3.1%', isPositive: true, icon: Clock, color: 'amber' }} />
                            <StatCard stat={{ label: 'Overdue', value: `$${invoices.filter(inv => inv.status === 'overdue').reduce((s, inv) => s + (inv.total_amount || 0), 0).toLocaleString()}`, change: '+2.4%', isPositive: false, icon: AlertTriangle, color: 'amber' }} />
                        </div>

                        <ChartCard title="Monthly Revenue Breakdown" onExport={() => exportToCSV(revenueData, 'monthly_revenue')}>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                        <XAxis dataKey="month" stroke={chartAxisColor} />
                                        <YAxis stroke={chartAxisColor} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: isMidnight ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '8px', color: isDark || isMidnight ? '#fff' : '#111' }} formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                                        <Legend />
                                        <Bar dataKey="paid" name="Paid" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="pending" name="Pending" fill="#F59E0B" stackId="a" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        {/* Invoice Table */}
                        <ChartCard title="Recent Invoices" onExport={() => exportToPDF('Invoice Report', invoices.map(inv => ({ id: inv.id?.slice(0, 8), customer: inv.customer_name, total: `$${inv.total_amount}`, status: inv.status, date: inv.created_at?.split('T')[0] })))}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b ${borderColor}`}>
                                            <th className={`text-left py-3 px-2 font-medium ${textSecondary}`}>Invoice</th>
                                            <th className={`text-left py-3 px-2 font-medium ${textSecondary}`}>Customer</th>
                                            <th className={`text-right py-3 px-2 font-medium ${textSecondary}`}>Amount</th>
                                            <th className={`text-center py-3 px-2 font-medium ${textSecondary}`}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.slice(0, 5).map((invoice) => (
                                            <tr key={invoice.id} className={`border-b last:border-b-0 ${borderColor} ${hoverBg} cursor-pointer`} onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                                <td className={`py-3 px-2 font-medium ${textPrimary}`}>#{invoice.id?.slice(-6)}</td>
                                                <td className={`py-3 px-2 ${textSecondary}`}>{invoice.customer_name || 'Unknown'}</td>
                                                <td className={`py-3 px-2 text-right font-medium ${textPrimary}`}>${(invoice.total_amount || 0).toLocaleString()}</td>
                                                <td className="py-3 px-2 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid'
                                                        ? (isMidnight ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400')
                                                        : invoice.status === 'overdue'
                                                            ? (isMidnight ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')
                                                            : (isMidnight ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400')
                                                        }`}>
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    </div>
                )}

                {/* Subscriptions Section */}
                {activeSection === 'subscriptions' && (
                    <div className="space-y-6">
                        {subsLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                            </div>
                        ) : (
                            <>
                                {/* Subscription Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard stat={{
                                        label: 'Monthly Recurring Revenue',
                                        value: `$${subscriptionMetrics.mrr.toLocaleString()}`,
                                        change: '+12.5%',
                                        isPositive: true,
                                        icon: DollarSign,
                                        color: 'green'
                                    }} />
                                    <StatCard stat={{
                                        label: 'Annual Recurring Revenue',
                                        value: `$${subscriptionMetrics.arr.toLocaleString()}`,
                                        change: '+12.5%',
                                        isPositive: true,
                                        icon: TrendingUp,
                                        color: 'blue'
                                    }} />
                                    <StatCard stat={{
                                        label: 'Active Subscriptions',
                                        value: subscriptionMetrics.activeCount.toString(),
                                        change: `+${subscriptionMetrics.newThisMonth} new`,
                                        isPositive: true,
                                        icon: CreditCard,
                                        color: 'purple'
                                    }} />
                                    <StatCard stat={{
                                        label: 'Churn Rate (30d)',
                                        value: `${subscriptionMetrics.churnRate}%`,
                                        change: subscriptionMetrics.churnedThisMonth > 0 ? `-${subscriptionMetrics.churnedThisMonth} lost` : 'No churn',
                                        isPositive: subscriptionMetrics.churnRate < 5,
                                        icon: TrendingDown,
                                        color: 'amber'
                                    }} />
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* MRR Trend Chart */}
                                    <ChartCard title="MRR Trend" onExport={() => exportToCSV(mrrTrendData, 'mrr_trend')}>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={mrrTrendData}>
                                                    <defs>
                                                        <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                                    <XAxis dataKey="month" stroke={chartAxisColor} fontSize={12} />
                                                    <YAxis stroke={chartAxisColor} fontSize={12} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: tooltipBg, border: isMidnight ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '8px', color: isDark || isMidnight ? '#fff' : '#111' }}
                                                        formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'MRR']}
                                                    />
                                                    <Area type="monotone" dataKey="mrr" stroke="#10B981" strokeWidth={2} fill="url(#colorMRR)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </ChartCard>

                                    {/* Subscription Changes Chart */}
                                    <ChartCard title="Subscription Changes" onExport={() => exportToCSV(mrrTrendData, 'subscription_changes')}>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={mrrTrendData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                                    <XAxis dataKey="month" stroke={chartAxisColor} fontSize={12} />
                                                    <YAxis stroke={chartAxisColor} fontSize={12} />
                                                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: isMidnight ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '8px', color: isDark || isMidnight ? '#fff' : '#111' }} />
                                                    <Legend />
                                                    <Bar dataKey="new" name="New Subscriptions" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="churned" name="Churned" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </ChartCard>
                                </div>

                                {/* Churn Health Indicator */}
                                <ChartCard title="Subscription Health" expandable={false}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className={`p-4 rounded-xl ${subtleBg}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-lg ${subscriptionMetrics.churnRate < 3
                                                    ? (isMidnight ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400')
                                                    : subscriptionMetrics.churnRate < 7
                                                        ? (isMidnight ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400')
                                                        : (isMidnight ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400')
                                                    }`}>
                                                    {subscriptionMetrics.churnRate < 3 ? <CheckCircle className="w-5 h-5" /> : subscriptionMetrics.churnRate < 7 ? <AlertTriangle className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${textPrimary}`}>Churn Health</p>
                                                    <p className={`text-xs ${textSecondary}`}>
                                                        {subscriptionMetrics.churnRate < 3 ? 'Excellent' : subscriptionMetrics.churnRate < 7 ? 'Moderate' : 'Needs Attention'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`w-full h-2 rounded-full ${isMidnight ? 'bg-white/[0.06]' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                <div
                                                    className={`h-2 rounded-full ${subscriptionMetrics.churnRate < 3 ? 'bg-green-500' : subscriptionMetrics.churnRate < 7 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(subscriptionMetrics.churnRate * 10, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className={`p-4 rounded-xl ${subtleBg}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-lg ${isMidnight ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${textPrimary}`}>Net Growth</p>
                                                    <p className={`text-xs ${textSecondary}`}>This Month</p>
                                                </div>
                                            </div>
                                            <p className={`text-2xl font-bold ${subscriptionMetrics.newThisMonth - subscriptionMetrics.churnedThisMonth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {subscriptionMetrics.newThisMonth - subscriptionMetrics.churnedThisMonth >= 0 ? '+' : ''}
                                                {subscriptionMetrics.newThisMonth - subscriptionMetrics.churnedThisMonth}
                                            </p>
                                        </div>

                                        <div className={`p-4 rounded-xl ${subtleBg}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`p-2 rounded-lg ${isMidnight ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                    <Target className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${textPrimary}`}>Avg Revenue/Sub</p>
                                                    <p className={`text-xs ${textSecondary}`}>ARPU</p>
                                                </div>
                                            </div>
                                            <p className={`text-2xl font-bold ${textPrimary}`}>
                                                ${subscriptionMetrics.activeCount > 0 ? (subscriptionMetrics.mrr / subscriptionMetrics.activeCount).toFixed(0) : 0}
                                            </p>
                                        </div>
                                    </div>
                                </ChartCard>
                            </>
                        )}
                    </div>
                )}

                {/* Team Section */}
                {activeSection === 'team' && (
                    <div className="space-y-6">
                        <ChartCard title="Team Performance" onExport={() => exportToCSV(teamData, 'team_performance')}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b ${borderColor}`}>
                                            <th className={`text-left py-3 px-2 font-medium ${textSecondary}`}>Team Member</th>
                                            <th className={`text-center py-3 px-2 font-medium ${textSecondary}`}>Tasks</th>
                                            <th className={`text-center py-3 px-2 font-medium ${textSecondary}`}>Calls</th>
                                            <th className={`text-right py-3 px-2 font-medium ${textSecondary}`}>Revenue</th>
                                            <th className={`text-center py-3 px-2 font-medium ${textSecondary}`}>
                                                <div className="flex items-center justify-center gap-1 group relative">
                                                    Efficiency
                                                    <HelpCircle className={`w-3.5 h-3.5 ${textMuted} cursor-help`} />
                                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg ${isMidnight ? 'bg-gray-800 border border-white/[0.1]' : 'bg-gray-900 dark:bg-gray-700'}`}>
                                                        <div className="font-semibold mb-1">How Efficiency is Calculated:</div>
                                                        <div className="space-y-0.5 text-gray-300">
                                                            <div>• Tasks Completed: 40%</div>
                                                            <div>• Calls Made: 30%</div>
                                                            <div>• Revenue Generated: 30%</div>
                                                        </div>
                                                        <div className="mt-1 text-gray-400 italic">Normalized against team average</div>
                                                        <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${isMidnight ? 'border-t-gray-800' : 'border-t-gray-900 dark:border-t-gray-700'}`} />
                                                    </div>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamData.map((member, i) => (
                                            <tr key={i} className={`border-b last:border-b-0 ${borderColor}`}>
                                                <td className={`py-4 px-2 font-medium ${textPrimary}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        {member.name}
                                                    </div>
                                                </td>
                                                <td className={`py-4 px-2 text-center ${textSecondary}`}>{member.tasks}</td>
                                                <td className={`py-4 px-2 text-center ${textSecondary}`}>{member.calls}</td>
                                                <td className={`py-4 px-2 text-right font-medium ${textPrimary}`}>${member.revenue.toLocaleString()}</td>
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <div className={`w-16 h-2 rounded-full ${isMidnight ? 'bg-white/[0.06]' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                            <div className="h-2 rounded-full bg-green-500" style={{ width: `${member.efficiency}%` }} />
                                                        </div>
                                                        <span className="text-sm font-medium text-green-500">{member.efficiency}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ChartCard>
                    </div>
                )}

                {/* Customers Section */}
                {activeSection === 'customers' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard stat={{ label: 'Total Customers', value: customers.length.toString(), change: '+8.2%', isPositive: true, icon: Users, color: 'blue' }} />
                            <StatCard stat={{ label: 'Business', value: customers.filter(c => (c as any).type === 'business').length.toString(), change: '+12.4%', isPositive: true, icon: Target, color: 'purple' }} />
                            <StatCard stat={{ label: 'Personal', value: customers.filter(c => (c as any).type === 'personal').length.toString(), change: '+3.1%', isPositive: true, icon: Users, color: 'green' }} />
                            <StatCard stat={{ label: 'New This Month', value: '4', change: '+25%', isPositive: true, icon: TrendingUp, color: 'amber' }} />
                        </div>

                        <ChartCard title="Customer Growth Over Time" onExport={() => exportToCSV(customerGrowthData, 'customer_growth')}>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={customerGrowthData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                        <XAxis dataKey="month" stroke={chartAxisColor} />
                                        <YAxis stroke={chartAxisColor} />
                                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: isMidnight ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '8px', color: isDark || isMidnight ? '#fff' : '#111' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="total" name="Total Customers" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
                                        <Line type="monotone" dataKey="new" name="New" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    </div>
                )}

                {/* Pipeline Section */}
                {activeSection === 'pipeline' && (
                    <div className="space-y-6">
                        <ChartCard title="Pipeline by Stage" onExport={() => exportToCSV(pipelineData, 'pipeline_stages')}>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pipelineData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                        <XAxis type="number" stroke={chartAxisColor} />
                                        <YAxis type="category" dataKey="name" stroke={chartAxisColor} width={100} />
                                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: isMidnight ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius: '8px', color: isDark || isMidnight ? '#fff' : '#111' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {pipelineData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    </div>
                )}

                {/* Calls Section */}
                {activeSection === 'calls' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard stat={{ label: 'Total Calls', value: calls.length.toString(), change: '+0%', isPositive: true, icon: Phone, color: 'blue' }} />
                            <StatCard stat={{ label: 'AI Calls', value: calls.filter(c => c.call_type === 'ai_agent').length.toString(), change: '+0%', isPositive: true, icon: Activity, color: 'purple' }} />
                            <StatCard stat={{ label: 'Avg Duration', value: calls.length > 0 ? formatDuration(calls.reduce((sum, c) => sum + ((c as any).duration || 0), 0) / calls.length) : '0:00', change: '+0%', isPositive: true, icon: Clock, color: 'green' }} />
                            <StatCard stat={{ label: 'Positive Sentiment', value: calls.length > 0 ? `${Math.round((calls.filter(c => (c as any).sentiment === 'positive').length / calls.length) * 100)}%` : '0%', change: '+0%', isPositive: true, icon: TrendingUp, color: 'amber' }} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="Calls by Type" onExport={() => exportToCSV(callData.byType, 'calls_by_type')}>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={callData.byType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                                {callData.byType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Calls by Direction" onExport={() => exportToCSV(callData.byDirection, 'calls_by_direction')}>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={callData.byDirection} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                                {callData.byDirection.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            <ChartCard title="Sentiment Distribution" onExport={() => exportToCSV(callData.bySentiment, 'sentiment_distribution')}>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={callData.bySentiment} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                                {callData.bySentiment.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                )}

                {/* Mobile Download Section */}
                <div className="md:hidden mt-8">
                    <h3 className={`font-semibold mb-4 ${textPrimary}`}>Quick Downloads</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Revenue Report', data: revenueData, filename: 'revenue' },
                            { label: 'Customer Report', data: customers.map(c => ({ name: c.name, type: c.type, email: c.email })), filename: 'customers' },
                            { label: 'Call Report', data: callData.byType, filename: 'calls' },
                            { label: 'Team Report', data: teamData, filename: 'team' },
                        ].map((report, i) => (
                            <button
                                key={i}
                                onClick={() => exportToCSV(report.data, report.filename)}
                                className={`flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors ${btnSecondaryClasses}`}
                            >
                                <Download className="w-4 h-4" />
                                {report.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default ReportsPage;
