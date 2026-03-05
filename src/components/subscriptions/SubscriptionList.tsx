import React, { useState, useMemo } from 'react';
import { RefreshCw, MoreVertical, Edit, Pause, Play, XCircle, Calendar } from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import { Card } from '@/components/theme/ThemeComponents';
import type { CustomerSubscription } from '@/types/app.types';
import { format } from 'date-fns';

interface SubscriptionListProps {
    subscriptions: CustomerSubscription[];
    onEdit: (subscription: CustomerSubscription) => void;
    onCancel: (id: string) => void;
    onPause: (id: string) => void;
    onResume: (id: string) => void;
    loading: boolean;
}

const intervalShort: Record<string, string> = {
    daily: '/day',
    weekly: '/wk',
    monthly: '/mo',
    quarterly: '/qtr',
    yearly: '/yr',
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Active' },
    paused: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Paused' },
    cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' },
    trial: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Trial' },
    past_due: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'Past Due' },
    completed: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: 'Completed' },
};

const SubscriptionList: React.FC<SubscriptionListProps> = ({
    subscriptions,
    onEdit,
    onCancel,
    onPause,
    onResume,
    loading,
}) => {
    const { customers } = useCustomerStore();
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const getCustomerName = (customerId: string): string => {
        const c = customers.find(c => c.id === customerId);
        if (!c) return 'Unknown';
        const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
        return c.company_name ? `${name} (${c.company_name})` : name || c.email || 'Unknown';
    };

    const formatAmount = (amount: number, currency: string, interval: string, count: number): string => {
        const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
        const suffix = intervalShort[interval] || '/mo';
        return count > 1 ? `${formatted}/${count}${interval.charAt(0)}` : `${formatted}${suffix}`;
    };

    if (loading && subscriptions.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                </div>
            </Card>
        );
    }

    if (subscriptions.length === 0) {
        return (
            <Card>
                <div className="text-center py-20">
                    <RefreshCw size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No subscriptions yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first subscription to start tracking recurring revenue.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800">
                            <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                            <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Customer</th>
                            <th className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Amount</th>
                            <th className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                            <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Next Billing</th>
                            <th className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3 w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscriptions.map((sub) => {
                            const status = statusConfig[sub.status] || statusConfig.active;
                            return (
                                <tr
                                    key={sub.id}
                                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                                >
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{sub.name}</p>
                                            {sub.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{sub.description}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{getCustomerName(sub.customer_id)}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {formatAmount(sub.amount, sub.currency, sub.billing_interval, sub.billing_interval_count)}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.bg} ${status.text}`}>
                                            {status.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar size={14} className="mr-1.5 flex-shrink-0" />
                                            {sub.next_billing_date
                                                ? format(new Date(sub.next_billing_date), 'MMM d, yyyy')
                                                : sub.status === 'cancelled' ? 'N/A' : 'Not set'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right relative">
                                        <button
                                            onClick={() => setOpenDropdownId(openDropdownId === sub.id ? null : sub.id)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {openDropdownId === sub.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)} />
                                                <div className="absolute right-4 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 min-w-[140px]">
                                                    <button
                                                        onClick={() => { onEdit(sub); setOpenDropdownId(null); }}
                                                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                    >
                                                        <Edit size={14} className="mr-2" /> Edit
                                                    </button>
                                                    {(sub.status === 'active' || sub.status === 'trial') && (
                                                        <button
                                                            onClick={() => { onPause(sub.id); setOpenDropdownId(null); }}
                                                            className="w-full flex items-center px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                                        >
                                                            <Pause size={14} className="mr-2" /> Pause
                                                        </button>
                                                    )}
                                                    {sub.status === 'paused' && (
                                                        <button
                                                            onClick={() => { onResume(sub.id); setOpenDropdownId(null); }}
                                                            className="w-full flex items-center px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                        >
                                                            <Play size={14} className="mr-2" /> Resume
                                                        </button>
                                                    )}
                                                    {sub.status !== 'cancelled' && sub.status !== 'completed' && (
                                                        <button
                                                            onClick={() => { onCancel(sub.id); setOpenDropdownId(null); }}
                                                            className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <XCircle size={14} className="mr-2" /> Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-4">
                {subscriptions.map((sub) => {
                    const status = statusConfig[sub.status] || statusConfig.active;
                    return (
                        <div
                            key={sub.id}
                            className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{sub.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{getCustomerName(sub.customer_id)}</p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ml-2 ${status.bg} ${status.text}`}>
                                    {status.label}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <p className="text-lg font-black text-gray-900 dark:text-white">
                                    {formatAmount(sub.amount, sub.currency, sub.billing_interval, sub.billing_interval_count)}
                                </p>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => onEdit(sub)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    {(sub.status === 'active' || sub.status === 'trial') && (
                                        <button
                                            onClick={() => onPause(sub.id)}
                                            className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg"
                                        >
                                            <Pause size={16} />
                                        </button>
                                    )}
                                    {sub.status === 'paused' && (
                                        <button
                                            onClick={() => onResume(sub.id)}
                                            className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg"
                                        >
                                            <Play size={16} />
                                        </button>
                                    )}
                                    {sub.status !== 'cancelled' && sub.status !== 'completed' && (
                                        <button
                                            onClick={() => onCancel(sub.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {sub.next_billing_date && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                                    <Calendar size={12} className="mr-1" />
                                    Next billing: {format(new Date(sub.next_billing_date), 'MMM d, yyyy')}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default SubscriptionList;
