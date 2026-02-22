import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, FileText, DollarSign, TrendingUp, Phone,
    CheckCircle, Plus, UserPlus, CalendarPlus, FilePlus, GripVertical,
    Bot, PhoneIncoming, PhoneOutgoing, Clock, Package, MessageSquare
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useCallStore } from '@/stores/callStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { useQuoteStore } from '@/stores/quoteStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { useTaskStore } from '@/stores/taskStore';
import { useDealStore } from '@/stores/dealStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { format } from 'date-fns';
import { Card, PageContainer } from '@/components/theme/ThemeComponents';
import { usePageLabels } from '@/hooks/usePageLabels';
import { useVisibleModules } from '@/hooks/useVisibleModules';
import SendSMSModal from '@/components/sms/SendSMSModal';
import AIQuarterback from '@/components/dashboard/AIQuarterback';
import { QuickActionsConfigPopover } from '@/components/dashboard/QuickActionsConfigPopover';
import { useCoPilot } from '@/contexts/CoPilotContext';

// Compact Stat Card Component
const CompactStatCard = ({ label, value, subValue, icon: Icon, color, onClick }: any) => {
    const { theme } = useThemeStore();
    const isSoft = theme === 'soft-modern';

    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden rounded-xl p-3 cursor-pointer transition-all hover:shadow-md border ${isSoft
                ? 'bg-white/60 border-white/50 hover:bg-white/80'
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500/30'
                }`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
                        {label}
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {value}
                        </h3>
                        {subValue && (
                            <span className={`text-[10px] font-medium ${subValue.startsWith('+') ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                {subValue}
                            </span>
                        )}
                    </div>
                </div>
                <div className={`p-1.5 rounded-lg ${color === 'blue' ? 'bg-blue-50 text-blue-600' :
                    color === 'green' ? 'bg-green-50 text-green-600' :
                        color === 'purple' ? 'bg-purple-50 text-purple-600' :
                            color === 'orange' ? 'bg-orange-50 text-orange-600' :
                                color === 'pink' ? 'bg-pink-50 text-pink-600' :
                                    'bg-gray-50 text-gray-600'
                    }`}>
                    <Icon size={14} />
                </div>
            </div>
        </div>
    );
};

