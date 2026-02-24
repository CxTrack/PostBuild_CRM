import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminStore } from '@/stores/adminStore';
import {
    DollarSign, TrendingUp, TrendingDown, CreditCard, FileText,
    ExternalLink, MoreVertical, XCircle, RefreshCw, Eye,
    AlertTriangle, CheckCircle, Clock, Download, ArrowUpDown,
    RotateCcw, ChevronDown, ChevronUp, Activity, Users, Mic,
    Loader2, X, Filter, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

// ---- Auth Helper (AbortController workaround) ----
function getAuthToken(): string | null {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const ref = supabaseUrl?.split('//')[1]?.split('.')[0];
    const key = ref ? `sb-${ref}-auth-token` : Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!key) return null;
    const stored = localStorage.getItem(typeof key === 'string' ? key : '');
    if (!stored) return null;
    try {
        return JSON.parse(stored).access_token || null;
    } catch { return null; }
}

async function callBillingEdgeFunction(action: string, payload: Record<string, any> = {}): Promise<any> {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-billing`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || err.message || `Request failed (${res.status})`);
    }
    return res.json();
}

// ---- Interfaces ----
interface Subscription {
    id: string;
    organization_id: string;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    plan_name: string;
    plan_amount: number;
    interval: string;
    status: string;
    current_period_start?: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
    created_at: string;
    canceled_at?: string;
    organizations?: { name: string; status: string };
    is_free_tier?: boolean;
}

interface StripeInvoice {
    id: string;
    organization_id: string;
    stripe_invoice_id: string;
    amount_paid: number;
    amount_due: number;
    currency: string;
    status: string;
    invoice_pdf?: string;
    hosted_invoice_url?: string;
    created_at: string;
    refunded_amount?: number;
    refund_reason?: string;
    refunded_at?: string;
    organizations?: { name: string };
}

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    stripe_price_id: string;
    status?: string;
}

// ---- Main Component ----
export const BillingTab = () => {
    const { usageOverview, loading: storeLoading, fetchUsageOverview } = useAdminStore();

    const [stats, setStats] = useState({
        mrr: 0, arr: 0, activeSubscriptions: 0, churnRate: 0,
        churnedThisMonth: 0, newThisMonth: 0,
    });
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Change Plan Modal state
    const [changePlanSub, setChangePlanSub] = useState<Subscription | null>(null);
    const [changePlanTarget, setChangePlanTarget] = useState('');
    const [changePlanProrate, setChangePlanProrate] = useState(true);
    const [changePlanLoading, setChangePlanLoading] = useState(false);

    // Refund Modal state
    const [refundInvoice, setRefundInvoice] = useState<StripeInvoice | null>(null);
    const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('requested_by_customer');
    const [refundLoading, setRefundLoading] = useState(false);

    // Usage Section state
    const [showUsage, setShowUsage] = useState(false);
    const [usageLoaded, setUsageLoaded] = useState(false);

    // Filters
    const [filterPlan, setFilterPlan] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadBillingData();
    }, []);

    const loadBillingData = async () => {
        setLoading(true);

        // Load subscriptions, plans, and all organizations in parallel
        const [{ data: allSubs }, { data: plansData }, { data: orgsData }] = await Promise.all([
            supabase.from('subscriptions').select(`*, organizations (name, status)`).order('created_at', { ascending: false }),
            supabase.from('subscription_plans').select('id, name, price, stripe_price_id, status').order('price', { ascending: true }),
            supabase.from('organizations').select('id, name, status, subscription_tier, created_at'),
        ]);

        setPlans((plansData || []).filter((p: any) => p.status !== 'inactive'));

        // Build unified list: paid Stripe subs + free/unsubscribed orgs
        const paidSubs: Subscription[] = (allSubs || []).map((s: any) => ({ ...s, is_free_tier: false }));
        const paidOrgIds = new Set(paidSubs.map(s => s.organization_id));

        const freeEntries: Subscription[] = (orgsData || [])
            .filter((org: any) => !paidOrgIds.has(org.id))
            .map((org: any) => ({
                id: `free-${org.id}`,
                organization_id: org.id,
                plan_name: org.subscription_tier || 'free',
                plan_amount: 0,
                interval: 'month',
                status: org.status === 'active' ? 'active' : 'inactive',
                created_at: org.created_at,
                organizations: { name: org.name, status: org.status },
                is_free_tier: true,
            }));

        const allEntries = [...paidSubs, ...freeEntries];
        setSubscriptions(allEntries);

        // Calculate MRR (paid subs only)
        const activePaid = paidSubs.filter(s => s.status === 'active');
        const mrr = activePaid.reduce((sum, sub) => sum + (sub.plan_amount / 100), 0);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const subsAtStartOfMonth = paidSubs.filter(s => new Date(s.created_at) < startOfMonth);
        const canceledThisMonth = paidSubs.filter(s =>
            s.status === 'canceled' && s.canceled_at && new Date(s.canceled_at) >= startOfMonth
        );
        const newThisMonth = allEntries.filter(s =>
            new Date(s.created_at) >= startOfMonth && s.status === 'active'
        );

        const churnRate = subsAtStartOfMonth.length > 0
            ? (canceledThisMonth.length / subsAtStartOfMonth.length) * 100 : 0;

        setStats({
            mrr, arr: mrr * 12,
            activeSubscriptions: allEntries.filter(s => s.status === 'active').length,
            churnRate: Math.round(churnRate * 10) / 10,
            churnedThisMonth: canceledThisMonth.length, newThisMonth: newThisMonth.length,
        });

        // Load invoices with refund columns
        const { data: invs } = await supabase
            .from('stripe_invoices')
            .select(`*, organizations (name)`)
            .order('created_at', { ascending: false })
            .limit(50);

        setInvoices(invs || []);
        setLoading(false);
    };

    // ---- Actions ----

    const handleCancelSubscription = async (sub: Subscription) => {
        if (!confirm(`Are you sure you want to cancel the subscription for ${sub.organizations?.name}?`)) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription_id: sub.stripe_subscription_id }),
            });
            if (!response.ok) throw new Error('Failed to cancel subscription');
            await supabase.from('subscriptions').update({
                status: 'canceled', canceled_at: new Date().toISOString(), cancel_at_period_end: true
            }).eq('id', sub.id);
            toast.success('Subscription canceled successfully');
            loadBillingData();
        } catch {
            toast.error('Failed to cancel subscription');
        }
        setActionMenu(null);
    };

    const handleChangePlan = async () => {
        if (!changePlanSub || !changePlanTarget) return;
        setChangePlanLoading(true);
        try {
            await callBillingEdgeFunction('admin_change_subscription', {
                organization_id: changePlanSub.organization_id,
                new_plan_name: changePlanTarget,
                proration_behavior: changePlanProrate ? 'create_prorations' : 'none',
            });
            toast.success(`Plan changed to ${changePlanTarget} successfully`);
            setChangePlanSub(null);
            loadBillingData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to change plan');
        } finally {
            setChangePlanLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!refundInvoice) return;
        setRefundLoading(true);
        try {
            const payload: any = {
                stripe_invoice_id: refundInvoice.stripe_invoice_id,
                reason: refundReason,
            };
            if (refundType === 'partial' && refundAmount) {
                payload.amount_cents = Math.round(parseFloat(refundAmount) * 100);
            }
            await callBillingEdgeFunction('admin_refund_invoice', payload);
            toast.success('Refund processed successfully');
            setRefundInvoice(null);
            loadBillingData();
        } catch (err: any) {
            toast.error(err.message || 'Failed to process refund');
        } finally {
            setRefundLoading(false);
        }
    };

    const handleExportCSV = () => {
        const rows: string[] = [
            `CxTrack Billing Export,${new Date().toLocaleString()}`,
            '',
            'Revenue Summary',
            `MRR,$${stats.mrr.toLocaleString()}`,
            `ARR,$${stats.arr.toLocaleString()}`,
            `Active Subscriptions,${stats.activeSubscriptions}`,
            `Churn Rate (30d),${stats.churnRate}%`,
            `Churned This Month,${stats.churnedThisMonth}`,
            `New This Month,${stats.newThisMonth}`,
            '',
            'Active Subscriptions',
            'Organization,Plan,Amount,Status,Next Billing,Stripe Sub ID',
            ...subscriptions.map(s =>
                `"${s.organizations?.name || 'Unknown'}","${s.plan_name}","$${(s.plan_amount / 100).toFixed(2)}/${s.interval}","${s.status}","${new Date(s.current_period_end).toLocaleDateString()}","${s.stripe_subscription_id}"`
            ),
            '',
            'Recent Invoices',
            'Invoice ID,Organization,Amount Paid,Status,Date,Refunded',
            ...invoices.map(i =>
                `"${i.stripe_invoice_id}","${i.organizations?.name || 'Unknown'}","$${(i.amount_paid / 100).toFixed(2)}","${i.status}","${new Date(i.created_at).toLocaleDateString()}","${i.refunded_amount ? `$${(i.refunded_amount / 100).toFixed(2)}` : 'N/A'}"`
            ),
        ];

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Billing data exported');
    };

    const toggleUsage = () => {
        if (!showUsage && !usageLoaded) {
            fetchUsageOverview(30);
            setUsageLoaded(true);
        }
        setShowUsage(!showUsage);
    };

    // ---- Helpers ----

    const openStripeCustomer = (id: string) => window.open(`https://dashboard.stripe.com/customers/${id}`, '_blank');
    const openStripeSubscription = (id: string) => window.open(`https://dashboard.stripe.com/subscriptions/${id}`, '_blank');

    // Filtered subscriptions
    const filteredSubscriptions = subscriptions.filter(sub => {
        if (filterPlan !== 'all' && sub.plan_name.toLowerCase() !== filterPlan.toLowerCase()) return false;
        if (filterStatus !== 'all' && sub.status !== filterStatus) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const orgName = sub.organizations?.name?.toLowerCase() || '';
            if (!orgName.includes(q) && !sub.plan_name.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    // Unique plan names for filter dropdown
    const uniquePlans = [...new Set(subscriptions.map(s => s.plan_name.toLowerCase()))].sort();

    const getStatusBadge = (status: string, cancelAtEnd?: boolean) => {
        if (cancelAtEnd) return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                <Clock className="w-3 h-3" />Canceling
            </span>
        );
        switch (status) {
            case 'active': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full"><CheckCircle className="w-3 h-3" />Active</span>;
            case 'past_due': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full"><AlertTriangle className="w-3 h-3" />Past Due</span>;
            case 'canceled': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full"><XCircle className="w-3 h-3" />Canceled</span>;
            case 'trialing': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"><Clock className="w-3 h-3" />Trial</span>;
            default: return <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Revenue</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button onClick={loadBillingData}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Recurring Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">${stats.mrr.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-6 h-6 text-white" /></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Annual Recurring Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">${stats.arr.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center"><CreditCard className="w-6 h-6 text-white" /></div>
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">+{stats.newThisMonth} new</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Subscriptions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeSubscriptions}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center"><TrendingDown className="w-6 h-6 text-white" /></div>
                        {stats.churnedThisMonth > 0 && (
                            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">-{stats.churnedThisMonth} lost</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Churn Rate (30d)</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.churnRate}%</p>
                </div>
            </div>

            {/* Usage Tracking Section (collapsible) */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                    onClick={toggleUsage}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Platform Usage Overview</h3>
                    </div>
                    {showUsage ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                {showUsage && (
                    <div className="px-6 pb-6 space-y-6">
                        {storeLoading.usageOverview ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                <span className="ml-2 text-sm text-gray-500">Loading usage data...</span>
                            </div>
                        ) : usageOverview ? (
                            <>
                                {/* Usage Stat Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total API Calls</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{(usageOverview.totals?.total_api_calls || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Tokens</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{(usageOverview.totals?.total_tokens || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Cost</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">${((usageOverview.totals?.total_cost_cents || 0) / 100).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Active Orgs</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{usageOverview.totals?.unique_orgs || 0}</p>
                                    </div>
                                </div>

                                {/* API by Service Table */}
                                {usageOverview.api_by_service?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> API Usage by Service
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-100 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Service</th>
                                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Calls</th>
                                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Tokens</th>
                                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Cost</th>
                                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Orgs</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {usageOverview.api_by_service.map((s: any) => (
                                                        <tr key={s.service_name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{s.service_name}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{Number(s.total_calls).toLocaleString()}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{Number(s.total_tokens).toLocaleString()}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">${(Number(s.total_cost_cents) / 100).toFixed(2)}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{s.unique_orgs}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Top Consumers Table */}
                                {usageOverview.api_by_org?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                            <Users className="w-4 h-4" /> Top Consumers by Organization
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-100 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Organization</th>
                                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Calls</th>
                                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Tokens</th>
                                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Cost</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {usageOverview.api_by_org.map((o: any) => (
                                                        <tr key={o.organization_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{o.org_name}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{Number(o.total_calls).toLocaleString()}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{Number(o.total_tokens).toLocaleString()}</td>
                                                            <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">${(Number(o.total_cost_cents) / 100).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Voice Usage Table */}
                                {usageOverview.voice_usage?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                            <Mic className="w-4 h-4" /> Voice Usage by Organization
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-100 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Organization</th>
                                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Used</th>
                                                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Cap</th>
                                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Usage</th>
                                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Tier</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {usageOverview.voice_usage.map((v: any) => {
                                                        const pct = Number(v.usage_pct) || 0;
                                                        const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500';
                                                        return (
                                                            <tr key={v.org_name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{v.org_name}</td>
                                                                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{Number(v.voice_minutes_used).toLocaleString()}</td>
                                                                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{Number(v.voice_minutes_cap).toLocaleString()}</td>
                                                                <td className="px-4 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                            <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                                                        </div>
                                                                        <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2">
                                                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                                                                        {v.subscription_tier}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-4">No usage data available</p>
                        )}
                    </div>
                )}
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subscriptions & Organizations</h3>
                        <span className="text-sm text-gray-500">{filteredSubscriptions.length} of {subscriptions.length}</span>
                    </div>
                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search organization..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filterPlan}
                                onChange={e => setFilterPlan(e.target.value)}
                                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white outline-none focus:border-purple-500"
                            >
                                <option value="all">All Plans</option>
                                {uniquePlans.map(p => (
                                    <option key={p} value={p} className="capitalize">{p.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white outline-none focus:border-purple-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="canceled">Canceled</option>
                                <option value="past_due">Past Due</option>
                                <option value="trialing">Trialing</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        {(filterPlan !== 'all' || filterStatus !== 'all' || searchQuery) && (
                            <button
                                onClick={() => { setFilterPlan('all'); setFilterStatus('all'); setSearchQuery(''); }}
                                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Plan</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Next Billing</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredSubscriptions.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No matching subscriptions found</td></tr>
                            ) : (
                                filteredSubscriptions.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sub.organizations?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`capitalize ${sub.is_free_tier ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {sub.plan_name.replace(/_/g, ' ')}
                                            </span>
                                            {sub.is_free_tier && (
                                                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">FREE</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                            {sub.is_free_tier ? (
                                                <span className="text-gray-400 dark:text-gray-500 font-normal">$0</span>
                                            ) : (
                                                <>${(sub.plan_amount / 100).toFixed(2)}/{sub.interval}</>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(sub.status, sub.cancel_at_period_end)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '--'}
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button onClick={() => setActionMenu(actionMenu === sub.id ? null : sub.id)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>
                                            {actionMenu === sub.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                                                    <div className="absolute right-6 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]">
                                                        {sub.stripe_subscription_id && (
                                                            <>
                                                                <button
                                                                    onClick={() => { openStripeSubscription(sub.stripe_subscription_id!); setActionMenu(null); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />View in Stripe
                                                                </button>
                                                                <button
                                                                    onClick={() => { openStripeCustomer(sub.stripe_customer_id!); setActionMenu(null); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                >
                                                                    <Eye className="w-4 h-4" />View Customer
                                                                </button>
                                                                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                                            </>
                                                        )}
                                                        {!sub.is_free_tier && (
                                                            <>
                                                                <button
                                                                    onClick={() => { setChangePlanSub(sub); setChangePlanTarget(''); setActionMenu(null); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                                                >
                                                                    <ArrowUpDown className="w-4 h-4" />Change Plan
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancelSubscription(sub)}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                >
                                                                    <XCircle className="w-4 h-4" />Cancel Subscription
                                                                </button>
                                                            </>
                                                        )}
                                                        {sub.is_free_tier && (
                                                            <p className="px-4 py-2 text-xs text-gray-400 italic">Free tier -- no Stripe actions</p>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoices Table */}
            {invoices.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Invoices</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Invoice ID</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Date</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{inv.stripe_invoice_id?.slice(-8)}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{inv.organizations?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                ${(inv.amount_paid / 100).toFixed(2)}
                                            </span>
                                            {inv.refunded_amount && inv.refunded_amount > 0 && (
                                                <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                                                    (-${(inv.refunded_amount / 100).toFixed(2)} refunded)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inv.refunded_amount && inv.refunded_amount > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs font-semibold rounded-full">
                                                    <RotateCcw className="w-3 h-3" />
                                                    Refunded
                                                </span>
                                            ) : (
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                    inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(inv.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {inv.invoice_pdf && (
                                                    <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        <FileText className="w-4 h-4" />PDF
                                                    </a>
                                                )}
                                                {inv.status === 'paid' && (!inv.refunded_amount || inv.refunded_amount < inv.amount_paid) && (
                                                    <button
                                                        onClick={() => {
                                                            setRefundInvoice(inv);
                                                            setRefundType('full');
                                                            setRefundAmount('');
                                                            setRefundReason('requested_by_customer');
                                                        }}
                                                        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />Refund
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== CHANGE PLAN MODAL ===== */}
            {changePlanSub && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setChangePlanSub(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ArrowUpDown className="w-5 h-5 text-purple-500" /> Change Plan
                            </h3>
                            <button onClick={() => setChangePlanSub(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Organization</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{changePlanSub.organizations?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Current plan: <span className="font-medium capitalize">{changePlanSub.plan_name}</span> - ${(changePlanSub.plan_amount / 100).toFixed(2)}/{changePlanSub.interval}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">New Plan</label>
                            <select
                                value={changePlanTarget}
                                onChange={e => setChangePlanTarget(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white outline-none focus:border-purple-500"
                            >
                                <option value="">Select a plan...</option>
                                {plans.filter(p => p.name.toLowerCase() !== changePlanSub.plan_name.toLowerCase()).map(p => (
                                    <option key={p.id} value={p.name}>{p.name} - ${Number(p.price).toFixed(2)}/mo</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="prorate"
                                checked={changePlanProrate}
                                onChange={e => setChangePlanProrate(e.target.checked)}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="prorate" className="text-sm text-gray-700 dark:text-gray-300">Prorate charges</label>
                        </div>

                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg mb-4">
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                This will immediately change the subscription in Stripe.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setChangePlanSub(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button onClick={handleChangePlan}
                                disabled={changePlanLoading || !changePlanTarget}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {changePlanLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpDown className="w-4 h-4" />}
                                {changePlanLoading ? 'Changing...' : 'Change Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== REFUND MODAL ===== */}
            {refundInvoice && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setRefundInvoice(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-purple-500" /> Issue Refund
                            </h3>
                            <button onClick={() => setRefundInvoice(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Invoice</p>
                                <p className="text-xs font-mono text-gray-500">{refundInvoice.stripe_invoice_id?.slice(-8)}</p>
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{refundInvoice.organizations?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Amount paid: <span className="font-bold">${(refundInvoice.amount_paid / 100).toFixed(2)}</span>
                                {refundInvoice.refunded_amount && refundInvoice.refunded_amount > 0 && (
                                    <span className="ml-2 text-purple-600">
                                        (already refunded: ${(refundInvoice.refunded_amount / 100).toFixed(2)})
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Refund Type</label>
                            <div className="flex gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="refundType" checked={refundType === 'full'}
                                        onChange={() => setRefundType('full')}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Full refund</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="refundType" checked={refundType === 'partial'}
                                        onChange={() => setRefundType('partial')}
                                        className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Partial refund</span>
                                </label>
                            </div>
                        </div>

                        {refundType === 'partial' && (
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Refund Amount ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={((refundInvoice.amount_paid - (refundInvoice.refunded_amount || 0)) / 100)}
                                    value={refundAmount}
                                    onChange={e => setRefundAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white outline-none focus:border-purple-500"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Max refundable: ${((refundInvoice.amount_paid - (refundInvoice.refunded_amount || 0)) / 100).toFixed(2)}
                                </p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                            <select
                                value={refundReason}
                                onChange={e => setRefundReason(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white outline-none focus:border-purple-500"
                            >
                                <option value="requested_by_customer">Customer Request</option>
                                <option value="duplicate">Duplicate Charge</option>
                                <option value="fraudulent">Fraudulent</option>
                            </select>
                        </div>

                        <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg mb-4">
                            <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                This will process an actual refund through Stripe. This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setRefundInvoice(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button onClick={handleRefund}
                                disabled={refundLoading || (refundType === 'partial' && (!refundAmount || parseFloat(refundAmount) <= 0))}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {refundLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                {refundLoading ? 'Processing...' : 'Process Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
