import React, { useState, useEffect, useMemo } from 'react';
import {
    Receipt, DollarSign, TrendingUp, TrendingDown,
    Plus, Calendar, PieChart, ArrowUpRight, ArrowDownRight,
    Trash2, Edit
} from 'lucide-react';
import { useExpenseStore } from '@/stores/expenseStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { PageContainer, Card, IconBadge, Button } from '@/components/theme/ThemeComponents';
import ExpenseModal from '@/components/financials/ExpenseModal';
import { usePageLabels } from '@/hooks/usePageLabels';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

export const Financials: React.FC = () => {
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<any>(undefined);
    const [dateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });

    const { expenses, fetchExpenses, categories, fetchCategories, deleteExpense } = useExpenseStore();
    const { invoices, fetchInvoices } = useInvoiceStore();
    const { currentOrganization } = useOrganizationStore();
    const labels = usePageLabels('financials');

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchExpenses(currentOrganization.id);
            fetchInvoices(currentOrganization.id);
            fetchCategories(currentOrganization.id);
        }
    }, [currentOrganization?.id]);

    const stats = useMemo(() => {
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
        const totalRevenue = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

        const pendingRevenue = invoices
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + Number(inv.amount_due), 0);

        const netProfit = totalRevenue - totalExpenses;

        return { totalExpenses, totalRevenue, pendingRevenue, netProfit };
    }, [expenses, invoices]);

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

    return (
        <PageContainer>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{labels.title}</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {labels.subtitle}
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="secondary" className="flex items-center">
                        <Calendar size={18} className="mr-2" />
                        {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d')}
                    </Button>
                    <Button variant="primary" onClick={() => setShowExpenseModal(true)} className="flex items-center">
                        <Plus size={18} className="mr-2" />
                        {labels.newButton}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <IconBadge icon={<TrendingUp size={24} className="text-emerald-600" />} gradient="bg-emerald-50" />
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center">
                            <ArrowUpRight size={12} className="mr-1" /> +12%
                        </span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase">Total Revenue</p>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                        ${stats.totalRevenue.toLocaleString()}
                    </h3>
                    <p className="text-xs text-emerald-600 mt-2 font-medium">Realized from paid invoices</p>
                    <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={80} />
                    </div>
                </Card>

                <Card className="relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <IconBadge icon={<TrendingDown size={24} className="text-rose-600" />} gradient="bg-rose-50" />
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full flex items-center">
                            <ArrowDownRight size={12} className="mr-1" /> -5%
                        </span>
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
                            <Button variant="secondary" size="sm" className="text-xs">View All</Button>
                        </div>

                        <div className="space-y-4">
                            {expenses.length === 0 ? (
                                <div className="text-center py-20">
                                    <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">No expenses recorded yet.</p>
                                </div>
                            ) : (
                                expenses.slice(0, 10).map((expense) => {
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
                        </div>

                        <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                            <p className="text-sm font-bold text-primary-700 dark:text-primary-400 mb-1">Financial Tip</p>
                            <p className="text-xs text-primary-600 dark:text-primary-300 leading-relaxed">
                                Your realized revenue is {((stats.totalRevenue / (stats.totalRevenue + stats.pendingRevenue || 1)) * 100).toFixed(0)}%.
                                Follow up on pending invoices to improve your cash flow.
                            </p>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Expense Categories</h2>
                        <div className="space-y-4">
                            {categories.slice(0, 5).map(cat => {
                                const catExpenses = expenses.filter(e => e.category_id === cat.id);
                                const total = catExpenses.reduce((sum, e) => sum + Number(e.total_amount), 0);
                                const percentage = stats.totalExpenses > 0 ? (total / stats.totalExpenses) * 100 : 0;

                                return (
                                    <div key={cat.id} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: cat.color }}></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">${total.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-500 ml-2">({percentage.toFixed(0)}%)</span>
                                        </div>
                                    </div>
                                );
                            })}
                            <Button variant="secondary" size="sm" className="w-full mt-4">Manage Categories</Button>
                        </div>
                    </Card>
                </div>
            </div>

            <ExpenseModal
                isOpen={showExpenseModal}
                onClose={() => {
                    setShowExpenseModal(false);
                    setSelectedExpense(undefined);
                    fetchExpenses(currentOrganization?.id);
                }}
                expense={selectedExpense}
            />
        </PageContainer>
    );
};

export default Financials;
