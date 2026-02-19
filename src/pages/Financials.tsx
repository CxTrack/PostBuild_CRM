import React, { useState, useEffect, useMemo } from 'react';
import {
    Receipt, DollarSign, TrendingUp, TrendingDown,
    Plus, PieChart,
    Trash2, Edit, Lock, RefreshCw, Users, AlertTriangle,
    BarChart3
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useExpenseStore } from '@/stores/expenseStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useDealStore } from '@/stores/dealStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useNavigate } from 'react-router-dom';
import { PageContainer, Card, IconBadge, Button } from '@/components/theme/ThemeComponents';
import ExpenseModal from '@/components/financials/ExpenseModal';
import SubscriptionModal from '@/components/subscriptions/SubscriptionModal';
import SubscriptionList from '@/components/subscriptions/SubscriptionList';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePageLabels } from '@/hooks/usePageLabels';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { CustomerSubscription } from '@/types/app.types';

type FinancialTab = 'overview' | 'recurring' | 'expenses';

export const Financials: React.FC = () => {
    const [activeTab, setActiveTab] = useState<FinancialTab>('overview');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<any>(undefined);
    const [selectedSubscription, setSelectedSubscription] = useState<CustomerSubscription | undefined>(undefined);
    const [filterDateRange, setFilterDateRange] = useState('all');

    const { expenses, fetchExpenses, categories, fetchCategories, deleteExpense } = useExpenseStore();
    const { invoices, fetchInvoices } = useInvoiceStore();
    const { currentOrganization } = useOrganizationStore();
    const { deals, fetchDeals } = useDealStore();
    const {
        subscriptions,
        loading: subsLoading,
        mrr,
        churnMetrics,
        fetchSubscriptions,
        fetchMRR,
        fetchChurnRate,
        cancelSubscription,
        pauseSubscription,
        resumeSubscription,
    } = useSubscriptionStore();
    const { canAccessSharedModule } = usePermissions();
    const labels = usePageLabels('financials');
    const navigate = useNavigate();
    const isMortgage = currentOrganization?.industry_template === 'mortgage_broker';

    const hasAccess = canAccessSharedModule('financials');

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchExpenses(currentOrganization.id);
            fetchInvoices(currentOrganization.id);
            fetchCategories(currentOrganization.id);
            fetchSubscriptions(currentOrganization.id);
            fetchMRR(currentOrganization.id);
            fetchChurnRate(currentOrganization.id);
            if (isMortgage) {
                fetchDeals();
            }
        }
    }, [currentOrganization?.id]);

    const stats = useMemo(() => {
        // Filter expenses by date range
        const filteredExpenses = filterDateRange === 'all' ? expenses : expenses.filter(e => {
            const expDate = new Date(e.expense_date);
            const now = new Date();
            switch (filterDateRange) {
                case 'today': return expDate.toDateString() === now.toDateString();
                case '7d': return expDate >= new Date(now.getTime() - 7 * 86400000);
                case '30d': return expDate >= new Date(now.getTime() - 30 * 86400000);
                case '90d': return expDate >= new Date(now.getTime() - 90 * 86400000);
                case 'ytd': return expDate >= new Date(now.getFullYear(), 0, 1);
                default: return true;
            }
        });

        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
        const totalRevenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

        const pendingRevenue = invoices
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + Number(inv.amount_due), 0);

        const commissionIncome = isMortgage
            ? deals
                .filter((d: any) => d.stage === 'funded' || d.final_status === 'Sale')
                .reduce((sum: number, d: any) => sum + Number(d.commission_amount || 0) + Number(d.volume_commission_amount || 0), 0)
            : 0;

        const netProfit = (isMortgage ? commissionIncome : totalRevenue) - totalExpenses;

        return { totalExpenses, totalRevenue, pendingRevenue, netProfit, commissionIncome };
    }, [expenses, invoices, deals, isMortgage, filterDateRange]);

    // Subscription computed stats
    const activeSubscriptionCount = useMemo(() =>
        subscriptions.filter(s => s.status === 'active' || s.status === 'trial').length,
        [subscriptions]
    );

    const arr = mrr * 12;

    const handleDeleteExpense = async (id: string) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            try {
                await deleteExpense(id);
                toast.success('Expense deleted');
            } catch (error) {
                toast.error('Failed to delete');
            }
        }
    };

    const handleCancelSubscription = async (id: string) => {
        if (confirm('Are you sure you want to cancel this subscription? This cannot be undone.')) {
            try {
                await cancelSubscription(id);
                toast.success('Subscription cancelled');
                fetchMRR(currentOrganization?.id);
            } catch (error) {
                toast.error('Failed to cancel subscription');
            }
        }
    };

    const handlePauseSubscription = async (id: string) => {
        try {
            await pauseSubscription(id);
            toast.success('Subscription paused');
            fetchMRR(currentOrganization?.id);
        } catch (error) {
            toast.error('Failed to pause subscription');
        }
    };

    const handleResumeSubscription = async (id: string) => {
        try {
            await resumeSubscription(id);
            toast.success('Subscription resumed');
            fetchMRR(currentOrganization?.id);
        } catch (error) {
            toast.error('Failed to resume subscription');
        }
    };

    const filteredExpensesList = useMemo(() => {
        if (filterDateRange === 'all') return expenses;
        return expenses.filter(e => {
            const expDate = new Date(e.expense_date);
            const now = new Date();
            switch (filterDateRange) {
                case 'today': return expDate.toDateString() === now.toDateString();
                case '7d': return expDate >= new Date(now.getTime() - 7 * 86400000);
                case '30d': return expDate >= new Date(now.getTime() - 30 * 86400000);
                case '90d': return expDate >= new Date(now.getTime() - 90 * 86400000);
                case 'ytd': return expDate >= new Date(now.getFullYear(), 0, 1);
                default: return true;
            }
        });
    }, [expenses, filterDateRange]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

    if (!hasAccess) {
        return (
            <PageContainer>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Lock size={40} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Locked</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                        Your administrator has disabled sharing for this module.
                        Only owners and administrators can access it while sharing is disabled.
                    </p>
                </div>
            </PageContainer>
        );
    }

    const tabs: { id: FinancialTab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'recurring', label: 'Recurring Revenue', icon: RefreshCw },
        { id: 'expenses', label: 'Expenses', icon: Receipt },
    ];

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {labels.subtitle}
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <FilterBar
                        dateRange={{
                            value: filterDateRange,
                            onChange: setFilterDateRange,
                        }}
                        filters={[]}
                        onClearAll={() => setFilterDateRange('all')}
                    />
                    {activeTab === 'expenses' && (
                        <Button variant="danger" onClick={() => setShowExpenseModal(true)} className="flex items-center">
                            <Plus size={18} className="mr-2" />
                            {labels.newButton}
                        </Button>
                    )}
                    {activeTab === 'recurring' && (
                        <Button variant="primary" onClick={() => { setSelectedSubscription(undefined); setShowSubscriptionModal(true); }} className="flex items-center">
                            <Plus size={18} className="mr-2" />
                            New Subscription
                        </Button>
                    )}
                    {activeTab === 'overview' && (
                        <Button variant="danger" onClick={() => setShowExpenseModal(true)} className="flex items-center">
                            <Plus size={18} className="mr-2" />
                            {labels.newButton}
                        </Button>
                    )}
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 border border-transparent'
                        }`}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ==================== OVERVIEW TAB ==================== */}
            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card className="relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <IconBadge icon={<TrendingUp size={24} className="text-emerald-600" />} gradient="bg-emerald-50" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">{isMortgage ? 'Commission Income' : 'Total Revenue'}</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                ${isMortgage ? stats.commissionIncome.toLocaleString() : stats.totalRevenue.toLocaleString()}
                            </h3>
                            <p className="text-xs text-emerald-600 mt-2 font-medium">{isMortgage ? 'From funded applications' : 'Realized from paid invoices'}</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <DollarSign size={80} />
                            </div>
                        </Card>

                        <Card className="relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <IconBadge icon={<TrendingDown size={24} className="text-rose-600" />} gradient="bg-rose-50" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Total Expenses</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                ${stats.totalExpenses.toLocaleString()}
                            </h3>
                            <p className="text-xs text-rose-600 mt-2 font-medium">Tracked operating costs</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Receipt size={80} />
                            </div>
                        </Card>

                        {/* MRR Card */}
                        <Card className="relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <IconBadge icon={<RefreshCw size={24} className="text-blue-600" />} gradient="bg-blue-50" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Monthly Recurring</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                {formatCurrency(mrr)}
                            </h3>
                            <p className="text-xs text-blue-600 mt-2 font-medium">{activeSubscriptionCount} active subscription{activeSubscriptionCount !== 1 ? 's' : ''}</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <RefreshCw size={80} />
                            </div>
                        </Card>

                        <Card className="relative overflow-hidden group bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <TrendingUp size={24} className="text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-1 rounded-full flex items-center">
                                    Net Profit
                                </span>
                            </div>
                            <p className="text-sm font-bold text-white/70 uppercase">Total Net Profit</p>
                            <h3 className="text-3xl font-black text-white mt-1">
                                ${stats.netProfit.toLocaleString()}
                            </h3>
                            <p className="text-xs text-white/70 mt-2 font-medium">Revenue after all expenses</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-10">
                                <PieChart size={80} />
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <Card className="min-h-[500px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Expenses</h2>
                                    <Button variant="secondary" size="sm" className="text-xs" onClick={() => setActiveTab('expenses')}>View All</Button>
                                </div>

                                <div className="space-y-4">
                                    {filteredExpensesList.length === 0 ? (
                                        <div className="text-center py-20">
                                            <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
                                            <p className="text-gray-500">No expenses recorded yet.</p>
                                        </div>
                                    ) : (
                                        filteredExpensesList.slice(0, 10).map((expense) => {
                                            const category = categories.find(c => c.id === expense.category_id);
                                            return (
                                                <div
                                                    key={expense.id}
                                                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                                            style={{ backgroundColor: category?.color || '#94a3b8' }}
                                                        >
                                                            <Receipt size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white">{expense.description}</h4>
                                                            <div className="flex items-center text-[10px] text-gray-500 uppercase font-bold mt-1">
                                                                <span className="mr-2">{format(new Date(expense.expense_date), 'MMM d, yyyy')}</span>
                                                                <span className="w-1 h-1 bg-gray-300 rounded-full mr-2"></span>
                                                                <span>{category?.name || 'Uncategorized'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-6">
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-gray-900 dark:text-white">
                                                                ${Number(expense.total_amount).toFixed(2)}
                                                            </p>
                                                            <span className={`text-[10px] font-bold uppercase ${expense.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                {expense.payment_status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedExpense(expense);
                                                                    setShowExpenseModal(true);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteExpense(expense.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue Overview</h2>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">Paid Invoices</span>
                                            <span className="font-bold text-gray-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${(stats.totalRevenue / (stats.totalRevenue + stats.pendingRevenue || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">Pending Collections</span>
                                            <span className="font-bold text-gray-900 dark:text-white">${stats.pendingRevenue.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 rounded-full"
                                                style={{ width: `${(stats.pendingRevenue / (stats.totalRevenue + stats.pendingRevenue || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">Monthly Recurring</span>
                                            <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(mrr)}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${Math.min((mrr / (stats.totalRevenue || 1)) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                                    <p className="text-sm font-bold text-primary-700 dark:text-primary-400 mb-1">Financial Tip</p>
                                    <p className="text-xs text-primary-600 dark:text-primary-300 leading-relaxed">
                                        Your realized revenue is {((stats.totalRevenue / (stats.totalRevenue + stats.pendingRevenue || 1)) * 100).toFixed(0)}%.
                                        Follow up on pending invoices to improve your cash flow.
                                    </p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </>
            )}

            {/* ==================== RECURRING REVENUE TAB ==================== */}
            {activeTab === 'recurring' && (
                <>
                    {/* Recurring Revenue Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card className="relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <IconBadge icon={<DollarSign size={24} className="text-blue-600" />} gradient="bg-blue-50" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">MRR</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                {formatCurrency(mrr)}
                            </h3>
                            <p className="text-xs text-blue-600 mt-2 font-medium">Monthly Recurring Revenue</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <DollarSign size={80} />
                            </div>
                        </Card>

                        <Card className="relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <IconBadge icon={<TrendingUp size={24} className="text-emerald-600" />} gradient="bg-emerald-50" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">ARR</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                {formatCurrency(arr)}
                            </h3>
                            <p className="text-xs text-emerald-600 mt-2 font-medium">Annual Recurring Revenue</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <TrendingUp size={80} />
                            </div>
                        </Card>

                        <Card className="relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <IconBadge icon={<Users size={24} className="text-indigo-600" />} gradient="bg-indigo-50" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Active Subscriptions</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                {activeSubscriptionCount}
                            </h3>
                            <p className="text-xs text-indigo-600 mt-2 font-medium">{subscriptions.length} total (all statuses)</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Users size={80} />
                            </div>
                        </Card>

                        <Card className="relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <IconBadge icon={<AlertTriangle size={24} className="text-amber-600" />} gradient="bg-amber-50" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Churn Rate</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                {churnMetrics ? `${churnMetrics.churn_rate_pct.toFixed(1)}%` : '0%'}
                            </h3>
                            <p className="text-xs text-amber-600 mt-2 font-medium">
                                {churnMetrics ? `${churnMetrics.cancelled_in_period} cancelled this period` : 'No churn data yet'}
                            </p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <AlertTriangle size={80} />
                            </div>
                        </Card>
                    </div>

                    {/* Churn Metrics Detail */}
                    {churnMetrics && churnMetrics.revenue_lost > 0 && (
                        <Card className="mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Revenue Impact</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From subscription churn this period</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-red-600 dark:text-red-400">
                                        -{formatCurrency(churnMetrics.revenue_lost)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Net change: {churnMetrics.net_change >= 0 ? '+' : ''}{churnMetrics.net_change} subscriptions
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Subscription List */}
                    <SubscriptionList
                        subscriptions={subscriptions}
                        onEdit={(sub) => {
                            setSelectedSubscription(sub);
                            setShowSubscriptionModal(true);
                        }}
                        onCancel={handleCancelSubscription}
                        onPause={handlePauseSubscription}
                        onResume={handleResumeSubscription}
                        loading={subsLoading}
                    />
                </>
            )}

            {/* ==================== EXPENSES TAB ==================== */}
            {activeTab === 'expenses' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <IconBadge icon={<TrendingDown size={24} className="text-rose-600" />} gradient="bg-rose-50" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Total Expenses</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                ${stats.totalExpenses.toLocaleString()}
                            </h3>
                            <p className="text-xs text-rose-600 mt-2 font-medium">Tracked operating costs</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Receipt size={80} />
                            </div>
                        </Card>

                        <Card className="relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                                <IconBadge icon={<Receipt size={24} className="text-gray-600" />} gradient="bg-gray-50" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Expense Count</p>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                                {filteredExpensesList.length}
                            </h3>
                            <p className="text-xs text-gray-600 mt-2 font-medium">Records in current filter</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Receipt size={80} />
                            </div>
                        </Card>

                        <Card className="relative overflow-hidden group bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <TrendingUp size={24} className="text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-1 rounded-full flex items-center">
                                    Net Profit
                                </span>
                            </div>
                            <p className="text-sm font-bold text-white/70 uppercase">Total Net Profit</p>
                            <h3 className="text-3xl font-black text-white mt-1">
                                ${stats.netProfit.toLocaleString()}
                            </h3>
                            <p className="text-xs text-white/70 mt-2 font-medium">Revenue after all expenses</p>
                            <div className="absolute bottom-0 right-0 p-4 opacity-10">
                                <PieChart size={80} />
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <Card className="min-h-[500px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Expenses</h2>
                                    <span className="text-xs font-bold text-gray-500 uppercase">{filteredExpensesList.length} records</span>
                                </div>

                                <div className="space-y-4">
                                    {filteredExpensesList.length === 0 ? (
                                        <div className="text-center py-20">
                                            <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
                                            <p className="text-gray-500">No expenses recorded yet.</p>
                                        </div>
                                    ) : (
                                        filteredExpensesList.map((expense) => {
                                            const category = categories.find(c => c.id === expense.category_id);
                                            return (
                                                <div
                                                    key={expense.id}
                                                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                                            style={{ backgroundColor: category?.color || '#94a3b8' }}
                                                        >
                                                            <Receipt size={20} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white">{expense.description}</h4>
                                                            <div className="flex items-center text-[10px] text-gray-500 uppercase font-bold mt-1">
                                                                <span className="mr-2">{format(new Date(expense.expense_date), 'MMM d, yyyy')}</span>
                                                                <span className="w-1 h-1 bg-gray-300 rounded-full mr-2"></span>
                                                                <span>{category?.name || 'Uncategorized'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-6">
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-gray-900 dark:text-white">
                                                                ${Number(expense.total_amount).toFixed(2)}
                                                            </p>
                                                            <span className={`text-[10px] font-bold uppercase ${expense.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                {expense.payment_status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedExpense(expense);
                                                                    setShowExpenseModal(true);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteExpense(expense.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Expense Categories</h2>
                                <div className="space-y-4">
                                    {categories
                                        .filter((cat, index, arr) => arr.findIndex(c => c.name === cat.name) === index)
                                        .map(cat => {
                                            const catExpenses = filteredExpensesList.filter(e => e.category_id === cat.id);
                                            const total = catExpenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
                                            return { ...cat, _total: total };
                                        })
                                        .sort((a, b) => b._total - a._total)
                                        .slice(0, 8)
                                        .map(cat => {
                                            const percentage = stats.totalExpenses > 0 ? (cat._total / stats.totalExpenses) * 100 : 0;

                                            return (
                                                <div key={cat.id} className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: cat.color }}></div>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{cat.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">${cat._total.toLocaleString()}</span>
                                                        <span className="text-[10px] text-gray-500 ml-2">({percentage.toFixed(0)}%)</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => navigate('/dashboard/settings')}>Manage Categories</Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            <ExpenseModal
                isOpen={showExpenseModal}
                onClose={() => {
                    setShowExpenseModal(false);
                    setSelectedExpense(undefined);
                    fetchExpenses(currentOrganization?.id);
                }}
                expense={selectedExpense}
            />

            {currentOrganization?.id && (
                <SubscriptionModal
                    isOpen={showSubscriptionModal}
                    onClose={() => {
                        setShowSubscriptionModal(false);
                        setSelectedSubscription(undefined);
                    }}
                    onSave={() => {
                        fetchSubscriptions(currentOrganization.id);
                        fetchMRR(currentOrganization.id);
                    }}
                    subscription={selectedSubscription}
                    organizationId={currentOrganization.id}
                />
            )}
        </PageContainer>
    );
};

export default Financials;
