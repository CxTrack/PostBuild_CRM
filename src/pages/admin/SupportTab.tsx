import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, Clock, User, Tag, MessageSquare, X, Send,
    AlertTriangle, CheckCircle, Circle, MoreVertical,
    Trash2, ExternalLink, LayoutGrid, List,
    RefreshCw, Globe, FileText, UserX, Check, Loader2,
    Eye, EyeOff, ArrowRight, UserPlus
} from 'lucide-react';
import { useAdminStore, AdminTicket, DeletionRequest, TicketMessage, TicketActivity } from '@/stores/adminStore';
import toast from 'react-hot-toast';

type SubTab = 'tickets' | 'dsar';

export const SupportTab = () => {
    const [subTab, setSubTab] = useState<SubTab>('tickets');

    return (
        <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setSubTab('tickets')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        subTab === 'tickets'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Support Tickets
                    </div>
                </button>
                <button
                    onClick={() => setSubTab('dsar')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        subTab === 'dsar'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4" />
                        DSAR / Deletion Requests
                    </div>
                </button>
            </div>

            {subTab === 'tickets' ? <TicketsSection /> : <DSARSection />}
        </div>
    );
};

// ─── Tickets Section (Platform-Wide) ──────────────────────────────────────────

const TicketsSection = () => {
    const { allTickets, loading, fetchAllTickets } = useAdminStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);

    useEffect(() => {
        fetchAllTickets();
    }, [fetchAllTickets]);

    const filteredTickets = useMemo(() => {
        return allTickets.filter(ticket => {
            if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
            if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
            if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false;
            if (search) {
                const s = search.toLowerCase();
                const matchesSubject = ticket.subject?.toLowerCase().includes(s);
                const matchesDesc = ticket.description?.toLowerCase().includes(s);
                const matchesCustomer = ticket.customer_name?.toLowerCase().includes(s);
                const matchesOrg = ticket.organization_name?.toLowerCase().includes(s);
                const matchesEmail = ticket.customer_email?.toLowerCase().includes(s);
                const matchesId = ticket.id.toLowerCase().includes(s);
                if (!matchesSubject && !matchesDesc && !matchesCustomer && !matchesOrg && !matchesEmail && !matchesId) return false;
            }
            return true;
        });
    }, [allTickets, statusFilter, priorityFilter, categoryFilter, search]);

    const stats = useMemo(() => {
        const open = allTickets.filter(t => t.status === 'open').length;
        const inProgress = allTickets.filter(t => t.status === 'in_progress').length;
        const urgent = allTickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length;
        return { open, inProgress, urgent, total: allTickets.length };
    }, [allTickets]);

    const getSourceBadge = (source?: string) => {
        switch (source) {
            case 'help_center': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Help Center</span>;
            case 'customer_profile': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Customer</span>;
            case 'bug_report': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Bug Report</span>;
            case 'copilot_feedback': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">CoPilot</span>;
            default: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">Direct</span>;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'in_progress': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    if (loading.tickets && allTickets.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                        <Globe className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    <p className="text-xs text-gray-500 mt-1">Platform-wide</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Open</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.open}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Urgent</span>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.urgent}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tickets across all orgs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                >
                    <option value="all">All Categories</option>
                    <option value="general">General</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug">Bug</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="data_request">Data Request</option>
                    <option value="account_issue">Account Issue</option>
                    <option value="copilot_feedback">CoPilot Feedback</option>
                </select>
                <button
                    onClick={() => fetchAllTickets()}
                    className="px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className={`w-5 h-5 text-gray-500 ${loading.tickets ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Tickets Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">ID</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Subject</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Source</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Organization</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Priority</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Category</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    No tickets found.
                                </td>
                            </tr>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <tr
                                    key={ticket.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                            #{ticket.id.slice(-8)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{ticket.subject}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[250px]">{ticket.description}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {getSourceBadge(ticket.source)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="text-sm text-gray-900 dark:text-white">{ticket.organization_name || 'N/A'}</p>
                                            {ticket.customer_name && (
                                                <p className="text-xs text-gray-500">{ticket.customer_name}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                            {(ticket.category || 'general').replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </div>
    );
};

// ─── Ticket Detail Modal (Full Action Panel) ─────────────────────────────────

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
const CATEGORY_OPTIONS = ['general', 'billing', 'technical', 'feature_request', 'bug', 'bug_report', 'data_request', 'account_issue', 'copilot_feedback'];

const timeAgo = (dateStr: string) => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

const activityLabel = (a: TicketActivity) => {
    const name = a.user_name || 'Admin';
    switch (a.action) {
        case 'status_changed': return <><strong>{name}</strong> changed status from <span className="font-mono text-xs">{a.old_value}</span> to <span className="font-mono text-xs">{a.new_value}</span></>;
        case 'priority_changed': return <><strong>{name}</strong> changed priority from <span className="font-mono text-xs">{a.old_value}</span> to <span className="font-mono text-xs">{a.new_value}</span></>;
        case 'category_changed': return <><strong>{name}</strong> changed category from <span className="font-mono text-xs">{a.old_value}</span> to <span className="font-mono text-xs">{a.new_value}</span></>;
        case 'assigned': return <><strong>{name}</strong> assigned ticket from <span className="font-mono text-xs">{a.old_value}</span> to <span className="font-mono text-xs">{a.new_value}</span></>;
        case 'replied': return <><strong>{name}</strong> replied</>;
        case 'internal_note': return <><strong>{name}</strong> added an internal note</>;
        default: return <><strong>{name}</strong> performed {a.action}</>;
    }
};

const TicketDetailModal = ({
    ticket,
    onClose,
}: {
    ticket: AdminTicket;
    onClose: () => void;
}) => {
    const {
        currentTicketMessages, currentTicketActivities, adminUsers, loading,
        fetchTicketDetail, updateTicket, replyToTicket, fetchAdminUsers, fetchAllTickets,
    } = useAdminStore();

    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [sending, setSending] = useState(false);
    const [localTicket, setLocalTicket] = useState(ticket);
    const [updating, setUpdating] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTicketDetail(ticket.id);
        if (adminUsers.length === 0) fetchAdminUsers();
    }, [ticket.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentTicketMessages]);

    const handleFieldChange = async (field: string, value: string | null) => {
        setUpdating(field);
        try {
            await updateTicket(ticket.id, { [field]: value });
            setLocalTicket((prev) => ({ ...prev, [field]: value }));
            if (field === 'assigned_to' && value) {
                const admin = adminUsers.find((a) => a.id === value);
                if (admin) setLocalTicket((prev) => ({ ...prev, assigned_to_name: admin.name }));
            }
            toast.success(`${field.replace('_', ' ')} updated`);
        } catch {
            toast.error(`Failed to update ${field}`);
        } finally {
            setUpdating(null);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await replyToTicket(ticket.id, replyText.trim(), isInternal);
            setReplyText('');
            // Update local status if it was auto-transitioned
            if (localTicket.status === 'open' && !isInternal) {
                setLocalTicket((prev) => ({ ...prev, status: 'in_progress' }));
            }
            toast.success(isInternal ? 'Internal note added' : 'Reply sent');
        } catch {
            toast.error('Failed to send');
        } finally {
            setSending(false);
        }
    };

    const getSourceBadge = (source?: string) => {
        switch (source) {
            case 'help_center': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Help Center</span>;
            case 'customer_profile': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Customer Profile</span>;
            case 'bug_report': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Bug Report</span>;
            case 'copilot_feedback': return <span className="px-2 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">CoPilot Feedback</span>;
            default: return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">Direct</span>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-6 overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-5xl my-4 border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-mono text-sm text-gray-500">#{ticket.id.slice(-8)}</span>
                            {getSourceBadge(ticket.source)}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{ticket.subject}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {ticket.organization_name || 'Unknown org'} {ticket.customer_name ? `/ ${ticket.customer_name}` : ''} &mdash; {new Date(ticket.created_at).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={() => { onClose(); fetchAllTickets(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ml-2 flex-shrink-0">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
                        <select
                            value={localTicket.status}
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                            disabled={updating === 'status'}
                            className="px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                        >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    {/* Priority */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Priority</span>
                        <select
                            value={localTicket.priority}
                            onChange={(e) => handleFieldChange('priority', e.target.value)}
                            disabled={updating === 'priority'}
                            className="px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                        >
                            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {/* Category */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Category</span>
                        <select
                            value={localTicket.category || 'general'}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                            disabled={updating === 'category'}
                            className="px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                        >
                            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    {/* Assign */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase">Assigned</span>
                        <select
                            value={localTicket.assigned_to || ''}
                            onChange={(e) => handleFieldChange('assigned_to', e.target.value || null)}
                            disabled={updating === 'assigned_to'}
                            className="px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                        >
                            <option value="">Unassigned</option>
                            {adminUsers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    {updating && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />}
                </div>

                {/* Main Content: Two columns */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
                    {/* Left: Conversation Thread */}
                    <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Original ticket description */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                                        {(ticket.customer_name?.[0] || ticket.organization_name?.[0] || 'U').toUpperCase()}
                                    </div>
                                    <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                                        {ticket.customer_name || ticket.organization_name || 'User'}
                                    </span>
                                    <span className="text-xs text-gray-400">{timeAgo(ticket.created_at)}</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            {/* Messages */}
                            {loading.ticketDetail && currentTicketMessages.length === 0 ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                currentTicketMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`rounded-xl p-4 ${
                                            msg.is_internal
                                                ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800'
                                                : 'bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                                                msg.is_internal ? 'bg-amber-500' : 'bg-purple-500'
                                            }`}>
                                                {(msg.user_name?.[0] || 'A').toUpperCase()}
                                            </div>
                                            <span className={`text-xs font-semibold ${
                                                msg.is_internal ? 'text-amber-800 dark:text-amber-300' : 'text-purple-800 dark:text-purple-300'
                                            }`}>
                                                {msg.user_name || 'Admin'}
                                            </span>
                                            {msg.is_internal && (
                                                <span className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-[10px] font-bold rounded uppercase">
                                                    Internal
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">{timeAgo(msg.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Composer */}
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={() => setIsInternal(false)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                        !isInternal
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <Send className="w-3 h-3" /> Reply
                                </button>
                                <button
                                    onClick={() => setIsInternal(true)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                        isInternal
                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <EyeOff className="w-3 h-3" /> Internal Note
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={isInternal ? 'Add an internal note (only visible to admins)...' : 'Type your reply...'}
                                    rows={2}
                                    className={`flex-1 px-3 py-2 text-sm border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none ${
                                        isInternal
                                            ? 'border-amber-200 dark:border-amber-800 focus:border-amber-400'
                                            : 'border-gray-200 dark:border-gray-600 focus:border-purple-400'
                                    }`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            e.preventDefault();
                                            handleSendReply();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSendReply}
                                    disabled={sending || !replyText.trim()}
                                    className={`px-4 py-2 rounded-xl text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 self-end ${
                                        isInternal
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : 'bg-purple-600 hover:bg-purple-700'
                                    }`}
                                >
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Send
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Ctrl+Enter to send</p>
                        </div>
                    </div>

                    {/* Right: Meta + Activity Timeline */}
                    <div className="w-full md:w-80 overflow-y-auto p-5 space-y-5 flex-shrink-0 bg-gray-50 dark:bg-gray-800/30">
                        {/* Meta Info */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Details</h4>
                            <div className="space-y-2.5">
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Organization</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.organization_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Customer</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.customer_name || 'N/A'}</p>
                                    {ticket.customer_email && <p className="text-xs text-gray-500">{ticket.customer_email}</p>}
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Created</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{new Date(ticket.created_at).toLocaleString()}</p>
                                </div>
                                {localTicket.resolved_at && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase">Resolved</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{new Date(localTicket.resolved_at).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Activity Timeline */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Activity</h4>
                            {loading.ticketDetail && currentTicketActivities.length === 0 ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                            ) : currentTicketActivities.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No activity yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {currentTicketActivities.map((a) => (
                                        <div key={a.id} className="flex gap-2.5">
                                            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mt-1.5 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {activityLabel(a)}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(a.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── DSAR / Deletion Requests Section ─────────────────────────────────────────

const DSARSection = () => {
    const { deletionRequests, loading, fetchDeletionRequests, updateDeletionRequest } = useAdminStore();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [showNotesModal, setShowNotesModal] = useState<{ id: string; action: string } | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchDeletionRequests();
    }, [fetchDeletionRequests]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const handleAction = async (requestId: string, status: string, actionNotes?: string) => {
        setProcessingId(requestId);
        try {
            await updateDeletionRequest(requestId, status, actionNotes);
            toast.success(`Request ${status === 'completed' ? 'completed' : status === 'rejected' ? 'rejected' : 'updated'}`);
        } catch {
            toast.error('Failed to update request');
        } finally {
            setProcessingId(null);
            setShowNotesModal(null);
            setNotes('');
        }
    };

    const handleNotesSubmit = () => {
        if (showNotesModal) {
            handleAction(showNotesModal.id, showNotesModal.action, notes);
        }
    };

    const stats = useMemo(() => ({
        pending: deletionRequests.filter(r => r.status === 'pending').length,
        processing: deletionRequests.filter(r => r.status === 'processing').length,
        completed: deletionRequests.filter(r => r.status === 'completed').length,
        total: deletionRequests.length,
    }), [deletionRequests]);

    if (loading.deletionRequests && deletionRequests.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Data Subject Access Requests (DSAR)
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Under PIPEDA, GDPR, and CCPA, users can request deletion of their personal data.
                            Requests must be processed within 30 days of submission.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-yellow-100 dark:border-yellow-900/30 p-4">
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">Pending</span>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-blue-100 dark:border-blue-900/30 p-4">
                    <span className="text-sm text-blue-600 dark:text-blue-400">Processing</span>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.processing}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-green-100 dark:border-green-900/30 p-4">
                    <span className="text-sm text-green-600 dark:text-green-400">Completed</span>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.completed}</p>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Deletion Requests</h3>
                    <button
                        onClick={() => fetchDeletionRequests()}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-500 ${loading.deletionRequests ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Requested By</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Client</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Reason</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Requested</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {deletionRequests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No deletion requests yet.
                                </td>
                            </tr>
                        ) : (
                            deletionRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            req.request_type === 'customer_data_deletion' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            : req.request_type === 'dsar_access' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {req.request_type === 'customer_data_deletion' ? 'Client Data' : req.request_type === 'dsar_access' ? 'DSAR Access' : 'Account'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{req.user_name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{req.user_email}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {req.customer_name ? (
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{req.customer_name}</p>
                                                {req.customer_email && <p className="text-xs text-gray-500 dark:text-gray-400">{req.customer_email}</p>}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">N/A (account level)</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                                            {req.reason || 'No reason provided'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(req.requested_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {processingId === req.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-purple-600 ml-auto" />
                                        ) : (
                                            <div className="flex items-center justify-end gap-1">
                                                {req.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleAction(req.id, 'processing')}
                                                        className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                        title="Mark as Processing"
                                                    >
                                                        Process
                                                    </button>
                                                )}
                                                {(req.status === 'pending' || req.status === 'processing') && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(req.id, 'completed')}
                                                            className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                                            title="Mark as Completed"
                                                        >
                                                            Complete
                                                        </button>
                                                        <button
                                                            onClick={() => setShowNotesModal({ id: req.id, action: 'rejected' })}
                                                            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                            title="Reject with reason"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {(req.status === 'completed' || req.status === 'rejected') && (
                                                    <span className="text-xs text-gray-400 italic">
                                                        {req.processed_at ? new Date(req.processed_at).toLocaleDateString() : '—'}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Reject Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Reject Deletion Request
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Please provide a reason for rejecting this deletion request.
                        </p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Reason for rejection..."
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowNotesModal(null); setNotes(''); }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNotesSubmit}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
                            >
                                Reject Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