// Compact Widget Wrapper
const CompactWidget = ({ title, action, children, className, onClick }: any) => {
    const { theme } = useThemeStore();
    return (
        <Card className={`flex flex-col h-full ${className} ${theme === 'soft-modern' ? 'bg-white/60' : ''}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3
                    onClick={onClick}
                    className={`text-sm font-semibold text-gray-900 dark:text-white ${onClick ? 'cursor-pointer hover:text-primary-600 transition-colors' : ''}`}
                >
                    {title}
                    {onClick && <span className="text-xs text-gray-400 ml-2">→</span>}
                </h3>
                {action}
            </div>
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </Card>
    );
};

// Sortable Quick Action Component
const SortableQuickAction = ({ action }: { action: any }) => {
    const { theme } = useThemeStore();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: action.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const Icon = action.icon;
    const isSoft = theme === 'soft-modern';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group ${isDragging ? 'z-50' : ''}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
            >
                <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            <button
                onClick={action.onClick}
                className={`w-full flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isSoft
                    ? 'bg-white/60 border-white/50 hover:bg-white/80'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500/30'
                    }`}
            >
                <div className={`p-2.5 rounded-xl mb-2 ${action.bgColor}`}>
                    <Icon size={20} className={action.iconColor} />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {action.label}
                </span>
            </button>
        </div>
    );
};

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { currentOrganization } = useOrganizationStore();
    const { customers, fetchCustomers } = useCustomerStore();
    const { calls, fetchCalls } = useCallStore();
    const { events, fetchEvents } = useCalendarStore();
    const { quotes, fetchQuotes } = useQuoteStore();
    const { invoices, fetchInvoices } = useInvoiceStore();
    const { tasks, fetchTasks } = useTaskStore();
    const { fetchPipelineStats } = useDealStore();
    const { preferences, saveQuickActionsOrder } = usePreferencesStore();
    const { isOpen: isCoPilotOpen } = useCoPilot();

    // Industry-specific labels
    const crmLabels = usePageLabels('crm');
    const quotesLabels = usePageLabels('quotes');
    const invoicesLabels = usePageLabels('invoices');
    const tasksLabels = usePageLabels('tasks');
    const calendarLabels = usePageLabels('calendar');
    const pipelineLabels = usePageLabels('pipeline');
    const productsLabels = usePageLabels('products');
    const financialsLabels = usePageLabels('financials');
    const callsLabels = usePageLabels('calls');

    // Get visible modules for this industry to filter quick actions
    const { visibleModules } = useVisibleModules();
    // Only show quick actions for UNLOCKED modules (not locked/expired trial)
    const enabledModuleIds = visibleModules.filter(m => !m.isLocked).map(m => m.id);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [showSMSModal, setShowSMSModal] = useState(false);

    // Define all quick actions with their module mapping
    const allQuickActions = [
        {
            id: 'add-customer',
            moduleId: 'crm',
            label: crmLabels.newButton,
            icon: UserPlus,
            onClick: () => navigate('/dashboard/customers'),
            bgColor: 'bg-blue-50 text-blue-600',
            iconColor: 'text-blue-600',
        },
        {
            id: 'schedule',
            moduleId: 'calendar',
            label: calendarLabels.newButton,
            icon: CalendarPlus,
            onClick: () => navigate('/dashboard/calendar'),
            bgColor: 'bg-green-50 text-green-600',
            iconColor: 'text-green-600',
        },
        {
            id: 'create-quote',
            moduleId: 'quotes',
            label: quotesLabels.newButton,
            icon: FilePlus,
            onClick: () => navigate('/quotes/builder'),
            bgColor: 'bg-purple-50 text-purple-600',
            iconColor: 'text-purple-600',
        },
        {
            id: 'new-invoice',
            moduleId: 'invoices',
            label: invoicesLabels.newButton,
            icon: FileText,
            onClick: () => navigate('/invoices/builder'),
            bgColor: 'bg-orange-50 text-orange-600',
            iconColor: 'text-orange-600',
        },
        {
            id: 'create-task',
            moduleId: 'tasks',
            label: tasksLabels.newButton,
            icon: CheckCircle,
            onClick: () => navigate('/dashboard/tasks'),
            bgColor: 'bg-pink-50 text-pink-600',
            iconColor: 'text-pink-600',
        },
        {
            id: 'add-product',
            moduleId: 'products',
            label: productsLabels.newButton,
            icon: Package,
            onClick: () => navigate('/dashboard/products'),
            bgColor: 'bg-indigo-50 text-indigo-600',
            iconColor: 'text-indigo-600',
        },
        {
            id: 'new-expense',
            moduleId: 'financials',
            label: financialsLabels.newButton,
            icon: DollarSign,
            onClick: () => navigate('/dashboard/financials'),
            bgColor: 'bg-emerald-50 text-emerald-600',
            iconColor: 'text-emerald-600',
        },
        {
            id: 'send-sms',
            moduleId: 'crm',
            label: 'Send SMS',
            icon: MessageSquare,
            onClick: () => setShowSMSModal(true),
            bgColor: 'bg-green-50 text-green-600',
            iconColor: 'text-green-600',
        },
    ];

    // Filter quick actions based on enabled modules for this industry
    const filteredQuickActions = allQuickActions
        .filter(action => enabledModuleIds.includes(action.moduleId))
        .map(({ moduleId, ...action }) => action);

    const [quickActions, setQuickActions] = useState(filteredQuickActions);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQuickActions((actions) => {
                const oldIndex = actions.findIndex((a) => a.id === active.id);
                const newIndex = actions.findIndex((a) => a.id === over.id);

                const newOrder = arrayMove(actions, oldIndex, newIndex);
                saveQuickActionsOrder(newOrder.map(a => a.id));
                return newOrder;
            });
        }
    };

    // Update quick actions when filtered actions or preferences change
    // Hard cap at 5 visible quick actions
    const MAX_QUICK_ACTIONS = 5;

    useEffect(() => {
        if (filteredQuickActions.length > 0) {
            const savedOrder = preferences.quickActionsOrder;
            if (savedOrder && savedOrder.length > 0) {
                // Build ordered list from saved preference - ONLY saved items, no appending extras
                const ordered = savedOrder
                    .map((id: string) => filteredQuickActions.find(a => a.id === id))
                    .filter((a): a is typeof filteredQuickActions[0] => a !== undefined)
                    .slice(0, MAX_QUICK_ACTIONS);
                setQuickActions(ordered);
            } else {
                // No saved preference - use first 5 enabled actions as default
                setQuickActions(filteredQuickActions.slice(0, MAX_QUICK_ACTIONS));
            }
        }
    }, [filteredQuickActions.length, enabledModuleIds.length, preferences.quickActionsOrder]);

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchCustomers();
            fetchCalls();
            fetchEvents();
            fetchQuotes();
            fetchInvoices();
            fetchTasks();
            fetchPipelineStats();
        }

        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [currentOrganization?.id, fetchCustomers, fetchCalls, fetchEvents, fetchQuotes, fetchInvoices, fetchTasks, fetchPipelineStats]);

    const activeCustomers = customers.filter(c => c.status === 'Active').length;
    const todaysEvents = events.filter(e => new Date(e.start_time).toDateString() === new Date().toDateString());
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const pipelineValue = quotes.reduce((sum, q) => sum + (q.total_amount || 0), 0);
    const revenueValue = invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total_amount || 0), 0);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaysCalls = calls.filter(c => new Date(c.created_at) >= startOfDay);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const todaysAppointments = events
        .filter(event => {
            const date = new Date(event.start_time);
            return date >= startOfDay && date <= endOfDay;
        })
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const upcomingAppointments = events
        .filter(event => {
            const date = new Date(event.start_time);
            return date > endOfDay;
        })
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 5);

    return (
        <PageContainer className="gap-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(currentTime, 'EEEE, MMMM do, yyyy')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Add global actions if needed */}
                </div>
            </div>

            {/* Mini Stat Cards Row (responsive to CoPilot panel) */}
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${isCoPilotOpen ? '2xl:grid-cols-6' : 'lg:grid-cols-6'}`}>
                <CompactStatCard
                    label={crmLabels.entityPlural}
                    value={customers.length}
                    subValue={`+${activeCustomers} Active`}
                    icon={Users}
                    color="blue"
                    onClick={() => navigate('/dashboard/customers')}
                />
                <CompactStatCard
                    label={calendarLabels.entityPlural}
                    value={todaysEvents.length}
                    subValue="Today"
                    icon={Calendar}
                    color="green"
                    onClick={() => navigate('/dashboard/calendar')}
                />
                <CompactStatCard
                    label={pipelineLabels.title}
                    value={`$${(pipelineValue / 1000).toFixed(1)}k`}
                    subValue={`${quotes.length} ${pipelineLabels.entityPlural}`}
                    icon={TrendingUp}
                    color="purple"
                    onClick={() => navigate('/dashboard/pipeline')}
                />
                <CompactStatCard
                    label={invoicesLabels.stats?.totalRevenue || 'Revenue'}
                    value={`$${(revenueValue / 1000).toFixed(1)}k`}
                    subValue="Paid"
                    icon={DollarSign}
                    color="orange"
                    onClick={() => navigate('/dashboard/invoices')}
                />
                <CompactStatCard
                    label={tasksLabels.entityPlural}
                    value={pendingTasks.length}
                    subValue="Pending"
                    icon={CheckCircle}
                    color="pink"
                    onClick={() => navigate('/dashboard/tasks')}
                />
                <CompactStatCard
                    label={callsLabels.entityPlural}
                    value={todaysCalls.length}
                    subValue="Today"
                    icon={Phone}
                    color="gray"
                    onClick={() => navigate('/dashboard/calls')}
                />
            </div>

            {/* Quick Actions Header + Config */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quick Actions
                </h3>
                <QuickActionsConfigPopover
                    allAvailableActions={filteredQuickActions.map(a => ({
                        id: a.id,
                        label: a.label,
                        icon: a.icon,
                    }))}
                    selectedActionIds={quickActions.map(a => a.id)}
                    onSelectionChange={(selectedIds) => {
                        saveQuickActionsOrder(selectedIds);
                    }}
                />
            </div>

            {/* Draggable Quick Actions */}
            <div className="mb-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={quickActions.map(a => a.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {quickActions.map((action) => (
                                <SortableQuickAction key={action.id} action={action} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {/* AI Quarterback - Proactive Business Insights */}
            <AIQuarterback compact />

            {/* Main Grid Layout */}
            <div className="flex flex-col gap-4">

                {/* Top Row: Activity & Schedule - Side by Side on Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Recent Activity */}
                    <CompactWidget
                        title="Recent Activity"
                        className="h-[350px] border border-gray-200 dark:border-gray-800 shadow-sm"
                        onClick={() => navigate('/dashboard/reports')}
                    >
                        <div className="h-full overflow-y-auto scrollbar-thin">
                            {[...calls, ...quotes, ...invoices]
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .slice(0, 10)
                                .map((item, i) => {
                                    const isCall = 'phone_number' in item;
                                    const isQuote = 'quote_number' in item;
                                    const isInvoice = 'invoice_number' in item;

                                    return (
                                        <div
                                            key={i}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isCall) navigate(`/dashboard/calls/${item.id}`);
                                                else if (isQuote) navigate(`/quotes/${item.id}`);
                                                else if (isInvoice) navigate(`/invoices/${item.id}`);
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCall ? 'bg-blue-100 text-blue-600' :
                                                isQuote ? 'bg-purple-100 text-purple-600' :
                                                    'bg-green-100 text-green-600'
                                                }`}>
                                                {isCall ? <Phone size={14} /> :
                                                    isQuote ? <FileText size={14} /> :
                                                        <DollarSign size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {isCall ? 'Call Logged' :
                                                        isQuote ? `Quote #${(item as any).quote_number}` :
                                                            isInvoice ? `Invoice #${(item as any).invoice_number}` : 'Activity'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {isCall
                                                        ? ((item as any).customers
                                                            ? ([(item as any).customers.first_name, (item as any).customers.last_name].filter(Boolean).join(' ')
                                                                || (item as any).customers.name || (item as any).customers.company)
                                                            : (item as any).customer_phone || 'Unknown Customer')
                                                        : ((item as any).customer_name || 'Unknown Customer')}
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {format(new Date(item.created_at), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    );
                                })}
                            {/* Bottom padding spacer */}
                            <div className="h-4" />
                        </div>
                    </CompactWidget>

                    {/* Today's Schedule */}
                    <CompactWidget
                        title="Today's Schedule"
                        className="h-[350px] border border-gray-200 dark:border-gray-800 shadow-sm"
                        onClick={() => navigate('/dashboard/calendar')}
                        action={
                            <button onClick={(e) => { e.stopPropagation(); navigate('/dashboard/calendar'); }} className="text-primary-600 hover:text-primary-700">
                                <Plus size={16} />
                            </button>
                        }
                    >
                        <div className="h-full overflow-y-auto scrollbar-thin">
                            {todaysAppointments.length === 0 && upcomingAppointments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                                    <Calendar size={24} className="mb-2 opacity-50" />
                                    No appointments today
                                </div>
                            ) : (
                                <>
                                    {todaysAppointments.length > 0 && todaysAppointments.map(event => (
                                        <div key={event.id} onClick={() => navigate('/dashboard/calendar')} className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                                            <div className="flex flex-col items-center min-w-[3rem] pr-3 border-r border-gray-100 dark:border-gray-800">
                                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase">
                                                    {format(new Date(event.start_time), 'MMM')}
                                                </span>
                                                <span className="text-lg font-bold text-primary-600">
                                                    {format(new Date(event.start_time), 'dd')}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0 py-0.5">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 text-sm">{event.title}</p>
                                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded ml-2">
                                                        {format(new Date(event.start_time), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <Users size={12} />
                                                    {event.customer_id ? (customers.find(c => c.id === event.customer_id)?.name || 'Unknown User') : 'No Customer'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {todaysAppointments.length === 0 && (
                                        <div className="px-4 py-3 text-xs text-gray-400 text-center border-b border-gray-100 dark:border-gray-800">
                                            Nothing scheduled for today
                                        </div>
                                    )}
                                    {upcomingAppointments.length > 0 && (
                                        <>
                                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Upcoming</span>
                                            </div>
                                            {upcomingAppointments.map(event => (
                                                <div key={event.id} onClick={() => navigate('/dashboard/calendar')} className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors opacity-70 cursor-pointer">
                                                    <div className="flex flex-col items-center min-w-[3rem] pr-3 border-r border-gray-100 dark:border-gray-800">
                                                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase">
                                                            {format(new Date(event.start_time), 'MMM')}
                                                        </span>
                                                        <span className="text-lg font-bold text-primary-600">
                                                            {format(new Date(event.start_time), 'dd')}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0 py-0.5">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 text-sm">{event.title}</p>
                                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded ml-2">
                                                                {format(new Date(event.start_time), 'HH:mm')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                            <Users size={12} />
                                                            {event.customer_id ? (customers.find(c => c.id === event.customer_id)?.name || 'Unknown User') : 'No Customer'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                    <div className="h-4" />
                                </>
                            )}
                        </div>
                    </CompactWidget>
                </div>

                {/* Bottom Row: Tasks - Full Width */}
                <CompactWidget
                    title="Tasks"
                    className="h-[300px] border border-gray-200 dark:border-gray-800 shadow-sm"
                    action={
                        <button onClick={() => navigate('/dashboard/tasks')} className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium px-2 py-1 bg-primary-50 dark:bg-primary-900/10 rounded-lg transition-colors">
                            <Plus size={14} /> Add Task
                        </button>
                    }
                >
                    <div className="h-full overflow-y-auto scrollbar-thin">
                        {pendingTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                                <CheckCircle size={24} className="mb-2 opacity-50" />
                                No pending tasks
                            </div>
                        ) : (
                            <>
                                {pendingTasks.map(task => (
                                    <div key={task.id} onClick={() => navigate('/dashboard/tasks')} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${task.priority === 'urgent' ? 'bg-red-500' :
                                            task.priority === 'high' ? 'bg-orange-500' : 'bg-green-500'
                                            }`} />

                                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                            <div className="col-span-1 md:col-span-5">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">
                                                    {task.title}
                                                </p>
                                            </div>
                                            <div className="hidden md:flex col-span-4 items-center gap-1.5 text-xs text-gray-500">
                                                <Users size={12} className="text-gray-400" />
                                                <span className="truncate">{task.customer_name || 'No Customer'}</span>
                                            </div>
                                            <div className="col-span-1 md:col-span-3 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${new Date(task.due_date) < new Date() ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    Due {format(new Date(task.due_date), 'MMM d')}
                                                </span>
                                            </div>
                                        </div>

                                        <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all">
                                            <CheckCircle size={16} />
                                        </button>
                                    </div>
                                ))}
                                {/* Bottom padding spacer */}
                                <div className="h-4" />
                            </>
                        )}
                    </div>
                </CompactWidget>

                {/* Recent Calls Widget - Full Width */}
                <CompactWidget
                    title="Recent Calls"
                    className="h-[300px] border border-gray-200 dark:border-gray-800 shadow-sm"
                    action={
                        <button onClick={() => navigate('/dashboard/calls')} className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium px-2 py-1 bg-primary-50 dark:bg-primary-900/10 rounded-lg transition-colors">
                            <Plus size={14} /> Log Call
                        </button>
                    }
                >
                    <div className="h-full overflow-y-auto scrollbar-thin">
                        {calls.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                                <Phone size={24} className="mb-2 opacity-50" />
                                No recent calls
                            </div>
                        ) : (
                            <>
                                {calls
                                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                    .slice(0, 10)
                                    .map(call => {
                                        const isAI = call.call_type === 'ai_agent';
                                        const isInbound = call.direction === 'inbound';
                                        // Use direct customer_name field first (demo data), then try joined customers object (production)
                                        const customerName = (call as any).customer_name
                                            || (call.customers
                                                ? (call.customers.name || `${call.customers.first_name || ''} ${call.customers.last_name || ''}`.trim() || call.customers.company)
                                                : null)
                                            || 'Unknown Caller';

                                        return (
                                            <div
                                                key={call.id}
                                                onClick={() => navigate(`/dashboard/calls/${call.id}`)}
                                                className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                {/* Call Type Icon */}
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isAI ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {isAI ? <Bot size={16} /> : <Phone size={16} />}
                                                </div>

                                                {/* Call Info */}
                                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                                    <div className="col-span-1 md:col-span-4">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">
                                                            {customerName || 'Unknown Caller'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {call.phone_number || 'No number'}
                                                        </p>
                                                    </div>

                                                    {/* Direction Badge */}
                                                    <div className="hidden md:flex col-span-2 items-center gap-1">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${isInbound ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {isInbound ? <PhoneIncoming size={10} /> : <PhoneOutgoing size={10} />}
                                                            {isInbound ? 'Inbound' : 'Outbound'}
                                                        </span>
                                                    </div>

                                                    {/* Call Type Badge */}
                                                    <div className="hidden md:flex col-span-2 items-center">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${isAI ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                            {isAI ? 'AI Agent' : 'Human'}
                                                        </span>
                                                    </div>

                                                    {/* Duration */}
                                                    <div className="hidden md:flex col-span-2 items-center gap-1 text-xs text-gray-500">
                                                        <Clock size={12} />
                                                        {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}` : '0:00'}
                                                    </div>

                                                    {/* Status/Date */}
                                                    <div className="col-span-1 md:col-span-2 text-right">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${call.status === 'completed' ? 'bg-green-50 text-green-600' :
                                                            call.status === 'failed' ? 'bg-red-50 text-red-600' :
                                                                call.status === 'no_answer' ? 'bg-yellow-50 text-yellow-600' :
                                                                    'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {call.status === 'completed' ? 'Completed' :
                                                                call.status === 'failed' ? 'Failed' :
                                                                    call.status === 'no_answer' ? 'No Answer' :
                                                                        call.status || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {/* Bottom padding spacer */}
                                <div className="h-4" />
                            </>
                        )}
                    </div>
                </CompactWidget>

            </div>

            <SendSMSModal
                isOpen={showSMSModal}
                onClose={() => setShowSMSModal(false)}
            />
        </PageContainer>
    );
};
